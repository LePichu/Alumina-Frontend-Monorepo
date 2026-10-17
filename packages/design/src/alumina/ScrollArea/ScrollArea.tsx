import { createSignal, Show } from "solid-js"
import type { JSX } from "solid-js"
import { isServer } from "solid-js/web"
import { createScrollbars, Scroller, ScrollTrack } from "../../internal/scroll"
import type { ScrollAxis } from "../../internal/scroll"

export type ScrollAreaProps = {
	/** Which way it scrolls. Down, unless told otherwise. */
	axis?: ScrollAxis | "both"
	/** Applied to the pane that scrolls, not the frame — padding belongs inside
	 *  the scroller so the last row clears the bottom edge instead of sitting flush
	 *  against it, and so the fades still reach the frame's edges. */
	class?: string
	/** Applied to the frame, which does not scroll: where the area sits in its
	 *  layout. Left off, it takes whatever height a flex column has to give. */
	frameClass?: string
	/** The white fade at whichever end has more to read. On unless turned off:
	 *  a pane of ink rows, or one with no ground of its own, should not be
	 *  washed in white. */
	fade?: boolean
	/** Keeps the newest content in view: opens at the bottom, and stays there as
	 *  content is appended — but only while the reader is already at the bottom.
	 *  Someone who has scrolled up to re-read is left where they are, which is the
	 *  difference between a transcript and a control tower. */
	pin?: boolean
	children?: JSX.Element
}

/** A pane that scrolls inside a fixed layout.
 *
 *  It brings the system's scrollbar — a 4px thumb in a gutter as wide, there
 *  only while there is something to scroll — and a white fade at
 *  whichever end has more to read. The fade shows at the bottom until you
 *  reach the end, then hands off to the top; both go when everything fits, so
 *  a short list carries no decoration at all. Under a finger, where there is no
 *  bar, the fade is the only sign of overflow.
 *
 *  The browser's own scrollbars are hidden everywhere (see `internal/scroll`),
 *  so in an app this is how a pane that scrolls says so: use it rather than a
 *  bare `overflow-auto`.
 */
export function ScrollArea(props: ScrollAreaProps) {
	const [atTop, setAtTop] = createSignal(true)
	const [atBottom, setAtBottom] = createSignal(true)
	let pane: HTMLDivElement | undefined

	const measure = () => {
		if (!pane) return
		const { scrollTop, scrollHeight, clientHeight } = pane
		setAtTop(scrollTop <= 1)
		// 1px of slack: fractional layout heights mean scrollTop + clientHeight
		// lands just shy of scrollHeight at the true bottom.
		setAtBottom(scrollTop + clientHeight >= scrollHeight - 1)
	}

	/** Read before the growth that prompted a re-pin, so "was the reader at the
	 *  bottom" is answered about the layout they were actually looking at.
	 *  It starts true, which is also what opens a pinned pane at its end. */
	let wasAtBottom = true

	const onResize = () => {
		if (props.pin && wasAtBottom && pane) pane.scrollTop = pane.scrollHeight
		measure()
		wasAtBottom = atBottom()
	}

	// `relative` is not for placing them — the grid does that. A pane that
	// scrolls is painted as a layer of its own, and WebKit paints that layer
	// over anything unpositioned that shares its cell, fades included. Positioned,
	// they are layers too, and later ones win.
	const FADE =
		"pointer-events-none relative col-start-1 row-start-1 h-16 from-white to-transparent transition-opacity duration-200"

	return (
		<Scroller
			axis={props.axis}
			ref={(el) => (pane = el)}
			class={props.frameClass ?? "flex-1"}
			paneClass={`overscroll-contain ${props.class ?? ""}`}
			onScroll={() => {
				measure()
				wasAtBottom = atBottom()
			}}
			onResize={onResize}
			overlay={
				// In the pane's own cell of the frame, so they wash the content and
				// never the gutter beside it.


					<Show when={(props.fade ?? true) && props.axis !== "x"}>
						<span
							aria-hidden="true"
							class={`${FADE} self-start bg-gradient-to-b ${atTop() ? "opacity-0" : "opacity-100"}`}
						/>
						<span
							aria-hidden="true"
							class={`${FADE} self-end bg-gradient-to-t ${
								atBottom() ? "opacity-0" : "opacity-100"
							}`}
						/>
					</Show>

			}
		>
			{props.children}
		</Scroller>
	)
}

/** The page's own scrollbar. Put one in an app whose pages scroll.
 *
 *  The same thumb, fixed to the window's trailing edge. The page keeps a gutter
 *  for it — `theme.css` insets the body by the gutter's width wherever one of
 *  these is on the page — so nothing in the page runs under the thumb, while
 *  whatever is fixed behind the page, the backdrop above all, runs on to the
 *  window's edge. That is the difference from the browser's: its gutter is
 *  opaque, and cut the backdrop off short of the edge.
 *
 *  A block whose ground should reach the window's edge all the same — an ink
 *  footer — takes `page-bleed`, and runs under the gutter too. Which is why
 *  this thumb is not simply ink: over that footer it would be ink on ink. It is
 *  white, blended by difference, so what is seen is the inverse of whatever is
 *  behind it — ink over the page, white over ink — and it never has to know
 *  what it is passing over.
 *
 *  An app that is a fixed window and never scrolls its page — mica, kiln — has
 *  no use for one, and gives up no gutter.
 */
export function PageScrollbar() {
	const bars = createScrollbars(() => (isServer ? undefined : document.documentElement), {
		page: true,
	})

	return (
		<div
			data-page-scrollbar=""
			class="fixed inset-y-0 right-0 z-30 flex mix-blend-difference [--focus-ink:white] pointer-coarse:hidden"
		>
			<ScrollTrack axis="y" bars={bars} />
		</div>
	)
}
