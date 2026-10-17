import { createContext, createUniqueId, Show, useContext } from "solid-js"
import type { JSX } from "solid-js"
import Checkmark from "@carbon/icons/es/checkmark/16"
import { Icon } from "../../icons/Icon"
import { createControllable, createId } from "../../internal/control"
import { LABEL } from "../../internal/styles"

/** Carbon's StructuredList: rows of related values, ruled apart, with no box
 *  around them.
 *
 *  It is the answer to the thing every prototype draws and no other component
 *  covers — a label on the left and its value on the right, repeated down a
 *  panel. A Table would be wrong: a table has a header row, vertical rules and an
 *  outer border, and these lists have none of the three. A definition list marked
 *  up by hand is what quarry had instead, six times over.
 *
 *  With `selection` the rows become one radio group: press a row to choose it.
 *  Each row is a `<label>` around a real radio input, so the arrow keys move the
 *  choice and assistive tech counts the options, with no ARIA written here. The
 *  chosen row inverts to ink, as a chosen RadioTile and a selected table row do.
 */

type ListContextValue = {
	rowClass: () => string
	selection: () => boolean
	name: () => string
	value: () => string | undefined
	select: (value: string) => void
}

const ListContext = createContext<ListContextValue>()

export type StructuredListProps = {
	/** Required: the list has no visible caption, so this is its whole name. */
	"aria-label": string
	/** Carbon's isCondensed. Halves the row padding for a dense readout. */
	isCondensed?: boolean
	/** Carbon's isFlush. Drops the side padding so the rules run edge to edge —
	 *  which they must inside a Tile that already pads its body. */
	isFlush?: boolean
	/** Carbon's selection: one row can be chosen. Give each body row a `value`. */
	selection?: boolean
	/** The radio group's name. Generated when left off. */
	name?: string
	/** The chosen row. Controlled when given. */
	value?: string
	defaultValue?: string
	class?: string
	children?: JSX.Element
	onChange?: (value: string) => void
}

export function StructuredListWrapper(props: StructuredListProps) {
	const name = createId("structured-list", () => props.name)
	const [value, setValue] = createControllable(
		() => props.value,
		props.defaultValue,
		() => props.onChange,
	)

	// Padding travels to the rows through context rather than through a custom
	// property, so the whole component stays in Tailwind utilities. A selection
	// list is never flush: its rows are pressed, and a pressed thing needs an
	// inset for its ground to show past the text.
	const ctx: ListContextValue = {
		rowClass: () =>
			`${props.isCondensed ? "py-tight" : "py-gap"} ${
				props.isFlush && !props.selection ? "px-0" : "px-2"
			}`,
		selection: () => props.selection ?? false,
		name,
		value,
		select: (next) => {
			setValue(next)
			props.onChange?.(next)
		},
	}

	return (
		<ListContext.Provider value={ctx}>
			<div
				role="table"
				aria-label={props["aria-label"]}
				class={`w-full text-body ${props.class ?? ""}`}
			>
				{props.children}
			</div>
		</ListContext.Provider>
	)
}

export function StructuredListHead(props: { children?: JSX.Element }) {
	return <div role="rowgroup">{props.children}</div>
}

export function StructuredListBody(props: { children?: JSX.Element }) {
	return <div role="rowgroup">{props.children}</div>
}

export type StructuredListRowProps = {
	/** Carbon's head. Marks the row as column headers rather than data. */
	head?: boolean
	/** In a `selection` list: what choosing this row sets the list's value to. */
	value?: string
	disabled?: boolean
	class?: string
	children?: JSX.Element
}

/** Dividers are ink and run the full width of the list. The last row carries
 *  none, so a list inside a ruled panel does not double its neighbour's rule. */
export function StructuredListRow(props: StructuredListRowProps) {
	const ctx = useContext(ListContext)
	if (!ctx) throw new Error("StructuredListRow must be used inside a StructuredListWrapper")

	const id = `structured-row-${createUniqueId()}`
	const selectable = () => ctx.selection() && !props.head && props.value !== undefined
	const selected = () => selectable() && ctx.value() === props.value

	return (
		<Show
			when={selectable()}
			fallback={
				<div
					role="row"
					class={`flex items-baseline gap-2 border-b-2 border-ink last:border-b-0
						${ctx.rowClass()} ${props.class ?? ""}`}
				>
					{props.children}
					{
						/* A head row in a selection list keeps a blank the width of the tick,
					    so its columns stay over the body's. */
					}
					<Show when={ctx.selection()}>
						<span role="presentation" class="w-4 shrink-0" />
					</Show>
				</div>
			}
		>
			<label
				role="row"
				for={id}
				class={`flex cursor-pointer items-baseline gap-2 border-b-2 border-ink last:border-b-0
					transition-colors
					pointer-coarse:min-h-touch
					has-[:focus-visible]:outline-2 has-[:focus-visible]:-outline-offset-2
					${
					selected()
						? "on-ink bg-ink text-white has-[:focus-visible]:outline-white"
						: "hover:bg-gray has-[:focus-visible]:outline-ink"
				}
					${props.disabled ? "cursor-not-allowed opacity-40" : ""}
					${ctx.rowClass()} ${props.class ?? ""}`}
			>
				{props.children}
				<input
					id={id}
					type="radio"
					class="sr-only"
					name={ctx.name()}
					value={props.value}
					checked={selected()}
					disabled={props.disabled}
					onChange={() => ctx.select(props.value ?? "")}
				/>
				{/* The tick holds its place when unchosen, so choosing never reflows the row. */}
				<span role="presentation" class={`shrink-0 self-center ${selected() ? "" : "invisible"}`}>
					<Icon glyph={Checkmark} size={16} />
				</span>
			</label>
		</Show>
	)
}

export type StructuredListCellProps = {
	/** Carbon's head. Small, bold and uppercase, as every column header is here. */
	head?: boolean
	/** Carbon's noWrap. */
	noWrap?: boolean
	/** Takes only the width it needs and sits at the row's trailing edge, right
	 *  aligned. The label/value lists the prototypes draw are one flexible label
	 *  and one tight value, not two equal columns. */
	trailing?: boolean
	class?: string
	children?: JSX.Element
}

export function StructuredListCell(props: StructuredListCellProps) {
	// Which cell gives way when a row is too narrow for both. The label never
	// breaks inside a word — "slug" became "slu / g" once the type grew — so it
	// holds its longest word and the value is the one that wraps. A `noWrap` cell
	// opts out of all of that: it truncates, which needs a zero minimum.
	const shape = () => {
		if (props.noWrap) return `min-w-0 truncate ${props.trailing ? "shrink-0 text-right" : "flex-1"}`
		return props.trailing ? "min-w-0 break-words text-right" : "min-w-min flex-1 break-words"
	}

	return (
		<Show
			when={props.head}
			fallback={
				<div role="cell" class={`${shape()} ${props.class ?? ""}`}>
					{props.children}
				</div>
			}
		>
			<div
				role="columnheader"
				class={`${shape()} ${LABEL} ${props.class ?? ""}`}
			>
				{props.children}
			</div>
		</Show>
	)
}
