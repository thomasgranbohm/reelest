interface TokenSchema {
	id: string;
}

declare namespace Express {
	interface Request {
		auth: {
			payload: TokenSchema;
			token: string;
		};
		pagination: {
			skip: number;
			take: number;
		};
	}
}
