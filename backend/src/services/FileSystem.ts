import { Video, VideoStatus } from "@prisma/client";
import fs from "fs/promises";

import prisma from "database/client.js";

import getMediaPath from "lib/getMediaPath.js";

import { generateStreamFiles } from "services/FFmpeg.js";

export async function handleVideoUpload(
	video: Pick<Video, "status" | "id">,
	file: Express.Multer.File
): Promise<boolean> {
	if (video.status !== VideoStatus.PUBLISHED) {
		return false;
	}

	const destDir = getMediaPath(video);

	// Create destination dir
	await fs.mkdir(destDir);

	await generateStreamFiles(file.path, destDir);

	await fs.rm(file.path);

	await prisma.video.update({
		data: { status: "PUBLISHED" },
		where: { id: video.id },
	});

	return true;
}
