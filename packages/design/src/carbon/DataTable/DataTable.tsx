import { createMemo, createSignal, createUniqueId } from "solid-js"
import type { JSX } from "solid-js"
import { createStore } from "solid-js/store"
import type {
	SortDirection,
	TableExpandHeaderProps,
	TableExpandRowProps,
	TableHeaderProps,
	TableProps,
	TableSelectAllProps,
	TableSelectRowProps,
	TableSize,
} from "./Table"
import type { TableBatchActionsProps } from "./TableToolbar"

/** A column: which field of a row it shows, and what its header says. */
export type DataTableHeader = {
	key: string
	header: JSX.Element
	/** Overrides the table's `isSortable` for this one column. */
	isSortable?: boolean
}

/** A row as you supply it: an id, and a field for each header's key. */
export type DataTableRowInput = {
	id: string
	disabled?: boolean
	/** Where the row starts. Uncontrolled after that. */
	isSelected?: boolean
	isExpanded?: boolean
}

export type DataTableCell = {
	id: string
	/** The row's field for this column, ready to place in a cell. */
	value: JSX.Element
	info: { header: string }
}

/** A row as the render prop receives it.
 *
 *  The object is stable for as long as the row you passed in is: sorting,
 *  filtering and selecting never rebuild it, so a `<For>` over `table.rows` moves
 *  DOM instead of recreating it. `isSelected` and `isExpanded` are live — read
 *  them in JSX and they update on their own. */
export type DataTableRow<Row> = {
	readonly id: string
	readonly cells: DataTableCell[]
	readonly isSelected: boolean
	readonly isExpanded: boolean
	readonly disabled: boolean
	/** The object you passed in, for anything the cells do not carry. */
	readonly source: Row
}

export type DataTableSortInfo = {
	key: string
	direction: SortDirection
	locale: string
}

export type DataTableRenderProps<Row> = {
	/** What to draw: filtered, then sorted. */
	readonly rows: DataTableRow<Row>[]
	readonly headers: DataTableHeader[]
	readonly selectedRows: DataTableRow<Row>[]
	readonly radio: boolean

	getTableProps(): Pick<TableProps, "size" | "stickyHeader" | "useStaticWidth">
	getHeaderProps(
		args: { header: DataTableHeader },
	): Pick<TableHeaderProps, "isSortable" | "sortDirection" | "onClick">
	getRowProps(
		args: { row: DataTableRow<Row> },
	): Pick<TableExpandRowProps, "isSelected" | "isExpanded" | "onExpand">
	getExpandHeaderProps(): TableExpandHeaderProps
	/** With a row, the props for its `TableSelectRow`; with nothing, the props
	 *  for `TableSelectAll`. */
	getSelectionProps(): TableSelectAllProps & { radio: boolean }
	getSelectionProps(args: { row: DataTableRow<Row> }): TableSelectRowProps
	getBatchActionProps(): TableBatchActionsProps

	/** Filters the rows. Hand it to `TableToolbarSearch`'s `onChange`. */
	onInputChange(value: string): void
	sortBy(key: string): void
	selectRow(id: string): void
	selectAll(): void
	expandRow(id: string): void
	expandAll(): void
}

export type DataTableProps<Row extends DataTableRowInput> = {
	rows: Row[]
	headers: DataTableHeader[]
	/** Every column sorts, unless its header says otherwise. */
	isSortable?: boolean
	/** One row at a time: selection is a radio per row. */
	radio?: boolean
	size?: TableSize
	stickyHeader?: boolean
	useStaticWidth?: boolean
	/** For the default string comparison. Pinned to `en` unless set, so a table
	 *  sorts the same on the server as in the browser. */
	locale?: string
	/** Replaces the default comparison. Return the order for ascending; the
	 *  table negates it for descending. */
	sortRow?: (a: unknown, b: unknown, info: DataTableSortInfo) => number
	/** Replaces the default filter, which keeps a row when any of its plain-text
	 *  cells contains what was typed. */
	filterRows?: (args: { row: Row; headers: DataTableHeader[]; inputValue: string }) => boolean
	/** Not in Carbon, where selection is read back out of the render props. Here
	 *  the render function runs once, so anything outside the table that needs
	 *  the selection is told about it. */
	onSelectionChange?: (ids: string[]) => void
	children: (table: DataTableRenderProps<Row>) => JSX.Element
}

/** Carbon's order: unsorted → ascending → descending → unsorted. */
const NEXT: Record<SortDirection, SortDirection> = { NONE: "ASC", ASC: "DESC", DESC: "NONE" }

/** Numbers by value; everything else as text, with digit runs compared as
 *  numbers so `rev-10` follows `rev-9`. Empty values sort last. */
function compare(a: unknown, b: unknown, locale: string): number {
	if (typeof a === "number" && typeof b === "number") return a - b
	const empty = (value: unknown) => value === undefined || value === null || value === ""
	if (empty(a) || empty(b)) return empty(a) ? (empty(b) ? 0 : 1) : -1
	return String(a).localeCompare(String(b), locale, { numeric: true })
}

/** Only what can honestly be searched as text. A cell holding JSX has no string
 *  form worth matching against. */
function searchable(value: unknown): string {
	return typeof value === "string" || typeof value === "number" ? String(value) : ""
}

/** Carbon's DataTable: the state behind a table, handed to a render function.
 *
 *  It draws nothing. It sorts, filters, selects and expands, and gives the render
 *  function the rows to draw plus a `get…Props()` for each part, so the markup —
 *  which columns, whether there is a toolbar, what an expanded row shows — stays
 *  the caller's. That is Carbon's API, and Carbon's docs are the spec for it.
 *
 *  Two things differ, both because a Solid component runs once. The render
 *  function is called a single time, so what it is given is *live*: `table.rows`
 *  is a getter over a memo, and the objects that `get…Props()` return carry
 *  getters too, which survive being spread onto a component. And `rows` is used
 *  with `<For>`, not `.map()`.
 *
 *  Pagination is not built in, as it is not in Carbon: slice `rows` yourself and
 *  put a `Pagination` under the table.
 */
export function DataTable<Row extends DataTableRowInput>(props: DataTableProps<Row>) {
	const name = `data-table-${createUniqueId()}`
	const locale = () => props.locale ?? "en"

	const [selected, setSelected] = createStore<Record<string, boolean>>({})
	const [expanded, setExpanded] = createStore<Record<string, boolean>>({})
	const [sortKey, setSortKey] = createSignal<string>()
	const [direction, setDirection] = createSignal<SortDirection>("NONE")
	const [query, setQuery] = createSignal("")

	// Seeded once. `isSelected` and `isExpanded` say where a row starts; reading
	// them here, untracked, is what "uncontrolled after that" means.
	for (const row of props.rows) {
		if (row.isSelected) setSelected(row.id, true)
		if (row.isExpanded) setExpanded(row.id, true)
	}

	const cache = new Map<
		string,
		{ source: Row; headers: DataTableHeader[]; row: DataTableRow<Row> }
	>()

	const build = (source: Row, headers: DataTableHeader[]): DataTableRow<Row> => {
		const fields = source as unknown as Record<string, unknown>
		return {
			id: source.id,
			source,
			disabled: source.disabled ?? false,
			cells: headers.map((header) => ({
				id: `${source.id}:${header.key}`,
				value: fields[header.key] as JSX.Element,
				info: { header: header.key },
			})),
			get isSelected() {
				return selected[source.id] === true
			},
			get isExpanded() {
				return expanded[source.id] === true
			},
		}
	}

	/** Every row, in the order given, each one the same object for as long as
	 *  its source and the headers are. */
	const all = createMemo(() => {
		const headers = props.headers
		const seen = new Set<string>()
		const out = props.rows.map((source) => {
			seen.add(source.id)
			const hit = cache.get(source.id)
			if (hit && hit.source === source && hit.headers === headers) return hit.row
			const row = build(source, headers)
			cache.set(source.id, { source, headers, row })
			return row
		})
		for (const id of [...cache.keys()]) if (!seen.has(id)) cache.delete(id)
		return out
	})

	const visible = createMemo(() => {
		const headers = props.headers
		const text = query().trim().toLowerCase()
		let rows = all()

		if (text) {
			rows = rows.filter((row) =>
				props.filterRows
					? props.filterRows({ row: row.source, headers, inputValue: query() })
					: headers.some((header) =>
						searchable((row.source as unknown as Record<string, unknown>)[header.key])
							.toLowerCase()
							.includes(text)
					)
			)
		}

		const key = sortKey()
		const way = direction()
		if (!key || way === "NONE") return rows

		const info: DataTableSortInfo = { key, direction: way, locale: locale() }
		const field = (row: DataTableRow<Row>) =>
			(row.source as unknown as Record<string, unknown>)[key]
		const sorted = [...rows].sort((a, b) =>
			props.sortRow
				? props.sortRow(field(a), field(b), info)
				: compare(field(a), field(b), locale())
		)
		return way === "DESC" ? sorted.reverse() : sorted
	})

	const selectedRows = createMemo(() => all().filter((row) => row.isSelected))
	/** What "select all" means: the rows on show that can be selected. */
	const selectable = createMemo(() => visible().filter((row) => !row.disabled))
	const allSelected = () => selectable().length > 0 && selectable().every((row) => row.isSelected)
	const allExpanded = () => visible().length > 0 && visible().every((row) => row.isExpanded)

	const announce = () => props.onSelectionChange?.(selectedRows().map((row) => row.id))

	const clearSelection = () => {
		for (const row of all()) if (selected[row.id]) setSelected(row.id, false)
	}

	const selectRow = (id: string) => {
		if (props.radio) {
			clearSelection()
			setSelected(id, true)
		} else {
			setSelected(id, !selected[id])
		}
		announce()
	}

	const selectAll = () => {
		const next = !allSelected()
		for (const row of selectable()) setSelected(row.id, next)
		announce()
	}

	const expandRow = (id: string) => setExpanded(id, !expanded[id])

	const expandAll = () => {
		const next = !allExpanded()
		for (const row of visible()) setExpanded(row.id, next)
	}

	const sortBy = (key: string) => {
		const next = sortKey() === key ? NEXT[direction()] : "ASC"
		setSortKey(key)
		setDirection(next)
	}

	function getSelectionProps(): TableSelectAllProps & { radio: boolean }
	function getSelectionProps(args: { row: DataTableRow<Row> }): TableSelectRowProps
	function getSelectionProps(
		args?: { row: DataTableRow<Row> },
	): (TableSelectAllProps & { radio: boolean }) | TableSelectRowProps {
		if (!args) {
			return {
				get radio() {
					return props.radio ?? false
				},
				get checked() {
					return allSelected()
				},
				get indeterminate() {
					return !allSelected() && selectable().some((row) => row.isSelected)
				},
				get disabled() {
					return selectable().length === 0
				},
				onSelect: selectAll,
			}
		}

		const row = args.row
		return {
			name,
			get radio() {
				return props.radio ?? false
			},
			get checked() {
				return row.isSelected
			},
			disabled: row.disabled,
			"aria-label": `Select row ${row.id}`,
			onSelect: () => selectRow(row.id),
		}
	}

	const table: DataTableRenderProps<Row> = {
		get rows() {
			return visible()
		},
		get headers() {
			return props.headers
		},
		get selectedRows() {
			return selectedRows()
		},
		get radio() {
			return props.radio ?? false
		},

		getTableProps: () => ({
			get size() {
				return props.size
			},
			get stickyHeader() {
				return props.stickyHeader
			},
			get useStaticWidth() {
				return props.useStaticWidth
			},
		}),

		getHeaderProps: ({ header }) => ({
			get isSortable() {
				return header.isSortable ?? props.isSortable ?? false
			},
			get sortDirection(): SortDirection {
				return sortKey() === header.key ? direction() : "NONE"
			},
			onClick: () => sortBy(header.key),
		}),

		getRowProps: ({ row }) => ({
			get isSelected() {
				return row.isSelected
			},
			get isExpanded() {
				return row.isExpanded
			},
			onExpand: () => expandRow(row.id),
		}),

		getExpandHeaderProps: () => ({
			get isExpanded() {
				return allExpanded()
			},
			onExpand: expandAll,
		}),

		getSelectionProps,

		getBatchActionProps: () => ({
			get shouldShowBatchActions() {
				return selectedRows().length > 0
			},
			get totalSelected() {
				return selectedRows().length
			},
			get totalCount() {
				return selectable().length
			},
			onCancel: () => {
				clearSelection()
				announce()
			},
			onSelectAll: selectAll,
		}),

		onInputChange: setQuery,
		sortBy,
		selectRow,
		selectAll,
		expandRow,
		expandAll,
	}

	return <>{props.children(table)}</>
}
