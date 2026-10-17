import { createMemo, createSignal, For, Show } from "solid-js"
import type { JSX } from "solid-js"
import Close from "@carbon/icons/es/close/16"
import { Icon } from "../../icons/Icon"
import { createControllable, createId } from "../../internal/control"
import { describedBy, Field, fieldProps, useFluid } from "../../internal/field"
import type { FieldCommonProps } from "../../internal/field"
import { ComboField, defaultItemToString, ListOption, PickerField } from "../../internal/listbox"

/** Carbon's selectionFeedback: what choosing an item does to the list's order.
 *  `top-after-reopen` (the default) leaves the list alone while it is open and
 *  floats the chosen items to the top the next time; `top` moves them at once;
 *  `fixed` never reorders. */
export type SelectionFeedback = "top" | "fixed" | "top-after-reopen"

export type MultiSelectProps<Item> = Omit<FieldCommonProps, "labelText"> & {
	items: Item[]
	itemToString?: (item: Item) => string
	itemToElement?: (item: Item) => JSX.Element
	/** Controlled when given. */
	selectedItems?: Item[]
	initialSelectedItems?: Item[]
	/** What the trigger says. It does not change as items are chosen — the count
	 *  beside it does. */
	label?: string
	titleText?: JSX.Element
	type?: "default" | "inline"
	direction?: "top" | "bottom"
	selectionFeedback?: SelectionFeedback
	/** Accessible name for the count, which is also the clear-all control. */
	clearSelectionText?: string
	disabled?: boolean
	readOnly?: boolean
	onChange?: (change: { selectedItems: Item[] }) => void
}

/** The chosen set, and the order the list shows its items in. Shared by both
 *  multi-selects. */
function createSelection<Item>(
	props: Pick<
		MultiSelectProps<Item>,
		"items" | "selectedItems" | "initialSelectedItems" | "selectionFeedback" | "onChange"
	>,
) {
	const [selected, setSelected] = createControllable<Item[]>(
		() => props.selectedItems,
		props.initialSelectedItems ?? [],
		() => props.onChange,
	)
	// The set as it stood when the list last opened — what `top-after-reopen`
	// orders by, so rows do not jump out from under the pointer mid-choice.
	const [atOpen, setAtOpen] = createSignal<Item[]>(selected())

	const set = (next: Item[]) => {
		setSelected(next)
		props.onChange?.({ selectedItems: next })
	}

	const ordered = createMemo(() => {
		const feedback = props.selectionFeedback ?? "top-after-reopen"
		if (feedback === "fixed") return props.items
		const first = feedback === "top" ? selected() : atOpen()
		return [
			...props.items.filter((item) => first.includes(item)),
			...props.items.filter((item) => !first.includes(item)),
		]
	})

	return {
		selected,
		ordered,
		has: (item: Item) => selected().includes(item),
		toggle: (item: Item) =>
			set(
				selected().includes(item)
					? selected().filter((other) => other !== item)
					: [...selected(), item],
			),
		clear: () => set([]),
		snapshot: () => setAtOpen(selected()),
	}
}

/** How many are chosen, as the control that clears them. Ink, because it is a
 *  statement about the field it sits in — the same reason a `solid` Tag is. */
function Count(props: { count: number; label?: string; disabled?: boolean; onClear: () => void }) {
	const fluid = useFluid()

	return (
		<Show when={props.count > 0}>
			<button
				type="button"
				aria-label={`${props.label ?? "Clear all selected items"} (${props.count})`}
				disabled={props.disabled}
				onPointerDown={(event) => event.preventDefault()}
				onClick={() => props.onClear()}
				// Set in from the box's edge by a step; in a fluid cell it lines up
				// under the label instead, and the step goes after it.
				class={`my-tight flex shrink-0 cursor-pointer items-center justify-center gap-tight self-center
					border-0 bg-ink px-tight text-micro font-bold text-white hover:bg-gray hover:text-ink
					disabled:cursor-not-allowed pointer-coarse:min-h-touch pointer-coarse:min-w-touch
					${fluid ? "mr-2" : "ml-tight"}`}
			>
				{props.count}
				<Icon glyph={Close} size={16} />
			</button>
		</Show>
	)
}

/** Carbon's MultiSelect: choose several of a list of items.
 *
 *  The list stays open while you choose, and each row carries a checkbox. The
 *  trigger never lists what is chosen — it could not hold it — only how many,
 *  in an ink count that also clears them.
 *
 *  `PickerField` underneath, with the count in its leading slot.
 */
export function MultiSelect<Item>(props: MultiSelectProps<Item>) {
	const id = createId("multi-select", () => props.id)
	const inline = () => props.type === "inline"
	const text = (item: Item) => (props.itemToString ?? defaultItemToString)(item)

	const selection = createSelection(props)
	const [open, setOpen] = createSignal(false)

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
				setOpen={(next) => {
					if (next && !open()) selection.snapshot()
					setOpen(next)
				}}
				text={props.label ?? "Choose options"}
				disabled={props.disabled}
				readOnly={props.readOnly}
				invalid={props.invalid}
				warn={props.warn}
				inline={inline()}
				direction={props.direction}
				multiselectable
				leading={
					<Count
						count={selection.selected().length}
						label={props.clearSelectionText}
						disabled={props.disabled || props.readOnly}
						onClear={selection.clear}
					/>
				}
			>
				<For each={selection.ordered()}>
					{(item) => (
						<ListOption
							focusable
							multi
							selected={selection.has(item)}
							onSelect={() => selection.toggle(item)}
						>
							{props.itemToElement ? props.itemToElement(item) : text(item)}
						</ListOption>
					)}
				</For>
			</PickerField>
		</Field>
	)
}

export type FilterableMultiSelectProps<Item> = Omit<MultiSelectProps<Item>, "label" | "type"> & {
	/** The input's placeholder — what it filters. */
	placeholder?: string
	/** Which items show for what has been typed. Defaults to the items whose
	 *  text contains it. */
	filterItems?: (
		items: Item[],
		args: { inputValue: string; itemToString: (item: Item) => string },
	) => Item[]
	onInputValueChange?: (inputValue: string) => void
}

/** Carbon's FilterableMultiSelect: MultiSelect with a text field to narrow the
 *  list. Typed into, so it is a recess rather than a box — see `ComboField`. */
export function FilterableMultiSelect<Item>(props: FilterableMultiSelectProps<Item>) {
	const id = createId("filterable-multi-select", () => props.id)
	const text = (item: Item) => (props.itemToString ?? defaultItemToString)(item)

	const selection = createSelection(props)
	const [open, setOpen] = createSignal(false)
	const [query, setQuery] = createSignal("")
	const [active, setActive] = createSignal(-1)

	const shown = createMemo(() => {
		const inputValue = query()
		const items = selection.ordered()
		if (inputValue === "") return items
		if (props.filterItems) return props.filterItems(items, { inputValue, itemToString: text })
		const needle = inputValue.toLowerCase()
		return items.filter((item) => text(item).toLowerCase().includes(needle))
	})

	return (
		<Field id={id()} {...fieldProps(props)} labelText={props.titleText}>
			<ComboField
				id={id()}
				describedBy={describedBy(id(), props)}
				size={props.size ?? "md"}
				open={open()}
				query={query()}
				placeholder={props.placeholder}
				disabled={props.disabled}
				readOnly={props.readOnly}
				invalid={props.invalid}
				warn={props.warn}
				direction={props.direction}
				multiselectable
				count={shown().length}
				active={active()}
				optionId={(index) => `${id()}-option-${index}`}
				leading={
					<Count
						count={selection.selected().length}
						label={props.clearSelectionText}
						disabled={props.disabled || props.readOnly}
						onClear={selection.clear}
					/>
				}
				canClear={query() !== ""}
				clearLabel="Clear filter"
				setOpen={(next) => {
					if (next && !open()) selection.snapshot()
					setOpen(next)
					if (!next) setActive(-1)
				}}
				setActive={setActive}
				onQuery={(next) => {
					setQuery(next)
					setActive(next === "" ? -1 : 0)
					props.onInputValueChange?.(next)
				}}
				onCommit={(index) => {
					const item = shown()[index]
					if (item !== undefined) selection.toggle(item)
				}}
				onClear={() => {
					setQuery("")
					props.onInputValueChange?.("")
				}}
				onBlur={() => setQuery("")}
			>
				<For each={shown()}>
					{(item, index) => (
						<ListOption
							id={`${id()}-option-${index()}`}
							multi
							selected={selection.has(item)}
							active={active() === index()}
							onSelect={() => selection.toggle(item)}
						>
							{props.itemToElement ? props.itemToElement(item) : text(item)}
						</ListOption>
					)}
				</For>
			</ComboField>
		</Field>
	)
}
