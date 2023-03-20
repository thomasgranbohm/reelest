import child_process from "child_process";
import ffmpegPath from "ffmpeg-static";
import ffmpeg, { FfprobeData } from "fluent-ffmpeg";
import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import util from "util";

import config from "config.js";

ffmpeg.setFfmpegPath(ffmpegPath);

type Quality = {
	bitrate: number;
	height: number;
};

export const generateStreamFiles = async (
	source: string,
	destination: string
) => {
	const { streams } = await new Promise<FfprobeData>((res) => {
		ffmpeg.ffprobe(source, (_, data) => {
			res(data);
		});
	});

	const largestStream = streams.reduce((chosenStream, stream) => {
		if (stream.codec_type !== "video") {
			return chosenStream;
		}

		if (!chosenStream) {
			return stream;
		}

		return stream.height > chosenStream.height ? stream : chosenStream;
	});

	const widthMultiplier = largestStream.width / largestStream.height;

	const resolutions = config.ffmpeg.qualities
		.slice()
		.reduce<Quality[]>(
			(p, c) => (largestStream.height >= c.height ? [...p, c] : p),
			[]
		);

	const filter_complex = `[0:v]split=${resolutions.length}${resolutions
		.map((_, i) => `[v${i + 1}]`)
		.join("")}; ${resolutions
		.map(({ height }, i) => {
			const width = Math.floor(height * widthMultiplier);
			return `[v${i + 1}]scale=w=${
				width % 2 === 1 ? width + 1 : width
			}:h=${height}[v${i + 1}out]`;
		})
		.join("; ")}`;

	const video_maps = resolutions
		.map(
			({ bitrate }, i) =>
				`-map [v${
					i + 1
				}out] -c:v:${i} libx264 -x264-params "nal-hrd=cbr:force-cfr=1" -b:v:0 ${bitrate}K -maxrate:v:0 ${bitrate}K -minrate:v:0 ${bitrate}K -bufsize:v:0 ${bitrate}K -preset slow -g 48 -sc_threshold 0 -keyint_min 48`
		)
		.join(" ");

	const audio_maps = resolutions
		.map(
			({ height }, i) =>
				`-map a:0 -c:a:${i} aac -b:a:${i} ${height / 7.5}k -ac 2`
		)
		.join(" ");

	const var_stream_maps = resolutions
		.map((_, i) => `v:${i},a:${i}`)
		.join(" ");

	const command = util.format(
		'%s -i %s -filter_complex "%s" %s %s -f hls -hls_time 2 -hls_playlist_type vod -hls_flags independent_segments -hls_segment_type mpegts -hls_segment_filename %s/stream_%%v/data%%02d.ts -master_pl_name master.m3u8 -var_stream_map "%s" %s/stream_%%v/stream.m3u8',
		ffmpegPath,
		source,
		filter_complex,
		video_maps,
		audio_maps,
		destination,
		var_stream_maps,
		destination
	);

	const timeLogLabel = `${destination} generation`;
	console.time(timeLogLabel);
	console.debug(command);
	await new Promise((res, rej) =>
		child_process.exec(command, (err, _, stderr) => {
			if (err) {
				console.error("Error while generating stream: %s", stderr);
				return rej(err);
			}
			res(true);
		})
	);
	console.timeEnd(timeLogLabel);

	return true;
};

export const generateAppropriateThumbnails = async (
	source: string,
	destination: string
) => {
	const applicableQualities = config.ffmpeg.qualities.slice(); // TODO: calculate.

	await Promise.all([
		sharp(source)
			.resize(32, 18, { fit: "contain" })
			.jpeg()
			.toBuffer((_, buffer) =>
				fs.writeFile(
					path.resolve(destination, "thumbnail.b64"),
					Buffer.from(buffer).toString("base64")
				)
			),
		...applicableQualities.map(({ height, width }) =>
			sharp(source)
				.resize(width, height, { fit: "contain" })
				.webp()
				.toFile(path.resolve(destination, `thumbnail-${width}.webp`))
		),
	]);

	return true;
};
