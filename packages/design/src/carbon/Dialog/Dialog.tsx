import { createEffect, For, on, onMount, Show } from "solid-js"
import type { JSX } from "solid-js"
import Close from "@carbon/icons/es/close/16"
import { Icon } from "../../icons/Icon"
import { Scroller } from "../../internal/scroll"
import { BOX, INK_BAR, INK_BAR_CONTROL, INK_BAR_OVERLINE, LABEL } from "../../internal/styles"
import { Button } from "../Button/Button"
import { InlineLoading } from "../Loading/Loading"
import type { InlineLoadingStatus } from "../Loading/Loading"

export type DialogProps = {
	open?: boolean
	/** Modal: the page behind is inert and dimmed, and focus is held inside.
	 *  Off, the dialog sits over the page and the page stays usable. Not meant to
	 *  change while the dialog is open. */
	modal?: boolean
	/** `alertdialog` for a message that needs an answer before anything else. */
	role?: "dialog" | "alertdialog"
	"aria-label"?: string
	"aria-labelledby"?: string
	"aria-describedby"?: string
	/** Where focus goes when the dialog closes. Left off, the browser returns it
	 *  to whatever had it before. */
	focusAfterClose?: () => HTMLElement | undefined
	class?: string
	children?: JSX.Element
	/** Asks to be closed: Escape, or a press on the dimmed page behind. The
	 *  dialog does not close itself — set `open` to false. */
	onRequestClose?: () => void
	/** After it has closed. */
	onClose?: () => void
}

/** Carbon's Dialog (preview, as of @carbon/react 1.118): a dialog on the
 *  browser's own `<dialog>` element.
 *
 *  `Modal` and `ComposedModal` are built on Corvu's Dialog. This one is not, and
 *  that is the point of it in Carbon too: the platform now supplies what a
 *  dialog library used to — the top layer, the focus trap, the inert page, the
 *  backdrop, Escape — and a non-modal mode besides, which the other two do not
 *  have. It is ported as Carbon has it, native element and all; the rule that
 *  overlays are built on Corvu is about not hand-rolling what a primitive
 *  provides, and here the primitive is the browser's.
 *
 *  Dressed exactly as Modal is, so the three are indistinguishable on screen.
 *
 *  Rendered closed on the server and opened by an effect, so there is nothing
 *  for hydration to disagree about.
 */
export function Dialog(props: DialogProps) {
	let dialog: HTMLDialogElement | undefined

	const sync = (open: boolean) => {
		if (!dialog) return
		if (open && !dialog.open) {
			if (props.modal ?? true) dialog.showModal()
			else dialog.show()
		} else if (!open && dialog.open) {
			dialog.close()
			props.focusAfterClose?.()?.focus()
		}
	}

	onMount(() => sync(props.open ?? false))
	createEffect(on(() => props.open ?? false, sync, { defer: true }))

	return (
		<dialog
			ref={dialog}
			role={props.role === "alertdialog" ? "alertdialog" : undefined}
			aria-label={props["aria-label"]}
			aria-labelledby={props["aria-labelledby"]}
			aria-describedby={props["aria-describedby"]}
			// Escape. The browser would close the dialog itself; it is prevented, and
			// the owner asked, so `open` stays the one source of truth.
			onCancel={(event) => {
				event.preventDefault()
				props.onRequestClose?.()
			}}
			onClose={() => props.onClose?.()}
			// A press that lands on the dialog element itself, not on anything in it,
			// is a press on the backdrop: the content fills the box edge to edge.
			onClick={(event) => {
				if (event.target === dialog && (props.modal ?? true)) props.onRequestClose?.()
			}}
			class={`m-auto max-h-[86vh] w-[92vw] max-w-2xl flex-col ${BOX} p-0
				text-ink shadow-hard backdrop:bg-ink/40 open:flex ${props.class ?? ""}`}
		>
			{props.children}
		</dialog>
	)
}

/** The ink bar. Put a `DialogTitle` in it, and a `DialogControls` holding the
 *  close button. */
export function DialogHeader(props: { class?: string; children?: JSX.Element }) {
	return <div class={`${INK_BAR} ${props.class ?? ""}`}>{props.children}</div>
}

/** The controls on the bar. One: the close. */
export function DialogControls(props: { class?: string; children?: JSX.Element }) {
	return (
		<div class={`ml-auto flex shrink-0 items-center ${props.class ?? ""}`}>{props.children}</div>
	)
}

export function DialogCloseButton(props: { label?: string; onClick?: () => void }) {
	return (
		<button
			type="button"
			aria-label={props.label ?? "Close"}
			onClick={() => props.onClick?.()}
			class={INK_BAR_CONTROL}
		>
			<Icon glyph={Close} size={16} />
		</button>
	)
}

export function DialogTitle(props: { id?: string; class?: string; children?: JSX.Element }) {
	return (
		<h2
			id={props.id}
			class={`m-0 flex min-w-0 items-center gap-tight ${LABEL} ${props.class ?? ""}`}
		>
			{props.children}
		</h2>
	)
}

export function DialogSubtitle(props: { id?: string; class?: string; children?: JSX.Element }) {
	return (
		<p id={props.id} class={`${INK_BAR_OVERLINE} ${props.class ?? ""}`}>
			{props.children}
		</p>
	)
}

export type DialogBodyProps = {
	/** The content may be taller than the dialog: the body scrolls, and becomes a
	 *  tab stop so a keyboard can scroll it. */
	hasScrollingContent?: boolean
	class?: string
	children?: JSX.Element
}

export function DialogBody(props: DialogBodyProps) {
	return (
		<Show
			when={props.hasScrollingContent}
			fallback={
				<div class={`min-h-0 flex-1 p-2 text-body ${props.class ?? ""}`}>{props.children}</div>
			}
		>
			<Scroller class="flex-1" paneClass={`p-2 text-body ${props.class ?? ""}`} tabIndex={0}>
				{props.children}
			</Scroller>
		</Show>
	)
}

export type DialogFooterProps = {
	primaryButtonText?: JSX.Element
	primaryButtonDisabled?: boolean
	secondaryButtonText?: JSX.Element
	/** More than one secondary action. Takes the place of `secondaryButtonText`. */
	secondaryButtons?: { buttonText: JSX.Element; onClick: () => void }[]
	/** The primary action destroys something: it wears the hatch. */
	danger?: boolean
	/** Said to assistive tech before the primary button's own text. */
	dangerDescription?: string
	/** While not `inactive`, the primary button gives way to an InlineLoading. */
	loadingStatus?: InlineLoadingStatus
	loadingDescription?: string
	loadingIconDescription?: string
	class?: string
	children?: JSX.Element
	onRequestClose?: () => void
	onRequestSubmit?: () => void
	/** The secondary button, when it should not simply close. */
	onSecondarySubmit?: () => void
	onLoadingSuccess?: () => void
}

export function DialogFooter(props: DialogFooterProps) {
	const loading = () => (props.loadingStatus ?? "inactive") !== "inactive"

	return (
		<div
			class={`flex shrink-0 flex-wrap justify-end gap-2 border-t-2 border-ink p-2 ${
				props.class ?? ""
			}`}
		>
			{props.children}
			<Show
				when={props.secondaryButtons}
				fallback={
					<Show when={props.secondaryButtonText}>
						<Button
							kind="tertiary"
							flat
							onClick={() => (props.onSecondarySubmit ?? props.onRequestClose)?.()}
						>
							{props.secondaryButtonText}
						</Button>
					</Show>
				}
			>
				{(buttons) => (
					<For each={buttons()}>
						{(button) => (
							<Button kind="tertiary" flat onClick={button.onClick}>{button.buttonText}</Button>
						)}
					</For>
				)}
			</Show>
			<Show when={props.primaryButtonText}>
				<Show
					when={!loading()}
					fallback={
						<InlineLoading
							status={props.loadingStatus}
							description={props.loadingDescription}
							iconDescription={props.loadingIconDescription}
							onSuccess={props.onLoadingSuccess}
							class="px-2"
						/>
					}
				>
					<Button
						kind={props.danger ? "danger" : "primary"}
						flat
						disabled={props.primaryButtonDisabled}
						onClick={() => props.onRequestSubmit?.()}
					>
						<Show when={props.danger && props.dangerDescription}>
							<span class="sr-only">{props.dangerDescription}</span>
						</Show>
						{props.primaryButtonText}
					</Button>
				</Show>
			</Show>
		</div>
	)
}
