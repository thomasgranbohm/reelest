import React from "react";
import { ComponentMeta, ComponentStory } from "@storybook/react";

import FocusRing from "./FocusRing";

export default {
	component: FocusRing,
	title: "FocusRing",
} as ComponentMeta<typeof FocusRing>;

export const Primary: ComponentStory<typeof FocusRing> = (props) => (
	<FocusRing {...props} />
);
