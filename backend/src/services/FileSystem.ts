import { Video, VideoStatus } from "@prisma/client";
import fs from "fs/promises";

import prisma from "database/client.js";

import getMediaPath from "lib/getMediaPath.js";

import {
	generateAppropriateThumbnails,
	generateStreamFiles,
} from "services/FFmpeg.js";

export async function handleVideoUpload(
	video: Pick<Video, "status" | "id">,
	file: Express.Multer.File
): Promise<boolean> {
	if (video.status !== VideoStatus.PROCESSING) {
		return false;
	}

	const destDir = getMediaPath(video);

	// Create destination dir
	await fs.mkdir(destDir);

	await generateStreamFiles(file.path, destDir);

	await fs.rm(file.path);

	await prisma.video.update({
		data: { status: "CREATED" },
		where: { id: video.id },
	});

	return true;
}

export async function handleThumbnailUpload(
	video: Pick<Video, "status" | "id">,
	file: Express.Multer.File
): Promise<boolean> {
	const destDir = getMediaPath(video, "thumbnails");

	try {
		await fs.stat(destDir);
	} catch (error) {
		await fs.mkdir(destDir);
	}

	const base64 = await generateAppropriateThumbnails(file.path, destDir);

	await fs.rm(file.path);

	await prisma.video.update({
		data: { thumbnail: Buffer.from(base64.buffer).toString("base64") },
		where: { id: video.id },
	});

	return true;
}
