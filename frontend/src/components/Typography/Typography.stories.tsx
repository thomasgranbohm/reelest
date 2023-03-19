import React from "react";
import { ComponentMeta, ComponentStory } from "@storybook/react";

import Typography from "./Typography";

export default {
	argTypes: {
		color: {
			control: "select",
			options: ["foreground", "background", "accent"],
		},
		type: {
			control: "select",
			options: ["p", "span"],
		},
		weight: {
			control: "select",
			options: ["normal", "medium", "semi-bold", "bold"],
		},
	},
	args: {
		children:
			"Lorem ipsum dolor sit amet consectetur adipisicing elit. Eaque ab nulla deleniti officiis ut et inventore, provident assumenda vel ea magni esse vitae doloribus, ratione pariatur, dolore eum beatae enim?",
	},
	component: Typography,
	title: "Typography",
} as ComponentMeta<typeof Typography>;

export const Primary: ComponentStory<typeof Typography> = (props) => (
	<Typography {...props} />
);
