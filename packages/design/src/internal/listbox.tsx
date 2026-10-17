import CorvuPopover from "corvu/popover"
import { createEffect, createSignal, Show } from "solid-js"
import type { JSX } from "solid-js"
import Checkmark from "@carbon/icons/es/checkmark/16"
import ChevronDown from "@carbon/icons/es/chevron--down/16"
import Close from "@carbon/icons/es/close/16"
import { Icon } from "../icons/Icon"
import { FIELD_FLAGGED, FIELD_INNER, FIELD_SIZE, useFluid } from "./field"
import type { FieldSize } from "./field"
import { CheckMark } from "./marks"
import { createRoving, focusRow } from "./roving"
import { Scroller } from "./scroll"
import { BOX, FLOATING_SURFACE, LABEL } from "./styles"

/** What Select, Dropdown, MultiSelect and ComboBox are made of: the list, an
 *  option, and the two fields a list hangs from — one you press, one you type
 *  into. Not Carbon components and not exported from the package: Carbon has an
 *  internal `ListBox` for the same reason, and it is internal there too.
 */

/** The list's box. What is in it scrolls inside a fixed height rather than
 *  growing down the page — the box is a column so the `Scroller` inside gives
 *  way at that height. */
const LIST_SURFACE = `${FLOATING_SURFACE} flex max-h-64 flex-col focus-visible:outline-none`

const listIdOf = (id: string) => `${id}-listbox`

/** A fluid cell bled out to its edges — see `PickerField`. The numbers undo
 *  the cell's own padding; keep them in step with `Field`'s. */
const FLUID_BLEED = "-mx-2 -mb-tight flex items-stretch px-2 pb-tight"

/** How far below its field a list hangs. A fluid cell's border is outside the
 *  bled row the list is measured from, so it needs that much more to clear it. */
const offsetFor = (fluid: boolean) => (fluid ? 6 : 4)

type ListOptionProps = {
	id?: string
	selected?: boolean
	/** The keyboard's position in a list that is driven from a text input, where
	 *  real focus never leaves the input. */
	active?: boolean
	/** One of several: draws a checkbox instead of inverting the row. */
	multi?: boolean
	disabled?: boolean
	/** Takes real focus (a button), for a list you move focus *into*. Off, the
	 *  option is inert to focus and is addressed by `aria-activedescendant`. */
	focusable?: boolean
	children?: JSX.Element
	onSelect: () => void
}

/** One option.
 *
 *  A single choice inverts the chosen row to ink, as Select does. Several
 *  choices cannot all invert — a list that is mostly black says nothing — so a
 *  multi-select row carries a checkbox and stays on white.
 */
export function ListOption(props: ListOptionProps) {
	const inverted = () => props.selected && !props.multi

	const face = () =>
		`flex w-full min-h-touch cursor-pointer items-center gap-2 border-0 px-2 py-snug text-left
		text-body focus-visible:-outline-offset-2
		data-[active]:outline-2 data-[active]:-outline-offset-2 data-[active]:outline-ink
		${
			inverted()
				? "on-ink bg-ink font-bold text-white data-[active]:outline-white"
				: "bg-white text-ink hover:bg-gray data-[active]:bg-gray"
		}
		${props.disabled ? "cursor-not-allowed opacity-40" : ""}`

	const body = () => (
		<>
			<Show when={props.multi}>
				<CheckMark checked={props.selected} />
			</Show>
			<span class="min-w-0 flex-1 truncate">{props.children}</span>
			<Show when={inverted()}>
				<Icon glyph={Checkmark} size={16} />
			</Show>
		</>
	)

	return (
		<Show
			when={props.focusable}
			fallback={
				<div
					id={props.id}
					role="option"
					aria-selected={props.selected ? "true" : "false"}
					aria-disabled={props.disabled ? "true" : undefined}
					data-active={props.active ? "" : undefined}
					// Keeps focus in the input: a press on an option would otherwise blur
					// it, and the blur closes the list before the click arrives.
					onPointerDown={(event) => event.preventDefault()}
					onClick={() => {
						if (!props.disabled) props.onSelect()
					}}
					class={face()}
				>
					{body()}
				</div>
			}
		>
			<button
				id={props.id}
				type="button"
				role="option"
				tabindex={-1}
				aria-selected={props.selected ? "true" : "false"}
				disabled={props.disabled}
				onClick={() => props.onSelect()}
				class={face()}
			>
				{body()}
			</button>
		</Show>
	)
}

/** A labelled run of options: a rule above it, and its name in the label
 *  voice. The name is read out as the group's, so the visible copy is hidden
 *  from assistive tech rather than announced twice. */
export function ListGroup(props: { label: string; children?: JSX.Element }) {
	return (
		<div role="group" aria-label={props.label} class="border-t-2 border-ink first:border-t-0">
			<div aria-hidden="true" class={`px-2 pb-tight pt-snug opacity-muted ${LABEL}`}>
				{props.label}
			</div>
			{props.children}
		</div>
	)
}

/** Opening lands on the chosen option, so a long list shows where you are in
 *  it; with nothing chosen, on the first. */
const focusOption = focusRow("[role='option']")

type PickerFieldProps = {
	id: string
	/** The field's message, if it has one — see `describedBy`. */
	describedBy?: string
	size: FieldSize
	open: boolean
	/** What the trigger says: the chosen value, or a prompt to choose one. */
	text: JSX.Element
	/** `text` is the prompt, so it is dimmed as a placeholder is. */
	empty?: boolean
	disabled?: boolean
	/** Shows its value; cannot be opened. */
	readOnly?: boolean
	invalid?: boolean
	warn?: boolean
	/** As wide as its longest option needs, with a floor, rather than as wide as
	 *  its column — the trigger of an inline field. */
	inline?: boolean
	direction?: "top" | "bottom"
	multiselectable?: boolean
	/** Sits before the trigger, inside the same box: MultiSelect's count. */
	leading?: JSX.Element
	/** The options. */
	children?: JSX.Element
	setOpen: (open: boolean) => void
}

/** The pressed half of Select, Dropdown and MultiSelect: a trigger, and the
 *  list hanging beneath. The WAI-ARIA select-only combobox.
 *
 *  **A box, not a recess — the one field that is.** The recess says "put
 *  something here". That is right for a text field and wrong for this: nothing
 *  is typed into it, it is pressed to open a menu. It behaves like a button, so
 *  it is drawn like one — white ground, 2px ink on all four sides, greying on
 *  hover — and the prototypes box theirs for the same reason. No shadow: it
 *  always sits inside something that already has the one hard shadow, and two
 *  would read as two objects. Severity still thickens the bottom rule rather
 *  than the whole box, so the flagged state matches every other field and does
 *  not shift the layout.
 *
 *  The box is the anchor and the trigger is a bare button inside it, because
 *  MultiSelect's count is a button too and one cannot go inside the other: side
 *  by side in one box, they are drawn as one control. The list hangs from the
 *  box.
 *
 *  Corvu Popover carries the parts that are easy to get wrong — placement,
 *  outside-press, Escape, sane behaviour on touch. Focus moves into the list
 *  when it opens, onto the chosen option, and back to the trigger when it
 *  closes; the arrows open it from the trigger too.
 */
export function PickerField(props: PickerFieldProps) {
	const fluid = useFluid()
	const [list, setList] = createSignal<HTMLElement>()
	const { onKeyDown } = createRoving(list, "[role='option']")
	const setOpen = (open: boolean) => props.setOpen(open && !props.readOnly)

	// One whole string per state. Width is one of two, never a base plus an
	// override: stacked, the box fills its column and grows with a row that
	// stretches; inline, it is as wide as it needs to be.
	const box = () => {
		if (fluid) return FLUID_BLEED
		return `flex items-stretch ${BOX} transition-colors focus-within:bg-field
			${props.inline ? "min-w-40" : "w-full grow"}
			${props.invalid || props.warn ? FIELD_FLAGGED : ""}
			${props.readOnly ? "border-transparent" : ""}
			${props.disabled ? "cursor-not-allowed opacity-40" : ""}
			${props.readOnly || props.disabled ? "" : "hover:bg-gray"}`
	}

	return (
		<CorvuPopover
			open={props.open}
			onOpenChange={setOpen}
			placement={props.direction === "top" ? "top-start" : "bottom-start"}
			floatingOptions={{
				offset: offsetFor(fluid !== undefined),
				flip: true,
				shift: true,
				size: { matchSize: true },
			}}
			onInitialFocus={focusOption}
		>
			<CorvuPopover.Anchor class={box()}>
				{props.leading}
				<CorvuPopover.Trigger
					id={props.id}
					// Explicit, not inherited: unset, this submits any form it sits in
					// rather than opening the list.
					type="button"
					role="combobox"
					aria-haspopup="listbox"
					aria-controls={listIdOf(props.id)}
					aria-describedby={props.describedBy}
					aria-invalid={props.invalid ? "true" : undefined}
					aria-readonly={props.readOnly ? "true" : undefined}
					disabled={props.disabled}
					onKeyDown={(event: KeyboardEvent) => {
						if ((event.key === "ArrowDown" || event.key === "ArrowUp") && !props.open) {
							event.preventDefault()
							setOpen(true)
						}
					}}
					// Under a finger the trigger is 44px tall — except in a fluid cell,
					// where the cell is already that and its label presses the trigger too.
					class={`flex min-w-0 flex-1 items-center justify-between gap-2 border-0 bg-transparent
						text-left text-body text-ink focus-visible:outline-none disabled:cursor-not-allowed
						${props.readOnly ? "cursor-default" : "cursor-pointer"}
						${fluid ? "p-0" : `${FIELD_SIZE[props.size]} pointer-coarse:min-h-touch`}`}
				>
					<span class={`min-w-0 truncate ${props.empty ? "opacity-60" : ""}`}>{props.text}</span>
					<Show when={!props.readOnly}>
						<Icon glyph={ChevronDown} size={16} />
					</Show>
				</CorvuPopover.Trigger>
			</CorvuPopover.Anchor>

			<CorvuPopover.Portal>
				<CorvuPopover.Content
					ref={setList}
					id={listIdOf(props.id)}
					role="listbox"
					aria-multiselectable={props.multiselectable ? "true" : undefined}
					onKeyDown={onKeyDown}
					class={LIST_SURFACE}
				>
					<Scroller>{props.children}</Scroller>
				</CorvuPopover.Content>
			</CorvuPopover.Portal>
		</CorvuPopover>
	)
}

/** The default way an item reads: itself if it is text, its `label` or `text`
 *  field if it has one. Carbon's own default is the same idea. */
export function defaultItemToString(item: unknown): string {
	if (item === null || item === undefined) return ""
	if (typeof item === "string" || typeof item === "number") return String(item)
	if (typeof item === "object") {
		const fields = item as Record<string, unknown>
		const text = fields["label"] ?? fields["text"] ?? fields["name"]
		if (typeof text === "string") return text
	}
	return String(item)
}

type ComboFieldProps = {
	id: string
	/** The field's message, if it has one — see `describedBy`. */
	describedBy?: string
	size: FieldSize
	open: boolean
	/** What is in the input. */
	query: string
	placeholder?: string
	disabled?: boolean
	readOnly?: boolean
	invalid?: boolean
	warn?: boolean
	direction?: "top" | "bottom"
	/** How many options are showing. */
	count: number
	/** The keyboard's position among them, or -1 for none. */
	active: number
	/** The id of the option at an index, for `aria-activedescendant`. */
	optionId: (index: number) => string
	/** Sits before the input: MultiSelect's count. */
	leading?: JSX.Element
	/** Shows the clear control. */
	canClear?: boolean
	clearLabel?: string
	multiselectable?: boolean
	/** The options. */
	children?: JSX.Element
	setOpen: (open: boolean) => void
	setActive: (index: number) => void
	onQuery: (query: string) => void
	/** Enter on the option at an index. */
	onCommit: (index: number) => void
	/** Enter with no option active — a custom value, if those are allowed. */
	onEnter?: () => void
	onClear?: () => void
	onBlur?: () => void
}

/** The typed-into half of ComboBox and FilterableMultiSelect: an input, a clear
 *  control, a chevron, and the list hanging beneath.
 *
 *  It is a recess, not a box — one ink rule under it, lit while you are in it —
 *  because unlike Select and Dropdown this one *is* typed into.
 *
 *  This is the editable combobox pattern: focus never leaves the input. The
 *  arrows move a highlight through the list and `aria-activedescendant` tells
 *  assistive tech where it is, so typing and choosing never fight over focus.
 *  Corvu still places the list and handles Escape and outside presses; its
 *  focus trap is switched off.
 */
export function ComboField(props: ComboFieldProps) {
	const fluid = useFluid()
	const [anchor, setAnchor] = createSignal<HTMLElement>()
	let input: HTMLInputElement | undefined

	// Keeps the highlighted option in view as the arrows walk past the fold.
	createEffect(() => {
		if (!props.open || props.active < 0) return
		const id = props.optionId(props.active)
		queueMicrotask(() => document.getElementById(id)?.scrollIntoView({ block: "nearest" }))
	})

	const step = (delta: number) => {
		if (props.count === 0) return props.setActive(-1)
		if (props.active < 0) return props.setActive(delta > 0 ? 0 : props.count - 1)
		props.setActive((props.active + delta + props.count) % props.count)
	}

	const onKeyDown = (event: KeyboardEvent) => {
		if (event.key === "ArrowDown" || event.key === "ArrowUp") {
			event.preventDefault()
			if (!props.open) props.setOpen(true)
			step(event.key === "ArrowDown" ? 1 : -1)
		} else if (event.key === "Enter") {
			if (!props.open) return
			event.preventDefault()
			if (props.active >= 0) props.onCommit(props.active)
			else props.onEnter?.()
		} else if (event.key === "Escape") {
			if (props.open) {
				// Stopped here: inside a Modal, Escape should close the list and leave
				// the dialog standing.
				event.stopPropagation()
				props.setOpen(false)
			} else if (props.query) {
				props.onQuery("")
			}
		} else if (event.key === "Tab") {
			props.setOpen(false)
		}
	}

	const tool =
		"flex shrink-0 cursor-pointer items-center justify-center self-stretch border-0 bg-transparent px-tight text-ink hover:bg-gray disabled:cursor-not-allowed pointer-coarse:min-w-touch"

	return (
		<CorvuPopover
			open={props.open}
			onOpenChange={(open: boolean) => props.setOpen(open && !props.readOnly)}
			placement={props.direction === "top" ? "top-start" : "bottom-start"}
			floatingOptions={{
				offset: offsetFor(fluid !== undefined),
				flip: true,
				shift: true,
				size: { matchSize: true },
			}}
			trapFocus={false}
			restoreFocus={false}
			closeOnOutsideFocus={false}
			// The input and its controls are outside the list, but they are this
			// control: a press on them is theirs to handle, not a dismissal.
			onOutsidePointer={(event: PointerEvent) => {
				const target = event.target
				if (target instanceof Node && anchor()?.contains(target)) event.preventDefault()
			}}
		>
			<CorvuPopover.Anchor
				ref={setAnchor}
				class={fluid
					? `${FLUID_BLEED} ${props.disabled ? "cursor-not-allowed opacity-40" : ""}`
					: `flex items-stretch border-0 border-b-2 border-ink bg-transparent
						focus-within:bg-field pointer-coarse:min-h-touch
						${props.invalid || props.warn ? FIELD_FLAGGED : ""}
						${props.readOnly ? "border-transparent" : ""}
						${props.disabled ? "cursor-not-allowed opacity-40" : ""}`}
			>
				{props.leading}
				<input
					ref={input}
					id={props.id}
					type="text"
					role="combobox"
					autocomplete="off"
					aria-autocomplete="list"
					aria-expanded={props.open ? "true" : "false"}
					aria-controls={listIdOf(props.id)}
					aria-activedescendant={props.open && props.active >= 0
						? props.optionId(props.active)
						: undefined}
					aria-describedby={props.describedBy}
					aria-invalid={props.invalid ? "true" : undefined}
					placeholder={props.placeholder}
					disabled={props.disabled}
					readOnly={props.readOnly}
					value={props.query}
					onInput={(event) => {
						props.onQuery(event.currentTarget.value)
						if (!props.open) props.setOpen(true)
					}}
					onClick={() => {
						if (!props.open) props.setOpen(true)
					}}
					onKeyDown={onKeyDown}
					onBlur={() => {
						props.setOpen(false)
						props.onBlur?.()
					}}
					class={`${FIELD_INNER} min-w-0 flex-1 ${fluid ? "p-0" : FIELD_SIZE[props.size]}`}
				/>
				<Show when={props.canClear && !props.readOnly && !props.disabled}>
					<button
						type="button"
						aria-label={props.clearLabel ?? "Clear"}
						// Not a tab stop: Escape in the input does the same, and a field
						// that takes three presses of Tab to leave is a worse field.
						tabindex={-1}
						onPointerDown={(event) => event.preventDefault()}
						onClick={() => {
							props.onClear?.()
							input?.focus()
						}}
						class={tool}
					>
						<Icon glyph={Close} size={16} />
					</button>
				</Show>
				<Show when={!props.readOnly}>
					<button
						type="button"
						aria-label={props.open ? "Close list" : "Open list"}
						tabindex={-1}
						disabled={props.disabled}
						onPointerDown={(event) => event.preventDefault()}
						onClick={() => {
							props.setOpen(!props.open)
							input?.focus()
						}}
						class={tool}
					>
						<Icon
							glyph={ChevronDown}
							size={16}
							class={`transition-transform duration-220 ${props.open ? "rotate-180" : ""}`}
						/>
					</button>
				</Show>
			</CorvuPopover.Anchor>

			<CorvuPopover.Portal>
				<CorvuPopover.Content
					id={listIdOf(props.id)}
					role="listbox"
					aria-multiselectable={props.multiselectable ? "true" : undefined}
					// A press on the list's own padding or scroll track must not blur
					// the input either.
					onPointerDown={(event: PointerEvent) => event.preventDefault()}
					class={LIST_SURFACE}
				>
					<Scroller>
						<Show
							when={props.count > 0}
							fallback={<p class="m-0 px-2 py-snug text-small opacity-muted">Nothing matches.</p>}
						>
							{props.children}
						</Show>
					</Scroller>
				</CorvuPopover.Content>
			</CorvuPopover.Portal>
		</CorvuPopover>
	)
}
