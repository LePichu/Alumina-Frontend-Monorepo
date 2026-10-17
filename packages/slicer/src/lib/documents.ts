/** The IPC-2581 documents of the boards opened here, kept so that one can be
 *  opened again.
 *
 *  mica keeps what it is given in memory only: a restart, or a full store,
 *  forgets every board. A board on the recent list is reopened from its document
 *  — handed to mica again if mica has forgotten it — and a page cannot go back to
 *  a file it was once handed, so the document itself is kept: in IndexedDB,
 *  keyed by mica's id for it (the SHA-256 of the bytes), in this browser's
 *  storage or the desktop app's. Local storage would hold a few small boards;
 *  a real one runs to megabytes.
 *
 *  Without IndexedDB (a private window, storage switched off) nothing is kept,
 *  and a board lasts as long as its tab.
 */

export type StoredDocument = {
	/** mica's board id: the SHA-256 of `text`. */
	id: string
	/** The file it came from. */
	file: string
	text: string
}

const DATABASE = "foundry"
const STORE = "documents"

let opened: Promise<IDBDatabase> | undefined

function database(): Promise<IDBDatabase> {
	opened ??= new Promise((resolve, reject) => {
		const request = indexedDB.open(DATABASE, 1)
		request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: "id" })
		request.onsuccess = () => resolve(request.result)
		request.onerror = () => reject(request.error)
	})
	return opened
}

/** Runs one request in a transaction of its own. */
async function inStore<T>(
	mode: IDBTransactionMode,
	act: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
	const db = await database()
	return new Promise((resolve, reject) => {
		const request = act(db.transaction(STORE, mode).objectStore(STORE))
		request.onsuccess = () => resolve(request.result)
		request.onerror = () => reject(request.error)
	})
}

export async function saveDocument(document: StoredDocument): Promise<void> {
	try {
		await inStore("readwrite", (store) => store.put(document))
	} catch {
		// Nowhere to keep it: the board lasts as long as its tab.
	}
}

export async function loadDocument(id: string): Promise<StoredDocument | undefined> {
	try {
		return (await inStore<StoredDocument | undefined>("readonly", (store) => store.get(id))) ??
			undefined
	} catch {
		return undefined
	}
}

/** Lets go of every document but these: the boards still on the recent list. */
export async function keepDocuments(ids: readonly string[]): Promise<void> {
	try {
		const all = await inStore<IDBValidKey[]>("readonly", (store) => store.getAllKeys())
		for (const key of all) {
			if (typeof key === "string" && !ids.includes(key)) {
				await inStore("readwrite", (store) => store.delete(key))
			}
		}
	} catch {
		// Nothing kept, nothing to let go of.
	}
}
