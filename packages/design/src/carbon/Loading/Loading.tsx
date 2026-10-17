import { children, createEffect, For, Match, onCleanup, Show, Switch } from "solid-js"
import type { JSX } from "solid-js"
import CheckmarkFilled from "@carbon/icons/es/checkmark--filled/16"
import ErrorFilled from "@carbon/icons/es/error--filled/16"
import { Icon } from "../../icons/Icon"

/** The eight cells round the edge of a 3×3 grid, clockwise from the top left.
 *  Unit coordinates: column, row. */
const CELLS: [x: number, y: number][] = [
	[0, 0],
	[1, 0],
	[2, 0],
	[2, 1],
	[2, 2],
	[1, 2],
	[0, 2],
	[0, 1],
]

/** One cell is 4 units and the gap between cells is 2, so the whole mark is 16
 *  units square — which is an icon's box, and scales cleanly to 32 and 48. */
const CELL = 4
const PITCH = 6

/** The mark on its own. */
function Ring(props: { size: number }) {
	return (
		<svg
			viewBox="0 0 16 16"
			width={props.size}
			height={props.size}
			aria-hidden="true"
			class="block shrink-0"
		>
			<For each={CELLS}>
				{([x, y], index) => (
					<rect
						x={x * PITCH}
						y={y * PITCH}
						width={CELL}
						height={CELL}
						// The delay is the cell's place in the turn, handed to CSS as a
						// custom property. Reduced motion stops the turn; the first cell
						// stays inked so the mark still reads as a loader, not a grid.
						style={{ "--cell-delay": `${index() * 0.1}s` }}
						class={`${
							index() === 0 ? "fill-ink" : "fill-gray"
						} animate-cell [animation-delay:var(--cell-delay)] motion-reduce:animate-none`}
					/>
				)}
			</For>
		</svg>
	)
}

export type LoadingProps = {
	/** Off, it renders nothing. */
	active?: boolean
	/** Carbon's small: an icon's size, for use inline. */
	small?: boolean
	/** Covers the page while it loads. Carbon's default; here it is opt-in, since
	 *  a spinner that takes over the screen should be asked for by name. */
	withOverlay?: boolean
	/** What is loading. Read to assistive tech; not shown. */
	description?: string
	class?: string
}

/** Carbon's Loading: something is happening and there is no telling how long.
 *
 *  Carbon's is a ring that spins. Nothing here is round and nothing eases, so
 *  this is eight square cells round a square, inked one at a time — the same
 *  information, in the system's own shapes.
 */
export function Loading(props: LoadingProps) {
	const spinner = () => (
		<span
			role="status"
			aria-live="polite"
			class={`inline-flex ${props.class ?? ""}`}
		>
			<Ring size={props.small ? 16 : 48} />
			<span class="sr-only">{props.description ?? "Loading"}</span>
		</span>
	)

	return (
		<Show when={props.active ?? true}>
			<Show when={props.withOverlay} fallback={spinner()}>
				<div class="fixed inset-0 z-50 flex items-center justify-center bg-white/80">
					{spinner()}
				</div>
			</Show>
		</Show>
	)
}

export type InlineLoadingStatus = "inactive" | "active" | "finished" | "error"

export type InlineLoadingProps = {
	status?: InlineLoadingStatus
	/** Shown beside the mark: "Saving…", "Saved". */
	description?: JSX.Element
	/** Accessible name for the mark, when there is no description. */
	iconDescription?: string
	/** How long `finished` shows before `onSuccess` fires, in ms. */
	successDelay?: number
	class?: string
	onSuccess?: () => void
}

/** Carbon's InlineLoading: the state of one action, set where it happened.
 *
 *  The mark changes with the state — the loader, a tick, an error glyph — and
 *  the description says the rest. Never a colour.
 */
export function InlineLoading(props: InlineLoadingProps) {
	const status = (): InlineLoadingStatus => props.status ?? "active"
	const description = children(() => props.description)

	// `finished` is a moment, not a place to stay: after a beat the caller is told,
	// and usually puts the button back.
	createEffect(() => {
		if (status() !== "finished" || !props.onSuccess) return
		const timer = setTimeout(() => props.onSuccess?.(), props.successDelay ?? 1500)
		onCleanup(() => clearTimeout(timer))
	})

	return (
		// Always in the tree, even when `inactive` leaves it empty: a live region has
		// to exist *before* its content changes for the change to be announced.
		<span
			role="status"
			aria-live="polite"
			class={`inline-flex items-center gap-snug text-small ${props.class ?? ""}`}
		>
			<Switch>
				<Match when={status() === "active"}>
					<Ring size={16} />
				</Match>
				<Match when={status() === "finished"}>
					<Icon glyph={CheckmarkFilled} size={16} label={props.iconDescription ?? "finished"} />
				</Match>
				<Match when={status() === "error"}>
					<Icon glyph={ErrorFilled} size={16} label={props.iconDescription ?? "error"} />
				</Match>
			</Switch>
			<Show when={description()} fallback={<span class="sr-only">{props.iconDescription}</span>}>
				<span class={status() === "error" ? "font-bold uppercase" : ""}>{description()}</span>
			</Show>
		</span>
	)
}
