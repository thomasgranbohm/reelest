import { RequestHandler } from "express";

import { ForbiddenError, UnauthorizedError } from "lib/errors.js";
import getTokenString from "lib/getTokenString.js";
import PromiseHandler from "lib/PromiseHandler.js";

import { verifyToken } from "services/JWT.js";

const Authentication: RequestHandler = PromiseHandler(async (req, _, next) => {
	const token = getTokenString(req);

	if (token === null) {
		throw UnauthorizedError();
	}

	const { error, payload } = await verifyToken(token);

	if (error) {
		throw ForbiddenError();
	}

	// TODO: Only store userID in jwt token
	req.auth = { payload, token };

	return next();
});

export default Authentication;
