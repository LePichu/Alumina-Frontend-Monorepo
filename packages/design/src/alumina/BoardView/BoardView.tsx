import { createEffect, onCleanup, Show } from "solid-js"
import {
	Box3,
	BufferGeometry,
	Color,
	EdgesGeometry,
	Group,
	LineBasicMaterial,
	LineSegments,
	Mesh,
	MeshBasicMaterial,
	OrthographicCamera,
	Plane,
	Scene,
	Vector3,
	WebGLRenderer,
} from "three"
import { Icon } from "../../icons/Icon"
import { STATUS_GLYPH } from "../../internal/severity"
import { Loading } from "../../carbon/Loading/Loading"

/** Where the camera sits. Angles are taken about +Z, since every board Alumina
 *  handles is a Z-up solid: wide in X and Y, thin in Z. */
export type BoardViewAngle = "iso" | "top" | "front"

export type BoardViewProps = {
	/** The board solid. The caller owns loading and parsing; this draws it. */
	geometry?: BufferGeometry
	/** The ink outline, when the caller already has one. quarry's meshes ship an
	 *  edge index alongside the triangles; deriving edges from the dequantised
	 *  faces instead throws most of them away. Omit it and edges are derived. */
	edges?: BufferGeometry
	/** The ink, where the caller has it: solids drawn in ink, in the same frame
	 *  and under the same clip as the board — foundry's slabs, with the
	 *  conductors mica lays in their channels. */
	ink?: BufferGeometry
	angle?: BoardViewAngle
	/** 0–1 up the board's thickness. Everything above is clipped away, which is
	 *  what makes a layer reveal and a print sweep the same mechanism. 1 shows the
	 *  whole board. */
	reveal?: number
	/** Draws onto whatever is behind instead of onto white. The backdrop is part
	 *  of the page in mica and part of the tile in quarry. */
	transparent?: boolean
	/** Radians about +Z, added to `angle`'s azimuth. Lets a caller drive rotation
	 *  from a control of its own without this component owning input. */
	spin?: number
	/** Radians added to `angle`'s elevation, clamped either side of straight down
	 *  and straight up so the camera can never invert. */
	tilt?: number
	/** Changing this refits the frame. The value is meaningless; only a change
	 *  matters — so a caller can offer a "refit" button without holding state. */
	fitToken?: number
	/** Sizes the view. Give it a height and width — the root is already
	 *  `relative`, so a position utility passed here loses to it and the canvas
	 *  collapses to nothing. */
	class?: string
	/** What is loading, while the caller has not supplied geometry yet: the
	 *  loader's name for assistive tech. */
	fallback?: string
	/** The board could not be had: said in place of the loader, which would
	 *  otherwise turn for ever. */
	error?: string
}

const ELEVATION = Math.atan(1 / Math.SQRT2)
const ANGLES: Record<BoardViewAngle, [number, number]> = {
	// True isometric, as the prototypes frame every board.
	iso: [-Math.PI / 4, ELEVATION],
	top: [0, Math.PI / 2 - 1e-3],
	front: [0, 0.02],
}

/** The system's ink as three.js takes a colour: `--color-ink`, read from the
 *  page rather than restated here, so a board follows the system's ink. */
const inkOf = (element: Element) =>
	new Color(getComputedStyle(element).getPropertyValue("--color-ink").trim() || "#000")

/** The board as a scene: white faces and ink edges, re-centred on the origin,
 *  with a clipping plane for the reveal. Shared by the live view and the
 *  snapshot, so a picture of a board is the same drawing as the board. */
function buildBoard(
	geometry: BufferGeometry,
	supplied: BufferGeometry | undefined,
	ink: Color,
	solids?: BufferGeometry,
) {
	geometry.computeBoundingBox()
	const bounds = geometry.boundingBox ?? new Box3()
	const size = bounds.getSize(new Vector3())
	const centre = bounds.getCenter(new Vector3())

	// The reveal plane cuts down from above, along the board's thickness.
	const plane = new Plane(new Vector3(0, 0, -1), 0)

	const scene = new Scene()
	const board = new Group()
	// Re-centre on the origin so framing is independent of where the mesh
	// happens to sit in its own coordinates.
	board.position.set(-centre.x, -centre.y, -centre.z)

	const faces = new Mesh(
		geometry,
		// polygonOffset pushes the faces back a touch so the ink edges draw
		// cleanly on top instead of z-fighting the surface they sit on.
		new MeshBasicMaterial({
			color: 0xffffff,
			clippingPlanes: [plane],
			polygonOffset: true,
			polygonOffsetFactor: 1,
			polygonOffsetUnits: 1,
		}),
	)
	const edgeGeometry = supplied ?? new EdgesGeometry(geometry, 24)
	const edges = new LineSegments(
		edgeGeometry,
		new LineBasicMaterial({ color: ink, clippingPlanes: [plane] }),
	)
	board.add(faces, edges)
	// Drawn after the board's faces and pushed back as they are, so where an ink
	// solid fills a channel its top face shows, not the channel's floor.
	const filled = solids
		? new Mesh(
			solids,
			new MeshBasicMaterial({
				color: ink,
				clippingPlanes: [plane],
				polygonOffset: true,
				polygonOffsetFactor: 1,
				polygonOffsetUnits: 1,
			}),
		)
		: undefined
	if (filled) board.add(filled)
	scene.add(board)

	// The eight corners, re-measured in camera space at each fit. An
	// orthographic fit has to measure the silhouette, not the world-space
	// diagonal — that over-pads at some angles and clips at others.
	const corners = [0, 1, 2, 3, 4, 5, 6, 7].map((i) =>
		new Vector3(
			(i & 1 ? bounds.max.x : bounds.min.x) - centre.x,
			(i & 2 ? bounds.max.y : bounds.min.y) - centre.y,
			(i & 4 ? bounds.max.z : bounds.min.z) - centre.z,
		)
	)

	const radius = (Math.max(size.x, size.y, size.z) || 1) * 4
	const camera = new OrthographicCamera()
	// Fit near/far to the scene's own extent. Left at the defaults the board
	// either clips through the near plane or vanishes past the far one.
	camera.near = 0
	camera.far = radius * 4

	const dispose = () => {
		// Only dispose what was built here. A supplied edge geometry belongs to the
		// caller and may outlive the view.
		if (!supplied) edgeGeometry.dispose()
		faces.material.dispose()
		edges.material.dispose()
		filled?.material.dispose()
	}

	return { scene, camera, corners, plane, size, radius, dispose }
}

/** Puts the camera where `angle`, `spin` and `tilt` say. */
function aim(
	camera: OrthographicCamera,
	radius: number,
	angle: BoardViewAngle,
	spin = 0,
	tilt = 0,
) {
	const [baseAz, baseEl] = ANGLES[angle]
	const az = baseAz + spin
	// 1.35 rad either side, the prototype's clamp: past it the board turns
	// inside out as up crosses the view axis.
	const el = Math.max(-1.35, Math.min(1.35, baseEl + tilt))
	camera.position.set(
		Math.cos(el) * Math.cos(az) * radius,
		Math.cos(el) * Math.sin(az) * radius,
		Math.sin(el) * radius,
	)
	// Looking straight down +Z, up cannot also be +Z: a view vector parallel
	// to up leaves lookAt no way to orient and the board disappears.
	const flat = angle === "top"
	camera.up.set(0, flat ? 1 : 0, flat ? 0 : 1)
	camera.lookAt(0, 0, 0)
	camera.updateMatrixWorld(true)
}

/** Sizes the camera's frame to the board's silhouette at this aspect. */
function fit(camera: OrthographicCamera, corners: Vector3[], width: number, height: number) {
	let halfW = 0
	let halfH = 0
	const point = new Vector3()
	for (const corner of corners) {
		point.copy(corner).applyMatrix4(camera.matrixWorldInverse)
		halfW = Math.max(halfW, Math.abs(point.x))
		halfH = Math.max(halfH, Math.abs(point.y))
	}
	const aspect = width / height
	// 1.12 is the prototypes' padding: enough air that the board never touches
	// the edge as it turns.
	const extent = Math.max(halfW / aspect, halfH) * 1.12
	camera.left = -extent * aspect
	camera.right = extent * aspect
	camera.top = extent
	camera.bottom = -extent
	camera.updateProjectionMatrix()
}

export type BoardSnapshotOptions = {
	/** In CSS pixels; drawn at up to twice that for a sharp picture. */
	width: number
	height: number
	angle?: BoardViewAngle
	edges?: BufferGeometry
	ink?: BufferGeometry
}

/** A still of a board, as an image's address: the same drawing `BoardView`
 *  makes, white faces and ink edges on a transparent ground, rendered once and
 *  let go. For a picture where a live view would be one WebGL context too many —
 *  a grid of recent boards, a tab's card.
 */
export function snapshotBoard(geometry: BufferGeometry, options: BoardSnapshotOptions): string {
	const built = buildBoard(geometry, options.edges, inkOf(document.documentElement), options.ink)
	const renderer = new WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true })
	try {
		renderer.setClearColor(0xffffff, 0)
		renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
		renderer.setSize(options.width, options.height, false)
		aim(built.camera, built.radius, options.angle ?? "iso")
		fit(built.camera, built.corners, options.width, options.height)
		built.plane.constant = built.size.z
		renderer.localClippingEnabled = true
		renderer.render(built.scene, built.camera)
		return renderer.domElement.toDataURL("image/png")
	} finally {
		built.dispose()
		renderer.dispose()
		renderer.forceContextLoss()
	}
}

/** A printed board, drawn the way Alumina draws boards: flat white faces with ink
 *  edges under an orthographic camera. No lighting model and no shading — the
 *  monochrome rule applies to 3D as much as to the rest of the system, so form
 *  reads from outline rather than from tone.
 *
 *  It lives in `design` because both apps need it: mica reveals layer by layer
 *  while slicing, quarry sweeps the same clip upward to look like printing. The
 *  only difference is what drives `reveal`, so the renderer takes it as a prop
 *  and neither app owns a copy.
 *
 *  It draws and stops. There is no animation loop here — a caller that wants one
 *  animates `reveal`, which keeps "how fast does it print" out of the renderer.
 */
export function BoardView(props: BoardViewProps) {
	let host: HTMLDivElement | undefined

	createEffect(() => {
		const geometry = props.geometry
		const element = host
		if (!geometry || !element) return

		const built = buildBoard(geometry, props.edges, inkOf(element), props.ink)
		const { scene, camera, corners, plane, size, radius } = built

		const renderer = new WebGLRenderer({ antialias: true, alpha: true })
		renderer.setClearAlpha(props.transparent ? 0 : 1)
		renderer.setClearColor(0xffffff, props.transparent ? 0 : 1)
		renderer.localClippingEnabled = true

		const place = () => aim(camera, radius, props.angle ?? "iso", props.spin, props.tilt)

		const frame = () => {
			const width = element.clientWidth
			const height = element.clientHeight
			if (width === 0 || height === 0) return

			renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
			renderer.setSize(width, height, false)
			fit(camera, corners, width, height)
			renderer.render(scene, camera)
		}

		element.append(renderer.domElement)
		// setSize runs with updateStyle=false so the drawing buffer can follow
		// devicePixelRatio independently, which leaves the canvas' CSS size to us.
		// Without this it keeps the default 300×150 and the board renders into a
		// stamp in the corner.
		renderer.domElement.style.cssText =
			"position:absolute;inset:0;width:100%;height:100%;display:block"

		const observer = new ResizeObserver(frame)
		observer.observe(element)

		// Re-place and redraw on any change to how the board is being looked at.
		createEffect(() => {
			props.fitToken
			props.spin
			props.tilt
			props.angle
			place()
			frame()
		})

		// …and separately on the reveal, which moves far more often.
		createEffect(() => {
			const fraction = Math.min(Math.max(props.reveal ?? 1, 0), 1)
			// The board is centred on the origin, so it spans ±size.z/2. The plane's
			// normal is -Z, and three keeps fragments where `normal·p + constant >= 0`
			// — which for this normal is `z <= constant`. The constant is therefore
			// the cut height itself, not its negation.
			const bottom = -size.z / 2
			// A hair past the top at full reveal, never exactly on it: a plane
			// coplanar with the top face makes every fragment there a coin flip,
			// which is the speckling the prototype records.
			plane.constant = bottom + size.z * (fraction >= 1 ? 1.02 : fraction)
			frame()
		})

		onCleanup(() => {
			observer.disconnect()
			renderer.domElement.remove()
			renderer.dispose()
			built.dispose()
		})
	})

	return (
		<div class={`relative ${props.class ?? ""}`}>
			<div ref={host} class="absolute inset-0" />
			<Show when={!props.geometry}>
				<div class="absolute inset-0 flex items-center justify-center">
					<Show
						when={props.error}
						fallback={<Loading description={props.fallback ?? "Loading board"} />}
					>
						{(message) => (
							<p class="m-0 flex items-center gap-snug text-small">
								<Icon glyph={STATUS_GLYPH.error} size={16} />
								{message()}
							</p>
						)}
					</Show>
				</div>
			</Show>
		</div>
	)
}
