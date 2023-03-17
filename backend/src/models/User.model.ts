import bcrypt from "bcrypt";
import config from "config.js";
import mongoose, { Schema } from "mongoose";
import validator from "validator";

import { IUserSchema } from "types/user.js";

export const UserSchema = new Schema<IUserSchema>(
	{
		display_name: {
			match: /^(?=.{4,48}$)(?!.*[ -]{2})[a-zA-Z][a-zA-Z0-9 -]*[a-zA-Z0-9]$/,
			required: true,
			type: "string",
		},
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
			match: /^[a-zA-Z0-9_-]{3,30}$/,
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

UserSchema.pre("save", async function (next) {
	const _password = this.password.slice();

	this.password = await bcrypt.hash(_password, config.bcrypt.saltRounds);

	next();
});

const UserModel = mongoose.model("User", UserSchema);

export default UserModel;
