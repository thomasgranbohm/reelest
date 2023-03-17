import { Types } from "mongoose";

export interface IUserSchema {
	displayName: string;
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
	confirmPassword: string;
	displayName: string;
	email: string;
	password: string;
	username: string;
}
