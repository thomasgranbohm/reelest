import { FC } from "react";
import Link from "next/link";

import WithProfilePicture from "components/WithProfilePicture";
import { User } from "types/backend";
import { WithChildren, WithClassname } from "types/components";

const WithUserLink: FC<WithUserLinkProps> = ({ children, className, user }) => {
	return (
		<WithProfilePicture className={className} size="normal" user={user}>
			<Link href={`/user/${user.username}`} className="hover:underline">
				<b>{user.displayName}</b>
			</Link>
			{children}
		</WithProfilePicture>
	);
};

interface WithUserLinkProps extends WithChildren, WithClassname {
	user: User;
}

export default WithUserLink;
