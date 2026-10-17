import { Show } from "solid-js"
import Checkmark from "@carbon/icons/es/checkmark/16"
import Subtract from "@carbon/icons/es/subtract/16"
import { Icon } from "../icons/Icon"

/** The two marks a choice is drawn with. Both are 16px, 2px ink, square —
 *  nothing here is round, a radio included — and both are only the drawing: the
 *  real input sits beside them, hidden, and carries the behaviour.
 *
 *  They take the keyboard focus ring from that input, which must be the
 *  preceding sibling with the `peer` class.
 */

const MARK =
	"flex size-4 shrink-0 items-center justify-center border-2 border-ink peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink"

/** A checkbox's box: empty, ticked, or — some but not all — a dash. */
export function CheckMark(props: { checked?: boolean; indeterminate?: boolean }) {
	return (
		<span
			aria-hidden="true"
			class={`${MARK} text-white ${props.checked || props.indeterminate ? "bg-ink" : "bg-white"}`}
		>
			<Show
				when={props.indeterminate}
				fallback={
					<Show when={props.checked}>
						<Icon glyph={Checkmark} size={16} />
					</Show>
				}
			>
				<Icon glyph={Subtract} size={16} />
			</Show>
		</span>
	)
}

/** A radio's box: empty, or holding a smaller ink square. */
export function RadioMark(props: { checked?: boolean }) {
	return (
		<span aria-hidden="true" class={`${MARK} bg-white`}>
			<Show when={props.checked}>
				<span class="size-2 bg-ink" />
			</Show>
		</span>
	)
}
