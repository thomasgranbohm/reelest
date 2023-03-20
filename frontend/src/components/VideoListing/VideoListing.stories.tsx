import React from "react";
import { ComponentMeta, ComponentStory } from "@storybook/react";

import VideoListing from "./VideoListing";

export default {
	component: VideoListing,
	title: "VideoListing",
} as ComponentMeta<typeof VideoListing>;

export const Primary: ComponentStory<typeof VideoListing> = (props) => (
	<VideoListing {...props} />
);
