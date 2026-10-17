import type { JSX } from "solid-js"
import { Dynamic } from "solid-js/web"

/** Carbon's spacing steps, 1 to 13. */
export type StackGap = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13

/** Carbon's scale is 2, 4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 96 and 160px.
 *  Every step maps to the same length here but the fourth: 12px is three
 *  quarter-rems, which the even-number rule has no class for, so it takes the
 *  system's own `gap` token (10px), the nearest thing on the grid. */
const GAP: Record<StackGap, string> = {
	1: "gap-rule",
	2: "gap-tight",
	3: "gap-2",
	4: "gap-gap",
	5: "gap-4",
	6: "gap-6",
	7: "gap-8",
	8: "gap-10",
	9: "gap-12",
	10: "gap-16",
	11: "gap-20",
	12: "gap-24",
	13: "gap-40",
}

export type StackProps = {
	gap?: StackGap
	orientation?: "vertical" | "horizontal"
	as?: "div" | "ul" | "ol" | "section" | "nav"
	class?: string
	children?: JSX.Element
}

/** Carbon's Stack: children in a line, a fixed step apart. */
export function Stack(props: StackProps) {
	return (
		<Dynamic
			component={props.as ?? "div"}
			class={`flex ${props.orientation === "horizontal" ? "flex-row" : "flex-col"} ${
				GAP[props.gap ?? 5]
			} ${props.class ?? ""}`}
		>
			{props.children}
		</Dynamic>
	)
}

export function HStack(props: Omit<StackProps, "orientation">) {
	return <Stack {...props} orientation="horizontal" />
}

export function VStack(props: Omit<StackProps, "orientation">) {
	return <Stack {...props} orientation="vertical" />
}
