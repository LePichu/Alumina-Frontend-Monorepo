import { createMemo, For, Show } from "solid-js"
import { Axes, createCartesian } from "./cartesian"
import type { CartesianOptions } from "./cartesian"
import { areaPath, curveOf, extent, linePath, num, quantile, str, unique } from "./core"
import type { ChartProps, Datum, Point } from "./core"
import { dashOf, Marker, markerOf, paint, paintThrough } from "./fills"
import { ChartFrame, createChart, tipHandlers } from "./frame"

const groupKey = (options: CartesianOptions | undefined) => options?.data?.groupMapsTo ?? "group"

// ---------------------------------------------------------------------------
// histogram

type Bin = { from: number; to: number; counts: Map<string, number> }

/** Cuts a run of values into bins. Edges land on round numbers, so a bin reads
 *  as "20–30" rather than "19.4–29.1". */
function binValues(
	data: readonly Datum[],
	field: string,
	group: string,
	bins: number | number[] | undefined,
): Bin[] {
	const values = data.map((datum) => num(datum[field])).filter((value) => !Number.isNaN(value))
	if (values.length === 0) return []

	let edges: number[]
	if (Array.isArray(bins)) {
		edges = [...bins].sort((a, b) => a - b)
	} else {
		const [low, high] = extent(values)
		const count = bins ?? 10
		const raw = (high - low || 1) / count
		const magnitude = 10 ** Math.floor(Math.log10(raw))
		const norm = raw / magnitude
		const step = (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * magnitude
		const start = Math.floor(low / step) * step
		edges = []
		for (let edge = start; edge < high + step; edge += step) edges.push(Number(edge.toFixed(10)))
	}

	const out: Bin[] = []
	for (let i = 0; i < edges.length - 1; i++) {
		out.push({ from: edges[i] ?? 0, to: edges[i + 1] ?? 0, counts: new Map() })
	}
	for (const datum of data) {
		const value = num(datum[field])
		if (Number.isNaN(value)) continue
		// The last bin is closed on both sides, or the maximum would fall out.
		const bin = out.find((each, at) =>
			value >= each.from && (value < each.to || (at === out.length - 1 && value <= each.to))
		)
		if (!bin) continue
		const name = str(datum[group])
		bin.counts.set(name, (bin.counts.get(name) ?? 0) + 1)
	}
	return out
}

/** Carbon's HistogramChart: how often values fall in each range. Bars touch,
 *  because the ranges do — a gap would say there are values nothing landed in.
 *  Series stack within a bin. */
export function HistogramChart(props: ChartProps<CartesianOptions>) {
	const key = () => groupKey(props.options)
	const field = () => props.options?.axes?.bottom?.mapsTo ?? "value"
	const chart = createChart({
		options: () => props.options,
		groups: () => unique(props.data, key()),
		table: () => {
			const groups = unique(props.data, key())
			return {
				headers: [field(), ...groups],
				rows: binValues(props.data, field(), key(), props.options?.axes?.bottom?.bins).map((
					bin,
				) => [
					`${bin.from} – ${bin.to}`,
					...groups.map((group) => bin.counts.get(group) ?? 0),
				]),
			}
		},
	})
	// Binned over all the data, not just what is showing: hiding a series must not
	// move the bin edges under the ones that remain.
	const bins = createMemo(() =>
		binValues(props.data, field(), key(), props.options?.axes?.bottom?.bins)
	)
	/** Each bin's showing series, stacked in legend order. */
	const blocks = createMemo(() =>
		bins().flatMap((bin) => {
			let running = 0
			return chart.active().flatMap((group) => {
				const count = bin.counts.get(group) ?? 0
				if (count === 0) return []
				const from = running
				running += count
				return [{ bin, group, from, to: from + count, count }]
			})
		})
	)

	return (
		<ChartFrame chart={chart} class={props.class}>
			{(size) => {
				const edges = (): [number, number] | undefined => {
					const all = bins()
					return all.length ? [all[0]?.from ?? 0, all.at(-1)?.to ?? 1] : undefined
				}
				// The histogram's two axes are both derived: x spans the bin edges and
				// y spans the tallest stack. Neither is a column of the data.
				const c = createCartesian({
					data: () => blocks().map((block) => ({ [field()]: block.bin.from, count: block.to })),
					options: () => ({
						...props.options,
						axes: {
							...props.options?.axes,
							bottom: {
								...props.options?.axes?.bottom,
								mapsTo: field(),
								scaleType: "linear" as const,
								domain: edges(),
							},
							left: { ...props.options?.axes?.left, mapsTo: "count", scaleType: "linear" as const },
						},
					}),
					size,
					zero: true,
				})

				return (
					<>
						<Axes c={c} />
						<For each={blocks()}>
							{(block) => (
								<rect
									x={c.x().at(block.bin.from)}
									width={Math.max(0, c.x().at(block.bin.to) - c.x().at(block.bin.from))}
									y={c.y().at(block.to)}
									height={Math.max(0, c.y().at(block.from) - c.y().at(block.to))}
									stroke-width="2"
									{...paint(chart.uid, chart.fillOf(block.group), "stroke-ink")}
									{...tipHandlers(chart, () => ({
										title: `${block.bin.from} – ${block.bin.to}`,
										rows: [{ label: block.group, value: chart.format(block.count) }],
									}))}
								/>
							)}
						</For>
					</>
				)
			}}
		</ChartFrame>
	)
}

// ---------------------------------------------------------------------------
// boxplot

type Box5 = {
	name: string
	low: number
	q1: number
	median: number
	q3: number
	high: number
	outliers: number[]
}

function summarise(data: readonly Datum[], category: string, value: string): Box5[] {
	return unique(data, category).map((name) => {
		const sorted = data
			.filter((datum) => str(datum[category]) === name)
			.map((datum) => num(datum[value]))
			.filter((each) => !Number.isNaN(each))
			.sort((a, b) => a - b)
		const q1 = quantile(sorted, 0.25)
		const q3 = quantile(sorted, 0.75)
		const reach = (q3 - q1) * 1.5
		const inside = sorted.filter((each) => each >= q1 - reach && each <= q3 + reach)
		return {
			name,
			q1,
			median: quantile(sorted, 0.5),
			q3,
			low: inside[0] ?? q1,
			high: inside.at(-1) ?? q3,
			outliers: sorted.filter((each) => each < q1 - reach || each > q3 + reach),
		}
	})
}

/** Carbon's BoxplotChart: each category's spread as a five-number summary — the
 *  box is the middle half, the heavy line the median, the whiskers the rest, and
 *  anything past 1.5× the box's length is drawn on its own as an outlier.
 *
 *  Runs either way: categories on the left give Carbon's horizontal default. */
export function BoxplotChart(props: ChartProps<CartesianOptions>) {
	const fields = () => {
		const left = props.options?.axes?.left
		const bottom = props.options?.axes?.bottom
		const flat = left?.scaleType === "labels" || bottom?.scaleType !== "labels"
		return {
			category: (flat ? left?.mapsTo : bottom?.mapsTo) ?? "group",
			value: (flat ? bottom?.mapsTo : left?.mapsTo) ?? "value",
			flat,
		}
	}
	const boxes = createMemo(() => summarise(props.data, fields().category, fields().value))
	const chart = createChart({
		options: () => props.options,
		groups: () => [],
		table: () => ({
			headers: [fields().category, "min", "q1", "median", "q3", "max", "outliers"],
			rows: boxes().map((box) => [
				box.name,
				box.low,
				box.q1,
				box.median,
				box.q3,
				box.high,
				box.outliers.join(", "),
			]),
		}),
	})

	return (
		<ChartFrame chart={chart} noLegend class={props.class}>
			{(size) => {
				const c = createCartesian({
					data: () => props.data,
					options: () => {
						const flat = fields().flat
						const labels = { mapsTo: fields().category, scaleType: "labels" as const }
						const linear = {
							mapsTo: fields().value,
							scaleType: "linear" as const,
							includeZero: false,
						}
						return {
							...props.options,
							axes: {
								left: { ...props.options?.axes?.left, ...(flat ? labels : linear) },
								bottom: { ...props.options?.axes?.bottom, ...(flat ? linear : labels) },
							},
						}
					},
					size,
					padding: 0.4,
				})
				/** A segment given in (value, across-the-band) terms, turned to x/y. */
				const seg = (v0: number, a0: number, v1: number, a1: number) => {
					const p0 = c.val().at(v0)
					const p1 = c.val().at(v1)
					return c.horizontal()
						? { x1: p0, y1: a0, x2: p1, y2: a1 }
						: { x1: a0, y1: p0, x2: a1, y2: p1 }
				}

				return (
					<>
						<Axes c={c} />
						<For each={boxes()}>
							{(box) => {
								const start = () => c.cat().at(box.name)
								const end = () => start() + c.cat().band
								const mid = () => c.cat().mid(box.name)
								const cap = () => c.cat().band / 4
								const a = () => c.val().at(box.q1)
								const b = () => c.val().at(box.q3)
								return (
									<g
										{...tipHandlers(chart, () => ({
											title: box.name,
											rows: [
												{ label: "max", value: chart.format(box.high) },
												{ label: "q3", value: chart.format(box.q3) },
												{ label: "median", value: chart.format(box.median) },
												{ label: "q1", value: chart.format(box.q1) },
												{ label: "min", value: chart.format(box.low) },
											],
										}))}
									>
										{/* whiskers and their end caps */}
										<line
											{...seg(box.low, mid(), box.q1, mid())}
											stroke-width="2"
											class="stroke-ink"
										/>
										<line
											{...seg(box.q3, mid(), box.high, mid())}
											stroke-width="2"
											class="stroke-ink"
										/>
										<line
											{...seg(box.low, mid() - cap(), box.low, mid() + cap())}
											stroke-width="2"
											class="stroke-ink"
										/>
										<line
											{...seg(box.high, mid() - cap(), box.high, mid() + cap())}
											stroke-width="2"
											class="stroke-ink"
										/>
										<rect
											x={c.horizontal() ? Math.min(a(), b()) : start()}
											y={c.horizontal() ? start() : Math.min(a(), b())}
											width={c.horizontal() ? Math.abs(b() - a()) : c.cat().band}
											height={c.horizontal() ? c.cat().band : Math.abs(b() - a())}
											stroke-width="2"
											class="fill-white stroke-ink"
										/>
										{/* The median is the one number a boxplot is read for. */}
										<line
											{...seg(box.median, start(), box.median, end())}
											stroke-width="4"
											class="stroke-ink"
										/>
										<For each={box.outliers}>
											{(value) => (
												<Marker
													shape="cross"
													x={c.horizontal() ? c.val().at(value) : mid()}
													y={c.horizontal() ? mid() : c.val().at(value)}
													size={8}
												/>
											)}
										</For>
									</g>
								)
							}}
						</For>
					</>
				)
			}}
		</ChartFrame>
	)
}

// ---------------------------------------------------------------------------
// bullet

/** Carbon's BulletChart: a measure against a target, over bands that say what
 *  counts as poor, fair and good.
 *
 *  Each datum is `{ title, group, ranges: [a, b, c], marker, value }`. Carbon
 *  shades the bands in three greys; here they separate by fill — grey, dots,
 *  white — running from worst to best, with the measure in solid ink over them
 *  and the target as a heavy tick. */
export function BulletChart(props: ChartProps<CartesianOptions>) {
	const title = () => props.options?.axes?.left?.mapsTo ?? "title"
	const value = () => props.options?.axes?.bottom?.mapsTo ?? "value"
	const ranges = (datum: Datum): number[] =>
		Array.isArray(datum["ranges"])
			? datum["ranges"].map(num).filter((each) => !Number.isNaN(each))
			: []

	const chart = createChart({
		options: () => props.options,
		groups: () => [],
		table: () => ({
			headers: [title(), "value", "target", "ranges"],
			rows: props.data.map((datum) => [
				str(datum[title()]),
				num(datum[value()]),
				num(datum["marker"]),
				ranges(datum).join(" / "),
			]),
		}),
	})
	const BANDS = ["gray", "dots", "open"] as const

	return (
		<ChartFrame chart={chart} noLegend class={props.class}>
			{(size) => {
				const c = createCartesian({
					data: () => props.data,
					options: () => ({
						...props.options,
						axes: {
							left: { ...props.options?.axes?.left, mapsTo: title(), scaleType: "labels" as const },
							bottom: {
								...props.options?.axes?.bottom,
								mapsTo: value(),
								scaleType: "linear" as const,
							},
						},
						grid: { x: { enabled: false }, y: { enabled: false } },
					}),
					size,
					zero: true,
					padding: 0.35,
					values: () =>
						props.data.flatMap((
							datum,
						) => [num(datum[value()]), num(datum["marker"]), ...ranges(datum)]),
				})

				return (
					<>
						<Axes c={c} />
						<For each={props.data}>
							{(datum) => {
								const top = () => c.y().at(datum[title()])
								const band = () => c.y().band
								return (
									<g
										{...tipHandlers(chart, () => ({
											title: str(datum[title()]),
											rows: [
												{ label: "value", value: chart.format(num(datum[value()])) },
												{ label: "target", value: chart.format(num(datum["marker"])) },
											],
										}))}
									>
										<For each={ranges(datum)}>
											{(limit, at) => {
												const from = () => (at() === 0 ? 0 : ranges(datum)[at() - 1] ?? 0)
												return (
													<rect
														x={c.x().at(from())}
														y={top()}
														width={Math.max(0, c.x().at(limit) - c.x().at(from()))}
														height={band()}
														stroke-width="2"
														{...paint(
															chart.uid,
															BANDS[at() % BANDS.length] ?? "open",
															"stroke-ink",
														)}
													/>
												)
											}}
										</For>
										<rect
											x={c.x().zero}
											y={top() + band() / 3}
											width={Math.max(0, c.x().at(datum[value()]) - c.x().zero)}
											height={band() / 3}
											class="fill-ink"
										/>
										<Show when={!Number.isNaN(num(datum["marker"]))}>
											{/* White behind the tick, so it stays visible where it crosses the measure. */}
											<rect
												x={c.x().at(datum["marker"]) - 4}
												y={top() + band() / 8}
												width="8"
												height={band() * 0.75}
												class="fill-white"
											/>
											<rect
												x={c.x().at(datum["marker"]) - 2}
												y={top() + band() / 8}
												width="4"
												height={band() * 0.75}
												class="fill-ink"
											/>
										</Show>
									</g>
								)
							}}
						</For>
					</>
				)
			}}
		</ChartFrame>
	)
}

// ---------------------------------------------------------------------------
// combo

export type ComboChartType =
	| "simple-bar"
	| "grouped-bar"
	| "stacked-bar"
	| "line"
	| "area"
	| "scatter"

export type ComboChartOptions = CartesianOptions & {
	/** Which chart draws which datasets. Carbon's shape exactly. */
	comboChartTypes?: {
		type: ComboChartType
		correspondingDatasets: string[]
		options?: { curve?: string; points?: { enabled?: boolean } }
	}[]
}

/** Carbon's ComboChart: bars and lines over one category axis, each reading its
 *  own value axis when the options give it a right-hand one.
 *
 *  The usual case — a quantity as bars and a rate as a line, in different units —
 *  is exactly what a second axis is for, and exactly where colour would normally
 *  say which mark belongs to which axis. Here the mark type says it: bars always
 *  read the left axis's datasets, and a dataset listed under the right axis's
 *  `correspondingDatasets` is drawn against the right. */
export function ComboChart(props: ChartProps<ComboChartOptions>) {
	const key = () => groupKey(props.options)
	const category = () => props.options?.axes?.bottom?.mapsTo ?? "key"
	const types = () => props.options?.comboChartTypes ?? []
	const onRight = (group: string) =>
		props.options?.axes?.right?.correspondingDatasets?.includes(group) ?? false
	const valueField = (group: string) =>
		onRight(group)
			? (props.options?.axes?.right?.mapsTo ?? "value")
			: (props.options?.axes?.left?.mapsTo ?? "value")
	const typeOf = (group: string): ComboChartType =>
		types().find((each) => each.correspondingDatasets.includes(group))?.type ?? "line"
	const isBar = (group: string) => typeOf(group).endsWith("bar")

	const chart = createChart({
		options: () => props.options,
		groups: () => unique(props.data, key()),
		table: () => ({
			headers: [key(), category(), "value"],
			rows: props.data.map((datum) => [
				str(datum[key()]),
				str(datum[category()]),
				num(datum[valueField(str(datum[key()]))]),
			]),
		}),
		// Bars show their fill; a line shows its dash and marker; a scatter, only
		// the marker — all three can share one legend.
		legendKind: (group) =>
			isBar(group) || typeOf(group) === "area"
				? "fill"
				: typeOf(group) === "scatter"
				? "marker"
				: "line",
	})
	const shown = createMemo(() => props.data.filter((datum) => chart.isActive(str(datum[key()]))))
	const valuesOn = (right: boolean) =>
		shown()
			.filter((datum) => onRight(str(datum[key()])) === right)
			.map((datum) => num(datum[valueField(str(datum[key()]))]))

	return (
		<ChartFrame chart={chart} class={props.class}>
			{(size) => {
				const c = createCartesian({
					data: shown,
					options: () => ({
						...props.options,
						axes: {
							...props.options?.axes,
							bottom: {
								scaleType: "labels" as const,
								...props.options?.axes?.bottom,
								mapsTo: category(),
							},
						},
					}),
					size,
					zero: true,
					values: () => valuesOn(false),
					values2: () => (props.options?.axes?.right ? valuesOn(true) : undefined),
				})
				const scale = (group: string) => (onRight(group) ? (c.y2() ?? c.y()) : c.y())
				const bars = () => chart.active().filter(isBar)
				const slot = () => c.x().band / Math.max(1, bars().length)
				const series = (group: string) => shown().filter((datum) => str(datum[key()]) === group)
				const points = (group: string): Point[] =>
					series(group).map((datum) => [
						c.x().mid(datum[category()]),
						scale(group).at(datum[valueField(group)]),
					])
				const curve = (group: string) =>
					curveOf(
						types().find((each) => each.correspondingDatasets.includes(group))?.options?.curve,
					)
				const tip = (group: string, datum: Datum) => () => ({
					title: str(datum[category()]),
					rows: [{ label: group, value: chart.format(num(datum[valueField(group)])) }],
				})

				return (
					<>
						<Axes c={c} />
						{/* Bars first, so every line and marker sits on top of them. */}
						<For each={bars()}>
							{(group) => (
								<For each={series(group)}>
									{(datum) => {
										const y = () => scale(group).at(datum[valueField(group)])
										return (
											<rect
												x={c.x().at(datum[category()]) + bars().indexOf(group) * slot()}
												y={Math.min(y(), scale(group).zero)}
												width={slot()}
												height={Math.abs(scale(group).zero - y())}
												stroke-width="2"
												{...paint(chart.uid, chart.fillOf(group), "stroke-ink")}
												{...tipHandlers(chart, tip(group, datum))}
											/>
										)
									}}
								</For>
							)}
						</For>
						<For each={chart.active().filter((group) => !isBar(group))}>
							{(group) => (
								<g>
									<Show when={typeOf(group) === "area"}>
										<path
											d={areaPath(
												points(group),
												points(group).map(([x]) => [x, scale(group).zero] as Point),
												curve(group),
											)}
											{...paintThrough(chart.uid, chart.fillOf(group))}
										/>
									</Show>
									<Show when={typeOf(group) !== "scatter"}>
										{
											/* A white casing under the line, so it stays legible where it
										    crosses a patterned bar. */
										}
										<path
											d={linePath(points(group), curve(group))}
											fill="none"
											stroke-width="6"
											class="stroke-white"
										/>
										<path
											d={linePath(points(group), curve(group))}
											fill="none"
											stroke-width="2"
											stroke-dasharray={dashOf(chart.indexOf(group))}
											class="stroke-ink"
										/>
									</Show>
									<For each={series(group)}>
										{(datum) => (
											<g {...tipHandlers(chart, tip(group, datum))}>
												<Marker
													shape={markerOf(chart.indexOf(group))}
													x={c.x().mid(datum[category()])}
													y={scale(group).at(datum[valueField(group)])}
													size={8}
												/>
											</g>
										)}
									</For>
								</g>
							)}
						</For>
					</>
				)
			}}
		</ChartFrame>
	)
}
