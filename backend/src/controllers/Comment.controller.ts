import Joi from "joi";

import config from "../config";
import prisma from "../database/client";
import {
	MalformedBodyError,
	NotFoundError,
	UnauthorizedError,
} from "../lib/errors";
import PromiseHandler from "../lib/PromiseHandler";

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

	const comment = await prisma.comment.create({
		data: {
			content: value.content,
			userId: req.auth.payload.id,
			videoId,
		},
		select: {
			id: true,
			userId: true,
			videoId: true,
		},
	});

	return res.status(201).send({ data: { comment } });
});

// /:videoId
const getComments = PromiseHandler(async (req, res) => {
	const { videoId } = req.params;

	try {
		const video = await prisma.video.findUniqueOrThrow({
			select: {
				_count: {
					select: { comments: true },
				},
				comments: {
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
			data: video.comments,
			pagination: {
				...req.pagination,
				total: video._count.comments,
			},
		});
	} catch (error) {
		console.log(error);

		throw NotFoundError();
	}
});

const deleteComment = PromiseHandler(async (req, res) => {
	const { id } = req.params;

	const comment = await prisma.comment.findUnique({
		select: { id: true, userId: true },
		where: { id },
	});

	if (comment === null) {
		throw NotFoundError();
	} else if (comment.userId !== req.auth.payload.id) {
		throw UnauthorizedError();
	}

	await prisma.comment.delete({ where: { id: comment.id } });

	return res.status(200).send({ data: { message: "Deleted comment" } });
});

export default {
	createComment,
	deleteComment,
	getComments,
};
