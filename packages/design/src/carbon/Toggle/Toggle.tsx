import { children, Show } from "solid-js"
import type { JSX } from "solid-js"
import { createControllable, createId } from "../../internal/control"
import { LABEL } from "../../internal/styles"

export type ToggleSize = "sm" | "md"

export type ToggleProps = {
	id?: string
	labelText?: JSX.Element
	/** Carbon's labelA / labelB: the text shown when off and when on. */
	labelA?: string
	labelB?: string
	hideLabel?: boolean
	toggled?: boolean
	/** Where it starts, when it is left to itself. */
	defaultToggled?: boolean
	disabled?: boolean
	readOnly?: boolean
	size?: ToggleSize
	/** The label sits beside the switch, on the same line: what it is on the left,
	 *  the switch hard against the right. A settings row. The whole row is the
	 *  label, so pressing anywhere on it flips the switch. */
	inline?: boolean
	class?: string
	onToggle?: (toggled: boolean) => void
}

/** Both sizes sit on the even grid, with one rule's thickness of air between the
 *  knob and the track's border.
 *
 *  The three tables below have to agree, or the knob leaves the track and is
 *  clipped by whatever the track sits in. Travel is the only free number:
 *    travel = width − 2×border − 2×padding − knob
 *  sm: 32 − 4 − 4 − 8 = 16.  md: 48 − 4 − 4 − 16 = 24.
 *
 *  sm was the prototypes' `.sw` verbatim — a 34×18 track, 1px of air, a 12px
 *  knob — and every one of those is off the grid: 1px is odd and the others are
 *  not multiples of 4, so each was an arbitrary rem value. It is 2px smaller
 *  each way now, which is the nearest even fit. */
const TRACK: Record<ToggleSize, string> = {
	sm: "h-4 w-8 p-rule",
	md: "h-6 w-12 p-rule",
}

const KNOB: Record<ToggleSize, string> = {
	sm: "size-2",
	md: "size-4",
}

const KNOB_ON: Record<ToggleSize, string> = {
	sm: "translate-x-4",
	md: "translate-x-6",
}

/** A checkbox underneath, so it is reachable, focusable and announced without
 *  any ARIA of ours. The track and knob are square — no rounded corners. */
export function Toggle(props: ToggleProps) {
	// Resolved once — see "Slots" in CLAUDE.md.
	const label = children(() => props.labelText)
	const id = createId("toggle", () => props.id)
	const size = (): ToggleSize => props.size ?? "md"

	// Works controlled or uncontrolled. Track and knob both read this, so they
	// can never disagree — peer-checked: could only ever reach the track.
	const [toggled, setToggled] = createControllable(
		() => props.toggled,
		props.defaultToggled ?? false,
		() => props.onToggle,
	)

	const input = () => (
		<input
			id={id()}
			type="checkbox"
			role="switch"
			class="peer sr-only"
			checked={toggled()}
			disabled={props.disabled}
			aria-readonly={props.readOnly ? "true" : undefined}
			onChange={(event) => {
				if (props.readOnly) {
					event.currentTarget.checked = toggled()
					return
				}
				setToggled(event.currentTarget.checked)
				props.onToggle?.(event.currentTarget.checked)
			}}
		/>
	)

	const track = () => (
		<span
			aria-hidden="true"
			class={`flex shrink-0 items-center border-2 border-ink
				peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2
				peer-focus-visible:outline-ink ${TRACK[size()]}
				${toggled() ? "bg-ink" : "bg-white"}`}
		>
			<span
				class={`block transition-transform ${KNOB[size()]}
					${toggled() ? `${KNOB_ON[size()]} bg-white` : "bg-ink"}`}
			/>
		</span>
	)

	return (
		<Show
			when={props.inline}
			fallback={
				<div class={props.class}>
					<Show when={label()}>
						<span
							class={`mb-tight block ${LABEL} ${props.hideLabel ? "sr-only" : ""}`}
						>
							{label()}
						</span>
					</Show>
					<label
						for={id()}
						// The 44px hit area is a touch requirement, not a desktop one: mica's
						// settings rows are ~18px tall and a forced 44px would triple the lane.
						class={`flex cursor-pointer items-center gap-2 pointer-coarse:min-h-touch
							${props.disabled ? "cursor-not-allowed opacity-40" : ""}`}
					>
						{input()}
						{track()}
						{
							/* Only when asked for. Carbon defaults these to on/off, but the
						    prototypes' dense rows carry the meaning in the row's own label and
						    a trailing "on" there is noise that also pushes the track out of the
						    column it is supposed to line up in. */
						}
						<Show when={props.labelA ?? props.labelB}>
							<span class="text-micro uppercase">
								{toggled() ? (props.labelB ?? "on") : (props.labelA ?? "off")}
							</span>
						</Show>
					</label>
				</div>
			}
		>
			<div class={props.class}>
				<label
					for={id()}
					class={`flex cursor-pointer items-center justify-between gap-2 py-rule
						pointer-coarse:min-h-touch ${props.disabled ? "cursor-not-allowed opacity-40" : ""}`}
				>
					<span class="min-w-0 flex-1 truncate text-small opacity-muted">{label()}</span>
					{input()}
					{track()}
				</label>
			</div>
		</Show>
	)
}
