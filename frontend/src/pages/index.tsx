import { Fragment } from "react";
import { privateAPI } from "api";
import type { GetServerSideProps, NextPage } from "next";

import Heading from "components/Heading";

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
	const { data } = await privateAPI.get("/videos");

	return {
		props: data,
	};
};

const Home: NextPage = (props) => {
	return (
		<Fragment>
			<Heading type="h1">Hello, World!</Heading>
			<pre>
				<code>{JSON.stringify(props, null, 4)}</code>
			</pre>
		</Fragment>
	);
};

export default Home;
