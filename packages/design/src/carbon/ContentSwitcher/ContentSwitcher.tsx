import CorvuTooltip from "corvu/tooltip"
import { createContext, Show, useContext } from "solid-js"
import type { JSX } from "solid-js"
import type { CarbonGlyph } from "../../icons/glyph"
import { Icon } from "../../icons/Icon"
import { createControllable } from "../../internal/control"
import type { FieldSize } from "../../internal/field"
import { BOX, TOOLTIP_SURFACE } from "../../internal/styles"

type SwitcherContextValue = {
	selected: () => number
	select: (index: number) => void
	claimIndex: () => number
	size: () => FieldSize
	register: (el: HTMLButtonElement) => void
	focusAt: (index: number) => void
}

const SwitcherContext = createContext<SwitcherContextValue>()

export type ContentSwitcherProps = {
	selectedIndex?: number
	size?: FieldSize
	/** Drops the outer box and stretches to its container's height, for a switcher
	 *  that *is* a section of something already bordered — quarry's nav bar and the
	 *  two-up preview tabs in its publish flow. Its own border would draw a second
	 *  rule inside the container's, and a boxed switcher cannot fill a bar's height,
	 *  so a selected cell stops short of the bar's own edges. The dividers between
	 *  items are the Switch's and stay either way. */
	flush?: boolean
	class?: string
	children?: JSX.Element
	onChange?: (index: number) => void
}

export function ContentSwitcher(props: ContentSwitcherProps) {
	let counter = 0
	const buttons: HTMLButtonElement[] = []
	const [selected, setSelected] = createControllable(
		() => props.selectedIndex,
		0,
		() => props.onChange,
	)

	const ctx: SwitcherContextValue = {
		selected,
		select: (index) => {
			setSelected(index)
			props.onChange?.(index)
		},
		claimIndex: () => counter++,
		size: () => props.size ?? "md",
		register: (el) => buttons.push(el),
		focusAt: (index) => {
			const count = buttons.length
			const next = ((index % count) + count) % count
			buttons[next]?.focus()
			setSelected(next)
			props.onChange?.(next)
		},
	}

	return (
		<SwitcherContext.Provider value={ctx}>
			{/* One ink box, divided by ink rules — not a row of separate boxes. */}
			<div
				role="tablist"
				class={`${props.flush ? "flex self-stretch" : `inline-flex ${BOX}`} ${props.class ?? ""}`}
			>
				{props.children}
			</div>
		</SwitcherContext.Provider>
	)
}

const SIZE: Record<FieldSize, string> = {
	sm: "px-snug py-tight",
	md: "px-2 py-snug",
	lg: "px-gap py-2",
}

export type SwitchProps = {
	text?: string
	renderIcon?: CarbonGlyph
	/** Required when the switch is icon-only — it becomes both the accessible name
	 *  and the tooltip, since an icon alone never says what it does. */
	iconDescription?: string
	/** Pushes the glyph and the label to opposite edges instead of centring the
	 *  pair. mica's Slice/Tools/Machine switcher fills its lane, and centred
	 *  content in a stretched cell reads as three unrelated buttons. */
	spread?: boolean
	disabled?: boolean
	class?: string
}

/** Carbon calls this `Switch`. Note it collides with Solid's control-flow
 *  `Switch` on import — alias one of them at the call site.
 *
 *  An icon-only switch gets a tooltip. Corvu's Tooltip root renders no DOM of its
 *  own, so the trigger *is* this button: the tablist stays the tab's direct parent
 *  and the roving tabindex above is untouched. Wrapping the button in the
 *  tooltip's own trigger instead would nest a button inside a button and put an
 *  element between the tablist and its tabs. */
export function Switch(props: SwitchProps) {
	const ctx = useContext(SwitcherContext)
	if (!ctx) throw new Error("Switch must be used inside a ContentSwitcher")
	const index = ctx.claimIndex()
	const isSelected = () => ctx.selected() === index
	const tip = () => (props.text ? undefined : props.iconDescription)

	// One attribute set, spread onto whichever element ends up being the tab. Built
	// once with getters so the reactive parts stay reactive while `ref` stays a
	// stable reference and registers the button exactly once.
	const tab = {
		ref: (el: HTMLButtonElement) => ctx.register(el),
		type: "button",
		role: "tab",
		onClick: () => ctx.select(index),
		get "aria-selected"() {
			return isSelected()
		},
		get "aria-label"() {
			return tip()
		},
		get tabindex() {
			return isSelected() ? 0 : -1
		},
		get disabled() {
			return props.disabled
		},
		onKeyDown: (event: KeyboardEvent) => {
			if (event.key === "ArrowRight") {
				event.preventDefault()
				ctx.focusAt(index + 1)
			} else if (event.key === "ArrowLeft") {
				event.preventDefault()
				ctx.focusAt(index - 1)
			}
		},
		get class() {
			return `inline-flex cursor-pointer items-center gap-snug pointer-coarse:min-h-touch
					pointer-coarse:min-w-touch
				${props.spread ? "justify-between" : "justify-center"}
        border-0 border-l-2 border-ink text-label font-bold uppercase
        transition-colors
        first:border-l-0 disabled:cursor-not-allowed
        ${SIZE[ctx.size()]}
        ${isSelected() ? "bg-ink text-white" : "bg-white text-ink hover:bg-gray"}
        ${props.class ?? ""}`
		},
	} satisfies JSX.ButtonHTMLAttributes<HTMLButtonElement> & {
		ref: (el: HTMLButtonElement) => void
	}

	// Disabled dims the *content*, never the button. Fading the button fades its
	// divider too, so a disabled item's rule renders lighter than the box around
	// it and the seam reads as a gap in the switcher.
	const label = () => (
		<span
			class={`inline-flex items-center gap-snug ${props.disabled ? "opacity-40" : ""}`}
		>
			<Show when={props.renderIcon}>{(glyph) => <Icon glyph={glyph()} size={16} />}</Show>
			<Show when={props.text}>{props.text}</Show>
		</span>
	)

	return (
		<Show when={tip()} fallback={<button {...tab}>{label()}</button>}>
			{(description) => (
				<CorvuTooltip
					placement="bottom"
					openDelay={100}
					closeDelay={100}
					floatingOptions={{ offset: 8, flip: true, shift: true }}
					openOnFocus
				>
					<CorvuTooltip.Trigger {...tab}>{label()}</CorvuTooltip.Trigger>
					<CorvuTooltip.Portal>
						<CorvuTooltip.Content class={TOOLTIP_SURFACE}>{description()}</CorvuTooltip.Content>
					</CorvuTooltip.Portal>
				</CorvuTooltip>
			)}
		</Show>
	)
}
