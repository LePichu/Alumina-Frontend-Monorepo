import { createMemo, createSignal, onMount, Show } from "solid-js"
import type { Accessor } from "solid-js"
import type { Cartesian, CartesianOptions } from "./cartesian"
import { areaPath, extent, formatNumber, inferScaleType, num } from "./core"
import type { Datum, Point } from "./core"

/** Carbon's `zoomBar` option. Only `top` exists there too. */
export type ZoomBarOptions = {
	top?: {
		enabled?: boolean
		/** `graph_view` draws the data's silhouette in the bar; `slider_view` is
		 *  the bare track. */
		type?: "graph_view" | "slider_view"
		/** Where the window starts. Left off, it starts at the whole extent. */
		initialZoomDomain?: [unknown, unknown]
	}
}

/** The bar's height in px, and the gap between it and the plot. */
const BAR = 24
const GAP = 12
/** A handle's width in px: wide enough to aim at, and 44 tall on touch. */
const HANDLE = 8
/** The window never closes below this share of the full extent. */
const MIN_SPAN = 0.02

export type Zoom = {
	enabled: Accessor<boolean>
	/** Room the bar needs above the plot, in px. Zero when off. */
	inset: Accessor<number>
	/** The whole extent of the data along x. */
	full: Accessor<[number, number]>
	/** The window on show. */
	domain: Accessor<[number, number]>
	setDomain: (next: [number, number]) => void
	/** The chart's options with the bottom axis pinned to the window. */
	options: Accessor<CartesianOptions | undefined>
	/** Whether a datum falls inside the window. */
	within: (datum: Datum) => boolean
	/** The id of the clip that keeps marks inside the plot. */
	clipId: string
}

/** The state behind a zoom bar: a window on a chart's x axis.
 *
 *  Zooming does not filter the data. It pins the bottom axis to the window and
 *  clips the marks to the plot, so a line still runs off the edge towards a
 *  point that is out of view instead of stopping dead at the last one in it.
 *  What the caller *does* narrow to the window is the numbers the value axis has
 *  to span — `within` is for that — so the plot rescales to what is on show.
 *
 *  Only a continuous x axis can be zoomed: a window on a set of categories is a
 *  filter, and that belongs to the page.
 */
export function createZoom(input: {
	uid: string
	data: Accessor<readonly Datum[]>
	options: Accessor<CartesianOptions | undefined>
	field: Accessor<string>
}): Zoom {
	const settings = () => input.options()?.zoomBar?.top
	const type = () =>
		input.options()?.axes?.bottom?.scaleType ?? inferScaleType(input.data(), input.field())
	const enabled = () => settings()?.enabled === true && type() !== "labels"

	const full = createMemo(() => extent(input.data().map((datum) => num(datum[input.field()]))))
	const [window, setWindow] = createSignal<[number, number]>()

	const clamp = ([from, to]: [number, number]): [number, number] => {
		const [low, high] = full()
		const least = (high - low) * MIN_SPAN
		const start = Math.min(Math.max(from, low), high - least)
		return [start, Math.min(Math.max(to, start + least), high)]
	}

	const domain = createMemo((): [number, number] => {
		const chosen = window()
		if (chosen) return clamp(chosen)
		const initial = settings()?.initialZoomDomain
		if (initial) {
			const from = num(initial[0])
			const to = num(initial[1])
			if (!Number.isNaN(from) && !Number.isNaN(to)) return clamp([from, to])
		}
		return full()
	})

	return {
		enabled,
		inset: () => (enabled() ? BAR + GAP : 0),
		full,
		domain,
		setDomain: (next) => setWindow(clamp(next)),
		options: () => {
			const options = input.options()
			if (!enabled()) return options
			return {
				...options,
				axes: {
					...options?.axes,
					bottom: { ...options?.axes?.bottom, domain: domain() },
				},
			}
		},
		within: (datum) => {
			if (!enabled()) return true
			const value = num(datum[input.field()])
			const [from, to] = domain()
			return value >= from && value <= to
		},
		clipId: `${input.uid}-zoom-clip`,
	}
}

/** The clip that goes with a zoomed chart. Put it beside the marks and give the
 *  marks' group `clip-path={zoomClip(zoom)}`. A little taller than the plot, so
 *  a marker sitting on the top value is not cut in half. */
export function ZoomClip(props: { zoom: Zoom; c: Cartesian }) {
	const box = () => props.c.box()

	return (
		<Show when={props.zoom.enabled()}>
			<defs>
				<clipPath id={props.zoom.clipId}>
					<rect
						x={box().left}
						y={box().top - 8}
						width={Math.max(0, box().width)}
						height={Math.max(0, box().height + 16)}
					/>
				</clipPath>
			</defs>
		</Show>
	)
}

export const zoomClip = (zoom: Zoom) => (zoom.enabled() ? `url(#${zoom.clipId})` : undefined)

/** How a position along x reads aloud: a date for a time axis, else a number. */
function describe(value: number, time: boolean): string {
	return time ? new Date(value).toISOString().slice(0, 10) : formatNumber(value)
}

/** Carbon's zoom bar: a strip over the plot with a window you drag.
 *
 *  Drawn in the chart's own SVG, across exactly the plot's width, so a position
 *  in the bar is directly above the same position on the axis at full extent.
 *  The data's silhouette sits in it in grey; what is outside the window is
 *  washed out; the window is an ink frame with a solid handle at each end.
 *
 *  Each handle is a slider — focusable, arrow keys move it, Shift takes bigger
 *  steps — and the frame between them drags the whole window. Pointer events
 *  throughout, with capture, so a drag that leaves the bar keeps going.
 */
export function ZoomBar(props: {
	zoom: Zoom
	c: Cartesian
	/** The series to sketch in the bar, as [x, y] in data units. */
	profile: Accessor<readonly [number, number][]>
}) {
	const zoom = () => props.zoom
	const box = () => props.c.box()
	const top = () => box().top - zoom().inset()
	const time = () => props.c.x().type === "time"
	const settings = () => props.c.options().zoomBar?.top

	const span = () => {
		const [low, high] = zoom().full()
		return high - low || 1
	}
	const px = (value: number) => box().left + ((value - zoom().full()[0]) / span()) * box().width
	const valueAt = (pixel: number) =>
		zoom().full()[0] + ((pixel - box().left) / (box().width || 1)) * span()

	const from = () => px(zoom().domain()[0])
	const to = () => px(zoom().domain()[1])

	/** The silhouette, squeezed into the bar's height. */
	const sketch = createMemo(() => {
		const points = props.profile()
		if (points.length < 2) return ""
		const [low, high] = extent(points.map(([, y]) => y))
		const floor = Math.min(0, low)
		const range = high - floor || 1
		const base = top() + BAR
		const line: Point[] = points.map(([x, y]) => [px(x), base - ((y - floor) / range) * (BAR - 4)])
		return areaPath(line, line.map(([x]) => [x, base]), "linear")
	})

	/** Starts a drag. `move` is given the pointer's x in the SVG's own units,
	 *  which are CSS pixels — the chart rewrites its viewBox to its real size. */
	const drag = (event: PointerEvent, move: (pixel: number) => void) => {
		const target = event.currentTarget
		if (!(target instanceof SVGElement)) return
		const svg = target.ownerSVGElement
		if (!svg) return
		event.preventDefault()
		target.setPointerCapture(event.pointerId)
		const origin = svg.getBoundingClientRect().left

		const onMove = (next: PointerEvent) => move(next.clientX - origin)
		const stop = () => {
			target.removeEventListener("pointermove", onMove)
			target.removeEventListener("pointerup", stop)
			target.removeEventListener("pointercancel", stop)
		}
		target.addEventListener("pointermove", onMove)
		target.addEventListener("pointerup", stop)
		target.addEventListener("pointercancel", stop)
	}

	const nudge = (event: KeyboardEvent, end: 0 | 1) => {
		const step = span() * (event.shiftKey ? 0.1 : 0.02)
		const delta = event.key === "ArrowRight" || event.key === "ArrowUp"
			? step
			: event.key === "ArrowLeft" || event.key === "ArrowDown"
			? -step
			: 0
		if (delta === 0) return
		event.preventDefault()
		const [a, b] = zoom().domain()
		zoom().setDomain(end === 0 ? [Math.min(a + delta, b), b] : [a, Math.max(b + delta, a)])
	}

	// A handle is drawn 8px wide and is grabbed over much more: 24px under a
	// mouse, the full 44 under a finger. Known only in the browser, so it starts
	// at the mouse's size and is corrected once mounted.
	const [coarse, setCoarse] = createSignal(false)
	onMount(() => setCoarse(matchMedia("(pointer: coarse)").matches))
	const reach = () => (coarse() ? 44 : 24)

	const handle = (end: 0 | 1) => {
		const at = () => (end === 0 ? from() : to())
		return (
			<>
				<rect
					x={at() - HANDLE / 2}
					y={top()}
					width={HANDLE}
					height={BAR}
					class="pointer-events-none fill-ink"
				/>
				{/* The slider is the reach, not the mark: this is what is focused and dragged. */}
				<rect
					role="slider"
					tabindex="0"
					aria-label={end === 0 ? "Zoom window start" : "Zoom window end"}
					aria-valuemin={zoom().full()[0]}
					aria-valuemax={zoom().full()[1]}
					aria-valuenow={zoom().domain()[end]}
					aria-valuetext={describe(zoom().domain()[end], time())}
					x={at() - reach() / 2}
					y={top() + BAR / 2 - Math.max(BAR, reach()) / 2}
					width={reach()}
					height={Math.max(BAR, reach())}
					fill="transparent"
					class="cursor-ew-resize touch-none"
					onKeyDown={(event) => nudge(event, end)}
					onPointerDown={(event) =>
						drag(event, (pixel) => {
							const [a, b] = zoom().domain()
							const value = valueAt(pixel)
							zoom().setDomain(end === 0 ? [Math.min(value, b), b] : [a, Math.max(value, a)])
						})}
				/>
			</>
		)
	}

	return (
		<Show when={zoom().enabled()}>
			<g>
				<Show when={settings()?.type !== "slider_view"}>
					<path d={sketch()} class="fill-gray" />
				</Show>
				{/* What is outside the window, washed out. */}
				<rect
					x={box().left}
					y={top()}
					width={Math.max(0, from() - box().left)}
					height={BAR}
					class="pointer-events-none fill-white opacity-80"
				/>
				<rect
					x={to()}
					y={top()}
					width={Math.max(0, box().right - to())}
					height={BAR}
					class="pointer-events-none fill-white opacity-80"
				/>
				{/* The track: one ink rule under the bar, the full extent wide. */}
				<line
					x1={box().left}
					x2={box().right}
					y1={top() + BAR}
					y2={top() + BAR}
					stroke-width="2"
					class="stroke-ink"
				/>
				{/* The window. Dragging it moves both ends together. */}
				<rect
					x={from()}
					y={top() + 1}
					width={Math.max(0, to() - from())}
					height={BAR - 2}
					fill="transparent"
					stroke-width="2"
					class="cursor-grab touch-none stroke-ink active:cursor-grabbing"
					onPointerDown={(event) => {
						const [a, b] = zoom().domain()
						const width = b - a
						const svg = event.currentTarget.ownerSVGElement
						if (!svg) return
						const grabbed = valueAt(event.clientX - svg.getBoundingClientRect().left) - a
						drag(event, (pixel) => {
							const [low, high] = zoom().full()
							const start = Math.min(Math.max(valueAt(pixel) - grabbed, low), high - width)
							zoom().setDomain([start, start + width])
						})
					}}
				/>
				{handle(0)}
				{handle(1)}
			</g>
		</Show>
	)
}
