import { createContext, useContext } from "solid-js"
import type { JSX } from "solid-js"
import { Dynamic } from "solid-js/web"
import { LABEL } from "../../internal/styles"

type Level = 1 | 2 | 3 | 4 | 5 | 6

/** The level a Heading renders at. Outside any Section it is 1. */
const LevelContext = createContext<Level>(1)

/** How each level speaks. The top two are display type; from the third down
 *  they are the label voice at shrinking sizes, which is what every panel and
 *  tile heading in the apps already is. Whole strings, one per level, so no two
 *  type utilities ever meet in a class list. */
const HEADING: Record<Level, string> = {
	1: "text-headline font-bold",
	2: "text-brand font-bold",
	3: "text-figure font-bold tracking-tight",
	4: "text-body font-bold",
	5: "text-label font-bold uppercase",
	6: `${LABEL}`,
}

export type SectionProps = {
	/** Sets the level outright instead of stepping down one from the parent. */
	level?: Level
	/** The element to render. A `section` by default. */
	as?: "section" | "div" | "article" | "aside" | "main" | "nav"
	class?: string
	children?: JSX.Element
}

/** Carbon's Section: a region whose Headings are one level below its parent's.
 *
 *  It exists so that a component can contain a heading without knowing how deep
 *  on the page it will be used. Nest Sections and the outline comes out right.
 */
export function Section(props: SectionProps) {
	const parent = useContext(LevelContext)
	const level = (): Level => props.level ?? (Math.min(parent + 1, 6) as Level)

	return (
		<LevelContext.Provider value={level()}>
			<Dynamic component={props.as ?? "section"} class={props.class}>
				{props.children}
			</Dynamic>
		</LevelContext.Provider>
	)
}

/** Carbon's Heading: an `h1`–`h6` at whatever level its Sections make it. */
export function Heading(props: { class?: string; children?: JSX.Element }) {
	const level = useContext(LevelContext)

	return (
		<Dynamic component={`h${level}`} class={`m-0 ${HEADING[level]} ${props.class ?? ""}`}>
			{props.children}
		</Dynamic>
	)
}
