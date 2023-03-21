import { IVideo } from "types/video";

export default function getVideoThumbnail(
	{ id, thumbnails }: Pick<IVideo, "id" | "thumbnails">,
	size: 1280
) {
	const thumbnail = thumbnails.find((t) => t.width === size);

	if (!thumbnail) {
		return null;
	}

	return `/api${thumbnail.url}`;
}
