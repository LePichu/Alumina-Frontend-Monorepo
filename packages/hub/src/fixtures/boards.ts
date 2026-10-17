/** Board listings, lifted from quarry.html.
 *
 * Boards on quarry are git repositories (Git LFS for large objects), not uploaded
 * archives — these stand in for what the backend will eventually return. Auth,
 * git hosting, LFS and search are all still open, so every server function in
 * src/lib/quarry.ts answers from here.
 *
 * The signed-in user is `avthenticstemcel`, who owns i2c-fanout-6.
 */

import type { Board, BoardFile, Check, FilterGroup } from "../lib/quarry"

export const BOARDS: Board[] = [
	{
		slug: "i2c-fanout-6",
		namespace: "avthenticstemcel",
		licence: "CC0",
		layers: 2,
		size: [44, 40],
		fitsPlate: true,
		updated: "2 days ago",
		description:
			"Six addressable I²C ports off one bus, pull-ups jumpered per port. Printed on an Alumina Z1 with 0.8 mm carbon ink.",
		topics: ["i2c", "bus", "sources"],
		forks: 48,
		stars: 731,
		prints: 731,
		downloads: 4020,
		ink: 0.52,
		fab: 12.8,
		bom: 3.1,
	},
	{
		slug: "usb-c-breakout",
		namespace: "mrothe",
		licence: "CC0",
		layers: 2,
		size: [22, 18],
		fitsPlate: true,
		updated: "6 days ago",
		description:
			"Sink-only USB-C breakout with the CC resistors populated. The most printed board on quarry.",
		topics: ["usb-c", "connector"],
		forks: 96,
		stars: 1880,
		prints: 1880,
		downloads: 9210,
		ink: 0.21,
		fab: 9.4,
		bom: 1.1,
	},
	{
		slug: "flex-strain-tail",
		namespace: "sundaram",
		licence: "CC-BY-SA",
		layers: 1,
		size: [120, 14],
		fitsPlate: false,
		updated: "3 weeks ago",
		description:
			"Single-sided strain tail on polyimide. 120 mm long, so it overhangs the plate and has to be fabbed.",
		topics: ["flex", "sensor"],
		forks: 6,
		stars: 88,
		prints: 0,
		downloads: 640,
		ink: 0.48,
		fab: 24.0,
		bom: 0.9,
	},
]

/** mica's validation, run at publish time. Severity by icon and label. */
export const CHECKS: Check[] = [
	{ severity: "ok", label: "Parses as IPC-2581C", detail: "revision C · 1 step" },
	{ severity: "ok", label: "Outline closed and single", detail: "one profile" },
	{ severity: "ok", label: "Trace ≥ 0.10 mm", detail: "narrowest 0.25 mm" },
	{ severity: "ok", label: "Clearance ≥ 0.15 mm", detail: "tightest 0.21 mm at U1.4" },
	{ severity: "warning", label: "Via drill under profile comfort", detail: "8 vias at 0.30 mm" },
	{ severity: "ok", label: "Every net connected", detail: "6 nets · 0 unrouted" },
]

/** Outputs are labelled as generated where they are. */
export const FILES: BoardFile[] = [
	{ name: "board.xml", kind: "IPC-2581C", size: "412 KB", generated: true },
	{ name: "board.stl", kind: "Mesh · from mica", size: "319 KB", generated: true },
	{ name: "open.json", kind: "Handoff", size: "1 KB", generated: true },
	{ name: "sources.zip", kind: "KiCad project", size: "1.4 MB", generated: false },
	{ name: "bom.csv", kind: "Bill of materials", size: "4 KB", generated: false },
]

/** Search facets. Counts are the backend's to compute — there is no search
 *  backend yet, so these are the prototype's, and toggling one filters nothing. */
export const FILTERS: FilterGroup[] = [
	{
		legend: "Process",
		options: [
			{ label: "Alumina Z1", count: 2, on: true },
			{ label: "2-layer fab", count: 3, on: true },
			{ label: "4-layer fab", count: 0 },
			{ label: "Flex", count: 1 },
		],
	},
	{
		legend: "Layers",
		options: [
			{ label: "1", count: 1, on: true },
			{ label: "2", count: 2, on: true },
			{ label: "4", count: 0 },
		],
	},
	{
		legend: "Licence",
		options: [
			{ label: "CC0", count: 2 },
			{ label: "CC-BY-SA", count: 1 },
			{ label: "CERN-OHL-S", count: 0 },
		],
	},
	{
		legend: "State",
		options: [
			{ label: "Fits your plate", on: true },
			{ label: "Checks passed", on: true },
			{ label: "Sources attached" },
			{ label: "Built by someone" },
		],
	},
]

/** The hero sweep's phases, in order. */
export const PHASES = [
	"Laying substrate",
	"Filling channels",
	"Curing the ink",
	"Pressing the stack",
] as const
