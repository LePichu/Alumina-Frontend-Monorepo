import CorvuPopover from "corvu/popover"
import type { JSX } from "solid-js"
import Information from "@carbon/icons/es/information/16"
import type { CarbonGlyph } from "../../icons/glyph"
import { Icon } from "../../icons/Icon"
import { FLOATING_SURFACE_INVERSE, LABEL } from "../../internal/styles"
import type { PopoverAlign } from "../Popover/Popover"

export type ToggletipProps = {
	align?: PopoverAlign
	defaultOpen?: boolean
	class?: string
	/** A `ToggletipLabel`, a `ToggletipButton` and a `ToggletipContent`. */
	children?: JSX.Element
}

/** Carbon's Toggletip: a tooltip you press for, that can hold more than a label.
 *
 *  A Tooltip shows on hover and holds one line. That fails twice: touch has no
 *  hover, and a tooltip cannot contain a link, because moving to it dismisses
 *  it. A toggletip opens on a press, stays until dismissed, and may hold a
 *  sentence and an action.
 *
 *  It is a Corvu Popover in the tooltip's own clothes — ink ground, white text —
 *  so the two read as the same kind of thing.
 */
export function Toggletip(props: ToggletipProps) {
	return (
		<CorvuPopover
			initialOpen={props.defaultOpen}
			placement={props.align ?? "bottom"}
			floatingOptions={{ offset: 8, flip: true, shift: true }}
		>
			<span class={`inline-flex items-center gap-tight ${props.class ?? ""}`}>
				{props.children}
			</span>
		</CorvuPopover>
	)
}

/** What the toggletip is about, set beside its button. */
export function ToggletipLabel(props: { class?: string; children?: JSX.Element }) {
	return <span class={`${LABEL} ${props.class ?? ""}`}>{props.children}</span>
}

export type ToggletipButtonProps = {
	/** Accessible name: what pressing it will tell you. */
	label?: string
	/** Replaces the information glyph. */
	renderIcon?: CarbonGlyph
	class?: string
}

export function ToggletipButton(props: ToggletipButtonProps) {
	return (
		<CorvuPopover.Trigger
			type="button"
			aria-label={props.label ?? "Show information"}
			class={`inline-flex cursor-pointer items-center justify-center border-0 bg-transparent p-0
				text-current hover:bg-gray data-[open]:bg-ink data-[open]:text-white
				pointer-coarse:min-h-touch pointer-coarse:min-w-touch ${props.class ?? ""}`}
		>
			<Icon glyph={props.renderIcon ?? Information} size={16} />
		</CorvuPopover.Trigger>
	)
}

export function ToggletipContent(props: { class?: string; children?: JSX.Element }) {
	return (
		<CorvuPopover.Portal>
			<CorvuPopover.Content
				class={`${FLOATING_SURFACE_INVERSE} flex max-w-64 flex-col gap-2 p-2 text-small
					focus-visible:outline-none ${props.class ?? ""}`}
			>
				{props.children}
			</CorvuPopover.Content>
		</CorvuPopover.Portal>
	)
}

/** The row of actions at the foot of a toggletip: a link, a button. Put a Link
 *  here as it is — it takes its ink from the ground — and a Button as
 *  `ghost--inverse`. */
export function ToggletipActions(props: { class?: string; children?: JSX.Element }) {
	return (
		<div class={`flex items-center justify-between gap-2 ${props.class ?? ""}`}>
			{props.children}
		</div>
	)
}
