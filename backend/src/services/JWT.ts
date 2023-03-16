import jwt from "jsonwebtoken";
import { decode } from "punycode";

import { TokenPayload, TokenSchema } from "types/jsonwebtoken.js";

import config from "../config.js";

export const decodeToken = (token: string) => {
	const payload = jwt.decode(token, { json: true });

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

export async function verifyToken(token: string): Promise<{ error?: string }> {
	return new Promise((res) =>
		jwt.verify(
			token,
			config.jsonwebtoken.secret,
			{
				algorithms: ["HS256"],
			},
			(error) => {
				if (error) return res({ error: error.message });
				return res({});
			}
		)
	);
}
