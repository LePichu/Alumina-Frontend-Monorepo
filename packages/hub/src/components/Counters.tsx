import { For } from "solid-js"
import { Icon, Tile } from "@alumina/design"
import type { CarbonGlyph } from "@alumina/design"

export type Counter = {
	glyph: CarbonGlyph
	value: string | number
	label: string
}

/** The four-up totals under a page's opening line.
 *
 *  One bordered box divided into cells, not four boxes in a row — the same
 *  construction as the nav. It appears on every quarry page that has a headline
 *  (home, a board, publish), always saying "here is what this is, in numbers".
 */
/** Two columns on a phone, one row on anything wider.
 *
 *  Which rules a cell carries is computed from its index rather than written as
 *  nth-child variants, because the two layouts disagree about the *same* cell —
 *  the second of four has no right-hand rule in a 2×2 grid and does have one in a
 *  row. Only the breakpoint override is left to the cascade, where Tailwind's
 *  ordering guarantee (variants after base) actually settles it. */
function rules(index: number, count: number): string {
	return [
		index % 2 === 0 ? "border-r-2" : "",
		index < count - 2 ? "border-b-2" : "",
		index === count - 1 ? "sm:border-r-0" : "sm:border-r-2",
		"sm:border-b-0",
	].join(" ")
}

export function Counters(props: { counters: Counter[]; class?: string }) {
	return (
		// The box is a Tile; what is ours is the grid of cells inside it.
		<Tile flush class={props.class}>
			<dl class="m-0 grid grid-cols-2 sm:auto-cols-fr sm:grid-flow-col sm:grid-cols-none">
				<For each={props.counters}>
					{(counter, index) => (
						<div class={`min-w-0 border-ink p-4 ${rules(index(), props.counters.length)}`}>
							<span aria-hidden="true" class="block opacity-60">
								<Icon glyph={counter.glyph} size={16} />
							</span>
							<dt class="sr-only">{counter.label}</dt>
							<dd class="m-0 mt-2 truncate text-brand font-bold tabular-nums">{counter.value}</dd>
							<span aria-hidden="true" class="mt-tight block text-micro uppercase opacity-muted">
								{counter.label}
							</span>
						</div>
					)}
				</For>
			</dl>
		</Tile>
	)
}
