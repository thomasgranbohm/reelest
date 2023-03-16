import jwt, { VerifyErrors } from "jsonwebtoken";

import { TokenPayload, TokenSchema } from "types/jsonwebtoken.js";

import config from "../config.js";

export const decodeToken = async (token: string) => {
	const payload = await jwt.decode(token, { json: true });

	if (payload === null) {
		throw new Error("Token payload is null");
	}

	return payload as unknown as TokenPayload;
};

export const signToken = async (payload: TokenSchema) => {
	return jwt.sign(payload, config.jsonwebtoken.secret, {
		algorithm: "HS256",
	});
};

export const verifyToken = (token: string) => {
	return jwt.verify(token, config.jsonwebtoken.secret, {
		algorithms: ["HS256"],
	});
};
