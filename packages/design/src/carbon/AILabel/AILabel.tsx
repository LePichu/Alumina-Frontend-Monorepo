import CorvuPopover from "corvu/popover"
import { Show } from "solid-js"
import type { JSX } from "solid-js"
import { FLOATING_SURFACE } from "../../internal/styles"
import type { PopoverAlign } from "../Popover/Popover"

export type AILabelSize = "sm" | "md" | "lg"

export type AILabelProps = {
	/** What the mark says. */
	aiText?: string
	/** `inline` sets the mark in a line of text and may carry a few words after
	 *  it — `aiTextLabel`. */
	kind?: "default" | "inline"
	aiTextLabel?: string
	size?: AILabelSize
	align?: PopoverAlign
	/** Accessible name for the mark. */
	"aria-label"?: string
	class?: string
	/** An AILabelContent: what was generated, by what, and how sure it is. */
	children?: JSX.Element
}

const SIZE: Record<AILabelSize, string> = {
	sm: "px-tight py-0 text-micro",
	md: "px-snug py-rule text-micro",
	lg: "px-2 py-tight text-label",
}

/** Carbon's AI label: marks something as machine-generated, and explains it on
 *  demand.
 *
 *  Carbon draws it with a gradient — its "AI aura". The whole of that visual
 *  language is hue, so none of it survives here; what is left is the part that
 *  matters, which is the two letters and the explanation behind them. The mark
 *  is a small box in whatever ink it sits on, so it works on a tile's ink bar
 *  as well as on white, and pressing it opens a popover — a toggletip that
 *  holds real content rather than a sentence.
 *
 *  kiln is where it belongs — every board it produces is generated, and a reply
 *  could say by which model and from what — but it is not wired in there:
 *  where the mark goes on a reply, and what it says, is a product decision.
 */
export function AILabel(props: AILabelProps) {
	return (
		<CorvuPopover
			placement={props.align ?? "bottom-start"}
			floatingOptions={{ offset: 8, flip: true, shift: true }}
		>
			<CorvuPopover.Trigger
				type="button"
				aria-label={props["aria-label"] ?? "AI — show information"}
				class={`inline-flex cursor-pointer items-center gap-tight border-2 border-current bg-transparent
					font-bold uppercase leading-none text-current
					data-[open]:bg-ink data-[open]:text-white pointer-coarse:min-h-touch
					pointer-coarse:min-w-touch ${SIZE[props.size ?? "md"]} ${props.class ?? ""}`}
			>
				{props.aiText ?? "AI"}
				<Show when={props.kind === "inline" && props.aiTextLabel}>
					<span class="font-normal normal-case tracking-normal">{props.aiTextLabel}</span>
				</Show>
			</CorvuPopover.Trigger>
			<CorvuPopover.Portal>
				<CorvuPopover.Content
					class={`${FLOATING_SURFACE} flex w-72 max-w-[92vw] flex-col text-body
						focus-visible:outline-none`}
				>
					{props.children}
				</CorvuPopover.Content>
			</CorvuPopover.Portal>
		</CorvuPopover>
	)
}

/** The explanation. Padded; put an AILabelActions after it for buttons. */
export function AILabelContent(props: { class?: string; children?: JSX.Element }) {
	return <div class={`p-2 ${props.class ?? ""}`}>{props.children}</div>
}

/** A ruled footer of actions under the explanation. */
export function AILabelActions(props: { class?: string; children?: JSX.Element }) {
	return (
		<div
			class={`flex items-center justify-end gap-2 border-t-2 border-ink p-2 ${props.class ?? ""}`}
		>
			{props.children}
		</div>
	)
}
