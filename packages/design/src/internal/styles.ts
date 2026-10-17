/** The class strings more than one component is made of.
 *
 *  Each is a decision about how the system looks, and each lives here so that it
 *  is made once. Before this file they were repeated inline — the label voice
 *  in thirty-five places, the box in twenty-nine — which is how a redesign turns
 *  into a search for every copy and a guess at which ones were meant to differ.
 *
 *  Plain strings, so Tailwind reads the classes straight out of this file.
 */

/** The label voice: a field's label, a group's legend, a tile's heading, a
 *  table's column head, a tag. Whatever names a thing rather than being one. */
export const LABEL = "text-micro font-bold uppercase"

/** The line under a field, and anything else that explains rather than names. */
export const HELPER = "text-micro opacity-muted"

/** The box: 2px of ink round white. A Tile is this with the shadow; a Select's
 *  trigger and a table's frame are this without. */
export const BOX = "border-2 border-ink bg-white"

/** Cells tiled in one frame: an ink ground showing through a 2px gap, so every
 *  rule between two cells is drawn once, by the grid, and no cell has a border
 *  to double up against its neighbour's. The cells themselves are borderless
 *  and white. Add the columns. */
export const RULED_GRID = "grid gap-rule border-2 border-ink bg-ink"

/** The same for cells that are already inside such a frame: the gap still rules
 *  them off from each other, and the outer frame supplies the edge. */
export const RULED_GRID_INNER = "grid gap-rule bg-ink"

/** Anything that floats — menus, listboxes, calendars, popovers. One box, one
 *  shadow, no caret. */
export const FLOATING_SURFACE = `z-50 ${BOX} text-ink shadow-hard`

/** The same inverted: what a tooltip and a toggletip are drawn in. */
export const FLOATING_SURFACE_INVERSE =
	`on-ink z-50 border-2 border-ink bg-ink text-white shadow-hard`

/** A tooltip: the inverse surface, sized for one line in the label voice. */
export const TOOLTIP_SURFACE = `${FLOATING_SURFACE_INVERSE} px-2 py-tight ${LABEL}`

/** The ink bar across the top of a Modal, a Dialog and a Drawer. */
export const INK_BAR =
	"on-ink flex shrink-0 items-center gap-2 border-b-2 border-ink bg-ink px-2 py-snug text-white"

/** The one control an ink bar carries: a borderless white glyph, 44px under a
 *  finger. Never two — a bar with a close and a collapse reads as a toolbar. */
export const INK_BAR_CONTROL =
	"flex shrink-0 cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-white pointer-coarse:min-h-touch pointer-coarse:min-w-touch"

/** The overline on an ink bar, above its heading. */
export const INK_BAR_OVERLINE = "m-0 text-micro uppercase opacity-muted"

/** The dimmed page behind a modal surface. */
export const SCRIM = "fixed inset-0 z-40 bg-ink/40"

/** A dialog's own box, centred. Height is left to the content, up to most of
 *  the screen. */
export const DIALOG_SURFACE =
	`fixed left-1/2 top-1/2 z-50 flex max-h-[86vh] w-[92vw] -translate-x-1/2 -translate-y-1/2 flex-col ${BOX} shadow-hard`

/** A control's press: the face lands where its shadow was. */
export const PRESS = "active:translate-x-tight active:translate-y-tight active:shadow-none"
