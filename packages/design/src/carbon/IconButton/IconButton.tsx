import { Show } from "solid-js"
import type { CarbonGlyph } from "../../icons/glyph"
import { Icon } from "../../icons/Icon"
import { PRESS } from "../../internal/styles"
import { BUTTON_KIND } from "../Button/Button"
import type { ButtonKind, ButtonSize } from "../Button/Button"
import { Tooltip } from "../Tooltip/Tooltip"
import type { TooltipAlign } from "../Tooltip/Tooltip"

export type IconButtonProps = {
	/** Required. Becomes both the tooltip text and the accessible name. */
	label: string
	renderIcon: CarbonGlyph
	kind?: ButtonKind
	size?: ButtonSize
	align?: TooltipAlign
	disabled?: boolean
	/** Drops the tooltip and keeps only the accessible name. Use on an ink bar,
	 *  where a tooltip on every control would be noise. */
	hideTooltip?: boolean
	/** Drops the hard shadow, for controls packed into a grid that already sits
	 *  inside a bordered bar. */
	flat?: boolean
	/** Stretches to its container, for a button laid into a grid cell that should
	 *  be filled edge to edge rather than centred at its natural size. */
	fill?: boolean
	/** Drops the 2px border. For a button inside IconButtonGroup, where the rules
	 *  between cells belong to the group and a border here would double them. */
	borderless?: boolean
	class?: string
	onClick?: () => void
}

const SIZE: Record<ButtonSize, string> = {
	sm: "p-tight",
	md: "p-snug",
	lg: "p-2",
}

/** Carbon's IconButton is a button that always carries a tooltip. The visual is
 *  square and small, but the hit area is never below 44px. */
export function IconButton(props: IconButtonProps) {
	const kind = (): ButtonKind => props.kind ?? "ghost"
	const size = (): ButtonSize => props.size ?? "md"

	// `class` lands here, on the element that carries the kind — not on the
	// wrapper. On the wrapper it could never override the kind's own background
	// or shadow, which is the whole reason a caller passes it.
	const face = () => (
		<span
			class={`inline-flex cursor-pointer items-center justify-center transition-colors
				pointer-coarse:min-h-touch pointer-coarse:min-w-touch ${PRESS}
				${props.borderless ? "border-0" : "border-2"}
				${BUTTON_KIND[kind()]} ${SIZE[size()]}
				${props.flat ? "shadow-none active:translate-none" : ""}
				${props.fill ? "size-full" : ""}
				${props.disabled ? "cursor-not-allowed opacity-40" : ""} ${props.class ?? ""}`}
		>
			<Icon glyph={props.renderIcon} size={16} />
		</span>
	)

	return (
		<Show
			when={props.hideTooltip}
			fallback={
				// The tooltip's trigger *is* the button, so the click and the disabled
				// state have to travel to it. They used to stop here, which left every
				// tooltipped icon button in the system inert.


					<Tooltip
						label={props.label}
						align={props.align}
						onClick={() => props.onClick?.()}
						disabled={props.disabled}
						class={props.fill ? "size-full" : ""}
					>
						{face()}
					</Tooltip>

			}
		>
			<button
				type="button"
				aria-label={props.label}
				disabled={props.disabled}
				onClick={() => props.onClick?.()}
				class={`cursor-pointer border-0 bg-transparent p-0 ${props.fill ? "size-full" : ""}`}
			>
				{face()}
			</button>
		</Show>
	)
}
