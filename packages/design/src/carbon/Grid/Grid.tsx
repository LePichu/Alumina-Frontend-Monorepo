import type { JSX } from "solid-js"
import { Dynamic } from "solid-js/web"

export type GridProps = {
	/** Carbon's narrow: half the gutter. */
	narrow?: boolean
	/** Carbon's condensed: columns a single rule apart. */
	condensed?: boolean
	/** Carbon's fullWidth: no maximum width. */
	fullWidth?: boolean
	as?: "div" | "section" | "main" | "ul"
	class?: string
	children?: JSX.Element
}

/** Carbon's Grid: 4 columns on a phone, 8 on a tablet, 16 from there up.
 *
 *  Carbon's breakpoints are 672, 1056, 1312 and 1584px; these are Tailwind's
 *  768, 1024, 1280 and 1536, which are what every other breakpoint in the
 *  system already is. A Column's `md`, `lg`, `xlg` and `max` land on those.
 *
 *  Reach for it when a page really is a column grid. Most layouts in the apps
 *  are not — they are a lane, a stage and a lane — and for those a few flex or
 *  grid utilities on the container say more, with less.
 */
export function Grid(props: GridProps) {
	return (
		<Dynamic
			component={props.as ?? "div"}
			class={`grid w-full grid-cols-4 md:grid-cols-8 lg:grid-cols-16 ${
				props.condensed ? "gap-rule" : props.narrow ? "gap-x-4 gap-y-4" : "gap-x-8 gap-y-8"
			} ${props.fullWidth ? "" : "mx-auto max-w-396"} ${props.class ?? ""}`}
		>
			{props.children}
		</Dynamic>
	)
}

/** How wide a Column is at one breakpoint: a number of columns, or a span and
 *  the column it starts on. */
export type ColumnSpan = number | { span?: number; start?: number }

/** Every span and start, per breakpoint, written out. They cannot be built from
 *  a number at runtime — Tailwind only generates the classes it can read in the
 *  source — so each one is spelled here once. Column counts are structure, so
 *  the odd ones are allowed. */
const SPAN = {
	sm: ["", "col-span-1", "col-span-2", "col-span-3", "col-span-4"],
	md: [
		"",
		"md:col-span-1",
		"md:col-span-2",
		"md:col-span-3",
		"md:col-span-4",
		"md:col-span-5",
		"md:col-span-6",
		"md:col-span-7",
		"md:col-span-8",
	],
	lg: [
		"",
		"lg:col-span-1",
		"lg:col-span-2",
		"lg:col-span-3",
		"lg:col-span-4",
		"lg:col-span-5",
		"lg:col-span-6",
		"lg:col-span-7",
		"lg:col-span-8",
		"lg:col-span-9",
		"lg:col-span-10",
		"lg:col-span-11",
		"lg:col-span-12",
		"lg:col-span-13",
		"lg:col-span-14",
		"lg:col-span-15",
		"lg:col-span-16",
	],
	xlg: [
		"",
		"xl:col-span-1",
		"xl:col-span-2",
		"xl:col-span-3",
		"xl:col-span-4",
		"xl:col-span-5",
		"xl:col-span-6",
		"xl:col-span-7",
		"xl:col-span-8",
		"xl:col-span-9",
		"xl:col-span-10",
		"xl:col-span-11",
		"xl:col-span-12",
		"xl:col-span-13",
		"xl:col-span-14",
		"xl:col-span-15",
		"xl:col-span-16",
	],
	max: [
		"",
		"2xl:col-span-1",
		"2xl:col-span-2",
		"2xl:col-span-3",
		"2xl:col-span-4",
		"2xl:col-span-5",
		"2xl:col-span-6",
		"2xl:col-span-7",
		"2xl:col-span-8",
		"2xl:col-span-9",
		"2xl:col-span-10",
		"2xl:col-span-11",
		"2xl:col-span-12",
		"2xl:col-span-13",
		"2xl:col-span-14",
		"2xl:col-span-15",
		"2xl:col-span-16",
	],
} as const

const START = {
	sm: ["", "col-start-1", "col-start-2", "col-start-3", "col-start-4"],
	md: [
		"",
		"md:col-start-1",
		"md:col-start-2",
		"md:col-start-3",
		"md:col-start-4",
		"md:col-start-5",
		"md:col-start-6",
		"md:col-start-7",
		"md:col-start-8",
	],
	lg: [
		"",
		"lg:col-start-1",
		"lg:col-start-2",
		"lg:col-start-3",
		"lg:col-start-4",
		"lg:col-start-5",
		"lg:col-start-6",
		"lg:col-start-7",
		"lg:col-start-8",
		"lg:col-start-9",
		"lg:col-start-10",
		"lg:col-start-11",
		"lg:col-start-12",
		"lg:col-start-13",
		"lg:col-start-14",
		"lg:col-start-15",
		"lg:col-start-16",
	],
	xlg: [
		"",
		"xl:col-start-1",
		"xl:col-start-2",
		"xl:col-start-3",
		"xl:col-start-4",
		"xl:col-start-5",
		"xl:col-start-6",
		"xl:col-start-7",
		"xl:col-start-8",
		"xl:col-start-9",
		"xl:col-start-10",
		"xl:col-start-11",
		"xl:col-start-12",
		"xl:col-start-13",
		"xl:col-start-14",
		"xl:col-start-15",
		"xl:col-start-16",
	],
	max: [
		"",
		"2xl:col-start-1",
		"2xl:col-start-2",
		"2xl:col-start-3",
		"2xl:col-start-4",
		"2xl:col-start-5",
		"2xl:col-start-6",
		"2xl:col-start-7",
		"2xl:col-start-8",
		"2xl:col-start-9",
		"2xl:col-start-10",
		"2xl:col-start-11",
		"2xl:col-start-12",
		"2xl:col-start-13",
		"2xl:col-start-14",
		"2xl:col-start-15",
		"2xl:col-start-16",
	],
} as const

type Breakpoint = keyof typeof SPAN

function spanClass(at: Breakpoint, value: ColumnSpan | undefined): string {
	if (value === undefined) return ""
	const span = typeof value === "number" ? value : value.span
	const start = typeof value === "number" ? undefined : value.start
	return `${span !== undefined ? (SPAN[at][span] ?? "") : ""} ${
		start !== undefined ? (START[at][start] ?? "") : ""
	}`
}

export type ColumnProps = {
	/** Columns of the phone grid's four. Without any span a Column takes the
	 *  whole row. */
	sm?: ColumnSpan
	/** Of the tablet grid's eight. */
	md?: ColumnSpan
	/** Of sixteen, from 1024px. */
	lg?: ColumnSpan
	/** Of sixteen, from 1280px. */
	xlg?: ColumnSpan
	/** Of sixteen, from 1536px. */
	max?: ColumnSpan
	as?: "div" | "section" | "aside" | "li"
	class?: string
	children?: JSX.Element
}

/** One cell of a Grid. A narrower breakpoint's span carries up until a wider
 *  one overrides it, as in Carbon — so the whole-row default applies only where
 *  no span at or below that width was given. */
export function Column(props: ColumnProps) {
	const whole = () =>
		props.sm === undefined && props.md === undefined && props.lg === undefined &&
		props.xlg === undefined && props.max === undefined

	return (
		<Dynamic
			component={props.as ?? "div"}
			class={`min-w-0 ${whole() ? "col-span-full" : ""} ${spanClass("sm", props.sm)} ${
				spanClass("md", props.md)
			} ${spanClass("lg", props.lg)} ${spanClass("xlg", props.xlg)} ${spanClass("max", props.max)}
				${props.class ?? ""}`}
		>
			{props.children}
		</Dynamic>
	)
}
