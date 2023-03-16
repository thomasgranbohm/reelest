const config = {
	express: {
		ip: "127.0.0.1",
		port: process.env.PORT || 1337,
	},
	database: {
		host: process.env.DATABASE_HOST || "127.0.0.1",
		port: process.env.DATABASE_PORT || 27017,
		user: process.env.DATABASE_USER || "root",
		pass: process.env.DATABASE_PASS || "example",
		name: process.env.DATABASE_NAME || "reeler",
	},
	jsonwebtoken: {
		secret: process.env.JWT_SECRET || "abcdefgh01234567",
	},
	upload: {
		dest: process.env.UPLOAD_DIR || "/tmp/uploads",
		video_mimetypes: ["video/mp4"],
	},
};

export default config;
