import { Video } from "@prisma/client";
import path from "path";

function getMediaPath(video: Pick<Video, "id" | "slug">, ...paths: string[]) {
	return path.resolve(
		process.cwd(),
		"media",
		`${video.slug}-${video.id}`,
		...paths
	);
}

export default getMediaPath;
