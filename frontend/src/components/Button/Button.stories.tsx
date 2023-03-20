import React from "react";
import { ComponentMeta, ComponentStory } from "@storybook/react";

import Button from "./Button";

export default {
	component: Button,
	title: "Button",
} as ComponentMeta<typeof Button>;

export const Primary: ComponentStory<typeof Button> = (props) => (
	<Button {...props} />
);
