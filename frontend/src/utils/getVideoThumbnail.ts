import { IVideo } from "types/video";

export default function getVideoThumbnail(
	{ id, thumbnails }: Pick<IVideo, "id" | "thumbnails">,
	size: 1280
) {
	const thumbnail = thumbnails.find((t) => t.width === size);

	if (!thumbnail) {
		throw new Error("Could not find thumbnail.");
	}

	return `/api${thumbnail.url}`;
}
