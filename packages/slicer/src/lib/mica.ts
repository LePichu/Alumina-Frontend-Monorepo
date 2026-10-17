/** The only way into mica, the engine that turns an IPC-2581 board into a print.
 *
 * mica runs as a local service — `mica serve`, on 127.0.0.1:8781 unless told
 * otherwise — and this module is its client: the HTTP API in mica's
 * docs/API.md, typed as it actually answers. Nothing outside this module knows
 * there is HTTP underneath; components get plain async functions and plain
 * data, and a failed call is a `MicaError` with mica's own code and words.
 *
 * mica sends no CORS headers, so the page cannot simply call it:
 *  - in development (the browser, and the desktop window under `tauri dev`)
 *    the slicer's dev server proxies /mica to it — see vite.config.ts;
 *  - in the desktop build, the request goes out through the window's own HTTP
 *    client (Tauri's http plugin), which is not a page and asks no one;
 *  - a slicer served on the web would need mica to allow its origin.
 */

import { inDesktop } from "./window"

/** Every option `mica` takes on its command line, under the same names. */
export type MicaOptions = {
	/** Which step (board) of a document that holds several. */
	step: string | null
	thickness: number
	pen: number
	depth: number
	nozzle: number
	layer_height: number
	floor_layers: number
	validate: boolean
	verbose: boolean
	no_ink: boolean
	one_piece: boolean
}

/** One row of mica's option table, read live from the binary (`GET /v1/options`). */
export type MicaOptionSpec = {
	name: string
	flag: string
	short: string | null
	type: "number" | "integer" | "boolean" | "string"
	nullable: boolean
	default: number | boolean | string | null
	description: string
}

export type MicaSize = { width: number; height: number }

/** A board in mica's store, as read at the default options when it was uploaded. */
export type MicaBoard = {
	/** The SHA-256 of the document: the same file is always the same board. */
	board: string
	bytes: number
	board_name: string | null
	layers: number | null
	/** The copper layers, bottom first — the order the slabs are numbered in. */
	conductors: string[]
	size_mm: MicaSize | null
	drills: number | null
	vias: number | null
	/** Why no board could be read at the default options, if none could. */
	summary_error: string | null
	cached: boolean
}

export type MicaSeverity = "blocker" | "warning" | "note"

export type MicaDiagnostic = {
	severity: MicaSeverity
	/** A stable label, shared by the repeats of one finding. */
	kind: string
	subject: string | null
	message: string
	detail: string[]
}

export type MicaVerdict = {
	/** Files were written, and nothing blocks printing. */
	printable: boolean
	blockers: number
	warnings: number
	notes: number
	blocking_kinds: number
	/** The command line's `VERDICT:` line. */
	text: string
}

export type MicaSlab = {
	/** From 1, bottom first. */
	index: number
	layer: string
	ink_mm3: number
	vias: number
	/** Already mirrored: printed as it is, and turned over after curing. */
	flipped: boolean
	files: string[]
}

export type MicaFile = { name: string; bytes: number; sha256: string; url: string }

export type MicaStage = {
	name: "validate" | "parse" | "ingest" | "plan" | "mesh"
	millis: number
	cached: boolean
}

/** One conversion of a board at one set of options. */
export type MicaRun = {
	board: string
	/** Derived from the board and the options: the same options are the same run. */
	run: string
	options: MicaOptions
	board_name: string
	size_mm: MicaSize | null
	layers: number
	schema_ok: boolean
	/** `refused` wrote nothing: the geometry could not be built. */
	outcome: "laminated" | "one_piece" | "refused"
	verdict: MicaVerdict
	slabs: MicaSlab[]
	total_ink_mm3: number
	/** Board-level files: the assembly preview, the frame, the jig, the pins. */
	fixtures: string[]
	files: MicaFile[]
	diagnostics: MicaDiagnostic[]
	stages: MicaStage[]
	cached: boolean
}

export type MicaHealth = { status: string; version: string; uptime_s: number }

export type MicaCache = {
	uptime_s: number
	vfs: { budget: number; bytes: number; evictions: number; files: number; groups: number }
	runs: { computed: number; served_from_cache: number }
	jobs: { available: number; limit: number }
}

/** A call mica answered with an error, or one that never reached it.
 *
 *  `code` is mica's own, stable and meant for machines (`unparseable`,
 *  `board_not_found`, …); `message` is for people. A call that could not reach
 *  mica at all has status 0 and the code `unreachable`. */
export class MicaError extends Error {
	constructor(readonly status: number, readonly code: string, message: string) {
		super(message)
		this.name = "MicaError"
	}
}

export const isMicaError = (error: unknown): error is MicaError => error instanceof MicaError

/** mica's own default address. */
export const MICA_DEFAULT = "http://127.0.0.1:8781"

const ADDRESS_KEY = "foundry.mica"

/** Where the desktop build reaches mica: kept, so it can be moved. */
export function micaAddress(): string {
	try {
		return localStorage.getItem(ADDRESS_KEY) || MICA_DEFAULT
	} catch {
		return MICA_DEFAULT
	}
}

export function setMicaAddress(address: string) {
	try {
		if (address.trim() && address.trim() !== MICA_DEFAULT) {
			localStorage.setItem(ADDRESS_KEY, address.trim().replace(/\/+$/, ""))
		} else localStorage.removeItem(ADDRESS_KEY)
	} catch {
		// Nowhere to keep it; the default stands.
	}
}

/** How this page reaches mica: through the dev server's proxy, or directly. */
export function micaRoute(): { via: "proxy"; target: string } | { via: "direct"; target: string } {
	return import.meta.env.DEV
		? { via: "proxy", target: import.meta.env.MICA_PROXIED_TO }
		: { via: "direct", target: micaAddress() }
}

type Fetch = (input: string, init?: RequestInit) => Promise<Response>

let desktopFetch: Promise<Fetch> | undefined

/** The fetch that can reach mica from here. */
function transport(): Promise<Fetch> {
	if (import.meta.env.DEV || !inDesktop()) {
		return Promise.resolve((input, init) => fetch(input, init))
	}
	desktopFetch ??= import("@tauri-apps/plugin-http").then((http) => http.fetch)
	return desktopFetch
}

/** An API path as this page addresses it. Links mica hands back (`files[].url`)
 *  are paths from its root, and go through here too. */
function address(path: string): string {
	return import.meta.env.DEV ? `/mica${path}` : `${micaAddress()}${path}`
}

async function request(path: string, init?: RequestInit): Promise<Response> {
	const go = await transport()
	let response: Response
	try {
		response = await go(address(path), init)
	} catch (error) {
		throw new MicaError(
			0,
			"unreachable",
			`mica is not answering at ${micaRoute().target}. Start it with \`mica serve\`.` +
				(error instanceof Error && error.message ? ` (${error.message})` : ""),
		)
	}
	// The dev proxy answers 502 or 504 itself when mica is not there, with no
	// JSON of mica's: that is the same as not reaching it.
	if (response.status === 502 || response.status === 504) {
		throw new MicaError(
			0,
			"unreachable",
			`mica is not answering at ${micaRoute().target}. Start it with \`mica serve\`.`,
		)
	}
	if (!response.ok) {
		const body = await response.json().catch(() => undefined) as
			| { error?: { status?: number; code?: string; message?: string } }
			| undefined
		throw new MicaError(
			response.status,
			body?.error?.code ?? "http",
			body?.error?.message ?? `mica answered ${response.status} ${response.statusText}`,
		)
	}
	return response
}

const json = async <T>(path: string, init?: RequestInit): Promise<T> =>
	(await request(path, init)).json() as Promise<T>

/** Whether mica is up, and which build. */
export function health(): Promise<MicaHealth> {
	return json("/v1/health")
}

/** What mica's stores hold: memory used and runs computed. */
export function cacheStats(): Promise<MicaCache> {
	return json("/v1/cache")
}

/** mica's option table — names, types, defaults and what each does. */
export async function listOptions(): Promise<MicaOptionSpec[]> {
	return (await json<{ options: MicaOptionSpec[] }>("/v1/options")).options
}

/** Hands mica a document, which parses and reads it on the spot. Something that
 *  is not IPC-2581 comes back as a `MicaError` coded `unparseable`. */
export function uploadBoard(document: string): Promise<MicaBoard> {
	return json("/v1/boards", {
		method: "POST",
		headers: { "Content-Type": "application/xml" },
		body: document,
	})
}

/** A board mica already holds; `board_not_found` if it has gone. mica keeps
 *  everything in memory, so a restart, or a full store, forgets boards. */
export function findBoard(board: string): Promise<MicaBoard> {
	return json(`/v1/boards/${board}`)
}

/** Converts a board. Options left out take mica's defaults; the same options
 *  again are the same run, answered from mica's store. A board that should not
 *  be printed is not an error: its run says so in `verdict` and `diagnostics`. */
export function runBoard(board: string, options: Partial<MicaOptions>): Promise<MicaRun> {
	return json(`/v1/boards/${board}/runs`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(options),
	})
}

/** One of a run's files, as bytes: a binary STL. */
export async function runFile(run: MicaRun, name: string): Promise<ArrayBuffer> {
	const file = run.files.find((entry) => entry.name === name)
	if (!file) throw new MicaError(404, "file_not_found", `run ${run.run} has no file ${name}`)
	return (await request(file.url)).arrayBuffer()
}

/** The report exactly as the command line prints it. */
export async function runReport(run: MicaRun, verbose = false): Promise<string> {
	return (await request(`/v1/boards/${run.board}/runs/${run.run}/report.txt?verbose=${verbose}`))
		.text()
}
