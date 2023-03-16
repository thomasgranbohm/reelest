import { JwtPayload } from "jsonwebtoken";

export interface TokenSchema {
	_id: string;
	email: string;
	username: string;
}

export type TokenPayload = TokenSchema &
	Pick<JwtPayload, "iss" | "sub" | "aud" | "exp" | "nbf" | "iat" | "jti">;
