import { Router } from "express";
import Joi from "joi";

import Authentication from "middlewares/Authentication.js";
import Pagination from "middlewares/Pagination.js";

import UserModel from "models/User.model.js";
import VideoModel from "models/Video.model.js";

import { decodeToken } from "services/JWT.js";

import { VideoCreationBody, VideoStatus } from "types/video.js";

const VideoRouter = Router();

VideoRouter.get("/", Pagination, async (req, res) => {
	const [videos, count] = await Promise.all([
		VideoModel.find(
			{ status: VideoStatus.Published },
			{},
			{ limit: req.pagination.limit, skip: req.pagination.offset }
		),
		VideoModel.count({ status: VideoStatus.Published }),
	]);

	res.send({
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
	const { value, error } = Joi.object<VideoCreationBody>({
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

	const user = await UserModel.findById(token._id);

	const video = await new VideoModel({
		user: { _id: user._id },
		...value,
	}).save();

	return res.send({ data: { video: video.toObject() } });
});

export default VideoRouter;
