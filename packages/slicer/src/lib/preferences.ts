import { createSignal } from "solid-js"
import type { Accessor } from "solid-js"

/** One of the app's own preferences, kept in this browser's storage or the
 *  desktop app's, so it holds from one launch to the next. A private window, or
 *  storage switched off, keeps it only as long as the page. */
export function createPreference(
	key: string,
	fallback: boolean,
): [Accessor<boolean>, (value: boolean) => void] {
	const [value, setValue] = createSignal(read(key) ?? fallback)
	return [value, (next) => {
		setValue(next)
		try {
			localStorage.setItem(key, String(next))
		} catch {
			// No storage to keep it in. It still lasts as long as the page.
		}
	}]
}

function read(key: string): boolean | undefined {
	try {
		const raw = localStorage.getItem(key)
		return raw === "true" ? true : raw === "false" ? false : undefined
	} catch {
		return undefined
	}
}
