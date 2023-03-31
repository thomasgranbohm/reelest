import { VideoStatus } from "@prisma/client";
import { Router } from "express";
import Joi from "joi";

import config from "../config";
import prisma from "../database/client";
import { MalformedBodyError } from "../lib/errors";
import PromiseHandler from "../lib/PromiseHandler";
import TranscoderAuthentication from "../middlewares/TranscoderAuthentication";

const TranscoderRouter = Router();

TranscoderRouter.post(
	"/update-status",
	TranscoderAuthentication,
	PromiseHandler(async (req, res) => {
		const { error, value } = Joi.object<{
			duration: number;
			id: string;
			status: VideoStatus;
		}>({
			duration: Joi.number().required(),
			id: config.validation.generic.objectId.required(),
			status: config.validation.video.status.required(),
		}).validate(req.body);

		if (error) {
			throw MalformedBodyError();
		}

		await prisma.video.update({
			data: { duration: value.duration, status: value.status },
			where: { id: value.id },
		});

		return res.send("OK");
	})
);

export default TranscoderRouter;
