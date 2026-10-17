import type { JSX } from "solid-js"
import { Dynamic } from "solid-js/web"

export type ContentProps = {
	/** `main-content` unless given, which is where `SkipToContent` points. */
	id?: string
	/** The element it is. `main`, unless the page already has one. */
	tagName?: "main" | "div" | "section" | "article"
	class?: string
	children?: JSX.Element
}

/** Carbon's Content: the page, as the shell holds it.
 *
 *  It takes whatever room the header and the side nav leave. Carbon insets it by
 *  their fixed sizes; here they are not fixed, so there is nothing to inset —
 *  and no padding either, since what a page's edges are is the page's to say.
 */
export function Content(props: ContentProps) {
	return (
		<Dynamic
			component={props.tagName ?? "main"}
			id={props.id ?? "main-content"}
			class={`min-h-0 min-w-0 flex-1 ${props.class ?? ""}`}
		>
			{props.children}
		</Dynamic>
	)
}
