import { privateAPI } from "api";
import type { GetServerSideProps, NextPage } from "next";

import Layout from "components/Layout";
import VideoListing from "components/VideoListing";
import { IVideo } from "types/video";

export const getServerSideProps: GetServerSideProps<
	HomePageData
> = async () => {
	const { data } = await privateAPI.get<{ data: IVideo[] }>("/videos");

	return {
		props: {
			videos: data.data,
		},
	};
};

const Home: NextPage<HomePageData> = (props) => {
	const { videos } = props;

	return (
		<Layout>
			<VideoListing videos={videos} label="Latest videos" />
		</Layout>
	);
};

interface HomePageData {
	videos: IVideo[];
}

export default Home;
