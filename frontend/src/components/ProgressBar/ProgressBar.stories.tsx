import React from "react";
import { ComponentMeta, ComponentStory } from "@storybook/react";

import ProgressBar from "./ProgressBar";

export default {
	component: ProgressBar,
	title: "ProgressBar",
} as ComponentMeta<typeof ProgressBar>;

export const Primary: ComponentStory<typeof ProgressBar> = (props) => (
	<ProgressBar {...props} />
);
