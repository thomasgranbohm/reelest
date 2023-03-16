import fs from "fs/promises";
import { getMediaPath } from "helpers/Video.helper.js";

import VideoModel from "models/Video.model.js";

import { generateStreamFiles } from "services/FFmpeg.js";

import { MongooseSchema } from "types/mongoose.js";
import { IVideoSchema, VideoStatus } from "types/video.js";

export async function handleVideoUpload(video: MongooseSchema<IVideoSchema>) {
	if (video.status !== VideoStatus.Processing) {
		return null;
	}

	const destDir = getMediaPath(video);

	// Create destination dir
	await fs.mkdir(destDir);

	await generateStreamFiles(
		video.mediaPath,
		getMediaPath(video, "index.m3u8")
	);

	await fs.rm(video.mediaPath);

	await VideoModel.updateOne(
		{ id: video.id, slug: video.slug },
		{
			mediaPath: destDir,
			status: VideoStatus.Published,
		}
	);
}
