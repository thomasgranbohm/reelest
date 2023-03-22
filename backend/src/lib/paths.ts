import { User, Video } from "@prisma/client";
import path from "path";

import config from "../config";

export const getFileSystemPath = (...paths: string[]) => {
	return path.join(config.media.dir, ...paths);
};

export const stripFileSystemPath = (path: string, replacement?: string) => {
	return path.replace(config.media.dir, replacement ?? "");
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
	return getFileSystemPath(config.media.videos_dir, video.id, ...paths);
};

export const getUserMediaPath = (
	user: Pick<User, "username">,
	...paths: string[]
) => {
	return getFileSystemPath(config.media.users_dir, user.username, ...paths);
};

export const getVideoThumbnailPath = (
	video: Pick<Video, "id">,
	version?: string
) => {
	return getVideoMediaPath(video, "thumbnails", version || "");
};

export const getProfilePicturePath = (
	user: Pick<User, "username">,
	version?: string
) => {
	return getUserMediaPath(user, version || "");
};
