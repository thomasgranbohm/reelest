import { FC } from "react";
import useSWR from "swr";

import Heading from "components/Heading";
import RepliesContainer from "components/RepliesContainer";
import WithUserLink from "components/WithUserLink";
import { VideoThreadsResponse } from "types/backend";

const ThreadsContainer: FC<ThreadsContainerProps> = ({ videoId }) => {
	const fetcher = (input: RequestInfo | URL) =>
		fetch(input).then((res) => res.json());
	const { data, error, isLoading } = useSWR<{
		data: VideoThreadsResponse;
	}>(`/api/comments/${videoId}`, fetcher);

	return (
		<div className="mt-4">
			<Heading type="h2" look="h5">
				Comments
			</Heading>
			{isLoading && <p>Loading...</p>}
			{error && <p>Unable to fetch comments</p>}
			{data && (
				<div className="mt-4">
					{data.data.threads.map((thread) => (
						<div key={thread.id} className="my-4">
							<WithUserLink user={data.data.users[thread.userId]}>
								<p>{thread.content}</p>
							</WithUserLink>
							<RepliesContainer
								videoId={videoId}
								threadId={thread.id}
							/>
						</div>
					))}
				</div>
			)}
		</div>
	);
};

interface ThreadsContainerProps {
	videoId: string;
}

export default ThreadsContainer;
