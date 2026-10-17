import { createSignal, onCleanup, onMount, Show } from "solid-js"
import type { JSX } from "solid-js"

/** Scrollbars, drawn here rather than by the browser.
 *
 *  The system's scrollbar is a 4px ink thumb, square-ended, in a gutter exactly
 *  as wide — so the thumb is all there is to see, and where it is not, whatever
 *  is behind the pane shows through. No browser will draw that everywhere:
 *
 *    - Chromium and WebKit can be styled through `::-webkit-scrollbar`, but the
 *      *page's* gutter is opaque whatever its track is told to be — it shows
 *      the canvas, never what is behind the page — so a white strip ran down
 *      the window's edge, cutting the backdrop off.
 *    - Firefox takes a colour and "thin" and decides the rest. On Linux and
 *      macOS that is a rounded pill, the one round thing on the page.
 *
 *  So `theme.css` hides every native scrollbar, and what scrolls is given one
 *  from here. Scrolling itself stays the browser's — wheel, keys, touch,
 *  momentum, `scrollIntoView` — only the bar is ours: it is read off the
 *  scroller's own numbers and writes back to them when dragged.
 *
 *  Under a coarse pointer there is no bar and no gutter. A finger scrolls by
 *  dragging the content.
 */

export type ScrollAxis = "x" | "y"

type Reading = {
	/** There is more than fits. */
	scrollable: boolean
	/** The thumb's length, and how far along its track it starts, in pixels. */
	size: number
	at: number
}

const REST: Reading = { scrollable: false, size: 0, at: 0 }
const same = (a: Reading, b: Reading) =>
	a.scrollable === b.scrollable && a.size === b.size && a.at === b.at

/** What each axis is called on an element and on a pointer event. */
const NAMES = {
	y: {
		view: "clientHeight",
		total: "scrollHeight",
		from: "scrollTop",
		box: "offsetHeight",
		pointer: "clientY",
		edge: "top",
	},
	x: {
		view: "clientWidth",
		total: "scrollWidth",
		from: "scrollLeft",
		box: "offsetWidth",
		pointer: "clientX",
		edge: "left",
	},
} as const

/** A thumb is never shorter than a touch target is tall, so a long pane does
 *  not leave a speck to aim at. Read from the root's font size, since the token
 *  is in rem. */
const shortestThumb = () =>
	2.75 * (parseFloat(getComputedStyle(document.documentElement).fontSize) || 16)

type ScrollbarOptions = {
	/** The scroller is the page: its events are the window's, and its track is
	 *  the height of the window rather than of an element. */
	page?: boolean
	/** After every scroll, and after every change of size. For what else hangs
	 *  off a scroller's position — ScrollArea's fades, a transcript's pinning. */
	onScroll?: () => void
	onResize?: () => void
}

export type Scrollbars = ReturnType<typeof createScrollbars>

/** Reads a scroller and keeps reading it: how long each thumb is, where it
 *  stands, and what a press on the track or a drag of the thumb does.
 *
 *  `port` is the element that scrolls. Its size is watched, and so is the size
 *  of everything directly inside it, since content can grow without the pane
 *  changing size at all.
 */
export function createScrollbars(
	port: () => HTMLElement | undefined,
	options: ScrollbarOptions = {},
) {
	const [y, setY] = createSignal(REST, { equals: same })
	const [x, setX] = createSignal(REST, { equals: same })

	const read = (axis: ScrollAxis): Reading => {
		const el = port()
		if (!el) return REST
		const name = NAMES[axis]
		const view = el[name.view]
		const total = el[name.total]
		// A pixel of slack: fractional layout leaves scrollHeight a hair over
		// clientHeight on panes that do not scroll at all.
		if (total - view <= 1) return REST
		const track = options.page ? view : el[name.box]
		const size = Math.max(
			Math.min(track, shortestThumb()),
			Math.round((view / total) * track),
		)
		const travelled = el[name.from] / (total - view)
		// Whole pixels, so the thumb's ends are never drawn as a grey half-row.
		return { scrollable: true, size, at: Math.round((track - size) * travelled) }
	}

	const measure = () => {
		setY(read("y"))
		setX(read("x"))
	}

	onMount(() => {
		const el = port()
		if (!el) return

		let frame = 0
		const resized = () => {
			if (frame) return
			frame = requestAnimationFrame(() => {
				frame = 0
				measure()
				options.onResize?.()
			})
		}
		const scrolled = () => {
			measure()
			options.onScroll?.()
		}

		const sizes = new ResizeObserver(resized)
		const watch = () => {
			sizes.disconnect()
			sizes.observe(el)
			for (const child of Array.from(options.page ? document.body.children : el.children)) {
				sizes.observe(child)
			}
		}
		const children = new MutationObserver(() => {
			watch()
			resized()
		})

		watch()
		children.observe(options.page ? document.body : el, { childList: true })
		// A textarea's content is its value, which no observer sees.
		el.addEventListener("input", resized)
		const source: EventTarget = options.page ? globalThis : el
		source.addEventListener("scroll", scrolled, { passive: true })
		if (options.page) addEventListener("resize", resized)

		measure()
		options.onResize?.()

		onCleanup(() => {
			cancelAnimationFrame(frame)
			sizes.disconnect()
			children.disconnect()
			el.removeEventListener("input", resized)
			source.removeEventListener("scroll", scrolled)
			if (options.page) removeEventListener("resize", resized)
		})
	})

	/** The thumb, held: the scroller follows the pointer, scaled from the
	 *  track's length to the content's. */
	const drag = (axis: ScrollAxis, event: PointerEvent) => {
		const el = port()
		const thumb = event.currentTarget
		if (!el || event.button !== 0 || !(thumb instanceof HTMLElement)) return
		// Not a press on the track beneath it, and not the start of a selection.
		event.stopPropagation()
		event.preventDefault()

		const name = NAMES[axis]
		const now = axis === "y" ? y() : x()
		const track = options.page ? el[name.view] : el[name.box]
		const free = track - now.size
		if (free <= 0) return
		const ratio = (el[name.total] - el[name.view]) / free
		const pressedAt = event[name.pointer]
		const scrolledTo = el[name.from]

		const move = (moved: PointerEvent) => {
			el[name.from] = scrolledTo + (moved[name.pointer] - pressedAt) * ratio
		}
		const release = () => {
			document.removeEventListener("pointermove", move)
			document.removeEventListener("pointerup", release)
			document.removeEventListener("pointercancel", release)
		}
		// Captured, so the drag carries on when the pointer leaves the gutter or
		// the window. The listeners are the document's all the same: a captured
		// pointer's events still bubble there, and a pointer that could not be
		// captured is at least followed while it is over the page.
		try {
			thumb.setPointerCapture(event.pointerId)
		} catch {
			// Not an active pointer. Nothing to capture.
		}
		document.addEventListener("pointermove", move)
		document.addEventListener("pointerup", release)
		document.addEventListener("pointercancel", release)
	}

	/** A press on the gutter beside the thumb: one screenful towards it. */
	const page = (axis: ScrollAxis, event: PointerEvent) => {
		const el = port()
		const track = event.currentTarget
		if (!el || event.button !== 0 || !(track instanceof HTMLElement)) return
		event.preventDefault()
		const name = NAMES[axis]
		const now = axis === "y" ? y() : x()
		const pressed = event[name.pointer] - track.getBoundingClientRect()[name.edge]
		const step = el[name.view] * 0.9 * (pressed < now.at ? -1 : 1)
		el.scrollBy(axis === "y" ? { top: step } : { left: step })
	}

	/** The wheel, turned over the gutter, still turns the pane. */
	const wheel = (event: WheelEvent) => {
		port()?.scrollBy({ top: event.deltaY, left: event.deltaX })
	}

	return { y, x, measure, drag, page, wheel, port }
}

/** How the thumb is drawn, per axis. It fills its gutter: the two are the same
 *  width, so there is no air to either side and nothing of the bar to see but
 *  the thumb. Its length and place come in as custom properties, since they are
 *  measured, not designed.
 *
 *  Four pixels is too little to catch with a pointer, so the thumb can be
 *  grabbed over twice that: an unseen `::before` reaches the gutter's width
 *  again into the pane. Only over the thumb's own length — the rest of the
 *  pane's edge is still the pane's.
 *
 *  Its ink is whatever is drawn in ink over this ground, so on an `on-ink`
 *  surface the thumb is white, as the focus ring is. */
const THUMB = {
	y: "inset-x-0 top-0 h-[var(--thumb-size)] translate-y-[var(--thumb-at)] before:inset-y-0 before:right-0 before:-left-scroll",
	x: "inset-y-0 left-0 w-[var(--thumb-size)] translate-x-[var(--thumb-at)] before:inset-x-0 before:bottom-0 before:-top-scroll",
} as const

type ScrollTrackProps = {
	axis: ScrollAxis
	bars: Scrollbars
	/** Where the gutter sits. It brings its own thickness. */
	class?: string
}

/** One gutter and the thumb in it. Renders nothing while there is nothing to
 *  scroll, so a pane that fits gives up no room. */
export function ScrollTrack(props: ScrollTrackProps) {
	const reading = () => (props.axis === "y" ? props.bars.y() : props.bars.x())

	return (
		<Show when={reading().scrollable}>
			<div
				// Decoration for a pointer. The scroller is what assistive tech and
				// the keyboard act on, and it is still a real one.
				aria-hidden="true"
				onPointerDown={(event) => props.bars.page(props.axis, event)}
				on:wheel={{ handleEvent: props.bars.wheel, passive: true }}
				class={`relative shrink-0 touch-none select-none pointer-coarse:hidden
					${props.axis === "y" ? "w-scroll" : "h-scroll"} ${props.class ?? ""}`}
			>
				<span
					onPointerDown={(event) => props.bars.drag(props.axis, event)}
					style={{ "--thumb-size": `${reading().size}px`, "--thumb-at": `${reading().at}px` }}
					class={`absolute bg-[var(--focus-ink,var(--color-ink))] before:absolute before:content-['']
						${THUMB[props.axis]}`}
				/>
			</div>
		</Show>
	)
}

type ScrollerProps = {
	/** Which way it scrolls. Down, unless told otherwise. */
	axis?: ScrollAxis | "both"
	/** The frame: where the scroller sits and how big it may get. It does not
	 *  scroll and has no padding — the gutter stands at its edge. */
	class?: string
	/** The pane that scrolls: padding, and the layout of what is inside it. */
	paneClass?: string
	/** The pane, for a caller that scrolls it or reads it. */
	ref?: (pane: HTMLDivElement) => void
	/** Laid over the pane and not over the gutter. Each piece places itself in
	 *  the pane's cell with `col-start-1 row-start-1`. */
	overlay?: JSX.Element
	/** A scroller with nothing focusable in it is a tab stop, so a keyboard can
	 *  scroll it; this names it for assistive tech when it is one. */
	"aria-label"?: string
	tabIndex?: number
	children?: JSX.Element
	onScroll?: () => void
	onResize?: () => void
}

const OVERFLOW = {
	y: "overflow-y-auto overflow-x-hidden",
	x: "overflow-x-auto overflow-y-hidden",
	both: "overflow-auto",
} as const

/** A pane that scrolls, and its scrollbars.
 *
 *  The frame is a two-by-two grid: the pane, a gutter down its trailing edge, a
 *  gutter along its foot. A gutter exists only while its axis overflows, as a
 *  native one does, so the pane is as wide as its frame until there is
 *  something to scroll.
 *
 *  Everything in `design` that scrolls is one of these, and `ScrollArea` is
 *  this for the apps. A bare `overflow-auto` still scrolls, and shows nothing —
 *  which is right for a strip of tabs and wrong for anything else.
 */
export function Scroller(props: ScrollerProps) {
	const [pane, setPane] = createSignal<HTMLDivElement>()
	const bars = createScrollbars(pane, {
		onScroll: () => props.onScroll?.(),
		onResize: () => props.onResize?.(),
	})
	const axis = () => props.axis ?? "y"

	return (
		<div
			class={`grid min-h-0 min-w-0 grid-cols-[minmax(0,1fr)_auto] grid-rows-[minmax(0,1fr)_auto]
				${props.class ?? ""}`}
		>
			<div
				ref={(el) => {
					setPane(el)
					props.ref?.(el)
				}}
				aria-label={props["aria-label"]}
				tabIndex={props.tabIndex}
				// `relative` makes the pane the containing block of anything absolutely
				// positioned inside it. Every checkbox, radio and toggle hides its input
				// that way (`sr-only`), and an absolute element whose containing block is
				// outside a scroller is neither clipped nor scrolled by it: the hidden
				// inputs of a long layer tree reached past the window, and the whole
				// page scrolled — the shell's bar with it.
				class={`relative col-start-1 row-start-1 min-h-0 min-w-0 ${OVERFLOW[axis()]} ${
					props.paneClass ?? ""
				}`}
			>
				{props.children}
			</div>
			{props.overlay}
			<Show when={axis() !== "x"}>
				<ScrollTrack axis="y" bars={bars} class="col-start-2 row-start-1" />
			</Show>
			<Show when={axis() !== "y"}>
				<ScrollTrack axis="x" bars={bars} class="col-start-1 row-start-2" />
			</Show>
		</div>
	)
}
