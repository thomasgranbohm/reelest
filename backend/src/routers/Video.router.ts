import { Router } from "express";
import fs from "fs/promises";
import Joi from "joi";
import path from "path";

import {
	MalformedBodyError,
	NotFoundError,
	StillProcessingError,
	UnauthorizedError,
} from "helpers/Error.helper.js";
import { getMediaPath } from "helpers/Video.helper.js";

import getTokenString from "lib/getTokenString.js";

import Authentication from "middlewares/Authentication.js";
import Pagination from "middlewares/Pagination.js";
import { VideoUpload } from "middlewares/Upload.js";

import VideoModel from "models/Video.model.js";

import { decodeToken, verifyToken } from "services/JWT.js";

import { VideoCreateBody, VideoStatus, VideoUpdateBody } from "types/video.js";

const VideoRouter = Router();

VideoRouter.get("/", Pagination, async (req, res) => {
	const [videos, count] = await Promise.all([
		VideoModel.find(
			{ status: VideoStatus.Published },
			{},
			{
				limit: req.pagination.limit,
				populate: {
					path: "user",
					select: "username -_id",
				},
				skip: req.pagination.offset,
				sort: { updatedAt: "desc" },
			}
		),
		VideoModel.count({ status: VideoStatus.Published }),
	]);

	return res.send({
		data: videos,
		pagination: {
			offset: req.pagination.offset + req.pagination.limit,
			total: count,
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
		throw NotFoundError();
	}

	const { status, title, user } = video;

	return res.send({ data: { video: { id, slug, status, title, user } } });
});

VideoRouter.get(
	"/:id/:slug/stream/:stream(master.m3u8|stream_[0-9]+/(data[0-9]+.ts|stream.m3u8))",
	async (req, res) => {
		const { id, slug, stream } = req.params;

		const video = await VideoModel.findOne(
			{
				id,
				slug,
			},
			{},
			{ populate: { path: "user", select: "_id" } }
		);

		const token = getTokenString(req);
		const { error, payload } = await verifyToken(token);

		if (token && error) {
			throw UnauthorizedError();
		}

		if (
			video === null ||
			error ||
			(video.status !== VideoStatus.Published &&
				payload._id !== video.user._id.toString())
		) {
			throw NotFoundError();
		}

		if (
			video.status === VideoStatus.Processing &&
			(error || payload._id === video.user._id.toString())
		) {
			throw StillProcessingError();
		}

		try {
			fs.stat(path.resolve(getMediaPath(video), stream));

			return res.sendFile(path.resolve(getMediaPath(video), stream));
		} catch (error) {
			throw NotFoundError();
		}
	}
);

VideoRouter.post(
	"/",
	Authentication,
	VideoUpload.single("file"),
	async (req, res) => {
		const { error, value } = Joi.object<VideoCreateBody>({
			description: Joi.string(),
			title: Joi.string().min(2).max(64).required(),
		}).validate(req.body);

		if (error || !req.file) {
			// TODO: missing file error
			throw MalformedBodyError(error);
		}

		const token = await decodeToken(req.auth.token);

		const { id, slug, status, title } = await new VideoModel({
			mediaPath: req.file.path,
			user: { _id: token._id },
			...value,
		}).save();

		return res.send({ data: { video: { id, slug, status, title } } });
	}
);

VideoRouter.put("/:id/:slug", Authentication, async (req, res) => {
	const { error, value } = Joi.object<VideoUpdateBody>({
		description: Joi.string(),
		slug: Joi.string()
			.trim()
			.min(2)
			.max(64)
			.regex(/^[a-zA-Z0-9-]$/),
		title: Joi.string().min(2).max(64),
	}).validate(req.body);

	if (error) {
		throw MalformedBodyError(error);
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
		throw UnauthorizedError();
	}

	await video.deleteOne();

	return res.status(200).send({ data: { message: "Deleted video" } });
});

export default VideoRouter;
