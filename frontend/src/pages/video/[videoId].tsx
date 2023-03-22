import { privateAPI } from "api";
import { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Image from "next/image";
import Link from "next/link";

import DateDisplay from "components/DateDisplay";
import { Column, Row } from "components/Grid";
import Heading from "components/Heading";
import Layout from "components/Layout";
import Separator from "components/Separator";
import VideoPlayer from "components/VideoPlayer";
import { IVideo } from "types/video";

const VideoPage: NextPage<VideoPageProps> = ({ video }) => {
	const { description, title, user } = video;

	return (
		<Layout>
			<Row>
				<Column xl={9}>
					<VideoPlayer video={video} />
					<Heading type="h2" look="h4" className="mt-4">
						{title}
					</Heading>
					<div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
						<Link
							href={`/users/${user.username}`}
							className="group/user"
						>
							<div className="flex items-start justify-start">
								<Image
									src={`/api${user.profilePictures.small.url}`}
									alt={`Profile picture for ${user.username}`}
									width={user.profilePictures.small.width}
									height={user.profilePictures.small.height}
									className="h-12 w-12 rounded-full"
								/>
								<div className="ml-2 flex flex-col items-start justify-center">
									<b className="group-hover/user:underline">
										{user.displayName}
									</b>
									<p>{user._count.followedBy} followers</p>
								</div>
							</div>
						</Link>
						<div className="flex items-center">
							<p>10 views</p>
							<Separator variant="dot" />
							<DateDisplay date={video.createdAt} relative />
						</div>
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
