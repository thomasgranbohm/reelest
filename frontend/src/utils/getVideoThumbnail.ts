import { IVideo } from "types/video";

export default function getVideoThumbnail(
	{ id }: Pick<IVideo, "id">,
	size: 3840 | 2560 | 1920 | 1280 | 848 | 640 | 426
) {
	return `/api/videos/${id}/thumbnails/thumbnail-${size}.webp`;
}
