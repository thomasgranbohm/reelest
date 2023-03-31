use std::{
    fs::{self, File},
    io::Write,
    process::Command,
    thread,
};

use serde::Serialize;

use rocket::response::status::{self, Accepted};

#[macro_use]
extern crate rocket;

// (w, h, vb, ab)
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

fn get_resolution(source: &String) -> Result<String, String> {
    let resolution_output = Command::new("ffprobe")
        .arg("-v")
        .arg("error")
        .arg("-select_streams")
        .arg("v:0")
        .arg("-show_entries")
        .arg("stream=width,height")
        .arg("-of")
        .arg("csv=s=x:p=0")
        .arg(source)
        .output()
        .expect("Failed to get resolution");

    if !&resolution_output.status.success() {
        println!("Something went wrong transcoding with GPU.");

        return Err(String::from_utf8_lossy(&resolution_output.stderr).to_string());
    }

    let dirty = String::from_utf8_lossy(&resolution_output.stdout);

    Ok(dirty.trim().to_string())
}

fn get_fps(source: &String) -> Result<i32, ()> {
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

fn get_duration(source: &String) -> Result<f32, ()> {
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

fn transcode(source: &String, target: &String) -> bool {
    println!("{} -> {}", source, target);

    let resolution = get_resolution(&source).expect("Could not get resolution");
    let fps = get_fps(&source).expect("Could not get FPS");
    let duration = get_duration(&source).expect("Could not get duration");

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
        Err(_) => 1,
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

    let splits = RENDITIONS
        .iter()
        .enumerate()
        .reduce(|a, b| if b.1 .1 <= source_height { b } else { a })
        .unwrap()
        .0
        + 1;

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

    let mut prev_height = 0;

    let mut master_playlist: Vec<String> =
        vec![String::from("#EXTM3U"), String::from("#EXT-X-VERSION:3")];

    for i in 0..RENDITIONS.len() {
        let (width, height, video_bitrate, audio_bitrate) = RENDITIONS[i];
        if source_height < prev_height {
            break;
        }

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
            "#EXT-X-STREAM-INF:BANDWIDTH={},RESOLUTION={}",
            bandwidth,
            resolution.to_string()
        ));

        prev_height = height;
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
                .enumerate()
                .map(|(ri, _)| format!("v:{ri},a:{ri}").to_string())
                .collect::<Vec<String>>()
                .join(" ")
                .to_string()
        ),
        &format!("{target}/stream_%v/stream.m3u8"),
    ]);

    let mut playlist_file = File::create(format!("{}/playlist.m3u8", target)).unwrap();

    write!(playlist_file, "{}", master_playlist.join("\n").to_string()).unwrap();

    let gpu_output = gpu_rendering.output().expect("Could not render with GPU");

    if gpu_output.status.code().unwrap() == 1 {
        println!("Could not render with GPU");
        println!("{:?}", cpu_rendering);
        let cpu_output = cpu_rendering.output().unwrap();

        if cpu_output.status.code().unwrap() == 1 {
            println!("{}", String::from_utf8_lossy(&cpu_output.stderr));
            panic!("Could not render with CPU");
        } else {
            println!("{}", String::from_utf8_lossy(&cpu_output.stderr));
        }
    } else {
        println!("stderr: {}", String::from_utf8_lossy(&gpu_output.stderr));
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

    let resp = client
        .post("http://backend:1337/transcoder/update-status")
        .json(&body)
        .send()
        .unwrap();

    println!("{}", resp.text().unwrap());

    true
}

#[get("/?<input>&<output>")]
async fn get_id(input: String, output: String) -> Accepted<String> {
    thread::spawn(move || transcode(&String::from(input), &String::from(output)));

    status::Accepted::<String>(Some(String::from("OK")))
}

#[launch]
fn rocket() -> _ {
    rocket::build().mount("/", routes![get_id])
}
