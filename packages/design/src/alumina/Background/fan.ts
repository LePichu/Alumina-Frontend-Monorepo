/** The floor's perspective fan, as a background-image layer.
 *
 * The prototype ships this as an 8.9 kB inline data URI. It is generated here
 * instead — 461 rays from one apex to evenly spaced points along the base is all
 * that blob ever was — but it is still delivered the same way the prototype
 * delivers it: as a `background-image` layer, not as an inline <svg> element.
 *
 * That distinction turned out to matter. An inline SVG and an SVG background
 * image do not rasterise identically here: `preserveAspectRatio='none'` applies a
 * non-uniform viewBox transform (4800 -> 48·cell across, 300 -> floor-h down), and
 * `vector-effect='non-scaling-stroke'` resolves against different coordinate
 * spaces in the two cases. Using the background layer removes the question.
 *
 * The viewBox is 4800 wide and holds 48 columns, so one column is 100 units and
 * the layer is sized to 48 × --cell — that is what keeps a column exactly --cell
 * across on any screen. APEX_Y over BASE_Y is -36/300 = 0.12, which is why --apex
 * is 0.12; the two must stay in step or the fan and the horizontal rules converge
 * on different points.
 */

const APEX_X = 2400
const APEX_Y = -36
const BASE_Y = 300
const VIEWBOX_W = 4800

/** Rays run far outside the viewBox on both sides. They are clipped there, but
 *  each one still crosses the visible region near the apex, and that is what makes
 *  the convergence dense at the horizon. */
const FIRST_X = -20600
const LAST_X = 25400
const STEP = 100

/** Verbatim from the prototype's data URI, and deliberately not hsl(var(--line)).
 *  The prototype's fan had drifted lighter than the token it nominally came from
 *  — rgb(150,152,162) is about hsl(230 6% 61%) against --line's hsl(225 6% 55%) —
 *  and matching the demo means keeping the drift. Reconciling the two is a design
 *  decision, not a cleanup. */
const FAN_STROKE = "rgb(150,152,162)"

const FAN_VIEWBOX = `0 0 ${VIEWBOX_W} ${BASE_Y}`

const FAN_PATH = (() => {
	const rays: string[] = []
	for (let x = FIRST_X; x <= LAST_X; x += STEP) {
		rays.push(`M${APEX_X} ${APEX_Y}L${x} ${BASE_Y}`)
	}
	return rays.join("")
})()

/** A complete `background-image` value. Fed to the floor-grid utility as --fan,
 *  which places it `center bottom / calc(48 * var(--cell)) var(--floor-h)`.
 *
 *  fill='none' is a no-op the prototype omits — every subpath is a two-point line,
 *  so the implicit close encloses zero area — but it is stated rather than left to
 *  the reader to work out. */
export const FAN_LAYER =
	`url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='${FAN_VIEWBOX}'` +
	` preserveAspectRatio='none'><path d='${FAN_PATH}' fill='none' stroke='${FAN_STROKE}'` +
	` stroke-width='1' vector-effect='non-scaling-stroke'/></svg>")`
