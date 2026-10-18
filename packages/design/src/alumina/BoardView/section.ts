import { BufferGeometry, Float32BufferAttribute, ShapeUtils, Vector2, Vector3 } from "three"

/** Where a level plane cuts a solid: the outline of what lies under it, as
 *  closed loops in the plane, outer ones counter-clockwise seen from above and
 *  holes clockwise.
 *
 *  This is what turns the reveal from a clipped shell into a printed part: the
 *  plane alone takes away everything above it and leaves the solid open, so a
 *  board cut halfway showed its channel walls standing round nothing. Drawn
 *  with the outline filled, the cut is the layer that was printed last.
 *
 *  `z` must not be a height any face lies at — a face in the plane has no
 *  crossing, and a vertex on it has two — so the caller samples a hair under
 *  the cut, as a slicer samples a layer between its faces. */
export function sectionLoops(geometry: BufferGeometry, z: number): Vector2[][] {
	const position = geometry.getAttribute("position")
	const index = geometry.getIndex()
	const count = index ? index.count : position.count
	const corner = (i: number, into: Vector3) => {
		const at = index ? index.getX(i) : i
		return into.set(position.getX(at), position.getY(at), position.getZ(at))
	}

	// Each crossing face gives one segment, pointed so the solid is on its left.
	const starts = new Map<string, number[]>()
	const segments: {
		from: Vector2
		to: Vector2
		fromKey: string
		toKey: string
	}[] = []
	const a = new Vector3()
	const b = new Vector3()
	const c = new Vector3()
	const ab = new Vector3()
	const ac = new Vector3()
	const crossings: Vector2[] = []
	// Two faces share an edge and must agree on where it crosses, to the bit:
	// the edge is taken from its lower-sorting end whichever face it came from.
	const crossing = (p: Vector3, q: Vector3) => {
		const [lo, hi] = p.x < q.x || (p.x === q.x && (p.y < q.y || (p.y === q.y && p.z < q.z)))
			? [p, q]
			: [q, p]
		const t = (z - lo.z) / (hi.z - lo.z)
		crossings.push(
			new Vector2(lo.x + (hi.x - lo.x) * t, lo.y + (hi.y - lo.y) * t),
		)
	}
	const key = (point: Vector2) => `${Math.round(point.x * 1e5)},${Math.round(point.y * 1e5)}`

	for (let i = 0; i + 2 < count; i += 3) {
		corner(i, a)
		corner(i + 1, b)
		corner(i + 2, c)
		const above = [a.z > z, b.z > z, c.z > z]
		if (above[0] === above[1] && above[1] === above[2]) continue
		crossings.length = 0
		if (above[0] !== above[1]) crossing(a, b)
		if (above[1] !== above[2]) crossing(b, c)
		if (above[2] !== above[0]) crossing(c, a)
		if (crossings.length !== 2) continue
		let [from, to] = crossings as [Vector2, Vector2]
		// The face's outward normal, from its winding. The solid is on the side
		// away from it, and the segment's left is (-dy, dx).
		const normal = ab.subVectors(b, a).cross(ac.subVectors(c, a))
		const dx = to.x - from.x
		const dy = to.y - from.y
		if (-dy * normal.x + dx * normal.y > 0) [from, to] = [to, from]
		const fromKey = key(from)
		const toKey = key(to)
		if (fromKey === toKey) continue
		const list = starts.get(fromKey)
		if (list) list.push(segments.length)
		else starts.set(fromKey, [segments.length])
		segments.push({ from, to, fromKey, toKey })
	}

	// Walk segment to segment, end to start, until each loop closes. A chain that
	// runs out — a mesh with a gap — is dropped rather than filled wrongly.
	const used = new Uint8Array(segments.length)
	const loops: Vector2[][] = []
	for (let first = 0; first < segments.length; first += 1) {
		if (used[first]) continue
		const loop: Vector2[] = []
		let at: number | undefined = first
		let closed = false
		while (at !== undefined) {
			used[at] = 1
			const segment: (typeof segments)[number] | undefined = segments[at]
			if (!segment) break
			loop.push(segment.from)
			if (segment.toKey === segments[first]?.fromKey) {
				closed = true
				break
			}
			at = starts.get(segment.toKey)?.find((candidate) => !used[candidate])
		}
		if (closed && loop.length >= 3) loops.push(loop)
	}
	return loops
}

/** The cut filled, as triangles at `level`: each outer loop with the holes it
 *  holds. Empty when the plane misses the solid. */
export function sectionFill(loops: Vector2[][], level: number): BufferGeometry {
	const outers = loops.filter((loop) => ShapeUtils.area(loop) > 0)
	const holes = loops.filter((loop) => ShapeUtils.area(loop) < 0)
	// A hole belongs to the smallest outer loop round it.
	const held = new Map<Vector2[], Vector2[][]>(
		outers.map((outer) => [outer, []]),
	)
	for (const hole of holes) {
		const probe = hole[0]
		if (!probe) continue
		let owner: Vector2[] | undefined
		for (const outer of outers) {
			if (!inside(probe, outer)) continue
			if (
				!owner ||
				Math.abs(ShapeUtils.area(outer)) < Math.abs(ShapeUtils.area(owner))
			) {
				owner = outer
			}
		}
		if (owner) held.get(owner)?.push(hole)
	}

	const positions: number[] = []
	for (const [outer, inner] of held) {
		const points = [outer, ...inner].flat()
		for (const face of ShapeUtils.triangulateShape(outer, inner)) {
			for (const corner of face) {
				const point = points[corner]
				if (point) positions.push(point.x, point.y, level)
			}
		}
	}
	const geometry = new BufferGeometry()
	geometry.setAttribute("position", new Float32BufferAttribute(positions, 3))
	return geometry
}

/** The cut's outline, as line segments at `level`. */
export function sectionOutline(
	loops: Vector2[][],
	level: number,
): BufferGeometry {
	const positions: number[] = []
	for (const loop of loops) {
		loop.forEach((point, i) => {
			const next = loop[(i + 1) % loop.length] ?? point
			positions.push(point.x, point.y, level, next.x, next.y, level)
		})
	}
	const geometry = new BufferGeometry()
	geometry.setAttribute("position", new Float32BufferAttribute(positions, 3))
	return geometry
}

/** Whether a point lies inside a loop, by the crossings of a ray along +x. */
function inside(point: Vector2, loop: Vector2[]) {
	let within = false
	for (let i = 0, j = loop.length - 1; i < loop.length; j = i, i += 1) {
		const p = loop[i]
		const q = loop[j]
		if (!p || !q) continue
		if (
			p.y > point.y !== q.y > point.y &&
			point.x < ((q.x - p.x) * (point.y - p.y)) / (q.y - p.y) + p.x
		) {
			within = !within
		}
	}
	return within
}
