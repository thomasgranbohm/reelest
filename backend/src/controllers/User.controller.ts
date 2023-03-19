import { VideoStatus } from "@prisma/client";
import bcrypt from "bcrypt";
import { Request, Response } from "express";
import Joi from "joi";

import config from "config.js";

import prisma from "database/client.js";

import checkUserAuthentification from "lib/checkUserAuthentification.js";
import {
	CustomError,
	InternalServerError,
	InvalidCredentialsError,
	MalformedBodyError,
	NotFoundError,
} from "lib/Errors.js";
import PromiseHandler from "lib/PromiseHandler.js";

import { signToken } from "services/JWT.js";

import { LoginValidationSchema, RegisterValidationSchema } from "types/user.js";

// Create
const createUser = PromiseHandler(async (req: Request, res: Response) => {
	const { error, value } = Joi.object<
		Omit<RegisterValidationSchema, "confirmPassword">,
		true,
		RegisterValidationSchema
	>({
		confirmPassword: Joi.string().valid(Joi.ref("password")).required(),
		displayName: config.validation.user.displayName,
		email: config.validation.user.email,
		password: config.validation.user.password,
		username: config.validation.user.username,
	}).validate(req.body);

	if (error) {
		throw MalformedBodyError(error.details);
	}

	const { displayName, email, password: _password, username } = value;

	const password = await bcrypt.hash(_password, config.bcrypt.saltRounds);

	const user = await prisma.user.create({
		data: { displayName, email, password, username },
		select: { displayName: true, email: true, username: true },
	});

	return res.status(201).send({ data: { user } });
});

const createUserFollower = PromiseHandler(
	async (req: Request, res: Response) => {
		const { username } = req.params;

		const user = await prisma.user.update({
			data: { followedByIDs: { push: [req.auth.payload.id] } },
			select: {
				_count: {
					select: {
						followedBy: true,
					},
				},
				id: true,
			},
			where: {
				username,
			},
		});

		return res.status(201).send({ data: { user } });
	}
);

// Read
const getUser = PromiseHandler(async (req: Request, res: Response) => {
	const { username } = req.params;

	const user = await prisma.user.findUnique({
		select: {
			_count: {
				select: {
					followedBy: true,
					following: true,
				},
			},
			displayName: true,
			username: true,
		},
		where: { username },
	});

	if (user === null) {
		throw NotFoundError();
	}

	return res.send({ data: { user } });
});

const getUserFollowers = PromiseHandler(async (req: Request, res: Response) => {
	const { username } = req.params;

	const user = await prisma.user.findUnique({
		select: {
			_count: { select: { followedBy: true } },
			followedBy: {
				select: { displayName: true, username: true },
				skip: req.pagination.skip,
				take: req.pagination.take,
			},
		},
		where: { username },
	});

	if (user === null) {
		throw NotFoundError();
	}

	return res.send({
		data: user.followedBy,
		skip: req.pagination.skip + req.pagination.take,
		take: req.pagination.take,
		total: user._count.followedBy,
	});
});

const getUserFollowing = PromiseHandler(async (req: Request, res: Response) => {
	const { username } = req.params;

	const user = await prisma.user.findUnique({
		select: {
			_count: { select: { following: true } },
			following: {
				select: { displayName: true, username: true },
				skip: req.pagination.skip,
				take: req.pagination.take,
			},
		},
		where: { username },
	});

	if (user === null) {
		throw NotFoundError();
	}

	return res.send({
		data: user.following,
		skip: req.pagination.skip + req.pagination.take,
		take: req.pagination.take,
		total: user._count.following,
	});
});

const getUserVideos = PromiseHandler(async (req: Request, res: Response) => {
	const { username } = req.params;

	const user = await prisma.user.findUnique({
		select: {
			id: true,
		},
		where: { username },
	});

	if (user === null) {
		throw NotFoundError();
	}

	const whereOptions = {
		status: checkUserAuthentification(req)
			? undefined
			: VideoStatus.PUBLISHED,
		userId: user.id,
	};

	// TODO: One query
	const [videos, count] = await Promise.all([
		prisma.video.findMany({
			orderBy: { createdAt: "desc" },
			select: {
				createdAt: true,
				id: true,
				status: checkUserAuthentification(req) ? true : false,
				title: true,
			},
			skip: req.pagination.skip,
			take: req.pagination.take,
			where: whereOptions,
		}),
		prisma.video.count({ where: whereOptions }),
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

// Delete
const deleteUser = PromiseHandler(async (req: Request, res: Response) => {
	try {
		await prisma.user.delete({ where: { id: req.auth.payload.id } });

		// TODO: Remove cookie

		return res.status(200).send({ data: { message: "User deleted" } });
	} catch (error) {
		console.log("Could not delete user %s", req.auth.payload.username);

		throw InternalServerError();
	}
});

// Custom
const authenticateUser = PromiseHandler(async (req: Request, res: Response) => {
	const { error, value } = Joi.object<LoginValidationSchema>({
		identifier: Joi.alternatives()
			.try(config.validation.user.username, config.validation.user.email)
			.required(),
		password: config.validation.user.password,
	}).validate(req.body);

	if (error) {
		throw new CustomError(400, "Malformed body");
	}

	const user = await prisma.user.findFirst({
		select: { email: true, id: true, password: true, username: true },
		where: {
			OR: [{ email: value.identifier }, { username: value.identifier }],
		},
	});

	if (user === null) {
		throw InvalidCredentialsError();
	}

	const passwordMatch = await bcrypt.compare(value.password, user.password);
	if (!passwordMatch) {
		throw InvalidCredentialsError();
	}

	const { email, id, username } = user;

	const token = await signToken({
		email,
		id,
		username,
	});

	return res.status(200).send({ data: { token } });
});

export default {
	authenticateUser,
	createUser,
	createUserFollower,
	deleteUser,
	getUser,
	getUserFollowers,
	getUserFollowing,
	getUserVideos,
};
