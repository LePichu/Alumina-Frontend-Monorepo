import { createMemo, For, Show } from "solid-js"
import type { JSX } from "solid-js"
import {
	arcPath,
	axisModel,
	fitText,
	NOTE_PX,
	num,
	polar,
	scaleOf,
	str,
	sum,
	TICK_PX,
	unique,
} from "./core"
import type { BaseChartOptions, ChartProps, Point } from "./core"
import { dashOf, Marker, markerOf, paint, paintThrough } from "./fills"
import { ChartFrame, createChart, tipHandlers } from "./frame"
import type { ChartSize } from "./frame"

const groupKey = (options: BaseChartOptions | undefined) => options?.data?.groupMapsTo ?? "group"

const TURN = Math.PI * 2

/** Whole-number percentages that still add up to 100. */
function percent(value: number, total: number): string {
	if (total === 0) return "0%"
	const share = (value / total) * 100
	return `${share >= 10 || share === 0 ? Math.round(share) : share.toFixed(1)}%`
}

// ---------------------------------------------------------------------------
// pie and donut

export type PieChartOptions = BaseChartOptions & {
	pie?: {
		/** Percentage labels around the rim. On by default. */
		labels?: { enabled?: boolean }
	}
}

export type DonutChartOptions = PieChartOptions & {
	donut?: {
		center?: {
			/** The caption under the total in the hole. */
			label?: string
			/** Overrides the total shown in the hole. */
			number?: number
		}
	}
}

type Slice = { group: string; value: number; start: number; end: number }

function slices(groups: readonly string[], valueOf: (group: string) => number): Slice[] {
	const total = sum(groups.map(valueOf))
	let angle = 0
	return groups.map((group) => {
		const value = valueOf(group)
		const start = angle
		angle += total === 0 ? 0 : (value / total) * TURN
		return { group, value, start, end: angle }
	})
}

/** The slices themselves, shared by pie and donut — a donut is a pie with a
 *  hole, and the only thing that differs is `inner`. */
function Slices(props: {
	chart: ReturnType<typeof createChart>
	size: ChartSize
	inner: (radius: number) => number
	valueOf: (group: string) => number
	labels: boolean
	children?: (centre: { x: number; y: number; radius: number }) => JSX.Element
}) {
	const cx = () => props.size.width() / 2
	const cy = () => props.size.height() / 2
	// Room for a "100%" label on every side when the labels are on.
	const radius = () =>
		Math.max(10, Math.min(props.size.width(), props.size.height()) / 2 - (props.labels ? 26 : 4))
	const all = createMemo(() => slices(props.chart.active(), props.valueOf))
	const total = () => sum(all().map((slice) => slice.value))

	return (
		<>
			<For each={all()}>
				{(slice) => (
					<path
						d={arcPath(cx(), cy(), props.inner(radius()), radius(), slice.start, slice.end)}
						stroke-width="2"
						stroke-linejoin="round"
						{...paint(props.chart.uid, props.chart.fillOf(slice.group), "stroke-ink")}
						{...tipHandlers(props.chart, () => ({
							title: slice.group,
							rows: [
								{ label: "value", value: props.chart.format(slice.value) },
								{ label: "share", value: percent(slice.value, total()) },
							],
						}))}
					/>
				)}
			</For>
			<Show when={props.labels}>
				<For each={all()}>
					{(slice) => {
						const middle = () => (slice.start + slice.end) / 2
						const at = (): Point => polar(cx(), cy(), radius() + 12, middle())
						return (
							// A sliver's label would sit on top of its neighbours'.
							<Show when={slice.end - slice.start > 0.12}>
								<text
									x={at()[0]}
									y={at()[1]}
									text-anchor={Math.sin(middle()) > 0.2
										? "start"
										: Math.sin(middle()) < -0.2
										? "end"
										: "middle"}
									dominant-baseline="central"
									font-size={String(TICK_PX)}
									class="pointer-events-none fill-ink"
								>
									{percent(slice.value, total())}
								</text>
							</Show>
						)
					}}
				</For>
			</Show>
			{props.children?.({ x: cx(), y: cy(), radius: radius() })}
		</>
	)
}

function shareTable(data: ChartProps<unknown>["data"], key: string) {
	const total = sum(data.map((datum) => num(datum["value"])))
	return {
		headers: [key, "value", "share"],
		rows: data.map((datum) => [
			str(datum[key]),
			num(datum["value"]),
			percent(num(datum["value"]), total),
		]),
	}
}

/** Carbon's PieChart: parts of a whole. Slices are told apart by fill and
 *  separated by an ink line, since two patterns meeting with nothing between
 *  them blur into one. */
export function PieChart(props: ChartProps<PieChartOptions>) {
	const key = () => groupKey(props.options)
	const chart = createChart({
		options: () => props.options,
		groups: () => unique(props.data, key()),
		table: () => shareTable(props.data, key()),
	})
	const valueOf = (group: string) =>
		sum(
			props.data.filter((datum) => str(datum[key()]) === group).map((datum) => num(datum["value"])),
		)

	return (
		<ChartFrame chart={chart} class={props.class}>
			{(size) => (
				<Slices
					chart={chart}
					size={size}
					inner={() => 0}
					valueOf={valueOf}
					labels={props.options?.pie?.labels?.enabled !== false}
				/>
			)}
		</ChartFrame>
	)
}

/** Carbon's DonutChart: a pie with the middle taken out and the total put
 *  there, so the one number everybody wants does not need a legend to find. */
export function DonutChart(props: ChartProps<DonutChartOptions>) {
	const key = () => groupKey(props.options)
	const chart = createChart({
		options: () => props.options,
		groups: () => unique(props.data, key()),
		table: () => shareTable(props.data, key()),
	})
	const valueOf = (group: string) =>
		sum(
			props.data.filter((datum) => str(datum[key()]) === group).map((datum) => num(datum["value"])),
		)
	const total = () => props.options?.donut?.center?.number ?? sum(chart.active().map(valueOf))

	return (
		<ChartFrame chart={chart} class={props.class}>
			{(size) => (
				<Slices
					chart={chart}
					size={size}
					inner={(radius) => radius * 0.68}
					valueOf={valueOf}
					labels={props.options?.pie?.labels?.enabled !== false}
				>
					{(centre) => (
						<g class="pointer-events-none">
							<text
								x={centre.x}
								y={centre.y - 2}
								text-anchor="middle"
								font-size={String(Math.max(14, Math.round(centre.radius / 4)))}
								class="fill-ink font-bold"
							>
								{chart.format(total())}
							</text>
							<Show when={props.options?.donut?.center?.label}>
								{(label) => (
									<text
										x={centre.x}
										y={centre.y + 14}
										text-anchor="middle"
										font-size={String(TICK_PX)}
										class="fill-ink uppercase"
									>
										{fitText(label(), centre.radius * 1.1)}
									</text>
								)}
							</Show>
						</g>
					)}
				</Slices>
			)}
		</ChartFrame>
	)
}

// ---------------------------------------------------------------------------
// gauge

export type GaugeChartOptions = BaseChartOptions & {
	gauge?: {
		/** A half-dial (the default) or a full ring. */
		type?: "semi" | "full"
		/** Thickness of the arc, in px. */
		arcWidth?: number
		/** What the value is out of. Carbon's gauge is a percentage, so 100. */
		max?: number
		numberFormatter?: (value: number) => string
	}
}

/** Carbon's GaugeChart: one number as a share of a dial.
 *
 *  Data is two rows, `{ group: "value", value }` and optionally
 *  `{ group: "delta", value }` for the change since last time. Carbon colours
 *  the delta green or red; here its sign is a triangle that points the way it
 *  moved, and the word after it. */
export function GaugeChart(props: ChartProps<GaugeChartOptions>) {
	const read = (group: string) =>
		num(props.data.find((datum) => str(datum["group"]) === group)?.["value"])
	const value = () => read("value")
	const delta = () => read("delta")
	const max = () => props.options?.gauge?.max ?? 100
	const format = (amount: number) =>
		props.options?.gauge?.numberFormatter?.(amount) ?? `${Number(amount.toFixed(1))}%`

	const chart = createChart({
		options: () => props.options,
		groups: () => [],
		table: () => ({
			headers: ["measure", "value"],
			rows: props.data.map((datum) => [str(datum["group"]), num(datum["value"])]),
		}),
	})

	return (
		<ChartFrame chart={chart} noLegend class={props.class}>
			{(size) => {
				const semi = () => props.options?.gauge?.type !== "full"
				const thick = () => props.options?.gauge?.arcWidth ?? 16
				// A half-dial is twice as wide as it is tall, so it is sized off the
				// tighter of the two and sits on the plot's lower edge.
				const radius = () =>
					Math.max(
						20,
						semi()
							? Math.min(size.width() / 2, size.height() - 24) - 4
							: Math.min(size.width(), size.height()) / 2 - 4,
					)
				const cx = () => size.width() / 2
				const cy = () => (semi() ? (size.height() + radius()) / 2 - 8 : size.height() / 2)
				const from = () => (semi() ? -Math.PI / 2 : 0)
				const span = () => (semi() ? Math.PI : TURN)
				const share = () => Math.min(1, Math.max(0, (Number.isNaN(value()) ? 0 : value()) / max()))

				return (
					<g
						{...tipHandlers(chart, () => ({
							rows: [
								{ label: "value", value: format(value()) },
								...(Number.isNaN(delta()) ? [] : [{ label: "change", value: format(delta()) }]),
							],
						}))}
					>
						<path
							d={arcPath(cx(), cy(), radius() - thick(), radius(), from(), from() + span())}
							stroke-width="2"
							class="fill-white stroke-ink"
						/>
						<Show when={share() > 0}>
							<path
								d={arcPath(
									cx(),
									cy(),
									radius() - thick(),
									radius(),
									from(),
									from() + span() * share(),
								)}
								stroke-width="2"
								class="fill-ink stroke-ink"
							/>
						</Show>
						<text
							x={cx()}
							y={semi() ? cy() - radius() * 0.28 : cy() - 2}
							text-anchor="middle"
							font-size={String(Math.max(16, Math.round(radius() / 3)))}
							class="pointer-events-none fill-ink font-bold"
						>
							{format(value())}
						</text>
						<Show when={!Number.isNaN(delta())}>
							<g class="pointer-events-none">
								{/* The triangle points the way the value moved. */}
								<path
									d={delta() >= 0
										? `M${cx() - 30},${(semi() ? cy() - 2 : cy() + 22)}l5,-8l5,8Z`
										: `M${cx() - 30},${(semi() ? cy() - 10 : cy() + 14)}l5,8l5,-8Z`}
									class="fill-ink"
								/>
								<text
									x={cx() - 16}
									y={semi() ? cy() - 2 : cy() + 22}
									font-size={String(TICK_PX)}
									class="fill-ink"
								>
									{format(Math.abs(delta()))}
								</text>
							</g>
						</Show>
					</g>
				)
			}}
		</ChartFrame>
	)
}

// ---------------------------------------------------------------------------
// radar

export type RadarChartOptions = BaseChartOptions & {
	radar?: {
		axes?: {
			/** The datum key that names each spoke. */
			angle?: string
			/** The datum key measured along it. */
			value?: string
		}
	}
}

/** Carbon's RadarChart: several measures of the same thing, one per spoke, so a
 *  series becomes a shape and two series can be compared by outline.
 *
 *  Each series is a polygon with its own dash and marker; the fill has nothing
 *  behind its ink, because the whole point is to see one shape through another. */
export function RadarChart(props: ChartProps<RadarChartOptions>) {
	const key = () => groupKey(props.options)
	const angleKey = () => props.options?.radar?.axes?.angle ?? "key"
	const valueKey = () => props.options?.radar?.axes?.value ?? "value"
	const chart = createChart({
		options: () => props.options,
		groups: () => unique(props.data, key()),
		table: () => {
			const groups = unique(props.data, key())
			return {
				headers: [angleKey(), ...groups],
				rows: unique(props.data, angleKey()).map((spoke) => [
					spoke,
					...groups.map((group) =>
						num(
							props.data.find((datum) =>
								str(datum[key()]) === group && str(datum[angleKey()]) === spoke
							)?.[valueKey()],
						)
					),
				]),
			}
		},
		legendKind: "fill",
		overlap: true,
	})
	const spokes = createMemo(() => unique(props.data, angleKey()))

	return (
		<ChartFrame chart={chart} class={props.class}>
			{(size) => {
				const cx = () => size.width() / 2
				const cy = () => size.height() / 2
				const radius = () => Math.max(20, Math.min(size.width() / 2 - 70, size.height() / 2 - 18))
				const scale = createMemo(() =>
					scaleOf(
						axisModel(
							"linear",
							props.data.map((datum) => datum[valueKey()]),
							{ ticks: { number: 4 } },
							true,
						),
						[0, radius()],
					)
				)
				const angle = (spoke: string) =>
					(spokes().indexOf(spoke) / Math.max(1, spokes().length)) * TURN
				const ring = (at: number) =>
					`${
						spokes().map((spoke, i) =>
							`${i === 0 ? "M" : "L"}${polar(cx(), cy(), at, angle(spoke)).join(",")}`
						).join("")
					}Z`
				const vertex = (group: string, spoke: string): Point => {
					const datum = props.data.find((each) =>
						str(each[key()]) === group && str(each[angleKey()]) === spoke
					)
					return polar(cx(), cy(), scale().at(datum?.[valueKey()] ?? 0), angle(spoke))
				}
				const outline = (group: string) =>
					`${
						spokes().map((spoke, i) => `${i === 0 ? "M" : "L"}${vertex(group, spoke).join(",")}`)
							.join("")
					}Z`

				return (
					<>
						<For each={scale().ticks.slice(1)}>
							{(tick) => (
								<path
									d={ring(tick.at)}
									fill="none"
									stroke-width="1"
									class="stroke-gray"
								/>
							)}
						</For>
						<For each={spokes()}>
							{(spoke) => {
								const rim = (): Point => polar(cx(), cy(), radius(), angle(spoke))
								const label = (): Point => polar(cx(), cy(), radius() + 10, angle(spoke))
								return (
									<>
										<line
											x1={cx()}
											y1={cy()}
											x2={rim()[0]}
											y2={rim()[1]}
											stroke-width="1"
											class="stroke-gray"
										/>
										<text
											x={label()[0]}
											y={label()[1]}
											text-anchor={Math.sin(angle(spoke)) > 0.2
												? "start"
												: Math.sin(angle(spoke)) < -0.2
												? "end"
												: "middle"}
											dominant-baseline="central"
											font-size={String(TICK_PX)}
											class="fill-ink"
										>
											{fitText(spoke, 64)}
										</text>
									</>
								)
							}}
						</For>
						<For each={scale().ticks.slice(1)}>
							{(tick) => (
								<text
									x={cx() + 3}
									y={cy() - tick.at - 3}
									font-size={String(NOTE_PX)}
									class="pointer-events-none fill-ink opacity-muted"
								>
									{tick.label}
								</text>
							)}
						</For>
						<For each={chart.active()}>
							{(group) => (
								<g>
									<path
										d={outline(group)}
										stroke-width="2"
										stroke-linejoin="round"
										stroke-dasharray={dashOf(chart.indexOf(group))}
										{...paintThrough(chart.uid, chart.fillOf(group), "stroke-ink")}
									/>
									<For each={spokes()}>
										{(spoke) => (
											<g
												{...tipHandlers(chart, () => ({
													title: spoke,
													rows: [{
														label: group,
														value: chart.format(
															num(
																props.data.find((each) =>
																	str(each[key()]) === group && str(each[angleKey()]) === spoke
																)?.[valueKey()],
															),
														),
													}],
												}))}
											>
												<Marker
													shape={markerOf(chart.indexOf(group))}
													x={vertex(group, spoke)[0]}
													y={vertex(group, spoke)[1]}
													size={6}
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
