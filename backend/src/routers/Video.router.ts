import { Router } from "express";

import VideoController from "controllers/Video.controller.js";

import Authentication from "middlewares/Authentication.js";
import Pagination from "middlewares/Pagination.js";
import { VideoUpload } from "middlewares/Upload.js";

const VideoRouter = Router();

// Get videos
VideoRouter.get("/", Pagination, VideoController.getVideos);

// Get video
VideoRouter.get("/:id/:slug", VideoController.getVideo);

// Get video stream
VideoRouter.get(
	"/:id/:slug/stream/:stream(master.m3u8|stream_[0-9]+/(data[0-9]+.ts|stream.m3u8))",
	VideoController.getVideoStream
);

// Create video
VideoRouter.post(
	"/",
	Authentication,
	VideoUpload.single("file"),
	VideoController.createVideo
);

// Update video
VideoRouter.put("/:id/:slug", Authentication, VideoController.updateVideo);

// Delete video
VideoRouter.delete("/:id/:slug", Authentication, VideoController.deleteVideo);

export default VideoRouter;
