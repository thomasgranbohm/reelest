export interface IUserSchema {
	email: string;
	password: string;
	username: string;
}

export interface LoginValidationSchema {
	identifier: string;
	password: string;
}

export interface RegisterValidationSchema {
	confirm_password: string;
	email: string;
	password: string;
	username: string;
}
