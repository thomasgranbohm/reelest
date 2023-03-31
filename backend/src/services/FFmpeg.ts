import { ImageType } from "@prisma/client";
import path from "path";
import sharp, { ResizeOptions } from "sharp";

import config from "../config";
import { Dimension, Thumbnail } from "../types/thumbnail";

interface Option extends Dimension, Omit<ResizeOptions, "width" | "height"> {}

export const generateThumbnail = (source: string, option: Option) => {
	return sharp(source).resize({ fit: "contain", ...option });
};

export const generateBase64Thumbnail = async (
	source: string,
	option: Option
): Promise<Thumbnail> => {
	const buffer = await generateThumbnail(source, option).jpeg().toBuffer();

	const { height, width } = option;

	return {
		height,
		type: ImageType.BASE64,
		url: "data:image/jpeg;base64," + Buffer.from(buffer).toString("base64"),
		width,
	};
};

export const generateWebPThumbnail = async (
	source: string,
	option: Option,
	destination: string
): Promise<Thumbnail> => {
	await generateThumbnail(source, option).webp().toFile(destination);

	const { height, width } = option;

	return {
		height,
		type: "WEBP",
		url: destination,
		width,
	};
};

export const generateVideoThumbnails = async (
	source: string,
	destination: string
) => {
	const applicableFormats = config.ffmpeg.thumbnails.slice();

	const thumbnails = await Promise.all(
		applicableFormats.map(({ type, ...dimension }) =>
			type === ImageType.WEBP
				? generateWebPThumbnail(
						source,
						dimension,
						path.resolve(
							destination,
							`thumbnail-${dimension.width}p.webp`
						)
						// eslint-disable-next-line no-mixed-spaces-and-tabs
				  )
				: generateBase64Thumbnail(source, dimension)
		)
	);

	return thumbnails;
};

export const generateProfilePictures = async (
	source: string,
	destination: string
) => {
	const pictures = await Promise.all(
		Object.values(config.ffmpeg.profiles).map(({ size, type }) => {
			const dimension = { height: size, width: size };

			if (type === ImageType.WEBP) {
				return generateWebPThumbnail(
					source,
					{ ...dimension, fit: "cover" },
					path.resolve(destination, `profile-${size}p.webp`)
				);
			}

			return generateBase64Thumbnail(source, dimension);
		})
	);

	return pictures;
};
