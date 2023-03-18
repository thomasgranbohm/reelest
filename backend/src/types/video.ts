export enum VideoStatus {
	Created = "CREATED",
	Processing = "PROCESSING",
	Published = "PUBLISHED",
}

export interface VideoCreateBody {
	description?: string;
	title: string;
}

export interface VideoUpdateBody {
	description?: string;
	title: string;
}
