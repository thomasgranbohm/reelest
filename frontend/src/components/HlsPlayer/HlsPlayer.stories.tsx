import React from "react";
import { ComponentMeta, ComponentStory } from "@storybook/react";

import HlsPlayer from "./HlsPlayer";

export default {
	component: HlsPlayer,
	title: "HlsPlayer",
} as ComponentMeta<typeof HlsPlayer>;

export const Primary: ComponentStory<typeof HlsPlayer> = (props) => (
	<HlsPlayer {...props} />
);
