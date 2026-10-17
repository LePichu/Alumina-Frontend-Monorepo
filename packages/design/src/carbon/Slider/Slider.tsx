import { children, createMemo, For, Show } from "solid-js"
import type { JSX } from "solid-js"
import { createControllable, createId } from "../../internal/control"
import { LABEL } from "../../internal/styles"

export type SliderProps = {
	id?: string
	labelText?: JSX.Element
	hideLabel?: boolean
	min: number
	max: number
	step?: number
	value?: number
	/** Tick marks along the track. Carbon has no equivalent; the prototypes do. */
	ticks?: boolean
	/** Carbon's hideTextInput. The live readout replaces the number field. */
	hideTextInput?: boolean
	unit?: string
	disabled?: boolean
	/** Carbon's two-handle slider (unstable, as of @carbon/react 1.118): giving
	 *  an upper value makes this a range, with `value` its lower end. The names
	 *  are Carbon's, prefix and all, so they change when Carbon's do. */
	unstable_valueUpper?: number
	/** Accessible name for the upper handle. */
	unstable_ariaLabelInputUpper?: string
	/** The `name` of the upper handle's input, in a form. */
	unstable_nameUpper?: string
	class?: string
	/** With two handles, `valueUpper` is the second argument. */
	onChange?: (value: number, valueUpper?: number) => void
}

/** The thumb's width in px. Must stay in step with the slider-thumb size utility
 *  below — keep this value and that one equal, or the fill drifts off the thumb.
 *  (Written out in prose on purpose: Tailwind scans comments for class candidates,
 *  and a literal arbitrary-variant selector here gets harvested and compiled into
 *  invalid CSS.) */
const THUMB = 16

/** A native range input's thumb travels between its own half-widths, not the full
 *  track: at 0% the thumb's *centre* sits THUMB/2 in from the left edge, and at
 *  100% the same distance in from the right. Anything painted underneath has to
 *  use the same inset or it drifts out of step with the thumb — which is what made
 *  the fill overshoot the thumb and the ticks sit off its centre. */
const atValue = (percent: number) => `calc(${percent}% + ${(0.5 - percent / 100) * THUMB}px)`

/** The native range input, with its track cleared and its thumb drawn as a 16px
 *  ink-bordered square. h-4 is the thumb's own size: without a height the input
 *  collapses to the runnable track's 4px and clips the thumb to a sliver. */
const RANGE = [
	"m-0 h-4 w-full cursor-pointer appearance-none bg-transparent disabled:cursor-not-allowed",
	"[&::-webkit-slider-runnable-track]:h-tight [&::-webkit-slider-runnable-track]:bg-transparent",
	"[&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none",
	"[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-ink",
	"[&::-webkit-slider-thumb]:bg-white",
	// WebKit and Blink hang the thumb from the top of the runnable track rather
	// than centring it on it, so a 16px thumb on a 4px track sits 6px low — its
	// top edge on the rail instead of its middle. Gecko centres its own.
	"[&::-webkit-slider-thumb]:-mt-snug",
	// box-border: the reset that makes every element border-box does not reach
	// this pseudo-element, and left content-box Gecko draws the thumb 20px.
	"[&::-moz-range-thumb]:box-border",
	"[&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:appearance-none",
	"[&::-moz-range-thumb]:rounded-none [&::-moz-range-thumb]:border-2",
	"[&::-moz-range-thumb]:border-ink [&::-moz-range-thumb]:bg-white",
	"[&::-moz-range-track]:h-tight [&::-moz-range-track]:bg-transparent",
].join(" ")

/** For two inputs stacked on one rail: the inputs ignore the pointer and their
 *  thumbs alone answer it. */
const RANGE_STACKED = [
	"pointer-events-none",
	"[&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto",
].join(" ")

/** Built on a native range input. It already does keyboard, pointer and touch
 *  correctly on every platform, which is the bar CLAUDE.md sets for hand-rolled
 *  controls. The rail, fill, ticks and thumb are ours. */
export function Slider(props: SliderProps) {
	// Resolved once — see "Slots" in CLAUDE.md.
	const label = children(() => props.labelText)
	const [value, setValue] = createControllable(() => props.value, props.min, () => props.onChange)
	const step = () => props.step ?? 1
	const id = createId("slider", () => props.id)

	const percent = createMemo(() => {
		const span = props.max - props.min
		if (span <= 0) return 0
		const clamped = Math.min(Math.max(value(), props.min), props.max)
		return ((clamped - props.min) / span) * 100
	})

	/** One mark per step, capped so a fine step cannot draw hundreds of lines. */
	const tickPositions = createMemo(() => {
		if (!props.ticks) return []
		const count = Math.round((props.max - props.min) / step())
		if (count < 2 || count > 40) return []
		return Array.from({ length: count + 1 }, (_, i) => (i / count) * 100)
	})

	// Two handles when an upper value is given. The lower handle cannot pass the
	// upper one, nor the upper the lower: each is held at the other.
	const ranged = () => props.unstable_valueUpper !== undefined
	const [upper, setUpper] = createControllable(
		() => props.unstable_valueUpper,
		props.max,
		() => props.onChange,
	)

	const percentOf = (amount: number) => {
		const span = props.max - props.min
		if (span <= 0) return 0
		return ((Math.min(Math.max(amount, props.min), props.max) - props.min) / span) * 100
	}

	const commit = (next: number) => {
		const held = ranged() ? Math.min(next, upper()) : next
		setValue(held)
		props.onChange?.(held, ranged() ? upper() : undefined)
	}

	const commitUpper = (next: number) => {
		const held = Math.max(next, value())
		setUpper(held)
		props.onChange?.(value(), held)
	}

	return (
		<div class={props.class}>
			<Show when={label()}>
				{
					/* hideLabel keeps the accessible name and drops the visible one, for a
				    slider whose surroundings already say what it sets. */
				}
				<label
					for={id()}
					class={`mb-tight block ${LABEL} ${props.hideLabel ? "sr-only" : ""}`}
				>
					{label()}
				</label>
			</Show>

			<div class="flex items-center gap-4">
				<div
					class={`relative flex min-h-touch flex-1 items-center
						${props.disabled ? "opacity-40" : ""}`}
				>
					{
						/* Rail, then the filled portion, both inset by half a thumb so they
					    begin and end where the thumb centre actually can. */
					}
					{/* Inset by half a thumb on both sides — 8px, the thumb being 16. */}
					<span
						aria-hidden="true"
						class="pointer-events-none absolute inset-y-0 left-2 right-2 my-auto h-rule bg-gray"
					/>
					{
						/* The filled run: from the rail's start to the thumb, or — with two
					    handles — from one thumb to the other. */
					}
					<Show
						when={ranged()}
						fallback={
							<span
								aria-hidden="true"
								class="pointer-events-none absolute inset-y-0 left-2 my-auto h-rule w-[var(--fill)] bg-ink"
								style={{ "--fill": `calc(${atValue(percent())} - ${THUMB / 2}px)` }}
							/>
						}
					>
						<span
							aria-hidden="true"
							class="pointer-events-none absolute inset-y-0 left-[var(--from)] my-auto h-rule w-[var(--fill)] bg-ink"
							style={{
								"--from": atValue(percent()),
								"--fill": `calc(${atValue(percentOf(upper()))} - ${atValue(percent())})`,
							}}
						/>
					</Show>

					{/* Ticks, each centred on its mark rather than starting at it. */}
					<For each={tickPositions()}>
						{(position) => (
							<span
								aria-hidden="true"
								class="pointer-events-none absolute inset-y-0 left-[var(--at)] my-auto h-2
									w-rule -translate-x-1/2 bg-ink"
								style={{ "--at": atValue(position) }}
							/>
						)}
					</For>

					<input
						id={id()}
						type="range"
						min={props.min}
						max={props.max}
						step={step()}
						value={value()}
						disabled={props.disabled}
						onInput={(event) => {
							commit(Number(event.currentTarget.value))
							// Held at the other handle: put the thumb back where the value is.
							event.currentTarget.value = String(value())
						}}
						class={`${RANGE} relative ${ranged() ? RANGE_STACKED : ""}`}
					/>
					{
						/* The upper handle is a second range input laid over the first. Both
					    inputs let the pointer through and only their thumbs take it, or
					    the one on top would swallow every press meant for the other. */
					}
					<Show when={ranged()}>
						<input
							type="range"
							aria-label={props.unstable_ariaLabelInputUpper ?? "Upper bound"}
							name={props.unstable_nameUpper}
							min={props.min}
							max={props.max}
							step={step()}
							value={upper()}
							disabled={props.disabled}
							onInput={(event) => {
								commitUpper(Number(event.currentTarget.value))
								event.currentTarget.value = String(upper())
							}}
							class={`${RANGE} absolute inset-x-0 ${RANGE_STACKED}`}
						/>
					</Show>
				</div>

				<Show when={!props.hideTextInput}>
					{/* Tabular so the width does not jitter as it counts. */}
					<output
						for={id()}
						class="flex shrink-0 items-baseline gap-tight text-body font-bold tabular-nums"
					>
						{value()}
						<Show when={ranged()}>
							<span class="font-normal opacity-muted">–</span>
							{upper()}
						</Show>
						<Show when={props.unit}>
							<span class="text-micro font-normal opacity-muted">{props.unit}</span>
						</Show>
					</output>
				</Show>
			</div>
		</div>
	)
}
