import mongoose, { Model, Schema } from "mongoose";
import { nanoid } from "nanoid";
import path from "path";
import slugify from "slugify";

import { handleVideoUpload } from "services/FileSystem.js";

import { IVideoMethods, IVideoSchema, VideoStatus } from "types/video.js";

export const VideoSchema = new Schema<
	IVideoSchema,
	Model<IVideoSchema, Record<string, never>, IVideoMethods>,
	IVideoMethods
>(
	{
		description: {
			type: "string",
		},
		id: {
			type: "string",
		},
		mediaPath: {
			type: "string",
		},
		slug: {
			match: /^[a-zA-Z0-9-]$/,
			trim: true,
			type: "string",
		},
		status: {
			default: VideoStatus.Processing,
			enum: ["published", "processing", "created"],
			required: true,
			type: "string",
		},
		title: {
			max: 64,
			min: 2,
			required: true,
			type: "string",
		},
		user: {
			ref: "User",
			type: Schema.Types.ObjectId,
		},
	},
	{
		timestamps: true,
	}
);

VideoSchema.method("getMediaPath", function (...paths: string[]) {
	return path.resolve(
		process.cwd(),
		"media",
		`${this.slug}-${this.id}`,
		...paths
	);
});

VideoSchema.pre("save", function (next) {
	this.slug = slugify(this.title, {
		locale: "sv",
		lower: true,
		remove: /[^a-zA-Z0-9\s]/g,
		strict: true,
		trim: true,
	});

	this.id = nanoid(10);

	next();
});

VideoSchema.post("save", function () {
	handleVideoUpload(this);
});

const VideoModel = mongoose.model("Video", VideoSchema);

export default VideoModel;
