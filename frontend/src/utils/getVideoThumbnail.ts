import { IVideo } from "types/video";

export default function getVideoThumbnail(
	{ id, thumbnails }: Pick<IVideo, "id" | "thumbnails">,
	size: 3840 | 2560 | 1920 | 1280 | 848 | 640 | 426
) {
	const thumbnail = thumbnails.find((t) => t.width === size);

	if (!thumbnail) {
		throw new Error("No thumbnail found");
	}

	return `/api${thumbnail.url}`;
}
