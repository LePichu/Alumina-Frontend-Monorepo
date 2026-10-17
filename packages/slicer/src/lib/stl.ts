import { BufferAttribute, BufferGeometry } from "three"

/** Binary STL -> BufferGeometry.
 *
 *  three ships an STLLoader under examples/jsm, but three 0.186 ships no type
 *  declarations at all for those example modules, and the format is 30 lines:
 *  an 80-byte header, a uint32 triangle count, then 50 bytes per triangle
 *  (three floats of normal, nine of vertices, and a uint16 attribute count that
 *  nothing uses). Parsing it here keeps the module fully typed and avoids an
 *  ambient declaration for a file we'd barely use.
 */
export function parseBinaryStl(buffer: ArrayBuffer): BufferGeometry {
	const view = new DataView(buffer)
	const triangles = view.getUint32(80, true)

	const expected = 84 + triangles * 50
	if (buffer.byteLength !== expected) {
		throw new Error(
			`stl: expected ${expected} bytes for ${triangles} triangles, got ${buffer.byteLength}`,
		)
	}

	const positions = new Float32Array(triangles * 9)
	const normals = new Float32Array(triangles * 9)

	let offset = 84
	for (let t = 0; t < triangles; t += 1) {
		const nx = view.getFloat32(offset, true)
		const ny = view.getFloat32(offset + 4, true)
		const nz = view.getFloat32(offset + 8, true)
		offset += 12

		for (let v = 0; v < 3; v += 1) {
			const i = t * 9 + v * 3
			positions[i] = view.getFloat32(offset, true)
			positions[i + 1] = view.getFloat32(offset + 4, true)
			positions[i + 2] = view.getFloat32(offset + 8, true)
			// STL stores one facet normal; every vertex of the facet shares it.
			normals[i] = nx
			normals[i + 1] = ny
			normals[i + 2] = nz
			offset += 12
		}

		offset += 2 // attribute byte count, always zero in practice
	}

	const geometry = new BufferGeometry()
	geometry.setAttribute("position", new BufferAttribute(positions, 3))
	geometry.setAttribute("normal", new BufferAttribute(normals, 3))
	return geometry
}
