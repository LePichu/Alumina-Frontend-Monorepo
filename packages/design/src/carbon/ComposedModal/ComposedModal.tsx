import CorvuDialog from "corvu/dialog"
import { children, Show } from "solid-js"
import type { JSX } from "solid-js"
import Close from "@carbon/icons/es/close/16"
import { Icon } from "../../icons/Icon"
import { Scroller } from "../../internal/scroll"
import {
	BOX,
	DIALOG_SURFACE,
	INK_BAR,
	INK_BAR_CONTROL,
	INK_BAR_OVERLINE,
	LABEL,
	SCRIM,
} from "../../internal/styles"
import { Button } from "../Button/Button"

export type ModalSize = "xs" | "sm" | "md" | "lg"

const SIZE: Record<ModalSize, string> = {
	xs: "max-w-sm",
	sm: "max-w-xl",
	md: "max-w-2xl",
	lg: "max-w-4xl",
}

export type ComposedModalProps = {
	open?: boolean
	size?: ModalSize
	/** A press outside the dialog does not close it. For a dialog that must be
	 *  answered, or holds a form someone has half filled in. */
	preventCloseOnClickOutside?: boolean
	/** Drawn in place, in the page, instead of over it: no scrim, no portal, no
	 *  focus trap, and neither Escape nor a press outside closes it — its close
	 *  control and its buttons do, through `onClose`. For a dialog that has
	 *  become a page of its own: foundry's Settings is the settings dialog kiln
	 *  has, opened in a tab. It is always open, so `open` is not asked; where it
	 *  sits is the page's layout. */
	inline?: boolean
	class?: string
	/** A ModalHeader, a ModalBody and a ModalFooter. */
	children?: JSX.Element
	onClose?: () => void
}

/** The dialog's box, in the page's flow rather than fixed over it. Up to the
 *  height it is given. */
const INLINE_SURFACE = `relative flex max-h-full w-full flex-col ${BOX} shadow-hard`

/** Carbon's ComposedModal: the dialog in parts.
 *
 *  `Modal` takes its heading and its two buttons as props, which covers most
 *  dialogs and keeps them all alike. This is for the ones that do not fit — a
 *  footer with three actions, a header with something extra in it — where the
 *  parts are placed by hand. `Modal` is these same parts, arranged.
 *
 *  Corvu Dialog supplies the focus trap, scroll lock, Escape and the
 *  aria-modal wiring. Everything visual is ours.
 *
 *  Centred on both axes with a half-translate: `inset-0 m-auto` would only
 *  centre a box with a definite height, and a dialog's is its content's. Height
 *  is deliberately left unset — a caller that needs a fixed panel (kiln's
 *  settings, whose nav has a footer to pin) passes one, and it is then the only
 *  height utility present.
 */
export function ComposedModal(props: ComposedModalProps) {
	return (
		<CorvuDialog
			open={props.inline || props.open}
			onOpenChange={(open: boolean) => {
				if (!open) props.onClose?.()
			}}
			// Inline, it is part of a page: nothing to hold focus in, no page behind
			// it to stop scrolling, and no outside to press.
			modal={!props.inline}
			trapFocus={!props.inline}
			restoreFocus={!props.inline}
			closeOnEscapeKeyDown={!props.inline}
			closeOnOutsidePointer={!props.inline && !props.preventCloseOnClickOutside}
			// A modal dialog closes on Escape, its own controls and a press on the
			// scrim, as Carbon's does — not because focus was moved out of it. That
			// is what a menu does as it closes: it hands focus back to its trigger,
			// and a dialog opened from one of its items was closed by it at once.
			// The trap brings focus back in.
			closeOnOutsideFocus={false}
		>
			<Show
				when={props.inline}
				fallback={
					<CorvuDialog.Portal>
						<CorvuDialog.Overlay class={SCRIM} />
						<CorvuDialog.Content
							class={`${DIALOG_SURFACE} ${SIZE[props.size ?? "md"]} ${props.class ?? ""}`}
						>
							{props.children}
						</CorvuDialog.Content>
					</CorvuDialog.Portal>
				}
			>
				<CorvuDialog.Content
					class={`${INLINE_SURFACE} ${SIZE[props.size ?? "md"]} ${props.class ?? ""}`}
				>
					{props.children}
				</CorvuDialog.Content>
			</Show>
		</CorvuDialog>
	)
}

export type ModalHeaderProps = {
	/** The small overline above the title. */
	label?: JSX.Element
	title?: JSX.Element
	/** Accessible name for the close control. */
	iconDescription?: string
	class?: string
	/** Anything else the bar should carry, after the title. Not a second
	 *  control: the bar has one, and it is the close. */
	children?: JSX.Element
}

/** The ink bar. One borderless white control on it — the close — never two. */
export function ModalHeader(props: ModalHeaderProps) {
	// Resolved here, at the point of use, and not in whatever renders this: a
	// header lives inside the dialog's portal, which mounts only once the dialog
	// is open. See "Slots" in CLAUDE.md.
	const label = children(() => props.label)

	return (
		// items-center, not items-start: the close control is the tallest thing on
		// the bar, so start-alignment pins the heading to the top of a bar sized by
		// something else.
		<div class={`${INK_BAR} ${props.class ?? ""}`}>
			<div class="min-w-0 flex-1">
				<Show when={label()}>
					<CorvuDialog.Description class={INK_BAR_OVERLINE}>{label()}</CorvuDialog.Description>
				</Show>
				{
					/* A row, so a heading that leads with a glyph sits beside it rather
				    than stacking under it. */
				}
				<CorvuDialog.Label class={`m-0 flex items-center gap-tight ${LABEL}`}>
					{props.title}
				</CorvuDialog.Label>
				{props.children}
			</div>
			<CorvuDialog.Close aria-label={props.iconDescription ?? "Close"} class={INK_BAR_CONTROL}>
				<Icon glyph={Close} size={16} />
			</CorvuDialog.Close>
		</div>
	)
}

export type ModalBodyProps = {
	/** Drops the padding, for a body of ruled sections. */
	flush?: boolean
	class?: string
	children?: JSX.Element
}

/** Scrolls inside the dialog's height, so the header and footer stay put. */
export function ModalBody(props: ModalBodyProps) {
	return (
		<Scroller
			class="flex-1"
			paneClass={`text-body ${props.flush ? "" : "p-2"} ${props.class ?? ""}`}
		>
			{props.children}
		</Scroller>
	)
}

export type ModalFooterProps = {
	primaryButtonText?: string
	secondaryButtonText?: string
	primaryButtonDisabled?: boolean
	danger?: boolean
	class?: string
	/** In place of, or as well as, the two standard buttons. They sit first. */
	children?: JSX.Element
	onRequestClose?: () => void
	onRequestSubmit?: () => void
}

/** The actions, ruled off from the body.
 *
 *  Flat, all of them. The dialog already carries the one hard shadow; a second
 *  under a button sitting on its own footer rule reads as a loose object
 *  floating over the panel rather than part of it. */
export function ModalFooter(props: ModalFooterProps) {
	return (
		<div class={`flex flex-wrap justify-end gap-2 border-t-2 border-ink p-2 ${props.class ?? ""}`}>
			{props.children}
			<Show when={props.secondaryButtonText}>
				<Button
					kind="tertiary"
					flat
					onClick={() =>
						props.onRequestClose?.()}
				>
					{props.secondaryButtonText}
				</Button>
			</Show>
			<Show when={props.primaryButtonText}>
				<Button
					kind={props.danger ? "danger" : "primary"}
					flat
					disabled={props.primaryButtonDisabled}
					onClick={() => props.onRequestSubmit?.()}
				>
					{props.primaryButtonText}
				</Button>
			</Show>
		</div>
	)
}
