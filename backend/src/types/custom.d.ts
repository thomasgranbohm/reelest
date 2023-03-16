declare namespace Express {
	interface Request {
		auth: {
			token: string;
		};
		pagination: {
			limit: number;
			offset: number;
		};
	}
}
