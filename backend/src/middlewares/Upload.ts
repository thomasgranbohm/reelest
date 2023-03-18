import multer from "multer";

import config from "config.js";

export const VideoUpload = multer({
	dest: config.upload.dest + "/videos",
	fileFilter: (_, file, cb) =>
		cb(null, config.upload.video_mimetypes.includes(file.mimetype)),
});
