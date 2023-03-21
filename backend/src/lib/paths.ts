import { Prisma, Video } from "@prisma/client";
import path from "path";

import config from "config.js";

import { Thumbnail } from "types/thumbnail";

export const getFileSystemPath = (...paths: string[]) => {
	return path.resolve(config.media.path, ...paths);
};

export const stripFileSystemPath = (path: string, replacement?: string) => {
	return path.replace(config.media.path, replacement ?? "");
};

export const getWebsitePath = (url: string, replacement?: string) => {
	return new URL(
		stripFileSystemPath(url, replacement),
		new URL(
			`${config.express.proto}://${config.express.host}${
				config.express.port && `:${config.express.port}`
			}`
		)
	).pathname;
};

export const getVideoMediaPath = (
	video: Pick<Video, "id">,
	...paths: string[]
) => {
	return getFileSystemPath(video.id, ...paths);
};

export const getThumbnailPath = (
	video: Pick<Video, "id">,
	thumbnail?: string
) => {
	return getVideoMediaPath(video, "thumbnails", thumbnail || "");
};
