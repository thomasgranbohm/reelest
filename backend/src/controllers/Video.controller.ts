import { VideoStatus } from "@prisma/client";
import fs from "fs/promises";
import Joi from "joi";
import { nanoid } from "nanoid";

import prisma from "database/client.js";

import {
	MalformedBodyError,
	NotFoundError,
	StillProcessingError,
	UnauthorizedError,
} from "lib/Errors.js";
import getMediaPath from "lib/getMediaPath.js";
import getTokenString from "lib/getTokenString.js";
import PromiseHandler from "lib/PromiseHandler.js";

import { handleVideoUpload } from "services/FileSystem.js";
import { verifyToken } from "services/JWT.js";

import { VideoCreateBody, VideoUpdateBody } from "types/video.js";

import config from "../config.js";

// Create
const createVideo = PromiseHandler(async (req, res) => {
	const { error, value } = Joi.object<VideoCreateBody>({
		description: config.validation.video.description,
		title: config.validation.video.title,
	}).validate(req.body);

	if (error) {
		throw MalformedBodyError(error);
	}

	if (!req.file) {
		// TODO: missing file error
		throw MalformedBodyError("File is missing");
	}

	const video = await prisma.video.create({
		data: {
			...value,
			id: nanoid(10),
			userId: req.auth.payload.id,
		},
		select: { id: true, status: true, title: true },
	});

	handleVideoUpload(video, req.file);

	return res.send({ data: { video } });
});

// Read
const getVideos = PromiseHandler(async (req, res) => {
	const [videos, count] = await Promise.all([
		prisma.video.findMany({
			orderBy: { updatedAt: "desc" },
			skip: req.pagination.offset,
			take: req.pagination.limit,
			where: { status: "PROCESSING" },
		}),
		prisma.video.count({
			where: { status: "PROCESSING" },
		}),
	]);

	return res.send({
		data: videos,
		pagination: {
			limit: req.pagination.limit,
			offset: req.pagination.offset + req.pagination.limit,
			total: count,
		},
	});
});

const getVideo = PromiseHandler(async (req, res) => {
	const { id } = req.params;

	const video = await prisma.video.findUnique({
		include: { user: { select: { username: true } } },
		where: { id },
	});

	if (
		video === null ||
		(video.status !== "PUBLISHED" &&
			req.auth.payload.username === video.user.username)
	) {
		throw NotFoundError();
	}

	const { status, title, user } = video;

	return res.send({ data: { video: { id, status, title, user } } });
});

const getVideoStream = PromiseHandler(async (req, res) => {
	const { id, stream } = req.params;

	const video = await prisma.video.findUnique({
		include: { user: { select: { id: true } } },
		where: { id },
	});

	const token = getTokenString(req);
	const { error, payload } = await verifyToken(token);

	if (token && error) {
		throw UnauthorizedError();
	}

	if (
		video === null ||
		error ||
		(video.status !== VideoStatus.PUBLISHED && payload.id !== video.user.id)
	) {
		throw NotFoundError();
	}

	if (
		video.status === VideoStatus.PROCESSING &&
		(error || payload.id === video.user.id.toString())
	) {
		throw StillProcessingError();
	}

	try {
		const streamPath = getMediaPath(video, stream);
		fs.stat(streamPath);

		return res.sendFile(streamPath);
	} catch (error) {
		throw NotFoundError();
	}
});

// Update
const updateVideo = PromiseHandler(async (req, res) => {
	const { error, value } = Joi.object<VideoUpdateBody>({
		description: config.validation.video.description,
		title: config.validation.video.title,
	}).validate(req.body);

	if (error) {
		throw MalformedBodyError(error);
	}

	const { id } = req.params;

	const video = await prisma.video.updateMany({
		data: value,
		where: { id, userId: req.auth.payload.id },
	});

	return res.send({ data: { video } });
});

// Delete
const deleteVideo = PromiseHandler(async (req, res) => {
	const { id } = req.params;

	const video = await prisma.video.findUnique({
		select: { id: true, userId: true },
		where: { id },
	});

	if (video === null) {
		throw NotFoundError();
	}

	if (video.userId !== req.auth.payload.id) {
		throw UnauthorizedError();
	}

	await prisma.video.delete({ where: { id: video.id } });

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
