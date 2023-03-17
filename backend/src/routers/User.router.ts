import bcrypt from "bcrypt";
import { Router } from "express";
import Joi from "joi";

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
		return res.status(404).send({ error: { message: "User not found" } });
	}

	return res.send({ data: { user: user.toObject() } });
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
		return res.status(400).send({
			error: {
				message: "Malformed body",
				stack: error,
			},
		});
	}

	const user = await UserModel.findOne(
		{
			$or: [{ email: value.identifier }, { username: value.identifier }],
		},
		{},
		{ fields: ["password"] }
	);

	if (user === null) {
		return res
			.status(401)
			.send({ error: { message: "Invalid credentials" } });
	}

	const passwordMatch = await bcrypt.compare(value.password, user.password);
	if (!passwordMatch) {
		return res
			.status(401)
			.send({ error: { message: "Invalid credentials" } });
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
		return res.status(400).send({
			error: {
				message: "Malformed body.",
			},
		});
	}

	const user = await new UserModel(value).save();

	return res.status(201).send({ data: { user: user.toObject() } });
});

UserRouter.delete("/", Authentication, async (req, res) => {
	const payload = await decodeToken(req.auth.token);

	const user = await UserModel.findById(payload._id);

	if (user === null) {
		return res.status(404).send({ error: { message: "User not found" } });
	}

	try {
		await user.deleteOne();

		// TODO: Remove cookie

		return res.status(200).send({ data: { message: "User deleted" } });
	} catch (error) {
		return res
			.status(500)
			.send({ error: { message: "User could not be deleted" } });
	}
});

export default UserRouter;
