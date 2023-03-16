import { Document, Types } from "mongoose";

export type MongooseSchema<T> = Document<unknown, unknown, T> &
	Omit<
		T & {
			_id: Types.ObjectId;
		},
		never
	>;
