import CorvuCalendar from "corvu/calendar"
import CorvuPopover from "corvu/popover"
import {
	createContext,
	createEffect,
	createMemo,
	createSignal,
	For,
	on,
	Show,
	useContext,
} from "solid-js"
import type { JSX } from "solid-js"
import CalendarIcon from "@carbon/icons/es/calendar/16"
import ChevronLeft from "@carbon/icons/es/chevron--left/16"
import ChevronRight from "@carbon/icons/es/chevron--right/16"
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
	FIELD_TOOL,
	fieldProps,
	Fluid,
	messageIdOf,
	useFluid,
} from "../../internal/field"
import type { FieldCommonProps, FieldSize } from "../../internal/field"
import { FLOATING_SURFACE, RULED_GRID, RULED_GRID_INNER } from "../../internal/styles"
import { dayKey, formatDate, parseDate, placeholderFor, sameDay } from "./dates"

/** Carbon's three: `simple` is a text field and nothing else; `single` adds a
 *  calendar for one day; `range` is two fields over one calendar. */
export type DatePickerType = "simple" | "single" | "range"

type Pair = [from: Date | null, to: Date | null]

type DateContextValue = {
	type: () => DatePickerType
	format: () => string
	size: () => FieldSize
	disabled: () => boolean
	readOnly: () => boolean
	/** Each input takes the next slot as it is created: 0 is the day (or the
	 *  range's start), 1 the range's end. */
	claim: () => number
	text: (slot: number) => string
	/** Text typed into a slot. Returns whether it was a date this picker takes. */
	commit: (slot: number, text: string) => boolean
	open: () => void
}

const DateContext = createContext<DateContextValue>()

export type DatePickerProps = {
	datePickerType?: DatePickerType
	/** flatpickr's tokens: `Y`, `m`, `d`, and separators. Carbon defaults to
	 *  `m/d/Y`; this defaults to ISO 8601 — year first — because it cannot be
	 *  misread and it is how every date in these apps is already written. */
	dateFormat?: string
	/** The chosen day, or `[start, end]`. Controlled when given. */
	value?: Date | (Date | null)[]
	/** No earlier than this. A Date, or text in `dateFormat`. */
	minDate?: Date | string
	maxDate?: Date | string
	/** Which day a week starts on: 0 is Sunday. Monday unless told otherwise,
	 *  to go with the ISO date. */
	startOfWeek?: number
	/** For the month and weekday names. Pinned to `en` unless set. */
	locale?: string
	size?: FieldSize
	disabled?: boolean
	readOnly?: boolean
	class?: string
	/** One DatePickerInput, or two for a range. */
	children?: JSX.Element
	/** Every date now chosen: one, or the two ends of a completed range. */
	onChange?: (dates: Date[]) => void
}

/** Carbon's DatePicker.
 *
 *  The WAI-ARIA date-picker-dialog pattern: a text field you can type a date
 *  into, and beside it a button that opens a calendar. The field does not open
 *  the calendar on focus — a calendar that jumps out whenever you tab past a
 *  field is in the way of everyone who was going to type — but the down arrow
 *  in the field does.
 *
 *  Corvu Calendar is the grid: arrow keys by day and week, Page Up/Down by
 *  month, Home/End to the ends of the week, range selection. Corvu Popover
 *  places it. Carbon uses flatpickr, which is a runtime dependency with its own
 *  stylesheet; this needs neither.
 *
 *  In a range, the calendar closes once both ends are chosen.
 */
export function DatePicker(props: DatePickerProps) {
	const type = (): DatePickerType => props.datePickerType ?? "simple"
	const format = () => props.dateFormat ?? "Y-m-d"
	const fluid = useFluid()
	const [open, setOpen] = createSignal(false)
	let slots = 0

	const fromProps = (): Pair | undefined => {
		const value = props.value
		if (value === undefined) return undefined
		return Array.isArray(value) ? [value[0] ?? null, value[1] ?? null] : [value, null]
	}

	const [dates, setDates] = createControllable<Pair>(fromProps, [null, null], () => props.onChange)

	const bound = (limit: Date | string | undefined) =>
		typeof limit === "string" ? parseDate(limit, format()) : (limit ?? null)
	const min = createMemo(() => bound(props.minDate))
	const max = createMemo(() => bound(props.maxDate))

	const outOfRange = (day: Date) => {
		const low = min()
		const high = max()
		return (low !== null && dayKey(day) < dayKey(low)) ||
			(high !== null && dayKey(day) > dayKey(high))
	}

	/** Where the calendar opens: on the chosen day, else on today — pulled inside
	 *  the allowed span, so a picker limited to another month does not open on a
	 *  page of days none of which can be pressed. */
	const anchor = () => {
		const chosen = dates()[0]
		if (chosen) return chosen
		const today = new Date()
		const low = min()
		const high = max()
		if (low && dayKey(today) < dayKey(low)) return low
		if (high && dayKey(today) > dayKey(high)) return high
		return today
	}

	const set = (next: Pair) => {
		setDates(next)
		props.onChange?.(next.filter((date): date is Date => date !== null))
	}

	const ctx: DateContextValue = {
		type,
		format,
		size: () => props.size ?? "md",
		disabled: () => props.disabled ?? false,
		readOnly: () => props.readOnly ?? false,
		claim: () => slots++,
		text: (slot) => {
			const date = dates()[slot === 1 ? 1 : 0]
			return date ? formatDate(date, format()) : ""
		},
		commit: (slot, text) => {
			const [from, to] = dates()
			if (text.trim() === "") {
				set(slot === 1 ? [from, null] : [null, to])
				return true
			}
			const parsed = parseDate(text, format())
			if (!parsed || outOfRange(parsed)) return false
			// A range typed backwards is put the right way round rather than refused.
			if (type() === "range") {
				const next: Pair = slot === 1 ? [from, parsed] : [parsed, to]
				const [a, b] = next
				set(a && b && dayKey(a) > dayKey(b) ? [b, a] : next)
			} else {
				set([parsed, null])
			}
			return true
		},
		open: () => {
			if (!props.disabled && !props.readOnly) setOpen(true)
		},
	}

	return (
		<CorvuPopover
			open={open()}
			onOpenChange={(next: boolean) => setOpen(next && !props.disabled && !props.readOnly)}
			placement="bottom-start"
			floatingOptions={{ offset: fluid ? 6 : 4, flip: true, shift: true }}
			// Opening lands on the day the grid has focused — the chosen one, or
			// today — not on the first button in the panel, which is "previous month".
			onInitialFocus={(event: Event) => {
				const panel = event.target
				if (!(panel instanceof HTMLElement)) return
				const day = panel.querySelector<HTMLElement>(
					"[data-corvu-calendar-celltrigger][tabindex='0']",
				)
				if (!day) return
				event.preventDefault()
				day.focus()
			}}
		>
			<DateContext.Provider value={ctx}>
				{
					/* Fluid, the fields are cells of one frame — a range is two halves of
				    a single box, ruled down the middle — rather than fields set side
				    by side with air between them. */
				}
				<CorvuPopover.Anchor
					class={fluid
						? `${fluid.tiled ? RULED_GRID_INNER : RULED_GRID} auto-cols-fr grid-flow-col ${
							props.class ?? ""
						}`
						: `inline-flex flex-wrap items-start gap-2 ${props.class ?? ""}`}
				>
					<Show when={fluid} fallback={props.children}>
						<Fluid tiled>{props.children}</Fluid>
					</Show>
				</CorvuPopover.Anchor>
			</DateContext.Provider>
			<Show when={type() !== "simple"}>
				<CorvuPopover.Portal>
					<CorvuPopover.Content
						aria-label={type() === "range" ? "Choose a date range" : "Choose a date"}
						class={`${FLOATING_SURFACE} p-2 focus-visible:outline-none`}
					>
						<Show
							when={type() === "range"}
							fallback={
								<CorvuCalendar
									mode="single"
									value={dates()[0]}
									onValueChange={(day) => {
										set([day, null])
										if (day) setOpen(false)
									}}
									initialMonth={anchor()}
									initialFocusedDay={anchor()}
									startOfWeek={props.startOfWeek ?? 1}
									disabled={outOfRange}
									fixedWeeks
								>
									<Grid locale={props.locale ?? "en"} />
								</CorvuCalendar>
							}
						>
							<CorvuCalendar
								mode="range"
								value={{ from: dates()[0], to: dates()[1] }}
								onValueChange={(range) => {
									set([range.from, range.to])
									// Both ends chosen, and they are different presses: done.
									if (range.from && range.to && !sameDay(range.from, range.to)) setOpen(false)
								}}
								initialMonth={anchor()}
								initialFocusedDay={anchor()}
								startOfWeek={props.startOfWeek ?? 1}
								disabled={outOfRange}
								fixedWeeks
							>
								<Grid locale={props.locale ?? "en"} />
							</CorvuCalendar>
						</Show>
					</CorvuPopover.Content>
				</CorvuPopover.Portal>
			</Show>
		</CorvuPopover>
	)
}

const NAV =
	"flex size-8 cursor-pointer items-center justify-center border-0 bg-transparent text-ink hover:bg-gray pointer-coarse:size-touch"

/** One month: its name between two arrows, then the days.
 *
 *  A chosen day inverts to ink. The days between a range's ends take the grey
 *  the system keeps for "pressed", so the run reads as one band with two solid
 *  ends. Today is underlined and bold — a mark, not a ground, so it cannot be
 *  mistaken for a choice. Days outside the month, or outside the allowed span,
 *  are dimmed and cannot be reached.
 */
function Grid(props: { locale: string }) {
	const calendar = CorvuCalendar.useContext()
	const title = createMemo(() =>
		new Intl.DateTimeFormat(props.locale, { month: "long", year: "numeric" }).format(
			calendar.month(),
		)
	)
	const weekday = (day: Date, width: "short" | "long") =>
		new Intl.DateTimeFormat(props.locale, { weekday: width }).format(day)

	return (
		<div>
			<div class="mb-tight flex items-center justify-between gap-2">
				<CorvuCalendar.Nav action="prev-month" aria-label="Previous month" class={NAV}>
					<Icon glyph={ChevronLeft} size={16} />
				</CorvuCalendar.Nav>
				<CorvuCalendar.Label class="m-0 text-label font-bold uppercase">
					{title()}
				</CorvuCalendar.Label>
				<CorvuCalendar.Nav action="next-month" aria-label="Next month" class={NAV}>
					<Icon glyph={ChevronRight} size={16} />
				</CorvuCalendar.Nav>
			</div>
			<CorvuCalendar.Table class="border-separate border-spacing-0">
				<thead>
					<tr>
						<For each={calendar.weekdays()}>
							{(day) => (
								<CorvuCalendar.HeadCell
									abbr={weekday(day, "long")}
									class="pb-tight text-center text-micro font-normal uppercase opacity-muted"
								>
									{weekday(day, "short").slice(0, 2)}
								</CorvuCalendar.HeadCell>
							)}
						</For>
					</tr>
				</thead>
				<tbody>
					<For each={calendar.weeks()}>
						{(week) => (
							<tr>
								<For each={week}>
									{(day) => (
										<CorvuCalendar.Cell class="p-0">
											<CorvuCalendar.CellTrigger
												day={day}
												class="flex size-8 cursor-pointer items-center justify-center border-0 bg-transparent
													text-small tabular-nums text-ink hover:bg-gray
													focus-visible:-outline-offset-2
													data-[today]:font-bold data-[today]:underline data-[today]:underline-offset-4
													data-[in-range]:bg-gray
													data-[selected]:bg-ink data-[selected]:text-white
													data-[range-start]:bg-ink data-[range-start]:text-white
													data-[range-end]:bg-ink data-[range-end]:text-white
													data-[disabled]:cursor-not-allowed data-[disabled]:opacity-40
													data-[disabled]:hover:bg-transparent
													data-[selected]:[--focus-ink:#fff] data-[range-start]:[--focus-ink:#fff]
													data-[range-end]:[--focus-ink:#fff] pointer-coarse:size-touch"
											>
												{day.getDate()}
											</CorvuCalendar.CellTrigger>
										</CorvuCalendar.Cell>
									)}
								</For>
							</tr>
						)}
					</For>
				</tbody>
			</CorvuCalendar.Table>
		</div>
	)
}

export type DatePickerInputProps = Omit<FieldCommonProps, "size"> & {
	/** Defaults to the picker's format, spelled out: `yyyy-mm-dd`. */
	placeholder?: string
	disabled?: boolean
	/** Fires with the field's text whenever a typed date is accepted. */
	onChange?: (value: string) => void
}

/** Carbon's DatePickerInput: one date field of a DatePicker.
 *
 *  A recess — it is typed into — with the calendar button inside the same rule.
 *  What is typed is taken when the field is left or Enter is pressed. Text that
 *  is not a date in the picker's format, or falls outside its span, is not
 *  taken: the field says so and keeps the text, so it can be corrected rather
 *  than retyped.
 */
export function DatePickerInput(props: DatePickerInputProps) {
	const ctx = useContext(DateContext)
	if (!ctx) throw new Error("DatePickerInput must be used inside a DatePicker")

	const slot = ctx.claim()
	const id = createId("date-picker-input", () => props.id)
	const fluid = useFluid()
	const disabled = () => props.disabled || ctx.disabled()

	const [text, setText] = createSignal(ctx.text(slot))
	const [rejected, setRejected] = createSignal(false)

	// The picker's value changed — a day was pressed in the calendar, or the
	// controlled value moved — so the field shows it.
	createEffect(on(() => ctx.text(slot), (next) => {
		setText(next)
		setRejected(false)
	}, { defer: true }))

	const commit = () => {
		const taken = ctx.commit(slot, text())
		setRejected(!taken)
		if (taken) props.onChange?.(text())
	}

	const invalid = () => props.invalid || rejected()

	return (
		<Field
			id={id()}
			{...fieldProps(props)}
			invalid={invalid()}
			invalidText={rejected() && !props.invalid
				? `Not a date this takes. Use ${placeholderFor(ctx.format())}.`
				: props.invalidText}
		>
			{
				/* The width is the wrapper's. On the field it would be a second width
			    utility beside FIELD_BASE's own, settled by stylesheet order. Ten
			    characters of date and the calendar button — or, fluid, the cell. */
			}
			<div class={fluid ? "w-full" : "w-40"}>
				<div
					class={`${fluid ? FIELD_GROUP_FLUID : FIELD_GROUP}
						${!fluid && (invalid() || props.warn) ? FIELD_FLAGGED : ""}
						${disabled() ? "cursor-not-allowed opacity-40" : ""}
						${ctx.readOnly() && !fluid ? "border-transparent" : ""}`}
				>
					<input
						id={id()}
						type="text"
						inputmode="numeric"
						autocomplete="off"
						placeholder={props.placeholder ?? placeholderFor(ctx.format())}
						value={text()}
						disabled={disabled()}
						readOnly={ctx.readOnly()}
						aria-invalid={invalid() ? "true" : undefined}
						aria-describedby={describedBy(id(), props) ??
							(rejected() ? messageIdOf(id()) : undefined)}
						onInput={(event) => setText(event.currentTarget.value)}
						onChange={commit}
						onKeyDown={(event) => {
							if (event.key === "ArrowDown" && ctx.type() !== "simple") {
								event.preventDefault()
								ctx.open()
							}
						}}
						class={`${FIELD_INNER} min-w-0 flex-1 tabular-nums ${
							fluid ? "p-0" : FIELD_SIZE[ctx.size()]
						}`}
					/>
					<Show when={ctx.type() !== "simple" && !ctx.readOnly()}>
						<CorvuPopover.Trigger
							type="button"
							aria-label="Open calendar"
							disabled={disabled()}
							class={`${FIELD_TOOL} data-[open]:bg-ink data-[open]:text-white`}
						>
							<Icon glyph={CalendarIcon} size={16} />
						</CorvuPopover.Trigger>
					</Show>
				</div>
			</div>
		</Field>
	)
}
