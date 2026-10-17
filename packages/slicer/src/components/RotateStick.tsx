import { createSignal, onCleanup } from "solid-js"
import CenterSquare from "@carbon/icons/es/center--square/16"
import { Icon, Tooltip } from "@alumina/design"

export type RotateStickProps = {
	/** Fired continuously while dragging, in radians. */
	onRotate: (spin: number, tilt: number) => void
	/** Fired on a tap — no drag — to pin the current rest position. */
	onPin: () => void
}

/** Hold to rotate the board, release to spring back, tap to pin.
 *
 *  Pointer events throughout, so it behaves the same under a finger as under a
 *  mouse, and `setPointerCapture` keeps the drag alive when the pointer leaves
 *  the pad. The knob follows the pointer within the pad and the board turns with
 *  it; letting go returns both.
 */
export function RotateStick(props: RotateStickProps) {
	const [offset, setOffset] = createSignal<[number, number]>([0, 0])
	const [reach, setReach] = createSignal<[number, number]>([0, 0])
	const [live, setLive] = createSignal(false)
	let pad: HTMLDivElement | undefined

	/** Rotation at full deflection: a half-turn either way in azimuth, a quarter of
	 *  that in elevation, which is about where the clamp catches anyway. */
	const RANGE = Math.PI
	/** Knob size and the pad's border, in px — how far short of the edge to stop. */
	const KNOB = 24
	const BORDER = 2

	const move = (event: PointerEvent) => {
		if (!pad) return
		const box = pad.getBoundingClientRect()
		// How far the knob's centre may travel before it touches the pad's inside.
		const reachX = Math.max(1, box.width / 2 - KNOB / 2 - BORDER)
		const reachY = Math.max(1, box.height / 2 - KNOB / 2 - BORDER)
		// −1..1 of that reach, clamped so the knob stays inside the pad.
		const x = Math.max(-1, Math.min(1, (event.clientX - box.left - box.width / 2) / reachX))
		const y = Math.max(-1, Math.min(1, (event.clientY - box.top - box.height / 2) / reachY))
		setOffset([x, y])
		setReach([reachX, reachY])
		props.onRotate(x * RANGE, -y * RANGE / 4)
	}

	/** Spring back over the prototype's 420ms rather than jumping to rest. The knob
	 *  has a CSS transition, but the board is driven by numbers — so those have to
	 *  be walked home a frame at a time or the model snaps while the knob glides. */
	const SPRING_MS = 420
	let spring = 0

	const release = () => {
		if (!live()) return
		setLive(false)

		const [fromX, fromY] = offset()
		if (fromX === 0 && fromY === 0) return
		const start = performance.now()

		const step = (now: number) => {
			const t = Math.min(1, (now - start) / SPRING_MS)
			// Same ease-out the rest of the system uses, so the knob's CSS transition
			// and the board's rotation arrive together.
			const eased = 1 - Math.pow(1 - t, 3)
			const x = fromX * (1 - eased)
			const y = fromY * (1 - eased)
			setOffset([x, y])
			props.onRotate(x * RANGE, -y * RANGE / 4)
			if (t < 1) spring = requestAnimationFrame(step)
		}
		spring = requestAnimationFrame(step)
	}

	onCleanup(() => cancelAnimationFrame(spring))

	return (
		// The pad was the one control on this bar with no tooltip. The prototype
		// labels it too ("Hold to rotate · tap to pin").
		<Tooltip
			label="Hold to rotate · tap to reset"
			align="top"
			// A stated square, the same one the utility group at the other end of
			// the bar is — see Viewport for why neither squares itself off the row.
			class="m-snug size-28"
		>
			<div
				ref={pad}
				onPointerDown={(event) => {
					event.preventDefault()
					event.currentTarget.setPointerCapture(event.pointerId)
					cancelAnimationFrame(spring)
					setLive(true)
					move(event)
				}}
				onPointerMove={(event) => live() && move(event)}
				onPointerUp={(event) => {
					// A press that never moved is a tap: pin the rest position instead.
					if (offset()[0] === 0 && offset()[1] === 0) props.onPin()
					event.currentTarget.releasePointerCapture(event.pointerId)
					release()
				}}
				onPointerCancel={release}
				role="slider"
				tabindex={0}
				aria-label="Hold to rotate, tap to reset"
				aria-valuenow={Math.round(offset()[0] * 100)}
				aria-valuemin={-100}
				aria-valuemax={100}
				class={`crosshair relative size-full touch-none border-2 border-ink
				focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink
				${live() ? "cursor-grabbing" : "cursor-grab"}`}
			>
				{
					/* Only the drag's *position* goes inline, as two custom properties; the
				    styling that consumes it stays in classes. Centring is a class too, so
				    it composes into the same `translate` property rather than being
				    replaced wholesale by an inline transform — which is what knocked the
				    knob off centre before. */
				}
				<span
					aria-hidden="true"
					class="absolute left-1/2 top-1/2 grid size-6 place-items-center bg-ink text-white
						translate-x-[calc(-50%+var(--knob-x))] translate-y-[calc(-50%+var(--knob-y))]"
					style={{
						"--knob-x": `${offset()[0] * reach()[0]}px`,
						"--knob-y": `${offset()[1] * reach()[1]}px`,
					}}
				>
					<Icon glyph={CenterSquare} size={16} />
				</span>
			</div>
		</Tooltip>
	)
}
