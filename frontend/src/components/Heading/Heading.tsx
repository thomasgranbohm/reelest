import { createElement, FC } from "react";
import clsx from "clsx";

import {
	ColorTypes,
	HeadingTypes,
	WithChildren,
	WithClassname,
} from "types/components";

interface HeadingProps extends WithChildren, WithClassname {
	color?: ColorTypes;
	look?: HeadingTypes;
	type: HeadingTypes;
}

const Heading: FC<HeadingProps> = ({
	children,
	className,
	color,
	look,
	type,
}) => {
	const colors: Record<ColorTypes, string> = {
		accent: "text-accent",
		background: "text-background",
		foreground: "text-foreground",
	};

	const fontSizes: Record<HeadingTypes, string> = {
		b: "text-base",
		h1: "text-6xl",
		h2: "text-4xl",
		h3: "text-3xl",
		h4: "text-2xl",
		h5: "text-xl",
		h6: "text-lg",
	};

	return createElement(
		type,
		{
			className: clsx(
				"mt-4",
				fontSizes[look || type],
				color && colors[color],
				className
			),
		},
		children
	);
};

export default Heading;
