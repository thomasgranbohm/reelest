import { FC } from "react";
import useSWR from "swr";

import WithUserLink from "components/WithUserLink";
import { ThreadRepliesResponse } from "types/backend";

const RepliesContainer: FC<RepliesContainerProps> = ({ threadId, videoId }) => {
	const fetcher = (input: RequestInfo | URL) =>
		fetch(input).then((res) => res.json());
	const { data, error, isLoading } = useSWR<{
		data: ThreadRepliesResponse;
	}>(`/api/comments/${videoId}/${threadId}`, fetcher);

	return (
		<div className="ml-12">
			{data &&
				data.data.comments.map((comment) => (
					<div key={comment.id} className="my-4">
						<WithUserLink user={data.data.users[comment.userId]}>
							<p>{comment.content}</p>
						</WithUserLink>
					</div>
				))}
		</div>
	);
};

interface RepliesContainerProps {
	threadId: string;
	videoId: string;
}

export default RepliesContainer;
