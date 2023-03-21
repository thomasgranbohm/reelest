import multer from "multer";

import config from "../config";

export const VideoUpload = multer({
	dest: config.upload.dest + "/videos",
	fileFilter: (_, file, cb) =>
		cb(null, config.upload.video_mimetypes.includes(file.mimetype)),
});

export const ImageUpload = multer({
	dest: config.upload.dest + "/images",
	fileFilter: (_, file, cb) =>
		cb(null, config.upload.image_mimetypes.includes(file.mimetype)),
});
