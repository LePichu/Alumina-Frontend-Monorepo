import { Show } from "solid-js"
import Caution from "@carbon/icons/es/caution/index.js"
import CircleFill from "@carbon/icons/es/circle-fill/index.js"
import CircleStroke from "@carbon/icons/es/circle-stroke/index.js"
import CriticalSeverity from "@carbon/icons/es/critical-severity/index.js"
import Critical from "@carbon/icons/es/critical/index.js"
import DiamondFill from "@carbon/icons/es/diamond-fill/index.js"
import Incomplete from "@carbon/icons/es/incomplete/16"
import LowSeverity from "@carbon/icons/es/low-severity/index.js"
import type { CarbonGlyph } from "../../icons/glyph"
import { Icon } from "../../icons/Icon"
import { Tooltip } from "../Tooltip/Tooltip"
import type { TooltipAlign } from "../Tooltip/Tooltip"

/** Carbon's eleven, in Carbon's order, each with Carbon's shape. */
const SHAPE = {
	failed: Critical,
	critical: CriticalSeverity,
	high: Caution,
	medium: DiamondFill,
	low: LowSeverity,
	cautious: Caution,
	undefined: DiamondFill,
	stable: CircleFill,
	informative: LowSeverity,
	incomplete: Incomplete,
	draft: CircleStroke,
} satisfies Record<string, CarbonGlyph>

export type ShapeIndicatorKind = keyof typeof SHAPE

export const ShapeIndicatorKinds = Object.keys(SHAPE) as ShapeIndicatorKind[]

export type ShapeIndicatorProps = {
	kind: ShapeIndicatorKind
	/** What the status is, in words. */
	label: string
	/** Only the shape, with the label in a tooltip. */
	compact?: boolean
	/** Read to assistive tech in compact mode. Defaults to the label. */
	shapeDescription?: string
	align?: TooltipAlign
	/** Carbon's 12 or 14. */
	textSize?: 12 | 14
	class?: string
}

/** Carbon's ShapeIndicator (preview, as of @carbon/react 1.118): a status as a
 *  small solid shape and a word.
 *
 *  Ported as it is, which leaves a wrinkle worth knowing about. Carbon has
 *  eleven kinds and eight shapes: `high` and `cautious` are the same triangle,
 *  `medium` and `undefined` the same diamond, `low` and `informative` the same
 *  square, told apart in Carbon by colour alone. There is no colour here, so
 *  within each pair only the label differs — which is still a difference, as
 *  the label is always shown or one hover away, but it means `compact` should
 *  not be used where two kinds from one pair can sit in the same column. Use
 *  `IconIndicator` there: its twelve glyphs are all different.
 */
export function ShapeIndicator(props: ShapeIndicatorProps) {
	const shape = () => <Icon glyph={SHAPE[props.kind]} size={16} />

	return (
		<span
			class={`inline-flex items-center gap-snug ${
				props.textSize === 14 ? "text-body" : "text-small"
			} ${props.class ?? ""}`}
		>
			<Show
				when={props.compact}
				fallback={
					<>
						{shape()}
						{props.label}
					</>
				}
			>
				<Tooltip
					label={props.label}
					triggerLabel={props.shapeDescription ?? props.label}
					align={props.align ?? "right"}
				>
					{shape()}
				</Tooltip>
			</Show>
		</span>
	)
}
