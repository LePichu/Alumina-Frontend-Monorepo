/** Canned agent replies, as typed sections.
 *
 * The prototype stored each reply's prose as an HTML string and injected it. That
 * is precisely what must not happen to model output, so the strings have been
 * decomposed here: prose is an array of paragraphs, run steps and checks are
 * records, figures are named rather than drawn inline, and forms are field specs.
 * Nothing in this file is markup.
 *
 * Two kinds of emphasis did not survive that decomposition, on purpose. The
 * prototype set part numbers in <code> and bolded a phrase mid-sentence; carrying
 * either would mean a prose section that contains spans, which is the door this
 * design closes. Emphasis that does matter — a figure's headline number — is
 * modelled as a chip's `value`, not as markup.
 *
 * Reached only through src/lib/agent.ts.
 */

import type { Reply, ReplyForm } from "../lib/agent"

/** The question kiln asks before committing to a layout. Exercises every field
 *  type the reply forms support. */
const BUCK_FORM: ReplyForm = {
	title: "Before I write the board",
	cta: "Route it",
	next: "buckBuild",
	fields: [
		{
			kind: "radio",
			key: "topology",
			label: "Topology",
			help: "changes the part count more than the layout",
			value: "Synchronous buck",
			options: [
				{ value: "Synchronous buck", description: "best efficiency, wants a clean ground" },
				{ value: "Asynchronous buck", description: "one fewer FET, runs hotter" },
				{ value: "Charge pump", description: "no inductor, tops out near 500 mA" },
			],
		},
		{
			kind: "options",
			key: "current",
			label: "Continuous output current",
			options: ["1 A", "2 A", "3 A"],
			value: "2 A",
		},
		{
			kind: "select",
			key: "substrate",
			label: "Substrate",
			options: ["PC-GF · prototype", "PEI-1010 · serious", "TPC-HT · flexible"],
			value: "PEI-1010 · serious",
		},
		{ kind: "options", key: "layers", label: "Layer count", options: ["2", "4"], value: "4" },
		{
			kind: "range",
			key: "ripple",
			label: "Ripple ceiling",
			min: 10,
			max: 100,
			// Millivolts, not a length: the even-number rule governs Tailwind classes
			// and theme.css lengths, so the prototype's 5 mV step is kept as it stands.
			step: 5,
			value: 40,
			unit: "mV",
		},
		{
			kind: "checks",
			label: "Include on the board",
			options: [
				{ key: "tp", label: "Test points on every rail", checked: true },
				{ key: "mh", label: "Mounting holes, M2", checked: true },
				{
					key: "rp",
					label: "Reverse-polarity FET",
					checked: false,
					tradeOff: "costs 60 mV of headroom",
				},
				{ key: "led", label: "Power LED", checked: false },
				{ key: "term", label: "Screw terminals instead of pads", checked: false },
			],
		},
		{ kind: "text", key: "name", label: "Board name", placeholder: "BUCK-5V", value: "BUCK-5V" },
		{
			kind: "textarea",
			key: "notes",
			label: "Anything else I should know",
			placeholder: "Enclosure, connector positions, parts you already have on the shelf…",
			rows: 2,
			value: "",
			wide: true,
		},
	],
}

/** What kiln asks when the prompt gives it nothing to work from. */
const PLAN_FORM: ReplyForm = {
	title: "A few constraints",
	cta: "Start the design",
	next: "generic",
	fields: [
		{
			kind: "radio",
			key: "kind",
			label: "What kind of board",
			value: "Power",
			options: [
				{ value: "Power", description: "rails, regulators, protection" },
				{ value: "Sensor front end", description: "analog in, digital out" },
				{ value: "Carrier", description: "a module plus its support parts" },
				{ value: "Test coupon", description: "process characterisation" },
			],
		},
		{
			kind: "select",
			key: "substrate",
			label: "Substrate",
			options: ["PC-GF · prototype", "PEI-1010 · serious", "TPC-HT · flexible"],
			value: "PC-GF · prototype",
		},
		{ kind: "options", key: "layers", label: "Layer count", options: ["1", "2", "4"], value: "2" },
		{
			kind: "range",
			key: "size",
			label: "Longest edge",
			min: 20,
			max: 100,
			step: 5,
			value: 60,
			unit: "mm",
		},
		{
			kind: "checks",
			label: "Constraints that matter",
			options: [
				{ key: "fit", label: "Has to fit an enclosure", checked: false },
				{ key: "hand", label: "Hand-solderable only", checked: true },
				{ key: "shelf", label: "Use parts I already have", checked: false },
			],
		},
		{
			kind: "textarea",
			key: "notes",
			label: "Describe it in your own words",
			placeholder: "What it connects to, what it drives, where it lives…",
			rows: 2,
			value: "",
			wide: true,
		},
	],
}

/** Every board figure offers the same three views. */
const BOARD_VIEWS = ["board-top", "board-bottom", "board-stack"] as const

export const REPLIES: Record<string, Reply> = {
	buckAsk: {
		id: "buckAsk",
		thinking: "Reading the request · Alumina Z1 rules",
		sections: [
			{
				kind: "steps",
				steps: [
					{ name: "intent.parse", detail: "12 V in, 5 V out, bench use", duration: "0.4s" },
					{ name: "rules.load", detail: "Alumina Z1 · 0.10 mm floor", duration: "0.3s" },
					{ name: "parts.search", detail: "3 candidate topologies", duration: "1.9s" },
				],
			},
			{
				kind: "prose",
				paragraphs: [
					"A synchronous buck is the right call here — a linear regulator would burn 14 W as heat at 2 A, which your substrate would not survive.",
					"Five things change the layout, so I'd rather ask than guess:",
				],
			},
			{ kind: "form", form: BUCK_FORM },
		],
	},

	buckBuild: {
		id: "buckBuild",
		thinking: "Writing board source · rendering fab pass",
		sections: [
			{
				kind: "steps",
				steps: [
					{ name: "netlist.write", detail: "17 nets · 22 parts", duration: "0.9s" },
					{ name: "board.html", detail: "Board, TraceSet, Via — 24 × 18 mm", duration: "2.2s" },
					{ name: "route.solve", detail: "2 signal layers · 0.30 mm min", duration: "6.8s" },
					{ name: "render.pass", detail: "visual + fab colour maps", duration: "0.7s" },
					{ name: "check.drc", detail: "Alumina Z1 ruleset", duration: "1.1s" },
					{ name: "sim.ngspice", detail: "load step 0.2 A to 2 A", duration: "2.6s" },
					{ name: "emit.ipc2581", detail: "BUCK-5V rev A.1", duration: "0.4s" },
				],
			},
			{
				kind: "checks",
				checks: [
					{ severity: "ok", label: "Clearance 0.32 mm — over the 0.30 mm target" },
					{ severity: "ok", label: "Every net routed, no stubs" },
					{ severity: "warning", label: "SW node copper is 6.1 mm² — noisy but printable" },
					{ severity: "warning", label: "C7 sits 1.2 mm from the outline; hand-solder is tight" },
				],
			},
			{
				kind: "prose",
				paragraphs: [
					"Board source is written and rendered. TPS54202 does the switching — 4.5–28 V in, 2 A, internal high-side FET, and a basic part so the BOM stays cheap.",
				],
			},
			{
				kind: "figure",
				title: "BUCK-5V rev A.1",
				figure: "board-top",
				views: [...BOARD_VIEWS],
				caption: [
					{ value: "24 × 18 mm" },
					{ label: "4 layers" },
					{ label: "F.Cu shown" },
					{ label: "0.30 mm min" },
				],
			},
			{
				kind: "prose",
				paragraphs: [
					"The switching node is kept small and stays on the top layer — no via stitching through it, which your process wouldn't thank me for. Output is 2 × 22 µF ceramic plus a 100 µF bulk:",
				],
			},
			{
				kind: "figure",
				title: "Load step · 0.2 A to 2 A",
				figure: "load-step",
				caption: [
					{ value: "38 mV", label: "ripple" },
					{ label: "40 µs settle" },
					{ label: "ngspice" },
				],
			},
			{
				kind: "table",
				title: "Bill of materials",
				note: "17 more rows · $3.10",
				headers: ["Ref", "Value", "Part", "Qty"],
				rows: [
					["U1", "—", "TPS54202DDCR", "1"],
					["L1", "10 µH", "SWPA6045S100MT", "1"],
					["C1", "10 µF 50 V", "CL31A106KBHNNNE", "2"],
					["C7", "22 µF 16 V", "CL21A226MAQNNNE", "2"],
					["R2", "31.6 kΩ 1%", "0603WAF3162T5E", "1"],
				],
			},
			{
				kind: "prose",
				paragraphs: [
					"Two things before you print: the SW node copper is larger than I'd like for EMI, and C7 is close enough to the edge that hand-soldering will be fiddly. Both are cosmetic for a bench supply — say the word and I'll pull C7 in 1 mm and re-route.",
				],
			},
			{
				kind: "footer",
				artifacts: true,
				stats: [
					{ value: "24 × 18 mm" },
					{ value: "2 signal + 2 plane" },
					{ value: "22 parts · 1 non-basic" },
					{ value: "~1 h 40 m to print" },
				],
			},
		],
	},

	esp: {
		id: "esp",
		thinking: "Fetching ESP32-S3-WROOM-1 footprint · checking Z1 rules",
		sections: [
			{
				kind: "steps",
				steps: [
					{ name: "intent.parse", detail: "carrier, USB-C, header breakout", duration: "0.4s" },
					{ name: "parts.search", detail: "ESP32-S3-WROOM-1-N16R8 + LDO", duration: "1.2s" },
					{
						name: "footprint.check",
						detail: "castellations vs flat deposition",
						duration: "0.8s",
					},
					{ name: "board.html", detail: "antenna keepout as a region", duration: "3.0s" },
					{ name: "route.solve", detail: "4 layers · 0.30 mm min", duration: "9.1s" },
					{ name: "check.drc", detail: "Alumina Z1 ruleset", duration: "1.3s" },
				],
			},
			{
				kind: "checks",
				checks: [
					{ severity: "ok", label: "Antenna keepout clear on all layers" },
					{ severity: "ok", label: "USB D+/D− matched to 0.2 mm" },
					{
						severity: "error",
						label: "Castellations are half-cylinders — flat deposition cannot make them",
					},
					{ severity: "warning", label: "No ESD parts on the USB lines" },
				],
			},
			{
				kind: "prose",
				paragraphs: [
					"Carrier is laid out — USB-C in, 3V3 LDO, boot and reset buttons, full edge broken out to 2.54 mm headers. The antenna keepout is a first-class region in the board source, so no layer puts copper under it.",
				],
			},
			{
				kind: "figure",
				title: "S3-CARRIER rev A.1",
				figure: "board-top",
				views: [...BOARD_VIEWS],
				caption: [{ value: "46 × 26 mm" }, { label: "4 layers" }, { label: "F.Cu shown" }],
			},
			{
				kind: "prose",
				paragraphs: [
					"One thing I can't route around: the module wants castellated half-cylinder pads, and the printer lays flat lines. Your options are a pad-only variant, or soldering the module from the top.",
				],
			},
			{
				kind: "prose",
				paragraphs: [
					"I'd also add a USBLC6 on the data lines before this leaves the bench. Want me to drop one in and re-route?",
				],
			},
			{
				kind: "footer",
				artifacts: true,
				stats: [
					{ value: "46 × 26 mm" },
					{ value: "4 layers" },
					{ value: "34 parts" },
					{ value: "~2 h 10 m to print" },
				],
			},
		],
	},

	coupon: {
		id: "coupon",
		thinking: "Building a width sweep for the Z1 process",
		sections: [
			{
				kind: "steps",
				steps: [
					{ name: "intent.parse", detail: "trace width characterisation", duration: "0.3s" },
					{ name: "board.html", detail: "8 traces, 0.50 down to 0.10", duration: "1.1s" },
					{ name: "render.pass", detail: "fab map only, no silkscreen", duration: "0.4s" },
					{ name: "emit.ipc2581", detail: "COUPON-W rev A.3", duration: "0.3s" },
				],
			},
			{
				kind: "checks",
				checks: [
					{ severity: "ok", label: "All eight traces above the 0.10 mm floor" },
					{ severity: "warning", label: "Below 0.15 mm, expect open circuits after cure" },
				],
			},
			{
				kind: "prose",
				paragraphs: [
					"Here's the sweep. Eight traces, 40 mm long, each with a four-wire pad pair at both ends so you can measure resistance rather than eyeball continuity.",
				],
			},
			{
				kind: "figure",
				title: "COUPON-W rev A.3",
				figure: "coupon",
				caption: [
					{ value: "26 × 18 mm" },
					{ label: "1 layer" },
					{ label: "silver ink" },
					{ label: "four-wire pads" },
				],
			},
			{
				kind: "table",
				title: "Last run · silver, 120 °C for 20 min",
				note: "40 mm length",
				headers: ["Width", "R measured", "R expected", "Yield"],
				rows: [
					["0.50 mm", "0.41 Ω", "0.38 Ω", "8/8"],
					["0.30 mm", "0.72 Ω", "0.63 Ω", "8/8"],
					["0.20 mm", "1.34 Ω", "0.95 Ω", "7/8"],
					["0.15 mm", "2.90 Ω", "1.27 Ω", "5/8"],
					["0.10 mm", "open", "1.90 Ω", "1/8"],
				],
			},
			{
				kind: "prose",
				paragraphs: [
					"The gap between measured and expected widens below 0.20 mm, which reads like the ink is thinning at the nozzle rather than the geometry being wrong. Worth a second sweep at a slower feed before you change the formulation.",
				],
			},
			{
				kind: "footer",
				artifacts: true,
				stats: [{ value: "26 × 18 mm" }, { value: "1 layer" }, { value: "~22 m to print" }],
			},
		],
	},

	clearance: {
		id: "clearance",
		thinking: "Reading DRC output · isolating U3",
		sections: [
			{
				kind: "steps",
				steps: [
					{ name: "drc.read", detail: "3 violations, all around U3", duration: "0.3s" },
					{ name: "geom.trace", detail: "pin 4 to GND pour", duration: "0.6s" },
					{ name: "rules.check", detail: "Alumina Z1 · 0.30 mm target", duration: "0.2s" },
				],
			},
			{
				kind: "checks",
				checks: [
					{
						severity: "error",
						label: "U3.4 to GND pour is 0.21 mm, under the 0.30 mm target",
					},
					{ severity: "error", label: "U3.5 to GND pour is 0.24 mm" },
					{ severity: "warning", label: "Pour necks to 0.18 mm between the two pads" },
				],
			},
			{
				kind: "prose",
				paragraphs: [
					"It isn't the routing — it's the pour. U3 is a SOT-23-5 with 0.95 mm pitch, and the ground fill is coming in tight against pins 4 and 5.",
				],
			},
			{
				kind: "figure",
				title: "U3 · pins 4–5 detail",
				figure: "clearance",
				caption: [
					{ value: "0.21 mm", label: "actual" },
					{ label: "0.30 mm required" },
					{ label: "40x" },
				],
			},
			{
				kind: "prose",
				paragraphs: [
					"Three ways out, cheapest first: raise the pour clearance to 0.35 mm and let it retreat on its own; add a local keepout around U3; or move to the 0.1 mm nozzle for this board only, which makes 0.21 mm legal but slows the print by about 25 minutes. I'd take the first.",
				],
			},
			{
				kind: "footer",
				artifacts: true,
				stats: [{ value: "3 violations" }, { value: "1 net affected" }],
			},
		],
	},

	/** Where an answered PLAN_FORM lands: a first pass with nothing assumed. */
	generic: {
		id: "generic",
		thinking: "Writing board source · rendering fab pass",
		sections: [
			{
				kind: "steps",
				steps: [
					{ name: "netlist.write", detail: "schematic to nets", duration: "1.1s" },
					{ name: "board.html", detail: "Board, TraceSet, Via", duration: "2.4s" },
					{ name: "route.solve", detail: "0.30 mm min · Z1 ruleset", duration: "7.4s" },
					{ name: "render.pass", detail: "visual + fab colour maps", duration: "0.7s" },
					{ name: "check.drc", detail: "Alumina Z1 ruleset", duration: "1.1s" },
					{ name: "emit.ipc2581", detail: "rev A.1", duration: "0.4s" },
				],
			},
			{
				kind: "checks",
				checks: [
					{ severity: "ok", label: "All nets routed at or above 0.30 mm" },
					{ severity: "ok", label: "Every part resolves to an orderable number" },
					{
						severity: "warning",
						label: "Two parts are extended, not basic — check stock before you order",
					},
				],
			},
			{
				kind: "prose",
				paragraphs: [
					"First pass is written and rendered. I kept everything on the conservative side of your process, so this should print without a fight before we start optimising.",
				],
			},
			{
				kind: "figure",
				title: "rev A.1",
				figure: "board-top",
				views: [...BOARD_VIEWS],
				caption: [{ value: "first pass" }, { label: "F.Cu shown" }, { label: "0.30 mm min" }],
			},
			{
				kind: "prose",
				paragraphs: [
					"Tell me what's wrong with it and I'll re-route rather than start over — the board source is small enough that changes are cheap.",
				],
			},
			{
				kind: "footer",
				artifacts: true,
				stats: [
					{ value: "first pass" },
					{ value: "2 signal + 2 plane" },
					{ value: "~1 h 50 m to print" },
				],
			},
		],
	},

	materials: {
		id: "materials",
		thinking: "Comparing cured properties on the Z1 process",
		sections: [
			{
				kind: "steps",
				steps: [
					{ name: "data.load", detail: "coupon runs since March", duration: "0.4s" },
					{ name: "compare.cure", detail: "120 °C · 20 min", duration: "1.2s" },
					{ name: "cost.model", detail: "per board at 24 × 18 mm", duration: "0.5s" },
				],
			},
			{
				kind: "prose",
				paragraphs: [
					"Short version: carbon is for finding out whether the geometry works, silver is for boards you intend to use. The gap is about two orders of magnitude in sheet resistance, and it doesn't close at any width.",
				],
			},
			{
				kind: "table",
				title: "Conductive inks · cured, 0.30 mm trace",
				note: "4-wire, 40 mm",
				headers: ["Ink", "Sheet R", "Cost / board", "Cure", "Use"],
				rows: [
					["Silver", "0.02 Ω/□", "$0.31", "120 °C · 20 min", "production"],
					["Graphene", "0.9 Ω/□", "$0.44", "150 °C · 30 min", "experimental"],
					["Carbon", "2.4 Ω/□", "$0.06", "100 °C · 15 min", "prototyping"],
					["Carbon + Ag flake", "0.3 Ω/□", "$0.18", "120 °C · 20 min", "trials"],
				],
			},
			{
				kind: "prose",
				paragraphs: [
					"At 0.3 mm a 40 mm carbon trace is roughly 3 Ω, which is fine for a logic line and hopeless for a 2 A rail. Silver on the same geometry lands near 0.7 Ω:",
				],
			},
			{
				kind: "figure",
				title: "Width sweep · both inks",
				figure: "coupon",
				caption: [
					{ value: "26 × 18 mm" },
					{ label: "four-wire pads" },
					{ label: "silver plotted" },
				],
			},
			{
				kind: "table",
				title: "Substrates",
				note: "stocked",
				headers: ["Substrate", "Tg", "Flex", "Print", "Notes"],
				rows: [
					["PC-GF", "145 °C", "no", "easy", "the prototyping default"],
					["PEI-1010", "217 °C", "no", "hot end 380 °C", "layer-on-layer, no lamination"],
					["TPC-HT", "—", "yes", "slow", "tails and folded assemblies"],
				],
			},
			{
				kind: "prose",
				paragraphs: [
					"For anything that flexes, TPC-HT is the only one on that list that survives a bend radius under 10 mm. It prints slowly and it warps if you rush the first layer, so budget accordingly.",
				],
			},
		],
	},

	fabtime: {
		id: "fabtime",
		thinking: "Slicing the current board · estimating from the path",
		sections: [
			{
				kind: "steps",
				steps: [
					{ name: "slice.plan", detail: "per-layer paths to STL", duration: "2.1s" },
					{ name: "path.estimate", detail: "travel + deposition + cure", duration: "0.9s" },
					{ name: "tools.order", detail: "minimising swaps", duration: "0.3s" },
				],
			},
			{
				kind: "prose",
				paragraphs: [
					"About 1 h 42 m end to end on the bench Z1, assuming no tool faults and the ink at room temperature when you start.",
				],
			},
			{
				kind: "table",
				title: "Where the time goes",
				note: "total 1 h 42 m",
				headers: ["Stage", "Passes", "Time", "Note"],
				rows: [
					["Substrate layers", "4", "38 m", "0.4 mm nozzle, bulk infill"],
					["Channel walls", "4", "21 m", "0.2 mm nozzle"],
					["Ink deposition", "2", "24 m", "0.08 mm pneumatic"],
					["Cure dwell", "2", "20 m", "120 °C, in place"],
					["Tool changes", "11", "3 m", "14 s each"],
				],
			},
			{
				kind: "prose",
				paragraphs: [
					"The cure dwell is the part worth attacking — it's dead time with the head parked. If you can cure layer two while layer three prints, this drops under 90 minutes without touching the motion system.",
				],
			},
			{
				kind: "footer",
				stats: [
					{ value: "1 h 42 m" },
					{ value: "11 tool changes" },
					{ value: "~$0.94 in consumables" },
				],
			},
		],
	},

	plan: {
		id: "plan",
		thinking: "Nothing to work from yet · planning from the prompt",
		sections: [
			{
				kind: "steps",
				steps: [
					{ name: "intent.parse", detail: "extracting constraints", duration: "0.6s" },
					{ name: "rules.load", detail: "Alumina Z1 · 0.10 mm floor", duration: "0.3s" },
					{ name: "parts.search", detail: "candidate topologies", duration: "1.9s" },
				],
			},
			{
				kind: "prose",
				paragraphs: [
					"Before I write any board source, let me pin down what you actually need — I'd rather ask than guess and hand you a board you can't use.",
				],
			},
			{ kind: "form", form: PLAN_FORM },
		],
	},
}
