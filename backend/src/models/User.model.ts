import mongoose, { Schema } from "mongoose";
import validator from "validator";

import { IUserSchema } from "types/user.js";

export const UserSchema = new Schema<IUserSchema>(
	{
		email: {
			required: true,
			trim: true,
			type: "string",
			unique: true,
			validate: validator.isEmail,
		},
		password: {
			required: true,
			trim: true,
			type: "string",
			validate: /^[a-zA-Z0-9]{3,30}$/g,
		},
		username: {
			max: 30,
			min: 3,
			required: true,
			trim: true,
			type: "string",
			unique: true,
			validate: validator.isAlphanumeric,
		},
	},
	{ timestamps: true }
);

const UserModel = mongoose.model("User", UserSchema);

export default UserModel;
