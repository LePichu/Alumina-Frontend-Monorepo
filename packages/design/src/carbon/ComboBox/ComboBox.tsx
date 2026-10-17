import { createEffect, createMemo, createSignal, For, on } from "solid-js"
import type { JSX } from "solid-js"
import { createControllable, createId } from "../../internal/control"
import { describedBy, Field, fieldProps } from "../../internal/field"
import type { FieldCommonProps } from "../../internal/field"
import { ComboField, defaultItemToString, ListOption } from "../../internal/listbox"

export type ComboBoxProps<Item> = Omit<FieldCommonProps, "labelText"> & {
	items: Item[]
	itemToString?: (item: Item) => string
	itemToElement?: (item: Item) => JSX.Element
	/** Controlled when given. `null` is "nothing chosen". */
	selectedItem?: Item | null
	initialSelectedItem?: Item
	placeholder?: string
	/** Carbon's titleText: the field's label. */
	titleText?: JSX.Element
	direction?: "top" | "bottom"
	disabled?: boolean
	readOnly?: boolean
	/** Which items show for what has been typed. Carbon shows every item unless
	 *  this is given; here the default already narrows to the items whose text
	 *  contains the input, since a list that ignores what you type is a Dropdown
	 *  with a text field stuck on it. Return `true` from yours to show them all. */
	shouldFilterItem?: (
		args: { item: Item; inputValue: string; itemToString: (item: Item) => string },
	) => boolean
	/** What was typed stands as the value even if it matches no item. */
	allowCustomValue?: boolean
	onChange?: (change: { selectedItem: Item | null; inputValue?: string }) => void
	onInputChange?: (inputValue: string) => void
}

/** Carbon's ComboBox: type to narrow a list, then choose one.
 *
 *  The WAI-ARIA editable combobox. See `ComboField` for the focus model. Leaving
 *  the field puts back the chosen item's text — what you typed was a search,
 *  not a value — unless `allowCustomValue` says otherwise.
 */
export function ComboBox<Item>(props: ComboBoxProps<Item>) {
	const id = createId("combo-box", () => props.id)
	const text = (item: Item) => (props.itemToString ?? defaultItemToString)(item)

	// `null` is a value here — "nothing chosen" — so only `undefined` leaves the
	// box to look after itself.
	const [selected, setSelected] = createControllable<Item | null>(
		() => props.selectedItem,
		props.initialSelectedItem ?? null,
		() => props.onChange,
	)

	const initial = selected()
	const [query, setQuery] = createSignal(initial !== null ? text(initial) : "")
	// Typing filters; merely opening the list does not. Until a key is pressed
	// the input holds the chosen item's text, and filtering by that would show a
	// list of one.
	const [typing, setTyping] = createSignal(false)
	const [open, setOpen] = createSignal(false)
	const [active, setActive] = createSignal(-1)

	// A controlled value changed from outside: the input follows it, unless the
	// user is mid-search.
	createEffect(
		on(() => props.selectedItem, (item) => {
			if (item === undefined || typing()) return
			setQuery(item !== null ? text(item) : "")
		}, { defer: true }),
	)

	const shown = createMemo(() => {
		const inputValue = query()
		if (!typing() || inputValue === "") return props.items
		const needle = inputValue.toLowerCase()
		return props.items.filter((item) =>
			props.shouldFilterItem
				? props.shouldFilterItem({ item, inputValue, itemToString: text })
				: text(item).toLowerCase().includes(needle)
		)
	})

	const choose = (item: Item | null) => {
		setSelected(item)
		setQuery(item !== null ? text(item) : "")
		setTyping(false)
		setActive(-1)
		props.onChange?.({ selectedItem: item })
	}

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
				count={shown().length}
				active={active()}
				optionId={(index) => `${id()}-option-${index}`}
				canClear={query() !== ""}
				clearLabel="Clear selected item"
				setOpen={(next) => {
					setOpen(next)
					if (!next) setActive(-1)
				}}
				setActive={setActive}
				onQuery={(next) => {
					setQuery(next)
					setTyping(true)
					setActive(next === "" ? -1 : 0)
					props.onInputChange?.(next)
				}}
				onCommit={(index) => {
					const item = shown()[index]
					if (item === undefined) return
					choose(item)
					setOpen(false)
				}}
				onEnter={() => {
					if (!props.allowCustomValue) return
					setSelected(null)
					setTyping(false)
					setOpen(false)
					props.onChange?.({ selectedItem: null, inputValue: query() })
				}}
				onClear={() => choose(null)}
				onBlur={() => {
					setTyping(false)
					if (props.allowCustomValue) {
						const current = selected()
						if (current === null || text(current) !== query()) {
							setSelected(null)
							props.onChange?.({ selectedItem: null, inputValue: query() })
						}
						return
					}
					const current = selected()
					setQuery(current !== null ? text(current) : "")
				}}
			>
				<For each={shown()}>
					{(item, index) => (
						<ListOption
							id={`${id()}-option-${index()}`}
							selected={selected() === item}
							active={active() === index()}
							onSelect={() => {
								choose(item)
								setOpen(false)
							}}
						>
							{props.itemToElement ? props.itemToElement(item) : text(item)}
						</ListOption>
					)}
				</For>
			</ComboField>
		</Field>
	)
}
