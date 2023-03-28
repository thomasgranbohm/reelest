export type IImageTypes = "WEBP" | "BASE64";

export interface IImage {
	height: number;
	type: IImageTypes;
	url: string;
	width: number;
}

export type IImageFormats = Record<
	"base64" | "large" | "medium" | "small",
	IImage
>;

export interface IVideo {
	createdAt: string;
	description?: string;
	duration: number;
	id: string;
	threads: Array<IThread>;
	thumbnails: Array<IImage>;
	title: string;
	user: IUser;
}

export interface IUser {
	_count: {
		followedBy: number;
	};
	displayName: string;
	id: string;
	profilePictures: IImageFormats;
	username: string;
}

export interface IThread {
	content: string;
	id: string;
	replies: IComment[];
	user: IUser;
	users: Record<string, IUser>;
}

export interface IComment {
	content: string;
	id: string;
	replyToId: string | null;
	username: string;
}
