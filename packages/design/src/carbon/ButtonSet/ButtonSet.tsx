import type { JSX } from "solid-js"

export type ButtonSetProps = {
	/** One above the other, each as wide as the set. */
	stacked?: boolean
	class?: string
	children?: JSX.Element
}

/** Carbon's ButtonSet: buttons that belong together.
 *
 *  Carbon butts them edge to edge. Here every button has a hard shadow that
 *  falls to the right and below, so two that touched would each sit on the
 *  other's — they are set a step apart instead. */
export function ButtonSet(props: ButtonSetProps) {
	return (
		<div
			class={`flex gap-2 ${props.stacked ? "flex-col items-stretch" : "flex-wrap items-center"} ${
				props.class ?? ""
			}`}
		>
			{props.children}
		</div>
	)
}
