import { FC } from "react";
import Link from "next/link";

import { Column, Row } from "components/Grid";
import Heading from "components/Heading";
import { WithChildren } from "types/components";

const Layout: FC<LayoutProps> = ({ children }) => {
	return (
		<main className="mx-auto max-w-full sm:max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl 2xl:max-w-screen-2xl">
			<Row>
				<Column>
					<Link href="/">
						<Heading type="h1">YomTube 2.0</Heading>
					</Link>
				</Column>
			</Row>
			{children}
		</main>
	);
};

interface LayoutProps extends WithChildren {
	// Remove me
}

export default Layout;
