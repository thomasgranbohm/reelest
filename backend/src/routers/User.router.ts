import bcrypt from "bcrypt";
import { Router } from "express";
import Joi from "joi";

import {
	InternalServerError,
	InvalidCredentialsError,
	MalformedBodyError,
	NotFoundError,
} from "helpers/Error.helper.js";

import Authentication from "middlewares/Authentication.js";
import Pagination from "middlewares/Pagination.js";

import UserModel from "models/User.model.js";
import VideoModel from "models/Video.model.js";

import { decodeToken, signToken } from "services/JWT.js";

import { LoginValidationSchema, RegisterValidationSchema } from "types/user.js";

const UserRouter = Router();

UserRouter.get("/", Authentication, async (req, res) => {
	const payload = await decodeToken(req.auth.token);

	const user = await UserModel.findById(payload._id);

	if (user === null) {
		throw NotFoundError();
	}

	return res.send({ data: { user: user.toObject() } });
});

UserRouter.post("/me/followers", Authentication, async (req, res) => {
	const { _id } = await decodeToken(req.auth.token);

	const user = await UserModel.findById(
		_id,
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

UserRouter.post("/me/following", Authentication, async (req, res) => {
	const { _id } = await decodeToken(req.auth.token);

	const user = await UserModel.findById(
		_id,
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

UserRouter.post("/:username/follow", Authentication, async (req, res) => {
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
});

UserRouter.get("/videos", Authentication, Pagination, async (req, res) => {
	const payload = await decodeToken(req.auth.token);

	const [videos, count] = await Promise.all([
		VideoModel.find(
			{ user: { _id: payload._id } },
			{},
			{
				limit: req.pagination.limit,
				skip: req.pagination.offset,
				sort: { updatedAt: "desc" },
			}
		),
		VideoModel.count({ user: { _id: payload._id } }),
	]);

	return res.send({
		data: videos,
		pagination: {
			offset: req.pagination.offset + req.pagination.limit,
			total: count,
		},
	});
});

UserRouter.post("/login", async (req, res) => {
	const { error, value } = Joi.object<LoginValidationSchema>({
		identifier: Joi.alternatives()
			.try(Joi.string().email(), Joi.string().alphanum().min(3).max(30))
			.required(),
		password: Joi.string()
			.pattern(new RegExp("^[a-zA-Z0-9]{3,30}$"))
			.required(),
	}).validate(req.body);

	if (error) {
		throw MalformedBodyError(error);
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

UserRouter.post("/register", async (req, res) => {
	const { error, value } = Joi.object<RegisterValidationSchema>({
		confirm_password: Joi.string()
			.pattern(new RegExp("^[a-zA-Z0-9]{3,30}$"))
			.required(),
		display_name: Joi.string()
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

	if (error || value.password !== value.confirm_password) {
		throw MalformedBodyError();
	}

	const user = await new UserModel(value).save();

	return res.status(201).send({ data: { user: user.toObject() } });
});

UserRouter.delete("/", Authentication, async (req, res) => {
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

export default UserRouter;
