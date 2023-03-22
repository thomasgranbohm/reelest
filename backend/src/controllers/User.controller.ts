import { Prisma, VideoStatus } from "@prisma/client";
import bcrypt from "bcrypt";
import { Request, Response } from "express";
import fs from "fs/promises";
import Joi from "joi";

import config from "../config";
import prisma from "../database/client";
import checkUserAuthentification from "../lib/checkUserAuthentification";
import {
	CannotSubscribeToSelf,
	InternalServerError,
	InvalidCredentialsError,
	MalformedBodyError,
	NotFoundError,
} from "../lib/errors";
import parseWhereOptions from "../lib/parseWhereOptions";
import { getProfilePicturePath } from "../lib/paths";
import PromiseHandler from "../lib/PromiseHandler";
import { transformUser, transformVideo } from "../lib/transformer";
import { handleProfilePictureUpload } from "../services/FileSystem";
import { signToken } from "../services/JWT";
import { LoginValidationSchema, RegisterValidationSchema } from "../types/user";

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

	try {
		const user = await prisma.user.create({
			data: { displayName, email, password, username },
			select: {
				displayName: true,
				email: true,
				id: true,
				username: true,
			},
		});

		if (req.file) {
			handleProfilePictureUpload(user, req.file);
		}

		return res.status(201).send({ data: { user } });
	} catch (error) {
		if (error instanceof Prisma.PrismaClientKnownRequestError) {
			if (error.code === "P2002") {
				if (error.meta) {
					const errorMessage =
						error.meta.target === "User_email_key"
							? "Email already in use"
							: error.meta.target === "User_username_key"
							? "Username already in use"
							: null;

					throw MalformedBodyError(errorMessage);
				}
			}
		}

		throw error;
	}
});

const createUserFollower = PromiseHandler(
	async (req: Request, res: Response) => {
		const { username } = req.params;

		const authUser = await prisma.user.findUnique({
			select: { username: true },
			where: { id: req.auth.payload.id },
		});

		if (authUser.username === username) {
			throw CannotSubscribeToSelf();
		}

		const user = await prisma.user.update({
			data: { followedBy: { connect: { id: req.auth.payload.id } } },
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
	const { id, username } = req.params;

	const isAuthenticated = checkUserAuthentification(req);

	const user = await prisma.user.findUnique({
		select: {
			_count: {
				select: {
					followedBy: true,
					following: true,
				},
			},
			displayName: true,
			profilePictures: {
				select: { height: true, type: true, url: true, width: true },
				where: {
					width: { notIn: [config.ffmpeg.profiles.large.size] },
				},
			},
			username: true,
		},
		where: parseWhereOptions<Prisma.UserWhereUniqueInput>({
			id: isAuthenticated ? id : null,
			username: !isAuthenticated ? username : null,
		}),
	});

	if (user === null) {
		throw NotFoundError();
	}

	return res.send({ data: { user: transformUser({ ...user }) } });
});

const getUserFollowers = PromiseHandler(async (req: Request, res: Response) => {
	const { id, username } = req.params;

	const isAuthenticated = checkUserAuthentification(req);

	const user = await prisma.user.findUnique({
		select: {
			_count: { select: { followedBy: true } },
			followedBy: {
				select: {
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
				skip: req.pagination.skip,
				take: req.pagination.take,
			},
		},
		where: parseWhereOptions<Prisma.UserWhereUniqueInput>({
			id: isAuthenticated ? id : null,
			username: !isAuthenticated ? username : null,
		}),
	});

	if (user === null) {
		throw NotFoundError();
	}

	return res.send({
		data: user.followedBy.map(transformUser),
		skip: req.pagination.skip,
		take: req.pagination.take,
		total: user._count.followedBy,
	});
});

const getUserFollowing = PromiseHandler(async (req: Request, res: Response) => {
	const { id, username } = req.params;

	const isAuthenticated = checkUserAuthentification(req);

	const user = await prisma.user.findUnique({
		select: {
			_count: { select: { following: true } },
			following: {
				select: {
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
				skip: req.pagination.skip,
				take: req.pagination.take,
			},
		},
		where: parseWhereOptions<Prisma.UserWhereUniqueInput>({
			id: isAuthenticated ? id : null,
			username: !isAuthenticated ? username : null,
		}),
	});

	if (user === null) {
		throw NotFoundError();
	}

	return res.send({
		data: user.following.map(transformUser),
		skip: req.pagination.skip,
		take: req.pagination.take,
		total: user._count.following,
	});
});

const getUserVideos = PromiseHandler(async (req: Request, res: Response) => {
	const { id, username } = req.params;

	const isAuthenticated = checkUserAuthentification(req);

	const whereOptions = parseWhereOptions<Prisma.VideoWhereInput>({
		status: !isAuthenticated ? null : VideoStatus.PUBLISHED,
		user: {
			username: isAuthenticated ? null : username,
		},
		userId: isAuthenticated ? id : null,
	});

	const [videos, count] = await Promise.all([
		prisma.video.findMany({
			orderBy: { createdAt: "desc" },
			select: {
				createdAt: true,
				id: true,
				status: isAuthenticated,
				title: true,
			},
			skip: req.pagination.skip,
			take: req.pagination.take,
			where: whereOptions,
		}),
		prisma.video.count({ where: whereOptions }),
	]);

	return res.send({
		data: videos.map(transformVideo),
		pagination: {
			skip: req.pagination.skip + req.pagination.take,
			take: req.pagination.take,
			total: count,
		},
	});
});

const getUserProfilePicture = PromiseHandler(async (req, res) => {
	const { picture, username } = req.params;

	const user = await prisma.user.findUnique({
		where: { username },
	});

	if (user === null) {
		throw NotFoundError();
	}

	try {
		const picturePath = getProfilePicturePath(user, picture);
		await fs.stat(picturePath);

		return res.sendFile(picturePath);
	} catch (error) {
		throw NotFoundError();
	}
});

// Update
const updateUser = PromiseHandler(async (req, res) => {
	const { error, value } = Joi.object<{ displayName: string }>({
		displayName: config.validation.user.displayName,
	}).validate(req.body);

	if (error) {
		throw MalformedBodyError(error);
	}

	const existingUser = await prisma.user.findUnique({
		select: { id: true, username: true },
		where: { id: req.auth.payload.id },
	});

	if (existingUser === null) {
		throw NotFoundError();
	}

	if (req.file) {
		handleProfilePictureUpload(existingUser, req.file);
	}

	const user = await prisma.user.update({
		data: value,
		select: { displayName: true, email: true, id: true, username: true },
		where: { id: req.auth.payload.id },
	});

	return res.send({ data: { user } });
});

// Delete
const deleteUser = PromiseHandler(async (req: Request, res: Response) => {
	try {
		await prisma.user.delete({ where: { id: req.auth.payload.id } });

		// TODO: Remove cookie

		return res.status(200).send({ data: { message: "User deleted" } });
	} catch (error) {
		throw NotFoundError();
	}
});

const deleteUserFollower = PromiseHandler(async (req, res) => {
	const { username } = req.params;
	try {
		await prisma.user.update({
			data: { followedBy: { disconnect: { id: req.auth.payload.id } } },
			where: { username },
		});

		return res
			.status(200)
			.send({ data: { message: "Subscription deleted" } });
	} catch (error) {
		console.error(error);
		throw InternalServerError("Could not remove follower");
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
		throw MalformedBodyError();
	}

	const user = await prisma.user.findFirst({
		select: { id: true, password: true },
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

	const { id } = user;

	const token = await signToken({
		id,
	});

	return res.status(200).send({ data: { token } });
});

export default {
	authenticateUser,
	createUser,
	createUserFollower,
	deleteUser,
	deleteUserFollower,
	getUser,
	getUserFollowers,
	getUserFollowing,
	getUserProfilePicture,
	getUserVideos,
	updateUser,
};
