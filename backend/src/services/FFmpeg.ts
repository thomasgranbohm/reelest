import { ImageType } from "@prisma/client";
import child_process from "child_process";
import ffmpegPath from "ffmpeg-static";
import ffmpeg, { FfprobeData } from "fluent-ffmpeg";
import path from "path";
import sharp, { ResizeOptions } from "sharp";
import util from "util";

import config from "../config";
import { Dimension, Thumbnail } from "../types/thumbnail";
import { Quality } from "../types/video";

ffmpeg.setFfmpegPath(ffmpegPath);

interface Option extends Dimension, Omit<ResizeOptions, "width" | "height"> {}

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
				}out] -c:v:${i} libx264 -x264-params "nal-hrd=cbr:force-cfr=1" -b:v:${i} ${bitrate}K -maxrate:v:${i} ${bitrate}K -minrate:v:${i} ${bitrate}K -bufsize:v:${i} ${bitrate}K -preset slow -g 48 -sc_threshold 0 -keyint_min 48`
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

export const generateThumbnail = (source: string, option: Option) => {
	return sharp(source).resize({ fit: "contain", ...option });
};

export const generateBase64Thumbnail = async (
	source: string,
	option: Option
): Promise<Thumbnail> => {
	const buffer = await generateThumbnail(source, option).jpeg().toBuffer();

	const { height, width } = option;

	return {
		height,
		type: ImageType.BASE64,
		url: "data:image/jpeg;base64," + Buffer.from(buffer).toString("base64"),
		width,
	};
};

export const generateWebPThumbnail = async (
	source: string,
	option: Option,
	destination: string
): Promise<Thumbnail> => {
	await generateThumbnail(source, option).webp().toFile(destination);

	const { height, width } = option;

	return {
		height,
		type: "WEBP",
		url: destination,
		width,
	};
};

export const generateVideoThumbnails = async (
	source: string,
	destination: string
) => {
	const applicableFormats = config.ffmpeg.thumbnails.slice();

	const thumbnails = await Promise.all(
		applicableFormats.map(({ type, ...dimension }) =>
			type === ImageType.WEBP
				? generateWebPThumbnail(
						source,
						dimension,
						path.resolve(
							destination,
							`thumbnail-${dimension.width}p.webp`
						)
						// eslint-disable-next-line no-mixed-spaces-and-tabs
				  )
				: generateBase64Thumbnail(source, dimension)
		)
	);

	return thumbnails;
};

export const generateProfilePictures = async (
	source: string,
	destination: string
) => {
	const pictures = await Promise.all(
		Object.values(config.ffmpeg.profiles).map(({ size, type }) => {
			const dimension = { height: size, width: size };

			if (type === ImageType.WEBP) {
				return generateWebPThumbnail(
					source,
					{ ...dimension, fit: "cover" },
					path.resolve(destination, `profile-${size}p.webp`)
				);
			}

			return generateBase64Thumbnail(source, dimension);
		})
	);

	return pictures;
};
