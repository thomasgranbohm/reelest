import { JwtPayload } from "jsonwebtoken";

export interface TokenSchema {
	id: string;
}

export type TokenPayload = TokenSchema &
	Pick<JwtPayload, "iss" | "sub" | "aud" | "exp" | "nbf" | "iat" | "jti">;
