import { For, Show } from "solid-js"
import { SkeletonText } from "../Skeleton/Skeleton"
import type { DataTableHeader } from "./DataTable"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./Table"
import type { TableSize } from "./Table"

export type DataTableSkeletonProps = {
	rowCount?: number
	/** Ignored when `headers` is given. */
	columnCount?: number
	/** The real headers, when they are known before the rows are — which is the
	 *  usual case, and worth showing: the columns do not jump when data lands. */
	headers?: DataTableHeader[]
	/** A bar where the title and description will be. */
	showHeader?: boolean
	/** A bar where the toolbar will be. */
	showToolbar?: boolean
	size?: TableSize
	class?: string
}

/** A table that has not loaded. Same frame, same rules, bars for the text. */
export function DataTableSkeleton(props: DataTableSkeletonProps) {
	const columns = () => props.headers?.length ?? props.columnCount ?? 5
	const rows = () => Array.from({ length: props.rowCount ?? 5 })

	return (
		<div aria-busy="true" aria-label="Loading table" class={props.class}>
			<Show when={props.showHeader ?? true}>
				<div class="mb-2 flex flex-col gap-tight">
					<SkeletonText heading width="12rem" />
					<SkeletonText width="20rem" />
				</div>
			</Show>
			<Show when={props.showToolbar ?? true}>
				<div class="flex min-h-10 items-center justify-end border-2 border-b-0 border-ink bg-white px-2">
					<SkeletonText width="8rem" />
				</div>
			</Show>
			<Table size={props.size}>
				<TableHead>
					<TableRow>
						<For each={Array.from({ length: columns() })}>
							{(_, index) => (
								<TableHeader>
									<Show
										when={props.headers?.[index()]}
										fallback={<SkeletonText width="4rem" />}
									>
										{(header) => header().header}
									</Show>
								</TableHeader>
							)}
						</For>
					</TableRow>
				</TableHead>
				<TableBody>
					<For each={rows()}>
						{() => (
							<TableRow>
								<For each={Array.from({ length: columns() })}>
									{() => (
										<TableCell>
											<SkeletonText />
										</TableCell>
									)}
								</For>
							</TableRow>
						)}
					</For>
				</TableBody>
			</Table>
		</div>
	)
}
