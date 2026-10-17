import CorvuPopover from "corvu/popover"
import { children, createContext, createSignal, Show, useContext } from "solid-js"
import type { JSX } from "solid-js"
import OverflowMenuVertical from "@carbon/icons/es/overflow-menu--vertical/16"
import { Icon } from "../../icons/Icon"
import { createRoving, focusRow } from "../../internal/roving"
import { FLOATING_SURFACE } from "../../internal/styles"
import type { TooltipAlign } from "../Tooltip/Tooltip"

/** Opening the menu puts focus on its first item. */
const focusFirstItem = focusRow("[role='menuitem']")

/** How an item ends the menu: see `choose` below. */
const ChooseContext = createContext<(action?: () => void) => void>()

export type OverflowMenuProps = {
	/** Accessible name for the trigger. */
	label?: string
	align?: TooltipAlign
	flipped?: boolean
	/** Replaces the default overflow-dots trigger. Corvu still owns the button, so
	 *  pass content, not a button of your own. Used by quarry's account popover,
	 *  where the trigger is an avatar. */
	trigger?: JSX.Element
	class?: string
	/** Carbon's menuOptionsClass: the floating list's own class. It *replaces*
	 *  the default minimum width — a lane, which suits a menu of sentences and is
	 *  far too wide for three short commands — so pass a `min-w-*` with it. */
	menuOptionsClass?: string
	children?: JSX.Element
}

/** Corvu Popover handles placement, outside-press and escape. The menu
 *  semantics are ours, per the WAI-ARIA menu pattern, and the keys are
 *  `createRoving`. */
export function OverflowMenu(props: OverflowMenuProps) {
	const [content, setContent] = createSignal<HTMLElement>()
	// Resolved once — see "Slots" in CLAUDE.md.
	const trigger = children(() => props.trigger)

	const { onKeyDown } = createRoving(content, "[role='menuitem']")

	let triggerElement: HTMLElement | undefined
	const [open, setOpen] = createSignal(false)
	const [restoring, setRestoring] = createSignal(true)

	/** Choosing an item hands focus back to the trigger and closes the menu
	 *  *first*, then does what the item does. Left to Corvu, focus comes back a
	 *  frame after the close — after a dialog the item opened had already taken
	 *  it, so the menu pulled it straight back out of the dialog (which closed,
	 *  until dialogs stopped closing on focus out), and the dialog then had
	 *  nowhere to return it to. Done in this order, a dialog opened here starts
	 *  from the trigger and gives focus back to it. */
	const choose = (action?: () => void) => {
		setRestoring(false)
		triggerElement?.focus()
		setOpen(false)
		action?.()
	}

	return (
		<CorvuPopover
			placement={props.align ?? "bottom-end"}
			open={open()}
			onOpenChange={(next: boolean) => {
				// Any other way out — Escape, a press outside — restores focus as usual.
				if (next) setRestoring(true)
				setOpen(next)
			}}
			restoreFocus={restoring()}
			onInitialFocus={focusFirstItem}
		>
			{
				/* An open menu inverts its trigger. That is the system's one language for
			    "this is the active one" — the ContentSwitcher, Tabs and a Tile's
			    header bar all say it the same way — and without it a trigger that is a
			    section of a bar gives no sign that the menu below belongs to it.
			    Corvu sets data-open on the trigger; nothing here tracks state. */
			}
			<CorvuPopover.Trigger
				ref={(element: HTMLElement) => (triggerElement = element)}
				aria-label={props.label ?? "Open menu"}
				class={`inline-flex cursor-pointer items-center justify-center pointer-coarse:min-h-touch pointer-coarse:min-w-touch
          border-2 border-transparent bg-transparent text-ink
          transition-colors
          hover:bg-gray data-[open]:bg-ink data-[open]:text-white ${props.class ?? ""}`}
			>
				<Show when={trigger()} fallback={<Icon glyph={OverflowMenuVertical} size={16} />}>
					{trigger()}
				</Show>
			</CorvuPopover.Trigger>
			<CorvuPopover.Portal>
				<CorvuPopover.Content
					ref={setContent}
					role="menu"
					onKeyDown={onKeyDown}
					class={`${FLOATING_SURFACE} ${props.menuOptionsClass ?? "min-w-lane"}`}
				>
					<ChooseContext.Provider value={choose}>{props.children}</ChooseContext.Provider>
				</CorvuPopover.Content>
			</CorvuPopover.Portal>
		</CorvuPopover>
	)
}

export type OverflowMenuItemProps = {
	itemText: JSX.Element
	/** Carbon's isDelete. Carries the hatch, never a colour. */
	isDelete?: boolean
	disabled?: boolean
	hasDivider?: boolean
	class?: string
	onClick?: () => void
}

export function OverflowMenuItem(props: OverflowMenuItemProps) {
	const choose = useContext(ChooseContext)
	if (!choose) throw new Error("OverflowMenuItem must be used inside OverflowMenu")

	return (
		<button
			type="button"
			role="menuitem"
			tabindex={-1}
			disabled={props.disabled}
			// Choosing an item is the end of the menu's job, so it closes — as
			// Carbon's does. It used to stay open, which left a menu hanging over
			// whatever the item had just done.
			onClick={() => choose(props.onClick)}
			// Dividers are ink and run edge to edge. No inset rules.
			class={`flex w-full min-h-touch cursor-pointer items-center border-0 bg-transparent px-2
        py-snug text-left text-body text-ink hover:bg-gray focus-visible:-outline-offset-2
        disabled:cursor-not-allowed
        disabled:opacity-40 ${props.hasDivider ? "border-t-2 border-ink" : ""}
        ${props.isDelete ? "font-bold uppercase" : ""} ${props.class ?? ""}`}
		>
			{props.itemText}
		</button>
	)
}
