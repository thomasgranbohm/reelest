import { Router } from "express";

import config from "../config";
import UserController from "../controllers/User.controller";
import Authentication from "../middlewares/Authentication";
import Pagination from "../middlewares/Pagination";
import { ImageUpload } from "../middlewares/Upload";

const UserRouter = Router();

// Authenticate user
UserRouter.post("/login", UserController.authenticateUser);

// Create user
UserRouter.post(
	"/register",
	ImageUpload.single("image"),
	UserController.createUser
);

// Update user
UserRouter.put(
	"/",
	Authentication,
	ImageUpload.single("image"),
	UserController.updateUser
);

// Delete user
UserRouter.delete("/", Authentication, UserController.deleteUser);

// Get user
UserRouter.get("/me", Authentication, (req, res, next) => {
	req.params.id = req.auth.payload.id;

	UserController.getUser(req, res, next);
});
UserRouter.get("/:username", UserController.getUser);

// Get following
UserRouter.get(
	"/me/followers",
	Authentication,
	Pagination,
	(req, res, next) => {
		req.params.id = req.auth.payload.id;

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
		req.params.id = req.auth.payload.id;

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
	req.params.id = req.auth.payload.id;

	UserController.getUserVideos(req, res, next);
});
UserRouter.get("/:username/videos", Pagination, UserController.getUserVideos);

// Get user profile picture
UserRouter.get(
	`/:username/pictures/:picture(${Object.values(config.ffmpeg.profiles)
		.map(({ size }) => `profile-${size}p.webp`)
		.join("|")})`,
	UserController.getUserProfilePicture
);

// Create follower
UserRouter.post(
	"/:username/follow",
	Authentication,
	UserController.createUserFollower
);

UserRouter.delete(
	"/:username/follow",
	Authentication,
	UserController.deleteUserFollower
);

export default UserRouter;
