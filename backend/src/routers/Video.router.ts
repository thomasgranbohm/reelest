import { Router } from "express";

import VideoController from "../controllers/Video.controller";
import Authentication from "../middlewares/Authentication";
import Pagination from "../middlewares/Pagination";
import { ImageUpload, VideoUpload } from "../middlewares/Upload";

const VideoRouter = Router();

// Get videos
VideoRouter.get("/", Pagination, VideoController.getVideos);

// Get video
VideoRouter.get("/:id", VideoController.getVideo);

// Get video stream
VideoRouter.get(
	"/:id/stream/:stream(playlist.m3u8|stream_[0-9]+/(data[0-9]+.ts|stream.m3u8))",
	VideoController.getVideoStream
);

VideoRouter.get(
	"/:id/thumbnails/:thumbnail(thumbnail-[0-9]{3,4}p.webp)",
	VideoController.getVideoThumbnail
);

// Create video
VideoRouter.post(
	"/",
	Authentication,
	VideoUpload.single("file"),
	VideoController.createVideo
);

// Update video
VideoRouter.put(
	"/:id",
	Authentication,
	ImageUpload.single("thumbnail"),
	VideoController.updateVideo
);

// Delete video
VideoRouter.delete("/:id", Authentication, VideoController.deleteVideo);

export default VideoRouter;
