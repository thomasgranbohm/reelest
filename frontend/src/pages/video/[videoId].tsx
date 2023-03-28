import { privateAPI } from "api";
import { GetStaticPaths, GetStaticProps, NextPage } from "next";

import DateDisplay from "components/DateDisplay";
import { Column, Row } from "components/Grid";
import Heading from "components/Heading";
import Layout from "components/Layout";
import NumberDisplay from "components/NumberDisplay";
import Separator from "components/Separator";
import ThreadContainer from "components/ThreadsContainer";
import VideoPlayer from "components/VideoPlayer";
import WithUserLink from "components/WithUserLink";
import { IVideo } from "types/video";

const VideoPage: NextPage<VideoPageProps> = ({ video }) => {
	const { description, title, user } = video;

	return (
		<Layout>
			<Row>
				<Column xl={9}>
					<VideoPlayer video={video} />
					<Heading type="h1" look="h5" className="mt-4">
						{title}
					</Heading>
					<div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
						<WithUserLink user={user}>
							<p>
								<NumberDisplay
									style="decimal"
									notation="compact"
									value={user._count.followedBy}
								/>{" "}
								followers
							</p>
						</WithUserLink>
						<div className="flex items-center">
							<p>
								<NumberDisplay
									style="decimal"
									notation="compact"
									value={10}
								/>{" "}
								views
							</p>
							<Separator variant="dot" />
							<DateDisplay date={video.createdAt} relative />
						</div>
					</div>
					<div className="mt-4">
						<p>{description}</p>
					</div>
					<ThreadContainer videoId={video.id} />
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
