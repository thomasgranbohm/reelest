export interface IUserSchema {
	username: string;
	email: string;
	password: string;
}

export interface LoginValidationSchema {
	identifier: string;
	password: string;
}

export interface RegisterValidationSchema {
	email: string;
	username: string;
	password: string;
	confirm_password: string;
}
