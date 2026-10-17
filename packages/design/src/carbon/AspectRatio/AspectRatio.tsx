import type { JSX } from "solid-js"
import { Dynamic } from "solid-js/web"

export type Ratio = "16x9" | "9x16" | "2x1" | "1x2" | "4x3" | "3x4" | "3x2" | "2x3" | "1x1"

/** Ratios describe a shape, not a length, so their odd terms are structure —
 *  the same exception `grid-cols-3` is. */
const RATIO: Record<Ratio, string> = {
	"16x9": "aspect-[16/9]",
	"9x16": "aspect-[9/16]",
	"2x1": "aspect-[2/1]",
	"1x2": "aspect-[1/2]",
	"4x3": "aspect-[4/3]",
	"3x4": "aspect-[3/4]",
	"3x2": "aspect-[3/2]",
	"2x3": "aspect-[2/3]",
	"1x1": "aspect-square",
}

export type AspectRatioProps = {
	ratio?: Ratio
	as?: "div" | "figure" | "section"
	class?: string
	children?: JSX.Element
}

/** Carbon's AspectRatio: a box that keeps its proportions as its width changes. */
export function AspectRatio(props: AspectRatioProps) {
	return (
		<Dynamic
			component={props.as ?? "div"}
			class={`relative ${RATIO[props.ratio ?? "1x1"]} ${props.class ?? ""}`}
		>
			{props.children}
		</Dynamic>
	)
}
