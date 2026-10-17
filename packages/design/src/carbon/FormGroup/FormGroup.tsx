import { children, Show } from "solid-js"
import type { JSX } from "solid-js"
import { FieldMessage } from "../../internal/field"
import { LABEL } from "../../internal/styles"

export type FormGroupProps = {
	/** Carbon's legendText. Required: a fieldset without a legend is a group
	 *  assistive tech cannot name. Hide it with `hideLegend`, never omit it. */
	legendText: JSX.Element
	hideLegend?: boolean
	/** Trailing aside in the legend — "detected", "required", "read from
	 *  README.md". Sentence case and dimmed, so it reads as a note on the label
	 *  rather than part of it. */
	hint?: JSX.Element
	helperText?: JSX.Element
	invalid?: boolean
	invalidText?: JSX.Element
	warn?: boolean
	warnText?: JSX.Element
	disabled?: boolean
	class?: string
	children?: JSX.Element
}

/** Carbon's FormGroup: a `<fieldset>` and its `<legend>`.
 *
 *  A label standing over several controls is not a `<label>` — it has no single
 *  input to point at — and it is not a heading either. Every app had reached for
 *  a bold uppercase `<p>` or `<span>` here, which looks right and tells a screen
 *  reader nothing. The legend is in the same voice as a field's own label, so a
 *  group and a single field line up down a form.
 *
 *  No rule between groups: CLAUDE.md keeps dividers out of checkbox and radio
 *  groups, and grouping here is whitespace.
 */
export function FormGroup(props: FormGroupProps) {
	const legend = children(() => props.legendText)
	const hint = children(() => props.hint)

	return (
		<fieldset disabled={props.disabled} class={`m-0 min-w-0 border-0 p-0 ${props.class ?? ""}`}>
			<legend
				class={`mb-tight p-0 ${LABEL} ${props.hideLegend ? "sr-only" : ""}`}
			>
				{legend()}
				<Show when={hint()}>
					<span class="ml-2 font-normal normal-case opacity-muted">{hint()}</span>
				</Show>
			</legend>
			{props.children}
			<FieldMessage
				invalid={props.invalid}
				invalidText={props.invalidText}
				warn={props.warn}
				warnText={props.warnText}
				helperText={props.helperText}
			/>
		</fieldset>
	)
}
