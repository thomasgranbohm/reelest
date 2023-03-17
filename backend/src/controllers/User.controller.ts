import bcrypt from "bcrypt";
import { Request, Response } from "express";
import Joi from "joi";

import {
	CustomError,
	InternalServerError,
	InvalidCredentialsError,
	MalformedBodyError,
	NotFoundError,
} from "lib/Errors.js";
import PromiseHandler from "lib/PromiseHandler.js";

import UserModel from "models/User.model.js";
import VideoModel from "models/Video.model.js";

import { decodeToken, signToken } from "services/JWT.js";

import { LoginValidationSchema, RegisterValidationSchema } from "types/user.js";

// Create
const createUser = PromiseHandler(async (req: Request, res: Response) => {
	const { error, value } = Joi.object<RegisterValidationSchema>({
		confirmPassword: Joi.string().valid(Joi.ref("password")).required(),
		displayName: Joi.string()
			.pattern(
				new RegExp(
					"^(?=.{4,48}$)(?!.*[ -]{2})[a-zA-Z][a-zA-Z0-9 -]*[a-zA-Z0-9]$"
				)
			)
			.required(),
		email: Joi.string()
			.email({
				minDomainSegments: 2,
				tlds: { allow: ["com", "dev", "test", "net", "xyz"] },
			})
			.required(),
		password: Joi.string()
			.pattern(new RegExp("^[a-zA-Z0-9]{3,30}$"))
			.required(),
		username: Joi.string().alphanum().min(3).max(30).required(),
	}).validate(req.body);

	if (error) {
		throw MalformedBodyError(error.details);
	}

	const user = await new UserModel(value).save();

	return res.status(201).send({ data: { user: user.toObject() } });
});

const createUserFollower = PromiseHandler(
	async (req: Request, res: Response) => {
		const { username } = req.params;
		const { _id } = await decodeToken(req.auth.token);

		const users = await Promise.all([
			UserModel.findOne(
				{ username },
				{},
				{
					fields: ["_id followers"],
					populate: {
						path: "followers",
						select: "_id",
					},
				}
			),
			UserModel.findById(
				_id,
				{},
				{
					fields: ["_id following"],
					populate: {
						path: "following",
						select: "_id",
					},
				}
			),
		]);

		if (!users.every(Boolean)) {
			throw NotFoundError();
		}

		const [user, currentUser] = users;

		currentUser.following.push(user._id);
		user.followers.push(currentUser._id);

		await Promise.all([currentUser.save(), user.save()]);

		return res.status(201).send({ data: { message: "Subscribed" } });
	}
);

// Read
const getUser = PromiseHandler(async (req: Request, res: Response) => {
	const { username } = req.params;

	const user = await UserModel.findOne(
		{ username },
		{},
		{ fields: ["username displayName followerCount followingCount"] }
	);

	if (user === null) {
		throw NotFoundError();
	}

	return res.send({ data: { user: user.toObject() } });
});

const getUserFollowers = PromiseHandler(async (req: Request, res: Response) => {
	const { username } = req.params;

	const user = await UserModel.findOne(
		{ username },
		{},
		{
			fields: ["followers"],
			populate: {
				path: "followers",
				select: "_id username",
			},
		}
	);

	if (user === null) {
		throw InternalServerError(
			"Could not find authenticated user. Probably deleted but still authenticated"
		);
	}

	return res.send({ data: user.followers });
});

const getUserFollowing = PromiseHandler(async (req: Request, res: Response) => {
	const { username } = req.params;

	const user = await UserModel.findOne(
		{ username },
		{},
		{
			fields: ["following"],
			populate: {
				path: "following",
				select: "_id username",
			},
		}
	);

	if (user === null) {
		throw InternalServerError(
			"Could not find authenticated user. Probably deleted but still authenticated"
		);
	}

	return res.send({ data: user.following });
});

const getUserVideos = PromiseHandler(async (req: Request, res: Response) => {
	const { username } = req.params;
	const user = await UserModel.findOne({ username }, {}, { fields: ["_id"] });

	const [videos, count] = await Promise.all([
		VideoModel.find(
			{ user },
			{},
			{
				fields: ["title slug createdAt"],
				limit: req.pagination.limit,
				skip: req.pagination.offset,
				sort: { updatedAt: "desc" },
			}
		),
		VideoModel.count({ user }),
	]);

	return res.send({
		data: videos,
		pagination: {
			offset: req.pagination.offset + req.pagination.limit,
			total: count,
		},
	});
});

// Delete
const deleteUser = PromiseHandler(async (req: Request, res: Response) => {
	const payload = await decodeToken(req.auth.token);

	const user = await UserModel.findById(payload._id);

	if (user === null) {
		throw NotFoundError();
	}

	try {
		await user.deleteOne();

		// TODO: Remove cookie

		return res.status(200).send({ data: { message: "User deleted" } });
	} catch (error) {
		console.log("Could not delete user %s", user.username);

		throw InternalServerError();
	}
});

// Custom
const authenticateUser = PromiseHandler(async (req: Request, res: Response) => {
	const { error, value } = Joi.object<LoginValidationSchema>({
		identifier: Joi.alternatives()
			.try(Joi.string().email(), Joi.string().alphanum().min(3).max(30))
			.required(),
		password: Joi.string()
			.pattern(new RegExp("^[a-zA-Z0-9]{3,30}$"))
			.required(),
	}).validate(req.body);

	if (error) {
		throw new CustomError(400, "Malformed body");
	}

	const user = await UserModel.findOne(
		{
			$or: [{ email: value.identifier }, { username: value.identifier }],
		},
		{},
		{ fields: ["password"] }
	);

	if (user === null) {
		throw InvalidCredentialsError();
	}

	const passwordMatch = await bcrypt.compare(value.password, user.password);
	if (!passwordMatch) {
		throw InvalidCredentialsError();
	}

	const token = await signToken({
		...user.toObject(),
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
