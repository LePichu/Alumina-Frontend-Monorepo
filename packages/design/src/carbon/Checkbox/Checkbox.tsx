import { children, createEffect, Show } from "solid-js"
import type { JSX } from "solid-js"
import { createControllable, createId } from "../../internal/control"
import { FieldMessage } from "../../internal/field"
import { CheckMark } from "../../internal/marks"
import { HELPER } from "../../internal/styles"

export type CheckboxProps = {
	id?: string
	labelText: JSX.Element
	/** Trade-off note under the label — the agent's reply forms lean on this. */
	helperText?: JSX.Element
	checked?: boolean
	indeterminate?: boolean
	disabled?: boolean
	readOnly?: boolean
	invalid?: boolean
	invalidText?: JSX.Element
	warn?: boolean
	warnText?: JSX.Element
	hideLabel?: boolean
	class?: string
	onChange?: (checked: boolean) => void
}

/** A real input, visually hidden, with the box drawn beside it. Native gives
 *  keyboard, touch and AT semantics for free; only the box is ours. The label
 *  carries a 44px minimum hit area even though the box is 16px. */
export function Checkbox(props: CheckboxProps) {
	const id = createId("checkbox", () => props.id)
	const messageId = () => `${id()}-message`
	// Resolved once — see "Slots" in CLAUDE.md.
	const helper = children(() => props.helperText)
	let input: HTMLInputElement | undefined

	// Works controlled or uncontrolled. The box is drawn from this rather than
	// from peer-checked:, which is a sibling selector and cannot reach inside.
	const [checked, setChecked] = createControllable(() => props.checked, false, () => props.onChange)

	// indeterminate is a property, never an attribute.
	createEffect(() => {
		if (input) input.indeterminate = props.indeterminate ?? false
	})

	return (
		<div class={props.class}>
			<label
				for={id()}
				class={`flex cursor-pointer items-center gap-2 pointer-coarse:min-h-touch
          ${props.disabled ? "cursor-not-allowed opacity-40" : ""}`}
			>
				<input
					ref={input}
					id={id()}
					type="checkbox"
					class="peer sr-only"
					checked={checked()}
					disabled={props.disabled}
					aria-invalid={props.invalid ? "true" : undefined}
					aria-describedby={props.invalid || props.warn ? messageId() : undefined}
					aria-readonly={props.readOnly ? "true" : undefined}
					onChange={(event) => {
						if (props.readOnly) {
							event.currentTarget.checked = checked()
							return
						}
						setChecked(event.currentTarget.checked)
						props.onChange?.(event.currentTarget.checked)
					}}
				/>
				<CheckMark checked={checked()} indeterminate={props.indeterminate} />
				{/* flex-1 so a label can push a count or a marker to the row's far edge. */}
				<span class={`min-w-0 flex-1 ${props.hideLabel ? "sr-only" : ""}`}>
					<span class="block text-body">{props.labelText}</span>
					<Show when={helper()}>
						<span class={`block ${HELPER}`}>{helper()}</span>
					</Show>
				</span>
			</label>
			<FieldMessage
				id={messageId()}
				invalid={props.invalid}
				invalidText={props.invalidText}
				warn={props.warn}
				warnText={props.warnText}
			/>
		</div>
	)
}
