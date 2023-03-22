import { FC } from "react";

import { Column, Row } from "components/Grid";
import Heading from "components/Heading";
import VideoPreview from "components/VideoPreview";
import { IVideo } from "types/video";

const VideoListing: FC<VideoListingProps> = ({ label, videos }) => {
	return (
		<Row>
			<Column>
				{label && <Heading type="h2">{label}</Heading>}
				<div className="mt-4 overflow-x-hidden">
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
						{videos.map((video, i) => (
							<VideoPreview key={i} {...video} />
						))}
					</div>
				</div>
			</Column>
		</Row>
	);
};

interface VideoListingProps {
	label?: string;
	videos: IVideo[];
}

export default VideoListing;
