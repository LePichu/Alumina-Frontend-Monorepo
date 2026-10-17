import { inDesktop, onHostDrag, pickHostFiles } from "./window"

/** The files a board is opened from: IPC-2581, as `.xml` or its `.cvg` spelling. */
export const BOARD_FILES = [".xml", ".cvg"]

/** Asks for files with the system's own picker, and resolves with what was
 *  chosen — nothing, if the picker was dismissed.
 *
 *  For a command that is not itself a file control: "Open project" in a list of
 *  actions. In the desktop build it is the desktop's own picker, through the
 *  window (see `pickHostFiles`); in a browser, the browser's, through a file
 *  input that is made, pressed and dropped here, never put on the page.
 */
export function pickFiles(accept: string[], multiple = false): Promise<File[]> {
	if (inDesktop()) return pickHostFiles("IPC-2581 board", accept, multiple)
	return new Promise((resolve) => {
		const input = document.createElement("input")
		input.type = "file"
		input.accept = accept.join(",")
		input.multiple = multiple
		input.addEventListener("change", () => resolve(Array.from(input.files ?? [])), { once: true })
		input.addEventListener("cancel", () => resolve([]), { once: true })
		input.click()
	})
}

/** Ignores a file dropped where nothing takes it, for as long as the app runs;
 *  returns the way to stop.
 *
 *  Left alone, a browser — and the desktop window, which is one — opens a file
 *  dropped anywhere on the page in place of the page, and every open tab goes
 *  with it. Only Home's column takes files, so a board let go over the start
 *  pane or a board page would do exactly that. A region that does take files
 *  (`FileDrop`) has its drop first, and says so by preventing the default; a
 *  drop that reaches the document untaken is refused, and the pointer shows it
 *  cannot be let go there.
 */
export function ignoreStrayDrops(): () => void {
	const carriesFiles = (event: DragEvent) => event.dataTransfer?.types.includes("Files") ?? false
	const over = (event: DragEvent) => {
		if (!carriesFiles(event) || event.defaultPrevented) return
		event.preventDefault()
		if (event.dataTransfer) event.dataTransfer.dropEffect = "none"
	}
	const drop = (event: DragEvent) => {
		if (carriesFiles(event)) event.preventDefault()
	}
	document.addEventListener("dragover", over)
	document.addEventListener("drop", drop)
	return () => {
		document.removeEventListener("dragover", over)
		document.removeEventListener("drop", drop)
	}
}

/** Plays a drag the desktop window took back into the page, as the drag events
 *  a browser would have sent; returns the way to stop. In a browser it does
 *  nothing, the browser having sent them already.
 *
 *  So whatever takes files on the page — Home's `FileDrop`, its dropper, a drop
 *  box — takes them the same way in the window as in a browser, and none of it
 *  knows there is a window. The events go to whatever is under the pointer and
 *  bubble from there, as real ones do; held files are known by name only (a
 *  region filters by ending), and their bytes are read when they are let go.
 */
export function replayHostDrags(): () => void {
	let under: Element | null = null
	let carrying = new DataTransfer()
	const fire = (target: Element | null, type: string, transfer: DataTransfer) =>
		target?.dispatchEvent(
			new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: transfer }),
		)

	// Into what is under the pointer, then out of what was: a browser enters the
	// new element before it leaves the old one, and a region that counts the two
	// to know whether it is held over relies on that order.
	const move = (x: number, y: number) => {
		const target = document.elementFromPoint(x, y)
		if (target !== under) {
			fire(target, "dragenter", carrying)
			fire(under, "dragleave", carrying)
			under = target
		}
		fire(target, "dragover", carrying)
	}
	const end = () => {
		fire(under, "dragleave", carrying)
		under = null
	}

	return onHostDrag((drag) => {
		switch (drag.type) {
			case "enter":
				carrying = new DataTransfer()
				for (const name of drag.names) carrying.items.add(new File([], name))
				move(drag.x, drag.y)
				break
			case "over":
				move(drag.x, drag.y)
				break
			case "leave":
				end()
				break
			case "drop": {
				const target = document.elementFromPoint(drag.x, drag.y) ?? under
				drag.files().then(
					(files) => {
						const transfer = new DataTransfer()
						for (const file of files) transfer.items.add(file)
						fire(target, "drop", transfer)
						under = null
					},
					(error: unknown) => {
						// Unreadable: let go of the held state, so nothing waits for a drop.
						console.error(error)
						end()
					},
				)
			}
		}
	})
}
