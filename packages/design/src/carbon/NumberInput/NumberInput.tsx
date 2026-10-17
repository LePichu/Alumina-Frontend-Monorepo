import { Show } from "solid-js"
import Add from "@carbon/icons/es/add/16"
import Subtract from "@carbon/icons/es/subtract/16"
import type { CarbonGlyph } from "../../icons/glyph"
import { Icon } from "../../icons/Icon"
import { createControllable, createId } from "../../internal/control"
import {
	describedBy,
	Field,
	FIELD_FLAGGED,
	FIELD_GROUP,
	FIELD_GROUP_FLUID,
	FIELD_INNER,
	FIELD_SIZE,
	fieldProps,
	INLINE_SIZE,
	useFluid,
} from "../../internal/field"
import type { FieldCommonProps } from "../../internal/field"

export type NumberInputProps = FieldCommonProps & {
	min?: number
	max?: number
	step?: number
	/** Controlled when there is an `onChange` to take the change. */
	value?: number
	/** Where it starts, when it is left to itself. */
	defaultValue?: number
	/** Trailing unit, shown inside the field. Never part of the value. */
	unit?: string
	disabled?: boolean
	readOnly?: boolean
	hideSteppers?: boolean
	/** The label sits beside the field, as Carbon's TextInput `inline` does. The
	 *  number is set right and bold: a column of these is a column of values, and
	 *  mica's and kiln's settings panels are exactly that. Steppers are dropped —
	 *  there is no room for them in a row, and arrow keys still step. */
	inline?: boolean
	onChange?: (value: number) => void
}

/** Carbon's NumberInput, hand-rolled on the spinbutton pattern.
 *
 *  The native spinners are hidden and replaced with real buttons: the browser's
 *  are drawn by the OS, so they are the one part of a number field that ignores
 *  the design system — the same reason Select is a hand-rolled listbox.
 *
 *  Arrow keys still step the value, because the input is a native `type="number"`
 *  underneath; the buttons exist for pointer and touch, where the native spinners
 *  are far under 44px.
 */
export function NumberInput(props: NumberInputProps) {
	const id = createId("number-input", () => props.id)
	const size = () => props.size ?? "md"
	const fluid = useFluid()
	// A row has no room for steppers, so an inline field drops them; a fluid
	// cell is never a row, whatever `inline` says.
	const inline = () => props.inline && !fluid

	const [value, setValue] = createControllable(
		() => props.value,
		props.defaultValue ?? 0,
		() => props.onChange,
	)
	const step = () => props.step ?? 1

	const clamp = (next: number) => {
		const low = props.min ?? Number.NEGATIVE_INFINITY
		const high = props.max ?? Number.POSITIVE_INFINITY
		return Math.min(Math.max(next, low), high)
	}

	const commit = (next: number) => {
		if (props.disabled || props.readOnly || Number.isNaN(next)) return
		// Stepping floats accumulates binary error (0.8 + 0.05 → 0.8500000000000001),
		// so the result is rounded to the step's own precision.
		const decimals = (String(step()).split(".")[1] ?? "").length
		const rounded = Number(clamp(next).toFixed(decimals))
		setValue(rounded)
		props.onChange?.(rounded)
	}

	const atMin = () => props.min !== undefined && value() <= props.min
	const atMax = () => props.max !== undefined && value() >= props.max

	const field = () => (
		<div
			class={`${fluid ? FIELD_GROUP_FLUID : FIELD_GROUP}
				${!fluid && (props.invalid || props.warn) ? FIELD_FLAGGED : ""}
				${props.disabled ? "cursor-not-allowed opacity-40" : ""}
				${props.readOnly && !fluid ? "border-transparent" : ""}`}
		>
			<input
				id={id()}
				type="number"
				inputmode="decimal"
				role="spinbutton"
				min={props.min}
				max={props.max}
				step={step()}
				value={value()}
				disabled={props.disabled}
				readonly={props.readOnly}
				aria-invalid={props.invalid ? "true" : undefined}
				aria-describedby={describedBy(id(), props)}
				onChange={(event) => commit(event.currentTarget.valueAsNumber)}
				// The native spinner is drawn by the OS and cannot be styled, so it
				// goes and the buttons below take its place.
				class={`${FIELD_INNER} min-w-0 flex-1 [appearance:textfield]
					[&::-webkit-inner-spin-button]:appearance-none
					[&::-webkit-outer-spin-button]:appearance-none
					${
					fluid
						? "p-0"
						: inline()
						? `${INLINE_SIZE[size()]} text-right font-bold`
						: FIELD_SIZE[size()]
				}`}
			/>
			<Show when={props.unit}>
				<span
					class={`self-center text-micro uppercase opacity-muted ${inline() ? "pr-tight" : "pr-2"}`}
				>
					{props.unit}
				</span>
			</Show>
			<Show when={!props.hideSteppers && !props.readOnly && !inline()}>
				{
					/* Ruled off from the number and from each other. In a fluid cell they
				    are two bare buttons instead: a rule that stops short of the cell's
				    edge is a mark, not a divider. */
				}
				<div class={`flex shrink-0 items-stretch ${fluid ? "" : "border-l-2 border-ink"}`}>
					<Stepper
						label={`Decrease ${typeof props.labelText === "string" ? props.labelText : "value"}`}
						glyph={Subtract}
						disabled={props.disabled || atMin()}
						onPress={() => commit(value() - step())}
					/>
					<Stepper
						label={`Increase ${typeof props.labelText === "string" ? props.labelText : "value"}`}
						glyph={Add}
						disabled={props.disabled || atMax()}
						onPress={() => commit(value() + step())}
						class={fluid ? "" : "border-l-2 border-ink"}
					/>
				</div>
			</Show>
		</div>
	)

	return (
		<Field id={id()} {...fieldProps(props)} inline={props.inline}>
			<Show when={inline()} fallback={field()}>
				<span class="block w-36">{field()}</span>
			</Show>
		</Field>
	)
}

function Stepper(props: {
	label: string
	glyph: CarbonGlyph
	disabled?: boolean
	class?: string
	onPress: () => void
}) {
	return (
		<button
			type="button"
			aria-label={props.label}
			disabled={props.disabled}
			// Pointer events, not mouse: the same handler has to serve touch.
			onPointerDown={(event) => {
				// Keep focus on the input, so a stepper press does not move the caret
				// out of the field the user is editing.
				event.preventDefault()
				if (!props.disabled) props.onPress()
			}}
			class={`flex w-8 cursor-pointer items-center justify-center pointer-coarse:min-w-touch
				border-0 bg-transparent text-ink hover:bg-ink hover:text-white
				focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink
				disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent
				disabled:hover:text-ink ${props.class ?? ""}`}
		>
			<Icon glyph={props.glyph} size={16} />
		</button>
	)
}
