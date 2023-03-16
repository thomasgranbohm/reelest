import { Router } from "express";
import fs from "fs/promises";
import { getMediaPath } from "helpers/Video.helper.js";
import Joi from "joi";
import path from "path";

import Authentication from "middlewares/Authentication.js";
import Pagination from "middlewares/Pagination.js";
import { VideoUpload } from "middlewares/Upload.js";

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
				populate: {
					path: "user",
					select: "username -_id",
				},
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

	const video = await VideoModel.findOne(
		{
			id,
			slug,
			status: VideoStatus.Published,
		},
		{},
		{
			populate: {
				path: "user",
				select: "username -_id",
			},
		}
	);

	if (video === null) {
		return res.status(404).send({ error: { message: "Not found" } });
	}

	const { title, status, user } = video;

	return res.send({ data: { video: { title, id, slug, status, user } } });
});

VideoRouter.get(
	"/:id/:slug/stream/:stream(index.m3u8|index[0-9]+.ts)",
	async (req, res) => {
		const { id, slug, stream } = req.params;

		const video = await VideoModel.findOne({
			id,
			slug,
			status: VideoStatus.Published,
		});

		if (video === null) {
			return res.status(404).send({ error: { message: "Not found" } });
		}

		try {
			fs.stat(path.resolve(getMediaPath(video), stream));

			return res.sendFile(path.resolve(getMediaPath(video), stream));
		} catch (error) {
			return res.status(404).send({ error: { message: "Not found" } });
		}
	}
);

VideoRouter.post(
	"/",
	Authentication,
	VideoUpload.single("file"),
	async (req, res) => {
		const { value, error } = Joi.object<VideoCreateBody>({
			description: Joi.string(),
			title: Joi.string().min(2).max(64).required(),
		}).validate(req.body);

		if (error || !req.file) {
			return res.status(400).send({
				error: {
					message: "Malformed body",
					stack: error,
				},
			});
		}

		const token = await decodeToken(req.auth.token);

		const { title, id, slug, status } = await new VideoModel({
			user: { _id: token._id },
			mediaPath: req.file.path,
			...value,
		}).save();

		return res.send({ data: { video: { title, id, slug, status } } });
	}
);

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
