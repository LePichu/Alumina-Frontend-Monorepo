import { children, createContext, createMemo, createSignal, For, Show, useContext } from "solid-js"
import type { JSX } from "solid-js"
import { createControllable, createId } from "../../internal/control"
import { describedBy, Field, fieldProps } from "../../internal/field"
import type { FieldCommonProps } from "../../internal/field"
import { ListGroup, ListOption, PickerField } from "../../internal/listbox"

type Option = { value: string; text: string; disabled?: boolean; group?: string }

/** The label of the SelectItemGroup an item is being declared inside, if any. */
const GroupContext = createContext<string>()

type SelectContextValue = {
	register: (option: Option) => void
}

const SelectContext = createContext<SelectContextValue>()

export type SelectProps = FieldCommonProps & {
	value?: string
	placeholder?: string
	disabled?: boolean
	/** The label sits beside the trigger rather than above it — a settings row.
	 *  The trigger is then as wide as it needs to be, not as wide as the row. */
	inline?: boolean
	children?: JSX.Element
	onChange?: (value: string) => void
}

/** A listbox, not a native select.
 *
 *  A native <select> renders its options through the OS, so they cannot be styled
 *  at all — the one control on a form that ignored the whole design system. This
 *  is the WAI-ARIA listbox pattern instead, which CLAUDE.md already asks for
 *  ("selects, dropdowns and combo boxes" are on the hand-rolled list).
 *
 *  The trigger, the list and the keys are `PickerField`, which Dropdown and
 *  MultiSelect are built on too. What is Select's own is the way in: options
 *  written as children.
 *
 *  **`SelectItem` describes an option; it does not draw one.** Corvu's Popover
 *  only mounts its content when open, so an item that drew itself would not exist
 *  — and could not have registered — until the first time the listbox was opened,
 *  leaving the trigger unable to name its own value. Splitting the two solves
 *  that without rendering anything early: the items run, register and return
 *  null, and the options are drawn from the collected data inside the popover.
 *
 *  Rendering them early instead is what the previous version did, and under SSR
 *  it was fatal: it built DOM in a position the server had emitted nothing for,
 *  so hydration walked off the end of the marker stream and every subsequent
 *  lookup in the tree resolved against the wrong node.
 */
export function Select(props: SelectProps) {
	const id = createId("select", () => props.id)
	const [options, setOptions] = createSignal<Option[]>([])
	const [value, setValue] = createControllable<string | undefined>(
		() => props.value,
		undefined,
		() => props.onChange,
	)
	const [open, setOpen] = createSignal(false)

	const selectedText = () => options().find((option) => option.value === value())?.text

	const ctx: SelectContextValue = {
		register: (option) =>
			setOptions((current) =>
				current.some((existing) => existing.value === option.value) ? current : [...current, option]
			),
	}

	const choose = (next: string) => {
		setValue(next)
		props.onChange?.(next)
		setOpen(false)
	}

	/** Options in runs that share a group, in the order they were declared. */
	const runs = createMemo(() => {
		const out: { group?: string; options: Option[] }[] = []
		for (const option of options()) {
			const last = out[out.length - 1]
			if (last && last.group === option.group) last.options.push(option)
			else out.push({ group: option.group, options: [option] })
		}
		return out
	})

	const row = (option: Option) => (
		<ListOption
			focusable
			selected={value() === option.value}
			disabled={option.disabled}
			onSelect={() => choose(option.value)}
		>
			{option.text}
		</ListOption>
	)

	return (
		<SelectContext.Provider value={ctx}>
			{/* Inside the provider, so the items resolve against this Select. */}
			<Collect>{props.children}</Collect>
			{
				/* `stretch`, so the trigger can fill a row that stretches — a Select
			    on a toolbar beside buttons has to match their height, and an
			    auto-height trigger comes up short. */
			}
			<Field id={id()} {...fieldProps(props)} inline={props.inline} stretch>
				<PickerField
					id={id()}
					describedBy={describedBy(id(), props)}
					size={props.size ?? "md"}
					open={open()}
					setOpen={setOpen}
					text={selectedText() ?? props.placeholder ?? "Select…"}
					empty={selectedText() === undefined}
					disabled={props.disabled}
					invalid={props.invalid}
					warn={props.warn}
					inline={props.inline}
				>
					<For each={runs()}>
						{(run) => (
							<Show when={run.group} fallback={<For each={run.options}>{row}</For>}>
								{(label) => (
									<ListGroup label={label()}>
										<For each={run.options}>{row}</For>
									</ListGroup>
								)}
							</Show>
						)}
					</For>
				</PickerField>
			</Field>
		</SelectContext.Provider>
	)
}

/** Runs the Select's items so they register, and renders nothing.
 *
 *  It has to be a component: `children()` resolves against the *owner that
 *  created the memo*, so calling it in Select's own body would run the items
 *  above the provider and they would not find their context. Created here, the
 *  memo's owner is inside the provider.
 *
 *  Reading the memo once is what forces each item to run. Since every item
 *  returns null, this produces no DOM — which is the whole point: nothing here is
 *  hydrated, so nothing here can desync hydration. */
function Collect(props: { children?: JSX.Element }) {
	children(() => props.children)()
	return null
}

export type SelectItemProps = {
	value: string
	text: string
	disabled?: boolean
}

/** Describes an option. Renders nothing — see Select's note. */
export function SelectItem(props: SelectItemProps) {
	const ctx = useContext(SelectContext)
	if (!ctx) throw new Error("SelectItem must be used inside a Select")

	ctx.register({
		value: props.value,
		text: props.text,
		disabled: props.disabled,
		group: useContext(GroupContext),
	})
	return null
}

export type SelectItemGroupProps = {
	label: string
	children?: JSX.Element
}

/** Carbon's SelectItemGroup: a labelled run of options.
 *
 *  Like SelectItem it draws nothing itself — it tags the items declared inside
 *  it, and the listbox draws the heading over their run. */
export function SelectItemGroup(props: SelectItemGroupProps) {
	return <GroupContext.Provider value={props.label}>{props.children}</GroupContext.Provider>
}
