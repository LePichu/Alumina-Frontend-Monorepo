import { REPLIES } from "../fixtures/replies"
import { THREADS } from "../fixtures/threads"

/** kiln's agent seam.
 *
 * There is no backend, and the contract with @alumina/eda is still open, so
 * everything here streams out of src/fixtures. The important part is the shape:
 * a reply is **typed data**, never markup. The prototype stored each reply as an
 * HTML string and injected it; that is exactly what must not happen to model
 * output, so those strings are decomposed into the section union below and each
 * section gets its own component.
 *
 * Adding a section type means adding a variant here and a component in
 * components/reply — never a new branch that renders arbitrary HTML.
 */

export type ModelId = "raijin" | "perun" | "indra"
export type Mode = "design" | "review" | "fab"

export type Severity = "ok" | "warning" | "error"

/** A tool call the agent made, shown as a run step. */
export type RunStep = { name: string; detail: string; duration: string }

export type ReplyCheck = { severity: Severity; label: string; detail?: string }

/** Figures are drawn by the app as inline SVG in flat 2px ink stroke. The reply
 *  names which figure to draw; it never carries markup. */
export type FigureKind =
	| "board-top"
	| "board-bottom"
	| "board-stack"
	| "coupon"
	| "clearance"
	| "load-step"

/** A caption or footer chip. `value` is the figure the eye should land on and is
 *  set in bold ink; `label` is the word around it and is dimmed. The prototype
 *  wrote these as `<b>38 mV</b> ripple`; splitting the two is how the same
 *  emphasis survives without the reply carrying markup. */
export type ReplyChip = { value?: string; label?: string }

export type FormField =
	| {
		kind: "radio"
		key: string
		label: string
		help?: string
		options: { value: string; description?: string }[]
		value: string
	}
	/** A small set of mutually exclusive values — rendered as a ContentSwitcher. */
	| { kind: "options"; key: string; label: string; options: string[]; value: string }
	| { kind: "select"; key: string; label: string; options: string[]; value: string }
	| {
		kind: "range"
		key: string
		label: string
		min: number
		max: number
		step: number
		value: number
		unit?: string
	}
	| {
		kind: "checks"
		label: string
		options: { key: string; label: string; checked: boolean; tradeOff?: string }[]
	}
	| { kind: "text"; key: string; label: string; placeholder?: string; value: string }
	| {
		kind: "textarea"
		key: string
		label: string
		placeholder?: string
		rows?: number
		value: string
		wide?: boolean
	}

export type ReplyForm = {
	title: string
	cta: string
	/** Reply to stream when the form is submitted. */
	next?: string
	fields: FormField[]
}

/** Every section renders as one ruled band inside the reply tile, under a small
 *  uppercase header with the section's own meta on the right. */
export type ReplySection =
	| { kind: "steps"; steps: RunStep[] }
	| { kind: "checks"; checks: ReplyCheck[] }
	| { kind: "prose"; paragraphs: string[] }
	| {
		kind: "figure"
		title: string
		figure: FigureKind
		caption?: ReplyChip[]
		/** Figures the reader may switch between, as a content switcher in the header. */
		views?: FigureKind[]
	}
	| { kind: "table"; title: string; headers: string[]; rows: string[][]; note?: string }
	| { kind: "form"; form: ReplyForm }
	/** Closes a reply: the board's headline numbers, then what can be done with it. */
	| { kind: "footer"; stats?: ReplyChip[]; artifacts?: boolean }

export type Reply = {
	id: string
	/** Status line shown while the reply streams. */
	thinking: string
	sections: ReplySection[]
}

/** What a reply form was answered with, keyed by field (or checkbox) key. */
export type FormAnswers = Record<string, string | number | boolean>

export type Turn =
	| { role: "user"; text: string }
	/** A stored thread records the answers its form was given, so replaying it
	 *  shows the form as it was filled rather than back at its defaults. */
	| { role: "agent"; replyId: string; answers?: FormAnswers }

export type Thread = {
	id: string
	title: string
	summary: string
	model: ModelId
	turns: Turn[]
}

export const MODELS: ModelId[] = ["raijin", "perun", "indra"]
export const MODES: Mode[] = ["design", "review", "fab"]

export function listThreads(): Thread[] {
	return THREADS
}

/** Threads replay instantly — no streaming, no delay. Clicking one in the rail
 *  should feel like opening a file, not like re-running the agent. */
export function getReply(id: string): Reply | undefined {
	return REPLIES[id]
}

/** Prompt → reply, in order: the first pattern that matches wins.
 *
 *  This is a fixture's job, not a component's. It is also the seam a real model
 *  replaces: when @alumina/eda can answer, `ask` stops consulting this table and
 *  the call sites do not change. Ported from the prototype's `pick`, order and
 *  patterns intact — the order is load-bearing, since "panel six coupons next to
 *  the carrier" matches both the carrier rule and the coupon rule. */
const ROUTES: [RegExp, string][] = [
	[/esp|breakout|carrier|module|wroom/, "esp"],
	[/ink\b|silver|carbon|graphene|which substrate|substrate for/, "materials"],
	[/coupon|sweep|panel|too thin|trace width/, "coupon"],
	[/how long|print time|takes to print|to print\?/, "fabtime"],
	[/drc|clearance|u3|fail|pour|fab limits|second opinion|why/, "clearance"],
	[/buck|12 ?v|5 ?v|rail|regulat|converter|supply|step|re-?route/, "buckAsk"],
]

export function route(prompt: string): string {
	const text = prompt.toLowerCase()
	return ROUTES.find(([pattern]) => pattern.test(text))?.[1] ?? "plan"
}

/** What answering a reply form produces: the values, the prompt they amount to,
 *  and the reply that follows from them. */
export type FormSubmission = { answers: FormAnswers; said: string; next?: string }

/** Turns a filled-in reply form back into the prompt the user would have typed.
 *
 *  Answering the agent's questions is a turn in the conversation, not a hidden
 *  side channel, so the transcript has to show what was said — which is why the
 *  stored `buck-5v` thread has a user turn between the two agent replies.
 *
 *  Grouped by kind rather than read in field order, which is what the prototype's
 *  `submitForm` does by querying the DOM one selector at a time. Selects keep
 *  only the part before the first separator: "PEI-1010 · serious" is a menu
 *  entry, and "PEI-1010" is the answer. */
export function describeAnswers(form: ReplyForm, answers: FormAnswers): string {
	const of = <K extends FormField["kind"]>(kind: K) =>
		form.fields.filter((field): field is Extract<FormField, { kind: K }> => field.kind === kind)
	const read = (key: string, fallback: string | number | boolean) => answers[key] ?? fallback

	const bits: string[] = []

	for (const field of of("text")) {
		const value = String(read(field.key, field.value)).trim()
		if (value) bits.push(value)
	}
	for (const field of of("radio")) bits.push(String(read(field.key, field.value)))
	for (const field of of("options")) {
		const value = String(read(field.key, field.value))
		// "4" on its own says nothing; the field's own label is what makes it read.
		bits.push(field.key === "layers" ? `${value} layers` : value)
	}
	for (const field of of("select")) {
		bits.push(String(read(field.key, field.value)).split(" · ")[0] ?? "")
	}
	for (const field of of("range")) {
		bits.push(`${read(field.key, field.value)}${field.unit ? ` ${field.unit}` : ""}`)
	}

	const ticked = of("checks")
		.flatMap((field) => field.options)
		.filter((option) => read(option.key, option.checked))
		.map((option) => option.label)
	if (ticked.length) bits.push(ticked.join(", "))

	const notes = of("textarea")
		.map((field) => String(read(field.key, field.value)).trim())
		.filter(Boolean)
		.join(" ")

	return bits.join(" · ") + (notes ? ` — ${notes}` : "")
}

export type StreamOptions = {
	/** Milliseconds between sections. 0 replays instantly. */
	pace?: number
	signal?: AbortSignal
}

/** Streams a reply section by section.
 *
 *  An async generator rather than a callback so the caller controls back-pressure
 *  and cancellation, and so a real transport (SSE, WebSocket, whatever @alumina/eda
 *  ends up speaking) can replace the body without changing call sites. */
export async function* streamReply(
	id: string,
	options: StreamOptions = {},
): AsyncGenerator<ReplySection> {
	const reply = REPLIES[id]
	if (!reply) return

	const pace = options.pace ?? 420

	for (const section of reply.sections) {
		if (options.signal?.aborted) return
		if (pace > 0) {
			await new Promise((resolve) => setTimeout(resolve, pace))
			if (options.signal?.aborted) return
		}
		yield section
	}
}
