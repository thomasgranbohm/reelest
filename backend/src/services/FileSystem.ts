import fs from "fs/promises";
import { Document, Types } from "mongoose";
import { resolve } from "path";

import VideoModel from "models/Video.model.js";

import { generateStreamFiles } from "services/FFmpeg.js";

import { IVideoSchema, VideoStatus } from "types/video.js";

export async function handleVideoUpload(
	video: Document<unknown, unknown, IVideoSchema> &
		Omit<
			IVideoSchema & {
				_id: Types.ObjectId;
			},
			never
		>
) {
	if (video.status !== VideoStatus.Processing) {
		return null;
	}

	const destDir = resolve(
		process.cwd(),
		"media",
		`${video.slug}-${video.id}`
	);

	// Create destination dir
	await fs.mkdir(destDir);

	await generateStreamFiles(video.mediaPath, resolve(destDir, "index.m3u8"));

	await fs.rm(video.mediaPath);

	await VideoModel.updateOne(
		{ id: video.id, slug: video.slug },
		{
			mediaPath: destDir,
			status: VideoStatus.Published,
		}
	);
}
