import { createSignal, onCleanup } from "solid-js"
import type { Accessor } from "solid-js"

/** The window the app is in, when it is in one.
 *
 *  In the desktop build (`@alumina/desktop`, Tauri) the window has no frame of
 *  its own — no title bar, no buttons — so `AppShell`'s bar is the frame, and
 *  its controls are handed these. In a browser tab there is no window to
 *  minimise or drag, the accessor stays `undefined`, and the bar shows none of
 *  them.
 *
 *  Tauri is the only thing that knows how to do any of this, and this module is
 *  the only thing that knows Tauri is there. Its API is imported when it is
 *  needed rather than up front, so a browser never downloads it.
 */
export type WindowControls = {
	minimize: () => void
	toggleMaximize: () => void
	close: () => void
	/** Moves the window with the pointer; the bar calls it on a press. */
	startDragging: () => void
	maximized: Accessor<boolean>
	/** How far the page is zoomed: 1 is 100%. */
	zoom: Accessor<number>
	/** Zooms to one of `ZOOMS`, and keeps it for the next launch. */
	setZoom: (level: number) => void
	/** The window's own title — the one the taskbar and the window switcher show. */
	setTitle: (title: string) => void
}

/** The desktop build runs the page inside Tauri, which leaves this behind. */
export const inDesktop = (): boolean =>
	typeof globalThis === "object" && "__TAURI_INTERNALS__" in globalThis

/** The zoom levels a browser steps through, so Ctrl + and Ctrl − land where the
 *  hand expects — 125% and 150% among them, which is where these pages are
 *  read. A window has no zoom of its own: Tauri's built-in zoom keys step by a
 *  fifth (100, 120, 140, 160) and miss both. */
export const ZOOMS = [0.5, 0.67, 0.75, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2, 2.5, 3]

/** Kept, so the app opens at the zoom it was left at. */
const ZOOM_KEY = "foundry.zoom"

function savedZoom(): number {
	try {
		const level = Number(localStorage.getItem(ZOOM_KEY))
		return ZOOMS.includes(level) ? level : 1
	} catch {
		return 1
	}
}

/** The next level up or down from `from`, which need not be one of the steps. */
function step(from: number, direction: 1 | -1): number {
	const ahead = direction === 1
		? ZOOMS.find((level) => level > from + 0.001)
		: [...ZOOMS].reverse().find((level) => level < from - 0.001)
	return ahead ?? from
}

/** Which way a key press zooms, if it is a zoom key at all: Ctrl with plus,
 *  minus or nought, from either row of keys. */
function zoomKey(event: KeyboardEvent): 1 | -1 | 0 | undefined {
	if (!(event.ctrlKey || event.metaKey) || event.altKey) return undefined
	if (event.key === "+" || event.key === "=" || event.code === "NumpadAdd") return 1
	if (event.key === "-" || event.key === "_" || event.code === "NumpadSubtract") return -1
	if (event.key === "0" || event.code === "Numpad0") return 0
	return undefined
}

export function createWindowControls(): Accessor<WindowControls | undefined> {
	const [controls, setControls] = createSignal<WindowControls>()
	if (!inDesktop()) return controls

	const stops: (() => void)[] = []
	let gone = false
	onCleanup(() => {
		gone = true
		for (const stop of stops) stop()
	})

	void (async () => {
		const [{ getCurrentWindow }, { getCurrentWebview }] = await Promise.all([
			import("@tauri-apps/api/window"),
			import("@tauri-apps/api/webview"),
		])
		const win = getCurrentWindow()
		const webview = getCurrentWebview()

		const [maximized, setMaximized] = createSignal(await win.isMaximized())
		// Maximising is a resize, and so is everything else that changes it: the
		// window manager's own snap, a double-click, a keyboard shortcut.
		const unlisten = await win.onResized(async () => setMaximized(await win.isMaximized()))
		if (gone) return unlisten()
		stops.push(unlisten)

		const [zoom, setZoom] = createSignal(savedZoom())
		const zoomTo = (level: number) => {
			setZoom(level)
			void webview.setZoom(level)
			try {
				localStorage.setItem(ZOOM_KEY, String(level))
			} catch {
				// Nowhere to keep it; it lasts until the window closes.
			}
		}
		if (zoom() !== 1) void webview.setZoom(zoom())

		const onKey = (event: KeyboardEvent) => {
			const direction = zoomKey(event)
			if (direction === undefined) return
			event.preventDefault()
			zoomTo(direction === 0 ? 1 : step(zoom(), direction))
		}
		// Captured, so a field or a menu that handles its own keys still lets the
		// zoom keys through.
		addEventListener("keydown", onKey, { capture: true })
		stops.push(() => removeEventListener("keydown", onKey, { capture: true }))

		setControls({
			minimize: () => void win.minimize(),
			toggleMaximize: () => void win.toggleMaximize(),
			close: () => void win.close(),
			startDragging: () => void win.startDragging(),
			maximized,
			zoom,
			setZoom: zoomTo,
			setTitle: (title) => void win.setTitle(title),
		})
	})()

	return controls
}

/** A drag of files over the desktop window, as the window reports it: where
 *  the pointer is, in the page's own pixels, and — once let go — the files. */
export type HostDrag =
	| { type: "enter"; names: string[]; x: number; y: number }
	| { type: "over"; x: number; y: number }
	| { type: "drop"; x: number; y: number; files: () => Promise<File[]> }
	| { type: "leave" }

/** The name at the end of a path, either way its separators lean. */
const baseName = (path: string) =>
	path.slice(Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\")) + 1)

/** A file the person chose — dropped on the window, or picked in its picker —
 *  read by the desktop crate's `read_chosen`, which reads nothing else. */
async function readChosen(path: string): Promise<File> {
	const { invoke } = await import("@tauri-apps/api/core")
	return new File([await invoke<ArrayBuffer>("read_chosen", { path })], baseName(path))
}

/** Asks for files with the desktop's own picker, in the desktop build: through
 *  the XDG desktop portal, so it is GNOME's dialog on GNOME and KDE's on KDE —
 *  not the GTK3 chooser WebKitGTK opens for a file input. `accept` is endings,
 *  as a file input's: `[".xml", ".cvg"]`. Nothing if it was dismissed. */
export async function pickHostFiles(
	label: string,
	accept: string[],
	multiple: boolean,
): Promise<File[]> {
	const { invoke } = await import("@tauri-apps/api/core")
	const paths = await invoke<string[]>("pick_files", {
		label,
		extensions: accept.map((ending) => ending.replace(/^\./, "")),
		multiple,
	})
	return Promise.all(paths.map(readChosen))
}

/** Hears files dragged over the desktop window and dropped on it; returns the
 *  way to stop. In a browser it hears nothing: the page has the drop itself.
 *
 *  The window has to take the drop for the page. WebKitGTK no longer hands a
 *  page the files in a drop — `dataTransfer.files` arrives empty (WebKit bugs
 *  320301 and 323277, since the fix for CVE-2025-13947), so a board dropped on
 *  the window opened nothing. With Tauri's drop handling on, the window is told
 *  the paths instead, and the bytes of each come from the desktop crate's
 *  `read_chosen`, which reads only what was dropped or picked.
 */
export function onHostDrag(handle: (drag: HostDrag) => void): () => void {
	if (!inDesktop()) return () => {}
	let stop: (() => void) | undefined
	let stopped = false

	void (async () => {
		const { getCurrentWebview } = await import("@tauri-apps/api/webview")
		const webview = getCurrentWebview()
		// Device pixels to the page's: the screen's scale and the page's zoom
		// together, measured rather than worked out from either.
		let ratio = devicePixelRatio
		const measure = async () => {
			const width = document.documentElement.clientWidth
			if (width > 0) ratio = (await webview.size()).width / width
		}
		const at = (position: { x: number; y: number }) => ({
			x: position.x / ratio,
			y: position.y / ratio,
		})

		const unlisten = await webview.onDragDropEvent(async ({ payload }) => {
			switch (payload.type) {
				case "enter":
					await measure()
					handle({ type: "enter", names: payload.paths.map(baseName), ...at(payload.position) })
					break
				case "over":
					handle({ type: "over", ...at(payload.position) })
					break
				case "drop": {
					const paths = payload.paths
					handle({
						type: "drop",
						...at(payload.position),
						files: () => Promise.all(paths.map(readChosen)),
					})
					break
				}
				case "leave":
					handle({ type: "leave" })
			}
		})
		if (stopped) unlisten()
		else stop = unlisten
	})()

	return () => {
		stopped = true
		stop?.()
	}
}
