import React from "react";
import { ComponentMeta, ComponentStory } from "@storybook/react";

import HLSPlayer from "./VideoPlayer";

export default {
	component: HLSPlayer,
	title: "VideoPlayer",
} as ComponentMeta<typeof HLSPlayer>;

export const Primary: ComponentStory<typeof HLSPlayer> = (props) => (
	<HLSPlayer {...props} />
);
