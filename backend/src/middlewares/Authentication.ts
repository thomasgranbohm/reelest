import { RequestHandler } from "express";

import { ForbiddenError, UnauthorizedError } from "helpers/Error.helper.js";

import getTokenString from "lib/getTokenString.js";

import { verifyToken } from "services/JWT.js";

const Authentication: RequestHandler = async (req, res, next) => {
	const token = getTokenString(req);

	if (token === null) {
		throw UnauthorizedError();
	}

	const { error } = await verifyToken(token);

	if (error) {
		throw ForbiddenError();
	}

	req.auth = { token };

	return next();
};

export default Authentication;
