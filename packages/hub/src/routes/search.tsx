import { createAsync, useSearchParams } from "@solidjs/router"
import { createSignal, For, Show } from "solid-js"
import ChevronDown from "@carbon/icons/es/chevron--down/16"
import Filter from "@carbon/icons/es/filter/16"
import Fork from "@carbon/icons/es/fork/16"
import Printer from "@carbon/icons/es/printer/16"
import Star from "@carbon/icons/es/star/16"
import {
	Button,
	Checkbox,
	ContainedList,
	ContainedListItem,
	ContentSwitcher,
	Drawer,
	FormGroup,
	Icon,
	Switch,
	Tile,
	TileSection,
} from "@alumina/design"
import { BoardHero } from "../components/BoardHero"
import { Shell } from "../components/Shell"
import { listBoards, listFilters } from "../lib/quarry"
import type { Board, FilterGroup } from "../lib/quarry"

/** Results, with the facets beside them.
 *
 * There is no search backend — it is an open decision, along with auth and git
 * hosting — so the query is not run: every board comes back, the facet counts
 * are fixtures, and ticking one filters nothing. The shape is what is being
 * built here, and the shape is what a backend slots into.
 */
const SORTS = ["Relevance", "Recent", "Most built"]

export default function SearchPage() {
	const [params] = useSearchParams<{ q?: string; owner?: string }>()
	const boards = createAsync(() => listBoards())
	const filters = createAsync(() => listFilters())
	const [sort, setSort] = createSignal(0)
	// The facets as a drawer, below the width where they stand beside the results.
	const [facetsOpen, setFacetsOpen] = createSignal(false)

	// "Your boards" in the account menu lands here with the owner pinned.
	const mine = () => params.owner === "me"
	const results = () =>
		(boards() ?? []).filter((board) => !mine() || board.namespace === "avthenticstemcel")

	const title = () => (mine() ? "Your boards" : params.q ?? "buck 4-layer")

	return (
		<Shell>
			<section class="flex flex-wrap items-baseline gap-4 pb-6 pt-12">
				<h1 class="m-0 text-headline font-bold">{title()}</h1>
				<span class="text-body opacity-muted">
					{results().length} board{results().length === 1 ? "" : "s"}
				</span>
				<div class="ml-auto flex flex-wrap items-stretch gap-2">
					{/* Only where the facets are not already on show beside the results. */}
					<Button
						kind="tertiary"
						size="sm"
						renderIcon={Filter}
						class="lg:hidden"
						onClick={() => setFacetsOpen(true)}
					>
						Filters
					</Button>
					<ContentSwitcher size="sm" selectedIndex={sort()} onChange={setSort}>
						<For each={SORTS}>{(name) => <Switch text={name} />}</For>
					</ContentSwitcher>
				</div>
			</section>

			<Drawer
				open={facetsOpen()}
				onClose={() => setFacetsOpen(false)}
				label="Filters"
				side="right"
				flush
			>
				<Facets groups={filters() ?? []} />
			</Drawer>

			<div class="flex items-start gap-6">
				{
					/* Facets: one tile, a ruled section per facet, each a group of
				    checkboxes. Sticky under the nav, which is 56px tall and sits 16px
				    down — so it clears at 80px. */
				}
				<Tile flush class="sticky top-20 hidden w-64 shrink-0 lg:block">
					<Facets groups={filters() ?? []} />
				</Tile>

				<div class="min-w-0 flex-1">
					{/* One container, rows ruled apart — not a stack of separate boxes. */}
					<Tile flush>
						<ContainedList>
							<For each={results()}>{(board) => <Hit board={board} />}</For>
						</ContainedList>
					</Tile>

					<div class="mt-6 flex justify-center">
						<Button kind="secondary" renderIcon={ChevronDown} class="min-w-72 justify-center">
							More results
						</Button>
					</div>
				</div>
			</div>
		</Shell>
	)
}

/** The facets: a ruled section per facet, each a group of checkboxes.
 *
 *  Their own component because they go two places — a tile beside the results
 *  on a wide screen, the body of a drawer on a narrow one. Both are flush
 *  containers of TileSections, so the same markup fits either.
 */
function Facets(props: { groups: FilterGroup[] }) {
	return (
		<>
			<For each={props.groups}>
				{(group) => (
					<TileSection size="md">
						<FormGroup legendText={group.legend}>
							<For each={group.options}>
								{(option) => (
									<Checkbox
										checked={option.on}
										labelText={
											<span class="flex items-baseline gap-2">
												<span class="min-w-0 flex-1">{option.label}</span>
												<Show when={option.count !== undefined}>
													<span class="shrink-0 text-small tabular-nums opacity-muted">
														{option.count}
													</span>
												</Show>
											</span>
										}
									/>
								)}
							</For>
						</FormGroup>
					</TileSection>
				)}
			</For>
			<TileSection size="md">
				<Button kind="secondary" size="sm" class="w-full justify-center">Clear filters</Button>
			</TileSection>
		</>
	)
}

/** One result: the board, what it is, and the three numbers that decide whether
 *  you open it. The whole row is the link. */
function Hit(props: { board: Board }) {
	return (
		// Padding goes on the item, not on the list around it, so the rule between
		// rows still reaches the tile's edges.
		<ContainedListItem href={`/${props.board.namespace}/${props.board.slug}`} class="px-4">
			<span class="flex items-center gap-4 py-2">
				<BoardHero board={props.board.slug} class="h-18 w-26 shrink-0" />

				<span class="min-w-0 flex-1">
					<span class="block truncate text-figure font-bold tracking-tight group-hover:underline">
						<span class="font-normal opacity-muted">{props.board.namespace}/</span>
						{props.board.slug}
					</span>
					<span class="mt-tight block truncate text-body opacity-muted">
						{props.board.description}
					</span>
					<span class="mt-tight flex flex-wrap gap-4 text-micro uppercase opacity-muted">
						<span>{props.board.layers} layer</span>
						<span>{props.board.size[0]} × {props.board.size[1]} mm</span>
						<span>{props.board.licence}</span>
						<span>{props.board.updated}</span>
					</span>
				</span>

				<span class="hidden shrink-0 gap-6 text-body sm:flex">
					<span class="flex items-center gap-tight">
						<Icon glyph={Star} size={16} label="stars" />
						<span class="tabular-nums">{props.board.stars.toLocaleString()}</span>
					</span>
					<span class="flex items-center gap-tight">
						<Icon glyph={Fork} size={16} label="forks" />
						<span class="tabular-nums">{props.board.forks}</span>
					</span>
					<span class="flex items-center gap-tight">
						<Icon glyph={Printer} size={16} label="prints" />
						<span class="tabular-nums">{props.board.prints}</span>
					</span>
				</span>
			</span>
		</ContainedListItem>
	)
}
