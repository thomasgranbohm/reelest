import * as dotenv from "dotenv";
dotenv.config();

import cors from "cors";
import express, { NextFunction, Request, Response } from "express";

import config from "config.js";

import prisma from "database/client.js";

import { CustomError } from "lib/Errors.js";

import UserRouter from "routers/User.router.js";
import VideoRouter from "routers/Video.router.js";

const server = express();

server.use(cors());
server.use(express.json());
server.use(express.urlencoded({ extended: true }));

// Routers
server.use("/user", UserRouter);
server.use("/video", VideoRouter);

server.get("/", (_, res) => res.send("Hello, World!"));

// Error handling
server.use((err: unknown, _: Request, res: Response, next: NextFunction) => {
	if (err instanceof CustomError) {
		const { status, ...error } = err;

		return res.status(status).send({ error });
	}

	next(err);
});

const main = async () => {
	await prisma.$connect();

	server.listen(config.express.port, () =>
		console.log(
			"Started at http://%s:%d",
			config.express.ip,
			config.express.port
		)
	);
};

main()
	.then(async () => {
		await prisma.$disconnect();
	})
	.catch(async (e) => {
		console.error(e);

		await prisma.$disconnect();

		process.exit(1);
	});
