import { User, Video, VideoStatus } from "@prisma/client";
import fs from "fs/promises";

import prisma from "../database/client";
import {
	getProfilePicturePath,
	getVideoMediaPath,
	getVideoThumbnailPath,
	getWebsitePath,
} from "../lib/paths";
import {
	generateProfilePictures,
	generateStreamFiles,
	generateVideoThumbnails,
} from "../services/FFmpeg";

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

export async function handleVideoThumbnailUpload(
	video: Pick<Video, "status" | "id">,
	file: Express.Multer.File
): Promise<boolean> {
	const thumbnailsDir = getVideoThumbnailPath(video);

	try {
		await fs.stat(thumbnailsDir);

		await fs.rm(thumbnailsDir, { force: true, recursive: true });
	} catch (error) {
		//
	}

	await fs.mkdir(thumbnailsDir);
	const thumbnails = await generateVideoThumbnails(file.path, thumbnailsDir);
	await fs.rm(file.path);

	await prisma.thumbnail.deleteMany({
		where: { videoId: video.id },
	});

	await prisma.video.update({
		data: {
			thumbnails: {
				createMany: {
					data: thumbnails.map((thumbnail) => ({
						...thumbnail,
						url:
							thumbnail.type === "WEBP"
								? getWebsitePath(thumbnail.url, "users")
								: thumbnail.url,
					})),
				},
			},
		},
		where: { id: video.id },
	});

	return true;
}

export async function handleProfilePictureUpload(
	user: Pick<User, "id" | "username">,
	file: Express.Multer.File
): Promise<boolean> {
	const thumbnailsDir = getProfilePicturePath(user);

	try {
		await fs.stat(thumbnailsDir);
	} catch (error) {
		await fs.mkdir(thumbnailsDir);
	}

	await prisma.profilePicture.deleteMany({
		where: { userId: user.id },
	});

	const thumbnails = await generateProfilePictures(file.path, thumbnailsDir);
	await fs.rm(file.path);

	await prisma.user.update({
		data: {
			profilePictures: {
				createMany: {
					data: thumbnails.map((thumbnail) => ({
						...thumbnail,
						url:
							thumbnail.type === "WEBP"
								? getWebsitePath(thumbnail.url, "users")
								: thumbnail.url,
					})),
				},
			},
		},
		where: { id: user.id },
	});

	return true;
}
