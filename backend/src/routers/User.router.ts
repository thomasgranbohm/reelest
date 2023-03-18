import { Router } from "express";

import UserController from "controllers/User.controller.js";

import Authentication from "middlewares/Authentication.js";
import Pagination from "middlewares/Pagination.js";

const UserRouter = Router();

// Get user
UserRouter.get("/me", Authentication, (req, res, next) => {
	req.params.username = req.auth.payload.username;

	UserController.getUser(req, res, next);
});
UserRouter.get("/:username", UserController.getUser);

// Get following
UserRouter.get(
	"/me/followers",
	Authentication,
	Pagination,
	(req, res, next) => {
		req.params.username = req.auth.payload.username;

		UserController.getUserFollowers(req, res, next);
	}
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
	(req, res, next) => {
		req.params.username = req.auth.payload.username;

		UserController.getUserFollowing(req, res, next);
	}
);
UserRouter.get(
	"/:username/following",
	Pagination,
	UserController.getUserFollowing
);

// Get user videos
UserRouter.get("/me/videos", Authentication, Pagination, (req, res, next) => {
	req.params.username = req.auth.payload.username;

	UserController.getUserVideos(req, res, next);
});
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

// Delete user
UserRouter.delete("/", Authentication, UserController.deleteUser);

export default UserRouter;
