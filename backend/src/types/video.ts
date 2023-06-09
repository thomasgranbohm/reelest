import { VideoStatus } from "@prisma/client";

export interface VideoCreateBody {
	description?: string;
	title: string;
}

export interface VideoUpdateBody {
	description?: string;
	status?: VideoStatus;
	title?: string;
}

export interface Quality {
	bitrate: number;
	height: number;
	width: number;
}
