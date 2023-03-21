export interface IVideo {
	createdAt: string;
	description?: string;
	id: string;
	thumbnails: {
		height: number;
		type: "WEBP" | "BASE64";
		url: string;
		width: number;
	}[];
	title: string;
	user: {
		_count: {
			followedBy: number;
		};
		displayName: string;
		username: string;
	};
}
