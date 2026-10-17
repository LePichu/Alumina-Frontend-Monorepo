/** Stand-in data for the printer: which machines there are, and the tool
 * modules a machine reports when it connects.
 *
 * There is no printer connection yet — that is shale's, and shale is not wired
 * in — so this is what the printer adapter answers with. Lifted from
 * mica.html, where it was invented too. Reached only through src/lib/printer.ts.
 */

import type { Printer, ToolModule } from "../lib/printer"

export const PRINTERS: Printer[] = [
	{ name: "Alumina Z1", link: "USB", state: "Ready", address: "/dev/ttyACM0", firmware: "3.5.1" },
	{
		name: "Alumina Z1 · bench",
		link: "LAN",
		state: "Idle",
		address: "192.168.1.42",
		firmware: "3.4.9",
	},
	{ name: "Add printer…", link: "", state: "Not connected", address: "", firmware: "" },
]

/** Reported by the machine on connect, so the slicer only displays them. */
export const MODULES: ToolModule[] = [
	{
		id: "T0",
		name: "Extruder",
		pattern: "solid",
		online: true,
		fields: [
			{ label: "filament", value: "PETG" },
			{ label: "nozzle", value: "0.4", unit: "mm" },
			{ label: "temp", value: "235", unit: "°C" },
			{ label: "shell speed", value: "120", unit: "mm/s" },
		],
	},
	{
		id: "T1",
		name: "Ink",
		pattern: "hatch",
		online: true,
		fields: [
			{ label: "passes", value: "2", unit: "n" },
			{ label: "paint speed", value: "25", unit: "mm/s" },
			{ label: "line width", value: "0.80", unit: "mm" },
		],
	},
	{
		id: "T2",
		name: "Dryer",
		pattern: "gray",
		online: true,
		fields: [
			{ label: "dry / pass", value: "18", unit: "min" },
			{ label: "temp", value: "55", unit: "°C" },
			{ label: "fan", value: "60", unit: "%" },
		],
	},
	{
		id: "T3",
		name: "Driller",
		pattern: "dots",
		online: true,
		fields: [
			{ label: "bit", value: "0.40", unit: "mm" },
			{ label: "rpm", value: "12000", unit: "n" },
			{ label: "plunge", value: "3", unit: "mm/s" },
		],
	},
	{
		id: "T4",
		name: "Camera",
		pattern: "cross",
		online: true,
		fields: [
			{ label: "fiducials", value: "4", unit: "n" },
			{ label: "exposure", value: "12", unit: "ms" },
			{ label: "capture", value: "1", unit: "/layer" },
		],
	},
	{
		id: "T5",
		name: "Paste",
		pattern: "open",
		online: false,
		fields: [
			{ label: "aperture", value: "0.50", unit: "mm" },
			{ label: "dwell", value: "120", unit: "ms" },
			{ label: "purge", value: "2", unit: "mm" },
		],
	},
]
