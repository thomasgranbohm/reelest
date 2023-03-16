import { RequestHandler } from "express";

import getTokenString from "lib/getTokenString.js";

import { verifyToken } from "services/JWT.js";

const Authentication: RequestHandler = (req, res, next) => {
	const token = getTokenString(req);

	if (token === null) {
		return res.status(401).send({ error: { message: "Unauthorized" } });
	}

	try {
		verifyToken(token);

		req.auth = { token };

		return next();
	} catch (error) {
		console.error(error);

		return res.status(403).send({ error: { message: "Forbidden" } });
	}
};

export default Authentication;
