import { For, Match, Switch } from "solid-js"
import type { JSX } from "solid-js"
import { FILLS } from "../alumina/Swatch/Swatch"
import type { Fill } from "../alumina/Swatch/Swatch"

/** The fill vocabulary, drawn in SVG.
 *
 *  Each pattern here is the twin of a background utility in theme.css (`bg-hatch`,
 *  `pat-dots`, `pat-back`, …). A legend entry is an HTML swatch painted with the
 *  utility; the mark it stands for is an SVG shape painted with the pattern.
 *  They have to read as the same thing, so the pitches and weights below follow
 *  the CSS ones: 2px ink on an 8px pitch for the stripes, 1px on 4–6px for the
 *  fine grids. Directions too — a CSS gradient at 45deg paints stripes that fall
 *  to the right, which in SVG is a vertical bar rotated by *minus* 45.
 *
 *  Numbers in this file are SVG user units inside a pattern tile — geometry, not
 *  CSS lengths — so they are outside the even-number rule, exactly as the
 *  coordinates in kiln's figures are.
 */

/** Three of the fills are flat and need no pattern at all. */
const FLAT: Partial<Record<Fill, string>> = {
	solid: "fill-ink",
	open: "fill-white",
	gray: "fill-gray",
}

/** What to put on a shape so it wears `fill`. Flat fills are a class; patterned
 *  ones are a paint server reference, which only works as the `fill` attribute.
 *
 *  `extra` is the shape's other classes — its stroke, usually. They are merged
 *  here rather than set beside the spread, because a spread that carries its own
 *  `class` replaces the element's: every flat-filled bar lost its outline that
 *  way, which was invisible on solid ink and obvious on grey. */
export function paint(uid: string, fill: Fill, extra = ""): { class: string; fill?: string } {
	const flat = FLAT[fill]
	return flat ? { class: `${flat} ${extra}` } : { class: extra, fill: `url(#${uid}-${fill})` }
}

/** The fills that can be seen through, in the order a chart hands them out.
 *  Solid, grey and white are missing on purpose: none of them has a form with
 *  nothing behind the ink, and a chart whose marks overlap — area, bubble,
 *  radar, circle pack, alluvial — needs every series to have one. */
export const THROUGH_FILLS: readonly Fill[] = [
	"hatch",
	"dots",
	"back",
	"cross",
	"lines",
	"bars",
	"grid",
	"checker",
]

/** The same fill with nothing behind the ink, for marks that overlap — two area
 *  series crossing, a radar polygon over its grid. A flat fill asked for by name
 *  through `options.fills` falls back to its nearest pattern. */
export function paintThrough(uid: string, fill: Fill, extra = ""): { class: string; fill: string } {
	const pattern: Fill = fill === "solid" ? "hatch" : fill === "gray" ? "dots" : fill
	return {
		class: extra,
		fill: pattern === "open" ? "none" : `url(#${uid}-${pattern}-through)`,
	}
}

/** Ink text is unreadable over a pattern and invisible over solid ink. Solid
 *  takes white text; everything else gets a white plate behind the label. */
export function labelOn(fill: Fill): "white" | "plate" {
	return fill === "solid" ? "white" : "plate"
}

type PatternSpec = { size: number; rotate?: number; marks: () => JSX.Element }

const PATTERNS: Partial<Record<Fill, PatternSpec>> = {
	hatch: { size: 8, rotate: -45, marks: () => <rect width="2" height="8" class="fill-ink" /> },
	back: { size: 8, rotate: 45, marks: () => <rect width="2" height="8" class="fill-ink" /> },
	lines: { size: 6, marks: () => <rect width="6" height="2" class="fill-ink" /> },
	bars: { size: 6, marks: () => <rect width="2" height="6" class="fill-ink" /> },
	dots: { size: 6, marks: () => <rect x="2" y="2" width="2" height="2" class="fill-ink" /> },
	cross: {
		size: 4,
		rotate: 45,
		marks: () => (
			<>
				<rect width="1" height="4" class="fill-ink" />
				<rect width="4" height="1" class="fill-ink" />
			</>
		),
	},
	grid: {
		size: 6,
		marks: () => (
			<>
				<rect width="1" height="6" class="fill-ink" />
				<rect width="6" height="1" class="fill-ink" />
			</>
		),
	},
	checker: {
		size: 8,
		marks: () => (
			<>
				<rect width="4" height="4" class="fill-ink" />
				<rect x="4" y="4" width="4" height="4" class="fill-ink" />
			</>
		),
	},
}

/** Every pattern, twice: once over white and once over nothing. Ids are scoped
 *  by `uid`, so two charts on a page never resolve to each other's definitions —
 *  which matters, because a pattern inside a `display: none` chart paints as
 *  nothing wherever it is referenced. */
export function FillDefs(props: { uid: string }) {
	const patterned = FILLS.filter((fill) => PATTERNS[fill] !== undefined)

	return (
		<defs>
			<For each={patterned}>
				{(fill) => {
					const spec = PATTERNS[fill] as PatternSpec
					const transform = spec.rotate ? `rotate(${spec.rotate})` : undefined
					return (
						<>
							<pattern
								id={`${props.uid}-${fill}`}
								width={spec.size}
								height={spec.size}
								patternUnits="userSpaceOnUse"
								patternTransform={transform}
							>
								<rect width={spec.size} height={spec.size} class="fill-white" />
								{spec.marks()}
							</pattern>
							<pattern
								id={`${props.uid}-${fill}-through`}
								width={spec.size}
								height={spec.size}
								patternUnits="userSpaceOnUse"
								patternTransform={transform}
							>
								{spec.marks()}
							</pattern>
						</>
					)
				}}
			</For>
		</defs>
	)
}

/** How a line series is told from its neighbours: a dash rhythm and a marker
 *  shape, cycling together. Six of each before anything repeats. */
const DASHES = ["", "8 4", "2 4", "12 4 2 4", "4 4", "16 6"] as const

export type MarkerShape =
	| "square"
	| "diamond"
	| "triangle"
	| "square-open"
	| "diamond-open"
	| "cross"

const MARKERS: readonly MarkerShape[] = [
	"square",
	"diamond",
	"triangle",
	"square-open",
	"diamond-open",
	"cross",
]

export function dashOf(index: number): string | undefined {
	return DASHES[index % DASHES.length] || undefined
}

export function markerOf(index: number): MarkerShape {
	return MARKERS[index % MARKERS.length] ?? "square"
}

/** One point marker, centred on (x, y). Squares, diamonds and triangles rather
 *  than Carbon's circles: the system has no round corners, and three silhouettes
 *  are also three more ways to tell series apart without colour. */
export function Marker(props: {
	shape: MarkerShape
	x: number
	y: number
	size?: number
	class?: string
}) {
	const r = () => (props.size ?? 8) / 2
	const open = () => props.shape.endsWith("-open")
	const paintClass = () => `${open() ? "fill-white" : "fill-ink"} stroke-ink ${props.class ?? ""}`

	return (
		<Switch>
			<Match when={props.shape === "square" || props.shape === "square-open"}>
				<rect
					x={props.x - r()}
					y={props.y - r()}
					width={r() * 2}
					height={r() * 2}
					stroke-width="2"
					class={paintClass()}
				/>
			</Match>
			<Match when={props.shape === "diamond" || props.shape === "diamond-open"}>
				<path
					d={`M${props.x},${props.y - r() * 1.3}L${props.x + r() * 1.3},${props.y}L${props.x},${
						props.y + r() * 1.3
					}L${props.x - r() * 1.3},${props.y}Z`}
					stroke-width="2"
					class={paintClass()}
				/>
			</Match>
			<Match when={props.shape === "triangle"}>
				<path
					d={`M${props.x},${props.y - r() * 1.3}L${props.x + r() * 1.3},${props.y + r()}L${
						props.x - r() * 1.3
					},${props.y + r()}Z`}
					stroke-width="2"
					class={paintClass()}
				/>
			</Match>
			<Match when={props.shape === "cross"}>
				<path
					d={`M${props.x - r()},${props.y - r()}L${props.x + r()},${props.y + r()}M${
						props.x + r()
					},${props.y - r()}L${props.x - r()},${props.y + r()}`}
					stroke-width="2"
					fill="none"
					class={`stroke-ink ${props.class ?? ""}`}
				/>
			</Match>
		</Switch>
	)
}
