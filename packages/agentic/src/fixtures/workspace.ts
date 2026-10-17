/** The rail's standing facts: the process kiln designs to, the machines it can
 *  hand off to, and who is signed in.
 *
 * None of this is agent output, so it does not belong in replies.ts. It is still
 * fixture data — a real build reads the process from the machine on connect and
 * the account from whatever auth kiln ends up with — so it is reached through
 * src/lib/workspace.ts, never imported directly by a component.
 */

import type { Account, Printer, ProcessRule, WhereCopy } from "../lib/workspace"

/** Reported by the machine, not configured here. Shown read-only. */
export const PROCESS: ProcessRule[] = [
	{ label: "trace floor", value: "0.10 mm" },
	{ label: "target", value: "0.30 mm" },
	{ label: "stack", value: "4 · 1.60 mm" },
	{ label: "ink", value: "silver" },
]

export const MACHINE = "Alumina Z1"

export const PRINTERS: Printer[] = [
	{ id: "bench", name: "Alumina Z1 · bench" },
	{ id: "lab-2", name: "Alumina Z1 · lab 2" },
	{ id: "export", name: "Export only" },
]

export const ACCOUNT: Account = {
	handle: "avthenticstemcel",
	email: "avthenticstemcel@kiln.cloud",
	role: "workspace owner · 7 threads",
}

/** Where runs execute. Every string that changes with it lives here rather than
 *  in the five components that show one of them. */
export const WHERE: Record<"local" | "remote", WhereCopy> = {
	local: {
		status: "this machine",
		meta: "3 models",
		note: "Models and board source stay on this machine. Nothing leaves unless you export it.",
		signature: "board source stays local",
	},
	remote: {
		status: "kiln.cloud · eu-west",
		meta: "signed in",
		note:
			"Runs execute on kiln.cloud. Board source syncs both ways; the printer still connects over USB from here.",
		signature: "syncing to kiln.cloud",
	},
}
