import { Types } from "mongoose";

export enum VideoStatus {
	Published = "published",
	Processing = "processing",
	Created = "created",
}

export interface IVideoSchema {
	id: string;
	title: string;
	slug: string;
	description?: string;
	user: Types.ObjectId;
	status: VideoStatus;
}

export interface VideoCreationBody {
	title: string;
	description?: string;
	slug: string;
}
