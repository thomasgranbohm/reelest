import { ImageType } from "@prisma/client";
import Joi from "joi";

const config = {
	bcrypt: { saltRounds: 10 },
	database: {
		host: process.env.DATABASE_HOST || "127.0.0.1",
		name: process.env.DATABASE_NAME || "reelest",
		pass: process.env.DATABASE_PASS || "example",
		port: process.env.DATABASE_PORT || 27017,
		user: process.env.DATABASE_USER || "root",
	},
	express: {
		host: "localhost",
		port: process.env.PORT || 1337,
		proto: "http",
	},
	ffmpeg: {
		profiles: {
			base64: { size: 16, type: ImageType.BASE64 },
			large: { size: 800, type: ImageType.WEBP },
			medium: { size: 240, type: ImageType.WEBP },
			small: { size: 88, type: ImageType.WEBP },
		},
		secret: process.env.TRANSCODER_SECRET,
		thumbnails: [
			{
				height: 720,
				type: ImageType.WEBP,
				width: 1280,
			},
			{
				height: 480,
				type: ImageType.WEBP,
				width: 640,
			},
			{
				height: 360,
				type: ImageType.WEBP,
				width: 480,
			},
			{
				height: 180,
				type: ImageType.WEBP,
				width: 320,
			},
			{
				height: 90,
				type: ImageType.WEBP,
				width: 120,
			},
			{
				height: 12,
				type: ImageType.BASE64,
				width: 16,
			},
		],
	},
	jsonwebtoken: {
		secret: process.env.JWT_SECRET || "abcdefgh01234567",
	},
	media: {
		dir: process.env.MEDIA_DIR || "/media",
		users_dir: "/users",
		videos_dir: "/videos",
	},
	upload: {
		dest: process.env.UPLOAD_DIR || "/uploads",
		image_mimetypes: ["image/png", "image/jpeg"],
		video_mimetypes: ["video/mp4"],
	},
	validation: {
		comment: {
			content: Joi.string().min(1).max(180),
			replyToId: Joi.string(),
		},
		generic: {
			objectId: Joi.string()
				.length(36)
				.regex(
					/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i
				),
		},
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
