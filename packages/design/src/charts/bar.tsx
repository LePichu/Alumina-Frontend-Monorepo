import { createMemo, For } from "solid-js"
import { Axes, createCartesian } from "./cartesian"
import type { Cartesian, CartesianOptions } from "./cartesian"
import { num, str, sum, unique } from "./core"
import type { ChartProps, Datum } from "./core"
import { paint } from "./fills"
import { ChartFrame, createChart, tipHandlers } from "./frame"
import type { Chart, Tip } from "./frame"

export type BarChartOptions = CartesianOptions & {
	bars?: {
		/** Widest a single bar may grow, in px. Two categories on a wide chart
		 *  would otherwise be two slabs. */
		maxWidth?: number
	}
}

const groupKey = (options: BarChartOptions | undefined) => options?.data?.groupMapsTo ?? "group"

/** Which datum key is the category and which the value. Read from the options
 *  directly rather than from the resolved scales, because the scales' own domain
 *  depends on the answer. */
function barFields(options: BarChartOptions | undefined, fallbackCategory = "key") {
	const bottom = options?.axes?.bottom
	const left = options?.axes?.left
	const flat = left?.scaleType === "labels"
	return {
		category: (flat ? left?.mapsTo : bottom?.mapsTo) ?? fallbackCategory,
		value: (flat ? bottom?.mapsTo : left?.mapsTo) ?? "value",
	}
}

/** One bar, in whichever direction the chart runs: `from`/`to` are positions on
 *  the value axis, `start`/`thickness` on the category axis. */
function Bar(props: {
	c: Cartesian
	chart: Chart
	group: string
	start: number
	thickness: number
	from: number
	to: number
	tip: () => Tip
}) {
	const low = () => Math.min(props.from, props.to)
	const length = () => Math.abs(props.to - props.from)
	const flat = () => props.c.horizontal()

	return (
		<rect
			x={flat() ? low() : props.start}
			y={flat() ? props.start : low()}
			width={flat() ? length() : props.thickness}
			height={flat() ? props.thickness : length()}
			stroke-width="2"
			{...paint(props.chart.uid, props.chart.fillOf(props.group), "stroke-ink")}
			{...tipHandlers(props.chart, props.tip)}
		/>
	)
}

/** A floating bar's value is a pair; an ordinary bar measures from zero. */
function span(value: unknown): [number, number] {
	if (Array.isArray(value)) return [num(value[0]), num(value[1])]
	return [0, num(value)]
}

/** Carbon's SimpleBarChart: one bar per datum. A value given as `[low, high]`
 *  floats — it starts where the low end is rather than on the axis.
 *
 *  Vertical when the categories are on the bottom axis, horizontal when they are
 *  on the left; the options decide, as they do in Carbon. */
export function SimpleBarChart(props: ChartProps<BarChartOptions>) {
	const key = () => groupKey(props.options)
	const fields = () => barFields(props.options, key())
	const chart = createChart({
		options: () => props.options,
		groups: () => unique(props.data, key()),
		table: () => ({
			headers: [fields().category, fields().value],
			rows: props.data.map((datum) => {
				const value = datum[fields().value]
				return [
					str(datum[fields().category]),
					Array.isArray(value) ? value.join(" – ") : num(value),
				]
			}),
		}),
	})
	const shown = createMemo(() => props.data.filter((datum) => chart.isActive(str(datum[key()]))))

	return (
		<ChartFrame chart={chart} class={props.class}>
			{(size) => {
				const c = createCartesian({
					data: shown,
					options: () => props.options,
					size,
					zero: true,
					values: () => shown().flatMap((datum) => span(datum[fields().value])),
				})
				const thickness = () => Math.min(c.cat().band, props.options?.bars?.maxWidth ?? 64)

				return (
					<>
						<Axes c={c} />
						<For each={shown()}>
							{(datum) => {
								const ends = () => span(datum[c.valField()])
								return (
									<Bar
										c={c}
										chart={chart}
										group={str(datum[key()])}
										start={c.cat().at(datum[c.catField()]) + (c.cat().band - thickness()) / 2}
										thickness={thickness()}
										from={c.val().at(ends()[0])}
										to={c.val().at(ends()[1])}
										tip={() => ({
											title: str(datum[c.catField()]),
											rows: [{
												label: str(datum[key()]),
												value: Array.isArray(datum[c.valField()])
													? `${chart.format(ends()[0])} – ${chart.format(ends()[1])}`
													: chart.format(ends()[1]),
											}],
										})}
									/>
								)
							}}
						</For>
					</>
				)
			}}
		</ChartFrame>
	)
}

/** The table every keyed bar chart opens: one row per category, one column per
 *  series. */
function keyedTable(data: readonly Datum[], group: string, category: string, value: string) {
	const groups = unique(data, group)
	const categories = unique(data, category)
	return {
		headers: [category, ...groups],
		rows: categories.map((each) => [
			each,
			...groups.map((name) =>
				sum(
					data
						.filter((datum) => str(datum[category]) === each && str(datum[group]) === name)
						.map((datum) => num(datum[value])),
				)
			),
		]),
	}
}

/** Carbon's GroupedBarChart: within each category, one bar per series, side by
 *  side. Hiding a series from the legend closes its slot, so the rest widen. */
export function GroupedBarChart(props: ChartProps<BarChartOptions>) {
	const key = () => groupKey(props.options)
	const fields = () => barFields(props.options)
	const chart = createChart({
		options: () => props.options,
		groups: () => unique(props.data, key()),
		table: () => keyedTable(props.data, key(), fields().category, fields().value),
	})
	const shown = createMemo(() => props.data.filter((datum) => chart.isActive(str(datum[key()]))))

	return (
		<ChartFrame chart={chart} class={props.class}>
			{(size) => {
				const c = createCartesian({ data: shown, options: () => props.options, size, zero: true })
				const slot = () => c.cat().band / Math.max(1, chart.active().length)
				const thickness = () => Math.min(slot(), props.options?.bars?.maxWidth ?? 32)

				return (
					<>
						<Axes c={c} />
						<For each={shown()}>
							{(datum) => {
								const group = () => str(datum[key()])
								return (
									<Bar
										c={c}
										chart={chart}
										group={group()}
										start={c.cat().at(datum[c.catField()]) +
											chart.active().indexOf(group()) * slot() + (slot() - thickness()) / 2}
										thickness={thickness()}
										from={c.val().zero}
										to={c.val().at(datum[c.valField()])}
										tip={() => ({
											title: str(datum[c.catField()]),
											rows: [{ label: group(), value: chart.format(num(datum[c.valField()])) }],
										})}
									/>
								)
							}}
						</For>
					</>
				)
			}}
		</ChartFrame>
	)
}

type Segment = { datum: Datum; group: string; from: number; to: number }

/** Stacks each category's series in legend order. Positive and negative values
 *  build away from zero separately, so a negative never eats into a positive. */
function stack(
	data: readonly Datum[],
	groups: readonly string[],
	group: string,
	category: string,
	value: string,
): Segment[] {
	const segments: Segment[] = []
	for (const each of unique(data, category)) {
		let up = 0
		let down = 0
		for (const name of groups) {
			for (const datum of data) {
				if (str(datum[category]) !== each || str(datum[group]) !== name) continue
				const amount = num(datum[value])
				if (Number.isNaN(amount)) continue
				if (amount >= 0) {
					segments.push({ datum, group: name, from: up, to: up + amount })
					up += amount
				} else {
					segments.push({ datum, group: name, from: down, to: down + amount })
					down += amount
				}
			}
		}
	}
	return segments
}

/** Carbon's StackedBarChart: within each category, the series sit on top of one
 *  another, so the bar's full height is the category's total. */
export function StackedBarChart(props: ChartProps<BarChartOptions>) {
	const key = () => groupKey(props.options)
	const fields = () => barFields(props.options)
	const chart = createChart({
		options: () => props.options,
		groups: () => unique(props.data, key()),
		table: () => keyedTable(props.data, key(), fields().category, fields().value),
	})
	const shown = createMemo(() => props.data.filter((datum) => chart.isActive(str(datum[key()]))))
	const segments = createMemo(() =>
		stack(shown(), chart.active(), key(), fields().category, fields().value)
	)

	return (
		<ChartFrame chart={chart} class={props.class}>
			{(size) => {
				const c = createCartesian({
					data: shown,
					options: () => props.options,
					size,
					zero: true,
					values: () => segments().flatMap((segment) => [segment.from, segment.to]),
				})
				const thickness = () => Math.min(c.cat().band, props.options?.bars?.maxWidth ?? 64)

				return (
					<>
						<Axes c={c} />
						<For each={segments()}>
							{(segment) => (
								<Bar
									c={c}
									chart={chart}
									group={segment.group}
									start={c.cat().at(segment.datum[c.catField()]) + (c.cat().band - thickness()) / 2}
									thickness={thickness()}
									from={c.val().at(segment.from)}
									to={c.val().at(segment.to)}
									tip={() => ({
										title: str(segment.datum[c.catField()]),
										rows: [{
											label: segment.group,
											value: chart.format(segment.to - segment.from),
										}],
									})}
								/>
							)}
						</For>
					</>
				)
			}}
		</ChartFrame>
	)
}
