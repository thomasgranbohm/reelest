import { VideoStatus } from "@prisma/client";
import fs from "fs/promises";
import Joi from "joi";

import config from "../config";
import prisma from "../database/client";
import {
	InternalServerError,
	MalformedBodyError,
	MissingFileError,
	NotFoundError,
	StillProcessingError,
	UnauthorizedError,
} from "../lib/errors";
import getTokenString from "../lib/getTokenString";
import { getVideoMediaPath, getVideoThumbnailPath } from "../lib/paths";
import PromiseHandler from "../lib/PromiseHandler";
import {
	handleVideoThumbnailUpload,
	handleVideoUpload,
} from "../services/FileSystem";
import { verifyToken } from "../services/JWT";
import { VideoCreateBody, VideoUpdateBody } from "../types/video";

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
			orderBy: { updatedAt: "desc" },
			select: {
				createdAt: true,
				duration: true,
				id: true,
				thumbnails: {
					select: {
						height: true,
						type: true,
						url: true,
						width: true,
					},
					take: 10,
				},
				title: true,
				user: {
					select: {
						_count: { select: { followedBy: true } },
						displayName: true,
						profilePictures: {
							where: {
								width: {
									in: [
										config.ffmpeg.profiles.base64.size,
										config.ffmpeg.profiles.small.size,
									],
								},
							},
						},
						username: true,
					},
				},
			},
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
			_count: {
				select: { comments: true },
			},
			createdAt: true,
			description: true,
			duration: true,
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
					profilePictures: {
						where: {
							width: {
								in: [
									config.ffmpeg.profiles.base64.size,
									config.ffmpeg.profiles.small.size,
								],
							},
						},
					},
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
		const thumbnailPath = getVideoThumbnailPath(video, thumbnail);
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
	} else if (
		existingVideo.status === VideoStatus.PROCESSING &&
		value.status
	) {
		throw StillProcessingError();
	}

	if (req.file) {
		handleVideoThumbnailUpload(existingVideo, req.file);
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
