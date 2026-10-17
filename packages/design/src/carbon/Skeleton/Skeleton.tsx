import { For } from "solid-js"
import { SKELETON } from "../../internal/skeleton"

/** Carbon's skeleton states: the shape of content that has not arrived.
 *
 *  All three are the `skeleton` utility from theme.css on a box — a grey block
 *  that fades down and back, in step with every other skeleton on the page,
 *  and sits still under prefers-reduced-motion. They are hidden from assistive
 *  tech: a skeleton says nothing a screen reader can use, so whatever shows one
 *  should carry `aria-busy` on the region itself.
 */

export type SkeletonTextProps = {
	/** A heading's line rather than body text's: taller. */
	heading?: boolean
	/** Several lines, the last one short, as a paragraph ends. */
	paragraph?: boolean
	/** How many lines `paragraph` draws. */
	lineCount?: number
	/** Any CSS width. Defaults to the full measure. */
	width?: string
	class?: string
}

export function SkeletonText(props: SkeletonTextProps) {
	const lines = () => Array.from({ length: props.paragraph ? (props.lineCount ?? 3) : 1 })

	return (
		<div aria-hidden="true" class={`flex flex-col gap-snug ${props.class ?? ""}`}>
			<For each={lines()}>
				{(_, index) => (
					<span
						style={{ "--skeleton-w": props.width ?? "100%" }}
						class={`${SKELETON} block max-w-full ${props.heading ? "h-6" : "h-4"} ${
							// A paragraph's last line stops short; a ragged right edge is
							// what makes a stack of bars read as text.
							props.paragraph && index() === lines().length - 1 && lines().length > 1
								? "w-2/4"
								: "w-[var(--skeleton-w)]"}`}
					/>
				)}
			</For>
		</div>
	)
}

export type SkeletonPlaceholderProps = {
	/** Sizes the block. It is 16×16rem unless told otherwise, as in Carbon — pass
	 *  `size-*`, `h-*` or `aspect-*` utilities. */
	class?: string
}

/** A block standing in for something that is not text: a figure, a thumbnail,
 *  a render. */
export function SkeletonPlaceholder(props: SkeletonPlaceholderProps) {
	return <div aria-hidden="true" class={`${SKELETON} ${props.class ?? "size-24"}`} />
}

export type SkeletonIconSize = 16 | 24 | 32

export type SkeletonIconProps = {
	/** Icon's sizes, less 20: a 20px box is five quarter-rems, which the
	 *  even-number rule has no class for, and a placeholder 4px out is not worth
	 *  an exception. */
	size?: SkeletonIconSize
	class?: string
}

const ICON: Record<SkeletonIconSize, string> = {
	16: "size-4",
	24: "size-6",
	32: "size-8",
}

export function SkeletonIcon(props: SkeletonIconProps) {
	return (
		<span
			aria-hidden="true"
			class={`${SKELETON} block shrink-0 ${ICON[props.size ?? 16]} ${props.class ?? ""}`}
		/>
	)
}
