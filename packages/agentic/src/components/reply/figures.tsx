import { For, Match, Switch } from "solid-js"
import type { FigureKind } from "../../lib/agent"

/** Figures are inline SVG in the same flat 2px ink stroke as the rest of the
 *  system — never raster, never coloured, and never markup that arrived with the
 *  reply. A reply names the figure it wants; this module owns the drawing.
 *
 *  Numbers here are SVG user units: geometry inside a viewBox, not CSS lengths,
 *  so they carry the prototype's coordinates unchanged rather than being rounded
 *  to even. The same goes for the opacities and stroke widths that came with
 *  that geometry. The even-number rule governs Tailwind classes and theme.css,
 *  which is why the classes below hold to it and the drawing does not.
 *
 *  Colour is the exception that is not carried over: the prototype ringed the
 *  clearance callout in `--clay`. Strict monochrome wins, so that ring is ink and
 *  reads as a callout because it is thicker and dashed, not because it is a
 *  different hue.
 */
export function Figure(props: { kind: FigureKind }) {
	return (
		<Switch>
			<Match when={props.kind === "board-top"}>
				<BoardTop />
			</Match>
			<Match when={props.kind === "board-bottom"}>
				<BoardBottom />
			</Match>
			<Match when={props.kind === "board-stack"}>
				<BoardStack />
			</Match>
			<Match when={props.kind === "coupon"}>
				<Coupon />
			</Match>
			<Match when={props.kind === "clearance"}>
				<Clearance />
			</Match>
			<Match when={props.kind === "load-step"}>
				<LoadStep />
			</Match>
		</Switch>
	)
}

/** What a view tab is called when a figure offers more than one. */
export const FIGURE_LABELS: Record<FigureKind, string> = {
	"board-top": "top",
	"board-bottom": "bottom",
	"board-stack": "stack",
	coupon: "coupon",
	clearance: "detail",
	"load-step": "transient",
}

const FIG = "mx-auto block h-auto max-h-88 w-full"

/** Substrate hatch and the dotted fill that marks a shielded part. */
function Defs() {
	return (
		<defs>
			<pattern
				id="kiln-hatch"
				width="7"
				height="7"
				patternUnits="userSpaceOnUse"
				patternTransform="rotate(45)"
			>
				<rect width="2.4" height="7" class="fill-ink" opacity="0.26" />
			</pattern>
			<pattern id="kiln-dots" width="6" height="6" patternUnits="userSpaceOnUse">
				<circle cx="1.6" cy="1.6" r="1.15" class="fill-ink" opacity="0.5" />
			</pattern>
		</defs>
	)
}

/** A copper pad: solid ink, always. */
function Pad(props: { x: number; y: number; w: number; h: number }) {
	return <rect x={props.x} y={props.y} width={props.w} height={props.h} class="fill-ink" />
}

function Label(props: {
	x: number
	y: number
	size?: number
	anchor?: "start" | "middle" | "end"
	white?: boolean
	children: string
}) {
	return (
		<text
			x={props.x}
			y={props.y}
			font-size={String(props.size ?? 8)}
			text-anchor={props.anchor ?? "middle"}
			letter-spacing=".04em"
			class={props.white ? "fill-white" : "fill-ink"}
		>
			{props.children}
		</text>
	)
}

/** A dimension run with end ticks and its measure above the line. */
function DimH(props: { x1: number; x2: number; y: number; children: string }) {
	return (
		<g opacity="0.65">
			<g class="fill-none stroke-ink" stroke-width="1.2">
				<path
					d={`M${props.x1} ${props.y - 5}V${props.y + 5}M${props.x2} ${props.y - 5}V${props.y + 5}`}
				/>
				<path d={`M${props.x1} ${props.y}H${props.x2}`} />
			</g>
			<Label x={(props.x1 + props.x2) / 2} y={props.y - 8}>{props.children}</Label>
		</g>
	)
}

function DimV(props: { y1: number; y2: number; x: number; children: string }) {
	return (
		<g opacity="0.65">
			<g class="fill-none stroke-ink" stroke-width="1.2">
				<path
					d={`M${props.x - 5} ${props.y1}H${props.x + 5}M${props.x - 5} ${props.y2}H${props.x + 5}`}
				/>
				<path d={`M${props.x} ${props.y1}V${props.y2}`} />
			</g>
			<g transform={`translate(${props.x + 12},${(props.y1 + props.y2) / 2}) rotate(-90)`}>
				<Label x={0} y={0}>{props.children}</Label>
			</g>
		</g>
	)
}

/** The four M2 mounting holes, drilled through both copper views. */
function Holes() {
	return (
		<For each={[[14, 14], [226, 14], [14, 166], [226, 166]]}>
			{([x, y]) => <circle cx={x} cy={y} r="5.5" class="fill-white stroke-ink" stroke-width="2" />}
		</For>
	)
}

/** Three vias, in the same places on both copper layers — they are the same
 *  holes seen from either side, so they cannot drift apart. */
const VIAS = [[40, 148], [118, 128], [196, 152]]

function Vias() {
	return (
		<g class="fill-white stroke-ink" stroke-width="2">
			<For each={VIAS}>{([x, y]) => <circle cx={x} cy={y} r="4" />}</For>
		</g>
	)
}

/** 24 × 18 mm, 10 user units per millimetre. */
function BoardTop() {
	return (
		<svg
			viewBox="-14 -12 288 226"
			class={`${FIG} max-w-96`}
			role="img"
			aria-label="Top copper, 24 by 18 millimetres"
		>
			<Defs />
			<rect x="4" y="4" width="232" height="172" fill="url(#kiln-hatch)" />
			<rect x="0" y="0" width="240" height="180" class="fill-none stroke-ink" stroke-width="2" />
			<Holes />

			{
				/* Routing. The switch node stays wide and short; the feedback pair is
			    thin and returns the long way round, away from it. */
			}
			<g class="fill-none stroke-ink" stroke-linecap="square">
				<path d="M22 44 H50 M58 44 H66" stroke-width="6" />
				<path d="M22 44 V64 H50" stroke-width="6" />
				<path d="M112 66 H132" stroke-width="6" />
				<path d="M178 66 H206 V104" stroke-width="6" />
				<path d="M206 104 H196" stroke-width="6" />
				<path d="M196 140 H206 V158 H30 V148" stroke-width="5" />
				<path d="M112 96 H150 V128 H118" stroke-width="3" />
				<path d="M66 96 H52 V128 H118" stroke-width="3" />
			</g>

			<Pad x={8} y={36} w={16} h={16} />
			<Label x={6} y={30} anchor="start">VIN</Label>
			<Pad x={216} y={36} w={16} h={16} />
			<Label x={234} y={30} anchor="end">5V</Label>
			<Pad x={8} y={140} w={16} h={16} />
			<Label x={30} y={134} anchor="start">GND</Label>

			<Pad x={44} y={34} w={14} h={10} />
			<Pad x={44} y={58} w={14} h={10} />
			<Label x={66} y={32} size={7} anchor="start">C1</Label>

			{/* U1, the converter */}
			<rect x="66" y="58" width="46" height="44" class="fill-white stroke-ink" stroke-width="2" />
			<Pad x={60} y={62} w={10} h={8} />
			<Pad x={60} y={76} w={10} h={8} />
			<Pad x={60} y={90} w={10} h={8} />
			<Pad x={108} y={62} w={10} h={8} />
			<Pad x={108} y={76} w={10} h={8} />
			<Pad x={108} y={90} w={10} h={8} />
			<Label x={89} y={84} size={9}>U1</Label>

			{/* L1, shielded — the dotted fill is what says so */}
			<rect
				x="132"
				y="50"
				width="46"
				height="34"
				fill="url(#kiln-dots)"
				class="stroke-ink"
				stroke-width="2"
			/>
			<Pad x={126} y={56} w={10} h={22} />
			<Pad x={174} y={56} w={10} h={22} />
			<Label x={155} y={42} size={7}>L1</Label>

			<Pad x={190} y={104} w={14} h={10} />
			<Pad x={190} y={130} w={14} h={10} />
			<Label x={212} y={102} size={7} anchor="start">C7</Label>

			<Vias />
			<DimH x1={0} x2={240} y={204}>24.00</DimH>
			<DimV y1={0} y2={180} x={258}>18.00</DimV>
			<g opacity="0.5">
				<Label x={0} y={-2} size={7} anchor="start">F.Cu · 0.30 mm min</Label>
			</g>
		</svg>
	)
}

function BoardBottom() {
	return (
		<svg
			viewBox="-14 -12 288 226"
			class={`${FIG} max-w-96`}
			role="img"
			aria-label="Bottom copper"
		>
			<Defs />
			<rect x="4" y="4" width="232" height="172" fill="url(#kiln-dots)" />
			<rect x="0" y="0" width="240" height="180" class="fill-none stroke-ink" stroke-width="2" />
			<Holes />

			<g class="fill-none stroke-ink" stroke-linecap="square">
				<path d="M40 148 H196" stroke-width="7" />
				<path d="M118 128 V96 H150" stroke-width="3" />
			</g>

			{/* The pour is drawn dashed: it is a region, not a trace. */}
			<rect
				x="60"
				y="30"
				width="120"
				height="46"
				class="fill-white stroke-ink"
				stroke-width="2"
				stroke-dasharray="5 4"
			/>
			<Label x={120} y={58} size={9}>GND pour</Label>

			<Vias />
			<DimH x1={0} x2={240} y={204}>24.00</DimH>
			<DimV y1={0} y2={180} x={258}>18.00</DimV>
			<g opacity="0.5">
				<Label x={0} y={-2} size={7} anchor="start">B.Cu · mirrored</Label>
			</g>
		</svg>
	)
}

/** The printed stack in cross-section: ink layers are thin and solid, substrate
 *  layers are thick and hatched. Printed one on top of the next — there is no
 *  lamination step, which is the whole point of the figure. */
const STACK: [name: string, thickness: string, ink: boolean][] = [
	["silver ink", "0.05", true],
	["PC-GF", "0.55", false],
	["silver ink", "0.05", true],
	["PC-GF", "0.40", false],
	["silver ink", "0.05", true],
	["PC-GF", "0.45", false],
	["silver ink", "0.05", true],
]

function BoardStack() {
	// Laid out top-down, each layer starting where the last one ended.
	let y = 6
	const layers = STACK.map(([name, thickness, ink]) => {
		const height = ink ? 9 : 24
		const row = { name, thickness, ink, y, height, mid: y + height / 2 + 3 }
		y += height
		return row
	})
	const bottom = y

	return (
		<svg
			viewBox={`-8 -10 320 ${bottom + 32}`}
			class={`${FIG} max-w-104`}
			role="img"
			aria-label="Printed layer stack"
		>
			<Defs />
			<For each={layers}>
				{(layer) => (
					<>
						<rect
							x="30"
							y={layer.y}
							width="180"
							height={layer.height}
							fill={layer.ink ? undefined : "url(#kiln-hatch)"}
							class={`stroke-ink ${layer.ink ? "fill-ink" : ""}`}
							stroke-width="2"
						/>
						<Label x={218} y={layer.mid} size={7.5} anchor="start">{layer.name}</Label>
						<g opacity="0.5">
							<Label x={308} y={layer.mid} size={7.5} anchor="end">{layer.thickness}</Label>
						</g>
					</>
				)}
			</For>
			<DimV y1={6} y2={bottom} x={14}>1.60</DimV>
			<g opacity="0.5">
				<Label x={30} y={-1} size={7} anchor="start">layer-on-layer · no lamination step</Label>
			</g>
		</svg>
	)
}

/** The eight widths the prototype sweeps, in millimetres. Below 0.15 the cured
 *  trace stops reading as continuous, which is the whole point of the coupon. */
const WIDTHS = [0.5, 0.4, 0.3, 0.25, 0.2, 0.15, 0.12, 0.1]
const CONTINUOUS = 0.15

function Coupon() {
	// 10 user units per millimetre, floored so the thinnest trace still has a body
	// at this scale — otherwise 0.10 mm would vanish and the figure would lie.
	const traces = WIDTHS.map((mm, index) => {
		const thickness = Math.max(mm * 10, 1.6)
		const x = 24 + index * 30
		return { mm, x, thickness, centre: x + thickness / 2, continuous: mm >= CONTINUOUS }
	})

	return (
		<svg
			viewBox="-10 0 280 190"
			class={`${FIG} max-w-96`}
			role="img"
			aria-label="Trace width sweep coupon"
		>
			<rect
				x="6"
				y="6"
				width="252"
				height="168"
				class="fill-none stroke-ink"
				stroke-width="2"
			/>
			<For each={traces}>
				{(trace) => (
					<>
						<rect x={trace.x} y="30" width={trace.thickness} height="96" class="fill-ink" />
						{/* four-wire pad pair, one at each end */}
						<Pad x={trace.centre - 7} y={18} w={14} h={12} />
						<Pad x={trace.centre - 7} y={126} w={14} h={12} />
						<g opacity="0.55">
							<Label x={trace.centre} y={152} size={7}>{trace.mm.toFixed(2)}</Label>
						</g>
						{/* tick or cross: continuity after cure, carried by shape not hue */}
						<g
							transform={`translate(${trace.centre - 5},158)`}
							class="fill-none stroke-ink"
							stroke-width="2"
							opacity={trace.continuous ? 1 : 0.45}
						>
							<path d={trace.continuous ? "M0 5 L4 9 L10 0" : "M0 0 L10 9 M10 0 L0 9"} />
						</g>
					</>
				)}
			</For>
			<g opacity="0.5">
				<Label x={132} y={184} size={7}>width in mm · continuity after cure</Label>
			</g>
		</svg>
	)
}

/** U3 pins 4–5 against the ground pour, at 40x. */
function Clearance() {
	return (
		<svg
			viewBox="-10 -10 280 180"
			class={`${FIG} max-w-88`}
			role="img"
			aria-label="Clearance detail at U3"
		>
			<Defs />
			<rect x="0" y="0" width="260" height="150" fill="url(#kiln-hatch)" opacity="0.5" />
			<path d="M0 0 H260 V150 H0 Z" class="fill-none stroke-ink" stroke-width="2" />

			<Pad x={20} y={34} w={86} h={30} />
			<Pad x={20} y={90} w={86} h={30} />
			<path d="M148 24 H236 V126 H148 Z" class="fill-ink" />
			<Label x={63} y={54} white>U3.4</Label>
			<Label x={63} y={110} white>U3.5</Label>
			<Label x={192} y={80} white>GND</Label>

			{/* the measured gap */}
			<g class="fill-none stroke-ink" stroke-width="1.5">
				<path d="M106 49 H148" stroke-dasharray="4 3" />
				<path d="M106 44 V54 M148 44 V54" />
			</g>
			<rect x="110" y="27" width="34" height="15" class="fill-white" />
			<Label x={127} y={38}>0.21</Label>

			{/* the callout ring: ink and dashed, where the prototype used clay */}
			<circle
				cx="127"
				cy="49"
				r="34"
				class="fill-none stroke-ink"
				stroke-width="3"
				stroke-dasharray="8 6"
			/>
			<g opacity="0.55">
				<Label x={127} y={166} size={7}>required 0.30 · detail 40x</Label>
			</g>
		</svg>
	)
}

/** Load step transient: output volts above, load current below. Sampled rather
 *  than hand-drawn, so the decay is the real shape of a damped response. */
function LoadStep() {
	const x0 = 28
	const x1 = 252
	const samples = 240

	let volts = ""
	let amps = ""
	for (let i = 0; i <= samples; i++) {
		const t = (i / samples) * 10
		// The load steps at t = 3; before it the rail is flat.
		const dip = t < 3 ? 0 : -Math.exp(-(t - 3) * 1.15) * Math.cos((t - 3) * 2.9)
		const x = (x0 + (x1 - x0) * i / samples).toFixed(1)
		volts += `${i ? "L" : "M"}${x} ${(46 + dip * 26).toFixed(1)}`
		amps += `${i ? "L" : "M"}${x} ${t < 3 ? 118 : 100}`
	}

	return (
		<svg
			viewBox="0 0 268 140"
			class={`${FIG} max-w-88`}
			role="img"
			aria-label="Load step response"
		>
			<g class="stroke-ink" stroke-width="1" opacity="0.25">
				<For each={[26, 46, 66]}>{(y) => <path d={`M${x0} ${y} H${x1}`} />}</For>
			</g>
			<path d={`M${x0} 14 V86 H${x1}`} class="fill-none stroke-ink" stroke-width="2" />
			<path d={volts} class="fill-none stroke-ink" stroke-width="2" />
			<path
				d={amps}
				class="fill-none stroke-ink"
				stroke-width="2"
				stroke-dasharray="5 4"
				opacity="0.55"
			/>
			{/* ripple callout */}
			<g class="fill-none stroke-ink" stroke-width="1.4">
				<path d="M96 20 V72" stroke-dasharray="3 3" opacity="0.5" />
				<path d="M96 26 H120 M96 66 H120" />
				<path d="M108 26 V66" />
			</g>
			<Label x={150} y={24} anchor="start">38 mV ripple</Label>
			<g opacity="0.55">
				<Label x={2} y={50} size={7} anchor="start">5V0</Label>
				<Label x={2} y={122} size={7} anchor="start">I</Label>
				<Label x={66} y={113} size={7}>0.2 A</Label>
				<Label x={200} y={95} size={7}>2.0 A</Label>
				<Label x={140} y={134} size={7}>settles in 40 µs</Label>
			</g>
		</svg>
	)
}
