import type { Fill } from "../alumina/Swatch/Swatch"

/** The arithmetic every chart shares: Carbon's data shape, scales, ticks and
 *  number formatting.
 *
 *  Carbon Charts leans on D3 for this. D3 is not a dependency here — its scale
 *  and shape modules last shipped in 2021–22, and CLAUDE.md asks that stale
 *  packages be flagged rather than added — and the part of it a chart actually
 *  needs is small: a linear map, a band map, a "nice" tick step, and a monotone
 *  curve. That is what this file is.
 *
 *  Nothing here touches the DOM, so every chart lays out identically on the
 *  server and in the browser. Text is measured by arithmetic rather than by
 *  asking the browser, which only works because the system is mono everywhere:
 *  an IBM Plex Mono glyph is 0.6em wide, all of them.
 */

/** Carbon Charts' tabular data: one flat record per observation. Which keys
 *  mean what is said by the options (`mapsTo`, `groupMapsTo`), not by the shape. */
export type Datum = Record<string, unknown>

export type ScaleType = "linear" | "labels" | "time" | "log"

export type AxisOptions = {
	title?: string
	/** The key of each datum this axis reads. */
	mapsTo?: string
	scaleType?: ScaleType
	domain?: [number, number]
	/** Linear axes start at zero unless told otherwise; a truncated bar lies. */
	includeZero?: boolean
	stacked?: boolean
	visible?: boolean
	ticks?: {
		number?: number
		formatter?: (value: number | string) => string
	}
	/** Combo charts: the datasets this axis measures. */
	correspondingDatasets?: string[]
	/** Histograms: how many bins to cut this axis into, or their edges. */
	bins?: number | number[]
}

export type BaseChartOptions = {
	title?: string
	/** Any CSS length. Carbon takes "400px"; prefer rem here. */
	height?: string
	data?: {
		/** The key that names a datum's series. Carbon's default is "group". */
		groupMapsTo?: string
		/** The data has not arrived: draw the skeleton instead of the plot. */
		loading?: boolean
	}
	legend?: {
		enabled?: boolean
		position?: "top" | "bottom"
		/** Pressing a legend entry hides or shows its series. */
		clickable?: boolean
	}
	toolbar?: {
		enabled?: boolean
		/** Offer "Export as CSV" and "Export as PNG" beside "Show as table". On
		 *  unless set to false. */
		export?: boolean
	}
	tooltip?: {
		enabled?: boolean
		valueFormatter?: (value: number) => string
	}
	/** Which fill each series wears. This is Carbon's `color.scale`, in a system
	 *  with no colour to scale: series separate by pattern, never by hue. */
	fills?: Record<string, Fill>
}

/** What every chart component takes: Carbon's two props, plus `class` for
 *  placement. */
export type ChartProps<Options> = {
	data: readonly Datum[]
	options?: Options
	class?: string
}

/** IBM Plex Mono's advance width, as a fraction of the font size. */
export const GLYPH = 0.6

/** Sizes in px of the two text steps a chart uses: --text-small (12px) for tick
 *  labels and --text-micro (10px) for axis titles and annotations. They are
 *  numbers rather than classes because layout is computed from them — a margin
 *  is as wide as its widest label — so if the type scale in theme.css moves,
 *  these move with it. */
export const TICK_PX = 12
export const NOTE_PX = 10

export function textWidth(text: string, px: number = TICK_PX): number {
	return text.length * px * GLYPH
}

/** Cuts a label to fit `width`, ending in an ellipsis. */
export function fitText(text: string, width: number, px: number = TICK_PX): string {
	const room = Math.floor(width / (px * GLYPH))
	if (text.length <= room) return text
	if (room <= 1) return ""
	return `${text.slice(0, room - 1)}…`
}

// ---------------------------------------------------------------------------
// reading data

export function num(value: unknown): number {
	if (typeof value === "number") return value
	if (value instanceof Date) return value.getTime()
	if (typeof value === "string") {
		const parsed = Number(value)
		if (!Number.isNaN(parsed)) return parsed
		const date = Date.parse(value)
		return Number.isNaN(date) ? Number.NaN : date
	}
	return Number.NaN
}

export function str(value: unknown): string {
	if (value === null || value === undefined) return ""
	if (value instanceof Date) return value.toISOString()
	return String(value)
}

/** Distinct values of one key, in first-seen order — the order the data was
 *  written in is the order the author wants on the axis and in the legend. */
export function unique(data: readonly Datum[], key: string): string[] {
	const seen = new Set<string>()
	for (const datum of data) seen.add(str(datum[key]))
	return [...seen]
}

export function extent(values: readonly number[]): [number, number] {
	let low = Number.POSITIVE_INFINITY
	let high = Number.NEGATIVE_INFINITY
	for (const value of values) {
		if (Number.isNaN(value)) continue
		if (value < low) low = value
		if (value > high) high = value
	}
	return low > high ? [0, 1] : [low, high]
}

export function sum(values: readonly number[]): number {
	let total = 0
	for (const value of values) total += Number.isNaN(value) ? 0 : value
	return total
}

/** What kind of axis a field wants when the options do not say. */
export function inferScaleType(data: readonly Datum[], key: string): ScaleType {
	const sample = data.find((datum) => datum[key] !== undefined && datum[key] !== null)?.[key]
	if (typeof sample === "number") return "linear"
	// A floating bar's value is a [low, high] pair — still a quantity.
	if (Array.isArray(sample)) return "linear"
	if (sample instanceof Date) return "time"
	return "labels"
}

// ---------------------------------------------------------------------------
// formatting

/** Locale is pinned. Left to the runtime, a server in one locale and a browser
 *  in another format the same number differently and hydration finds text it did
 *  not expect. */
const NUMBER = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 })

export function formatNumber(value: number): string {
	const size = Math.abs(value)
	if (size >= 1e9) return `${NUMBER.format(value / 1e9)}B`
	if (size >= 1e6) return `${NUMBER.format(value / 1e6)}M`
	if (size >= 1e4) return `${NUMBER.format(value / 1e3)}k`
	return NUMBER.format(value)
}

const DAY = 86_400_000

/** UTC throughout, for the same reason the number format is pinned. */
function timeFormatter(span: number): (ms: number) => string {
	const options: Intl.DateTimeFormatOptions = span > 548 * DAY
		? { year: "numeric" }
		: span > 60 * DAY
		? { month: "short", year: "2-digit" }
		: span > 2 * DAY
		? { month: "short", day: "numeric" }
		: { hour: "2-digit", minute: "2-digit", hour12: false }
	const format = new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" })
	return (ms) => format.format(new Date(ms))
}

// ---------------------------------------------------------------------------
// scales

/** A step that lands ticks on round numbers: 1, 2 or 5 times a power of ten. */
function niceStep(span: number, count: number): number {
	const raw = span / Math.max(1, count)
	const magnitude = 10 ** Math.floor(Math.log10(raw))
	const norm = raw / magnitude
	const step = norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10
	return step * magnitude
}

function round(value: number, step: number): number {
	const decimals = Math.max(0, -Math.floor(Math.log10(step)) + 1)
	return Number(value.toFixed(Math.min(decimals, 12)))
}

export type Tick = { at: number; label: string; value: number | string }

/** An axis after its domain is settled but before it has a pixel range — which
 *  is the state layout needs: margins depend on how wide the tick labels are,
 *  and the range depends on the margins. */
export type AxisModel = {
	type: ScaleType
	/** Continuous axes: [low, high]. */
	domain: [number, number]
	/** Band axes: the categories, in order. */
	categories: string[]
	tickValues: (number | string)[]
	format: (value: number | string) => string
	/** The widest tick label, in glyphs. */
	widest: number
}

export function axisModel(
	type: ScaleType,
	values: readonly unknown[],
	options: AxisOptions = {},
	zero = false,
): AxisModel {
	const custom = options.ticks?.formatter
	const count = options.ticks?.number ?? 5

	if (type === "labels") {
		const categories = [...new Set(values.map(str))]
		const format = (value: number | string) => (custom ? custom(value) : String(value))
		return {
			type,
			domain: [0, Math.max(1, categories.length)],
			categories,
			tickValues: categories,
			format,
			widest: Math.max(0, ...categories.map((category) => format(category).length)),
		}
	}

	let [low, high] = options.domain ?? extent(values.map(num))

	if (type === "time") {
		if (low === high) high = low + DAY
		const stamp = timeFormatter(high - low)
		const format = (value: number | string) =>
			custom ? custom(value) : stamp(typeof value === "number" ? value : num(value))
		const tickValues = Array.from(
			{ length: count + 1 },
			(_, index) => low + ((high - low) * index) / count,
		)
		return {
			type,
			domain: [low, high],
			categories: [],
			tickValues,
			format,
			widest: Math.max(...tickValues.map((value) => format(value).length)),
		}
	}

	if (type === "log") {
		low = Math.max(low, Number.MIN_VALUE)
		const from = Math.floor(Math.log10(low))
		const to = Math.max(from + 1, Math.ceil(Math.log10(Math.max(high, low))))
		const tickValues = Array.from({ length: to - from + 1 }, (_, index) => 10 ** (from + index))
		const format = (value: number | string) =>
			custom ? custom(value) : formatNumber(typeof value === "number" ? value : num(value))
		return {
			type,
			domain: [10 ** from, 10 ** to],
			categories: [],
			tickValues,
			format,
			widest: Math.max(...tickValues.map((value) => format(value).length)),
		}
	}

	// linear
	if (!options.domain) {
		if (zero || options.includeZero !== false) {
			low = Math.min(0, low)
			high = Math.max(0, high)
		}
		if (low === high) high = low + 1
		const step = niceStep(high - low, count)
		low = Math.floor(low / step) * step
		high = Math.ceil(high / step) * step
	}
	const step = niceStep(high - low, count)
	const tickValues: number[] = []
	for (let value = low; value <= high + step / 1e6; value += step) {
		tickValues.push(round(value, step))
	}
	const format = (value: number | string) =>
		custom ? custom(value) : formatNumber(typeof value === "number" ? value : num(value))
	return {
		type,
		domain: [round(low, step), round(high, step)],
		categories: [],
		tickValues,
		format,
		widest: Math.max(...tickValues.map((value) => format(value).length)),
	}
}

/** An axis with somewhere to draw. */
export type Scale = {
	type: ScaleType
	range: [number, number]
	/** Where a value sits. For a band axis this is the band's leading edge. */
	at: (value: unknown) => number
	/** Where a value's mark is centred: the middle of its band, or `at`. */
	mid: (value: unknown) => number
	/** Width of one band; 0 on a continuous axis. */
	band: number
	ticks: Tick[]
	/** Where zero sits, clamped into the range — a bar's baseline. */
	zero: number
}

export function scaleOf(model: AxisModel, range: [number, number], padding = 0.2): Scale {
	const [from, to] = range
	const length = to - from

	if (model.type === "labels") {
		const count = Math.max(1, model.categories.length)
		const step = length / count
		const band = step * (1 - padding)
		const index = new Map(model.categories.map((category, at) => [category, at]))
		const at = (value: unknown) => from + (index.get(str(value)) ?? 0) * step + (step - band) / 2
		const mid = (value: unknown) => from + ((index.get(str(value)) ?? 0) + 0.5) * step
		return {
			type: model.type,
			range,
			at,
			mid,
			band,
			ticks: model.categories.map((category) => ({
				at: mid(category),
				label: model.format(category),
				value: category,
			})),
			zero: from,
		}
	}

	const [low, high] = model.domain
	const log = model.type === "log"
	const project = (value: number) => {
		if (log) {
			const span = Math.log10(high) - Math.log10(low) || 1
			return (Math.log10(Math.max(value, low)) - Math.log10(low)) / span
		}
		return (value - low) / (high - low || 1)
	}
	const at = (value: unknown) => from + project(num(value)) * length
	const clamp = (pixel: number) => Math.min(Math.max(pixel, Math.min(from, to)), Math.max(from, to))
	return {
		type: model.type,
		range,
		at,
		mid: at,
		band: 0,
		ticks: model.tickValues.map((value) => ({ at: at(value), label: model.format(value), value })),
		zero: clamp(at(0)),
	}
}

// ---------------------------------------------------------------------------
// paths

export type Point = [x: number, y: number]

export type Curve = "linear" | "step" | "step-before" | "step-after" | "smooth"

/** Carbon passes D3's curve names straight through (`curveMonotoneX`,
 *  `curveStepAfter`, …). They collapse onto the four shapes this draws. */
export function curveOf(name: string | undefined): Curve {
	if (!name) return "linear"
	const key = name.toLowerCase()
	if (key.includes("stepbefore") || key === "step-before") return "step-before"
	if (key.includes("stepafter") || key === "step-after") return "step-after"
	if (key.includes("step")) return "step"
	if (key.includes("linear")) return "linear"
	return "smooth"
}

const f = (value: number) => Number(value.toFixed(2))

/** The path through a run of points. `smooth` is a monotone cubic (Fritsch–
 *  Carlson): it never overshoots, so a curve between two readings cannot dip
 *  below both of them and invent a value that was never measured. */
export function linePath(points: readonly Point[], curve: Curve = "linear"): string {
	const first = points[0]
	if (!first) return ""
	let path = `M${f(first[0])},${f(first[1])}`

	if (curve === "linear" || (curve === "smooth" && points.length < 3)) {
		for (const [x, y] of points.slice(1)) path += `L${f(x)},${f(y)}`
		return path
	}

	if (curve !== "smooth") {
		for (let i = 1; i < points.length; i++) {
			const [px] = points[i - 1] as Point
			const [x, y] = points[i] as Point
			if (curve === "step-after") path += `H${f(x)}V${f(y)}`
			else if (curve === "step-before") path += `V${f(y)}H${f(x)}`
			else path += `H${f((px + x) / 2)}V${f(y)}H${f(x)}`
		}
		return path
	}

	const count = points.length
	const slope: number[] = []
	for (let i = 0; i < count - 1; i++) {
		const [x0, y0] = points[i] as Point
		const [x1, y1] = points[i + 1] as Point
		slope.push((y1 - y0) / (x1 - x0 || 1))
	}
	const tangent: number[] = [slope[0] ?? 0]
	for (let i = 1; i < count - 1; i++) {
		const before = slope[i - 1] ?? 0
		const after = slope[i] ?? 0
		tangent.push(before * after <= 0 ? 0 : (before + after) / 2)
	}
	tangent.push(slope[count - 2] ?? 0)
	for (let i = 0; i < count - 1; i++) {
		const d = slope[i] ?? 0
		if (d === 0) {
			tangent[i] = 0
			tangent[i + 1] = 0
			continue
		}
		const a = (tangent[i] ?? 0) / d
		const b = (tangent[i + 1] ?? 0) / d
		const reach = a * a + b * b
		if (reach > 9) {
			const scale = 3 / Math.sqrt(reach)
			tangent[i] = scale * a * d
			tangent[i + 1] = scale * b * d
		}
	}
	for (let i = 0; i < count - 1; i++) {
		const [x0, y0] = points[i] as Point
		const [x1, y1] = points[i + 1] as Point
		const third = (x1 - x0) / 3
		path += `C${f(x0 + third)},${f(y0 + third * (tangent[i] ?? 0))} ${f(x1 - third)},${
			f(y1 - third * (tangent[i + 1] ?? 0))
		} ${f(x1)},${f(y1)}`
	}
	return path
}

/** A closed region between a run of points and a baseline (or a second run). */
export function areaPath(
	top: readonly Point[],
	bottom: readonly Point[],
	curve: Curve = "linear",
): string {
	if (top.length === 0) return ""
	const back = [...bottom].reverse()
	const reverse: Curve = curve === "step-after"
		? "step-before"
		: curve === "step-before"
		? "step-after"
		: curve
	const returning = linePath(back, reverse).replace(/^M/, "L")
	return `${linePath(top, curve)}${returning}Z`
}

/** A point on a circle. Angles are clockwise from twelve o'clock, in radians —
 *  how a clock and a pie are read, not how trigonometry is written. */
export function polar(cx: number, cy: number, radius: number, angle: number): Point {
	return [cx + radius * Math.sin(angle), cy - radius * Math.cos(angle)]
}

/** An annular sector. With `inner` at zero it is a pie slice. */
export function arcPath(
	cx: number,
	cy: number,
	inner: number,
	outer: number,
	start: number,
	end: number,
): string {
	// A full turn has coincident endpoints, which SVG draws as nothing at all.
	const sweep = Math.min(end - start, Math.PI * 2 - 1e-4)
	const stop = start + sweep
	const large = sweep > Math.PI ? 1 : 0
	const [x0, y0] = polar(cx, cy, outer, start)
	const [x1, y1] = polar(cx, cy, outer, stop)
	if (inner <= 0) {
		return `M${f(cx)},${f(cy)}L${f(x0)},${f(y0)}A${f(outer)},${f(outer)} 0 ${large} 1 ${f(x1)},${
			f(y1)
		}Z`
	}
	const [x2, y2] = polar(cx, cy, inner, stop)
	const [x3, y3] = polar(cx, cy, inner, start)
	return `M${f(x0)},${f(y0)}A${f(outer)},${f(outer)} 0 ${large} 1 ${f(x1)},${f(y1)}L${f(x2)},${
		f(y2)
	}A${f(inner)},${f(inner)} 0 ${large} 0 ${f(x3)},${f(y3)}Z`
}

/** Quartiles by linear interpolation — the method spreadsheets use, so a boxplot
 *  here agrees with one checked by hand. */
export function quantile(sorted: readonly number[], q: number): number {
	if (sorted.length === 0) return Number.NaN
	const position = (sorted.length - 1) * q
	const base = Math.floor(position)
	const rest = position - base
	const low = sorted[base] ?? 0
	const high = sorted[base + 1] ?? low
	return low + rest * (high - low)
}
