import { createSignal } from "solid-js"
import type { OpenBoard } from "./board"
import { keepDocuments } from "./documents"
import type { MicaSize } from "./mica"

/** A board that was opened here, and when. Its document is kept apart, in
 *  lib/documents.ts, under the same id. */
export type RecentBoard = {
	/** mica's board id: the SHA-256 of the document. */
	id: string
	name: string
	file: string
	layers: number | null
	size: MicaSize | null
	/** Milliseconds since the epoch. */
	openedAt: number
	/** Its picture, once one has been drawn: an image's address. */
	picture?: string
	/** Which run the picture was drawn from (`runKey`). A board's picture is
	 *  drawn again when the run on show is another — and was, for every picture
	 *  drawn before this was kept, since those may show another board. */
	pictureOf?: string
}

const KEY = "foundry.boards"
/** The list's old home, when its boards were fixtures: let go of. */
const RETIRED = "foundry.recent"
/** As many as the home screen has room to list. */
const KEEP = 8

const HOUR = 3_600_000

/** Kept in this browser's storage, or the desktop app's, and nowhere else. A
 *  private window, or storage switched off, has none: the list then lasts as
 *  long as the page does. */
function load(): RecentBoard[] {
	try {
		localStorage.removeItem(RETIRED)
		const list: unknown = JSON.parse(localStorage.getItem(KEY) ?? "[]")
		return Array.isArray(list)
			? (list as RecentBoard[]).filter((entry) => typeof entry?.id === "string")
			: []
	} catch {
		return []
	}
}

function save(list: RecentBoard[]) {
	try {
		localStorage.setItem(KEY, JSON.stringify(list))
	} catch {
		// No storage to keep it in. It still lasts as long as the page.
	}
}

/** The boards opened recently, newest first. It starts empty: a board is on it
 *  because it was opened here. */
export function createRecent() {
	const [list, setList] = createSignal<RecentBoard[]>(load())

	const commit = (next: RecentBoard[]) => {
		setList(next)
		save(next)
	}

	return {
		list,
		/** Puts a board at the top, once: opening one already in the list moves it,
		 *  and keeps the picture it had. Boards pushed off the end take their
		 *  documents with them. */
		remember(open: OpenBoard) {
			const before = list().find((entry) => entry.id === open.id)
			const entry: RecentBoard = {
				id: open.id,
				name: open.name,
				file: open.file,
				layers: open.board.layers,
				size: open.board.size_mm,
				openedAt: Date.now(),
				picture: before?.picture,
				pictureOf: before?.pictureOf,
			}
			const next = [entry, ...list().filter((other) => other.id !== open.id)].slice(0, KEEP)
			commit(next)
			void keepDocuments(next.map((other) => other.id))
		},
		/** Keeps a board's picture with it, and the run it was drawn from. */
		setPicture(id: string, picture: string, pictureOf: string) {
			commit(list().map((entry) => (entry.id === id ? { ...entry, picture, pictureOf } : entry)))
		},
		/** Takes a board off the list, and lets go of its kept document. Its file,
		 *  wherever it came from, is not touched; a tab it is open in stays open. */
		forget(id: string) {
			const next = list().filter((entry) => entry.id !== id)
			commit(next)
			void keepDocuments(next.map((other) => other.id))
		},
		/** Takes every board off the list, and lets go of every kept document. */
		clear() {
			commit([])
			void keepDocuments([])
		},
	}
}

export type Recent = ReturnType<typeof createRecent>

/** How long ago, as the list says it: "just now", "4 h ago", "yesterday". */
export function ago(at: number, now = Date.now()): string {
	const hours = Math.floor((now - at) / HOUR)
	if (hours < 1) return "just now"
	if (hours < 24) return `${hours} h ago`
	const days = Math.floor(hours / 24)
	return days === 1 ? "yesterday" : `${days} days ago`
}
