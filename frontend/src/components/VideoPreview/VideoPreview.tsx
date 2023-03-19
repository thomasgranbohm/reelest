import { FC } from "react";
import Image from "next/image";
import Link from "next/link";

const VideoPreview: FC<VideoPreviewProps> = ({
	id,
	thumbnailUrl,
	title,
	user,
}) => {
	return (
		<Link href={`/video/${id}`} className="block w-72">
			<div className="flex flex-col">
				<div className="group w-full">
					<Image
						src={thumbnailUrl}
						alt={`Thumbnail for ${title}`}
						className="aspect-video w-full rounded-md object-contain transition-shadow group-hover:shadow-md"
						width={480}
						height={270}
					/>
					<p className="text-bold mt-2 group-hover:underline">
						<b>{title}</b>
					</p>
				</div>
				<Link
					href={`/user/${user.username}`}
					className="hover:underline"
				>
					<p>{user.displayName}</p>
				</Link>
			</div>
		</Link>
	);
};

interface VideoPreviewProps {
	id: string;
	thumbnailUrl: string;
	title: string;
	user: {
		displayName: string;
		username: string;
	};
}

export default VideoPreview;
