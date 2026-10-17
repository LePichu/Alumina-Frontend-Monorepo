import CorvuTooltip from "corvu/tooltip"
import type { JSX } from "solid-js"
import { FLOATING_SURFACE_INVERSE } from "../../internal/styles"
import type { TooltipAlign } from "./Tooltip"

export type DefinitionTooltipProps = {
	/** What the term means. */
	definition: JSX.Element
	align?: TooltipAlign
	/** Carbon's openOnHover. On by default; off, it opens on focus and press
	 *  only. */
	openOnHover?: boolean
	class?: string
	/** The term itself. */
	children?: JSX.Element
}

/** Carbon's DefinitionTooltip: a term in running text that explains itself.
 *
 *  The dotted underline is the mark. A solid one already means "link" here —
 *  see Link's `inline` — and this goes nowhere.
 */
export function DefinitionTooltip(props: DefinitionTooltipProps) {
	return (
		<CorvuTooltip
			placement={props.align ?? "bottom-start"}
			openDelay={100}
			closeDelay={100}
			floatingOptions={{ offset: 8, flip: true, shift: true }}
			openOnFocus
			openOnHover={props.openOnHover ?? true}
			closeOnPointerDown={false}
		>
			<CorvuTooltip.Trigger
				type="button"
				class={`cursor-help border-0 bg-transparent p-0 text-current underline decoration-dotted
					decoration-2 underline-offset-4 ${props.class ?? ""}`}
			>
				{props.children}
			</CorvuTooltip.Trigger>
			<CorvuTooltip.Portal>
				<CorvuTooltip.Content class={`${FLOATING_SURFACE_INVERSE} max-w-64 p-2 text-small`}>
					{props.definition}
				</CorvuTooltip.Content>
			</CorvuTooltip.Portal>
		</CorvuTooltip>
	)
}
