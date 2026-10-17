/** What a run made, as the parts the stage can show, and their meshes.
 *
 *  Every file mica writes is in the board's own coordinates: the assembly is the
 *  slabs stacked as they are laminated, each slab lies flat as it is printed
 *  (the bottom one already mirrored) with its ink solid in the same frame, and
 *  the fixtures stand round the board where they go. So any one part can be
 *  shown on its own, and a slab with its ink.
 */

import type { BufferGeometry } from "three"
import { runFile } from "./mica"
import type { MicaRun } from "./mica"
import { parseBinaryStl } from "./stl"

export type Part = {
	/** Stable within a run. */
	id: string
	group: "Board" | "Slabs" | "Fixtures"
	label: string
	/** What it is, in a line. */
	detail: string
	/** The file the part is drawn from. */
	file: string
	/** Its ink solid, for a slab — when mica wrote one. */
	ink?: string
}

/** What the board-level fixtures are, as mica's API describes them. */
const FIXTURES: Record<string, string> = {
	"frame.stl": "the collar",
	"jig.stl": "the tray",
	"pins.stl": "the loose pins",
}

const title = (file: string) => {
	const stem = file.replace(/\.stl$/i, "").replace(/[_-]+/g, " ")
	return stem.charAt(0).toUpperCase() + stem.slice(1)
}

/** The parts of a run, the one to show first first. A refused run made none. */
export function partsOf(run: MicaRun): Part[] {
	if (run.outcome === "refused") return []

	const fixtures = new Set(run.fixtures)
	const slabFiles = new Set(run.slabs.flatMap((slab) => slab.files))

	if (run.outcome === "one_piece") {
		return run.files
			.filter((file) => !fixtures.has(file.name) && !slabFiles.has(file.name))
			.map((file) => ({
				id: file.name,
				group: "Board",
				label: "Plate",
				detail: "One plate, channels in both faces",
				file: file.name,
			}))
	}

	const parts: Part[] = []
	if (fixtures.has("assembly.stl")) {
		parts.push({
			id: "assembly",
			group: "Board",
			label: "Assembly",
			detail: `${run.slabs.length} slabs, as laminated`,
			file: "assembly.stl",
		})
	}
	for (const slab of run.slabs) {
		const ink = slab.files.find((file) => /_ink\.stl$/i.test(file))
		const body = slab.files.find((file) => file !== ink)
		if (!body) continue
		parts.push({
			id: `slab-${slab.index}`,
			group: "Slabs",
			label: `${slab.index} · ${slab.layer}`,
			detail: [
				slab.flipped ? "mirrored" : "as is",
				`${slab.ink_mm3.toFixed(1)} mm³ ink`,
				`${slab.vias} ${slab.vias === 1 ? "via" : "vias"}`,
			].join(" · "),
			file: body,
			ink,
		})
	}
	for (const file of run.fixtures) {
		if (file === "assembly.stl") continue
		parts.push({
			id: file,
			group: "Fixtures",
			label: title(file),
			detail: FIXTURES[file] ?? file,
			file,
		})
	}
	return parts
}

/** A run, as foundry tells it from every other: mica's run id together with
 *  its board's. The run id alone is not enough — mica derives it from the
 *  options only, so every board run at the same options has the same one, and
 *  keyed by it alone every board drew the first board's meshes. */
export const runKey = (run: MicaRun) => `${run.board}/${run.run}`

/** Meshes already fetched and parsed, by run and file. A run's files never
 *  change — the same run is the same bytes — so one is fetched once. */
const meshes = new Map<string, Promise<BufferGeometry>>()

export function meshOf(run: MicaRun, file: string): Promise<BufferGeometry> {
	const key = `${runKey(run)}/${file}`
	let mesh = meshes.get(key)
	if (!mesh) {
		mesh = runFile(run, file).then(parseBinaryStl)
		// A failure is not kept: the next ask tries again.
		mesh.catch(() => meshes.delete(key))
		meshes.set(key, mesh)
	}
	return mesh
}

/** A part's meshes: its body, and its ink if it has one. */
export async function partMeshes(
	run: MicaRun,
	part: Part,
): Promise<{ body: BufferGeometry; ink?: BufferGeometry }> {
	const [body, ink] = await Promise.all([
		meshOf(run, part.file),
		part.ink ? meshOf(run, part.ink) : Promise.resolve(undefined),
	])
	return { body, ink }
}
