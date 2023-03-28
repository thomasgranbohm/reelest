export type ImageTypes = "WEBP" | "BASE64";

export interface Image {
	height: number;
	type: ImageTypes;
	url: string;
	width: number;
}

export type ImageFormats = Record<
	"base64" | "large" | "medium" | "small",
	Image
>;

export interface User {
	_count: {
		followedBy: number;
	};
	displayName: string;
	id: string;
	profilePictures: ImageFormats;
	username: string;
}

interface ThreadBase {
	content: string;
	createdAt: Date;
	id: string;
	userId: string;
}

interface CommentBase {
	content: string;
	id: string;
	replyToId: string | null;
	userId: string;
}

export interface VideoThreadsResponse {
	threads: Array<ThreadBase>;
	users: Record<string, User>;
}

export interface ThreadRepliesResponse {
	comments: Array<CommentBase>;
	users: Record<string, User>;
}
