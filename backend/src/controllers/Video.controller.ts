import fs from "fs/promises";
import Joi from "joi";

import {
	MalformedBodyError,
	NotFoundError,
	StillProcessingError,
	UnauthorizedError,
} from "lib/Errors.js";
import getTokenString from "lib/getTokenString.js";
import PromiseHandler from "lib/PromiseHandler.js";

import VideoModel from "models/Video.model.js";

import { decodeToken, verifyToken } from "services/JWT.js";

import { VideoCreateBody, VideoStatus, VideoUpdateBody } from "types/video.js";

// Create
const createVideo = PromiseHandler(async (req, res) => {
	const { error, value } = Joi.object<VideoCreateBody>({
		description: Joi.string(),
		title: Joi.string().min(2).max(64).required(),
	}).validate(req.body);

	if (error) {
		throw MalformedBodyError(error);
	}

	if (!req.file) {
		// TODO: missing file error
		throw MalformedBodyError("File is missing");
	}

	const token = await decodeToken(req.auth.token);

	const { id, slug, status, title } = await new VideoModel({
		mediaPath: req.file.path,
		user: { _id: token._id },
		...value,
	}).save();

	return res.send({ data: { video: { id, slug, status, title } } });
});

// Read
const getVideos = PromiseHandler(async (req, res) => {
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

const getVideo = PromiseHandler(async (req, res) => {
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

const getVideoStream = PromiseHandler(async (req, res) => {
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
		const streamPath = video.getMediaPath(stream);
		fs.stat(streamPath);

		return res.sendFile(streamPath);
	} catch (error) {
		throw NotFoundError();
	}
});

// Update
const updateVideo = PromiseHandler(async (req, res) => {
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

	const video = await VideoModel.updateOne(
		{
			id,
			slug,
			user: { _id: req.auth.payload._id },
		},
		value
	);

	return res.send({ data: { video } });
});

// Delete
const deleteVideo = PromiseHandler(async (req, res) => {
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

export default {
	createVideo,
	deleteVideo,
	getVideo,
	getVideoStream,
	getVideos,
	updateVideo,
};
