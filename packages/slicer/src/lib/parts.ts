/** What a run made, as the parts the stage can show, and their meshes.
 *
 *  Every file mica writes is in the board's own coordinates: each slab lies flat
 *  as it is printed (the bottom one already mirrored) with its ink solid in the
 *  same frame, and the fixtures stand round the board where they go. So any one
 *  part can be shown on its own, and a slab with its ink.
 *
 *  The assembly is drawn from the slabs, not from mica's `assembly.stl`. That
 *  file is the same stack as one solid with no ink, so the stage showed the
 *  board's layers as one block, cut by the reveal, with nothing in its channels.
 *  Built here, each slab is put where mica's own assembly puts it, and carries
 *  its ink there.
 */

import { BufferAttribute, BufferGeometry, Matrix4 } from "three"
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
	/** For the assembly: the slabs it is made of, bottom first, each drawn where
	 *  it is laminated. */
	stack?: Slab[]
}

/** A slab as the stage stacks it, by the copper layer it carries. */
type Slab = { file: string; ink?: string; flipped: boolean; layer: string }

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

	const slabs = run.slabs.flatMap((slab) => {
		const ink = slab.files.find((file) => /_ink\.stl$/i.test(file))
		const body = slab.files.find((file) => file !== ink)
		return body ? [{ slab, body, ink }] : []
	})

	const parts: Part[] = []
	if (fixtures.has("assembly.stl")) {
		parts.push({
			id: "assembly",
			group: "Board",
			label: "Assembly",
			detail: `${run.slabs.length} slabs, as laminated`,
			file: "assembly.stl",
			stack: slabs.length === run.slabs.length
				? [...slabs]
					.sort((a, b) => a.slab.index - b.slab.index)
					.map(({ slab, body, ink }) => ({
						file: body,
						ink,
						flipped: slab.flipped,
						layer: slab.layer,
					}))
				: undefined,
		})
	}
	for (const { slab, body, ink } of slabs) {
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

/** One of the board's own layers in a stack: the copper layer a slab carries,
 *  and the height of the stack's top once that slab is on. */
export type Stop = { label: string; top: number }

type Meshes = {
	body: BufferGeometry
	ink?: BufferGeometry
	/** For the assembly: where each slab's top is, bottom first — what the
	 *  slider steps through on a board, rather than print layers. */
	stops?: Stop[]
}

/** A part's meshes: its body, and its ink if it has one. */
export function partMeshes(run: MicaRun, part: Part): Promise<Meshes> {
	if (part.stack) return stackOf(run, part.stack)
	return Promise.all([
		meshOf(run, part.file),
		part.ink ? meshOf(run, part.ink) : Promise.resolve(undefined),
	]).then(([body, ink]) => ({ body, ink }))
}

/** Stacks already built, by run. */
const stacks = new Map<string, Promise<Meshes>>()

/** The slabs stacked as they are laminated, with their ink: one solid of the
 *  bodies and one of the ink.
 *
 *  Placed as mica places them in `assembly.stl` (`pipeline.rs`): each slab
 *  stands on the ones before it, and the flipped one — printed mirrored about
 *  the board's centre line, so that it can be turned over after curing — is
 *  mirrored back and turned over. Mirroring in x and turning over in z is a
 *  half turn about y, so no face changes its winding. */
function stackOf(run: MicaRun, stack: Slab[]): Promise<Meshes> {
	const key = runKey(run)
	let built = stacks.get(key)
	if (!built) {
		built = Promise.all(
			stack.map(async (slab) => ({
				slab,
				body: await meshOf(run, slab.file),
				ink: slab.ink ? await meshOf(run, slab.ink) : undefined,
			})),
		).then((slabs) => {
			const bodies: BufferGeometry[] = []
			const inks: BufferGeometry[] = []
			const stops: Stop[] = []
			let floor = 0
			for (const { slab, body, ink } of slabs) {
				body.computeBoundingBox()
				const box = body.boundingBox
				if (!box) continue
				// mica mirrors about the middle of the board's outline, which is the
				// middle of the slab too: mirroring about it keeps the slab's extent.
				const axis = (box.min.x + box.max.x) / 2
				const place = slab.flipped
					? new Matrix4().set(
						-1,
						0,
						0,
						2 * axis,
						0,
						1,
						0,
						0,
						0,
						0,
						-1,
						floor + box.max.z,
						0,
						0,
						0,
						1,
					)
					: new Matrix4().makeTranslation(0, 0, floor - box.min.z)
				bodies.push(body.clone().applyMatrix4(place))
				if (ink) inks.push(ink.clone().applyMatrix4(place))
				floor += box.max.z - box.min.z
				stops.push({ label: slab.layer, top: floor })
			}
			return {
				body: joined(bodies),
				ink: inks.length ? joined(inks) : undefined,
				stops,
			}
		})
		built.catch(() => stacks.delete(key))
		stacks.set(key, built)
	}
	return built
}

/** Triangle soups as one: every mesh mica writes is unindexed, with a position
 *  and a normal per corner. */
function joined(geometries: BufferGeometry[]): BufferGeometry {
	const merged = new BufferGeometry()
	for (const name of ["position", "normal"]) {
		const parts = geometries.map((geometry) => geometry.getAttribute(name).array)
		const array = new Float32Array(
			parts.reduce((total, part) => total + part.length, 0),
		)
		let at = 0
		for (const part of parts) {
			array.set(part, at)
			at += part.length
		}
		merged.setAttribute(name, new BufferAttribute(array, 3))
	}
	for (const geometry of geometries) geometry.dispose()
	return merged
}
