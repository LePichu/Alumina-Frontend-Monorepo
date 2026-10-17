import { createMemo, For, Show } from "solid-js"
import { Axes, createCartesian } from "./cartesian"
import type { CartesianOptions } from "./cartesian"
import { areaPath, curveOf, extent, linePath, num, str, unique } from "./core"
import type { ChartProps, Datum, Point } from "./core"
import { Fade } from "./fade"
import type { FadeKind } from "./fade"
import { dashOf, Marker, markerOf, paint, paintThrough } from "./fills"
import { ChartFrame, createChart, tipHandlers } from "./frame"
import { createZoom, ZoomBar, ZoomClip, zoomClip } from "./zoom"

export type LineChartOptions = CartesianOptions & {
	/** A D3 curve name, as Carbon takes it: `curveLinear`, `curveMonotoneX`,
	 *  `curveStepAfter` and so on. */
	curve?: string
	points?: {
		enabled?: boolean
		/** Marker size in px. */
		radius?: number
	}
	/** Carbon's `color.gradient`, for area charts: the fill fades from the line
	 *  down to the axis. Carbon does it with a colour gradient; here it is a
	 *  change in ink coverage — see fade.tsx. As in Carbon, it applies only while
	 *  a single series is showing: two fades over each other are mud. */
	color?: {
		gradient?: {
			enabled?: boolean
			/** Which one-ink fade to draw. Defaults to `dither`. */
			kind?: FadeKind
		}
	}
}

const groupKey = (options: CartesianOptions | undefined) => options?.data?.groupMapsTo ?? "group"

/** The fields a point chart reads, straight from the options. */
function pointFields(options: CartesianOptions | undefined) {
	return {
		x: options?.axes?.bottom?.mapsTo ?? "key",
		y: options?.axes?.left?.mapsTo ?? "value",
	}
}

/** A table with one row per datum — right for charts where each datum is its
 *  own observation rather than a cell in a category × series grid. */
function flatTable(data: readonly Datum[], columns: string[]) {
	return {
		headers: columns,
		rows: data.map((datum) =>
			columns.map((column) => {
				const value = datum[column]
				return typeof value === "number" ? value : str(value)
			})
		),
	}
}

/** The numbers a zoomed chart's value axis has to span: those of the data in the
 *  window. `undefined` — "use every datum" — when nothing is, so an empty window
 *  does not collapse the axis. */
function visibleValues(
	data: readonly Datum[],
	within: (datum: Datum) => boolean,
	field: string,
): number[] | undefined {
	const visible = data.filter(within)
	return visible.length > 0 && visible.length < data.length
		? visible.map((datum) => num(datum[field]))
		: undefined
}

/** What a zoom bar sketches: every datum as [x, y], in x order. With several
 *  series that is all of them overlaid, which is the outline of where the data
 *  is — all the bar needs to say. */
function profileOf(data: readonly Datum[], fields: { x: string; y: string }): [number, number][] {
	return data
		.map((datum): [number, number] => [num(datum[fields.x]), num(datum[fields.y])])
		.filter(([x, y]) => !Number.isNaN(x) && !Number.isNaN(y))
		.sort((a, b) => a[0] - b[0])
}

/** Carbon's LineChart. One line per series, told apart by dash rhythm and marker
 *  shape rather than by colour. `curve: "curveStepAfter"` gives the step chart;
 *  any of D3's smoothing curves gives a monotone one that cannot overshoot. */
export function LineChart(props: ChartProps<LineChartOptions>) {
	const key = () => groupKey(props.options)
	const fields = () => pointFields(props.options)
	const chart = createChart({
		options: () => props.options,
		groups: () => unique(props.data, key()),
		table: () => flatTable(props.data, [key(), fields().x, fields().y]),
		legendKind: "line",
	})
	const shown = createMemo(() => props.data.filter((datum) => chart.isActive(str(datum[key()]))))

	return (
		<ChartFrame chart={chart} class={props.class}>
			{(size) => {
				const zoom = createZoom({
					uid: chart.uid,
					data: shown,
					options: () => props.options,
					field: () => fields().x,
				})
				const c = createCartesian({
					data: shown,
					options: zoom.options,
					size,
					padding: 0,
					inset: zoom.inset,
					values: () => visibleValues(shown(), zoom.within, fields().y),
				})
				const series = (group: string) => shown().filter((datum) => str(datum[key()]) === group)
				const points = (group: string): Point[] =>
					series(group).map((datum) => [c.x().mid(datum[fields().x]), c.y().at(datum[fields().y])])

				return (
					<>
						<Axes c={c} />
						<ZoomClip zoom={zoom} c={c} />
						<ZoomBar zoom={zoom} c={c} profile={() => profileOf(shown(), fields())} />
						<For each={chart.active()}>
							{(group) => (
								<g clip-path={zoomClip(zoom)}>
									<path
										d={linePath(points(group), curveOf(props.options?.curve))}
										fill="none"
										stroke-width="2"
										stroke-dasharray={dashOf(chart.indexOf(group))}
										class="stroke-ink"
									/>
									<Show when={props.options?.points?.enabled !== false}>
										<For each={series(group)}>
											{(datum) => (
												<g
													{...tipHandlers(chart, () => ({
														title: str(datum[fields().x]),
														rows: [{ label: group, value: chart.format(num(datum[fields().y])) }],
													}))}
												>
													<Marker
														shape={markerOf(chart.indexOf(group))}
														x={c.x().mid(datum[fields().x])}
														y={c.y().at(datum[fields().y])}
														size={props.options?.points?.radius ?? 8}
													/>
												</g>
											)}
										</For>
									</Show>
								</g>
							)}
						</For>
					</>
				)
			}}
		</ChartFrame>
	)
}

/** Carbon's AreaChart: a line with the region under it filled. The fill has
 *  nothing behind its ink, so where two series cross you can still read both. */
export function AreaChart(props: ChartProps<LineChartOptions>) {
	const key = () => groupKey(props.options)
	const fields = () => pointFields(props.options)
	const chart = createChart({
		options: () => props.options,
		groups: () => unique(props.data, key()),
		table: () => flatTable(props.data, [key(), fields().x, fields().y]),
		overlap: true,
	})
	const shown = createMemo(() => props.data.filter((datum) => chart.isActive(str(datum[key()]))))

	return (
		<ChartFrame chart={chart} class={props.class}>
			{(size) => {
				const zoom = createZoom({
					uid: chart.uid,
					data: shown,
					options: () => props.options,
					field: () => fields().x,
				})
				const c = createCartesian({
					data: shown,
					options: zoom.options,
					size,
					zero: true,
					padding: 0,
					inset: zoom.inset,
					values: () => visibleValues(shown(), zoom.within, fields().y),
				})
				const curve = () => curveOf(props.options?.curve)
				const series = (group: string) => shown().filter((datum) => str(datum[key()]) === group)
				const points = (group: string): Point[] =>
					series(group).map((datum) => [c.x().mid(datum[fields().x]), c.y().at(datum[fields().y])])
				const floor = (group: string): Point[] => points(group).map(([x]) => [x, c.y().zero])
				const fade = () =>
					props.options?.color?.gradient?.enabled === true && chart.active().length === 1

				return (
					<>
						<Axes c={c} />
						<ZoomClip zoom={zoom} c={c} />
						<ZoomBar zoom={zoom} c={c} profile={() => profileOf(shown(), fields())} />
						<For each={chart.active()}>
							{(group) => (
								<g clip-path={zoomClip(zoom)}>
									<Show
										when={fade()}
										fallback={
											<path
												d={areaPath(points(group), floor(group), curve())}
												{...paintThrough(chart.uid, chart.fillOf(group))}
											/>
										}
									>
										<Fade
											uid={chart.uid}
											kind={props.options?.color?.gradient?.kind ?? "dither"}
											path={areaPath(points(group), floor(group), curve())}
											left={c.box().left}
											right={c.box().right}
											top={Math.min(...points(group).map(([, y]) => y))}
											bottom={c.y().zero}
										/>
									</Show>
									<path
										d={linePath(points(group), curve())}
										fill="none"
										stroke-width="2"
										class="stroke-ink"
									/>
									<Show when={props.options?.points?.enabled !== false}>
										<For each={series(group)}>
											{(datum) => (
												<g
													{...tipHandlers(chart, () => ({
														title: str(datum[fields().x]),
														rows: [{ label: group, value: chart.format(num(datum[fields().y])) }],
													}))}
												>
													<Marker
														shape="square"
														x={c.x().mid(datum[fields().x])}
														y={c.y().at(datum[fields().y])}
														size={props.options?.points?.radius ?? 6}
													/>
												</g>
											)}
										</For>
									</Show>
								</g>
							)}
						</For>
					</>
				)
			}}
		</ChartFrame>
	)
}

/** Carbon's StackedAreaChart: each series sits on the one before it, so the top
 *  edge is the total. Fills are opaque here — a stack does not overlap, and a
 *  see-through band would show the grid through the data. */
export function StackedAreaChart(props: ChartProps<LineChartOptions>) {
	const key = () => groupKey(props.options)
	const fields = () => pointFields(props.options)
	const chart = createChart({
		options: () => props.options,
		groups: () => unique(props.data, key()),
		table: () => flatTable(props.data, [key(), fields().x, fields().y]),
	})
	const shown = createMemo(() => props.data.filter((datum) => chart.isActive(str(datum[key()]))))

	/** For each x, the running total after each series: one band per series. */
	const bands = createMemo(() => {
		const keys = unique(shown(), fields().x)
		const running = new Map(keys.map((each) => [each, 0]))
		return chart.active().map((group) => {
			const rows = keys.map((each) => {
				const datum = shown().find((candidate) =>
					str(candidate[key()]) === group && str(candidate[fields().x]) === each
				)
				const from = running.get(each) ?? 0
				const amount = datum ? num(datum[fields().y]) : 0
				const to = from + (Number.isNaN(amount) ? 0 : amount)
				running.set(each, to)
				return { x: datum?.[fields().x] ?? each, from, to, amount }
			})
			return { group, rows }
		})
	})

	return (
		<ChartFrame chart={chart} class={props.class}>
			{(size) => {
				const c = createCartesian({
					data: shown,
					options: () => props.options,
					size,
					zero: true,
					padding: 0,
					values: () => bands().flatMap((band) => band.rows.flatMap((row) => [row.from, row.to])),
				})
				const curve = () => curveOf(props.options?.curve)

				return (
					<>
						<Axes c={c} />
						<For each={bands()}>
							{(band) => {
								const top = (): Point[] =>
									band.rows.map((row) => [c.x().mid(row.x), c.y().at(row.to)])
								const base = (): Point[] =>
									band.rows.map((row) => [c.x().mid(row.x), c.y().at(row.from)])
								return (
									<g>
										<path
											d={areaPath(top(), base(), curve())}
											{...paint(chart.uid, chart.fillOf(band.group))}
										/>
										<path
											d={linePath(top(), curve())}
											fill="none"
											stroke-width="2"
											class="stroke-ink"
										/>
										<For each={band.rows}>
											{(row) => (
												<rect
													x={c.x().mid(row.x) - 6}
													y={c.y().at(row.to) - 6}
													width="12"
													height="12"
													fill="transparent"
													{...tipHandlers(chart, () => ({
														title: str(row.x),
														rows: [
															{ label: band.group, value: chart.format(row.amount) },
															{ label: "running total", value: chart.format(row.to) },
														],
													}))}
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

/** Carbon's ScatterChart: one marker per datum, both axes continuous. */
export function ScatterChart(props: ChartProps<LineChartOptions>) {
	const key = () => groupKey(props.options)
	const fields = () => pointFields(props.options)
	const chart = createChart({
		options: () => props.options,
		groups: () => unique(props.data, key()),
		table: () => flatTable(props.data, [key(), fields().x, fields().y]),
		legendKind: "marker",
	})
	const shown = createMemo(() => props.data.filter((datum) => chart.isActive(str(datum[key()]))))

	return (
		<ChartFrame chart={chart} class={props.class}>
			{(size) => {
				const zoom = createZoom({
					uid: chart.uid,
					data: shown,
					options: () => props.options,
					field: () => fields().x,
				})
				const c = createCartesian({
					data: shown,
					options: zoom.options,
					size,
					padding: 0,
					inset: zoom.inset,
					values: () => visibleValues(shown(), zoom.within, fields().y),
				})
				return (
					<>
						<Axes c={c} />
						<ZoomClip zoom={zoom} c={c} />
						<ZoomBar zoom={zoom} c={c} profile={() => profileOf(shown(), fields())} />
						<For each={shown()}>
							{(datum) => (
								<g
									clip-path={zoomClip(zoom)}
									{...tipHandlers(chart, () => ({
										title: str(datum[key()]),
										rows: [
											{ label: fields().x, value: str(datum[fields().x]) },
											{ label: fields().y, value: chart.format(num(datum[fields().y])) },
										],
									}))}
								>
									<Marker
										shape={markerOf(chart.indexOf(str(datum[key()])))}
										x={c.x().mid(datum[fields().x])}
										y={c.y().at(datum[fields().y])}
										size={props.options?.points?.radius ?? 8}
									/>
								</g>
							)}
						</For>
					</>
				)
			}}
		</ChartFrame>
	)
}

export type BubbleChartOptions = CartesianOptions & {
	bubble?: {
		/** The datum key that sizes each bubble. */
		radiusMapsTo?: string
		/** Smallest and largest bubble radius, in px. */
		radiusRange?: [number, number]
	}
}

/** Carbon's BubbleChart: a scatter whose markers carry a third number as their
 *  size. Circles, because a bubble's *area* is the reading and area is honest on
 *  a circle; the fill has nothing behind it so overlapping bubbles both show. */
export function BubbleChart(props: ChartProps<BubbleChartOptions>) {
	const key = () => groupKey(props.options)
	const fields = () => pointFields(props.options)
	const sizeKey = () => props.options?.bubble?.radiusMapsTo ?? "radius"
	const chart = createChart({
		options: () => props.options,
		groups: () => unique(props.data, key()),
		table: () => flatTable(props.data, [key(), fields().x, fields().y, sizeKey()]),
		overlap: true,
	})
	const shown = createMemo(() => props.data.filter((datum) => chart.isActive(str(datum[key()]))))

	return (
		<ChartFrame chart={chart} class={props.class}>
			{(size) => {
				const c = createCartesian({ data: shown, options: () => props.options, size, padding: 0 })
				const [low, high] = extent(props.data.map((datum) => num(datum[sizeKey()])))
				const radius = (datum: Datum) => {
					const [small, large] = props.options?.bubble?.radiusRange ?? [4, 28]
					// Square root, so doubling the value doubles the area, not the width.
					const t = Math.sqrt((num(datum[sizeKey()]) - low) / (high - low || 1))
					return small + (Number.isNaN(t) ? 0 : t) * (large - small)
				}

				return (
					<>
						<Axes c={c} />
						<For each={shown()}>
							{(datum) => (
								<circle
									cx={c.x().mid(datum[fields().x])}
									cy={c.y().at(datum[fields().y])}
									r={radius(datum)}
									stroke-width="2"
									{...paintThrough(chart.uid, chart.fillOf(str(datum[key()])), "stroke-ink")}
									{...tipHandlers(chart, () => ({
										title: str(datum[key()]),
										rows: [
											{ label: fields().x, value: str(datum[fields().x]) },
											{ label: fields().y, value: chart.format(num(datum[fields().y])) },
											{ label: sizeKey(), value: chart.format(num(datum[sizeKey()])) },
										],
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

/** Carbon's LollipopChart: a bar reduced to a stem and a head. It reads like a
 *  bar chart and leaves most of the plot white, which is what it is for — many
 *  categories without a wall of ink. Runs either way, as bars do. */
export function LollipopChart(props: ChartProps<LineChartOptions>) {
	const key = () => groupKey(props.options)
	const fields = () => pointFields(props.options)
	const chart = createChart({
		options: () => props.options,
		groups: () => unique(props.data, key()),
		table: () => flatTable(props.data, [key(), fields().x, fields().y]),
		legendKind: "marker",
	})
	const shown = createMemo(() => props.data.filter((datum) => chart.isActive(str(datum[key()]))))

	return (
		<ChartFrame chart={chart} class={props.class}>
			{(size) => {
				const c = createCartesian({ data: shown, options: () => props.options, size, zero: true })
				const head = (datum: Datum): Point =>
					c.horizontal()
						? [c.val().at(datum[c.valField()]), c.cat().mid(datum[c.catField()])]
						: [c.cat().mid(datum[c.catField()]), c.val().at(datum[c.valField()])]
				const foot = (datum: Datum): Point =>
					c.horizontal()
						? [c.val().zero, c.cat().mid(datum[c.catField()])]
						: [c.cat().mid(datum[c.catField()]), c.val().zero]

				return (
					<>
						<Axes c={c} />
						<For each={shown()}>
							{(datum) => (
								<g
									{...tipHandlers(chart, () => ({
										title: str(datum[c.catField()]),
										rows: [{
											label: str(datum[key()]),
											value: chart.format(num(datum[c.valField()])),
										}],
									}))}
								>
									<line
										x1={foot(datum)[0]}
										y1={foot(datum)[1]}
										x2={head(datum)[0]}
										y2={head(datum)[1]}
										stroke-width="2"
										class="stroke-ink"
									/>
									<Marker
										shape={markerOf(chart.indexOf(str(datum[key()])))}
										x={head(datum)[0]}
										y={head(datum)[1]}
										size={props.options?.points?.radius ?? 10}
									/>
								</g>
							)}
						</For>
					</>
				)
			}}
		</ChartFrame>
	)
}

export type SparklineOptions = LineChartOptions & {
	/** Fill under the line, as an area chart does. */
	area?: boolean
}

/** Carbon's sparkline: a trend with everything but the trend removed — no axes,
 *  no legend, no toolbar — sized to sit in a table cell or beside a number.
 *
 *  One series. It is a shape to glance at, not a chart to read values off. */
export function Sparkline(props: ChartProps<SparklineOptions>) {
	const fields = () => pointFields(props.options)
	const chart = createChart({
		options: () => ({
			height: "2rem",
			...props.options,
			toolbar: { enabled: false },
			legend: { enabled: false },
		}),
		groups: () => [],
		table: () => flatTable(props.data, [fields().x, fields().y]),
	})

	return (
		<ChartFrame chart={chart} noLegend class={props.class}>
			{(size) => {
				const c = createCartesian({
					data: () => props.data,
					options: () => ({
						...props.options,
						axes: {
							left: { ...props.options?.axes?.left, visible: false, includeZero: false },
							bottom: { ...props.options?.axes?.bottom, visible: false },
						},
					}),
					size,
					padding: 0,
				})
				const curve = () => curveOf(props.options?.curve)
				const points = (): Point[] =>
					props.data.map((datum) => [c.x().mid(datum[fields().x]), c.y().at(datum[fields().y])])
				const floor = (): Point[] => points().map(([x]) => [x, c.box().bottom])

				return (
					<>
						<Show when={props.options?.area}>
							<Show
								when={props.options?.color?.gradient?.enabled}
								fallback={
									<path
										d={areaPath(points(), floor(), curve())}
										{...paintThrough(chart.uid, "hatch")}
									/>
								}
							>
								<Fade
									uid={chart.uid}
									kind={props.options?.color?.gradient?.kind ?? "dither"}
									path={areaPath(points(), floor(), curve())}
									left={c.box().left}
									right={c.box().right}
									top={Math.min(...points().map(([, y]) => y))}
									bottom={c.box().bottom}
								/>
							</Show>
						</Show>
						<path d={linePath(points(), curve())} fill="none" stroke-width="2" class="stroke-ink" />
					</>
				)
			}}
		</ChartFrame>
	)
}
