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
import { sectionFill, sectionLoops, sectionOutline } from "./section"

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
	/** Draws the cut as what it leaves: the part under the plane, filled where
	 *  the plane crosses it — the board in white, the ink in ink — and outlined,
	 *  as the layer that was printed last. Without it the plane only takes away
	 *  what is above, and the solid is left open: a shell with its walls
	 *  standing round nothing. For a reveal that shows printing, layer by layer
	 *  (foundry); it needs closed solids, as mica writes them. */
	section?: boolean
	/** Draws the ink alone. The board is still what the view is framed on and
	 *  what the reveal runs up, so switching to the ink and back does not move
	 *  the board in the frame. */
	inkOnly?: boolean
	/** Draws the whole board, faded to the system's opacity for something not
	 *  yet made, whatever the reveal says: what a print will be before any of it
	 *  is printed. On a transparent view the backdrop shows through it. */
	ghost?: boolean
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
	new Color(
		getComputedStyle(element).getPropertyValue("--color-ink").trim() || "#000",
	)

/** Faces are pushed back so the ink edges draw cleanly on top instead of
 *  z-fighting the surfaces they lie on — and the board's a few depth units
 *  further than the ink's, so where an ink solid fills a channel and shares its
 *  floor and walls the ink is what shows, not a speckle of the two. Only the
 *  units differ: the slope factor grows with how steeply a face is seen, and
 *  on a board seen from the side it pushes a face back by more than a layer. */
const BOARD_FACE = {
	polygonOffset: true,
	polygonOffsetFactor: 1,
	polygonOffsetUnits: 3,
}
const INK_FACE = {
	polygonOffset: true,
	polygonOffsetFactor: 1,
	polygonOffsetUnits: 1,
}

/** The board as a scene: white faces and ink edges, re-centred on the origin,
 *  with a clipping plane for the reveal. Shared by the live view and the
 *  snapshot, so a picture of a board is the same drawing as the board. */
function buildBoard(
	geometry: BufferGeometry,
	supplied: BufferGeometry | undefined,
	ink: Color,
	solids?: BufferGeometry,
	inkOnly = false,
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
		new MeshBasicMaterial({
			color: 0xffffff,
			clippingPlanes: [plane],
			...BOARD_FACE,
		}),
	)
	const edgeGeometry = supplied ?? new EdgesGeometry(geometry, 24)
	const edges = new LineSegments(
		edgeGeometry,
		new LineBasicMaterial({ color: ink, clippingPlanes: [plane] }),
	)
	// With the ink alone the board is not drawn, but it still sets the frame.
	if (!inkOnly) board.add(faces, edges)
	const filled = solids
		? new Mesh(
			solids,
			new MeshBasicMaterial({
				color: ink,
				clippingPlanes: [plane],
				...INK_FACE,
			}),
		)
		: undefined
	if (filled) board.add(filled)

	// The cut, filled and outlined, when the reveal is drawn as a section. Not
	// clipped: the plane runs just under it. The fill is pushed back by depth
	// units alone, so its outline draws on top of it whatever the depth buffer's
	// precision, and never by the slope factor — that grows with how steeply the
	// fill is seen, and pushed it behind the layer under it.
	const cap = new Group()
	board.add(cap)
	const CAP_FACE = {
		polygonOffset: true,
		polygonOffsetFactor: 0,
		polygonOffsetUnits: 2,
	}
	const capFace = new MeshBasicMaterial({ color: 0xffffff, ...CAP_FACE })
	const capInk = new MeshBasicMaterial({ color: ink, ...CAP_FACE })
	const capLine = new LineBasicMaterial({ color: ink })
	const clearCap = () => {
		for (const child of [...cap.children]) {
			if (child instanceof Mesh || child instanceof LineSegments) {
				child.geometry.dispose()
			}
			cap.remove(child)
		}
	}
	/** Fills the cut at `level`, read at `sample` — both in the geometry's own
	 *  heights — or, given nothing, takes it away. */
	const cut = (at?: { level: number; sample: number }) => {
		clearCap()
		if (!at) return
		const fill = (solid: BufferGeometry, material: MeshBasicMaterial) => {
			const loops = sectionLoops(solid, at.sample)
			if (loops.length === 0) return
			cap.add(
				new Mesh(sectionFill(loops, at.level), material),
				new LineSegments(sectionOutline(loops, at.level), capLine),
			)
		}
		if (!inkOnly) fill(geometry, capFace)
		if (solids) fill(solids, capInk)
	}
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
	// either clips through the near plane or vanishes past the far one. The
	// camera always stands `radius` from the board's centre, so the board lies
	// within its diagonal either side of that, at any angle — and kept that
	// tight, the depth buffer resolves the hair between a section's fill and
	// the faces under it. (It ran from 0 to four times the radius, and under a
	// 16-bit depth buffer a channel's floor showed through the fill above it.)
	const reach = size.length() || 1
	camera.near = Math.max(0, radius - reach)
	camera.far = radius + reach

	const dispose = () => {
		// Only dispose what was built here. A supplied edge geometry belongs to the
		// caller and may outlive the view.
		if (!supplied) edgeGeometry.dispose()
		faces.material.dispose()
		edges.material.dispose()
		filled?.material.dispose()
		clearCap()
		capFace.dispose()
		capInk.dispose()
		capLine.dispose()
	}

	return {
		scene,
		camera,
		corners,
		plane,
		size,
		centre,
		bottom: bounds.min.z,
		radius,
		cut,
		dispose,
	}
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

		const built = buildBoard(
			geometry,
			props.edges,
			inkOf(element),
			props.ink,
			props.inkOnly,
		)
		const { scene, camera, corners, plane, size, centre, bottom, radius, cut } = built

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
			const fraction = props.ghost ? 1 : Math.min(Math.max(props.reveal ?? 1, 0), 1)
			// The plane's normal is -Z, and three keeps fragments where
			// `normal·p + constant >= 0` — which for this normal is `z <= constant`.
			// The constant is therefore the cut height itself, not its negation, in
			// the scene's heights: the board is re-centred on the origin.
			const level = bottom + size.z * fraction
			if (props.section && fraction < 1) {
				// A cut at a layer's top is at a height faces lie at — a channel's
				// floor — and anything there would be a coin flip against the plane,
				// and a depth tie with the fill. So the plane runs a hair under the
				// cut and takes those faces with it, the outline is read there (the
				// layer just printed, as a slicer samples between faces), and the
				// fill at the cut covers all of it. Nothing is left within a hair of
				// the fill for the depth buffer to tell apart.
				const hair = Math.max(size.z * 1e-3, 1e-4)
				plane.constant = level - centre.z - hair
				cut({ level, sample: level - hair })
			} else {
				// A hair past the top at full reveal, never exactly on it: a plane
				// coplanar with the top face makes every fragment there a coin flip,
				// which is the speckling the prototype records.
				plane.constant = level - centre.z + (fraction >= 1 ? size.z * 0.02 : 0)
				cut()
			}
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
			{
				/* Faded as a whole, not face by face: translucent faces would show the
			    board's hidden edges through it, and a ghost is the board's outline
			    seen dimly, not an X-ray. */
			}
			<div
				ref={host}
				class={`absolute inset-0 transition-opacity duration-200 ${
					props.ghost ? "opacity-40" : ""
				}`}
			/>
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
