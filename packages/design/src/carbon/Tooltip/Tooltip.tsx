import CorvuTooltip from "corvu/tooltip"
import type { JSX } from "solid-js"
import { TOOLTIP_SURFACE } from "../../internal/styles"

export type TooltipAlign =
	| "top"
	| "top-start"
	| "top-end"
	| "bottom"
	| "bottom-start"
	| "bottom-end"
	| "left"
	| "right"

export type TooltipProps = {
	/** Carbon's label: the tooltip's text. */
	label: JSX.Element
	align?: TooltipAlign
	enterDelayMs?: number
	leaveDelayMs?: number
	/** Gap between the tooltip and its trigger, in px. Applied along whichever
	 *  edge `align` resolves to. */
	offset?: number
	/** The trigger. Corvu renders it as the button itself. */
	children?: JSX.Element
	class?: string
	/** The trigger *is* the button, so anything that makes it act like one has to
	 *  come through here. Without this a tooltipped control is inert — it looks
	 *  like a button and does nothing. */
	onClick?: () => void
	disabled?: boolean
	/** Accessible name for the trigger, when the tooltip's own label is not a
	 *  plain string. Defaults to `label` when that is text. */
	triggerLabel?: string
}

/** Built on Corvu, which covers the hover/focus/escape/touch behaviour that a
 *  hand-rolled tooltip gets wrong. Styled through Corvu's data attributes. */
export function Tooltip(props: TooltipProps) {
	return (
		<CorvuTooltip
			placement={props.align ?? "top"}
			openDelay={props.enterDelayMs ?? 100}
			closeDelay={props.leaveDelayMs ?? 100}
			// offset pushes the tooltip off its trigger along whichever edge the
			// placement resolves to; without it the box sits flush against the control
			// and reads as part of it. shift and flip keep it inside the viewport.
			floatingOptions={{ offset: props.offset ?? 8, flip: true, shift: true }}
			// Corvu opens on focus as well as hover, which is what keyboard users need.
			openOnFocus
			// Corvu dismisses on pointer-down by default. On a control you click and
			// keep hovering — a view toggle, a backdrop switch — that hides the label
			// at the exact moment it changed, so you cannot read what it became.
			// Hover still governs: moving away closes it.
			closeOnPointerDown={false}
		>
			<CorvuTooltip.Trigger
				// Explicit, not inherited: a <button> inside a <form> submits it by
				// default, so a tooltipped icon button on a composer bar would fire the
				// form on the way to its own onClick.
				type="button"
				aria-label={props.triggerLabel ??
					(typeof props.label === "string" ? props.label : undefined)}
				disabled={props.disabled}
				onClick={() => props.onClick?.()}
				class={`cursor-pointer border-0 bg-transparent p-0 disabled:cursor-not-allowed
					${props.class ?? ""}`}
			>
				{props.children}
			</CorvuTooltip.Trigger>
			<CorvuTooltip.Portal>
				<CorvuTooltip.Content class={TOOLTIP_SURFACE}>{props.label}</CorvuTooltip.Content>
			</CorvuTooltip.Portal>
		</CorvuTooltip>
	)
}
