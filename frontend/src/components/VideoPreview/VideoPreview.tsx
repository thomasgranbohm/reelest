import { FC } from "react";
import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";

import { WithClassname } from "types/components";
import getVideoThumbnail from "utils/getVideoThumbnail";

const VideoPreview: FC<VideoPreviewProps> = ({
	className,
	id,
	thumbnail,
	title,
	user,
}) => {
	return (
		<div className="inline-block w-full">
			<Link
				href={`/video/${id}`}
				className={clsx("group inline-block w-full", className)}
			>
				{thumbnail ? (
					<Image
						src={getVideoThumbnail({ id }, 1920)}
						alt={`Thumbnail for ${title}`}
						className="aspect-video w-full rounded-md object-contain transition-shadow group-hover:shadow-xl"
						width={1920}
						height={1080}
						placeholder="blur"
						blurDataURL={`data:image/jpeg;base64,${thumbnail}`}
					/>
				) : (
					<div className="flex aspect-video w-full items-center justify-center rounded-md bg-gray-100 object-contain p-4 transition-shadow group-hover:shadow-xl">
						<p aria-hidden>Thumbnail not available</p>
					</div>
				)}
				<p className="text-bold mt-2 group-hover:underline">
					<b>{title}</b>
				</p>
			</Link>
			<Link href={`/users/${user.username}`} className="hover:underline">
				{user.displayName}
			</Link>
		</div>
	);
};

interface VideoPreviewProps extends WithClassname {
	description?: string;
	id: string;
	thumbnail: string;
	title: string;
	user: {
		displayName: string;
		username: string;
	};
}

export default VideoPreview;
