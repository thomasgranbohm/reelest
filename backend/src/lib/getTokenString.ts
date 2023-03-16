import { Request } from "express";
import validator from "validator";

/**
 * **Unsafe:** Does not verify JWT
 * @param req {express.Request}
 * @returns {(string | null)}
 */
const getTokenString = (req: Request): string | null => {
	const authHeader = req.get("authorization");

	if (authHeader) {
		const [type, credentials] = authHeader.split(" ");

		if (type === "Bearer" && validator.isJWT(credentials)) {
			return credentials;
		}
	}

	return null;
};

export default getTokenString;
