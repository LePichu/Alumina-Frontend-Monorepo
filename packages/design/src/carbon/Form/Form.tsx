import type { JSX } from "solid-js"
import { useFluid } from "../../internal/field"
import { LABEL, RULED_GRID } from "../../internal/styles"

export type FormProps = {
	"aria-label"?: string
	"aria-labelledby"?: string
	class?: string
	children?: JSX.Element
	onSubmit?: (event: SubmitEvent) => void
}

/** Carbon's Form: a `<form>` that spaces its fields.
 *
 *  Fields stack with a full step of air between them and nothing else — no
 *  rules, no boxes. Grouping inside a form is a FormGroup; dividing one into
 *  ruled bands is what a flush Tile of TileSections is for.
 *
 *  Under `FluidForm` it is a ruled frame its fields tile in instead — see
 *  FluidForm.
 *
 *  `noValidate` is set: the browser's own validation bubbles are drawn by the
 *  OS and say nothing in the system's voice. Validation here is the field's
 *  `invalid` and `invalidText`.
 */
export function Form(props: FormProps) {
	const fluid = useFluid()

	return (
		<form
			noValidate
			aria-label={props["aria-label"]}
			aria-labelledby={props["aria-labelledby"]}
			onSubmit={(event) => {
				// A form here is handled by the page, never posted by the browser.
				event.preventDefault()
				props.onSubmit?.(event)
			}}
			class={`${fluid ? RULED_GRID : "flex flex-col gap-6"} ${props.class ?? ""}`}
		>
			{props.children}
		</form>
	)
}

/** Carbon's FormItem: one field's worth of a form, when what goes in it is not
 *  already a field component with its own label and message. */
export function FormItem(props: { class?: string; children?: JSX.Element }) {
	return <div class={`flex flex-col ${props.class ?? ""}`}>{props.children}</div>
}

/** Carbon's FormLabel: a label in the field voice, for a control that does not
 *  bring one. */
export function FormLabel(props: { for?: string; class?: string; children?: JSX.Element }) {
	return (
		<label
			for={props.for}
			class={`mb-tight block ${LABEL} ${props.class ?? ""}`}
		>
			{props.children}
		</label>
	)
}
