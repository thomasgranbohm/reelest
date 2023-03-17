import * as dotenv from "dotenv";
dotenv.config();

import cors from "cors";
import express from "express";
import mongoose from "mongoose";

import UserRouter from "routers/User.router.js";
import VideoRouter from "routers/Video.router.js";

import config from "./config.js";

const server = express();

server.use(cors());
server.use(express.json());
server.use(express.urlencoded({ extended: true }));

// Routers
server.use("/user", UserRouter);
server.use("/video", VideoRouter);

server.get("/", (_, res) => res.send("Hello, World!"));

const main = async () => {
	await mongoose.connect(
		`mongodb://${config.database.host}:${config.database.port}`,
		{
			appName: config.database.name,
			pass: config.database.pass,
			user: config.database.user,
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
