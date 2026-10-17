import { createContext, Show, useContext } from "solid-js"
import type { JSX } from "solid-js"
import CheckmarkOutline from "@carbon/icons/es/checkmark--outline/16"
import CircleDash from "@carbon/icons/es/circle-dash/16"
import Incomplete from "@carbon/icons/es/incomplete/16"
import WarningFilled from "@carbon/icons/es/warning--filled/16"
import type { CarbonGlyph } from "../../icons/glyph"
import { Icon } from "../../icons/Icon"

export type ProgressStepStatus = "complete" | "current" | "incomplete" | "invalid" | "disabled"

type ProgressContextValue = {
	currentIndex: () => number
	vertical: () => boolean
	claimIndex: () => number
}

const ProgressContext = createContext<ProgressContextValue>()

export type ProgressIndicatorProps = {
	currentIndex?: number
	vertical?: boolean
	class?: string
	children?: JSX.Element
}

export function ProgressIndicator(props: ProgressIndicatorProps) {
	// Components run once, so a plain counter hands each step a stable index and
	// Carbon's composition API (<ProgressIndicator><ProgressStep/>…) is preserved.
	let counter = 0

	const value: ProgressContextValue = {
		currentIndex: () => props.currentIndex ?? 0,
		vertical: () => props.vertical ?? false,
		claimIndex: () => counter++,
	}

	return (
		<ProgressContext.Provider value={value}>
			<ul
				// Horizontal steps wrap: five of them do not fit across a phone, and a row
				// that runs off the screen hides how far along you are.
				class={`m-0 flex list-none p-0 ${
					props.vertical ? "flex-col gap-4" : "flex-row flex-wrap gap-x-8 gap-y-4"
				}
          ${props.class ?? ""}`}
			>
				{props.children}
			</ul>
		</ProgressContext.Provider>
	)
}

const GLYPH: Record<ProgressStepStatus, CarbonGlyph> = {
	complete: CheckmarkOutline,
	current: Incomplete,
	incomplete: CircleDash,
	invalid: WarningFilled,
	disabled: CircleDash,
}

export type ProgressStepProps = {
	label: string
	secondaryLabel?: string
	description?: string
	invalid?: boolean
	disabled?: boolean
	class?: string
}

export function ProgressStep(props: ProgressStepProps) {
	const ctx = useContext(ProgressContext)
	if (!ctx) throw new Error("ProgressStep must be used inside a ProgressIndicator")
	const index = ctx.claimIndex()

	const status = (): ProgressStepStatus => {
		if (props.disabled) return "disabled"
		if (props.invalid) return "invalid"
		if (index < ctx.currentIndex()) return "complete"
		if (index === ctx.currentIndex()) return "current"
		return "incomplete"
	}

	return (
		<li
			aria-current={status() === "current" ? "step" : undefined}
			class={`flex items-start gap-snug ${props.disabled ? "opacity-40" : ""} ${props.class ?? ""}`}
		>
			<span class="shrink-0">
				<Icon glyph={GLYPH[status()]} size={16} label={status()} />
			</span>
			<span class="min-w-0">
				<span
					class={`block text-micro uppercase ${
						status() === "current" ? "font-bold" : "font-normal"
					}`}
					title={props.description}
				>
					{props.label}
				</span>
				<Show when={props.secondaryLabel}>
					<span class="block text-micro opacity-muted">{props.secondaryLabel}</span>
				</Show>
			</span>
		</li>
	)
}
