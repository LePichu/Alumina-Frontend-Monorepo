import { children, createContext, Show, useContext } from "solid-js"
import type { JSX } from "solid-js"
import { createControllable, createId } from "../../internal/control"
import { FieldMessage } from "../../internal/field"
import { RadioMark } from "../../internal/marks"
import { HELPER, LABEL } from "../../internal/styles"

type RadioGroupContextValue = {
	name: () => string
	value: () => string | undefined
	disabled: () => boolean
	select: (value: string) => void
}

const RadioGroupContext = createContext<RadioGroupContextValue>()

export type RadioButtonGroupProps = {
	legendText?: JSX.Element
	name?: string
	valueSelected?: string
	defaultSelected?: string
	orientation?: "horizontal" | "vertical"
	disabled?: boolean
	invalid?: boolean
	invalidText?: JSX.Element
	warn?: boolean
	warnText?: JSX.Element
	helperText?: JSX.Element
	class?: string
	children?: JSX.Element
	onChange?: (value: string) => void
}

/** No divider lines between options. Grouping is whitespace, per CLAUDE.md. */
export function RadioButtonGroup(props: RadioButtonGroupProps) {
	const name = createId("radio-group", () => props.name)

	// Resolved once — see "Slots" in CLAUDE.md.
	const legend = children(() => props.legendText)
	// defaultSelected seeds it; valueSelected, when given, always wins.
	const [selected, setSelected] = createControllable(
		() => props.valueSelected,
		props.defaultSelected,
		() => props.onChange,
	)

	const ctx: RadioGroupContextValue = {
		name,
		value: selected,
		disabled: () => props.disabled ?? false,
		select: (value) => {
			setSelected(value)
			props.onChange?.(value)
		},
	}

	return (
		<RadioGroupContext.Provider value={ctx}>
			<fieldset class={`m-0 border-0 p-0 ${props.class ?? ""}`}>
				<Show when={legend()}>
					<legend class={`mb-tight p-0 ${LABEL}`}>{legend()}</legend>
				</Show>
				{
					/* A stacked group is a list and reads tighter than a row, where each
				    option needs air on both sides to separate from its neighbour. */
				}
				<div
					class={`flex ${
						props.orientation === "horizontal" ? "flex-row flex-wrap gap-4" : "flex-col gap-tight"
					}`}
				>
					{props.children}
				</div>
				<FieldMessage
					invalid={props.invalid}
					invalidText={props.invalidText}
					warn={props.warn}
					warnText={props.warnText}
					helperText={props.helperText}
				/>
			</fieldset>
		</RadioGroupContext.Provider>
	)
}

export type RadioButtonProps = {
	id?: string
	value: string
	labelText: JSX.Element
	/** Sub-description under the label. CLAUDE.md calls for helper text per
	 *  option, and the agent's reply forms depend on it. */
	helperText?: JSX.Element
	disabled?: boolean
	class?: string
}

export function RadioButton(props: RadioButtonProps) {
	const ctx = useContext(RadioGroupContext)
	if (!ctx) throw new Error("RadioButton must be used inside a RadioButtonGroup")

	const id = createId("radio", () => props.id)
	const disabled = () => props.disabled || ctx.disabled()
	// Resolved once — see "Slots" in CLAUDE.md.
	const helper = children(() => props.helperText)

	return (
		<label
			for={id()}
			class={`flex cursor-pointer items-center gap-2 pointer-coarse:min-h-touch
        ${disabled() ? "cursor-not-allowed opacity-40" : ""} ${props.class ?? ""}`}
		>
			<input
				id={id()}
				type="radio"
				class="peer sr-only"
				name={ctx.name()}
				value={props.value}
				checked={ctx.value() === props.value}
				disabled={disabled()}
				onChange={() => ctx.select(props.value)}
			/>
			<RadioMark checked={ctx.value() === props.value} />
			<span class="min-w-0 flex-1">
				<span class="block text-body">{props.labelText}</span>
				<Show when={helper()}>
					<span class={`block ${HELPER}`}>{helper()}</span>
				</Show>
			</span>
		</label>
	)
}
