import React from "react";
import { ComponentMeta, ComponentStory } from "@storybook/react";

import TimeDisplay from "./TimeDisplay";

export default {
	component: TimeDisplay,
	title: "TimeDisplay",
} as ComponentMeta<typeof TimeDisplay>;

export const Primary: ComponentStory<typeof TimeDisplay> = (props) => (
	<TimeDisplay {...props} />
);
