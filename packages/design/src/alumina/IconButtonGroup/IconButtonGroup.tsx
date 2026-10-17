import type { JSX } from "solid-js"
import { RULED_GRID } from "../../internal/styles"

export type IconButtonGroupProps = {
	/** Names the cluster for assistive tech, e.g. "Viewport controls". */
	label: string
	/** Columns to lay the buttons out on. 2 gives the prototypes' 2×2 pad. */
	columns?: 2 | 3 | 4
	class?: string
	children?: JSX.Element
}

/** Written out rather than composed, so Tailwind can see each class as a literal
 *  and emit it. A count is structural, not a size, so these are exempt from the
 *  even-number rule. */
const COLUMNS: Record<2 | 3 | 4, string> = {
	2: "grid-cols-2",
	3: "grid-cols-3",
	4: "grid-cols-4",
}

/** A cluster of icon actions in one ink box, divided by ink rules.
 *
 *  Visually this is `ContentSwitcher`, and deliberately so — but it is not one.
 *  A content switcher is a tablist: exactly one of its items is selected at a
 *  time. These are independent actions (refit the frame, go full screen), and
 *  announcing them as tabs would tell a screen-reader user that three of the four
 *  are "unselected", which is meaningless. So it is a `group` of real buttons that
 *  happens to share the switcher's anatomy.
 *
 *  Children are `IconButton`s with `flat` and `fill`. The dividers belong to this
 *  container, not to the buttons: a border on each cell doubles up against its
 *  neighbour's and reads as a gap.
 */
export function IconButtonGroup(props: IconButtonGroupProps) {
	return (
		// The dividers are the grid's own gaps showing the ink ground through —
		// RULED_GRID — which is why the children are borderless.
		<div
			role="group"
			aria-label={props.label}
			class={`${RULED_GRID} ${COLUMNS[props.columns ?? 2]} ${props.class ?? ""}`}
		>
			{props.children}
		</div>
	)
}
