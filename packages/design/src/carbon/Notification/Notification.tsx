import { children, createEffect, onCleanup, onMount, Show } from "solid-js"
import type { JSX } from "solid-js"
import Close from "@carbon/icons/es/close/16"
import { Icon } from "../../icons/Icon"
import { STATUS_GLYPH } from "../../internal/severity"
import type { Status } from "../../internal/severity"
import { BOX, LABEL } from "../../internal/styles"
import { Button } from "../Button/Button"

/** Carbon's notifications, all four.
 *
 *  They speak the same way, and none of it is colour: a glyph for the kind, the
 *  kind spelled out in uppercase, and a bold title. Carbon's `lowContrast` is
 *  dropped everywhere — there is one contrast.
 *
 *  The three that *arrive* — inline, toast, actionable — are lifted off the
 *  page with the hard shadow. `Callout` was always there, so it is set into the
 *  page instead.
 */

export type NotificationKind = Status

function CloseButton(props: { label?: string; onClose?: () => void }) {
	return (
		<button
			type="button"
			onClick={() => props.onClose?.()}
			aria-label={props.label ?? "Close notification"}
			class="-m-tight flex shrink-0 cursor-pointer items-center border-0 bg-transparent p-tight
				text-ink hover:bg-gray pointer-coarse:min-h-touch pointer-coarse:min-w-touch"
		>
			<Icon glyph={Close} size={16} />
		</button>
	)
}

/** The kind, as its glyph. Named for assistive tech, since the glyph is the
 *  severity. */
function Glyph(props: { kind: NotificationKind }) {
	return (
		<span class="shrink-0">
			<Icon glyph={STATUS_GLYPH[props.kind]} size={16} label={props.kind} />
		</span>
	)
}

/** The kind and the title: the line every notification leads with. */
function Lead(props: { kind: NotificationKind; title: JSX.Element; id?: string }) {
	return (
		<p id={props.id} class={`m-0 ${LABEL}`}>
			<span class="opacity-muted">{props.kind}</span>
			<span class="ml-snug">{props.title}</span>
		</p>
	)
}

export type InlineNotificationProps = {
	kind?: NotificationKind
	title: JSX.Element
	subtitle?: JSX.Element
	hideCloseButton?: boolean
	class?: string
	onClose?: () => void
}

/** Carbon's InlineNotification: a message set in the flow of the page, where
 *  the thing it is about is. */
export function InlineNotification(props: InlineNotificationProps) {
	const kind = (): NotificationKind => props.kind ?? "info"
	// Resolved once — see "Slots" in CLAUDE.md.
	const subtitle = children(() => props.subtitle)

	return (
		<div
			role={kind() === "error" ? "alert" : "status"}
			class={`flex items-start gap-2 ${BOX} p-2 shadow-hard ${props.class ?? ""}`}
		>
			<Glyph kind={kind()} />
			<div class="min-w-0 flex-1">
				<Lead kind={kind()} title={props.title} />
				<Show when={subtitle()}>
					<p class="m-0 mt-tight text-body">{subtitle()}</p>
				</Show>
			</div>
			<Show when={!props.hideCloseButton}>
				<CloseButton onClose={props.onClose} />
			</Show>
		</div>
	)
}

export type ToastNotificationProps = {
	kind?: NotificationKind
	title: JSX.Element
	subtitle?: JSX.Element
	/** A last, quieter line: when it happened. */
	caption?: JSX.Element
	/** Dismisses itself after this many milliseconds. Left off, or 0, it stays
	 *  until closed. */
	timeout?: number
	hideCloseButton?: boolean
	/** `alert` interrupts a screen reader; `status` waits its turn. Errors are
	 *  alerts unless told otherwise. */
	role?: "alert" | "status" | "log"
	class?: string
	onClose?: () => void
	/** Fired when `timeout` runs out, before `onClose`. */
	onCloseButtonClick?: () => void
}

/** Carbon's ToastNotification: a message that arrives on its own, over the page.
 *
 *  This is the box and its clock. Where toasts stack — which corner, how many —
 *  is the app's: put them in a fixed column and remove one when it calls
 *  `onClose`. A toast never holds an action; one that needs a button is an
 *  ActionableNotification, which does not vanish by itself.
 */
export function ToastNotification(props: ToastNotificationProps) {
	const kind = (): NotificationKind => props.kind ?? "info"
	const subtitle = children(() => props.subtitle)
	const caption = children(() => props.caption)

	createEffect(() => {
		const ms = props.timeout
		if (!ms) return
		const timer = setTimeout(() => props.onClose?.(), ms)
		onCleanup(() => clearTimeout(timer))
	})

	return (
		<div
			role={props.role ?? (kind() === "error" ? "alert" : "status")}
			class={`flex w-72 max-w-full items-start gap-2 ${BOX} p-2 shadow-hard ${props.class ?? ""}`}
		>
			<Glyph kind={kind()} />
			<div class="min-w-0 flex-1">
				<Lead kind={kind()} title={props.title} />
				<Show when={subtitle()}>
					<p class="m-0 mt-tight text-body">{subtitle()}</p>
				</Show>
				<Show when={caption()}>
					<p class="m-0 mt-2 text-micro opacity-muted">{caption()}</p>
				</Show>
			</div>
			<Show when={!props.hideCloseButton}>
				<CloseButton
					onClose={() => {
						props.onCloseButtonClick?.()
						props.onClose?.()
					}}
				/>
			</Show>
		</div>
	)
}

export type ActionableNotificationProps = {
	kind?: NotificationKind
	title: JSX.Element
	subtitle?: JSX.Element
	actionButtonLabel: string
	/** Laid out on one line, like InlineNotification, rather than stacked like a
	 *  toast. */
	inline?: boolean
	hideCloseButton?: boolean
	/** Takes focus when it appears. On by default, as in Carbon: something that
	 *  asks for a decision should not have to be found. */
	hasFocus?: boolean
	closeOnEscape?: boolean
	class?: string
	onActionButtonClick?: () => void
	onClose?: () => void
}

/** Carbon's ActionableNotification: a notification that asks for something.
 *
 *  It is an `alertdialog`: announced at once, and it takes focus. It does not
 *  time out — a message with a button in it cannot be allowed to disappear
 *  while someone is reaching for the button.
 */
export function ActionableNotification(props: ActionableNotificationProps) {
	const kind = (): NotificationKind => props.kind ?? "info"
	const subtitle = children(() => props.subtitle)
	let root: HTMLDivElement | undefined

	onMount(() => {
		if (props.hasFocus ?? true) root?.querySelector<HTMLElement>("[data-action] button")?.focus()
	})

	return (
		<div
			ref={root}
			role="alertdialog"
			aria-label={typeof props.title === "string" ? props.title : undefined}
			onKeyDown={(event) => {
				if (event.key === "Escape" && (props.closeOnEscape ?? true)) props.onClose?.()
			}}
			class={`flex gap-2 ${BOX} p-2 shadow-hard ${
				props.inline ? "flex-wrap items-center" : "w-72 max-w-full items-start"
			} ${props.class ?? ""}`}
		>
			<Glyph kind={kind()} />
			<div class={`min-w-0 flex-1 ${props.inline ? "" : "flex flex-col"}`}>
				<Lead kind={kind()} title={props.title} />
				<Show when={subtitle()}>
					<p class="m-0 mt-tight text-body">{subtitle()}</p>
				</Show>
				<Show when={!props.inline}>
					<span data-action="" class="mt-2 self-start">
						<Button kind="tertiary" size="sm" onClick={() => props.onActionButtonClick?.()}>
							{props.actionButtonLabel}
						</Button>
					</span>
				</Show>
			</div>
			<Show when={props.inline}>
				<span data-action="" class="shrink-0">
					<Button kind="tertiary" size="sm" onClick={() => props.onActionButtonClick?.()}>
						{props.actionButtonLabel}
					</Button>
				</span>
			</Show>
			<Show when={!props.hideCloseButton}>
				<CloseButton onClose={props.onClose} />
			</Show>
		</div>
	)
}

export type CalloutProps = {
	kind?: NotificationKind
	title?: JSX.Element
	subtitle?: JSX.Element
	/** An optional action, set under the text. */
	actionButtonLabel?: string
	class?: string
	onActionButtonClick?: () => void
}

/** Carbon's Callout (its StaticNotification, renamed): a note that is part of
 *  the page.
 *
 *  Not a response to anything the user did, so it is not a live region and it
 *  cannot be dismissed — it was always there. That is also why it has no
 *  shadow: the three notifications that *arrive* are lifted off the page, and
 *  this one is set into it, with a heavy rule down its leading edge instead.
 */
export function Callout(props: CalloutProps) {
	const kind = (): NotificationKind => props.kind ?? "info"
	const title = children(() => props.title)
	const subtitle = children(() => props.subtitle)

	return (
		<div
			class={`flex items-start gap-2 border-2 border-l-8 border-ink bg-white p-2 ${
				props.class ?? ""
			}`}
		>
			<Glyph kind={kind()} />
			<div class="min-w-0 flex-1">
				<Lead kind={kind()} title={title()} />
				<Show when={subtitle()}>
					<p class="m-0 mt-tight text-body">{subtitle()}</p>
				</Show>
				<Show when={props.actionButtonLabel}>
					<Button
						kind="tertiary"
						size="sm"
						flat
						class="mt-2"
						onClick={() => props.onActionButtonClick?.()}
					>
						{props.actionButtonLabel}
					</Button>
				</Show>
			</div>
		</div>
	)
}
