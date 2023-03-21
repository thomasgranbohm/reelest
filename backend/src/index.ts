import * as dotenv from "dotenv";
dotenv.config();

import cors from "cors";
import express, { NextFunction, Request, Response } from "express";

import prisma from "./database/client";
import { CustomError } from "./lib/errors";
import UserRouter from "./routers/User.router";
import VideoRouter from "./routers/Video.router";
import config from "./config";

const server = express();

server.use(cors());
server.use(express.json());
server.use(express.urlencoded({ extended: true }));

// Routers
server.use("/users", UserRouter);
server.use("/videos", VideoRouter);

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
			config.express.host,
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
