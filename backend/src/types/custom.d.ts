interface TokenSchema {
	_id: string;
	email: string;
	username: string;
}

declare namespace Express {
	interface Request {
		auth: {
			payload: TokenSchema;
			token: string;
		};
		pagination: {
			limit: number;
			offset: number;
		};
	}
}
