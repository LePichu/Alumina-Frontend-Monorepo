import { createSignal, For } from "solid-js"
import type { JSX } from "solid-js"
import {
	AlluvialChart,
	AreaChart,
	BoxplotChart,
	BubbleChart,
	BulletChart,
	Button,
	ChoroplethChart,
	CirclePackChart,
	ComboChart,
	DonutChart,
	GaugeChart,
	GroupedBarChart,
	HeatmapChart,
	HistogramChart,
	LineChart,
	LollipopChart,
	MeterChart,
	PieChart,
	RadarChart,
	ScatterChart,
	SimpleBarChart,
	Sparkline,
	StackedAreaChart,
	StackedBarChart,
	Tile,
	TreeChart,
	TreemapChart,
	WordCloudChart,
} from "../index"
import type { FadeKind } from "../index"
import { WORLD } from "./world"

/** Every chart, on data from the three apps' own world: boards, prints, ink and
 *  the machine. The numbers are fixtures; the shapes are Carbon's exactly, so
 *  any example from the Carbon Charts docs can be pasted in beside these. */

function Demo(props: { name: string; note: string; wide?: boolean; children: JSX.Element }) {
	return (
		<Tile heading={props.name} class={props.wide ? "lg:col-span-2" : ""}>
			<p class="m-0 mb-2 text-small opacity-muted">{props.note}</p>
			{props.children}
		</Tile>
	)
}

const BOARDS = ["i2c-fanout-6", "usb-c-breakout", "flex-strain-tail", "buck-5v", "esp32-carrier"]
const MONTHS = ["Apr", "May", "Jun", "Jul", "Aug", "Sep"]
const STAGES = ["Shell", "Trace", "Dry", "Drill", "Laminate"]

const PRINTS = [731, 1880, 42, 316, 208].map((value, i) => ({ group: BOARDS[i], value }))

const COST = [12.8, 9.4, 24, 18.2, 31.5].map((value, i) => ({ group: BOARDS[i], value }))

const TEMP_WINDOWS = [
	{ group: "Shell", value: [205, 235] },
	{ group: "Trace", value: [60, 85] },
	{ group: "Dry", value: [90, 130] },
	{ group: "Laminate", value: [150, 190] },
]

const BY_MACHINE = MONTHS.flatMap((key, m) => [
	{ group: "Z1 · bench", key, value: 40 + m * 14 + (m % 2) * 9 },
	{ group: "Z1 · lab", key, value: 22 + m * 9 },
	{ group: "Z1 · loan", key, value: 8 + ((m * 7) % 13) },
])

const MINUTES = BOARDS.slice(0, 4).flatMap((key, b) =>
	STAGES.map((group, s) => ({
		group,
		key,
		value: ([136, 52, 72, 24, 20][s] ?? 0) * (0.6 + b * 0.25),
	}))
)

const BED = Array.from({ length: 13 }, (_, i) => {
	const date = new Date(Date.UTC(2026, 8, 24, 9, i * 10)).toISOString()
	return [
		{ group: "bed", date, value: 24 + 36 * (1 - Math.exp(-i / 3)) },
		{ group: "nozzle", date, value: 24 + 190 * (1 - Math.exp(-i / 2)) - (i > 9 ? (i - 9) * 6 : 0) },
		{ group: "dryer", date, value: i < 5 ? 24 : 24 + 70 * (1 - Math.exp(-(i - 5) / 2)) },
	]
}).flat()

const LAYER_STEPS = [0, 0.4, 0.4, 0.8, 0.8, 1.2, 1.2, 1.6].map((value, i) => ({
	group: "z height",
	key: `${i * 15}m`,
	value,
}))

const INK = MONTHS.flatMap((key, m) => [
	{ group: "silver", key, value: 18 + m * 6 + (m % 3) * 4 },
	{ group: "carbon", key, value: 30 - m * 2 + (m % 2) * 5 },
])

const PUBLISHED = MONTHS.flatMap((key, m) => [
	{ group: "CC0", key, value: 12 + m * 3 },
	{ group: "CERN-OHL-S", key, value: 5 + m * 2 },
	{ group: "CC-BY-SA", key, value: 3 + (m % 3) * 2 },
])

const TRACES = Array.from({ length: 18 }, (_, i) => {
	const width = 0.1 + (i % 9) * 0.05
	const silver = i < 9
	return {
		group: silver ? "silver" : "carbon",
		width,
		value: (silver ? 0.9 : 6.4) / width + ((i * 37) % 7) * (silver ? 0.3 : 1.6),
	}
})

const CATALOGUE = [
	{ group: "printable", layers: 1, value: 4.2, downloads: 640 },
	{ group: "printable", layers: 2, value: 12.8, downloads: 4020 },
	{ group: "printable", layers: 2, value: 9.4, downloads: 9210 },
	{ group: "fab only", layers: 4, value: 31.5, downloads: 1880 },
	{ group: "fab only", layers: 4, value: 24, downloads: 760 },
	{ group: "fab only", layers: 6, value: 58, downloads: 310 },
	{ group: "printable", layers: 4, value: 18.2, downloads: 2400 },
]

const CLEARANCE = [
	["U1.4", 0.21],
	["J2 · GND", 0.14],
	["C5 · VBUS", 0.3],
	["R7", 0.35],
	["via field", 0.25],
	["edge", 0.5],
].map(([key, value]) => ({ group: "clearance", key, value }))

const DRILLS = [
	0.3,
	0.3,
	0.3,
	0.3,
	0.35,
	0.35,
	0.4,
	0.4,
	0.4,
	0.4,
	0.4,
	0.45,
	0.5,
	0.5,
	0.6,
	0.8,
	0.8,
	0.8,
	1,
	1,
	1.2,
	2,
	3.2,
	3.2,
	3.2,
	3.2,
].map((value, i) => ({ group: i % 3 === 0 ? "plated" : "unplated", value }))

const RESISTANCE = [
	...[1.1, 1.3, 1.2, 1.5, 1.4, 1.2, 1.6, 1.3, 2.9],
	...[7.2, 8.1, 6.9, 9.4, 8.8, 7.7, 8.3, 12.6, 7.9],
	...[3.4, 3.9, 4.2, 3.6, 3.8, 4.4, 3.5, 4.1, 3.7],
].map((value, i) => ({ group: ["silver", "carbon", "graphene"][Math.floor(i / 9)], value }))

const YIELD = [
	{ title: "First-pass yield", group: "%", ranges: [60, 85, 100], marker: 90, value: 82 },
	{ title: "Trace continuity", group: "%", ranges: [70, 90, 100], marker: 95, value: 97 },
	{ title: "Registration", group: "%", ranges: [50, 80, 100], marker: 85, value: 64 },
]

const THROUGHPUT = MONTHS.flatMap((key, m) => [
	{ group: "prints", key, value: 70 + m * 26 },
	{ group: "failed", key, value: 9 + ((m * 5) % 8) },
	{ group: "success rate", key, rate: 82 + m * 2.4 - (m % 2) * 3 },
])

const PROCESS = [
	{ group: "Alumina Z1", value: 2611 },
	{ group: "2-layer fab", value: 1420 },
	{ group: "4-layer fab", value: 640 },
	{ group: "Flex", value: 190 },
]

const PRODUCTION = STAGES.map((group, i) => ({ group, value: [136, 52, 72, 24, 20][i] }))

const RADAR = ["speed", "resolution", "cost", "yield", "layers"].flatMap((feature, i) => [
	{ process: "Alumina Z1", feature, score: [9, 5, 9, 6, 4][i] },
	{ process: "2-layer fab", feature, score: [4, 8, 6, 9, 3][i] },
	{ process: "4-layer fab", feature, score: [3, 9, 3, 9, 9][i] },
])

const FAILURES = ["Mon", "Tue", "Wed", "Thu", "Fri"].flatMap((day, d) =>
	STAGES.map((stage, s) => ({ day, stage, value: ((d * 7 + s * 11) % 13) + (s === 1 ? 6 : 0) }))
)

const AREA = [
	{
		name: "Passives",
		children: [
			{ name: "0805 R", value: 44 },
			{ name: "0805 C", value: 38 },
			{ name: "0603", value: 16 },
		],
	},
	{
		name: "Connectors",
		children: [
			{ name: "USB-C", value: 52 },
			{ name: "1×06 header", value: 34 },
			{ name: "JST", value: 12 },
		],
	},
	{
		name: "Silicon",
		children: [
			{ name: "ESP32-S3", value: 60 },
			{ name: "LDO", value: 9 },
			{ name: "Buck", value: 21 },
		],
	},
	{
		name: "Mechanical",
		children: [{ name: "Mount holes", value: 18 }, { name: "Fiducials", value: 6 }],
	},
]

const REPO = [{
	name: "i2c-fanout-6",
	children: [
		{
			name: "hardware",
			children: [
				{ name: "board.kicad_pcb", value: 412 },
				{ name: "board.kicad_sch", value: 96 },
			],
		},
		{
			name: "build",
			children: [
				{ name: "board.xml", value: 412 },
				{ name: "board.stl", value: 319 },
				{ name: "bom.csv", value: 4 },
			],
		},
		{ name: "README.md", value: 3 },
	],
}]

const FLOW = [
	{ source: "KiCad", target: "IPC-2581", value: 62 },
	{ source: "KiCad", target: "Gerber", value: 18 },
	{ source: "Horizon", target: "IPC-2581", value: 11 },
	{ source: "Altium", target: "Gerber", value: 9 },
	{ source: "IPC-2581", target: "Printed", value: 48 },
	{ source: "IPC-2581", target: "Fabbed", value: 25 },
	{ source: "Gerber", target: "Fabbed", value: 27 },
]

const TOPICS = [
	["i2c", 48],
	["usb-c", 44],
	["power", 39],
	["sensor", 33],
	["flex", 21],
	["breakout", 30],
	["esp32", 27],
	["buck", 18],
	["connector", 24],
	["adc", 12],
	["rf", 9],
	["led", 16],
	["motor", 14],
	["audio", 8],
	["fpga", 6],
	["battery", 19],
	["stm32", 13],
	["rp2040", 17],
].map(([word, value], i) => ({ word, value, group: i % 3 === 0 ? "trending" : "steady" }))

const SILVER = INK.filter((datum) => datum.group === "silver")

const FADES: { name: string; note: string; kind?: FadeKind }[] = [
	{ name: "Flat pattern", note: "What ships now: one hatch, edge to edge." },
	{ name: "Dither", note: "Ordered 1-bit dither. Sixteen even steps.", kind: "dither" },
	{ name: "Halftone", note: "Dots on a grid that shrink.", kind: "halftone" },
	{ name: "Lines", note: "Level rules that thin out.", kind: "lines" },
]

const TREND = [4, 6, 5, 9, 8, 12, 11, 15, 14, 19, 17, 23].map((value, i) => ({
	key: String(i),
	value,
}))

/** Sixty days of bed temperature drift: a slow swell with a daily ripple, so
 *  there is something to find by zooming. Fixed arithmetic, not random — the
 *  server and the browser must draw the same line. */
const DRIFT = Array.from({ length: 60 }, (_, day) => ({
	group: "bed drift",
	date: new Date(Date.UTC(2026, 5, 1 + day)).toISOString(),
	value: Number((0.4 * Math.sin(day / 9) + 0.15 * Math.sin(day * 1.7) + day * 0.004).toFixed(3)),
}))

/** Boards printed, by where they were printed. */
const BY_REGION = [
	{ name: "North America", value: 1840 },
	{ name: "South America", value: 310 },
	{ name: "Europe", value: 2260 },
	{ name: "Africa", value: 140 },
	{ name: "Asia", value: 1490 },
	{ name: "Oceania", value: 420 },
]

export function Charts() {
	const [loading, setLoading] = createSignal(true)

	return (
		<div class="grid gap-4 lg:grid-cols-2">
			<Demo
				name="Zoom bar"
				note="Drag a handle, or the window between them. Each handle is a slider: arrow keys move it."
				wide
			>
				<LineChart
					data={DRIFT}
					options={{
						title: "Bed temperature drift",
						height: "16rem",
						axes: {
							left: { mapsTo: "value", title: "°C", includeZero: false },
							bottom: { mapsTo: "date", scaleType: "time" },
						},
						points: { enabled: false },
						legend: { enabled: false },
						zoomBar: {
							top: {
								enabled: true,
								initialZoomDomain: [DRIFT[20]?.date, DRIFT[44]?.date],
							},
						},
					}}
				/>
			</Demo>

			<Demo
				name="Loading · export"
				note="data.loading draws the skeleton. The download menu beside “show as table” exports CSV or PNG."
			>
				<SimpleBarChart
					data={PRINTS}
					options={{
						title: "Prints per board",
						height: "14rem",
						data: { loading: loading() },
						axes: {
							left: { mapsTo: "value" },
							bottom: { mapsTo: "group", scaleType: "labels" },
						},
						legend: { enabled: false },
					}}
				/>
				<Button
					kind="tertiary"
					size="sm"
					class="mt-2"
					onClick={() => setLoading((value) => !value)}
				>
					{loading() ? "Finish loading" : "Load again"}
				</Button>
			</Demo>

			<Demo
				name="ChoroplethChart"
				note="Tone is ink coverage, in four steps; white is no data. The map is handed in — this one is a hand-drawn schematic."
			>
				<ChoroplethChart
					data={BY_REGION}
					options={{
						title: "Boards printed by region",
						height: "14rem",
						geoData: WORLD,
						thematic: { projection: "geoEqualEarth" },
					}}
				/>
			</Demo>

			<Demo name="SimpleBarChart" note="One bar per datum. Each takes its own fill.">
				<SimpleBarChart
					data={PRINTS}
					options={{
						axes: {
							left: { mapsTo: "value", title: "prints" },
							bottom: { mapsTo: "group", scaleType: "labels" },
						},
					}}
				/>
			</Demo>

			<Demo name="SimpleBarChart · horizontal" note="Labels on the left axis turn it on its side.">
				<SimpleBarChart
					data={COST}
					options={{
						axes: {
							left: { mapsTo: "group", scaleType: "labels" },
							bottom: { mapsTo: "value", title: "fab cost, USD" },
						},
						legend: { enabled: false },
					}}
				/>
			</Demo>

			<Demo name="SimpleBarChart · floating" note="A value of [low, high] starts off the axis.">
				<SimpleBarChart
					data={TEMP_WINDOWS}
					options={{
						axes: {
							left: { mapsTo: "value", title: "°C" },
							bottom: { mapsTo: "group", scaleType: "labels" },
						},
						legend: { enabled: false },
					}}
				/>
			</Demo>

			<Demo name="GroupedBarChart" note="Press a legend entry: its slot closes and the rest widen.">
				<GroupedBarChart
					data={BY_MACHINE}
					options={{
						axes: {
							left: { mapsTo: "value", title: "prints" },
							bottom: { mapsTo: "key", scaleType: "labels" },
						},
					}}
				/>
			</Demo>

			<Demo name="StackedBarChart" note="The bar's full height is the category's total.">
				<StackedBarChart
					data={MINUTES}
					options={{
						axes: {
							left: { mapsTo: "value", title: "minutes", stacked: true },
							bottom: { mapsTo: "key", scaleType: "labels" },
						},
					}}
				/>
			</Demo>

			<Demo name="LineChart" note="A time axis. Series separate by dash and marker.">
				<LineChart
					data={BED}
					options={{
						axes: {
							left: { mapsTo: "value", title: "°C" },
							bottom: { mapsTo: "date", scaleType: "time" },
						},
						curve: "curveMonotoneX",
					}}
				/>
			</Demo>

			<Demo name="LineChart · step" note="curve: curveStepAfter — a value that holds, then jumps.">
				<LineChart
					data={LAYER_STEPS}
					options={{
						axes: {
							left: { mapsTo: "value", title: "mm" },
							bottom: { mapsTo: "key", scaleType: "labels" },
						},
						curve: "curveStepAfter",
						legend: { enabled: false },
					}}
				/>
			</Demo>

			<Demo name="AreaChart" note="Fills have nothing behind the ink, so crossings stay legible.">
				<AreaChart
					data={INK}
					options={{
						axes: {
							left: { mapsTo: "value", title: "ml" },
							bottom: { mapsTo: "key", scaleType: "labels" },
						},
					}}
				/>
			</Demo>

			<Demo
				name="AreaChart · fade study"
				note="Carbon fades an area with a colour gradient. In one ink that has to be coverage instead. Four candidates, same data."
				wide
			>
				<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					<For each={FADES}>
						{(fade) => (
							<div>
								<p class="m-0 mb-tight text-micro font-bold uppercase">{fade.name}</p>
								<p class="m-0 mb-2 text-small opacity-muted">{fade.note}</p>
								<AreaChart
									data={SILVER}
									options={{
										axes: {
											left: { mapsTo: "value" },
											bottom: { mapsTo: "key", scaleType: "labels" },
										},
										curve: "curveMonotoneX",
										height: "14rem",
										legend: { enabled: false },
										toolbar: { enabled: false },
										points: { enabled: false },
										color: fade.kind ? { gradient: { enabled: true, kind: fade.kind } } : undefined,
									}}
								/>
								<Sparkline
									class="mt-2"
									data={TREND}
									options={{
										area: true,
										curve: "curveMonotoneX",
										color: fade.kind ? { gradient: { enabled: true, kind: fade.kind } } : undefined,
									}}
								/>
							</div>
						)}
					</For>
				</div>
			</Demo>

			<Demo name="StackedAreaChart" note="The top edge is the total.">
				<StackedAreaChart
					data={PUBLISHED}
					options={{
						axes: {
							left: { mapsTo: "value", title: "boards", stacked: true },
							bottom: { mapsTo: "key", scaleType: "labels" },
						},
					}}
				/>
			</Demo>

			<Demo name="ScatterChart" note="Both axes continuous.">
				<ScatterChart
					data={TRACES}
					options={{
						axes: {
							left: { mapsTo: "value", title: "Ω / m" },
							bottom: { mapsTo: "width", title: "trace width, mm", scaleType: "linear" },
						},
					}}
				/>
			</Demo>

			<Demo name="BubbleChart" note="Area carries a third number — here, downloads.">
				<BubbleChart
					data={CATALOGUE}
					options={{
						axes: {
							left: { mapsTo: "value", title: "fab cost, USD" },
							bottom: { mapsTo: "layers", title: "layers", scaleType: "linear" },
						},
						bubble: { radiusMapsTo: "downloads" },
					}}
				/>
			</Demo>

			<Demo name="LollipopChart" note="A bar reduced to a stem and a head.">
				<LollipopChart
					data={CLEARANCE}
					options={{
						axes: {
							left: { mapsTo: "value", title: "mm" },
							bottom: { mapsTo: "key", scaleType: "labels" },
						},
						legend: { enabled: false },
					}}
				/>
			</Demo>

			<Demo name="HistogramChart" note="Bars touch, because the ranges do.">
				<HistogramChart
					data={DRILLS}
					options={{
						axes: {
							left: { title: "holes" },
							bottom: { mapsTo: "value", title: "drill, mm", bins: 8 },
						},
					}}
				/>
			</Demo>

			<Demo name="BoxplotChart" note="Median, quartiles, whiskers, and outliers on their own.">
				<BoxplotChart
					data={RESISTANCE}
					options={{
						axes: {
							left: { mapsTo: "group", scaleType: "labels" },
							bottom: { mapsTo: "value", title: "Ω / m" },
						},
					}}
				/>
			</Demo>

			<Demo name="BulletChart" note="Measure in ink, target as a tick, bands from worst to best.">
				<BulletChart
					data={YIELD}
					options={{
						axes: { left: { mapsTo: "title" }, bottom: { mapsTo: "value" } },
						height: "12rem",
					}}
				/>
			</Demo>

			<Demo name="ComboChart" note="Bars read the left axis; the rate reads the right.">
				<ComboChart
					data={THROUGHPUT}
					options={{
						axes: {
							left: { mapsTo: "value", title: "prints" },
							right: { mapsTo: "rate", title: "%", correspondingDatasets: ["success rate"] },
							bottom: { mapsTo: "key", scaleType: "labels" },
						},
						comboChartTypes: [
							{ type: "grouped-bar", correspondingDatasets: ["prints", "failed"] },
							{ type: "line", correspondingDatasets: ["success rate"] },
						],
					}}
				/>
			</Demo>

			<Demo name="PieChart" note="An ink line between slices; two patterns meeting blur.">
				<PieChart data={PROCESS} />
			</Demo>

			<Demo name="DonutChart" note="The total goes where the middle was.">
				<DonutChart data={PROCESS} options={{ donut: { center: { label: "boards built" } } }} />
			</Demo>

			<Demo name="GaugeChart" note="The delta's direction is a triangle, not a colour.">
				<div class="grid gap-4 sm:grid-cols-2">
					<GaugeChart
						data={[{ group: "value", value: 72 }, { group: "delta", value: 4.5 }]}
						options={{ height: "12rem", toolbar: { enabled: false } }}
					/>
					<GaugeChart
						data={[{ group: "value", value: 38 }, { group: "delta", value: -12 }]}
						options={{ gauge: { type: "full" }, height: "12rem", toolbar: { enabled: false } }}
					/>
				</div>
			</Demo>

			<Demo name="MeterChart" note="Plain, with a peak tick and a status; and proportional.">
				<div class="flex flex-col gap-6">
					<MeterChart
						data={[{ group: "Dryer load", value: 64 }]}
						options={{
							meter: {
								peak: 82,
								status: {
									ranges: [
										{ range: [0, 50], status: "success" },
										{ range: [50, 80], status: "warning" },
										{ range: [80, 100], status: "danger" },
									],
								},
							},
						}}
					/>
					<MeterChart
						data={PRODUCTION}
						options={{ title: "Production", meter: { proportional: { total: 360, unit: "min" } } }}
					/>
				</div>
			</Demo>

			<Demo name="RadarChart" note="A series becomes a shape; compare by outline.">
				<RadarChart
					data={RADAR}
					options={{
						data: { groupMapsTo: "process" },
						radar: { axes: { angle: "feature", value: "score" } },
					}}
				/>
			</Demo>

			<Demo
				name="HeatmapChart"
				note="No colour ramp in one ink — each cell's square covers its value's share."
			>
				<HeatmapChart
					data={FAILURES}
					options={{
						axes: {
							left: { mapsTo: "stage" },
							bottom: { mapsTo: "day" },
						},
					}}
				/>
			</Demo>

			<Demo name="TreemapChart" note="Groups first, leaves second.">
				<TreemapChart data={AREA} />
			</Demo>

			<Demo name="CirclePackChart" note="Circles inside circles.">
				<CirclePackChart data={AREA} />
			</Demo>

			<Demo name="TreeChart" note="Right-angled links, so levels read as columns.">
				<TreeChart data={REPO} />
			</Demo>

			<Demo name="AlluvialChart" note="Ribbons as thick as the flow, see-through where they cross.">
				<AlluvialChart data={FLOW} options={{ alluvial: { units: "boards" } }} />
			</Demo>

			<Demo name="WordCloudChart" note="Sized by weight; a group is bold or regular." wide>
				<WordCloudChart data={TOPICS} options={{ height: "14rem" }} />
			</Demo>

			<Demo name="Sparkline" note="A trend with everything but the trend removed." wide>
				<div class="grid items-center gap-4 sm:grid-cols-[auto_1fr_auto_1fr]">
					<span class="text-small">
						prints · <b class="font-bold">23</b>
					</span>
					<Sparkline data={TREND} options={{ curve: "curveMonotoneX" }} />
					<span class="text-small">
						ink · <b class="font-bold">23 ml</b>
					</span>
					<Sparkline data={TREND} options={{ area: true }} />
				</div>
			</Demo>
		</div>
	)
}
