import { children, createContext, Show, splitProps, useContext } from "solid-js"
import type { JSX } from "solid-js"
import { Icon } from "../icons/Icon"
import { STATUS_GLYPH } from "./severity"
import { HELPER, LABEL } from "./styles"

/** What every field is made of: its label, its message, the three layouts it
 *  can sit in, and the surface its control wears.
 *
 *  Not a Carbon component and not exported from the package. Carbon's field
 *  anatomy is the same across a dozen components, and until this file each of
 *  them assembled it by hand.
 */

export type FieldSize = "sm" | "md" | "lg"

/** What every field accepts, however it is drawn. */
export type FieldCommonProps = {
	id?: string
	labelText?: JSX.Element
	hideLabel?: boolean
	helperText?: JSX.Element
	invalid?: boolean
	invalidText?: JSX.Element
	warn?: boolean
	warnText?: JSX.Element
	size?: FieldSize
	class?: string
}

const WRAPPER_KEYS = [
	"labelText",
	"hideLabel",
	"helperText",
	"invalid",
	"invalidText",
	"warn",
	"warnText",
	"class",
] as const

/** The part of a field's props that is its wrapper's business rather than its
 *  control's — what to spread onto `Field`. Split, not copied, so each stays
 *  reactive. */
export function fieldProps(
	props: FieldCommonProps,
): Pick<FieldCommonProps, (typeof WRAPPER_KEYS)[number]> {
	return splitProps(props, WRAPPER_KEYS)[0]
}

/* ---- surfaces ---- */

export const FIELD_SIZE: Record<FieldSize, string> = {
	sm: "px-snug py-tight",
	md: "px-2 py-snug",
	lg: "px-2 py-2",
}

/** Underlined, not boxed, and not filled.
 *
 *  The 2px box with a hard shadow belongs to Tile and Button; when fields wore it
 *  too, everything on a form read as the same object at the same depth. A field
 *  is one ink rule under it, and nothing else.
 *
 *  **The ground is the focus state, not the resting one.** It used to sit at
 *  --color-field all the time, which put a grey block behind every input on the
 *  page; now the field is transparent until you are in it. Reversed in review.
 *
 *  **Focus is that ground, not an ink outline.** CSS specs `:focus-visible` to
 *  match a text input on *every* focus, mouse included, so the ring appeared each
 *  time you clicked into a field — a detached black box around a control that had
 *  deliberately been drawn without one. Controls with no ground to light up
 *  (Checkbox's 16px box, Button, the Switch) keep the outline. Also reversed in
 *  review.
 *
 *  Read-only drops the rule rather than the fill, there being no fill left to
 *  drop: without its rule the field is the value it holds, which is what
 *  read-only means.
 *
 *  The ground is keyed to `:focus`, not `:focus-visible`. The ring that variant
 *  exists to gate is gone, a ground this light has no reason to hide from a
 *  mouse, and `:focus-visible` is modality-dependent for scripted focus — a field
 *  focused from code lit up not at all. The outline is still suppressed on
 *  `:focus-visible`, which is the state the base stylesheet draws it in. */
export const FIELD_BASE = [
	"w-full border-0 border-b-2 border-ink bg-transparent text-body text-ink",
	"placeholder:text-ink placeholder:opacity-60",
	"focus:bg-field focus-visible:outline-none",
	"disabled:cursor-not-allowed disabled:opacity-40",
	// A field is a touch target like any other control: 44px under a finger,
	// however dense it is under a mouse.
	"pointer-coarse:min-h-touch",
].join(" ")

/** Read-only drops the rule, so the field is the value it holds rather than a
 *  place to type. Applied only to elements that can actually *be* read-only: CSS
 *  matches `:read-only` on anything not user-editable, a `<div>` included, so
 *  folding this into FIELD_BASE would strip the rule from NumberInput's wrapper
 *  every time.
 *
 *  `enabled:` because a *disabled* input is `:read-only` too, as far as CSS is
 *  concerned — so a disabled TextInput lost its rule and looked like a value,
 *  while a disabled NumberInput or DatePicker, whose rule is on a wrapper, kept
 *  theirs dimmed. Disabled is a field that is switched off, not a value: it
 *  keeps the rule, at the 40% everything disabled is drawn at. */
export const FIELD_READONLY = "enabled:read-only:border-transparent"

/** No rule at all — just the text.
 *
 *  For a field inside something that already reads as the field: kiln's composer
 *  box, quarry's nav bar. A rule inside a box reads as two edges nested one
 *  inside the other. Focus is the same light ground the recessed field uses. */
export const FIELD_BARE = [
	"w-full border-0 bg-transparent text-body text-ink",
	"placeholder:text-ink placeholder:opacity-60",
	"focus:bg-field focus-visible:outline-none",
	"disabled:cursor-not-allowed disabled:opacity-40",
	"pointer-coarse:min-h-touch",
].join(" ")

/** An input that is the inside of something else's field: no rule, no ground,
 *  no outline of its own. What sits inside the shared rule of NumberInput,
 *  PasswordInput and the combo boxes, and what a fluid cell holds. Whatever
 *  wraps it lights on `focus-within`, which is the focus state. */
export const FIELD_INNER = [
	"border-0 bg-transparent text-body text-ink outline-none",
	"placeholder:text-ink placeholder:opacity-60 disabled:cursor-not-allowed",
].join(" ")

/** The rule and ground of a field whose input is one of several things inside
 *  it — steppers, an eye, a calendar button. The wrapper carries the look and
 *  the input inside it takes the focus, hence `focus-within`. */
export const FIELD_GROUP = `flex items-stretch ${FIELD_BASE} focus-within:bg-field`

/** The same row inside a fluid cell, where the cell is the field: no rule and
 *  no ground left to draw. */
export const FIELD_GROUP_FLUID = "flex items-stretch"

/** A control inside a field's rule — the eye on a password, the calendar on a
 *  date. As tall as the field and 32px wide, 44 under a finger. */
export const FIELD_TOOL = [
	"flex w-8 shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent text-ink",
	"hover:bg-gray focus-visible:-outline-offset-2 disabled:cursor-not-allowed",
	"pointer-coarse:min-w-touch",
].join(" ")

/** The same control inside a fluid cell: a 40px square in the cell's top
 *  corner, the height of the label, its gap and the value together, so it
 *  stands centred beside them however tall a message makes the cell. In the
 *  value's row it was 32px wide and only as tall as the line of text — under
 *  the pointer a flat grey bar, low in the cell. The input keeps clear of it
 *  (`FIELD_INNER_FLUID_TOOL`). 48px under a finger. */
export const FIELD_TOOL_FLUID = [
	"absolute right-2 top-2 flex size-10 cursor-pointer items-center justify-center border-0",
	"bg-transparent text-ink hover:bg-gray focus-visible:-outline-offset-2",
	"disabled:cursor-not-allowed pointer-coarse:size-12",
].join(" ")

/** The room an input in a fluid cell leaves for a `FIELD_TOOL_FLUID`: the
 *  square's 40px and 8px clear of it. */
export const FIELD_INNER_FLUID_TOOL = "p-0 pr-12"

/** Severity thickens the rule. Weight, never hue. */
export const FIELD_FLAGGED = "border-b-4"

/* ---- fluid ---- */

type FluidValue = {
	/** The field is one cell of a FluidForm's ruled grid, which draws the rules
	 *  between cells, so the cell itself has no border. */
	tiled: boolean
}

const FluidContext = createContext<FluidValue>()

/** Whether the field being rendered is fluid — and, if so, how. A control reads
 *  this to drop its own rule or box: in a fluid field the cell is the field. */
export const useFluid = () => useContext(FluidContext)

/** Makes the fields inside it fluid. `FluidForm` and every `Fluid*` component
 *  are this and little more — which is also how Carbon builds them.
 *
 *  Tiling is inherited: a `FluidTextInput` inside a `FluidForm` is one of the
 *  form's cells, not a box of its own. */
export function Fluid(props: { tiled?: boolean; children?: JSX.Element }) {
	const outer = useFluid()
	return (
		<FluidContext.Provider value={{ tiled: props.tiled ?? outer?.tiled ?? false }}>
			{props.children}
		</FluidContext.Provider>
	)
}

/* ---- label and message ---- */

type FieldLabelProps = {
	for: string
	hideLabel?: boolean
	/** Carbon's counter, set at the label's trailing edge: "12/80". */
	counter?: string
	class?: string
	children?: JSX.Element
}

function FieldLabel(props: FieldLabelProps) {
	// Resolved once — see "Slots" in CLAUDE.md.
	const label = children(() => props.children)

	return (
		<Show when={label() || props.counter}>
			<Show
				when={props.counter}
				fallback={
					<label
						for={props.for}
						class={`block ${LABEL} ${props.hideLabel ? "sr-only" : (props.class ?? "mb-tight")}`}
					>
						{label()}
					</label>
				}
			>
				<div class={`flex items-baseline justify-between gap-2 ${props.class ?? "mb-tight"}`}>
					<label for={props.for} class={`block ${LABEL} ${props.hideLabel ? "sr-only" : ""}`}>
						{label()}
					</label>
					{/* Tabular, so the count does not shuffle sideways as it climbs. */}
					<span class={`ml-auto shrink-0 tabular-nums ${HELPER}`}>{props.counter}</span>
				</div>
			</Show>
		</Show>
	)
}

/** How much of a counted field is used, as Carbon writes it. Characters are
 *  counted as the browser's `maxlength` counts them; words are runs of
 *  non-space. */
export function countOf(value: string, mode: "character" | "word" = "character"): number {
	if (mode === "word") return value.trim() === "" ? 0 : value.trim().split(/\s+/).length
	return value.length
}

type FieldMessageProps = {
	id?: string
	invalid?: boolean
	invalidText?: JSX.Element
	warn?: boolean
	warnText?: JSX.Element
	helperText?: JSX.Element
}

/** Validation never reads as colour. An invalid or warned field is marked by an
 *  icon, an uppercase severity word, and bold weight. */
export function FieldMessage(props: FieldMessageProps) {
	// Resolved once — see "Slots" in CLAUDE.md.
	const helper = children(() => props.helperText)

	return (
		<Show
			when={props.invalid || props.warn}
			fallback={
				<Show when={helper() !== undefined}>
					<p id={props.id} class={`m-0 mt-tight ${HELPER}`}>
						{helper()}
					</p>
				</Show>
			}
		>
			<p id={props.id} class={`m-0 mt-tight flex items-center gap-tight ${LABEL}`}>
				<Icon
					glyph={props.invalid ? STATUS_GLYPH.error : STATUS_GLYPH.warning}
					size={16}
					label={props.invalid ? "error" : "warning"}
				/>
				<span class="opacity-muted">{props.invalid ? "error" : "warning"}</span>
				<span>{props.invalid ? props.invalidText : props.warnText}</span>
			</p>
		</Show>
	)
}

/* ---- layouts ---- */

/** Padding for a field in its inline layout. A step tighter than FIELD_SIZE at
 *  every size: an inline field is one row of a dense panel, and at `sm` it has
 *  no vertical padding at all — the row is exactly one line of text and its
 *  rule, which is what lets mica fit a whole machine's settings in a 20rem lane. */
export const INLINE_SIZE: Record<FieldSize, string> = {
	sm: "px-tight py-0",
	md: "px-snug py-tight",
	lg: "px-2 py-snug",
}

/** The row of an inline field: what it is on the left, the control that sets it
 *  hard against the right.
 *
 *  The label drops out of the field voice here: a column of bold uppercase
 *  labels down a dense panel shouts, so an inline label is sentence case and
 *  dimmed, and the *value* is the heavy thing in the row. */
function InlineField(props: {
	/** The control's id, so the label focuses it. */
	for: string
	label: JSX.Element
	class?: string
	children?: JSX.Element
}) {
	return (
		<div class={`flex items-center justify-between gap-2 py-rule ${props.class ?? ""}`}>
			<label for={props.for} class="min-w-0 flex-1 truncate text-small opacity-muted">
				{props.label}
			</label>
			<span class="flex shrink-0 justify-end">{props.children}</span>
		</div>
	)
}

type FieldProps = {
	/** The control's id. The message's is `${id}-message`. */
	id: string
	labelText?: JSX.Element
	hideLabel?: boolean
	counter?: string
	helperText?: JSX.Element
	invalid?: boolean
	invalidText?: JSX.Element
	warn?: boolean
	warnText?: JSX.Element
	/** Carbon's inline layout: the label beside the control — a settings row. */
	inline?: boolean
	/** Lays the field out as a flex column, so a control marked `grow` takes the
	 *  height of a row that stretches. A Select on a toolbar beside buttons has to
	 *  match theirs. */
	stretch?: boolean
	class?: string
	/** The control. */
	children?: JSX.Element
}

export const messageIdOf = (id: string) => `${id}-message`

/** What goes in a control's `aria-describedby`: its message's id, while there
 *  is a message to point at. Naming an id that is not on the page is not an
 *  error, but it was a loose end on every field without helper text — which is
 *  most of them.
 *
 *  `helperText` is asked of the props object, never read: reading a JSX prop
 *  builds it. See "Slots" in CLAUDE.md. */
export function describedBy(id: string, props: FieldCommonProps): string | undefined {
	return props.invalid || props.warn || "helperText" in props ? messageIdOf(id) : undefined
}

/** A field, around its control: the label, the message, and whichever of three
 *  layouts it is in.
 *
 *    stacked  the label above the control — the default
 *    inline   the label beside it, the control at the trailing edge
 *    fluid    the label *inside* the field, which becomes a cell — Carbon's
 *             fluid forms. Chosen by context, not by a prop: see `Fluid`.
 *
 *  The control is the caller's, and so is its surface; `useFluid()` tells it
 *  when to drop its own rule because the cell has taken over.
 */
export function Field(props: FieldProps) {
	const fluid = useFluid()

	const message = () => (
		<FieldMessage
			id={messageIdOf(props.id)}
			invalid={props.invalid}
			invalidText={props.invalidText}
			warn={props.warn}
			warnText={props.warnText}
			helperText={props.helperText}
		/>
	)

	return (
		<Show
			when={fluid}
			fallback={
				<Show
					when={props.inline}
					fallback={
						<div class={`${props.stretch ? "flex flex-col" : ""} ${props.class ?? ""}`}>
							<FieldLabel for={props.id} hideLabel={props.hideLabel} counter={props.counter}>
								{props.labelText}
							</FieldLabel>
							{props.children}
							{message()}
						</div>
					}
				>
					<div class={props.class}>
						<InlineField for={props.id} label={props.labelText}>{props.children}</InlineField>
						{message()}
					</div>
				</Show>
			}
		>
			{(mode) => (
				// The cell is the field: a white box that lights when anything in it is
				// focused. Tiled, the form's grid rules it off from its neighbours and
				// it has no border of its own; alone, it is boxed. Padded 8px all round,
				// with 8px between the label and the value. At 6px above, 4px below and
				// nothing under the label, the value sat on the label's foot; at 16px
				// at the sides, the label read as pushed in (the sign-in card, in
				// review). Even on every side, the box is a frame round the two lines.
				<div
					class={`relative flex min-w-0 flex-col bg-white p-2 focus-within:bg-field
						${mode().tiled ? "" : "border-2 border-ink"} ${props.class ?? ""}`}
				>
					<FieldLabel
						for={props.id}
						hideLabel={props.hideLabel}
						counter={props.counter}
						class="mb-2"
					>
						{props.labelText}
					</FieldLabel>
					{props.children}
					{message()}
					{
						/* Severity thickens the bottom edge to 4px, as it does on every
					    other field: 2px here, on top of the 2px the box or the grid
					    already draws. Laid over the cell rather than added to its
					    border, so a flagged cell is the same height as its neighbours. */
					}
					<Show when={props.invalid || props.warn}>
						<span
							aria-hidden="true"
							class="pointer-events-none absolute inset-x-0 bottom-0 h-rule bg-ink"
						/>
					</Show>
				</div>
			)}
		</Show>
	)
}
