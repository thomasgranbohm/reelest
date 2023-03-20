export interface IVideo {
	description?: string;
	id: string;
	thumbnail: string;
	title: string;
	user: {
		displayName: string;
		username: string;
	};
}
