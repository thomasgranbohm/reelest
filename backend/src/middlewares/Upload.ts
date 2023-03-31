import multer from "multer";
import path from "path";

import config from "../config";

export const VideoUpload = multer({
	dest: path.join(config.upload.dest, "/videos"),
	fileFilter: (_, file, cb) =>
		cb(null, config.upload.video_mimetypes.includes(file.mimetype)),
});

export const ImageUpload = multer({
	dest: path.join(config.upload.dest, "/images"),
	fileFilter: (_, file, cb) =>
		cb(null, config.upload.image_mimetypes.includes(file.mimetype)),
});
