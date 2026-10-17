import type { JSX } from "solid-js"
import type { CarbonGlyph } from "../../icons/glyph"
import { SKELETON } from "../../internal/skeleton"
import { Button } from "../Button/Button"
import type { ButtonKind, ButtonSize } from "../Button/Button"

export type ChatButtonKind = "primary" | "secondary" | "tertiary" | "ghost" | "danger"

export type ChatButtonProps = {
	kind?: ChatButtonKind
	size?: ButtonSize
	renderIcon?: CarbonGlyph
	/** A suggested prompt or reply rather than a command: set in sentence case
	 *  at reading size. kiln's suggestion chips are these. */
	isQuickAction?: boolean
	/** The quick action that was taken. It inverts and can no longer be
	 *  pressed — it is a record now, not an offer. */
	isSelected?: boolean
	disabled?: boolean
	class?: string
	children?: JSX.Element
	onClick?: JSX.EventHandlerUnion<HTMLElement, MouseEvent>
}

/** Carbon's ChatButton (preview, as of @carbon/react 1.118): the button of a
 *  conversational interface.
 *
 *  Carbon's is its Button with fully rounded ends. Nothing is rounded here, so
 *  what is left of it is the one thing it adds to a Button: the quick action —
 *  a button whose label is content, something the user might say, and which
 *  shows itself as taken afterwards. That is `Button`'s `content` voice and its
 *  pressed state, under Carbon's prop names.
 */
export function ChatButton(props: ChatButtonProps) {
	const kind = (): ButtonKind =>
		// A taken quick action is ink whatever kind it was offered in.
		props.isQuickAction && props.isSelected ? "primary" : (props.kind ?? "primary")

	return (
		<Button
			kind={kind()}
			size={props.size}
			renderIcon={props.renderIcon}
			content={props.isQuickAction}
			// Selected "disables the input", as Carbon puts it — but it is not dimmed:
			// it is the one chip that should stand out.
			disabled={props.disabled}
			aria-pressed={props.isQuickAction ? (props.isSelected ?? false) : undefined}
			class={`${props.isQuickAction && props.isSelected ? "pointer-events-none" : ""} ${
				props.class ?? ""
			}`}
			onClick={props.onClick}
		>
			{props.children}
		</Button>
	)
}

/** A ChatButton that has not loaded. */
export function ChatButtonSkeleton(props: { size?: ButtonSize; class?: string }) {
	const height = () => (props.size === "sm" ? "h-6" : props.size === "lg" ? "h-10" : "h-8")
	return (
		<span
			aria-hidden="true"
			class={`${SKELETON} inline-block w-32 ${height()} ${props.class ?? ""}`}
		/>
	)
}
