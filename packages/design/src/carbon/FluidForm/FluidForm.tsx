import { For, Show } from "solid-js"
import type { JSX } from "solid-js"
import { Fluid, useFluid } from "../../internal/field"
import { RULED_GRID, RULED_GRID_INNER } from "../../internal/styles"
import { ComboBox } from "../ComboBox/ComboBox"
import type { ComboBoxProps } from "../ComboBox/ComboBox"
import { DatePicker, DatePickerInput } from "../DatePicker/DatePicker"
import type { DatePickerInputProps, DatePickerProps } from "../DatePicker/DatePicker"
import { Dropdown } from "../Dropdown/Dropdown"
import type { DropdownProps } from "../Dropdown/Dropdown"
import { Form } from "../Form/Form"
import type { FormProps } from "../Form/Form"
import { FilterableMultiSelect, MultiSelect } from "../MultiSelect/MultiSelect"
import type { FilterableMultiSelectProps, MultiSelectProps } from "../MultiSelect/MultiSelect"
import { NumberInput } from "../NumberInput/NumberInput"
import type { NumberInputProps } from "../NumberInput/NumberInput"
import { PasswordInput } from "../PasswordInput/PasswordInput"
import type { PasswordInputProps } from "../PasswordInput/PasswordInput"
import { Search } from "../Search/Search"
import type { SearchProps } from "../Search/Search"
import { Select } from "../Select/Select"
import type { SelectProps } from "../Select/Select"
import { SkeletonText } from "../Skeleton/Skeleton"
import { TextArea } from "../TextArea/TextArea"
import type { TextAreaProps } from "../TextArea/TextArea"
import { TextInput } from "../TextInput/TextInput"
import type { TextInputProps } from "../TextInput/TextInput"
import { TimePicker, TimePickerSelect } from "../TimePicker/TimePicker"
import type { TimePickerProps, TimePickerSelectProps } from "../TimePicker/TimePicker"

/** Carbon's fluid forms: the label moves *inside* the field, and the field
 *  becomes a cell that tiles against its neighbours.
 *
 *  A fluid field is not a different component. It is the ordinary one rendered
 *  under a context that says "you are a cell" — which is how Carbon builds them
 *  too — so everything a field does stacked it does fluid, and there is no
 *  second implementation to keep in step. `Field` in `internal/field.tsx` draws
 *  the cell; each control drops its own rule or box when it finds itself in one.
 *
 *  Unstable in Carbon (`unstable__Fluid*`), and ported as it stands. The names
 *  and props are Carbon's and will move when Carbon's do.
 *
 *  What a cell is here: white, 2px ink, the label in the label voice at the
 *  top, the value under it, and the same light ground on focus that every other
 *  field uses. It is the one place a text field is boxed — the box is the
 *  point of the layout — and it has no shadow, since a form of them is one
 *  object, not twelve.
 */

/** Carbon's FluidForm: a form whose fields are cells of one ruled frame.
 *
 *  The frame is an ink ground showing through a 2px gap, so each rule between
 *  two fields is drawn once. Columns are the caller's — `class="grid-cols-2"`,
 *  and `class="col-span-2"` on a field that should run the width. Fill the last
 *  row: an empty cell shows the ground, which is ink.
 */
export function FluidForm(props: FormProps) {
	return (
		<Fluid tiled>
			<Form {...props} />
		</Fluid>
	)
}

export function FluidTextInput(props: TextInputProps) {
	return (
		<Fluid>
			<TextInput {...props} />
		</Fluid>
	)
}

export function FluidPasswordInput(props: PasswordInputProps) {
	return (
		<Fluid>
			<PasswordInput {...props} />
		</Fluid>
	)
}

export function FluidTextArea(props: TextAreaProps) {
	return (
		<Fluid>
			<TextArea {...props} />
		</Fluid>
	)
}

export function FluidNumberInput(props: NumberInputProps) {
	return (
		<Fluid>
			<NumberInput {...props} />
		</Fluid>
	)
}

export function FluidSearch(props: SearchProps) {
	return (
		<Fluid>
			<Search {...props} />
		</Fluid>
	)
}

export function FluidSelect(props: SelectProps) {
	return (
		<Fluid>
			<Select {...props} />
		</Fluid>
	)
}

export function FluidDropdown<Item>(props: DropdownProps<Item>) {
	return (
		<Fluid>
			<Dropdown {...props} />
		</Fluid>
	)
}

export function FluidComboBox<Item>(props: ComboBoxProps<Item>) {
	return (
		<Fluid>
			<ComboBox {...props} />
		</Fluid>
	)
}

/** Carbon's FluidMultiSelect. `isFilterable` makes it the one you type into,
 *  as it does there. */
export function FluidMultiSelect<Item>(
	props:
		& MultiSelectProps<Item>
		& Pick<
			FilterableMultiSelectProps<Item>,
			"placeholder" | "filterItems" | "onInputValueChange"
		>
		& { isFilterable?: boolean },
) {
	return (
		<Fluid>
			<Show when={props.isFilterable} fallback={<MultiSelect {...props} />}>
				<FilterableMultiSelect {...props} />
			</Show>
		</Fluid>
	)
}

/** Carbon's FluidDatePicker. A range is two halves of one box. */
export function FluidDatePicker(props: DatePickerProps) {
	return (
		<Fluid>
			<DatePicker {...props} />
		</Fluid>
	)
}

/** Carbon's FluidDatePickerInput. Inside a FluidDatePicker the plain
 *  DatePickerInput is already fluid; this is here for the name. */
export function FluidDatePickerInput(props: DatePickerInputProps) {
	return (
		<Fluid>
			<DatePickerInput {...props} />
		</Fluid>
	)
}

/** Carbon's FluidTimePicker: the time and what qualifies it, as cells of one
 *  box. */
export function FluidTimePicker(props: TimePickerProps) {
	return (
		<Fluid>
			<TimePicker {...props} />
		</Fluid>
	)
}

export function FluidTimePickerSelect(props: TimePickerSelectProps) {
	return (
		<Fluid>
			<TimePickerSelect {...props} />
		</Fluid>
	)
}

/* ---- skeletons ---- */

type CellSkeletonProps = { class?: string; children?: JSX.Element }

/** One cell before its content: where the label will be, and where the value
 *  will. The ink edges stay, as they do in every skeleton here — they are the
 *  layout, and only the text is missing. */
function Cell(props: CellSkeletonProps) {
	const fluid = useFluid()
	return (
		<div
			aria-hidden="true"
			class={`flex min-w-0 flex-col gap-snug bg-white px-2 pb-snug pt-snug ${
				fluid?.tiled ? "" : "border-2 border-ink"
			} ${props.class ?? ""}`}
		>
			<SkeletonText width="5rem" />
			{props.children ?? <SkeletonText width="60%" />}
		</div>
	)
}

export function FluidTextInputSkeleton(props: { class?: string }) {
	return <Cell class={props.class} />
}

export const FluidNumberInputSkeleton = FluidTextInputSkeleton
export const FluidSearchSkeleton = FluidTextInputSkeleton
export const FluidSelectSkeleton = FluidTextInputSkeleton
export const FluidDropdownSkeleton = FluidTextInputSkeleton
export const FluidComboBoxSkeleton = FluidTextInputSkeleton
export const FluidMultiSelectSkeleton = FluidTextInputSkeleton

export function FluidTextAreaSkeleton(props: { class?: string }) {
	return (
		<Cell class={props.class}>
			<SkeletonText paragraph lineCount={3} />
		</Cell>
	)
}

/** Several cells in one frame. */
function Cells(props: { count: number; class?: string }) {
	const fluid = useFluid()
	return (
		<div
			aria-hidden="true"
			class={`${fluid?.tiled ? RULED_GRID_INNER : RULED_GRID} auto-cols-fr grid-flow-col ${
				props.class ?? ""
			}`}
		>
			<Fluid tiled>
				<For each={Array.from({ length: props.count })}>{() => <Cell />}</For>
			</Fluid>
		</div>
	)
}

export function FluidDatePickerSkeleton(
	props: { datePickerType?: "simple" | "single" | "range"; class?: string },
) {
	return <Cells count={props.datePickerType === "range" ? 2 : 1} class={props.class} />
}

/** `isOnlyTwo` is Carbon's: the time and one select, rather than two. */
export function FluidTimePickerSkeleton(props: { isOnlyTwo?: boolean; class?: string }) {
	return <Cells count={props.isOnlyTwo ? 2 : 3} class={props.class} />
}
