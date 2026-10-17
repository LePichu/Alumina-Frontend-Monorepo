import { createEffect, createSignal, onMount, splitProps } from "solid-js"
import type { JSX } from "solid-js"
import { createId } from "../../internal/control"
import {
	countOf,
	describedBy,
	Field,
	FIELD_FLAGGED,
	FIELD_GROUP,
	FIELD_INNER,
	FIELD_SIZE,
	fieldProps,
	useFluid,
} from "../../internal/field"
import type { FieldCommonProps } from "../../internal/field"
import { createScrollbars, ScrollTrack } from "../../internal/scroll"

export type TextAreaProps = FieldCommonProps & {
	placeholder?: string
	value?: string
	rows?: number
	disabled?: boolean
	readOnly?: boolean
	required?: boolean
	/** Drops the field's rule so the textarea *is* the surface of whatever contains
	 *  it.
	 *
	 *  For a composer: the bordered box around it already reads as the field, and a
	 *  rule inside a box reads as two edges nested one inside the other. Focus is
	 *  still the light ground every other field uses. */
	bare?: boolean
	/** Grows with its content instead of scrolling, up to `maxRows`. */
	autoResize?: boolean
	/** Ceiling for `autoResize`, in rows. Past it the field scrolls. */
	maxRows?: number
	/** Carbon's enableCounter: shows how much of `maxCount` is used. */
	enableCounter?: boolean
	maxCount?: number
	/** What `maxCount` counts. Characters are enforced by the browser; words are
	 *  only counted, since a field cannot refuse a word mid-sentence. */
	counterMode?: "character" | "word"
	onInput?: JSX.EventHandlerUnion<HTMLTextAreaElement, InputEvent>
	onChange?: JSX.EventHandlerUnion<HTMLTextAreaElement, Event>
	onKeyDown?: JSX.EventHandlerUnion<HTMLTextAreaElement, KeyboardEvent>
}

export function TextArea(props: TextAreaProps) {
	const [local, rest] = splitProps(props, [
		"id",
		"labelText",
		"hideLabel",
		"helperText",
		"invalid",
		"invalidText",
		"warn",
		"warnText",
		"size",
		"bare",
		"autoResize",
		"maxRows",
		"enableCounter",
		"maxCount",
		"counterMode",
		"class",
		// Pulled out so re-fitting can run alongside the caller's handler. Left in
		// `rest` it would be spread over the internal one and silently replace it.
		"onInput",
		// Pulled out because a textarea has no value *attribute*. See below.
		"value",
	])

	const id = createId("text-area", () => local.id)
	const size = () => local.size ?? "md"
	const fluid = useFluid()

	let field: HTMLTextAreaElement | undefined

	/** Measuring is the only way to size a textarea to its content: collapse it so
	 *  scrollHeight reports what the text actually needs, then take that back.
	 *
	 *  Both bounds are applied here rather than as min/max-height classes. A
	 *  max-height alone would let scrollHeight keep growing past it, so the field
	 *  would never shrink back; a min-height alone would be measured *into* the
	 *  next scrollHeight and ratchet the field taller on every keystroke. Clamping
	 *  the number before it is written is the only version of this that settles. */
	const fit = () => {
		if (!field || !local.autoResize) return
		const line = parseFloat(getComputedStyle(field).lineHeight) || 16
		const floor = line * (props.rows ?? 2)
		const ceiling = line * (local.maxRows ?? 8)
		field.style.height = "auto"
		field.style.height = `${Math.min(Math.max(field.scrollHeight, floor), ceiling)}px`
	}

	/** A textarea's value is its *content*, not an attribute.
	 *
	 *  Left in the spread, `value` was rendered by the server as `value="…"`, which
	 *  the HTML parser drops on the floor — so a server-rendered textarea arrived
	 *  empty and hydration, finding the markup it expected, never corrected it.
	 *  Every other field escapes this because `value` really is an attribute on an
	 *  `<input>`.
	 *
	 *  So the first value is rendered as a child, which is what the server can
	 *  express, and every later one is written to the property. Writing the child
	 *  instead would replace the text node under the caret on each keystroke. */
	const initial = local.value

	const [typed, setTyped] = createSignal(initial ?? "")
	const counter = () =>
		local.enableCounter && local.maxCount !== undefined
			? `${countOf(local.value ?? typed(), local.counterMode)}/${local.maxCount}`
			: undefined

	onMount(fit)
	// A textarea scrolls, so it has the system's scrollbar like anything else
	// that does. It cannot hold one — it is a replaced element — so the gutter
	// stands beside it, inside the same field.
	const bars = createScrollbars(() => field)

	createEffect(() => {
		const next = local.value
		if (field && next !== undefined && field.value !== next) field.value = next
		// Re-fit when the value is driven from outside — clearing the composer after
		// a send has to shrink it back, and no input event fires for that.
		fit()
		bars.measure()
	})

	/** What is around the textarea: the field's rule and its lit ground, which
	 *  have to run under the gutter as well as under the text. */
	const frame = () => {
		const state = props.disabled ? "cursor-not-allowed opacity-40" : ""
		if (local.bare) return `flex focus-within:bg-field ${state}`
		if (fluid) return `flex ${state}`
		return `${FIELD_GROUP} ${local.invalid || local.warn ? FIELD_FLAGGED : ""} ${
			props.readOnly ? "border-transparent" : ""
		} ${state}`
	}

	const surface = () => {
		if (local.bare) {
			return `${FIELD_INNER} resize-none pointer-coarse:min-h-touch ${
				local.autoResize ? "overflow-y-auto" : ""
			}`
		}
		if (fluid) return `${FIELD_INNER} resize-y p-0`
		return `${FIELD_INNER} resize-y ${FIELD_SIZE[size()]}`
	}

	return (
		<Field id={id()} {...fieldProps(local)} counter={counter()}>
			<div class={frame()}>
				<textarea
					ref={field}
					id={id()}
					rows={props.rows ?? 4}
					maxLength={local.enableCounter && local.counterMode !== "word"
						? local.maxCount
						: undefined}
					aria-invalid={local.invalid ? "true" : undefined}
					aria-describedby={describedBy(id(), local)}
					onInput={(event) => {
						fit()
						setTyped(event.currentTarget.value)
						const handler = local.onInput
						if (typeof handler === "function") handler(event)
						else if (handler) handler[0](handler[1], event)
					}}
					class={`min-w-0 flex-1 ${surface()}`}
					{...rest}
				>
					{initial}
				</textarea>
				<ScrollTrack axis="y" bars={bars} />
			</div>
		</Field>
	)
}
