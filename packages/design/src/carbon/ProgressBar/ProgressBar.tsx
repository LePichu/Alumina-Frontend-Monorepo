import { children, createUniqueId, Match, Show, Switch } from "solid-js"
import type { JSX } from "solid-js"
import CheckmarkFilled from "@carbon/icons/es/checkmark--filled/16"
import ErrorFilled from "@carbon/icons/es/error--filled/16"
import { Icon } from "../../icons/Icon"
import { BOX, LABEL } from "../../internal/styles"

export type ProgressBarStatus = "active" | "finished" | "error"

export type ProgressBarProps = {
	/** What is progressing. Required, as in Carbon: hide it with `hideLabel`. */
	label: JSX.Element
	hideLabel?: boolean
	helperText?: JSX.Element
	/** How far along, from 0 to `max`. Left off, the bar is indeterminate: it is
	 *  working, and does not know how much is left. */
	value?: number
	max?: number
	status?: ProgressBarStatus
	size?: "small" | "big"
	/** `inline` puts the label, the bar and the status on one line. Carbon's
	 *  `indented` is dropped: it insets the text from the bar's ends, and rules
	 *  here run edge to edge. */
	type?: "default" | "inline"
	class?: string
}

/** Carbon's ProgressBar: one measure, filling.
 *
 *  A box with ink in it, like a MeterChart with a single segment. Finished is a
 *  full bar and a tick; an error is the hatch across the whole track and an
 *  error glyph — the bar stops claiming any amount of progress at all, which is
 *  the honest reading of a failure, and it is hatch, not red.
 *
 *  Indeterminate is a block of ink crossing the track. Under reduced motion it
 *  parks as a hatch.
 */
export function ProgressBar(props: ProgressBarProps) {
	const id = createUniqueId()
	const label = children(() => props.label)
	const helper = children(() => props.helperText)
	const status = (): ProgressBarStatus => props.status ?? "active"
	const max = () => props.max ?? 100
	const indeterminate = () => props.value === undefined && status() === "active"
	const share = () => {
		if (status() === "finished") return 100
		const value = Math.min(Math.max(props.value ?? 0, 0), max())
		return max() > 0 ? (value / max()) * 100 : 0
	}

	const track = () => (
		<div
			role="progressbar"
			aria-labelledby={`${id}-label`}
			aria-describedby={helper() ? `${id}-helper` : undefined}
			aria-busy={status() === "active" ? "true" : undefined}
			aria-invalid={status() === "error" ? "true" : undefined}
			aria-valuemin={indeterminate() ? undefined : 0}
			aria-valuemax={indeterminate() ? undefined : max()}
			aria-valuenow={indeterminate() ? undefined : status() === "finished" ? max() : props.value}
			class={`min-w-0 flex-1 ${BOX} ${props.size === "small" ? "h-2" : "h-4"} ${
				status() === "error" ? "bg-hatch" : ""
			}`}
		>
			<Show when={status() !== "error"}>
				<div
					style={{ "--progress": `${share()}%` }}
					class={`h-full ${
						indeterminate()
							? "bar-sweep w-full"
							: "w-[var(--progress)] bg-ink transition-[width] duration-220"
					}`}
				/>
			</Show>
		</div>
	)

	const mark = () => (
		<Switch>
			<Match when={status() === "finished"}>
				<Icon glyph={CheckmarkFilled} size={16} label="finished" />
			</Match>
			<Match when={status() === "error"}>
				<Icon glyph={ErrorFilled} size={16} label="error" />
			</Match>
		</Switch>
	)

	return (
		<Show
			when={props.type === "inline"}
			fallback={
				<div class={props.class}>
					<div
						class={`mb-tight flex items-center justify-between gap-2 ${LABEL} ${
							props.hideLabel ? "sr-only" : ""
						}`}
					>
						<span id={`${id}-label`} class="min-w-0 truncate">{label()}</span>
						{mark()}
					</div>
					{track()}
					<Show when={helper()}>
						<p
							id={`${id}-helper`}
							class={`m-0 mt-tight text-micro ${
								status() === "error" ? "font-bold uppercase" : "opacity-muted"
							}`}
						>
							{helper()}
						</p>
					</Show>
				</div>
			}
		>
			<div class={`flex items-center gap-2 ${props.class ?? ""}`}>
				<span
					id={`${id}-label`}
					class={`shrink-0 ${LABEL} ${props.hideLabel ? "sr-only" : ""}`}
				>
					{label()}
				</span>
				{track()}
				{mark()}
				<Show when={helper()}>
					<span id={`${id}-helper`} class="shrink-0 text-micro tabular-nums opacity-muted">
						{helper()}
					</span>
				</Show>
			</div>
		</Show>
	)
}
