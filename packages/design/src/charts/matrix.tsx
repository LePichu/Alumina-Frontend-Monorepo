import { createMemo, For } from "solid-js"
import { Axes, createCartesian } from "./cartesian"
import type { CartesianOptions } from "./cartesian"
import { extent, num, str, unique } from "./core"
import type { ChartProps } from "./core"
import { ChartFrame, createChart, tipHandlers } from "./frame"

export type HeatmapChartOptions = CartesianOptions & {
	heatmap?: {
		/** The datum key that sets each cell's weight. Defaults to "value". */
		mapsTo?: string
	}
}

/** Carbon's HeatmapChart: a value for every pairing of two categories.
 *
 *  Carbon ramps a colour from light to dark. There is no ramp to be had in one
 *  ink without inventing a run of greys, so each cell holds an ink square whose
 *  *area* is the value: an empty cell is the minimum, a full one the maximum. It
 *  is the halftone answer — the same thing a newspaper does to print a
 *  photograph in black — and it reads at a glance the way a colour ramp does,
 *  dense where the numbers are high.
 */
export function HeatmapChart(props: ChartProps<HeatmapChartOptions>) {
	const xKey = () => props.options?.axes?.bottom?.mapsTo ?? "key"
	const yKey = () => props.options?.axes?.left?.mapsTo ?? "group"
	const valueKey = () => props.options?.heatmap?.mapsTo ?? "value"
	const range = createMemo(() => extent(props.data.map((datum) => num(datum[valueKey()]))))

	const chart = createChart({
		options: () => props.options,
		groups: () => [],
		table: () => {
			const columns = unique(props.data, xKey())
			return {
				headers: [yKey(), ...columns],
				rows: unique(props.data, yKey()).map((row) => [
					row,
					...columns.map((column) =>
						num(
							props.data.find((datum) =>
								str(datum[yKey()]) === row && str(datum[xKey()]) === column
							)?.[valueKey()],
						)
					),
				]),
			}
		},
	})

	/** 0–1 within the data's own range. */
	const weight = (value: number) => {
		const [low, high] = range()
		return Number.isNaN(value) ? 0 : (value - low) / (high - low || 1)
	}

	return (
		<ChartFrame chart={chart} noLegend class={props.class}>
			{(size) => {
				const c = createCartesian({
					data: () => props.data,
					options: () => ({
						...props.options,
						axes: {
							left: { ...props.options?.axes?.left, mapsTo: yKey(), scaleType: "labels" as const },
							bottom: {
								...props.options?.axes?.bottom,
								mapsTo: xKey(),
								scaleType: "labels" as const,
							},
						},
					}),
					size,
					padding: 0,
				})

				return (
					<>
						<For each={props.data}>
							{(datum) => {
								const x = () => c.x().at(datum[xKey()])
								const y = () => c.y().at(datum[yKey()])
								const w = () => c.x().band
								const h = () => c.y().band
								// Square root, so the ink covers a share of the cell equal to the
								// value's share of the range — area, not side.
								const side = () => Math.sqrt(weight(num(datum[valueKey()])))
								return (
									<g
										{...tipHandlers(chart, () => ({
											title: `${str(datum[yKey()])} · ${str(datum[xKey()])}`,
											rows: [{ label: valueKey(), value: chart.format(num(datum[valueKey()])) }],
										}))}
									>
										<rect
											x={x()}
											y={y()}
											width={w()}
											height={h()}
											stroke-width="1"
											class="fill-white stroke-gray"
										/>
										<rect
											x={x() + (w() * (1 - side())) / 2}
											y={y() + (h() * (1 - side())) / 2}
											width={w() * side()}
											height={h() * side()}
											class="fill-ink"
										/>
									</g>
								)
							}}
						</For>
						<Axes c={c} />
					</>
				)
			}}
		</ChartFrame>
	)
}
