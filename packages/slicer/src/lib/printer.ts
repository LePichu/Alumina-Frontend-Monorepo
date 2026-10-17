/** The only way to the printer: which machines there are, what a machine says
 *  it has on its tool plate, and the limits it prints to.
 *
 *  None of it is real yet. Talking to a machine — and turning a board into the
 *  G-code it runs — is shale's, and shale is not wired in, so the printers and
 *  their tool modules come from src/fixtures/printer.ts. When shale is, it
 *  replaces the bodies here and no component changes. (This used to live in the
 *  mica adapter. mica turns a board into geometry and knows nothing of
 *  printers.)
 */

import { MODULES, PRINTERS } from "../fixtures/printer"

export type Printer = {
	name: string
	link: string
	state: string
	/** Where it is reached: a serial device or an address on the network. */
	address: string
	firmware: string
}

/** Fill patterns, not colours — the prototypes separate tools by pattern. */
export type ToolPattern = "solid" | "hatch" | "gray" | "dots" | "cross" | "open"

/** Reported by the machine on connect. Read-only in the slicer. */
export type ToolModule = {
	id: string
	name: string
	pattern: ToolPattern
	online: boolean
	fields: { label: string; value: string; unit?: string }[]
}

/** Machine limits. Reported on connect, but travel, acceleration and the bed
 *  are the operator's to override, so unlike tool modules these are editable. */
export type MachineSettings = {
	kinematics: string
	bed: number
	travel: number
	accel: number
	parkOnSwap: boolean
	probeEachTool: boolean
}

export const MACHINE_DEFAULTS: MachineSettings = {
	kinematics: "Jubilee",
	bed: 60,
	travel: 300,
	accel: 3000,
	parkOnSwap: true,
	probeEachTool: true,
}

export function listPrinters(): Promise<Printer[]> {
	return Promise.resolve(PRINTERS)
}

/** The tool modules on the chosen machine's plate. */
export function listToolModules(): Promise<ToolModule[]> {
	return Promise.resolve(MODULES)
}
