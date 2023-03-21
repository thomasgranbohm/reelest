import { Video, VideoStatus } from "@prisma/client";
import fs from "fs/promises";

import prisma from "database/client.js";

import {
	getThumbnailPath,
	getVideoMediaPath,
	getWebsitePath,
	stripFileSystemPath,
} from "lib/paths.js";

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

	const destDir = getVideoMediaPath(video);

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
	const thumbnailsDir = getThumbnailPath(video);

	try {
		await fs.stat(thumbnailsDir);

		await fs.rm(thumbnailsDir, { force: true, recursive: true });
	} catch (error) {
		//
	}

	await fs.mkdir(thumbnailsDir);

	const thumbnails = await generateAppropriateThumbnails(
		file.path,
		thumbnailsDir
	);

	await fs.rm(file.path);

	await prisma.thumbnail.deleteMany({
		where: { videoId: video.id },
	});

	await prisma.video.update({
		data: {
			thumbnails: {
				createMany: {
					data: thumbnails.map((thumbnail) =>
						thumbnail.type === "WEBP"
							? {
									...thumbnail,
									url: getWebsitePath(
										thumbnail.url,
										"videos"
									),
									// eslint-disable-next-line no-mixed-spaces-and-tabs
							  }
							: thumbnail
					),
				},
			},
		},
		where: { id: video.id },
	});

	return true;
}
