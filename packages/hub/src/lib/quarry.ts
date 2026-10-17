// deno-lint-ignore-file require-await -- Every function below is a SolidStart
// server function. `async` is part of that contract: the "use server" transform
// turns each into an RPC endpoint that must return a promise, and the signature is
// the seam a real backend will slot into. They have nothing to await only because
// they currently answer from fixtures, which is exactly the state this file
// documents — dropping `async` to satisfy the rule would break the contract.

import { query } from "@solidjs/router"
import { BOARDS, CHECKS, FILES, FILTERS } from "../fixtures/boards"
import { ARTIFACTS, BEFORE_PUBLISH, BUILD_STEPS, DETECTED, SOURCE_FILES } from "../fixtures/publish"

/** quarry's data layer.
 *
 * Every function here is a server function that answers from src/fixtures. The
 * backend is an open decision — auth, git hosting, LFS and search are all
 * unsettled — so the seam is kept at the query boundary: when there is a real
 * backend, these bodies change and no route does.
 *
 * Boards are git repositories, not uploaded archives. `slug` plus `namespace`
 * identifies one, which is why routes are /:namespace/:slug.
 */

export type Board = {
	slug: string
	namespace: string
	licence: string
	layers: number
	/** Outline in millimetres, as the mesh reports it. */
	size: [number, number]
	/** False when the board overhangs the Z1's plate and has to be fabbed out. */
	fitsPlate: boolean
	updated: string
	description: string
	topics: string[]
	forks: number
	stars: number
	prints: number
	downloads: number
	/** Millilitres of conductive ink per board. */
	ink: number
	/** Cost to have it fabbed, in the viewer's currency. */
	fab: number
	/** Bill-of-materials cost. */
	bom: number
}

export type Check = {
	severity: "ok" | "warning" | "error"
	label: string
	detail: string
}

export type BoardFile = {
	name: string
	kind: string
	size: string
	/** Produced by the build step rather than committed by the author. */
	generated: boolean
}

export type FilterOption = { label: string; count?: number; on?: boolean }
export type FilterGroup = { legend: string; options: FilterOption[] }

export const listBoards = query(async () => {
	"use server"
	return BOARDS
}, "quarry:boards")

export const getBoard = query(async (namespace: string, slug: string) => {
	"use server"
	return BOARDS.find((board) => board.namespace === namespace && board.slug === slug) ?? null
}, "quarry:board")

export const getBoardChecks = query(async (_namespace: string, _slug: string) => {
	"use server"
	return CHECKS
}, "quarry:checks")

export const getBoardFiles = query(async (_namespace: string, _slug: string) => {
	"use server"
	return FILES
}, "quarry:files")

/** Search facets. Real search is an open decision, so the counts are fixtures and
 *  a query never reaches this. */
export const listFilters = query(async () => {
	"use server"
	return FILTERS
}, "quarry:filters")

/** Everything the publish flow displays about a build it has already run.
 *
 * One query rather than five: it is all one build's output, and splitting it
 * would invite a route to render a listing against a different commit's log.
 */
export const getPublishDraft = query(async () => {
	"use server"
	return {
		ref: "tags/v1.2",
		commit: "a3f19c2",
		ranAgo: "18 s ago",
		detected: DETECTED,
		steps: BUILD_STEPS,
		artifacts: ARTIFACTS,
		sources: SOURCE_FILES,
		summary: BEFORE_PUBLISH,
	}
}, "quarry:publish")

/** The signed-in user. No auth yet, so this is fixed. */
export const getViewer = query(async () => {
	"use server"
	return {
		handle: "avthenticstemcel",
		machine: "Alumina Z1",
		boards: 2,
		forks: 12,
		starred: 41,
		uploadsUsed: 4,
		uploadsAllowed: 6,
	}
}, "quarry:viewer")

/** Hands a board to the local slicer. The protocol is registered by foundry, the desktop slicer. */
export function openInSlicer(board: Board): string {
	return `pcb+open://${board.namespace}/${board.slug}`
}
