import { createMemo, For, Show } from "solid-js"
import type { Accessor } from "solid-js"
import { axisModel, fitText, GLYPH, inferScaleType, NOTE_PX, scaleOf, TICK_PX } from "./core"
import type { AxisOptions, BaseChartOptions, Datum, Scale, ScaleType } from "./core"
import type { ChartSize } from "./frame"
import type { ZoomBarOptions } from "./zoom"

export type CartesianOptions = BaseChartOptions & {
	/** Carbon's axes block. `bottom` and `left` are the pair nearly every chart
	 *  uses; `right` is the second value axis of a combo chart. */
	axes?: {
		left?: AxisOptions
		bottom?: AxisOptions
		right?: AxisOptions
	}
	grid?: {
		x?: { enabled?: boolean }
		y?: { enabled?: boolean }
	}
	/** Carbon's zoom bar: a strip over the plot with a draggable window on the x
	 *  axis. Line, area and scatter charts with a continuous bottom axis. */
	zoomBar?: ZoomBarOptions
}

export type Box = {
	left: number
	top: number
	right: number
	bottom: number
	width: number
	height: number
}

export type Cartesian = {
	/** Categories run down the left axis, so bars grow to the right. */
	horizontal: Accessor<boolean>
	xField: Accessor<string>
	yField: Accessor<string>
	x: Accessor<Scale>
	y: Accessor<Scale>
	/** The second value axis, when the options declare one. */
	y2: Accessor<Scale | undefined>
	box: Accessor<Box>
	/** The same four, named by role instead of by edge — a bar chart thinks in
	 *  "category" and "value", whichever way round it is drawn. */
	catField: Accessor<string>
	valField: Accessor<string>
	cat: Accessor<Scale>
	val: Accessor<Scale>
	options: Accessor<CartesianOptions>
}

/** Resolves a chart's axes into two pixel scales and the box between them.
 *
 *  Layout is two passes because it is circular: the left margin is as wide as
 *  the widest tick label, the labels depend on the domain, and the pixel range
 *  depends on the margin. So each axis is modelled first (domain and labels, no
 *  pixels), the margins are taken from the models, and only then are the scales
 *  given a range.
 */
export function createCartesian(input: {
	data: Accessor<readonly Datum[]>
	options: Accessor<CartesianOptions | undefined>
	size: ChartSize
	/** Bars measure from zero, so their value axis must include it. */
	zero?: boolean
	/** The numbers the value axis has to span, when that is not simply every
	 *  datum's value: stack totals, the two ends of a floating bar. */
	values?: Accessor<readonly number[] | undefined>
	/** The numbers the right-hand axis has to span. */
	values2?: Accessor<readonly number[] | undefined>
	/** Gap between bands, as a fraction of the band step. */
	padding?: number
	/** Extra room to leave above the plot, in px — a zoom bar's. */
	inset?: Accessor<number>
}): Cartesian {
	const options = () => input.options() ?? {}
	const bottom = () => options().axes?.bottom ?? {}
	const left = () => options().axes?.left ?? {}
	const right = () => options().axes?.right

	const xField = () => bottom().mapsTo ?? "key"
	const yField = () => left().mapsTo ?? "value"
	const xType = (): ScaleType => bottom().scaleType ?? inferScaleType(input.data(), xField())
	const yType = (): ScaleType => left().scaleType ?? inferScaleType(input.data(), yField())
	const horizontal = () => yType() === "labels" && xType() !== "labels"

	const column = (field: string) => input.data().map((datum) => datum[field])

	const xModel = createMemo(() =>
		axisModel(
			xType(),
			(horizontal() ? input.values?.() : undefined) ?? column(xField()),
			bottom(),
			horizontal() && input.zero,
		)
	)
	const yModel = createMemo(() =>
		axisModel(
			yType(),
			(horizontal() ? undefined : input.values?.()) ?? column(yField()),
			left(),
			!horizontal() && input.zero,
		)
	)
	const y2Model = createMemo(() => {
		const axis = right()
		const values = input.values2?.()
		if (!axis || !values) return undefined
		return axisModel(axis.scaleType ?? "linear", values, axis, input.zero)
	})

	const box = createMemo<Box>(() => {
		const y = yModel()
		const x = xModel()
		const y2 = y2Model()
		// A category down the left can be long; cap it and let the label truncate.
		const leftLabels = Math.min(y.widest, y.type === "labels" ? 16 : 12) * TICK_PX * GLYPH
		const marginLeft = left().visible === false ? 2 : leftLabels + 10 + (left().title ? 14 : 0)
		const marginBottom = bottom().visible === false ? 2 : 20 + (bottom().title ? 14 : 0)
		// A continuous bottom axis ends on a centred label, half of which overhangs.
		const overhang = x.type === "labels" ? 4 : (x.widest * TICK_PX * GLYPH) / 2 + 2
		const marginRight = y2 ? y2.widest * TICK_PX * GLYPH + 10 + (right()?.title ? 14 : 0) : overhang
		const leftEdge = marginLeft
		const rightEdge = Math.max(leftEdge + 20, input.size.width() - marginRight)
		const topEdge = 8 + (input.inset?.() ?? 0)
		const bottomEdge = Math.max(topEdge + 20, input.size.height() - marginBottom)
		return {
			left: leftEdge,
			top: topEdge,
			right: rightEdge,
			bottom: bottomEdge,
			width: rightEdge - leftEdge,
			height: bottomEdge - topEdge,
		}
	})

	const x = createMemo(() => scaleOf(xModel(), [box().left, box().right], input.padding))
	// A value axis grows upward, so its range is bottom-to-top; a category axis
	// down the left reads top-to-bottom like any list.
	const y = createMemo(() =>
		scaleOf(
			yModel(),
			yModel().type === "labels" ? [box().top, box().bottom] : [box().bottom, box().top],
			input.padding,
		)
	)
	const y2 = createMemo(() => {
		const model = y2Model()
		return model ? scaleOf(model, [box().bottom, box().top]) : undefined
	})

	return {
		horizontal,
		xField,
		yField,
		x,
		y,
		y2,
		box,
		catField: () => (horizontal() ? yField() : xField()),
		valField: () => (horizontal() ? xField() : yField()),
		cat: () => (horizontal() ? y() : x()),
		val: () => (horizontal() ? x() : y()),
		options,
	}
}

/** Grid, axis lines, tick labels and titles.
 *
 *  The axes are ink at the system's 2px; the grid is --color-gray and hairline,
 *  because a full-weight grid would outvote the data it is there to help read.
 *  It is the one place a chart uses the grey, and it is the grey the prototypes
 *  already use for a divider.
 */
export function Axes(props: { c: Cartesian }) {
	const c = () => props.c
	const box = () => c().box()
	const axes = () => c().options().axes ?? {}
	const grid = () => c().options().grid ?? {}

	const showLeft = () => axes().left?.visible !== false
	const showBottom = () => axes().bottom?.visible !== false
	// Grid lines follow value axes only: a rule through the middle of every bar's
	// category tells you nothing the bar does not.
	const gridY = () => grid().y?.enabled !== false && c().y().type !== "labels"
	const gridX = () => grid().x?.enabled !== false && c().x().type !== "labels"

	/** Room for one bottom label before it runs into its neighbour. */
	const step = () => {
		const ticks = c().x().ticks
		return ticks.length > 1 ? Math.abs((ticks[1]?.at ?? 0) - (ticks[0]?.at ?? 0)) : box().width
	}

	return (
		<g>
			<Show when={gridY()}>
				<For each={c().y().ticks}>
					{(tick) => (
						<line
							x1={box().left}
							x2={box().right}
							y1={tick.at}
							y2={tick.at}
							stroke-width="1"
							class="stroke-gray"
						/>
					)}
				</For>
			</Show>
			<Show when={gridX()}>
				<For each={c().x().ticks}>
					{(tick) => (
						<line
							x1={tick.at}
							x2={tick.at}
							y1={box().top}
							y2={box().bottom}
							stroke-width="1"
							class="stroke-gray"
						/>
					)}
				</For>
			</Show>

			<Show when={showLeft()}>
				<line
					x1={box().left}
					x2={box().left}
					y1={box().top}
					y2={box().bottom}
					stroke-width="2"
					class="stroke-ink"
				/>
				<For each={c().y().ticks}>
					{(tick) => (
						<text
							x={box().left - 6}
							y={tick.at}
							text-anchor="end"
							dominant-baseline="central"
							font-size={String(TICK_PX)}
							class="fill-ink"
						>
							{fitText(tick.label, box().left - 10 - (axes().left?.title ? 14 : 0))}
						</text>
					)}
				</For>
				<Show when={axes().left?.title}>
					{(title) => (
						<text
							transform={`translate(${NOTE_PX},${(box().top + box().bottom) / 2}) rotate(-90)`}
							text-anchor="middle"
							font-size={String(NOTE_PX)}
							class="fill-ink font-bold uppercase"
						>
							{title()}
						</text>
					)}
				</Show>
			</Show>

			<Show when={c().y2()}>
				{(y2) => (
					<>
						<line
							x1={box().right}
							x2={box().right}
							y1={box().top}
							y2={box().bottom}
							stroke-width="2"
							class="stroke-ink"
						/>
						<For each={y2().ticks}>
							{(tick) => (
								<text
									x={box().right + 6}
									y={tick.at}
									dominant-baseline="central"
									font-size={String(TICK_PX)}
									class="fill-ink"
								>
									{tick.label}
								</text>
							)}
						</For>
					</>
				)}
			</Show>

			<Show when={showBottom()}>
				<line
					x1={box().left}
					x2={box().right}
					y1={box().bottom}
					y2={box().bottom}
					stroke-width="2"
					class="stroke-ink"
				/>
				<For each={c().x().ticks}>
					{(tick) => (
						<text
							x={tick.at}
							y={box().bottom + 12}
							text-anchor="middle"
							font-size={String(TICK_PX)}
							class="fill-ink"
						>
							{fitText(tick.label, step() - 4)}
						</text>
					)}
				</For>
				<Show when={axes().bottom?.title}>
					{(title) => (
						<text
							x={(box().left + box().right) / 2}
							y={box().bottom + 30}
							text-anchor="middle"
							font-size={String(NOTE_PX)}
							class="fill-ink font-bold uppercase"
						>
							{title()}
						</text>
					)}
				</Show>
			</Show>
		</g>
	)
}
