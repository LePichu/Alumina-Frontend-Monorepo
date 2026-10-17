import { createMemo, createSignal, createUniqueId, For, onCleanup, onMount, Show } from "solid-js"
import type { Accessor, JSX } from "solid-js"
import DataTable from "@carbon/icons/es/data-table/16"
import Download from "@carbon/icons/es/download/16"
import { Icon } from "../icons/Icon"
import { SKELETON } from "../internal/skeleton"
import { BOX, LABEL } from "../internal/styles"
import { FILLS, Swatch } from "../alumina/Swatch/Swatch"
import type { Fill } from "../alumina/Swatch/Swatch"
import { Button } from "../carbon/Button/Button"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "../carbon/DataTable/Table"
import { IconButton } from "../carbon/IconButton/IconButton"
import { Modal } from "../carbon/Modal/Modal"
import { OverflowMenu, OverflowMenuItem } from "../carbon/OverflowMenu/OverflowMenu"
import { formatNumber, GLYPH, TICK_PX } from "./core"
import type { BaseChartOptions } from "./core"
import { fileName, save, toCsv, toPng } from "./export"
import { dashOf, FillDefs, Marker, markerOf, THROUGH_FILLS } from "./fills"

/** What a chart's tooltip says: an optional heading, then label/value rows. */
export type Tip = {
	title?: string
	rows: { label: string; value: string; group?: string }[]
}

type TipState = Tip & { x: number; y: number; flip: boolean }

export type ChartSize = { width: Accessor<number>; height: Accessor<number> }

/** The data behind a chart, as rows — what "Show as table" opens. */
export type ChartTable = { headers: string[]; rows: (string | number)[][] }

export type Chart = {
	/** Scopes this chart's pattern ids. */
	uid: string
	options: Accessor<BaseChartOptions>
	/** Every series, in legend order. */
	groups: Accessor<string[]>
	/** The series currently shown. */
	active: Accessor<string[]>
	isActive: (group: string) => boolean
	toggle: (group: string) => void
	fillOf: (group: string) => Fill
	/** A series' position in the legend: what its dash and marker cycle on. */
	indexOf: (group: string) => number
	format: (value: number) => string
	table: Accessor<ChartTable>
	/** How a series' legend entry is drawn. */
	legendKind: (group: string) => LegendKind
	showTip: (event: PointerEvent, tip: Tip) => void
	hideTip: () => void
	/** Internal — the frame reads and writes these. */
	tip: Accessor<TipState | undefined>
	attach: (el: HTMLElement) => void
}

/** What stands for a series in the legend: a swatch of its fill, a run of its
 *  line with its marker on it, or the marker alone. */
export type LegendKind = "fill" | "line" | "marker"

/** State every chart shares: which series are hidden, which fill each wears, and
 *  where the tooltip is.
 *
 *  A hook rather than a context, so a chart's own component can read `active()`
 *  while computing its scales — the scales depend on which series are showing,
 *  and a context would only be reachable from inside the frame's children.
 */
export function createChart(input: {
	options: Accessor<BaseChartOptions | undefined>
	groups: Accessor<string[]>
	table: Accessor<ChartTable>
	/** One kind for every series, or a function when they differ — a combo chart
	 *  has bars and lines in the same legend. */
	legendKind?: LegendKind | ((group: string) => LegendKind)
	/** The chart's marks overlap, so every series needs a fill that can be seen
	 *  through. Fills are then handed out from the patterned ones only. */
	overlap?: boolean
}): Chart {
	const options = () => input.options() ?? {}
	const [hidden, setHidden] = createSignal<string[]>([])
	const [tip, setTip] = createSignal<TipState>()
	let container: HTMLElement | undefined

	const active = createMemo(() => input.groups().filter((group) => !hidden().includes(group)))
	const indexOf = (group: string) => Math.max(0, input.groups().indexOf(group))

	return {
		uid: `chart-${createUniqueId()}`,
		options,
		groups: input.groups,
		active,
		isActive: (group) => !hidden().includes(group),
		toggle: (group) =>
			setHidden((current) =>
				current.includes(group) ? current.filter((each) => each !== group) : [...current, group]
			),
		fillOf: (group) => {
			const palette = input.overlap ? THROUGH_FILLS : FILLS
			return options().fills?.[group] ?? palette[indexOf(group) % palette.length] ?? "solid"
		},
		indexOf,
		format: (value) => options().tooltip?.valueFormatter?.(value) ?? formatNumber(value),
		table: input.table,
		legendKind: (group) => {
			const kind = input.legendKind ?? "fill"
			return typeof kind === "function" ? kind(group) : kind
		},
		showTip: (event, next) => {
			if (!container || options().tooltip?.enabled === false) return
			const box = container.getBoundingClientRect()
			const x = event.clientX - box.left
			setTip({ ...next, x, y: event.clientY - box.top, flip: x > box.width / 2 })
		},
		hideTip: () => setTip(undefined),
		tip,
		attach: (el) => {
			container = el
		},
	}
}

/** Pointer handlers for a mark. Pointer events, not mouse events, so a finger
 *  gets the same readout as a cursor; a touch that ends dismisses it. */
export function tipHandlers(chart: Chart, tip: () => Tip) {
	return {
		onPointerEnter: (event: PointerEvent) => chart.showTip(event, tip()),
		onPointerMove: (event: PointerEvent) => chart.showTip(event, tip()),
		onPointerLeave: () => chart.hideTip(),
		onPointerCancel: () => chart.hideTip(),
	}
}

export type ChartFrameProps = {
	chart: Chart
	/** Hides the legend whatever the options say — for charts whose marks are
	 *  already labelled, or that have a single series. */
	noLegend?: boolean
	class?: string
	/** Draws the plot. Called once; `size` is live. */
	children: (size: ChartSize) => JSX.Element
}

/** The furniture around a plot: title, "show as table", legend, the measured
 *  SVG, and the tooltip.
 *
 *  The SVG is drawn at the container's real size in CSS pixels — the viewBox is
 *  rewritten on resize rather than left to scale — so a tick label is 10px on a
 *  phone and 10px on a wall display, instead of shrinking with the chart. Before
 *  the first measurement (which is every server render) it lays out at 640 wide.
 */
export function ChartFrame(props: ChartFrameProps) {
	const chart = () => props.chart
	const options = () => chart().options()
	const [width, setWidth] = createSignal(640)
	const [height, setHeight] = createSignal(320)
	const [tabular, setTabular] = createSignal(false)
	let plot: HTMLDivElement | undefined
	let svg: SVGSVGElement | undefined

	const loading = () => options().data?.loading === true

	const exportCsv = () =>
		save(
			new Blob([toCsv(chart().table())], { type: "text/csv;charset=utf-8" }),
			fileName(options().title, "csv"),
		)

	const exportPng = async () => {
		if (!svg) return
		const blob = await toPng(svg)
		if (blob) save(blob, fileName(options().title, "png"))
	}

	onMount(() => {
		if (!plot) return
		chart().attach(plot)
		const measure = () => {
			if (!plot) return
			if (plot.clientWidth > 0) setWidth(plot.clientWidth)
			if (plot.clientHeight > 0) setHeight(plot.clientHeight)
		}
		measure()
		const observer = new ResizeObserver(measure)
		observer.observe(plot)
		onCleanup(() => observer.disconnect())
	})

	const legend = () =>
		!props.noLegend && options().legend?.enabled !== false && chart().groups().length > 0
	const atTop = () => options().legend?.position === "top"
	const toolbar = () => options().toolbar?.enabled !== false

	/** The legend and the table button share one row. The button used to sit on a
	 *  row of its own above the plot, which spent 30px of every chart on a single
	 *  icon whenever there was no title beside it. */
	const controls = () => (
		<div class="flex items-start gap-2">
			<div class="min-w-0 flex-1">
				<Show when={legend()}>
					<Legend chart={chart()} />
				</Show>
			</div>
			<Show when={toolbar()}>
				<div class="flex shrink-0 items-stretch gap-tight">
					<IconButton
						label="Show as table"
						renderIcon={DataTable}
						kind="tertiary"
						size="sm"
						flat
						align="left"
						disabled={loading()}
						onClick={() => setTabular(true)}
					/>
					<Show when={options().toolbar?.export !== false && !loading()}>
						{
							/* Boxed by a wrapper so it stands the same size as the table button
						    beside it: the trigger's own border is transparent, and a border
						    colour on it would compete with that. */
						}
						<span class={`flex ${BOX}`}>
							<OverflowMenu
								label="Export"
								align="top-end"
								class="p-rule"
								menuOptionsClass="min-w-48"
								trigger={<Icon glyph={Download} size={16} />}
							>
								<OverflowMenuItem itemText="Export as CSV" onClick={exportCsv} />
								<OverflowMenuItem itemText="Export as PNG" onClick={() => void exportPng()} />
							</OverflowMenu>
						</span>
					</Show>
				</div>
			</Show>
		</div>
	)

	return (
		<figure
			aria-busy={loading() ? "true" : undefined}
			class={`m-0 flex min-w-0 flex-col gap-2 ${props.class ?? ""}`}
		>
			<Show when={options().title}>
				<figcaption class={`truncate ${LABEL}`}>{options().title}</figcaption>
			</Show>

			<Show when={(legend() || toolbar()) && atTop()}>{controls()}</Show>

			{
				/* The height is the caller's, so it travels as a custom property and the
			    class consumes it — the one place a style attribute is allowed. */
			}
			<div
				ref={plot}
				class="relative h-[var(--chart-height)] w-full"
				style={{ "--chart-height": options().height ?? "20rem" }}
			>
				{
					/* Hidden rather than unmounted while loading: the plot is built once,
				    by a function that runs once, and taking it out of the tree would
				    mean building it again when the data lands. */
				}
				<svg
					ref={svg}
					role="img"
					aria-label={options().title ?? "Chart"}
					viewBox={`0 0 ${width()} ${height()}`}
					class={`block size-full overflow-visible ${loading() ? "invisible" : ""}`}
				>
					<FillDefs uid={chart().uid} />
					{props.children({ width, height })}
				</svg>

				<Show when={loading()}>
					<ChartSkeleton />
				</Show>

				<Show when={chart().tip()}>
					{(tip) => (
						<div
							role="status"
							class={`on-ink pointer-events-none absolute left-[var(--tip-x)] top-[var(--tip-y)] z-10
								-translate-y-1/2 border-2 border-ink bg-ink px-2 py-tight text-micro text-white
								shadow-hard ${tip().flip ? "-ml-2 -translate-x-full" : "ml-2"}`}
							style={{ "--tip-x": `${tip().x}px`, "--tip-y": `${tip().y}px` }}
						>
							<Show when={tip().title}>
								<p class="m-0 mb-tight whitespace-nowrap font-bold uppercase">{tip().title}</p>
							</Show>
							<For each={tip().rows}>
								{(row) => (
									<p class="m-0 flex items-center gap-2 whitespace-nowrap">
										<span class="opacity-muted">{row.label}</span>
										<b class="ml-auto font-bold tabular-nums">{row.value}</b>
									</p>
								)}
							</For>
						</div>
					)}
				</Show>
			</div>

			<Show when={(legend() || toolbar()) && !atTop()}>{controls()}</Show>

			{
				/* Carbon's answer to "a chart is a picture": the same data as a table,
			    one press away. It is the accessible form of every chart here. */
			}
			<Modal
				open={tabular()}
				passiveModal
				size="lg"
				modalHeading={options().title ?? "Chart data"}
				onRequestClose={() => setTabular(false)}
			>
				<Table>
					<TableHead>
						<TableRow>
							<For each={chart().table().headers}>
								{(header) => <TableHeader>{header}</TableHeader>}
							</For>
						</TableRow>
					</TableHead>
					<TableBody>
						<For each={chart().table().rows}>
							{(row) => (
								<TableRow>
									<For each={row}>
										{(cell) => (
											<TableCell class={typeof cell === "number" ? "text-right tabular-nums" : ""}>
												{typeof cell === "number" ? formatNumber(cell) : cell}
											</TableCell>
										)}
									</For>
								</TableRow>
							)}
						</For>
					</TableBody>
				</Table>
			</Modal>
		</figure>
	)
}

/** A chart that has no data yet: its two axes, and where the gridlines will be.
 *
 *  Carbon draws the grid and shimmers it. This is the same idea in the
 *  system's own skeleton — the axes are ink, because they are structure and are
 *  already known; the rules across are `skeleton` blocks, breathing with every
 *  other skeleton on the page, at a gridline's spacing, because what goes
 *  between them is what is missing. */
function ChartSkeleton() {
	return (
		<div
			role="status"
			class="absolute inset-0 flex flex-col justify-between border-b-2 border-l-2 border-ink pb-4 pl-2 pt-2"
		>
			<span class="sr-only">Loading chart</span>
			<For each={[0, 1, 2, 3, 4]}>{() => <span class={`${SKELETON} block h-2 w-full`} />}</For>
		</div>
	)
}

/** One entry per series. Pressing one hides that series and the chart rescales
 *  to what is left — Carbon's behaviour, and the only way to read a small series
 *  that a large one is flattening. */
function Legend(props: { chart: Chart }) {
	const clickable = () => props.chart.options().legend?.clickable !== false

	return (
		<ul class="m-0 flex list-none flex-wrap gap-x-2 gap-y-tight p-0">
			<For each={props.chart.groups()}>
				{(group) => (
					<li>
						<Show
							when={clickable()}
							fallback={
								<span class="flex items-center gap-snug px-snug py-tight text-small">
									<Sample chart={props.chart} group={group} />
									{group}
								</span>
							}
						>
							<Button
								content
								flat
								kind="ghost"
								size="sm"
								aria-pressed={props.chart.isActive(group)}
								onClick={() => props.chart.toggle(group)}
								class={props.chart.isActive(group) ? "" : "opacity-40"}
							>
								<Sample chart={props.chart} group={group} />
								{group}
							</Button>
						</Show>
					</li>
				)}
			</For>
		</ul>
	)
}

/** What stands for a series in the legend. */
function Sample(props: { chart: Chart; group: string }) {
	const kind = () => props.chart.legendKind(props.group)

	return (
		<Show
			when={kind() !== "fill"}
			fallback={<Swatch fill={props.chart.fillOf(props.group)} size="lg" />}
		>
			<svg width="28" height="12" viewBox="0 0 28 12" aria-hidden="true" class="shrink-0">
				<Show when={kind() === "line"}>
					<line
						x1="0"
						y1="6"
						x2="28"
						y2="6"
						stroke-width="2"
						stroke-dasharray={dashOf(props.chart.indexOf(props.group))}
						class="stroke-ink"
					/>
				</Show>
				<Marker shape={markerOf(props.chart.indexOf(props.group))} x={14} y={6} size={6} />
			</svg>
		</Show>
	)
}

/** A label that stays readable on any fill: white text on solid ink, ink text on
 *  a white plate over anything patterned. */
export function PlateLabel(props: {
	x: number
	y: number
	text: string
	on: "white" | "plate" | "bare"
	anchor?: "start" | "middle" | "end"
	bold?: boolean
	px?: number
}) {
	const px = () => props.px ?? TICK_PX
	const w = () => props.text.length * px() * GLYPH + 6
	const left = () =>
		props.anchor === "middle" ? props.x - w() / 2 : props.anchor === "end" ? props.x - w() : props.x

	return (
		<g class="pointer-events-none">
			<Show when={props.on === "plate"}>
				<rect
					x={left()}
					y={props.y - px() / 2 - 3}
					width={w()}
					height={px() + 6}
					class="fill-white"
				/>
			</Show>
			<text
				x={left() + 3}
				y={props.y}
				dominant-baseline="central"
				font-size={String(px())}
				class={`${props.on === "white" ? "fill-white" : "fill-ink"} ${
					props.bold ? "font-bold" : ""
				}`}
			>
				{props.text}
			</text>
		</g>
	)
}
