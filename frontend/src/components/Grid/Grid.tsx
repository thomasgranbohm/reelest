import { FC } from "react";
import clsx from "clsx";

import {
	Alignments,
	BreakpointNames,
	Justifiers,
	SizeProperty,
	Sizes,
	WithChildren,
	WithClassname,
} from "types/components";

import classes from "./Grid.module.scss";

type BreakpointMappings = {
	[breakpoint in BreakpointNames]?: SizeProperty;
};

interface ColumnProps extends WithChildren, WithClassname, BreakpointMappings {
	align?: Alignments;
	justify?: Justifiers;
}

export const Column: FC<ColumnProps> = ({
	align,
	children,
	className,
	justify,
	...breakpoints
}) => {
	const getClass = ([label, s]: [string, SizeProperty]) =>
		(Array.isArray(s) ? [widths[s[0]], offsets[s[1]]] : [widths[s]]).map(
			(a) => `${label}:${a}`
		);

	const alignments: Record<Alignments, string> = {
		auto: "self-auto",
		baseline: "self-baseline",
		center: "self-center",
		end: "self-end",
		start: "self-start",
		stretch: "self-strech",
	};

	const justifiers: Record<Justifiers, string> = {
		center: "flex flex-col align-center",
		end: "flex flex-col align-end",
		start: "flex flex-col align-start",
	};

	const offsets: Record<Sizes, string> = {
		1: "ml-1/12",
		10: "ml-10/12",
		11: "ml-11/12",
		12: "ml-12/12",
		2: "ml-2/12",
		3: "ml-3/12",
		4: "ml-4/12",
		5: "ml-5/12",
		6: "ml-6/12",
		7: "ml-7/12",
		8: "ml-8/12",
		9: "ml-9/12",
	};

	const widths: Record<Sizes, string> = {
		1: "w-1/12",
		10: "w-10/12",
		11: "w-11/12",
		12: "w-12/12",
		2: "w-2/12",
		3: "w-3/12",
		4: "w-4/12",
		5: "w-5/12",
		6: "w-6/12",
		7: "w-7/12",
		8: "w-8/12",
		9: "w-9/12",
	};

	return (
		<div
			className={clsx(
				classes["column"],
				"w-full pl-4",
				Object.entries(breakpoints).flatMap(getClass),
				align && alignments[align],
				justify && justifiers[justify],
				className
			)}
		>
			{children}
		</div>
	);
};

interface RowProps extends WithChildren, WithClassname {}

export const Row: FC<RowProps> = ({ children, className }) => {
	return (
		<div
			className={clsx(
				classes["row"],
				"mx-auto mt-4 flex h-min flex-wrap pr-4",
				className
			)}
		>
			{children}
		</div>
	);
};

export default Row;
