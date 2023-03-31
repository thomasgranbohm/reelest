import { RequestHandler } from "express";

import config from "../config";
import { ForbiddenError, UnauthorizedError } from "../lib/errors";
import PromiseHandler from "../lib/PromiseHandler";

const TranscoderAuthentication: RequestHandler = PromiseHandler(
	async (req, _, next) => {
		const secret = req.header("X-Transcoder-Secret");

		if (secret === null) {
			throw UnauthorizedError();
		}

		if (secret !== config.ffmpeg.secret) {
			throw ForbiddenError();
		}

		return next();
	}
);

export default TranscoderAuthentication;
