import { createSignal, Show, splitProps } from "solid-js"
import type { JSX } from "solid-js"
import { createId } from "../../internal/control"
import {
	countOf,
	describedBy,
	Field,
	FIELD_BASE,
	FIELD_FLAGGED,
	FIELD_INNER,
	FIELD_READONLY,
	FIELD_SIZE,
	fieldProps,
	INLINE_SIZE,
	useFluid,
} from "../../internal/field"
import type { FieldCommonProps } from "../../internal/field"

export type TextInputProps = FieldCommonProps & {
	type?: "text" | "email" | "password" | "tel" | "url" | "number"
	/** The browser's autofill hint for what the field holds — `email`,
	 *  `username`, `name`, `off` — so a sign-in form is offered the address the
	 *  browser or a password manager keeps. */
	autocomplete?: "email" | "username" | "name" | "tel" | "url" | "off"
	placeholder?: string
	value?: string
	disabled?: boolean
	readOnly?: boolean
	required?: boolean
	/** Carbon's inline: the label sits beside the field. The value is set right
	 *  and bold, so a column of these reads as a column of values. */
	inline?: boolean
	/** Carbon's enableCounter: shows how much of `maxCount` is used, at the
	 *  label's trailing edge. */
	enableCounter?: boolean
	/** The most characters the field takes. Enforced, not just displayed. */
	maxCount?: number
	onInput?: JSX.EventHandlerUnion<HTMLInputElement, InputEvent>
	onChange?: JSX.EventHandlerUnion<HTMLInputElement, Event>
	/** For an input that commits on a key rather than on blur — quarry's topic
	 *  field, which turns what you typed into a tag on Enter. Spread straight onto
	 *  the element, as TextArea's is. */
	onKeyDown?: JSX.EventHandlerUnion<HTMLInputElement, KeyboardEvent>
}

export function TextInput(props: TextInputProps) {
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
		"inline",
		"enableCounter",
		"maxCount",
		"class",
		// Pulled out so the count can follow typing alongside the caller's handler.
		"onInput",
	])

	const id = createId("text-input", () => local.id)
	const size = () => local.size ?? "md"
	const fluid = useFluid()

	// What the count is of. Seeded from `value` and then kept in step with what
	// is typed, so an uncontrolled field counts too.
	const [typed, setTyped] = createSignal(props.value ?? "")
	const counter = () =>
		local.enableCounter && local.maxCount !== undefined
			? `${countOf(props.value ?? typed())}/${local.maxCount}`
			: undefined

	const input = () => (
		<input
			id={id()}
			type={props.type ?? "text"}
			maxLength={local.enableCounter ? local.maxCount : undefined}
			aria-invalid={local.invalid ? "true" : undefined}
			aria-describedby={describedBy(id(), local)}
			onInput={(event) => {
				setTyped(event.currentTarget.value)
				const handler = local.onInput
				if (typeof handler === "function") handler(event)
				else if (handler) handler[0](handler[1], event)
			}}
			// One whole string per layout, never a base with overrides laid over it.
			class={fluid
				? `${FIELD_INNER} w-full p-0`
				: `${FIELD_BASE} ${FIELD_READONLY} ${
					local.inline ? `${INLINE_SIZE[size()]} text-right font-bold` : FIELD_SIZE[size()]
				} ${local.invalid || local.warn ? FIELD_FLAGGED : ""}`}
			{...rest}
		/>
	)

	return (
		<Field id={id()} {...fieldProps(local)} counter={counter()} inline={local.inline}>
			<Show when={local.inline && !fluid} fallback={input()}>
				{
					/* The width sits on a wrapper. On the input it would be a second
				    width utility beside FIELD_BASE's w-full, and which of the two won
				    would be up to their order in the stylesheet. */
				}
				<span class="block w-36">{input()}</span>
			</Show>
		</Field>
	)
}
