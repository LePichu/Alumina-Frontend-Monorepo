import { children, Show } from "solid-js"
import type { JSX } from "solid-js"
import { Scroller } from "../../internal/scroll"
import { ComposedModal, ModalBody, ModalFooter, ModalHeader } from "../ComposedModal/ComposedModal"
import type { ModalSize } from "../ComposedModal/ComposedModal"

export type ModalProps = {
	open?: boolean
	modalHeading?: JSX.Element
	/** Carbon's modalLabel: the small overline above the heading. */
	modalLabel?: JSX.Element
	size?: ModalSize
	/** No action buttons in the footer. */
	passiveModal?: boolean
	danger?: boolean
	primaryButtonText?: string
	secondaryButtonText?: string
	primaryButtonDisabled?: boolean
	/** A press outside the dialog does not close it. */
	preventCloseOnClickOutside?: boolean
	/** Drawn in the page instead of over it — see ComposedModal's `inline`. */
	inline?: boolean
	/** The two-pane variant: a side nav down the left of the body. */
	navigation?: JSX.Element
	/** Drops the body's padding so its children own their insets — for a body
	 *  that is a stack of ruled sections, whose dividers have to reach the
	 *  dialog's own edges. The same idea as Tile's `flush`. */
	flush?: boolean
	class?: string
	children?: JSX.Element
	onRequestClose?: () => void
	onRequestSubmit?: () => void
}

/** Carbon's Modal: a heading, a body and up to two actions, given as props.
 *
 *  It is `ComposedModal`'s parts in the arrangement nearly every dialog wants,
 *  so the two cannot drift apart: one box, one ink bar, one footer.
 */
export function Modal(props: ModalProps) {
	return (
		<ComposedModal
			open={props.open}
			size={props.size}
			preventCloseOnClickOutside={props.preventCloseOnClickOutside}
			inline={props.inline}
			class={props.class}
			onClose={props.onRequestClose}
		>
			<ModalHeader label={props.modalLabel} title={props.modalHeading} />

			{
				/* Two panes side by side from `sm` up. Below it there is no room for
			    two, so the nav lies across the top of the body instead — a
			    TabListVertical inside it turns into a row there for the same
			    reason. */
			}
			<div class="flex min-h-0 flex-1 flex-col sm:flex-row">
				<Navigation>{props.navigation}</Navigation>
				<ModalBody flush={props.flush}>{props.children}</ModalBody>
			</div>

			<Show when={!props.passiveModal}>
				<ModalFooter
					danger={props.danger}
					primaryButtonText={props.primaryButtonText}
					secondaryButtonText={props.secondaryButtonText}
					primaryButtonDisabled={props.primaryButtonDisabled}
					onRequestClose={props.onRequestClose}
					onRequestSubmit={props.onRequestSubmit}
				/>
			</Show>
		</ComposedModal>
	)
}

/** The side nav, if there is one.
 *
 *  A component of its own so the slot is resolved *here*, inside the dialog's
 *  portal, and not in Modal's body — see "Slots" in CLAUDE.md.
 *
 *  46 spacing units is 11.5rem, the prototype's width. A settings nav holds one
 *  short word per row; at a full 20rem lane the labels floated in the middle of
 *  an empty column.
 */
function Navigation(props: { children?: JSX.Element }) {
	const node = children(() => props.children)

	return (
		<Show when={node()}>
			<nav class="flex shrink-0 border-b-2 border-ink sm:w-46 sm:border-b-0 sm:border-r-2">
				<Scroller axis="both" class="flex-1">{node()}</Scroller>
			</nav>
		</Show>
	)
}
