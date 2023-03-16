import path from "path";

import { MongooseSchema } from "types/mongoose.js";
import { IVideoSchema } from "types/video.js";

export const getMediaPath = (
	video: MongooseSchema<IVideoSchema>,
	...paths: string[]
) => {
	const args = [process.cwd(), "media", `${video.slug}-${video.id}`].concat(
		paths
	);

	return path.resolve(...args);
};
