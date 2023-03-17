import { Types } from "mongoose";

export interface IUserSchema {
	display_name: string;
	email: string;
	followers: Types.DocumentArray<IUserSchema>;
	following: Types.DocumentArray<IUserSchema>;
	password: string;
	username: string;
}

export interface LoginValidationSchema {
	identifier: string;
	password: string;
}

export interface RegisterValidationSchema {
	confirm_password: string;
	display_name: string;
	email: string;
	password: string;
	username: string;
}
