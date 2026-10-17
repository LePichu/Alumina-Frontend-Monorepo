/** kiln's workspace seam: the process, the machines, the account.
 *
 * Separate from agent.ts on purpose. agent.ts is the seam a *model* replaces;
 * this is the seam a *machine connection* and an auth system replace. They will
 * not arrive together, and they are not the same contract.
 *
 * Everything here is synchronous today because it is static fixture data. When
 * the printer protocol lands, `listPrinters` and `getProcess` become async
 * without any component learning about it — they are already behind functions
 * for that reason.
 */

import { ACCOUNT, MACHINE, PRINTERS, PROCESS, WHERE } from "../fixtures/workspace"

/** Where runs execute. Local keeps board source on the machine. */
export type Where = "local" | "remote"

export type ProcessRule = { label: string; value: string }
export type Printer = { id: string; name: string }
export type Account = { handle: string; email: string; role: string }

/** The four strings that change with `Where`, kept together so they cannot drift
 *  apart: the rail's status row, its right-hand meta, the account pane's note,
 *  and the settings nav's signature line. */
export type WhereCopy = { status: string; meta: string; note: string; signature: string }

export function getProcess(): ProcessRule[] {
	return PROCESS
}

/** The machine the process rules came from. */
export function getMachine(): string {
	return MACHINE
}

export function listPrinters(): Printer[] {
	return PRINTERS
}

export function getAccount(): Account {
	return ACCOUNT
}

export function describeWhere(where: Where): WhereCopy {
	return WHERE[where]
}
