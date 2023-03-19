import { ReactNode } from "react";

export interface WithClassname {
	className?: string;
}

export interface WithChildren {
	children: ReactNode;
}

export enum Breakpoint {
	sm = 640,
	md = 768,
	lg = 1024,
	xl = 1280,
	"2xl" = 1536,
}

export type BreakpointNames = keyof typeof Breakpoint;

// Heading
export type HeadingTypes = "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "b";

// Grid
export type Alignments =
	| "auto"
	| "start"
	| "end"
	| "center"
	| "stretch"
	| "baseline";
export type GapValues = "none" | "single" | "double";
export type Justifiers = "center" | "end" | "start";
export type Sizes = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
export type SizeProperty = Sizes | [Sizes, Sizes];

// Typography
export type ColorTypes = "foreground" | "background" | "accent";
export type WeightTypes = "normal" | "medium" | "semibold" | "bold";
