import { ImageType } from "@prisma/client";

export interface Dimension {
	height: number;
	width: number;
}

export interface Thumbnail extends Dimension {
	type: ImageType;
	url: string;
}
