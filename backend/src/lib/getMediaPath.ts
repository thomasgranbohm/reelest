import { Video } from "@prisma/client";
import path from "path";

function getMediaPath(video: Pick<Video, "id">, ...paths: string[]) {
	return path.resolve(process.cwd(), "media", video.id, ...paths);
}

export default getMediaPath;
