import { FC } from "react";
import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";

import DateDisplay from "components/DateDisplay";
import TimeDisplay from "components/TimeDisplay";
import { WithClassname } from "types/components";
import { IVideo } from "types/video";
import getVideoThumbnail from "utils/getVideoThumbnail";

const VideoPreview: FC<VideoPreviewProps> = ({
	className,
	createdAt,
	duration,
	id,
	thumbnails,
	title,
	user,
	...video
}) => {
	const base64 = thumbnails.find(({ type }) => type === "BASE64");

	return (
		<div className="flex w-full flex-col">
			<Link
				href={`/video/${id}`}
				className={clsx(
					"group relative inline-block w-full",
					className
				)}
			>
				{thumbnails && thumbnails.length > 0 && base64 ? (
					<Image
						src={getVideoThumbnail({ id, thumbnails }, 1280)}
						alt={`Thumbnail for ${title}`}
						className="aspect-video w-full rounded-md object-contain transition-shadow group-hover:shadow-xl"
						width={1920}
						height={1080}
						placeholder="blur"
						blurDataURL={base64?.url}
					/>
				) : (
					<div className="flex aspect-video w-full items-center justify-center rounded-md bg-gray-100 object-contain p-4 transition-shadow group-hover:shadow-xl">
						<p aria-hidden>Thumbnail not available</p>
					</div>
				)}
				<div className="absolute bottom-2 right-2 w-min rounded-md bg-black bg-opacity-70 p-1 text-xs font-medium text-white">
					<TimeDisplay value={duration} />
				</div>
			</Link>
			<div className="mt-2 flex items-start justify-start ">
				<Link href={`/users/${user.username}`} className="group/user">
					<Image
						src={`/api${user.profilePictures.small.url}`}
						alt={`Profile picture for ${user.username}`}
						width={user.profilePictures.small.width}
						height={user.profilePictures.small.height}
						className="h-12 w-12 rounded-full"
					/>
				</Link>
				<div className="ml-2 flex flex-col items-start justify-center">
					<Link href={`/video/${id}`} className="group">
						<b className="group-hover:underline">{title}</b>
					</Link>
					<Link
						href={`/users/${user.username}`}
						className="group/user"
					>
						<p className="text-sm group-hover/user:underline">
							{user.displayName}
						</p>
					</Link>
					<DateDisplay
						className="text-sm"
						date={createdAt}
						relative
					/>
				</div>
			</div>
		</div>
	);
};

interface VideoPreviewProps extends WithClassname, IVideo {}

export default VideoPreview;
