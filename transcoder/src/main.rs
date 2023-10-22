use std::{
    env,
    fs::{self, File},
    io::Write,
    path::Path,
    process::Command,
    thread,
};

use serde::Serialize;

use rocket::response::status::{self, Accepted};

#[macro_use]
extern crate rocket;

// (Width, Height, Video Bitrate, Audio Bitrate)
const RENDITIONS: [(i32, i32, i32, i32); 7] = [
    (426, 240, 700, 128),
    (640, 360, 1000, 192),
    (842, 480, 1400, 256),
    (1280, 720, 2800, 256),
    (1920, 1080, 5000, 384),
    (2560, 1440, 12000, 384),
    (3840, 2160, 30000, 512),
];
const SEGMENT_TIME: i32 = 2;
const MAX_BITRATE_RATIO: f32 = 1.07;
const RATE_MONITOR_BUFFER_RATIO: f32 = 1.5;

#[derive(Serialize)]
struct JsonBody {
    id: String,
    status: String,
    duration: f32,
}

fn get_resolution(source: &str) -> Result<String, String> {
    let mut resolution_command = Command::new("ffprobe");

    resolution_command
        .arg("-v")
        .arg("error")
        .arg("-select_streams")
        .arg("v:0")
        .arg("-show_entries")
        .arg("stream=width,height")
        .arg("-of")
        .arg("csv=s=x:p=0")
        .arg("-i")
        .arg(source);

    let resolution_output = resolution_command
        .output()
        .expect("Failed to get resolution");

    if !&resolution_output.status.success() {
        println!("Something went wrong transcoding with GPU.");

        Err(String::from_utf8_lossy(&resolution_output.stderr).to_string())
    } else {
        Ok(String::from_utf8_lossy(&resolution_output.stdout)
            .trim()
            .to_string())
    }
}

fn get_fps(source: &str) -> Result<i32, ()> {
    let fps_output = Command::new("ffprobe")
        .args([
            "-v",
            "error",
            "-select_streams",
            "v:0",
            "-show_entries",
            "stream=r_frame_rate",
            "-of",
            "csv=s=x:p=0",
            source,
        ])
        .output()
        .expect("Failed to get fps");

    if !&fps_output.status.success() {
        println!("Something went wrong transcoding with GPU.");

        return Err(());
    }

    let fps = String::from_utf8_lossy(&fps_output.stdout)
        .split("/")
        .collect::<Vec<&str>>()[0]
        .parse::<i32>()
        .unwrap();

    Ok(fps)
}

fn get_duration(source: &str) -> Result<f32, ()> {
    let command = Command::new("ffprobe")
        .args([
            "-v",
            "error",
            "-select_streams",
            "v:0",
            "-show_entries",
            "stream=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            source,
        ])
        .output()
        .expect("Could not execute duration command.");

    if !&command.status.success() {
        println!("Something went wrong transcoding with GPU.");

        return Err(());
    }

    Ok(String::from_utf8_lossy(&command.stdout)
        .trim()
        .parse::<f32>()
        .unwrap())
}

fn transcode(input: &String, output: &String) -> bool {
    let source_path = Path::new(&env::var("UPLOAD_DIR").unwrap())
        .join("videos")
        .join(input);
    let source = source_path.to_str().expect("Could not get source path");

    let target_path = Path::new(&env::var("MEDIA_DIR").unwrap())
        .join("videos")
        .join(output);
    let target = target_path.to_str().expect("Could not get path");

    println!("{} -> {}", source, target);

    let resolution = get_resolution(source).expect("Could not get resolution");
    let fps = get_fps(source).expect("Could not get FPS");
    let duration = get_duration(source).expect("Could not get duration");

    let dimensions: Vec<i32> = resolution
        .to_string()
        .split("x")
        .map(|x| x.parse::<i32>().unwrap())
        .take(2)
        .collect();

    let source_width = dimensions[0];
    let source_height = dimensions[1];

    let keyframes_interval = fps * 2;

    match fs::create_dir(target) {
        Ok(_) => 0,
        Err(err) => {
            println!("{}", err);
            panic!("Could not create directory {}", target)
        }
    };

    let mut gpu_rendering = Command::new("ffmpeg");
    gpu_rendering.args([
        "-hide_banner",
        "-y",
        "-hwaccel",
        "cuvid",
        "-hwaccel_output_format",
        "cuda",
        "-vsync",
        "0",
        "-i",
        &source.to_string(),
    ]);

    let mut cpu_rendering = Command::new("ffmpeg");
    cpu_rendering.args(["-hide_banner", "-y", "-i", &source.to_string()]);

    let biggest = RENDITIONS
        .iter()
        .enumerate()
        .reduce(|a, b| if b.1 .1 <= source_height { b } else { a })
        .unwrap();

    let splits = biggest.0 + 1;

    cpu_rendering.args([
        "-filter_complex",
        &format!(
            "[0:v]split={splits}{}; {}",
            vec![0; splits]
                .iter()
                .enumerate()
                .map(|(ai, _)| format!("[v{}]", ai + 1))
                .collect::<Vec<String>>()
                .join(""),
            RENDITIONS
                .iter()
                .enumerate()
                .take(splits)
                .map(|(ai, (w, h, _, __))| format!(
                    "[v{}]scale=w={w}:h={h}[v{}out]",
                    ai + 1,
                    ai + 1
                ))
                .collect::<Vec<String>>()
                .join("; ")
        ),
    ]);

    let mut master_playlist: Vec<String> =
        vec![String::from("#EXTM3U"), String::from("#EXT-X-VERSION:3")];

    for i in 0..splits {
        let (width, height, video_bitrate, audio_bitrate) = RENDITIONS[i];

        let max_rate = video_bitrate as f32 * MAX_BITRATE_RATIO;
        let bufsize = video_bitrate as f32 * RATE_MONITOR_BUFFER_RATIO;
        let bandwidth = video_bitrate * 1000;

        let name = format!("{}p", height);

        let scale_npp = if (width / source_width) * source_height > height {
            format!("w=-2:h={}", height)
        } else {
            format!("w={}:h=-2", width)
        };

        gpu_rendering.args([
            "-c:a",
            "aac",
            "-ar",
            "48000",
            "-c:v",
            "h264_nvenc",
            "-rc:v",
            "vbr_hq",
            "-cq:v",
            "19",
            "-profile:v",
            "main",
            "-sc_threshold",
            "0",
            "-hls_playlist_type",
            "vod",
            "-g",
            &keyframes_interval.to_string(),
            "-keyint_min",
            &keyframes_interval.to_string(),
            "-hls_time",
            &SEGMENT_TIME.to_string(),
            "-vf",
            &format!("hwupload_cuda,scale_npp={}", scale_npp),
            "-b:v",
            &video_bitrate.to_string(),
            "-maxrate",
            &format!("{}k", max_rate.round()),
            "-bufsize",
            &format!("{}k", bufsize.round()),
            "-b:a",
            &format!("{}k", audio_bitrate),
            "-hls_segment_filename",
            &format!("{target}/{name}_%03d.ts"),
            &format!("{target}/{name}.m3u8"),
        ]);

        cpu_rendering.args([
            "-map",
            &format!("[v{}out]", i + 1),
            &format!("-c:v:{i}"),
            "libx264",
            "-x264-params",
            "nal-hrd=cbr:force-cfr=1",
            &format!("-b:v:{i}"),
            &format!("{}k", video_bitrate),
            &format!("-maxrate:v:{i}"),
            &format!("{}k", video_bitrate),
            &format!("-minrate:v:{i}"),
            &format!("{}k", video_bitrate),
            &format!("-bufsize:v:{i}"),
            &format!("{}k", bufsize.round()),
            "-preset",
            "slow",
            "-g",
            &keyframes_interval.to_string(),
            "-keyint_min",
            &keyframes_interval.to_string(),
            "-sc_threshold",
            "0",
            "-map",
            "a:0",
            &format!("-c:a:{i}"),
            "aac",
            &format!("-b:a:{i}"),
            &format!("{}k", audio_bitrate),
            "-ac",
            "2",
        ]);

        master_playlist.push(format!(
            "#EXT-X-STREAM-INF:BANDWIDTH={bandwidth},RESOLUTION={width}x{height}"
        ));
    }

    cpu_rendering.args([
        "-f",
        "hls",
        "-hls_time",
        "2",
        "-hls_playlist_type",
        "vod",
        "-hls_flags",
        "independent_segments",
        "-hls_segment_type",
        "mpegts",
        "-hls_segment_filename",
        &format!("{target}/stream_%v/data%02d.ts"),
        "-var_stream_map",
        &format!(
            "{}",
            &RENDITIONS
                .iter()
                .take(splits)
                .enumerate()
                .map(|(ri, _)| format!("v:{ri},a:{ri}").to_string())
                .collect::<Vec<String>>()
                .join(" ")
                .to_string()
        ),
        &format!("{target}/stream_%v/stream.m3u8"),
    ]);

    println!("{:?}", cpu_rendering);

    let mut playlist_file = File::create(format!("{}/playlist.m3u8", target)).unwrap();

    write!(playlist_file, "{}", master_playlist.join("\n").to_string()).unwrap();

    let gpu_output = gpu_rendering.output().expect("Could not render with GPU");

    if gpu_output.status.code().unwrap() == 1 {
        println!("Could not render with GPU. Using CPU");
        let cpu_output = cpu_rendering.output().unwrap();

        if cpu_output.status.code().unwrap() == 1 {
            println!("{}", String::from_utf8_lossy(&cpu_output.stderr));
            panic!("Could not render with CPU");
        }
    }

    let body = JsonBody {
        duration: duration,
        id: target
            .split("/")
            .collect::<Vec<&str>>()
            .pop()
            .unwrap()
            .to_string(),
        status: String::from("CREATED"),
    };

    let client = reqwest::blocking::Client::new();

    client
        .post("http://backend:1337/transcoder/update-status")
        .header(
            "X-Transcoder-Secret",
            env::var("TRANSCODER_SECRET").unwrap(),
        )
        .json(&body)
        .send()
        .expect("Could not request backend");

    println!("Updated video");

    true
}

#[get("/?<input>&<output>")]
async fn get_id(input: String, output: String) -> Accepted<String> {
    thread::spawn(move || transcode(&String::from(input), &String::from(output)));

    status::Accepted::<String>(Some(String::from("OK")))
}

#[launch]
fn rocket() -> _ {
    let videos_media_path = Path::new(&env::var("MEDIA_DIR").unwrap()).join("videos");

    match fs::read_dir(&videos_media_path) {
        Ok(_) => 0,
        Err(_) => match fs::create_dir(&videos_media_path) {
            Ok(_) => 0,
            Err(err) => {
                panic!("{}", err);
            }
        },
    };

    rocket::build().mount("/", routes![get_id])
}
