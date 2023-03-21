import { VideoStatus } from "@prisma/client";
import fs from "fs/promises";
import Joi from "joi";

import config from "config.js";

import prisma from "database/client.js";

import {
	InternalServerError,
	MalformedBodyError,
	MissingFileError,
	NotFoundError,
	StillProcessingError,
	UnauthorizedError,
} from "lib/errors.js";
import getTokenString from "lib/getTokenString.js";
import { getThumbnailPath, getVideoMediaPath } from "lib/paths.js";
import PromiseHandler from "lib/PromiseHandler.js";

import {
	handleThumbnailUpload,
	handleVideoUpload,
} from "services/FileSystem.js";
import { verifyToken } from "services/JWT.js";

import { VideoCreateBody, VideoUpdateBody } from "types/video.js";

// Create
const createVideo = PromiseHandler(async (req, res) => {
	const { error, value } = Joi.object<VideoCreateBody>({
		description: config.validation.video.description,
		title: config.validation.video.title.required(),
	}).validate(req.body);

	if (error) {
		throw MalformedBodyError(error);
	} else if (!req.file) {
		throw MissingFileError();
	}

	const { description, title } = value;

	const video = await prisma.video.create({
		data: {
			description,
			title,
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
			include: {
				thumbnails: {
					select: {
						height: true,
						type: true,
						url: true,
						width: true,
					},
					take: 10,
				},
				user: { select: { displayName: true, username: true } },
			},
			orderBy: { updatedAt: "desc" },
			skip: req.pagination.skip,
			take: req.pagination.take,
			where: { status: VideoStatus.PUBLISHED },
		}),
		prisma.video.count({
			where: { status: VideoStatus.PUBLISHED },
		}),
	]);

	return res.send({
		data: videos,
		pagination: {
			skip: req.pagination.skip,
			take: req.pagination.take,
			total: count,
		},
	});
});

const getVideo = PromiseHandler(async (req, res) => {
	const { id } = req.params;

	const video = await prisma.video.findUnique({
		select: {
			createdAt: true,
			description: true,
			id: true,
			status: true,
			thumbnails: {
				select: { height: true, type: true, url: true, width: true },
				take: 10,
			},
			title: true,
			user: {
				select: {
					_count: { select: { followedBy: true } },
					displayName: true,
					id: true,
					username: true,
				},
			},
		},
		where: { id },
	});

	const token = getTokenString(req);
	const { error, payload } = await verifyToken(token);

	if (token !== null && error) {
		throw InternalServerError("Something went wrong decoding the token");
	} else if (
		video === null ||
		(video.status !== VideoStatus.PUBLISHED &&
			(token === null || video.user.id !== payload.id))
	) {
		throw NotFoundError();
	}

	return res.send({ data: { video } });
});

const getVideoStream = PromiseHandler(async (req, res) => {
	const { id, stream } = req.params;

	const video = await prisma.video.findUnique({
		include: { user: { select: { id: true } } },
		where: { id },
	});

	const token = getTokenString(req);
	const { error, payload } = await verifyToken(token);

	if (token !== null && error) {
		throw InternalServerError("Something went wrong decoding the token");
	} else if (
		video === null ||
		(video.status !== VideoStatus.PUBLISHED &&
			(token === null || video.user.id !== payload.id))
	) {
		throw NotFoundError();
	} else if (video.status === VideoStatus.PROCESSING) {
		throw StillProcessingError();
	}

	try {
		const streamPath = getVideoMediaPath(video, stream);
		fs.stat(streamPath);

		return res.sendFile(streamPath);
	} catch (error) {
		throw NotFoundError();
	}
});

const getVideoThumbnail = PromiseHandler(async (req, res) => {
	const { id, thumbnail } = req.params;

	const video = await prisma.video.findUnique({
		include: {
			thumbnails: {
				select: { height: true, url: true, width: true },
				take: 10,
			},
			user: { select: { id: true } },
		},
		where: { id },
	});

	const token = getTokenString(req);
	const { error, payload } = await verifyToken(token);

	if (token !== null && error) {
		throw InternalServerError("Something went wrong decoding the token");
	} else if (
		video === null ||
		(video.status !== VideoStatus.PUBLISHED &&
			(token === null || video.user.id !== payload.id))
	) {
		throw NotFoundError();
	} else if (video.status === VideoStatus.PROCESSING) {
		throw StillProcessingError();
	}

	try {
		const thumbnailPath = getThumbnailPath(video, thumbnail);
		await fs.stat(thumbnailPath);

		return res.sendFile(thumbnailPath);
	} catch (error) {
		throw NotFoundError();
	}
});

// Update
const updateVideo = PromiseHandler(async (req, res) => {
	const { error, value } = Joi.object<VideoUpdateBody>({
		description: config.validation.video.description,
		status: config.validation.video.status,
		title: config.validation.video.title,
	}).validate(req.body);

	if (error) {
		throw MalformedBodyError(error);
	}

	const { id } = req.params;

	const existingVideo = await prisma.video.findUnique({
		select: { id: true, status: true, userId: true },
		where: { id },
	});

	if (existingVideo === null) {
		throw NotFoundError();
	} else if (existingVideo.userId !== req.auth.payload.id) {
		throw UnauthorizedError();
	}

	if (req.file) {
		handleThumbnailUpload(existingVideo, req.file);
	}

	const video = await prisma.video.update({
		data: value,
		select: { description: true, id: true, status: true, title: true },
		where: { id },
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
	} else if (video.userId !== req.auth.payload.id) {
		throw UnauthorizedError();
	}

	await prisma.video.delete({ where: { id: video.id } });

	fs.rm(getVideoMediaPath(video), { force: true, recursive: true });

	return res.status(200).send({ data: { message: "Deleted video" } });
});

export default {
	createVideo,
	deleteVideo,
	getVideo,
	getVideoStream,
	getVideoThumbnail,
	getVideos,
	updateVideo,
};
