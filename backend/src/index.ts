import * as dotenv from "dotenv";
dotenv.config();

import cors from "cors";
import express, { NextFunction, Response } from "express";
import mongoose from "mongoose";

import { CustomError } from "helpers/Error.helper.js";

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

// Error handling
server.use((err, _, res: Response, next: NextFunction) => {
	if ("status" in err && "message" in err) {
		const { status, ...error } = err as CustomError;

		return res.status(status).send({ error });
	}

	next(err);
});

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
