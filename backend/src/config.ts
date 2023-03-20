import Joi from "joi";

const config = {
	bcrypt: { saltRounds: 10 },
	database: {
		host: process.env.DATABASE_HOST || "127.0.0.1",
		name: process.env.DATABASE_NAME || "reeler",
		pass: process.env.DATABASE_PASS || "example",
		port: process.env.DATABASE_PORT || 27017,
		user: process.env.DATABASE_USER || "root",
	},
	express: {
		ip: "127.0.0.1",
		port: process.env.PORT || 1337,
	},
	ffmpeg: {
		qualities: [
			{
				bitrate: 34000,
				height: 2160,
				width: 3840,
			},
			{
				bitrate: 13000,
				height: 1440,
				width: 2560,
			},
			{
				bitrate: 6000,
				height: 1080,
				width: 1920,
			},
			{
				bitrate: 4000,
				height: 720,
				width: 1280,
			},
			{
				bitrate: 2000,
				height: 480,
				width: 854, // Non 16:9
			},
			{
				bitrate: 1000,
				height: 360,
				width: 640,
			},
			{
				bitrate: 700,
				height: 240,
				width: 426, // Non 16:9
			},
		],
	},
	jsonwebtoken: {
		secret: process.env.JWT_SECRET || "abcdefgh01234567",
	},
	upload: {
		dest: process.env.UPLOAD_DIR || "/tmp/uploads",
		image_mimetypes: ["image/png", "image/jpeg"],
		video_mimetypes: ["video/mp4"],
	},
	validation: {
		user: {
			displayName: Joi.string()
				.pattern(
					/^(?=.{4,48}$)(?!.*[ -]{2})[a-zA-Z][a-zA-Z0-9 -]*[a-zA-Z0-9]$/
				)
				.required(),
			email: Joi.string()
				.email({
					minDomainSegments: 2,
					tlds: { allow: ["com", "dev", "test", "net", "xyz"] },
				})
				.trim()
				.required(),
			password: Joi.string()
				.pattern(new RegExp("^[a-zA-Z0-9]{3,30}$"))
				.required(),
			username: Joi.string()
				.min(3)
				.max(30)
				.pattern(/^[a-zA-Z0-9_-]{3,30}$/)
				.required(),
		},
		video: {
			description: Joi.string(),
			status: Joi.alternatives(["CREATED", "PUBLISHED"]),
			title: Joi.string().min(2).max(64),
		},
	},
};

export default config;
