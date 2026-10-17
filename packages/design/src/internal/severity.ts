import CheckmarkFilled from "@carbon/icons/es/checkmark--filled/16"
import ErrorFilled from "@carbon/icons/es/error--filled/16"
import InformationFilled from "@carbon/icons/es/information--filled/16"
import WarningFilled from "@carbon/icons/es/warning--filled/16"
import type { CarbonGlyph } from "../icons/glyph"

/** Carbon's four statuses. Its `kind` prop on every notification, and what a
 *  field's `invalid` and `warn` come down to. */
export type Status = "error" | "warning" | "success" | "info"

/** Which glyph says which status — decided once.
 *
 *  Severity is never a colour here, so the glyph carries the ranking, with the
 *  word spelled out beside it and the weight of the line. The four filled
 *  Carbon glyphs already differ in silhouette — octagon, triangle, disc, disc
 *  with an i — which is what lets them do that alone.
 */
export const STATUS_GLYPH: Record<Status, CarbonGlyph> = {
	error: ErrorFilled,
	warning: WarningFilled,
	success: CheckmarkFilled,
	info: InformationFilled,
}
