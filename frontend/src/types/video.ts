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
	thumbnails: Array<IImage>;
	title: string;
	user: {
		_count: {
			followedBy: number;
		};
		displayName: string;
		profilePictures: IImageFormats;
		username: string;
	};
}
