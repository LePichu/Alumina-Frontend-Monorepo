import { children, Show } from "solid-js"
import type { JSX } from "solid-js"
import { createId } from "../../internal/control"
import {
	describedBy,
	Field,
	FIELD_BASE,
	FIELD_FLAGGED,
	FIELD_INNER,
	FIELD_READONLY,
	FIELD_SIZE,
	fieldProps,
	Fluid,
	useFluid,
} from "../../internal/field"
import type { FieldCommonProps, FieldSize } from "../../internal/field"
import { RULED_GRID, RULED_GRID_INNER } from "../../internal/styles"
import { Select } from "../Select/Select"

export type TimePickerProps = FieldCommonProps & {
	placeholder?: string
	value?: string
	/** What a valid time looks like, as the `pattern` attribute. Defaults to
	 *  twelve-hour `h:mm`; pass a twenty-four-hour one if there is no AM/PM
	 *  select beside it. */
	pattern?: string
	maxLength?: number
	disabled?: boolean
	readOnly?: boolean
	/** TimePickerSelects: AM/PM, a time zone. */
	children?: JSX.Element
	onInput?: (value: string) => void
	onChange?: (value: string) => void
}

/** Carbon's TimePicker: a time, typed.
 *
 *  A short text field and whatever selects qualify it. Carbon does not draw a
 *  clock face and neither does this — a time is four digits, and typing them is
 *  faster than any dial. The field is a recess; the selects beside it are boxes,
 *  because one is typed into and the others are pressed.
 */
export function TimePicker(props: TimePickerProps) {
	const id = createId("time-picker", () => props.id)
	const size = () => props.size ?? "md"
	const fluid = useFluid()
	// Resolved once — see "Slots" in CLAUDE.md.
	const selects = children(() => props.children)

	const input = () => (
		<input
			id={id()}
			type="text"
			inputmode="numeric"
			autocomplete="off"
			placeholder={props.placeholder ?? "hh:mm"}
			pattern={props.pattern ?? "(1[012]|[1-9]):[0-5][0-9]"}
			maxLength={props.maxLength ?? 5}
			value={props.value ?? ""}
			disabled={props.disabled}
			readOnly={props.readOnly}
			aria-invalid={props.invalid ? "true" : undefined}
			aria-describedby={describedBy(id(), props)}
			onInput={(event) => props.onInput?.(event.currentTarget.value)}
			onChange={(event) => props.onChange?.(event.currentTarget.value)}
			class={fluid
				? `${FIELD_INNER} w-full p-0 tabular-nums`
				: `${FIELD_BASE} ${FIELD_READONLY} ${FIELD_SIZE[size()]} tabular-nums ${
					props.invalid || props.warn ? FIELD_FLAGGED : ""
				}`}
		/>
	)

	return (
		<Show
			when={fluid}
			fallback={
				<Field id={id()} {...fieldProps(props)}>
					<div class="flex items-stretch gap-2">
						{
							/* Five characters wide plus its padding: `12:59` and no more.
						    A flex box, so the field stretches to the height of the selects
						    beside it as an item. It used to be `h-full` inside a block,
						    a percentage of a height that was itself being worked out —
						    which Firefox and Chromium settled 2px apart. */
						}
						<span class="flex w-20 shrink-0">{input()}</span>
						{selects()}
					</div>
				</Field>
			}
		>
			{(mode) => (
				// Fluid, the time and what qualifies it are cells of one frame. The
				// field's label and message belong to the time's cell; each select
				// brings its own label, now that there is a cell to show it in.
				<div
					class={`${mode().tiled ? RULED_GRID_INNER : RULED_GRID} auto-cols-fr grid-flow-col ${
						props.class ?? ""
					}`}
				>
					<Fluid tiled>
						<Field id={id()} {...fieldProps(props)} class="">{input()}</Field>
						{selects()}
					</Fluid>
				</div>
			)}
		</Show>
	)
}

export type TimePickerSelectProps = {
	id?: string
	/** Names the select for assistive tech. Not shown: the time field's label
	 *  covers the group. */
	labelText: string
	value?: string
	size?: FieldSize
	disabled?: boolean
	class?: string
	/** SelectItems. */
	children?: JSX.Element
	onChange?: (value: string) => void
}

/** Carbon's TimePickerSelect: a Select sized to sit beside a time.
 *
 *  Beside a time its label is hidden — the time field's covers the group. In a
 *  fluid picker it is a cell of its own, and a cell shows its label. */
export function TimePickerSelect(props: TimePickerSelectProps) {
	const fluid = useFluid()

	return (
		<Select
			id={props.id}
			labelText={props.labelText}
			hideLabel={!fluid}
			value={props.value}
			size={props.size}
			disabled={props.disabled}
			class={`${fluid ? "" : "w-28"} ${props.class ?? ""}`}
			onChange={props.onChange}
		>
			{props.children}
		</Select>
	)
}
