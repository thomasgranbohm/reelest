import React from "react";
import { ComponentMeta, ComponentStory } from "@storybook/react";

import Icon from "./Icon";

export default {
	component: Icon,
	title: "Icon",
} as ComponentMeta<typeof Icon>;

export const Primary: ComponentStory<typeof Icon> = (props) => (
	<Icon {...props} />
);
