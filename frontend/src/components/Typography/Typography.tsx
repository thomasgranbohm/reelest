import { createElement, FC, ReactHTML } from "react";
import clsx from "clsx";

import {
	ColorTypes,
	WeightTypes,
	WithChildren,
	WithClassname,
} from "types/components";

interface TypographyProps extends WithChildren, WithClassname {
	color?: ColorTypes;
	type?: Extract<keyof ReactHTML, "span" | "p">;
	weight?: WeightTypes;
}

const Typography: FC<TypographyProps> = ({
	children,
	className,
	color,
	type = "p",
	weight,
}) => {
	const colors: Record<ColorTypes, string> = {
		accent: "text-accent",
		background: "text-background",
		foreground: "text-foreground",
	};

	const weights: Record<WeightTypes, string> = {
		bold: "font-bold",
		medium: "font-medium",
		normal: "font-normal",
		semibold: "font-semibold",
	};

	return createElement(
		type,
		{
			className: clsx(
				color && colors[color],
				weight && weights[weight],
				className
			),
		},
		children
	);
};

export default Typography;
