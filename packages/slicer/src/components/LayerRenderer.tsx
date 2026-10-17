import { createSignal, onCleanup, onMount } from "solid-js"
import type { BufferGeometry } from "three"
import { BoardView } from "@alumina/design"
import type { BoardViewAngle } from "@alumina/design"

export type RendererView = BoardViewAngle

/** Which of a part's solids are drawn: the part with its ink, the part alone,
 *  or the ink alone. */
export type RendererShow = "all" | "shell" | "ink"

/** The view is made a beat after the page, once the tab strip has slid and the
 *  new tab has popped: the strip's slide, its two-frame wait, and the pop. */
const SETTLE_MS = 320

export type LayerRendererProps = {
	/** The part on the stage, as mica wrote it. */
	body?: BufferGeometry
	/** Its ink solid, if it has one. */
	ink?: BufferGeometry
	show?: RendererShow
	/** Print layers revealed, from 0 to `layers`. */
	layer: number
	layers: number
	view?: RendererView
	/** Radians added to the view's azimuth and elevation, from the rotate stick. */
	spin?: number
	tilt?: number
	/** Bump to refit the frame. The value is meaningless; only a change matters. */
	fitToken?: number
	/** What is being waited for, while there is nothing to draw yet. */
	waiting?: string
	/** Why there is nothing to draw, if nothing will come. */
	error?: string
	class?: string
}

/** A part mica made, on the design system's BoardView.
 *
 *  All this owns is *what* is drawn and *how much of it* — the part or its ink,
 *  and the layer slider as a reveal fraction. The drawing lives in `design`,
 *  because quarry sweeps the same clip upward to look like printing and a
 *  second copy would drift.
 */
export function LayerRenderer(props: LayerRendererProps) {
	// The view is made a beat after the page. Making a WebGL context holds the
	// desktop window's frames for about a tenth of a second (WebKitGTK), and made
	// with the page, that hold fell in the middle of the strip's slide and the
	// new tab's pop. The meshes still load at once; only the drawing waits.
	const [settled, setSettled] = createSignal(false)
	onMount(() => {
		const timer = setTimeout(() => setSettled(true), SETTLE_MS)
		onCleanup(() => clearTimeout(timer))
	})

	const show = () => (props.ink ? props.show ?? "all" : "shell")
	// Ink alone is drawn as solids in ink: the conductors' own shape.
	const geometry = () => (show() === "ink" ? props.ink : props.body)
	const ink = () => (show() === "shell" ? undefined : props.ink)

	return (
		<BoardView
			geometry={settled() ? geometry() : undefined}
			ink={settled() ? ink() : undefined}
			angle={props.view ?? "iso"}
			spin={props.spin}
			tilt={props.tilt}
			reveal={props.layers > 0 ? props.layer / props.layers : 1}
			fitToken={props.fitToken}
			transparent
			fallback={props.waiting ?? "Loading the part"}
			error={props.error}
			class={props.class}
		/>
	)
}
