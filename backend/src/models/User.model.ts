import mongoose, { Schema } from "mongoose";
import validator from "validator";

import { IUserSchema } from "types/user.js";

export const UserSchema = new Schema<IUserSchema>({
	username: {
		type: "string",
		required: true,
		unique: true,
		min: 3,
		max: 30,
		trim: true,
		validate: validator.isAlphanumeric,
	},
	email: {
		type: "string",
		trim: true,
		required: true,
		unique: true,
		validate: validator.isEmail,
	},
	password: {
		type: "string",
		required: true,
		trim: true,
		validate: /^[a-zA-Z0-9]{3,30}$/g,
	},
});

const UserModel = mongoose.model("User", UserSchema);

export default UserModel;
