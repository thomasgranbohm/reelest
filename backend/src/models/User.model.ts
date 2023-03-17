import bcrypt from "bcrypt";
import mongoose, { Schema } from "mongoose";
import validator from "validator";

import { IUserSchema } from "types/user.js";

import config from "../config.js";

export const UserSchema = new Schema<IUserSchema>(
	{
		displayName: {
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
		followers: [{ ref: "User", type: Schema.Types.ObjectId }],
		following: [{ ref: "User", type: Schema.Types.ObjectId }],
		password: {
			required: true,
			trim: true,
			type: "string",
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
	{
		timestamps: true,
	}
);

UserSchema.virtual("followerCount").get(function () {
	return this.followers.length;
});
UserSchema.virtual("followingCount").get(function () {
	return this.following.length;
});

UserSchema.pre("save", async function (next) {
	const _password = this.password.slice();

	this.password = await bcrypt.hash(_password, config.bcrypt.saltRounds);

	next();
});

const UserModel = mongoose.model("User", UserSchema);

export default UserModel;
