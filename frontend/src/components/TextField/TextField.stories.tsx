import React from "react";
import { ComponentMeta, ComponentStory } from "@storybook/react";

import TextField from "./TextField";

export default {
	component: TextField,
	title: "TextField",
} as ComponentMeta<typeof TextField>;

export const Primary: ComponentStory<typeof TextField> = (props) => (
	<TextField
		{...props}
		label="Email"
		type="email"
		placeholder="john.doe@example.com"
		description="This is a description of the email field"
		errorMessage="Please enter a valid email address"
		isRequired
	/>
);
