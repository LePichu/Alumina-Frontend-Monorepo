/** Arrow keys, Home, End and type-ahead for a list that holds real focus.
 *
 *  Menus, listboxes and the overflow menu all move focus the same way, and each
 *  had its own copy of this — four, with the tree's type-ahead. One now.
 *
 *  `container` is the element the rows live in; `selector` picks the rows. Rows
 *  are found fresh on every key, so a list that changes while open needs no
 *  bookkeeping. Disabled rows are skipped.
 *
 *  A menu wraps: past the last row is the first. A tree does not — its ends are
 *  ends — so `wrap: false` holds at them instead.
 */
export function createRoving(
	container: () => HTMLElement | undefined,
	selector: string,
	options: { wrap?: boolean } = {},
) {
	const wrap = options.wrap ?? true
	let typed = ""
	let typedAt = 0

	const rows = () =>
		Array.from(container()?.querySelectorAll<HTMLElement>(`${selector}:not(:disabled)`) ?? [])
			.filter((row) => row.getAttribute("aria-disabled") !== "true")

	const focusAt = (index: number) => {
		const all = rows()
		if (all.length === 0) return
		const at = wrap
			? ((index % all.length) + all.length) % all.length
			: Math.min(Math.max(index, 0), all.length - 1)
		all[at]?.focus()
	}

	/** Goes to the next row whose text starts with what has been typed. Letters
	 *  in quick succession build a prefix; a pause starts over. Searching from
	 *  the row after the current one is what lets one letter pressed twice step
	 *  through the rows that share it. */
	const typeAhead = (key: string) => {
		const all = rows()
		const current = all.findIndex((row) => row === document.activeElement)
		const now = Date.now()
		typed = now - typedAt > 500 ? key : typed + key
		typedAt = now
		const needle = typed.toLowerCase()
		const order = [...all.slice(current + 1), ...all.slice(0, current + 1)]
		order.find((row) => row.textContent?.trim().toLowerCase().startsWith(needle))?.focus()
	}

	const onKeyDown = (event: KeyboardEvent) => {
		if (event.defaultPrevented) return
		const all = rows()
		const current = all.findIndex((row) => row === document.activeElement)

		if (event.key === "ArrowDown") {
			event.preventDefault()
			focusAt(current + 1)
		} else if (event.key === "ArrowUp") {
			event.preventDefault()
			// From outside the list, Up lands on the last row, as Down lands on the first.
			focusAt(current < 0 ? all.length - 1 : current - 1)
		} else if (event.key === "Home") {
			event.preventDefault()
			focusAt(0)
		} else if (event.key === "End") {
			event.preventDefault()
			focusAt(all.length - 1)
		} else if (
			event.key.length === 1 && event.key !== " " && !event.ctrlKey && !event.metaKey &&
			!event.altKey
		) {
			typeAhead(event.key)
		}
	}

	return { rows, focusAt, typeAhead, onKeyDown }
}

/** For a Corvu root whose content is a list you move focus into: lands focus on
 *  the chosen row, or failing that the first one.
 *
 *  Corvu's focus trap looks for the first *tabbable* element, and the rows of a
 *  roving list are all `tabindex="-1"` on purpose — Tab must leave a menu, not
 *  walk it — so left alone it focuses the container, and the first arrow press
 *  is spent getting into the list. Pass the result as the root's
 *  `onInitialFocus`.
 */
export function focusRow(selector: string) {
	return (event: Event) => {
		const container = event.target
		if (!(container instanceof HTMLElement)) return
		const row =
			container.querySelector<HTMLElement>(`${selector}[aria-selected="true"]:not(:disabled)`) ??
				container.querySelector<HTMLElement>(`${selector}[aria-checked="true"]:not(:disabled)`) ??
				container.querySelector<HTMLElement>(`${selector}:not(:disabled)`)
		if (!row) return
		event.preventDefault()
		row.focus()
	}
}
