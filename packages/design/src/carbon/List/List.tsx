import { createContext, useContext } from "solid-js"
import type { JSX } from "solid-js"

type ListKind = "ordered" | "unordered"

/** What kind of list an item is in, and how deeply nested that list is. */
const ListContext = createContext<{ kind: ListKind; depth: number }>()

export type ListProps = {
	/** Carbon's nested: this list sits inside an item of another. Set for you
	 *  when it is, so it rarely needs passing. */
	nested?: boolean
	/** Carbon's isExpressive: a size up, for editorial pages. */
	isExpressive?: boolean
	class?: string
	children?: JSX.Element
}

function list(kind: ListKind, props: ListProps, parent: { depth: number } | undefined) {
	const depth = parent ? parent.depth + 1 : 0
	const nested = props.nested ?? depth > 0

	const body = <ListContext.Provider value={{ kind, depth }}>{props.children}</ListContext.Provider>
	const cls = `m-0 flex list-none flex-col gap-tight p-0 ${nested ? "mt-tight" : ""} ${
		props.isExpressive ? "text-figure" : "text-body"
	} ${props.class ?? ""}`

	// A fresh counter per list, so a nested ordered list starts again at its own
	// first item instead of carrying on from its parent's number.
	return kind === "ordered"
		? <ol class={`${cls} [counter-reset:item]`}>{body}</ol>
		: <ul class={cls}>{body}</ul>
}

/** Carbon's UnorderedList. An en dash at the top level, as in Carbon, and a
 *  small square beneath it — the two marks a mono face draws cleanly. */
export function UnorderedList(props: ListProps) {
	return list("unordered", props, useContext(ListContext))
}

/** Carbon's OrderedList. Numbers at the top level, letters beneath. */
export function OrderedList(props: ListProps) {
	return list("ordered", props, useContext(ListContext))
}

/** The marker, drawn by the item rather than by the browser: a native marker
 *  cannot be given a fixed column, and in a mono face the marks and the text
 *  should sit on the same grid. */
const MARKER: Record<ListKind, [top: string, nested: string]> = {
	unordered: ["before:content-['–']", "before:content-['▪']"],
	ordered: [
		"[counter-increment:item] before:content-[counter(item)_'.']",
		"[counter-increment:item] before:content-[counter(item,lower-alpha)_'.']",
	],
}

export function ListItem(props: { class?: string; children?: JSX.Element }) {
	const ctx = useContext(ListContext)
	if (!ctx) throw new Error("ListItem must be used inside an OrderedList or UnorderedList")

	return (
		<li
			class={`relative pl-6 before:absolute before:left-0 before:tabular-nums ${
				MARKER[ctx.kind][ctx.depth > 0 ? 1 : 0]
			} ${props.class ?? ""}`}
		>
			{props.children}
		</li>
	)
}
