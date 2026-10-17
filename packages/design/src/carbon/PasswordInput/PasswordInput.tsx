import { createSignal, splitProps } from "solid-js"
import type { JSX } from "solid-js"
import ViewOff from "@carbon/icons/es/view--off/16"
import View from "@carbon/icons/es/view/16"
import { Icon } from "../../icons/Icon"
import { createId } from "../../internal/control"
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
	useFluid,
} from "../../internal/field"
import type { FieldCommonProps } from "../../internal/field"

export type PasswordInputProps = FieldCommonProps & {
	placeholder?: string
	value?: string
	disabled?: boolean
	required?: boolean
	/** Tells the browser's password manager what this is: `current-password` for
	 *  a sign-in, `new-password` for a field that sets one. */
	autocomplete?: "current-password" | "new-password" | "off"
	showPasswordLabel?: string
	hidePasswordLabel?: string
	onInput?: JSX.EventHandlerUnion<HTMLInputElement, InputEvent>
	onChange?: JSX.EventHandlerUnion<HTMLInputElement, Event>
	onTogglePasswordVisibility?: (visible: boolean) => void
}

/** Carbon's PasswordInput: a text field that hides what is typed, with a control
 *  to show it.
 *
 *  The rule belongs to the wrapper, so it runs under the eye as well as under
 *  the text — one field, not a field with a button beside it. The wrapper lights
 *  when the input inside it is focused, as NumberInput's does.
 */
export function PasswordInput(props: PasswordInputProps) {
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
		"showPasswordLabel",
		"hidePasswordLabel",
		"onTogglePasswordVisibility",
		"class",
	])

	const id = createId("password-input", () => local.id)
	const size = () => local.size ?? "md"
	const fluid = useFluid()
	const [visible, setVisible] = createSignal(false)

	return (
		<Field id={id()} {...fieldProps(local)}>
			<div
				class={`${fluid ? FIELD_GROUP_FLUID : FIELD_GROUP}
					${!fluid && (local.invalid || local.warn) ? FIELD_FLAGGED : ""}
					${props.disabled ? "cursor-not-allowed opacity-40" : ""}`}
			>
				<input
					id={id()}
					type={visible() ? "text" : "password"}
					aria-invalid={local.invalid ? "true" : undefined}
					aria-describedby={describedBy(id(), local)}
					class={`${FIELD_INNER} min-w-0 flex-1 ${fluid ? "p-0" : FIELD_SIZE[size()]}`}
					{...rest}
				/>
				<button
					type="button"
					// States what pressing it does, and says which state it is in.
					aria-label={visible()
						? (local.hidePasswordLabel ?? "Hide password")
						: (local.showPasswordLabel ?? "Show password")}
					aria-pressed={visible()}
					disabled={props.disabled}
					onClick={() => {
						const next = !visible()
						setVisible(next)
						local.onTogglePasswordVisibility?.(next)
					}}
					class={FIELD_TOOL}
				>
					<Icon glyph={visible() ? ViewOff : View} size={16} />
				</button>
			</div>
		</Field>
	)
}
