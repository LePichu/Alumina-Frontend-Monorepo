import { FormGroup } from "../FormGroup/FormGroup"
import type { FormGroupProps } from "../FormGroup/FormGroup"

export type CheckboxGroupProps = Omit<FormGroupProps, "hint"> & {
	orientation?: "horizontal" | "vertical"
}

/** Carbon's CheckboxGroup: a FormGroup that also lays its checkboxes out.
 *
 *  Stacked, they read as a list and sit tight; in a row each needs air either
 *  side to part it from its neighbour. No rules between them. */
export function CheckboxGroup(props: CheckboxGroupProps) {
	return (
		<FormGroup
			legendText={props.legendText}
			hideLegend={props.hideLegend}
			helperText={props.helperText}
			invalid={props.invalid}
			invalidText={props.invalidText}
			warn={props.warn}
			warnText={props.warnText}
			disabled={props.disabled}
			class={props.class}
		>
			<div
				class={`flex ${
					props.orientation === "horizontal" ? "flex-row flex-wrap gap-4" : "flex-col gap-tight"
				}`}
			>
				{props.children}
			</div>
		</FormGroup>
	)
}
