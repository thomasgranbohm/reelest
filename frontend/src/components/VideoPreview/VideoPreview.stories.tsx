import React from "react";
import { ComponentMeta, ComponentStory } from "@storybook/react";

import VideoPreview from "./VideoPreview";

export default {
	component: VideoPreview,
	title: "VideoPreview",
} as ComponentMeta<typeof VideoPreview>;

export const Primary: ComponentStory<typeof VideoPreview> = (props) => (
	<VideoPreview
		{...props}
		id="abcdefgh01234567"
		thumbnail="https://placekitten.com/480/270"
		title="Test video"
		user={{ displayName: "John Doe", username: "johndoe" }}
	/>
);
