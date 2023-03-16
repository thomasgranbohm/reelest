import mongoose, { Schema } from "mongoose";
import { nanoid } from "nanoid";
import slugify from "slugify";

import { IVideoSchema, VideoStatus } from "types/video.js";

export const VideoSchema = new Schema<IVideoSchema>(
	{
		id: {
			type: "string",
		},
		description: {
			type: "string",
		},
		title: {
			type: "string",
			required: true,
			min: 2,
			max: 64,
		},
		slug: {
			type: "string",
			trim: true,
			match: /^[a-zA-Z0-9-]$/,
		},
		user: {
			type: Schema.Types.ObjectId,
			ref: "User",
		},
		status: {
			type: "string",
			enum: ["published", "processing", "created"],
			default: VideoStatus.Processing,
		},
	},
	{ timestamps: true }
);

VideoSchema.pre("save", function (next) {
	this.slug = slugify(this.title, {
		locale: "sv",
		lower: true,
		remove: /[^a-zA-Z0-9-]/g,
		strict: true,
		trim: true,
	});

	this.id = nanoid(10);

	next();
});

const VideoModel = mongoose.model("Video", VideoSchema);

export default VideoModel;
