export interface LoginValidationSchema {
	identifier: string;
	password: string;
}

export interface RegisterValidationSchema {
	confirmPassword: string;
	displayName: string;
	email: string;
	password: string;
	username: string;
}
