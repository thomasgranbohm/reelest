import Joi from "joi";

import config from "../config";
import prisma from "../database/client";
import { MalformedBodyError, NotFoundError } from "../lib/errors";
import PromiseHandler from "../lib/PromiseHandler";
import { transformReplies, transformThreads } from "../lib/transformer";

const createComment = PromiseHandler(async (req, res) => {
	const { error, value } = Joi.object<{
		content: string;
	}>({
		content: config.validation.comment.content.required(),
	}).validate(req.body);

	if (error) {
		throw MalformedBodyError();
	}

	const { videoId } = req.params;

	try {
		await prisma.video.findUniqueOrThrow({
			select: { id: true },
			where: {
				id: videoId,
			},
		});
	} catch (error) {
		throw NotFoundError();
	}

	const thread = await prisma.thread.create({
		data: {
			content: value.content,
			userId: req.auth.payload.id,
			videoId,
		},
		select: {
			_count: {
				select: { replies: true },
			},
			id: true,
			videoId: true,
		},
	});

	return res.status(201).send({ data: { thread } });
});

const replyToComment = PromiseHandler(async (req, res) => {
	const { error, value } = Joi.object<{
		content: string;
		replyToId?: string;
	}>({
		content: config.validation.comment.content.required(),
		replyToId: config.validation.generic.objectId,
	}).validate(req.body);

	if (error) {
		throw MalformedBodyError();
	}

	const { threadId, videoId } = req.params;

	try {
		await prisma.video.findFirstOrThrow({
			select: { id: true },
			where: {
				id: videoId,
				threads: {
					some: {
						id: threadId,
					},
				},
			},
		});
	} catch (error) {
		throw NotFoundError();
	}

	const thread = await prisma.thread.update({
		data: {
			replies: {
				create: {
					content: value.content,
					userId: req.auth.payload.id,
				},
			},
		},
		select: {
			_count: {
				select: {
					replies: true,
				},
			},
			id: true,
			videoId: true,
		},
		where: { id: threadId },
	});

	return res.status(201).send({ data: { thread } });
});

// /:videoId
const getThreads = PromiseHandler(async (req, res) => {
	const { videoId } = req.params;

	try {
		const video = await prisma.video.findUniqueOrThrow({
			select: {
				_count: {
					select: { threads: true },
				},
				threads: {
					select: {
						content: true,
						id: true,
						user: {
							select: {
								displayName: true,
								id: true,
								profilePictures: {
									select: {
										height: true,
										type: true,
										url: true,
										width: true,
									},
									where: {
										width: {
											in: [
												config.ffmpeg.profiles.small
													.size,
												config.ffmpeg.profiles.base64
													.size,
											],
										},
									},
								},
								username: true,
							},
						},
					},
				},
			},
			where: {
				id: videoId,
			},
		});

		return res.send({
			data: transformThreads(video.threads),
			pagination: {
				...req.pagination,
				total: video._count.threads,
			},
		});
	} catch (error) {
		console.log(error);

		throw NotFoundError();
	}
});

// /:videoId/:threadId
const getThreadReplies = PromiseHandler(async (req, res) => {
	const { threadId, videoId } = req.params;

	try {
		const existingThread = await prisma.thread.findUniqueOrThrow({
			select: { videoId: true },
			where: { id: threadId },
		});

		if (existingThread.videoId !== videoId) {
			throw {};
		}
	} catch (error) {
		throw NotFoundError();
	}

	const thread = await prisma.thread.findUnique({
		select: {
			_count: { select: { replies: true } },
			replies: {
				select: {
					content: true,
					id: true,
					replyToId: true,
					user: {
						select: {
							displayName: true,
							id: true,
							profilePictures: {
								select: {
									height: true,
									type: true,
									url: true,
									width: true,
								},
								where: {
									width: {
										in: [
											config.ffmpeg.profiles.small.size,
											config.ffmpeg.profiles.base64.size,
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
			},
		},
		where: { id: threadId },
	});

	return res.send({
		data: transformReplies(thread),
		pagination: {
			skip: req.pagination.skip,
			take: req.pagination.take,
			total: thread._count.replies,
		},
	});
});

export default {
	createComment,
	getThreadComments: getThreadReplies,
	getThreads,
	replyToComment,
};
