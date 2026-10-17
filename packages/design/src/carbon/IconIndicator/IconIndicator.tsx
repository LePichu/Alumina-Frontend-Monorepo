import { Show } from "solid-js"
import CheckmarkFilled from "@carbon/icons/es/checkmark--filled/16"
import CheckmarkOutline from "@carbon/icons/es/checkmark--outline/16"
import CircleDash from "@carbon/icons/es/circle-dash/16"
import ErrorFilled from "@carbon/icons/es/error--filled/16"
import InProgress from "@carbon/icons/es/in-progress/16"
import Incomplete from "@carbon/icons/es/incomplete/16"
import PendingFilled from "@carbon/icons/es/pending--filled/16"
import UndefinedFilled from "@carbon/icons/es/undefined--filled/16"
import UnknownFilled from "@carbon/icons/es/unknown--filled/16"
import WarningAltFilled from "@carbon/icons/es/warning--alt--filled/16"
import WarningAltInvertedFilled from "@carbon/icons/es/warning--alt-inverted--filled/16"
import WarningSquareFilled from "@carbon/icons/es/warning-square--filled/16"
import type { CarbonGlyph } from "../../icons/glyph"
import { Icon } from "../../icons/Icon"
import { Tooltip } from "../Tooltip/Tooltip"
import type { TooltipAlign } from "../Tooltip/Tooltip"

/** Carbon's twelve, in Carbon's order, each with Carbon's glyph. */
const GLYPH = {
	failed: ErrorFilled,
	"caution-major": WarningAltInvertedFilled,
	"caution-minor": WarningAltFilled,
	undefined: UndefinedFilled,
	succeeded: CheckmarkFilled,
	normal: CheckmarkOutline,
	"in-progress": InProgress,
	incomplete: Incomplete,
	"not-started": CircleDash,
	pending: PendingFilled,
	unknown: UnknownFilled,
	informative: WarningSquareFilled,
} satisfies Record<string, CarbonGlyph>

export type IconIndicatorKind = keyof typeof GLYPH

export const IconIndicatorKinds = Object.keys(GLYPH) as IconIndicatorKind[]

export type IconIndicatorProps = {
	kind: IconIndicatorKind
	/** What the status is, in words. Always given: the glyph is never alone. */
	label: string
	/** Only the glyph, with the label in a tooltip — for a dense table column. */
	compact?: boolean
	/** Read to assistive tech in compact mode. Defaults to the label. */
	iconDescription?: string
	align?: TooltipAlign
	/** Carbon's 16 or 20. The 20 sets the label at body size beside a larger
	 *  glyph; the glyph is the 16px descriptor scaled, since a status mark has to
	 *  be the same drawing at both sizes. */
	size?: 16 | 20
	class?: string
}

/** Carbon's IconIndicator (preview, as of @carbon/react 1.118): a status as a
 *  glyph and a word.
 *
 *  Carbon colours each glyph. Here the glyph and the word are the whole of it —
 *  which is the system's rule for severity everywhere, and the reason this one
 *  ports cleanly: twelve states, twelve different drawings, nothing resting on
 *  hue.
 */
export function IconIndicator(props: IconIndicatorProps) {
	const glyph = () => <Icon glyph={GLYPH[props.kind]} size={props.size ?? 16} />

	return (
		<span
			class={`inline-flex items-center gap-snug ${props.size === 20 ? "text-body" : "text-small"} ${
				props.class ?? ""
			}`}
		>
			<Show
				when={props.compact}
				fallback={
					<>
						{glyph()}
						{props.label}
					</>
				}
			>
				<Tooltip
					label={props.label}
					triggerLabel={props.iconDescription ?? props.label}
					align={props.align ?? "right"}
				>
					{glyph()}
				</Tooltip>
			</Show>
		</span>
	)
}
