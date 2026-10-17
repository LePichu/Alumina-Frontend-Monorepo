import { children, createContext, createUniqueId, Show, useContext } from "solid-js"
import type { JSX } from "solid-js"
import ArrowDown from "@carbon/icons/es/arrow--down/16"
import ArrowUp from "@carbon/icons/es/arrow--up/16"
import ArrowsVertical from "@carbon/icons/es/arrows--vertical/16"
import ChevronDown from "@carbon/icons/es/chevron--down/16"
import { Icon } from "../../icons/Icon"
import { RadioMark } from "../../internal/marks"
import { Scroller } from "../../internal/scroll"
import { BOX, LABEL } from "../../internal/styles"
import { Checkbox } from "../Checkbox/Checkbox"

/** Carbon's table parts. `DataTable` (in DataTable.tsx) is the stateful wrapper
 *  that drives them — sorting, selection, expansion, batch actions — but every
 *  part here also stands on its own, which is how kiln's reply tables and the
 *  charts' "Show as table" use them. */

export type TableSize = "xs" | "sm" | "md" | "lg" | "xl"

type TableContextValue = { size: () => TableSize; sticky: () => boolean }

/** A default rather than `undefined`: a cell rendered outside a Table still
 *  draws at the default density instead of throwing. */
const STANDALONE: TableContextValue = { size: () => "md", sticky: () => false }

const TableContext = createContext<TableContextValue>(STANDALONE)

/** Row density. Padding-driven, like every other size in the system. */
const CELL: Record<TableSize, string> = {
	xs: "py-rule",
	sm: "py-tight",
	md: "py-snug",
	lg: "py-2",
	xl: "py-4",
}

export type TableProps = {
	size?: TableSize
	/** The header row stays put while the body scrolls under it. The table then
	 *  needs a height to scroll within: pass `max-h-*` in `class`. */
	stickyHeader?: boolean
	/** Carbon's useStaticWidth: as wide as its content, not as its container. */
	useStaticWidth?: boolean
	/** Names the table for assistive tech when nothing visible does. */
	"aria-label"?: string
	/** Layout for the frame: placement, a max-height. */
	class?: string
	children?: JSX.Element
}

/** The frame is a wrapper, not the `<table>`'s own border. A table wider than a
 *  phone has to scroll sideways, and when it does the frame should stay where it
 *  is while the columns move inside it.
 *
 *  Borders are `separate` with no spacing, and live on the cells. Under
 *  `collapse` they belong to the grid rather than to any cell, so a sticky
 *  header leaves its own rules behind as the body scrolls.
 *
 *  Carbon's `useZebraStyles` is dropped: striping is a second grey, and rows are
 *  already ruled apart in ink.
 */
export function Table(props: TableProps) {
	const ctx: TableContextValue = {
		size: () => props.size ?? "md",
		sticky: () => props.stickyHeader ?? false,
	}

	return (
		<TableContext.Provider value={ctx}>
			<Scroller axis="both" class={`${BOX} ${props.class ?? ""}`}>
				<table
					aria-label={props["aria-label"]}
					class={`border-separate border-spacing-0 text-body ${
						props.useStaticWidth ? "w-auto" : "w-full"
					}`}
				>
					{props.children}
				</table>
			</Scroller>
		</TableContext.Provider>
	)
}

export function TableHead(props: { children?: JSX.Element }) {
	return <thead>{props.children}</thead>
}

export function TableBody(props: { children?: JSX.Element }) {
	return <tbody>{props.children}</tbody>
}

export type TableRowProps = {
	isSelected?: boolean
	class?: string
	children?: JSX.Element
}

/** `group/row` is what lets a cell know it is in the last row, and drop the rule
 *  the frame already draws. */
export function TableRow(props: TableRowProps) {
	return (
		<tr
			aria-selected={props.isSelected ? "true" : undefined}
			// Selection reads as ink, not as a tint.
			class={`group/row ${props.isSelected ? "on-ink bg-ink text-white" : ""} ${props.class ?? ""}`}
		>
			{props.children}
		</tr>
	)
}

export type SortDirection = "ASC" | "DESC" | "NONE"

/** A header cell's box. Sticky cells need their own ground, or the rows show
 *  through as they pass underneath. */
function headerBox(sticky: boolean): string {
	return `border-b-2 border-r-2 border-ink text-left ${LABEL} last:border-r-0
		${sticky ? "sticky top-0 z-10 bg-white" : ""}`
}

/** A body cell's box. */
const CELL_BOX = "border-b-2 border-r-2 border-ink last:border-r-0 group-last/row:border-b-0"

export type TableHeaderProps = {
	isSortable?: boolean
	sortDirection?: SortDirection
	scope?: "col" | "colgroup" | "row" | "rowgroup"
	colSpan?: number
	class?: string
	children?: JSX.Element
	onClick?: () => void
}

export function TableHeader(props: TableHeaderProps) {
	const ctx = useContext(TableContext)
	const direction = (): SortDirection => props.sortDirection ?? "NONE"
	const glyph = () =>
		direction() === "ASC" ? ArrowUp : direction() === "DESC" ? ArrowDown : ArrowsVertical

	return (
		<th
			scope={props.scope ?? "col"}
			colSpan={props.colSpan}
			// aria-sort is the whole announcement: the glyph beside it is decorative.
			aria-sort={props.isSortable
				? direction() === "ASC" ? "ascending" : direction() === "DESC" ? "descending" : "none"
				: undefined}
			class={`${headerBox(ctx.sticky())} ${props.isSortable ? "p-0" : `px-2 ${CELL[ctx.size()]}`}
				${props.class ?? ""}`}
		>
			<Show when={props.isSortable} fallback={props.children}>
				{
					/* The button is the whole cell, so the press target is the column's
				    full width rather than the width of its label. */
				}
				<button
					type="button"
					onClick={() => props.onClick?.()}
					class={`flex w-full cursor-pointer items-center justify-between gap-tight border-0
						bg-transparent px-2 text-left ${LABEL} text-ink
						transition-colors hover:bg-gray
						pointer-coarse:min-h-touch ${CELL[ctx.size()]}`}
				>
					{props.children}
					<Icon glyph={glyph()} size={16} class={direction() === "NONE" ? "opacity-40" : ""} />
				</button>
			</Show>
		</th>
	)
}

export type TableCellProps = {
	colSpan?: number
	class?: string
	children?: JSX.Element
}

export function TableCell(props: TableCellProps) {
	const ctx = useContext(TableContext)

	return (
		<td colSpan={props.colSpan} class={`${CELL_BOX} px-2 ${CELL[ctx.size()]} ${props.class ?? ""}`}>
			{props.children}
		</td>
	)
}

/* ---- selection ---- */

export type TableSelectAllProps = {
	checked?: boolean
	/** Some rows selected, not all. */
	indeterminate?: boolean
	disabled?: boolean
	"aria-label"?: string
	onSelect?: () => void
}

/** The header cell over the selection column. In a radio table there is nothing
 *  to select all of, so it is an empty cell that keeps the columns aligned —
 *  render it either way and pass `getSelectionProps()` through. */
export function TableSelectAll(props: TableSelectAllProps & { radio?: boolean }) {
	const ctx = useContext(TableContext)

	return (
		<th scope="col" class={`${headerBox(ctx.sticky())} w-8 px-2 ${CELL[ctx.size()]}`}>
			<Show when={!props.radio} fallback={<span class="sr-only">Select</span>}>
				<Checkbox
					labelText={props["aria-label"] ?? "Select all rows"}
					hideLabel
					class="pointer-coarse:min-w-touch"
					checked={props.checked ?? false}
					indeterminate={props.indeterminate}
					disabled={props.disabled}
					onChange={() => props.onSelect?.()}
				/>
			</Show>
		</th>
	)
}

export type TableSelectRowProps = {
	checked?: boolean
	disabled?: boolean
	/** One row at a time: a radio instead of a checkbox. */
	radio?: boolean
	/** Shared by every radio in the table, so the browser treats them as one
	 *  group and the arrow keys move between rows. */
	name?: string
	"aria-label"?: string
	onSelect?: () => void
}

/** The cell keeps its own white ground. A selected row inverts to ink, and a
 *  checkbox drawn in ink on ink would be a tick floating in a black row. */
export function TableSelectRow(props: TableSelectRowProps) {
	const ctx = useContext(TableContext)
	const id = createUniqueId()

	return (
		<td class={`${CELL_BOX} w-8 bg-white px-2 text-ink ${CELL[ctx.size()]}`}>
			<Show
				when={props.radio}
				fallback={
					<Checkbox
						labelText={props["aria-label"] ?? "Select row"}
						hideLabel
						class="pointer-coarse:min-w-touch"
						checked={props.checked ?? false}
						disabled={props.disabled}
						onChange={() => props.onSelect?.()}
					/>
				}
			>
				<label
					for={`row-radio-${id}`}
					class={`flex cursor-pointer items-center pointer-coarse:min-h-touch pointer-coarse:min-w-touch ${
						props.disabled ? "cursor-not-allowed opacity-40" : ""
					}`}
				>
					<input
						id={`row-radio-${id}`}
						type="radio"
						class="peer sr-only"
						name={props.name}
						checked={props.checked ?? false}
						disabled={props.disabled}
						aria-label={props["aria-label"] ?? "Select row"}
						onChange={() => props.onSelect?.()}
					/>
					<RadioMark checked={props.checked} />
				</label>
			</Show>
		</td>
	)
}

/* ---- expansion ---- */

/** The chevron every expand control shares: right when shut, down when open. */
function ExpandButton(props: { isExpanded?: boolean; label: string; onExpand?: () => void }) {
	return (
		<button
			type="button"
			aria-expanded={props.isExpanded ? "true" : "false"}
			aria-label={props.label}
			onClick={() => props.onExpand?.()}
			class="flex cursor-pointer items-center justify-center border-0 bg-transparent p-0
				text-current pointer-coarse:min-h-touch pointer-coarse:min-w-touch"
		>
			<Icon
				glyph={ChevronDown}
				size={16}
				class={`transition-transform duration-220 ${props.isExpanded ? "" : "-rotate-90"}`}
			/>
		</button>
	)
}

export type TableExpandHeaderProps = {
	/** Carbon's enableToggle: the header cell opens and shuts every row at once.
	 *  Without it the cell is empty and only keeps the columns aligned. */
	enableToggle?: boolean
	isExpanded?: boolean
	"aria-label"?: string
	onExpand?: () => void
}

export function TableExpandHeader(props: TableExpandHeaderProps) {
	const ctx = useContext(TableContext)

	return (
		<th scope="col" class={`${headerBox(ctx.sticky())} w-8 px-2 ${CELL[ctx.size()]}`}>
			<Show when={props.enableToggle} fallback={<span class="sr-only">Expand</span>}>
				<ExpandButton
					isExpanded={props.isExpanded}
					label={props["aria-label"] ??
						(props.isExpanded ? "Collapse all rows" : "Expand all rows")}
					onExpand={props.onExpand}
				/>
			</Show>
		</th>
	)
}

export type TableExpandRowProps = {
	isExpanded?: boolean
	isSelected?: boolean
	"aria-label"?: string
	class?: string
	children?: JSX.Element
	onExpand?: () => void
}

/** A row that leads with its own expand control. The detail goes in a
 *  `TableExpandedRow` straight after it, rendered only while `isExpanded`. */
export function TableExpandRow(props: TableExpandRowProps) {
	const ctx = useContext(TableContext)

	return (
		<TableRow isSelected={props.isSelected} class={props.class}>
			<td class={`${CELL_BOX} w-8 px-2 ${CELL[ctx.size()]}`}>
				<ExpandButton
					isExpanded={props.isExpanded}
					label={props["aria-label"] ?? (props.isExpanded ? "Collapse row" : "Expand row")}
					onExpand={props.onExpand}
				/>
			</td>
			{props.children}
		</TableRow>
	)
}

export type TableExpandedRowProps = {
	/** Every column the table has, the expand and selection columns included. */
	colSpan: number
	class?: string
	children?: JSX.Element
}

/** The detail under an expanded row: one cell across the whole table. */
export function TableExpandedRow(props: TableExpandedRowProps) {
	return (
		<tr class="group/row">
			<td colSpan={props.colSpan} class={`${CELL_BOX} p-2 ${props.class ?? ""}`}>
				{props.children}
			</td>
		</tr>
	)
}

/* ---- container ---- */

export type TableContainerProps = {
	title?: JSX.Element
	description?: JSX.Element
	class?: string
	children?: JSX.Element
}

/** Carbon's TableContainer: a title and a description over the toolbar and the
 *  table. No box of its own — the table is already one. */
export function TableContainer(props: TableContainerProps) {
	const title = children(() => props.title)
	const description = children(() => props.description)

	return (
		<div class={props.class}>
			<Show when={title() || description()}>
				<div class="mb-2">
					<Show when={title()}>
						<h3 class="m-0 text-figure font-bold tracking-tight">{title()}</h3>
					</Show>
					<Show when={description()}>
						<p class="m-0 mt-tight text-small opacity-muted">{description()}</p>
					</Show>
				</div>
			</Show>
			{props.children}
		</div>
	)
}
