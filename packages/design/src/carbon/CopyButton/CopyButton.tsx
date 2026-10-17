import { createSignal, onCleanup, Show } from "solid-js"
import type { JSX } from "solid-js"
import CopyIcon from "@carbon/icons/es/copy/16"
import { LABEL } from "../../internal/styles"
import { Button } from "../Button/Button"
import type { ButtonKind, ButtonSize } from "../Button/Button"
import { IconButton } from "../IconButton/IconButton"
import type { TooltipAlign } from "../Tooltip/Tooltip"

/** How long the feedback stays, in ms. Carbon's default. */
const FEEDBACK_MS = 2000

/** The "it worked" state every copy control shares: on for a moment after a
 *  press, then off again. */
function createFeedback(timeout: () => number) {
	const [shown, setShown] = createSignal(false)
	let timer: ReturnType<typeof setTimeout> | undefined
	onCleanup(() => clearTimeout(timer))

	return {
		shown,
		flash: () => {
			setShown(true)
			clearTimeout(timer)
			timer = setTimeout(() => setShown(false), timeout())
		},
	}
}

/** Writes to the clipboard, and reports whether it could. The API is absent on
 *  an insecure origin and can be refused by the user. */
async function writeClipboard(text: string): Promise<boolean> {
	try {
		await navigator.clipboard.writeText(text)
		return true
	} catch {
		return false
	}
}

export type CopyButtonProps = {
	/** What to copy. Left off, the button only reports the press through
	 *  `onClick` and the copying is the caller's. */
	text?: string
	/** What it says for a moment afterwards. */
	feedback?: string
	feedbackTimeout?: number
	/** Tooltip and accessible name. */
	iconDescription?: string
	kind?: ButtonKind
	size?: ButtonSize
	align?: TooltipAlign
	disabled?: boolean
	class?: string
	onClick?: () => void
}

/** Carbon's CopyButton: an icon button that copies, and says it did.
 *
 *  The feedback replaces the icon, in the button's own place, rather than
 *  appearing in a tooltip — a tooltip leaves with the pointer, and "Copied"
 *  should not depend on where the mouse went next. CodeSnippet's copy control is
 *  this one.
 */
export function CopyButton(props: CopyButtonProps) {
	const feedback = createFeedback(() => props.feedbackTimeout ?? FEEDBACK_MS)

	const press = async () => {
		props.onClick?.()
		if (props.text === undefined || (await writeClipboard(props.text))) feedback.flash()
	}

	return (
		<Show
			when={feedback.shown()}
			fallback={
				<IconButton
					label={props.iconDescription ?? "Copy to clipboard"}
					renderIcon={CopyIcon}
					kind={props.kind ?? "ghost"}
					size={props.size ?? "sm"}
					align={props.align}
					disabled={props.disabled}
					class={props.class}
					onClick={() => void press()}
				/>
			}
		>
			<span role="status" class={`flex items-center px-2 ${LABEL}`}>
				{props.feedback ?? "Copied"}
			</span>
		</Show>
	)
}

export type CopyProps = {
	text?: string
	feedback?: string
	feedbackTimeout?: number
	kind?: ButtonKind
	size?: ButtonSize
	disabled?: boolean
	class?: string
	/** The button's label. */
	children?: JSX.Element
	onClick?: () => void
}

/** Carbon's Copy: the same behaviour on a button with a label of its own —
 *  "Copy link", "Copy as cURL". The label gives way to the feedback and comes
 *  back; the button keeps its width meanwhile only if the two are similar in
 *  length, so keep the feedback short. */
export function Copy(props: CopyProps) {
	const feedback = createFeedback(() => props.feedbackTimeout ?? FEEDBACK_MS)

	const press = async () => {
		props.onClick?.()
		if (props.text === undefined || (await writeClipboard(props.text))) feedback.flash()
	}

	return (
		<Button
			kind={props.kind ?? "tertiary"}
			size={props.size}
			renderIcon={CopyIcon}
			disabled={props.disabled}
			class={props.class}
			onClick={() => void press()}
		>
			<span aria-live="polite">
				<Show when={feedback.shown()} fallback={props.children}>
					{props.feedback ?? "Copied"}
				</Show>
			</span>
		</Button>
	)
}
