/** Date text, without a library.
 *
 *  Carbon's DatePicker is flatpickr and takes its format tokens: `Y` a four-digit
 *  year, `m` a two-digit month, `d` a two-digit day, with anything else a literal
 *  separator. Those three are all a date field needs, so those three are what
 *  this understands.
 *
 *  Dates here are calendar days. Every one is built at local midnight and
 *  compared by its year, month and day — never by its timestamp, which drags the
 *  time zone into what should be a question about a calendar.
 */

const pad = (value: number, width: number) => String(value).padStart(width, "0")

export function formatDate(date: Date, format: string): string {
	return format
		.replace(/Y/g, pad(date.getFullYear(), 4))
		.replace(/m/g, pad(date.getMonth() + 1, 2))
		.replace(/d/g, pad(date.getDate(), 2))
}

/** What the field shows when empty: the format, spelled out. */
export function placeholderFor(format: string): string {
	return format.replace(/Y/g, "yyyy").replace(/m/g, "mm").replace(/d/g, "dd")
}

/** Reads text in the given format. Returns `null` for anything that is not a
 *  real date in it — `2026-02-30` included, which `new Date()` would quietly
 *  roll over into March. */
export function parseDate(text: string, format: string): Date | null {
	const order: ("Y" | "m" | "d")[] = []
	const pattern = format
		.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
		.replace(/[Ymd]/g, (token) => {
			order.push(token as "Y" | "m" | "d")
			return token === "Y" ? "(\\d{4})" : "(\\d{1,2})"
		})
	const match = new RegExp(`^${pattern}$`).exec(text.trim())
	if (!match) return null

	const part = { Y: Number.NaN, m: Number.NaN, d: Number.NaN }
	order.forEach((token, index) => {
		part[token] = Number(match[index + 1])
	})
	if ([part.Y, part.m, part.d].some(Number.isNaN)) return null

	const date = new Date(part.Y, part.m - 1, part.d)
	const real = date.getFullYear() === part.Y && date.getMonth() === part.m - 1 &&
		date.getDate() === part.d
	return real ? date : null
}

/** A calendar day as one comparable number: 20260824. */
export const dayKey = (date: Date) =>
	date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate()

export const sameDay = (a: Date | null, b: Date | null) =>
	a !== null && b !== null && dayKey(a) === dayKey(b)
