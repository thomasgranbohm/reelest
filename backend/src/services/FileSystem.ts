import fs from "fs/promises";
import { HydratedDocumentFromSchema } from "mongoose";

import VideoModel, { VideoSchema } from "models/Video.model.js";

import { generateStreamFiles } from "services/FFmpeg.js";

import { VideoStatus } from "types/video.js";

export async function handleVideoUpload(
	video: HydratedDocumentFromSchema<typeof VideoSchema>
): Promise<boolean> {
	if (video.status !== VideoStatus.Processing) {
		return false;
	}

	const destDir = video.getMediaPath();

	// Create destination dir
	await fs.mkdir(destDir);

	await generateStreamFiles(video.mediaPath, destDir);

	await fs.rm(video.mediaPath);

	await VideoModel.updateOne(
		{ id: video.id, slug: video.slug },
		{
			mediaPath: destDir,
			status: VideoStatus.Published,
		}
	);

	return true;
}
