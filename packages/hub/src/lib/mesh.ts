import { isServer } from "solid-js/web"
import { BufferAttribute, BufferGeometry } from "three"

/** Board meshes, quantised.
 *
 * Positions are Uint16 normalised over the mesh's own bounding box, so each
 * coordinate is `min + q / 65535 * span` — the divisor is 65535, matching the
 * prototype exactly; getting it wrong scales the board subtly and invisibly.
 * Triangles and edges are Uint16 index buffers.
 *
 * The prototype expands the edge buffer into explicit segment endpoints because
 * it draws edges with three's fat-line helpers (LineSegments2). Those live under
 * examples/jsm and three 0.186 ships no declarations for them; since the
 * prototype's edge weight is 1.05 CSS px, plain LineSegments at 1px is
 * indistinguishable, so the index buffer is used directly and everything stays
 * typed.
 */

export type PackedMesh = {
	min: [number, number, number]
	span: [number, number, number]
	size: [number, number, number]
	nv: number
	nt: number
	ne: number
	pos: string
	tri: string
	edge: string
}

export type BoardMeshes = Record<string, PackedMesh>

function decodeUint16(base64: string): Uint16Array {
	const binary = atob(base64)
	const bytes = new Uint8Array(binary.length)
	for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
	// The packed payload may carry a trailing pad byte; floor to whole uint16s.
	return new Uint16Array(bytes.buffer, 0, bytes.length >> 1)
}

export type DecodedMesh = {
	faces: BufferGeometry
	edges: BufferGeometry
	size: [number, number, number]
}

export function decodeMesh(packed: PackedMesh): DecodedMesh {
	const quantised = decodeUint16(packed.pos)
	const positions = new Float32Array(quantised.length)
	for (let i = 0; i < quantised.length; i += 3) {
		positions[i] = packed.min[0] + (quantised[i] ?? 0) / 65535 * packed.span[0]
		positions[i + 1] = packed.min[1] + (quantised[i + 1] ?? 0) / 65535 * packed.span[1]
		positions[i + 2] = packed.min[2] + (quantised[i + 2] ?? 0) / 65535 * packed.span[2]
	}

	const position = new BufferAttribute(positions, 3)

	const faces = new BufferGeometry()
	faces.setAttribute("position", position)
	faces.setIndex(new BufferAttribute(decodeUint16(packed.tri), 1))
	faces.computeVertexNormals()

	const edges = new BufferGeometry()
	edges.setAttribute("position", position)
	edges.setIndex(new BufferAttribute(decodeUint16(packed.edge), 1))

	return { faces, edges, size: packed.size }
}

/** The mesh fixture is fetched rather than imported, so 197 kB of JSON stays out
 *  of the entry bundle.
 *
 *  Client only. Vite hands back a root-relative URL, which `fetch` cannot resolve
 *  without an origin, so calling this during SSR throws ERR_INVALID_URL. Nothing
 *  is lost by skipping it: the only consumer is a WebGL canvas, which the server
 *  cannot render either. */
let pending: Promise<BoardMeshes> | undefined

export function loadBoardMeshes(): Promise<BoardMeshes | undefined> {
	if (isServer) return Promise.resolve(undefined)
	// Held as one promise for the life of the page. Home draws four boards and
	// search three, each from its own component; without this they each fetch and
	// re-parse the same 197 kB of JSON.
	pending ??= (async () => {
		const url = (await import("../fixtures/meshes/boards.json?url")).default
		const response = await fetch(url)
		if (!response.ok) throw new Error(`quarry: board meshes failed to load (${response.status})`)
		return await (response.json() as Promise<BoardMeshes>)
	})()
	return pending
}
