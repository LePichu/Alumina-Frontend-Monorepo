import CorvuPopover from "corvu/popover"
import { createSignal } from "solid-js"
import type { JSX } from "solid-js"
import { FLOATING_SURFACE, FLOATING_SURFACE_INVERSE } from "../../internal/styles"

/** Every placement floating-ui knows. Tooltip's `TooltipAlign` is the subset a
 *  one-line label needs; a popover holds real content and is placed more
 *  carefully. */
export type PopoverAlign =
	| "top"
	| "top-start"
	| "top-end"
	| "bottom"
	| "bottom-start"
	| "bottom-end"
	| "left"
	| "left-start"
	| "left-end"
	| "right"
	| "right-start"
	| "right-end"

export type PopoverProps = {
	/** Whether the content shows. The popover never opens itself: whatever is
	 *  inside it — usually a button — decides, as in Carbon. */
	open: boolean
	align?: PopoverAlign
	/** Carbon's isTabTip: the content sits flush against the trigger, sharing its
	 *  edge, rather than floating off it. For a panel that hangs from a bar. */
	isTabTip?: boolean
	/** Asks to be closed: Escape, or a press or focus anywhere outside. */
	onRequestClose?: () => void
	/** Layout for the wrapper around the trigger. */
	class?: string
	/** The trigger, and a `PopoverContent`. */
	children?: JSX.Element
}

/** Carbon's Popover: a surface that floats beside the thing that opened it.
 *
 *  The low-level one. Tooltip, Toggletip, OverflowMenu, Menu and every listbox
 *  are popovers that also decide *when* to open and what role they play; this
 *  only places a box, and leaves both to the caller.
 *
 *  Corvu Popover supplies placement, flipping at the viewport edge, Escape,
 *  outside-press and the focus handling: focus moves into the content when it
 *  opens and back to the trigger when it closes, which is the non-modal dialog
 *  pattern.
 *
 *  Carbon's `caret` is dropped. Nothing that floats here has one — tooltips,
 *  menus and listboxes are all a plain box set off from its trigger — and the
 *  offset already says what belongs to what. `dropShadow` is not a choice
 *  either: the box always carries the one hard shadow. `autoAlign` is always on.
 */
export function Popover(props: PopoverProps) {
	const [anchor, setAnchor] = createSignal<HTMLElement>()

	return (
		<CorvuPopover
			open={props.open}
			onOpenChange={(open: boolean) => {
				if (!open) props.onRequestClose?.()
			}}
			placement={props.align ?? "bottom"}
			floatingOptions={{ offset: props.isTabTip ? 0 : 8, flip: true, shift: true }}
			// A press on the trigger is "outside" as far as Corvu can tell, since the
			// trigger is the caller's and not Corvu's own. Left alone it would close
			// the popover on pointer-up and the trigger's click would then reopen it.
			// The trigger's own handler is the one that decides.
			onOutsidePointer={(event: PointerEvent) => {
				const target = event.target
				if (target instanceof Node && anchor()?.contains(target)) event.preventDefault()
			}}
		>
			<CorvuPopover.Anchor as="span" ref={setAnchor} class={`inline-flex ${props.class ?? ""}`}>
				{props.children}
			</CorvuPopover.Anchor>
		</CorvuPopover>
	)
}

export type PopoverContentProps = {
	/** Ink ground, white text. */
	highContrast?: boolean
	/** Names the popover for assistive tech. */
	"aria-label"?: string
	class?: string
	children?: JSX.Element
}

/** What floats. It brings the box and nothing else: no padding, since a popover
 *  as often holds a flush list as a paragraph. */
export function PopoverContent(props: PopoverContentProps) {
	return (
		<CorvuPopover.Portal>
			<CorvuPopover.Content
				aria-label={props["aria-label"]}
				class={`${props.highContrast ? FLOATING_SURFACE_INVERSE : FLOATING_SURFACE} text-body
					focus-visible:outline-none ${props.class ?? ""}`}
			>
				{props.children}
			</CorvuPopover.Content>
		</CorvuPopover.Portal>
	)
}
