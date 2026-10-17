import type { BufferGeometry } from "three"
import { snapshotBoard } from "@alumina/design"

/** In CSS pixels: the card's 16:10, drawn at twice that for a sharp picture. */
const WIDTH = 320
const HEIGHT = 200

/** A board's picture: its card on Home, and its tab's card.
 *
 *  A still, drawn once by `snapshotBoard` from what mica made of the board —
 *  the assembly, or the one-piece plate — and kept with the board's place on
 *  the recent list, so the list shows it without asking mica again. Not a live
 *  view per card: eight recent boards would be eight WebGL contexts, and a
 *  browser keeps sixteen at most across the whole page. */
export function pictureOf(geometry: BufferGeometry): string {
	return snapshotBoard(geometry, { width: WIDTH, height: HEIGHT })
}
