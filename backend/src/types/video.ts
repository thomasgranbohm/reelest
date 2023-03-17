import { Types } from "mongoose";

export enum VideoStatus {
	Created = "created",
	Processing = "processing",
	Published = "published",
}

export interface IVideoSchema {
	description?: string;
	id: string;
	mediaPath: string;
	slug: string;
	status: VideoStatus;
	title: string;
	user: Types.ObjectId;
}

export interface IVideoMethods {
	getMediaPath(...paths: string[]): string;
}

export interface VideoCreateBody {
	description?: string;
	slug: string;
	title: string;
}

export interface VideoUpdateBody {
	description: string;
	slug: string;
	title: string;
}
