import React from "react";
import { ComponentMeta, ComponentStory } from "@storybook/react";

import Layout from "./Layout";

export default {
	component: Layout,
	title: "Layout",
} as ComponentMeta<typeof Layout>;

export const Primary: ComponentStory<typeof Layout> = (props) => (
	<Layout {...props} />
);
