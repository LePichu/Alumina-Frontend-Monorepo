import { createSignal, For, Show } from "solid-js"
import Add from "@carbon/icons/es/add/16"
import Download from "@carbon/icons/es/download/16"
import TrashCan from "@carbon/icons/es/trash-can/16"
import {
	Button,
	DataTable,
	DataTableSkeleton,
	Pagination,
	Table,
	TableBatchAction,
	TableBatchActions,
	TableBody,
	TableCell,
	TableContainer,
	TableExpandedRow,
	TableExpandHeader,
	TableExpandRow,
	TableHead,
	TableHeader,
	TableRow,
	TableSelectAll,
	TableSelectRow,
	TableToolbar,
	TableToolbarAction,
	TableToolbarContent,
	TableToolbarMenu,
	TableToolbarSearch,
	Tag,
} from "../index"
import type { DataTableHeader, TableSize } from "../index"
import { Sub } from "./shared"

type Board = {
	id: string
	board: string
	author: string
	layers: number
	revision: string
	updated: string
	notes: string
	disabled?: boolean
	isSelected?: boolean
}

const HEADERS: DataTableHeader[] = [
	{ key: "board", header: "Board" },
	{ key: "author", header: "Author" },
	{ key: "layers", header: "Layers" },
	{ key: "revision", header: "Revision" },
	{ key: "updated", header: "Updated", isSortable: false },
]

const BOARDS: Board[] = [
	{
		id: "pixelexia-z1",
		board: "pixelexia-z1",
		author: "Sambhav Arora",
		layers: 2,
		revision: "rev-9",
		updated: "2 h ago",
		notes: "Carrier for the Z1 toolhead. Silver ink, 0.3 mm traces.",
	},
	{
		id: "synth-driver",
		board: "synth-driver",
		author: "avthenticstemcel",
		layers: 4,
		revision: "rev-10",
		updated: "yesterday",
		notes: "Stepper driver, four layers. Thermal vias under the bridge.",
		isSelected: true,
	},
	{
		id: "ink-test-coupon",
		board: "ink-test-coupon",
		author: "Pixelexia",
		layers: 2,
		revision: "rev-2",
		updated: "Tuesday",
		notes: "Trace-width sweep from 0.10 to 0.50 mm.",
	},
	{
		id: "i2c-fanout-6",
		board: "i2c-fanout-6",
		author: "avthenticstemcel",
		layers: 2,
		revision: "rev-3",
		updated: "Sunday",
		notes: "Six-way I²C fan-out with per-port pull-ups.",
	},
	{
		id: "buck-5v",
		board: "buck-5v",
		author: "Sambhav Arora",
		layers: 4,
		revision: "rev-3",
		updated: "last week",
		notes: "12 V to 5 V at 2 A. Locked while a print is running.",
		disabled: true,
	},
]

const SIZES: TableSize[] = ["xs", "sm", "md", "lg", "xl"]

export function DataTableDemo() {
	const [picked, setPicked] = createSignal<string[]>(["synth-driver"])
	const [size, setSize] = createSignal<TableSize>("md")
	const [paging, setPaging] = createSignal({ page: 1, pageSize: 3 })

	return (
		<>
			<Sub
				title="DataTable"
				note="Sort a column, filter, select rows for batch actions, open a row, page through. One column opts out of sorting; one row is disabled. Paging is the caller's: the table hands over its rows and the page slices them."
			>
				<DataTable
					rows={BOARDS}
					headers={HEADERS}
					isSortable
					size={size()}
					onSelectionChange={setPicked}
				>
					{(table) => (
						<TableContainer
							title="Boards"
							description={`${table.rows.length} shown · selected: ${
								picked().join(", ") || "none"
							}`}
						>
							<TableToolbar>
								<TableBatchActions {...table.getBatchActionProps()}>
									<TableBatchAction renderIcon={Download}>Download</TableBatchAction>
									<TableBatchAction renderIcon={TrashCan}>Delete</TableBatchAction>
								</TableBatchActions>
								<TableToolbarContent>
									<TableToolbarSearch
										placeholder="Filter boards"
										onChange={table.onInputChange}
									/>
									<TableToolbarMenu label="Row height">
										<For each={SIZES}>
											{(option) => (
												<TableToolbarAction
													itemText={`Row height · ${option}`}
													onClick={() => setSize(option)}
												/>
											)}
										</For>
									</TableToolbarMenu>
									<Button kind="primary" flat renderIcon={Add} class="border-0 border-l-2">
										New board
									</Button>
								</TableToolbarContent>
							</TableToolbar>
							<Table {...table.getTableProps()}>
								<TableHead>
									<TableRow>
										<TableExpandHeader enableToggle {...table.getExpandHeaderProps()} />
										<TableSelectAll {...table.getSelectionProps()} />
										<For each={table.headers}>
											{(header) => (
												<TableHeader {...table.getHeaderProps({ header })}>
													{header.header}
												</TableHeader>
											)}
										</For>
									</TableRow>
								</TableHead>
								<TableBody>
									<For
										each={table.rows.slice(
											(paging().page - 1) * paging().pageSize,
											paging().page * paging().pageSize,
										)}
										fallback={
											<TableRow>
												<TableCell colSpan={table.headers.length + 2} class="opacity-muted">
													No board matches.
												</TableCell>
											</TableRow>
										}
									>
										{(row) => (
											<>
												<TableExpandRow {...table.getRowProps({ row })}>
													<TableSelectRow {...table.getSelectionProps({ row })} />
													<For each={row.cells}>
														{(cell) => (
															<TableCell>
																<Show
																	when={cell.info.header === "revision"}
																	fallback={cell.value}
																>
																	<Tag size="sm">{cell.value}</Tag>
																</Show>
															</TableCell>
														)}
													</For>
												</TableExpandRow>
												<Show when={row.isExpanded}>
													<TableExpandedRow colSpan={table.headers.length + 2}>
														{row.source.notes}
													</TableExpandedRow>
												</Show>
											</>
										)}
									</For>
								</TableBody>
							</Table>
							{/* Shares the table's bottom edge: its own top border is dropped. */}
							<Pagination
								class="border-t-0"
								totalItems={table.rows.length}
								page={paging().page}
								pageSize={paging().pageSize}
								pageSizes={[3, 5]}
								onChange={setPaging}
							/>
						</TableContainer>
					)}
				</DataTable>
			</Sub>

			<Sub
				title="Radio selection · sticky header"
				note="One row at a time, and a header that stays while the body scrolls inside a fixed height."
			>
				<DataTable rows={BOARDS} headers={HEADERS} radio stickyHeader size="sm">
					{(table) => (
						<Table {...table.getTableProps()} class="max-h-40">
							<TableHead>
								<TableRow>
									<TableSelectAll {...table.getSelectionProps()} />
									<For each={table.headers}>
										{(header) => (
											<TableHeader {...table.getHeaderProps({ header })}>
												{header.header}
											</TableHeader>
										)}
									</For>
								</TableRow>
							</TableHead>
							<TableBody>
								<For each={table.rows}>
									{(row) => (
										<TableRow isSelected={row.isSelected}>
											<TableSelectRow {...table.getSelectionProps({ row })} />
											<For each={row.cells}>{(cell) => <TableCell>{cell.value}</TableCell>}</For>
										</TableRow>
									)}
								</For>
							</TableBody>
						</Table>
					)}
				</DataTable>
			</Sub>

			<Sub title="DataTableSkeleton" note="The real headers, when they are known first.">
				<DataTableSkeleton headers={HEADERS} rowCount={3} />
			</Sub>
		</>
	)
}
