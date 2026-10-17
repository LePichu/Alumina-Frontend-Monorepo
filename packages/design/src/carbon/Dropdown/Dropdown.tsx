import { createSignal, For, Show } from "solid-js"
import type { JSX } from "solid-js"
import { createControllable, createId } from "../../internal/control"
import { describedBy, Field, fieldProps } from "../../internal/field"
import type { FieldCommonProps } from "../../internal/field"
import { defaultItemToString, ListOption, PickerField } from "../../internal/listbox"

export type DropdownProps<Item> = Omit<FieldCommonProps, "labelText"> & {
	items: Item[]
	/** How an item reads, in the trigger and for type-ahead. Defaults to the item
	 *  itself if it is text, or its `label` / `text` field. */
	itemToString?: (item: Item) => string
	/** How an item is drawn in the list, when that is more than its text. */
	itemToElement?: (item: Item) => JSX.Element
	/** Controlled when given. */
	selectedItem?: Item
	initialSelectedItem?: Item
	/** Carbon's label: what the trigger says before anything is chosen. */
	label?: string
	/** Carbon's titleText: the field's label, above the trigger. */
	titleText?: JSX.Element
	/** `inline` puts the title beside the trigger — a settings row. */
	type?: "default" | "inline"
	/** Which way the list opens. It still flips if there is no room. */
	direction?: "top" | "bottom"
	disabled?: boolean
	/** Shows its value; cannot be opened. */
	readOnly?: boolean
	onChange?: (change: { selectedItem: Item }) => void
}

/** Carbon's Dropdown: choose one of a list of items.
 *
 *  `Select` is the same control with a different way in — options written as
 *  children — and both are the WAI-ARIA select-only combobox. This one is
 *  driven by data: an array of anything, plus how to read an item. Use it when
 *  the options are objects or arrive at runtime, and Select when they are a
 *  handful of literals in the markup.
 *
 *  Both are `PickerField` underneath.
 */
export function Dropdown<Item>(props: DropdownProps<Item>) {
	const id = createId("dropdown", () => props.id)
	const inline = () => props.type === "inline"
	const [selected, setSelected] = createControllable<Item | undefined>(
		() => props.selectedItem,
		props.initialSelectedItem,
		() => props.onChange,
	)
	const [open, setOpen] = createSignal(false)
	const text = (item: Item) => (props.itemToString ?? defaultItemToString)(item)

	return (
		<Field
			id={id()}
			{...fieldProps(props)}
			labelText={props.titleText}
			inline={inline()}
			stretch
		>
			<PickerField
				id={id()}
				describedBy={describedBy(id(), props)}
				size={props.size ?? "md"}
				open={open()}
				setOpen={setOpen}
				text={
					<Show when={selected() !== undefined} fallback={props.label ?? "Choose an option"}>
						{text(selected() as Item)}
					</Show>
				}
				empty={selected() === undefined}
				disabled={props.disabled}
				readOnly={props.readOnly}
				invalid={props.invalid}
				warn={props.warn}
				inline={inline()}
				direction={props.direction}
			>
				<For each={props.items}>
					{(item) => (
						<ListOption
							focusable
							selected={selected() === item}
							onSelect={() => {
								setSelected(item)
								props.onChange?.({ selectedItem: item })
								setOpen(false)
							}}
						>
							{props.itemToElement ? props.itemToElement(item) : text(item)}
						</ListOption>
					)}
				</For>
			</PickerField>
		</Field>
	)
}
