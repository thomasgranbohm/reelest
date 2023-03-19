import React from "react";
import { ComponentMeta, ComponentStory } from "@storybook/react";

import Heading from "components/Heading";

import { Column, Row } from "./Grid";

export default {
	component: Row,
	title: "Grid",
} as ComponentMeta<typeof Row>;

export const Primary: ComponentStory<typeof Row> = () => (
	<Row>
		<Column md={6} lg={[4, 2]}>
			Lorem ipsum dolor sit amet consectetur adipisicing elit. Laborum
			amet officiis id laudantium quaerat ipsa perferendis quisquam qui,
			totam veniam placeat error dolor labore ratione, expedita autem
			dolores nulla quidem?
		</Column>
		<Column md={6} lg={4}>
			Lorem ipsum dolor, sit amet consectetur adipisicing elit. Impedit
			voluptates quis natus recusandae repudiandae sint dicta rerum?
			Quibusdam, culpa facilis nesciunt ad eligendi veniam, laborum quae,
			nihil cum labore itaque.
		</Column>
	</Row>
);

export const GridInGrid: ComponentStory<typeof Row> = () => (
	<Row>
		<Column>
			<Heading type="h1">Hello, world!</Heading>
			<Row>
				<Column sm={6}>test</Column>
				<Column sm={6}>test2</Column>
			</Row>
		</Column>
	</Row>
);
