import { FC } from "react";
import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";

import { WithChildren, WithClassname } from "types/components";
import { IUser } from "types/video";

const WithProfilePicture: FC<WithProfilePictureProps> = ({
	children,
	className,
	size,
	user,
}) => {
	const imageSizeClasses: Record<WithProfilePictureProps["size"], string> = {
		normal: "h-12 w-12",
		small: "h-8 w-8",
	};

	return (
		<div
			className={clsx(
				"group mt-2 flex items-start justify-start",
				className
			)}
		>
			<Link href={`/user/${user.username}`}>
				<div className="pr-2">
					<Image
						className={clsx(imageSizeClasses[size], "rounded-full")}
						src={"/api" + user.profilePictures.small.url}
						width={user.profilePictures.small.width}
						height={user.profilePictures.small.height}
						alt={`Profile picture for ${user.displayName}`}
					/>
				</div>
			</Link>
			<div className="flex flex-col items-start justify-start">
				{children}
			</div>
		</div>
	);
};

interface WithProfilePictureProps extends WithChildren, WithClassname {
	size: "normal" | "small";
	user: IUser;
}

export default WithProfilePicture;
