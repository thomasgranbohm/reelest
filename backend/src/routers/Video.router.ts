import { Router } from "express";
import Joi from "joi";

import Authentication from "middlewares/Authentication.js";
import Pagination from "middlewares/Pagination.js";

import VideoModel from "models/Video.model.js";

import { decodeToken } from "services/JWT.js";

import { VideoCreateBody, VideoStatus, VideoUpdateBody } from "types/video.js";

const VideoRouter = Router();

VideoRouter.get("/", Pagination, async (req, res) => {
	const [videos, count] = await Promise.all([
		VideoModel.find(
			{ status: VideoStatus.Published },
			{},
			{
				limit: req.pagination.limit,
				skip: req.pagination.offset,
				sort: { updatedAt: "desc" },
			}
		),
		VideoModel.count({ status: VideoStatus.Published }),
	]);

	return res.send({
		data: videos,
		pagination: {
			total: count,
			offset: req.pagination.offset + req.pagination.limit,
		},
	});
});

VideoRouter.get("/:id/:slug", async (req, res) => {
	const { id, slug } = req.params;

	const video = await VideoModel.findOne({
		id,
		slug,
		status: VideoStatus.Published,
	});

	if (video === null) {
		return res.status(404).send({ error: { message: "Not found" } });
	}

	return res.send({ data: { video: video.toObject() } });
});

VideoRouter.post("/", Authentication, async (req, res) => {
	const { value, error } = Joi.object<VideoCreateBody>({
		description: Joi.string(),
		title: Joi.string().min(2).max(64).required(),
	}).validate(req.body);

	if (error) {
		return res.status(400).send({
			error: {
				message: "Malformed body",
				stack: error,
			},
		});
	}

	const token = await decodeToken(req.auth.token);

	const video = await new VideoModel({
		user: { _id: token._id },
		...value,
	}).save();

	return res.send({ data: { video: video.toObject() } });
});

VideoRouter.put("/:id/:slug", Authentication, async (req, res) => {
	const { value, error } = Joi.object<VideoUpdateBody>({
		description: Joi.string(),
		title: Joi.string().min(2).max(64),
		slug: Joi.string()
			.trim()
			.min(2)
			.max(64)
			.regex(/^[a-zA-Z0-9-]$/),
	}).validate(req.body);

	if (error) {
		return res.status(400).send({
			error: {
				message: "Malformed body",
				stack: error,
			},
		});
	}

	const { id, slug } = req.params;

	const token = await decodeToken(req.auth.token);

	const video = await VideoModel.updateOne(
		{
			id,
			slug,
			user: { _id: token._id },
		},
		value
	);

	return res.send({ data: { video } });
});

VideoRouter.delete("/:id/:slug", Authentication, async (req, res) => {
	const { id, slug } = req.params;

	const token = await decodeToken(req.auth.token);

	const video = await VideoModel.findOne({
		id,
		slug,
		user: { _id: token._id },
	});

	if (video === null) {
		return res.status(403).send({ error: { message: "Unauthorized" } });
	}

	await video.deleteOne();

	return res.status(200).send({ data: { message: "Deleted video" } });
});

export default VideoRouter;
