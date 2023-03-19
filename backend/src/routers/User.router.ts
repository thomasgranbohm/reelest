import { Router } from "express";

import UserController from "controllers/User.controller.js";

import prisma from "database/client.js";

import { NotFoundError } from "lib/Errors.js";
import PromiseHandler from "lib/PromiseHandler.js";

import Authentication from "middlewares/Authentication.js";
import Pagination from "middlewares/Pagination.js";

const UserRouter = Router();

// Get user
UserRouter.get(
	"/me",
	Authentication,
	PromiseHandler(async (req, res, next) => {
		const user = await prisma.user.findUnique({
			select: { username: true },
			where: { id: req.auth.payload.id },
		});

		if (!user) {
			throw NotFoundError();
		}

		req.params.username = user.username;

		UserController.getUser(req, res, next);
	})
);
UserRouter.get("/:username", UserController.getUser);

// Get following
UserRouter.get(
	"/me/followers",
	Authentication,
	Pagination,
	PromiseHandler(async (req, res, next) => {
		const user = await prisma.user.findUnique({
			select: { username: true },
			where: { id: req.auth.payload.id },
		});

		if (!user) {
			throw NotFoundError();
		}

		req.params.username = user.username;

		UserController.getUserFollowers(req, res, next);
	})
);
UserRouter.get(
	"/:username/followers",
	Pagination,
	UserController.getUserFollowers
);

// Get followers
UserRouter.get(
	"/me/following",
	Authentication,
	Pagination,
	PromiseHandler(async (req, res, next) => {
		const user = await prisma.user.findUnique({
			select: { username: true },
			where: { id: req.auth.payload.id },
		});

		if (!user) {
			throw NotFoundError();
		}

		req.params.username = user.username;

		UserController.getUserFollowing(req, res, next);
	})
);
UserRouter.get(
	"/:username/following",
	Pagination,
	UserController.getUserFollowing
);

// Get user videos
UserRouter.get(
	"/me/videos",
	Authentication,
	Pagination,
	PromiseHandler(async (req, res, next) => {
		const user = await prisma.user.findUnique({
			select: { username: true },
			where: { id: req.auth.payload.id },
		});

		if (!user) {
			throw NotFoundError();
		}

		req.params.username = user.username;

		UserController.getUserVideos(req, res, next);
	})
);
UserRouter.get("/:username/videos", Pagination, UserController.getUserVideos);

// Create follower
UserRouter.post(
	"/:username/follow",
	Authentication,
	UserController.createUserFollower
);

// Authenticate user
UserRouter.post("/login", UserController.authenticateUser);

// Create user
UserRouter.post("/register", UserController.createUser);

// Update user
UserRouter.put("/", Authentication, UserController.updateUser);

// Delete user
UserRouter.delete("/", Authentication, UserController.deleteUser);

export default UserRouter;
