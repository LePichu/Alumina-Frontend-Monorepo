import { createMemo, Show } from "solid-js"
import CaretLeft from "@carbon/icons/es/caret--left/16"
import CaretRight from "@carbon/icons/es/caret--right/16"
import type { CarbonGlyph } from "../../icons/glyph"
import { Icon } from "../../icons/Icon"
import { createControllable } from "../../internal/control"
import { BOX } from "../../internal/styles"
import { MenuButton, MenuItemRadioGroup } from "../Menu/Menu"

export type PaginationChange = { page: number; pageSize: number }

export type PaginationProps = {
	/** The current page, from 1. Controlled when given. */
	page?: number
	pageSize?: number
	/** The sizes offered. */
	pageSizes?: number[]
	totalItems?: number
	/** The total is not known: no "of N", and no page picker. */
	pagesUnknown?: boolean
	/** With `pagesUnknown`, stops the forward button on the last page. */
	isLastPage?: boolean
	disabled?: boolean
	itemsPerPageText?: string
	backwardText?: string
	forwardText?: string
	class?: string
	onChange?: (change: PaginationChange) => void
}

/** A step button: a whole cell of the bar, ruled off from its neighbour. */
function Step(
	props: { label: string; glyph: CarbonGlyph; disabled?: boolean; onPress: () => void },
) {
	return (
		<button
			type="button"
			aria-label={props.label}
			disabled={props.disabled}
			onClick={() => props.onPress()}
			class="flex w-10 shrink-0 cursor-pointer items-center justify-center border-0 border-l-2 border-ink
				bg-white text-ink transition-colors
				hover:bg-ink hover:text-white focus-visible:-outline-offset-2
				disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-ink
				pointer-coarse:min-w-touch"
		>
			{/* Dims the glyph, not the button: fading the button fades its rule too. */}
			<Icon glyph={props.glyph} size={16} class={props.disabled ? "opacity-40" : ""} />
		</button>
	)
}

/** Carbon's Pagination: which slice of a long list is showing, and the controls
 *  to change it.
 *
 *  One ruled bar, cell by cell — rows per page, the range on show, the page, and
 *  the two steps — in the manner of the table toolbar and quarry's nav. Put it
 *  straight under a `Table` with `class="border-t-0"` and the two share an edge.
 *
 *  It holds no rows. It says which page and how big; slicing is the caller's.
 *  On a narrow screen the two readouts drop out and the controls stay.
 */
export function Pagination(props: PaginationProps) {
	const sizes = () => props.pageSizes ?? [10, 20, 30, 40, 50]
	const [wanted, setWanted] = createControllable(() => props.page, 1, () => props.onChange)
	const [pageSize, setPageSize] = createControllable(
		() => props.pageSize,
		sizes()[0] ?? 10,
		() => props.onChange,
	)

	const total = () => props.totalItems ?? 0
	const pages = createMemo(() => Math.max(1, Math.ceil(total() / pageSize())))
	// What was asked for, held to the pages there are.
	const page = () =>
		props.pagesUnknown ? Math.max(1, wanted()) : Math.min(Math.max(1, wanted()), pages())

	const go = (nextPage: number, nextSize = pageSize()) => {
		setWanted(nextPage)
		setPageSize(nextSize)
		props.onChange?.({ page: nextPage, pageSize: nextSize })
	}

	const first = () => (total() === 0 ? 0 : (page() - 1) * pageSize() + 1)
	const last = () => Math.min(page() * pageSize(), total())
	const atEnd = () => (props.pagesUnknown ? (props.isLastPage ?? false) : page() >= pages())

	return (
		<nav
			aria-label="Pagination"
			class={`flex items-stretch ${BOX} text-small ${props.class ?? ""}`}
		>
			<div class="flex items-center gap-tight px-2 py-tight">
				<span class="hidden opacity-muted sm:inline">{props.itemsPerPageText ?? "Per page"}</span>
				{
					/* A menu rather than a Select: the value is two digits, and a Select's
				    box would be the widest thing on the bar. Same control as the page
				    picker beside it. */
				}
				<MenuButton
					label={String(pageSize())}
					kind="ghost"
					size="sm"
					menuAlignment="top-start"
					disabled={props.disabled}
				>
					<MenuItemRadioGroup
						label={props.itemsPerPageText ?? "Items per page"}
						items={sizes()}
						selectedItem={pageSize()}
						itemToString={(size) => `${size} per page`}
						// Changing the size goes back to the first page: the item that was
						// at the top of page 3 of 10s is not at the top of page 3 of 50s.
						onChange={(size) => go(1, size)}
					/>
				</MenuButton>
			</div>

			<Show when={!props.pagesUnknown}>
				<p class="m-0 hidden items-center border-l-2 border-ink px-2 tabular-nums md:flex">
					{first()}–{last()}
					<span class="ml-tight opacity-muted">of {total()}</span>
				</p>
			</Show>

			<p class="m-0 ml-auto flex items-center gap-tight border-l-2 border-ink px-2 tabular-nums">
				<span class="hidden opacity-muted sm:inline">Page</span>
				<Show
					when={!props.pagesUnknown && pages() > 1}
					fallback={<b class="font-bold">{page()}</b>}
				>
					{
						/* A menu of every page, the current one ticked. Opens upward: the
					    bar is at the foot of a table, and usually of the page. */
					}
					<MenuButton
						label={String(page())}
						kind="ghost"
						size="sm"
						menuAlignment="top-end"
						disabled={props.disabled}
					>
						<MenuItemRadioGroup
							label="Page"
							items={Array.from({ length: pages() }, (_, index) => index + 1)}
							selectedItem={page()}
							itemToString={(number) => `Page ${number}`}
							onChange={(number) => go(number)}
						/>
					</MenuButton>
				</Show>
				<Show when={!props.pagesUnknown}>
					<span class="opacity-muted">of {pages()}</span>
				</Show>
			</p>

			<Step
				label={props.backwardText ?? "Previous page"}
				glyph={CaretLeft}
				disabled={props.disabled || page() <= 1}
				onPress={() => go(page() - 1)}
			/>
			<Step
				label={props.forwardText ?? "Next page"}
				glyph={CaretRight}
				disabled={props.disabled || atEnd()}
				onPress={() => go(page() + 1)}
			/>
		</nav>
	)
}
