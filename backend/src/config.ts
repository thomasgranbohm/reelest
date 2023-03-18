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
				bitrate: 45000,
				height: 2160,
			},
			{
				bitrate: 16000,
				height: 1440,
			},
			{
				bitrate: 8000,
				height: 1080,
			},
			{
				bitrate: 5000,
				height: 720,
			},
			{
				bitrate: 2500,
				height: 480,
			},
			{
				bitrate: 1000,
				height: 360,
			},
			{
				bitrate: 500,
				height: 240,
			},
		],
	},
	jsonwebtoken: {
		secret: process.env.JWT_SECRET || "abcdefgh01234567",
	},
	upload: {
		dest: process.env.UPLOAD_DIR || "/tmp/uploads",
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
			title: Joi.string().min(2).max(64).required(),
		},
	},
};

export default config;
