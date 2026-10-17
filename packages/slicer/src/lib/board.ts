/** A board as the app holds it: mica's reading of it, what its header says, and
 *  the document itself.
 *
 *  mica is the authority on whether a file is a board, and on everything it
 *  makes of one — layers, size, drills, every run. What it does not report is the
 *  header's own record of where the board came from (its revision, who made it
 *  and whose it is, the tool and the date), so that much is read here, straight
 *  out of the file: real, never typed in, and never a stand-in.
 */

import { loadDocument, saveDocument } from "./documents"
import { findBoard, isMicaError, runBoard, uploadBoard } from "./mica"
import type { MicaBoard, MicaOptions, MicaRun } from "./mica"

/** Read out of the IPC-2581 header. Never typed in by the user. */
export type BoardHeader = {
	revision: string
	rows: { label: string; value: string }[]
}

export type OpenBoard = {
	/** mica's id for it: the SHA-256 of the document. */
	id: string
	/** What it is called: mica's reading, else the file's name. */
	name: string
	/** The file it came from. */
	file: string
	header: BoardHeader
	board: MicaBoard
	/** Held so mica can be handed it again when it has forgotten it. */
	document: string
}

/** A file that was opened as a board and is not one. */
export type NotABoard = { kind: "not-a-board"; file: string; reason: string }

export const isNotABoard = (result: OpenBoard | NotABoard): result is NotABoard =>
	"kind" in result && result.kind === "not-a-board"

/** What an EDA tool writes when it has nothing to say. KiCad's export is full of
 *  them, and a header row reading "UNKNOWN" is worse than no row. */
const BLANK = /^(unknown|none|no label|no comment)?$/i

/** The header, read out of the document. Whatever cannot be read is left out:
 *  mica has already said whether this is a board at all. */
export function readHeader(document: string, file: string): BoardHeader {
	const doc = new DOMParser().parseFromString(document, "application/xml")
	if (doc.getElementsByTagName("parsererror").length) {
		return { revision: "no revision", rows: [{ label: "file", value: file }] }
	}

	// Namespaced or not, by local name: exporters disagree about the default namespace.
	const first = (tag: string) => doc.getElementsByTagNameNS("*", tag)[0]
	const read = (tag: string, name: string) => {
		const value = first(tag)?.getAttribute(name)?.trim()
		return value && !BLANK.test(value) ? value : undefined
	}

	const revisionId = read("FileRevision", "fileRevisionId")
	const units = doc.querySelector("[units]")?.getAttribute("units")
	const mode = read("FunctionMode", "mode")
	const date = read("HistoryRecord", "lastChange") ?? read("HistoryRecord", "origination")

	return {
		revision: read("FileRevision", "label") ?? (revisionId ? `rev ${revisionId}` : "no revision"),
		rows: [
			{ label: "author", value: read("Person", "name") },
			{ label: "company", value: read("Enterprise", "name") },
			{ label: "generated", value: read("HistoryRecord", "software") },
			{ label: "date", value: date?.slice(0, 10) },
			{ label: "units", value: units === "INCH" ? "in" : units ? "mm" : undefined },
			{ label: "role", value: mode && mode.charAt(0) + mode.slice(1).toLowerCase() },
			{ label: "file", value: file },
		].filter((row): row is { label: string; value: string } => Boolean(row.value)),
	}
}

function assemble(board: MicaBoard, file: string, document: string): OpenBoard {
	return {
		id: board.board,
		name: board.board_name ?? file.replace(/\.[^.]+$/, ""),
		file,
		header: readHeader(document, file),
		board,
		document,
	}
}

/** The codes mica gives a document it cannot take as a board. */
const REFUSALS = new Set(["unparseable", "empty_body", "not_utf8", "bad_body"])

/** Opens a file someone dropped or picked: hands it to mica, which reads it,
 *  and keeps the document for the next time. A file mica will not take as a
 *  board comes back as `NotABoard`, in mica's words; mica not answering is a
 *  `MicaError`, thrown. */
export async function openFile(file: File): Promise<OpenBoard | NotABoard> {
	const document = await file.text()
	let board: MicaBoard
	try {
		board = await uploadBoard(document)
	} catch (error) {
		if (isMicaError(error) && (REFUSALS.has(error.code) || error.status === 413)) {
			return { kind: "not-a-board", file: file.name, reason: error.message }
		}
		throw error
	}
	await saveDocument({ id: board.board, file: file.name, text: document })
	return assemble(board, file.name, document)
}

/** Opens a board opened here before, from its kept document; nothing if the
 *  document was not kept. mica is handed it again if it has forgotten it. */
export async function openStored(id: string): Promise<OpenBoard | undefined> {
	const stored = await loadDocument(id)
	if (!stored) return undefined
	const board = await findBoard(id).catch((error: unknown) => {
		if (isMicaError(error) && error.code === "board_not_found") return uploadBoard(stored.text)
		throw error
	})
	return assemble(board, stored.file, stored.text)
}

/** Runs a board, handing mica the document again first if it has forgotten it
 *  — a restart of `mica serve`, or a board pushed out of its store. */
export async function runOpen(open: OpenBoard, options: Partial<MicaOptions>): Promise<MicaRun> {
	try {
		return await runBoard(open.id, options)
	} catch (error) {
		if (!isMicaError(error) || error.code !== "board_not_found") throw error
		await uploadBoard(open.document)
		return runBoard(open.id, options)
	}
}
