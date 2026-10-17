import { createMemo, For, Show } from "solid-js"
import CaretLeft from "@carbon/icons/es/caret--left/16"
import CaretRight from "@carbon/icons/es/caret--right/16"
import { Icon } from "../../icons/Icon"
import { createControllable } from "../../internal/control"
import { BOX } from "../../internal/styles"
import { MenuButton, MenuItem } from "../Menu/Menu"

export type PaginationNavProps = {
	/** How many pages there are. (Carbon calls this `totalItems`.) */
	totalItems: number
	/** The current page, from 0, as in Carbon. Controlled when given. */
	page?: number
	/** The most page buttons to show at once, the first and last included. At
	 *  least 4; the rest fold into an overflow. */
	itemsShown?: number
	/** Stepping past either end wraps to the other. */
	loop?: boolean
	class?: string
	onChange?: (page: number) => void
}

type Slot = { kind: "page"; page: number } | { kind: "gap"; pages: number[] }

/** Carbon's PaginationNav: the pages themselves, as buttons.
 *
 *  For a short, known run of pages where jumping matters more than counting —
 *  search results, a gallery. The current page inverts to ink. Pages that do not
 *  fit fold into an overflow that opens a menu of them; the first and last
 *  always show, so both ends of the run are one press away.
 */
export function PaginationNav(props: PaginationNavProps) {
	const [wanted, setWanted] = createControllable(() => props.page, 0, () => props.onChange)
	const count = () => Math.max(0, props.totalItems)
	const page = () => Math.min(Math.max(0, wanted()), Math.max(0, count() - 1))

	const go = (next: number) => {
		const last = count() - 1
		const target = props.loop
			? ((next % count()) + count()) % count()
			: Math.min(Math.max(0, next), last)
		setWanted(target)
		props.onChange?.(target)
	}

	const slots = createMemo((): Slot[] => {
		const total = count()
		const room = Math.max(4, props.itemsShown ?? 8)
		const all = Array.from({ length: total }, (_, index) => index)
		if (total <= room) return all.map((index) => ({ kind: "page", page: index }))

		// First and last are fixed. The window between them is centred on the
		// current page, shrinking by one for each side that needs a gap.
		const current = page()
		const middle = room - 2
		let start = Math.max(1, current - Math.floor(middle / 2))
		let end = start + middle - 1
		if (end > total - 2) {
			end = total - 2
			start = end - middle + 1
		}
		if (start > 1) start += 1
		if (end < total - 2) end -= 1

		const out: Slot[] = [{ kind: "page", page: 0 }]
		if (start > 1) out.push({ kind: "gap", pages: all.slice(1, start) })
		for (let index = start; index <= end; index++) out.push({ kind: "page", page: index })
		if (end < total - 2) out.push({ kind: "gap", pages: all.slice(end + 1, total - 1) })
		out.push({ kind: "page", page: total - 1 })
		return out
	})

	const cell =
		"flex min-h-8 min-w-8 cursor-pointer items-center justify-center border-0 border-l-2 border-ink px-tight text-small tabular-nums transition-colors focus-visible:-outline-offset-2 pointer-coarse:min-h-touch pointer-coarse:min-w-touch"

	return (
		// Never wider than what holds it: on a phone the run of pages scrolls
		// sideways inside its own frame instead of pushing the page out.
		<nav aria-label="Pagination" class={`inline-flex max-w-full ${props.class ?? ""}`}>
			<ul class={`m-0 flex list-none items-stretch overflow-x-auto ${BOX} p-0`}>
				<li class="flex">
					<button
						type="button"
						aria-label="Previous page"
						disabled={!props.loop && page() <= 0}
						onClick={() => go(page() - 1)}
						class="flex min-h-8 w-8 cursor-pointer items-center justify-center border-0 bg-white text-ink
							hover:bg-gray focus-visible:-outline-offset-2 disabled:cursor-not-allowed
							disabled:hover:bg-white pointer-coarse:min-h-touch pointer-coarse:min-w-touch"
					>
						<Icon
							glyph={CaretLeft}
							size={16}
							class={!props.loop && page() <= 0 ? "opacity-40" : ""}
						/>
					</button>
				</li>
				<For each={slots()}>
					{(slot) => (
						<li class="flex">
							<Show
								when={slot.kind === "page" ? slot : undefined}
								fallback={
									<span class="flex border-l-2 border-ink">
										<MenuButton label="…" kind="ghost" size="sm" menuAlignment="bottom">
											<For each={slot.kind === "gap" ? slot.pages : []}>
												{(hidden) => (
													<MenuItem
														label={`Page ${hidden + 1}`}
														onClick={() => go(hidden)}
													/>
												)}
											</For>
										</MenuButton>
									</span>
								}
							>
								{(shown) => (
									<button
										type="button"
										aria-label={`Page ${shown().page + 1}`}
										aria-current={shown().page === page() ? "page" : undefined}
										onClick={() => go(shown().page)}
										class={`${cell} ${
											shown().page === page()
												? "on-ink bg-ink font-bold text-white"
												: "bg-white text-ink hover:bg-gray"
										}`}
									>
										{shown().page + 1}
									</button>
								)}
							</Show>
						</li>
					)}
				</For>
				<li class="flex">
					<button
						type="button"
						aria-label="Next page"
						disabled={!props.loop && page() >= count() - 1}
						onClick={() => go(page() + 1)}
						class="flex min-h-8 w-8 cursor-pointer items-center justify-center border-0 border-l-2 border-ink
							bg-white text-ink hover:bg-gray focus-visible:-outline-offset-2
							disabled:cursor-not-allowed disabled:hover:bg-white pointer-coarse:min-h-touch
							pointer-coarse:min-w-touch"
					>
						<Icon
							glyph={CaretRight}
							size={16}
							class={!props.loop && page() >= count() - 1 ? "opacity-40" : ""}
						/>
					</button>
				</li>
			</ul>
		</nav>
	)
}
