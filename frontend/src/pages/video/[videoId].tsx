import { privateAPI } from "api";
import { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Link from "next/link";

import DateDisplay from "components/DateDisplay";
import { Column, Row } from "components/Grid";
import Heading from "components/Heading";
import Layout from "components/Layout";
import VideoPlayer from "components/VideoPlayer";
import { IVideo } from "types/video";

const VideoPage: NextPage<VideoPageProps> = ({ video }) => {
	const { description, title, user } = video;

	return (
		<Layout>
			<Row>
				<Column xl={9}>
					<VideoPlayer video={video} />
					<div className="mt-4 flex items-center justify-between">
						<Heading type="h2">{title}</Heading>
						<DateDisplay date={video.createdAt} relative />
					</div>
					<div className="mt-4 flex flex-col items-start justify-start">
						<Link
							className="inline-block hover:underline"
							href={`/user/${user.username}`}
						>
							<b>{user.displayName}</b>
						</Link>
						<p>{user._count.followedBy} followers</p>
					</div>
					<div className="mt-4">
						<p>{description}</p>
					</div>
				</Column>
			</Row>
		</Layout>
	);
};

interface VideoPageProps {
	video: IVideo;
}

export const getStaticProps: GetStaticProps<
	VideoPageProps,
	{ videoId: string }
> = async ({ params }) => {
	if (!params) {
		throw new Error("Params is empty");
	}

	const { data } = await privateAPI.get<{ data: { video: IVideo } }>(
		`/videos/${params.videoId}`
	);

	return {
		props: data.data,
	};
};

export const getStaticPaths: GetStaticPaths = async () => {
	const { data } = await privateAPI.get<{ data: IVideo[] }>("/videos");

	return {
		fallback: "blocking",
		paths: data.data.map(({ id }) => ({ params: { videoId: id } })),
	};
};

export default VideoPage;
