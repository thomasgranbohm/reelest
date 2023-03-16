import { RequestHandler } from "express";

import getTokenString from "lib/getTokenString.js";

import { verifyToken } from "services/JWT.js";

const Authentication: RequestHandler = async (req, res, next) => {
	const token = getTokenString(req);

	if (token === null) {
		return res.status(401).send({ error: { message: "Unauthorized" } });
	}

	const { error } = await verifyToken(token);

	if (error) {
		return res.status(403).send({ error: { message: "Forbidden" } });
	}

	req.auth = { token };

	return next();
};

export default Authentication;
