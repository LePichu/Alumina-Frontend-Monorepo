import { createComputed, createSignal, createUniqueId, on } from "solid-js"

/** State that is the caller's when they hold it and the component's when they
 *  do not.
 *
 *  Nearly every control here is both. Each used to spell that out with a signal
 *  and a `props.x ?? internal()`, twenty-odd times, and the copies had drifted.
 *  The rule, said once:
 *
 *    value and a handler   controlled. The prop is the value, always; a change
 *                          the caller does not take does not happen.
 *    value, no handler     where it starts. Nothing is listening, so nothing
 *                          can be holding the value — and a control that takes
 *                          a press and does not move is broken, not controlled.
 *                          The component keeps its own state from there, and
 *                          starts over from the prop whenever the prop moves.
 *    neither               the component's own, from `initial`.
 *
 *  The middle case is the one the copies got wrong: they treated any value as
 *  controlled, so a `NumberInput value={4}` with no `onChange` had steppers
 *  that did nothing while typing into it still worked. Something that must not
 *  change says so with `readOnly` or `disabled`.
 *
 *  `undefined` alone means "not given" — `null` is a value, which is what lets
 *  a ComboBox be controlled back to nothing chosen.
 *
 *  The setter only moves the component's own value. Telling the caller is the
 *  component's job, since what each one reports — a value, an index, an object
 *  — is its own.
 */
export function createControllable<T>(
	/** The caller's value, if they pass one. */
	given: () => T | undefined,
	/** Where the component's own value starts when they do not. */
	initial: T,
	/** The caller's change handler, if they pass one — only asked whether it is
	 *  there. */
	handler: () => unknown,
): [value: () => T, set: (next: T) => void] {
	const [own, setOwn] = createSignal<T>(given() ?? initial)

	// The prop moved: start over from it. Deferred, since the signal was seeded
	// from the prop a line ago.
	createComputed(on(given, (next) => {
		if (next !== undefined) setOwn(() => next)
	}, { defer: true }))

	return [
		() => {
			const value = given()
			return value !== undefined && handler() !== undefined ? value : own()
		},
		// Wrapped, so a value that happens to be a function is stored, not called.
		(next) => setOwn(() => next),
	]
}

/** An element's id: the caller's, or one generated once.
 *
 *  Once is the point. Generated inline — `props.id ?? createUniqueId()` inside
 *  an accessor — it makes a new id on every read, so a label's `for` and its
 *  input's `id` come out as two different strings.
 */
export function createId(prefix: string, given: () => string | undefined): () => string {
	const generated = createUniqueId()
	return () => given() ?? `${prefix}-${generated}`
}
