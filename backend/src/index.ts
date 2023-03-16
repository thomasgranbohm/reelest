import express from "express";
import mongoose from "mongoose";

import UserRouter from "routers/User.router.js";
import VideoRouter from "routers/Video.router.js";

import config from "./config.js";

const server = express();

server.use(express.json());

// Routers
server.use("/user", UserRouter);
server.use("/video", VideoRouter);

server.get("/", (req, res) => res.send("Hello, World!"));

const main = async () => {
	await mongoose.connect(
		`mongodb://${config.database.host}:${config.database.port}`,
		{
			user: config.database.user,
			appName: config.database.name,
			pass: config.database.pass,
		}
	);

	server.listen(config.express.port, () =>
		console.log(
			"Started at http://%s:%d",
			config.express.ip,
			config.express.port
		)
	);
};

main();
