import {
	batch,
	children,
	createContext,
	createEffect,
	createSignal,
	createUniqueId,
	For,
	onMount,
	Show,
	Suspense,
	useContext,
} from "solid-js"
import type { JSX } from "solid-js"
import CorvuTooltip from "corvu/tooltip"
import ArrowLeft from "@carbon/icons/es/arrow--left/16"
import ArrowRight from "@carbon/icons/es/arrow--right/16"
import Close from "@carbon/icons/es/close/16"
import Home from "@carbon/icons/es/home/16"
import Maximize from "@carbon/icons/es/maximize/16"
import Minimize from "@carbon/icons/es/minimize/16"
import Subtract from "@carbon/icons/es/subtract/16"
import { Tooltip } from "../../carbon/Tooltip/Tooltip"
import type { TooltipAlign } from "../../carbon/Tooltip/Tooltip"
import { Content } from "../../carbon/UIShell/Content"
import { SkipToContent } from "../../carbon/UIShell/Header"
import type { CarbonGlyph } from "../../icons/glyph"
import { Icon } from "../../icons/Icon"
import { createRoving } from "../../internal/roving"
import { FLOATING_SURFACE_INVERSE, LABEL } from "../../internal/styles"

/** The frame an app lives in: a title bar, a strip of open pages, and the page.
 *
 *  It follows Carbon's UI Shell — a header, a side nav, `Content`, and a skip
 *  link ahead of all three — and it is a subrouter: the pages it shows are its
 *  own to open, switch between and close.
 *
 *  **It is a window's chrome, so it is quiet.** Not a Tile: no box, no shadow.
 *  A thin ink bar across the top and, while there are pages to switch between,
 *  an ink strip down the left — one L of ink round the page — with 16px glyphs
 *  and the app's name small, grey and centred. The frame says where you are and
 *  then gets out of the way of the page.
 *
 *  **The bar**, left to right: the app's icon, back and forward; the app's
 *  title in the middle of the window; minimise, maximise and close. Every one
 *  of those actions is a function handed in, because none of them is the
 *  shell's to perform — what "close" does belongs to whatever window the app is
 *  in. An action with no function has no button: in a browser tab there is
 *  nothing to minimise.
 *
 *  **The strip** is the open pages as vertical tabs, one glyph each, and Home
 *  is always the first of them. With only Home open there is nothing to switch
 *  between, so there is no strip at all; it slides in from the window's left
 *  edge with the first page that is opened, and back out when the last one is
 *  closed. A tab says what it is in a
 *  card to its right — its name, and a picture of the page if it has one, as a
 *  browser's tab does — and any tab but Home shows a cross under the pointer,
 *  which closes its page.
 *
 *  **A page is an instance, not a route.** It is built once, when it is opened,
 *  and kept until it is closed; going to another tab hides it and does not
 *  rebuild it, so a half-filled form or a turned board is as it was left.
 */

const HOME = "home"

export type AppShellPage = {
	/** Which page this is. Opening one that is already open goes to it rather
	 *  than opening a second. */
	id: string
	/** What it is called: its tab's name, and the first line of the tab's
	 *  tooltip. */
	title: string
	/** A second line for the tooltip, saying which one this is — a board's
	 *  revision, a thread's last line. The tab is one glyph, so the tooltip is
	 *  all there is to tell two of a kind apart before going to them. */
	description?: string
	/** A picture of the page for the tooltip, as a browser shows a thumbnail of
	 *  a tab: an image's address, shown 16:9. Or a function that returns one,
	 *  which is asked each time the tooltip opens — so a page that draws on a
	 *  canvas can hand over what is on it now (`() => canvas.toDataURL()`). */
	preview?: string | (() => string | undefined)
	/** Its tab's glyph — pass the 16px descriptor. Left off, the tab wears the
	 *  first two letters of the title. */
	renderIcon?: CarbonGlyph
	/** The page. Called once, when the page is opened. */
	content: () => JSX.Element
}

export type AppShellController = {
	/** What is open, Home first. */
	pages: () => AppShellPage[]
	/** The id of the page that is showing. */
	active: () => string
	/** Opens a page and goes to it. */
	open: (page: AppShellPage) => void
	/** Closes a page. Home cannot be closed. Closing the page that is showing
	 *  goes back to the one shown before it. */
	close: (id: string) => void
	/** Goes to a page that is open. */
	select: (id: string) => void
	/** Back and forward through the pages that have been shown, as a browser
	 *  goes through the ones it has. Hand these to the bar's arrows if that is
	 *  the history they should walk. */
	back: () => void
	forward: () => void
	canGoBack: () => boolean
	canGoForward: () => boolean
}

/** No two neighbours the same: going from a page to itself is not a step. */
const settle = (trail: string[]) => trail.filter((id, index) => id !== trail[index - 1])

/** The shell's state: which pages are open, which is showing, and the order
 *  they were shown in. Made by the app and handed to `AppShell`, so that
 *  anything in the app can open a page — and read back from inside one with
 *  `useAppShell`.
 */
export function createAppShell(
	home: { title?: string; renderIcon?: CarbonGlyph; content: () => JSX.Element },
): AppShellController {
	const [pages, setPages] = createSignal<AppShellPage[]>([{
		id: HOME,
		title: home.title ?? "Home",
		renderIcon: home.renderIcon ?? Home,
		content: home.content,
	}])
	// Where it has been, and how far along that it is now.
	const [trail, setTrail] = createSignal<string[]>([HOME])
	const [at, setAt] = createSignal(0)

	const active = () => trail()[at()] ?? HOME
	const isOpen = (id: string) => pages().some((page) => page.id === id)

	const go = (id: string) => {
		if (id === active()) return
		batch(() => {
			// Going somewhere new from the middle of the trail drops what was ahead.
			setTrail([...trail().slice(0, at() + 1), id])
			setAt(at() + 1)
		})
	}

	return {
		pages,
		active,
		open: (page) =>
			batch(() => {
				if (!isOpen(page.id)) setPages([...pages(), page])
				go(page.id)
			}),
		select: (id) => {
			if (isOpen(id)) go(id)
		},
		close: (id) => {
			if (id === HOME || !isOpen(id)) return
			batch(() => {
				// It is taken out of the trail as well, so back never lands on a
				// page that is gone. What is left of the trail up to here ends on
				// the page shown before it — which is where closing it goes.
				const behind = settle(trail().slice(0, at() + 1).filter((step) => step !== id))
				const ahead = trail().slice(at() + 1).filter((step) => step !== id)
				setTrail(settle([...behind, ...ahead]))
				setAt(behind.length - 1)
				setPages(pages().filter((page) => page.id !== id))
			})
		},
		back: () => setAt(Math.max(0, at() - 1)),
		forward: () => setAt(Math.min(trail().length - 1, at() + 1)),
		canGoBack: () => at() > 0,
		canGoForward: () => at() < trail().length - 1,
	}
}

const AppShellContext = createContext<AppShellController>()

/** The shell a page is in, for a page that opens another or closes itself. */
export function useAppShell(): AppShellController {
	const shell = useContext(AppShellContext)
	if (!shell) throw new Error("useAppShell must be used inside an AppShell")
	return shell
}

export type AppShellProps = {
	shell: AppShellController
	/** The app's name, in the middle of the bar. */
	title: string
	/** The app's mark, at the bar's leading end: an `Icon` at 16, or the app's
	 *  own. */
	icon?: JSX.Element
	/** The bar's arrows. `shell.back` and `shell.forward` walk the shell's own
	 *  pages; an app with another history hands that in instead. */
	onBack?: () => void
	onForward?: () => void
	/** Whether there is anywhere to go. An arrow with nowhere to go is dimmed. */
	canGoBack?: boolean
	canGoForward?: boolean
	/** The window's own controls. They are the host's to carry out. */
	onMinimize?: () => void
	onMaximize?: () => void
	onClose?: () => void
	/** The window is maximised, so the maximise control offers to restore it. */
	maximized?: boolean
	/** A press on the bar's empty space and a move, which in a window without the
	 *  system's own frame is how the window is moved: hand in the host's "start
	 *  dragging the window" (Tauri's `startDragging`). A second press in quick
	 *  succession is a double-click, and goes to `onMaximize` instead, as a title
	 *  bar's does. Left off, the bar is not a handle at all. */
	onDragStart?: () => void
	/** Where the shell sits and how big it is: `h-dvh` for a whole window. */
	class?: string
}

/** The bar's three parts. The ends are never narrower than what is in them and
 *  otherwise share what is left equally, which is what puts the title in the
 *  middle of the window rather than in the middle of the room between two ends
 *  of different lengths. The title gives way first, and is cut short.
 *
 *  Ink. It was white with a rule beneath for one review, and went back: the
 *  bar is the one piece of the window that is the app's own, and in white it
 *  was a row of the page. What stayed from that version is its size — 2rem and
 *  16px glyphs, not the 3rem and 20px of Carbon's header.
 *
 *  Nothing on it selects: a double-click on a title bar maximises the window,
 *  and it used to select the title as well. */
const BAR = `on-ink relative z-20 grid h-8 shrink-0 select-none items-center bg-ink text-white
	grid-cols-[minmax(max-content,1fr)_minmax(0,auto)_minmax(max-content,1fr)] pointer-coarse:h-touch`

/** One cell of the bar, as wide as the strip beneath it. */
const BAR_CELL = "flex h-8 w-10 shrink-0 items-center justify-center pointer-coarse:size-touch"

/** A control on the bar: a cell that washes under the pointer, with its name
 *  in a tooltip. The ring is inset — one drawn outside the cell would be cut
 *  by the window's edge above and lost on the page below. */
function BarAction(props: {
	label: string
	glyph: CarbonGlyph
	align: TooltipAlign
	disabled?: boolean
	onClick?: () => void
}) {
	return (
		<Tooltip
			label={props.label}
			align={props.align}
			disabled={props.disabled}
			onClick={() => props.onClick?.()}
			class="focus-visible:-outline-offset-2"
		>
			<span
				class={`${BAR_CELL} transition-colors ${
					props.disabled ? "opacity-40" : "hover:bg-white/20"
				}`}
			>
				<Icon glyph={props.glyph} size={16} />
			</span>
		</Tooltip>
	)
}

export function AppShell(props: AppShellProps) {
	// Resolved once — see "Slots" in CLAUDE.md.
	const icon = children(() => props.icon)
	const base = createUniqueId()
	const tabId = (id: string) => `${base}-tab-${encodeURIComponent(id)}`
	const pageId = (id: string) => `${base}-page-${encodeURIComponent(id)}`
	const several = () => props.shell.pages().length > 1

	return (
		<AppShellContext.Provider value={props.shell}>
			<div class={`flex min-h-0 flex-col text-ink ${props.class ?? ""}`}>
				<header
					aria-label={props.title}
					// Mouse, not pointer, events, and on purpose: moving a window is a mouse's
					// job — a finger on a phone has no window to move — and only a mouse
					// event's `detail` counts the presses, which is what tells a drag from
					// a double-click. A press on a control is the control's, not the bar's.
					//
					// The move starts when the held mouse first moves, not on the press. Handed
					// to the window manager on the press, the window is the manager's until
					// the button comes up, and the second press of a double-click never
					// reaches the page — so a double-click maximised only some of the time.
					onMouseDown={(event) => {
						if (!props.onDragStart || event.button !== 0) return
						if (event.target instanceof Element && event.target.closest("button, a")) return
						if (event.detail === 2) return props.onMaximize?.()
						const bar = event.currentTarget
						const move = (moved: MouseEvent) => {
							stop()
							if (moved.buttons & 1) props.onDragStart?.()
						}
						const stop = () => {
							bar.removeEventListener("mousemove", move)
							removeEventListener("mouseup", stop)
						}
						bar.addEventListener("mousemove", move)
						addEventListener("mouseup", stop)
					}}
					class={BAR}
				>
					{/* The first thing a keyboard reaches: past the bar and the strip. */}
					<SkipToContent href={`#${base}-content`} />
					<div class="flex items-center">
						{/* As wide as the strip, so the app's mark stands over the tabs. */}
						<Show when={icon()}>
							<span class={BAR_CELL}>{icon()}</span>
						</Show>
						<Show when={props.onBack}>
							<BarAction
								label="Back"
								align="bottom-start"
								glyph={ArrowLeft}
								disabled={!(props.canGoBack ?? true)}
								onClick={props.onBack}
							/>
						</Show>
						<Show when={props.onForward}>
							<BarAction
								label="Forward"
								align="bottom-start"
								glyph={ArrowRight}
								disabled={!(props.canGoForward ?? true)}
								onClick={props.onForward}
							/>
						</Show>
					</div>
					{
						/* Grey, and a number rather than `opacity-muted`: this is a window's
					    title, which is there to be glanced at, not secondary text to be read.
					    See "Look" in CLAUDE.md. */
					}
					<span class="truncate px-4 text-label uppercase opacity-60">{props.title}</span>
					<div class="flex items-center justify-end">
						<Show when={props.onMinimize}>
							<BarAction
								label="Minimise"
								align="bottom-end"
								glyph={Subtract}
								onClick={props.onMinimize}
							/>
						</Show>
						<Show when={props.onMaximize}>
							<BarAction
								label={props.maximized ? "Restore" : "Maximise"}
								align="bottom-end"
								glyph={props.maximized ? Minimize : Maximize}
								onClick={props.onMaximize}
							/>
						</Show>
						<Show when={props.onClose}>
							<BarAction label="Close" align="bottom-end" glyph={Close} onClick={props.onClose} />
						</Show>
					</div>
				</header>

				<div class="relative flex min-h-0 flex-1">
					<PageTabs
						shell={props.shell}
						open={several()}
						group={base}
						tabId={tabId}
						pageId={pageId}
					/>
					{
						/* An id of its own, not Content's usual one: two shells on a page —
					    the playground has several — must not share it. */
					}
					<Content id={`${base}-content`} class="relative">
						<For each={props.shell.pages()}>
							{(page) => (
								<div
									id={pageId(page.id)}
									// A tab panel only while there are tabs for it to be the
									// panel of. Alone, Home is simply the page.
									role={several() ? "tabpanel" : undefined}
									aria-labelledby={several() ? tabId(page.id) : undefined}
									hidden={props.shell.active() !== page.id}
									class="h-full min-h-0"
								>
									{
										/* Each page waits on its own. A page that reads something still
									    loading suspends the nearest boundary, and without one here that
									    was the app's — so opening a board blanked the whole window, bar
									    and strip and all, to the white page beneath it until its mesh
									    had loaded. */
									}
									<Suspense>{page.content()}</Suspense>
								</div>
							)}
						</For>
					</Content>
				</div>
			</div>
		</AppShellContext.Provider>
	)
}

/** The first two letters or digits of a title, for a tab with no glyph. */
const monogram = (title: string) =>
	(title.match(/[\p{L}\p{N}]/gu) ?? []).slice(0, 2).join("").toUpperCase()

/** A tab: one square, one glyph, on the ink of the strip. The pointer washes a
 *  tab with the bar's grey-over-ink, and the tab of the page that is showing
 *  keeps that wash: that is all that marks it. It has been inverted to white
 *  (it read as part of the page, not as a tab) and has worn a white rule down
 *  its leading edge (Carbon's rail mark — too loud against the ink round it);
 *  both were taken out in review.
 *
 *  A resting tab takes its wash from its cell, not from itself: a cross sits in
 *  the cell beside the tab, and the tab must stay washed while the pointer is
 *  on its cross. */
const TAB = `on-ink flex size-10 cursor-pointer items-center justify-center border-0 p-0
	text-white transition-colors focus-visible:-outline-offset-2 pointer-coarse:size-touch`
const TAB_REST = "bg-transparent group-hover:bg-white/20"
const TAB_ACTIVE = "bg-white/20"

/** The cross, which is how a page is closed from its tab. Every tab but Home
 *  has one, under the pointer, and where it stands depends on what a press on
 *  the tab means.
 *
 *  On the tab of the page that is showing, a press means nothing else, so the
 *  cross takes the glyph's place in the middle — the glyph goes, the cross is
 *  there — as a browser's narrow tabs do it (`CROSS_HERE`). It turns white
 *  under the pointer, so it reads as the thing about to be pressed. Its two
 *  classes, `CROSS_ARMED` and `GLYPH_ARMED`, are held back from a tab the
 *  pointer has only just picked — see `fresh` below.
 *
 *  On any other tab a press means "go to this page", and a cross in the middle
 *  would turn that into "close it" under the hand that reached for the glyph.
 *  So there it is a small white square in the corner (`CROSS_THERE`), and the
 *  glyph stays where it is. The keyboard's focus brings it out too; Delete is
 *  what closes from the keyboard.
 *
 *  A finger has no hover to bring either out with, so under one the showing
 *  tab's cross is a second square, the full size, beneath it — the two read as
 *  one block: go to a page, then close it. */
const CROSS =
	`absolute hidden cursor-pointer items-center justify-center border-0 p-0 transition-colors
	focus-visible:-outline-offset-2`
const CROSS_HERE = `${CROSS} inset-2 bg-transparent text-white hover:bg-white hover:text-ink
	pointer-coarse:static pointer-coarse:flex pointer-coarse:size-touch pointer-coarse:bg-white/20`
const CROSS_THERE = `${CROSS} right-0 top-0 size-4 bg-white text-ink hover:bg-gray
	pointer-fine:group-hover:flex pointer-fine:group-has-focus-visible:flex`
const CROSS_ARMED = "pointer-fine:group-hover:flex"
const GLYPH_ARMED = "pointer-fine:group-hover:invisible"

/** The strip, open and shut. It slides in from the window's left edge, and it
 *  slides by `transform` — never by its width.
 *
 *  It used to run its width from nothing to a tab's, pushing the page over as
 *  it came. Every frame of that was a fresh layout of the whole page beside it,
 *  and a board's WebGL view, resized each frame, redrew each frame: the slide
 *  stuttered in exactly the moment it was meant to be smooth, as a new board's
 *  tab opened. Now the room is made at once — open, the strip stands in the
 *  layout at its full width; shut, it is lifted out of it — and only the column
 *  of tabs inside moves, which the compositor runs without a layout at all. The
 *  page's one jump happens as the page itself changes, opening or closing a
 *  tab, where it is not seen.
 *
 *  Shut, it is `invisible` too, which takes its tabs out of the tab order and
 *  away from assistive tech. Visibility is not transitioned: opening, it turns
 *  visible at once; shutting, it waits out the slide with a delay and then
 *  turns. It was a transition both ways, which the spec makes visible for the
 *  whole of either — and WebKit flips halfway, so in the desktop window the
 *  column slid in unseen for its first 110ms and appeared two-thirds of the
 *  way in, which read as a stutter.
 *
 *  Lifted to the bar's layer, as the bar is: a page that brings its own backdrop
 *  (`Background`, fixed behind everything) would otherwise be painted over the
 *  strip, which is not positioned and so sits below anything that is. */
const STRIP = "z-20 flex w-10 shrink-0 overflow-hidden pointer-coarse:w-touch"
const STRIP_OPEN = "visible relative"
const STRIP_SHUT = `invisible absolute inset-y-0 left-0 transition-[visibility] delay-220 duration-0
	motion-reduce:delay-0`
const COLUMN = `flex w-10 shrink-0 flex-col overflow-y-auto bg-ink transition-transform duration-220
	ease-out motion-reduce:transition-none pointer-coarse:w-touch`

/** Runs `then` once the window has painted twice — after whatever was built in
 *  the same moment has had its frame.
 *
 *  A tab opens as its page is built, and a board's page builds a WebGL view:
 *  in the desktop window that held the first paint back by about a tenth of a
 *  second, and a slide started with the page was three-quarters done before
 *  it was first seen. Started after the page's first frame, it is seen whole.
 *  The page is not kept waiting; only the motion is. */
function afterPaint(then: () => void) {
	requestAnimationFrame(() => requestAnimationFrame(then))
}

/** The strip: the open pages, one tab each, Home first. */
function PageTabs(props: {
	shell: AppShellController
	/** More than Home is open, so there is something to switch between. */
	open: boolean
	/** One name for every tab's tooltip, so that the next one opening shuts the
	 *  last, and moving down the strip does not wait out the delay at each tab. */
	group: string
	tabId: (id: string) => string
	pageId: (id: string) => string
}) {
	const [list, setList] = createSignal<HTMLElement>()
	const roving = createRoving(list, "[role='tab']")
	// The tab the pointer has just gone to, until the pointer leaves it. Its
	// cross is held back for that long: the tab becomes the showing one under a
	// pointer that is still on it, and a cross appearing there at once would
	// turn the second press of a double-click into "close". Set by the press of
	// a pointer and nothing else — a tab reached with Enter has no pointer on
	// it to leave, and would never get its cross back.
	const [fresh, setFresh] = createSignal<string>()
	// Tabs that arrive after the strip is first drawn pop in; the ones it starts
	// with — Home, or the pages an app opens with — are simply there.
	let started = false
	onMount(() => (started = true))
	// Whether the column has slid in. It follows `open`, but going in it waits
	// for the page beside it to paint — see `afterPaint`. Room for it is made at
	// once, by `open`, so the page is laid out once.
	const [slid, setSlid] = createSignal(props.open)
	createEffect(() => {
		if (props.open) afterPaint(() => setSlid(props.open))
		else setSlid(false)
	})

	const close = (id: string) => {
		const showing = props.shell.active() === id
		props.shell.close(id)
		// Its tab is gone, and focus with it; put focus on the tab that took over
		// rather than letting it fall to the page.
		if (showing) {
			queueMicrotask(() => list()?.querySelector<HTMLElement>("[aria-selected='true']")?.focus())
		}
	}

	return (
		<nav aria-label="Open pages" class={`${STRIP} ${props.open ? STRIP_OPEN : STRIP_SHUT}`}>
			{
				/* More pages than the window is tall: the strip scrolls, and shows no
			    bar for it — there is no room in it for one. */
			}
			<div class={`${COLUMN} ${slid() ? "translate-x-0" : "-translate-x-full"}`}>
				<div
					ref={setList}
					role="tablist"
					aria-orientation="vertical"
					aria-label="Open pages"
					onKeyDown={(event) => {
						const from = document.activeElement
						roving.onKeyDown(event)
						// Arrowing to a tab goes to its page, as the system's other tabs do:
						// the pages are already built, so it costs nothing. Read off where
						// the keys left focus rather than off a focus event, so that focus
						// arriving any other way — a press on the strip, focus handed back
						// from a dialog — does not change the page.
						const landed = document.activeElement
						if (landed !== from && landed instanceof HTMLElement && landed.dataset["page"]) {
							props.shell.select(landed.dataset["page"])
						}
					}}
					class="flex flex-col"
				>
					<For each={props.shell.pages()}>
						{(page) => {
							const selected = () => props.shell.active() === page.id
							const closable = () => page.id !== HOME
							const armed = () => selected() && closable() && fresh() !== page.id
							// Read once, as the tab is made: whether it came after the strip did.
							// One that did is held unseen until its page has painted, then
							// pops — for the same reason the column waits to slide.
							const arrived = started
							const [popping, setPopping] = createSignal(false)
							if (arrived) afterPaint(() => setPopping(true))
							const preview = () =>
								typeof page.preview === "function" ? page.preview() : page.preview

							return (
								<div
									role="presentation"
									onPointerLeave={() => {
										if (fresh() === page.id) setFresh(undefined)
									}}
									// The wheel pressed on a tab closes it, showing or not — the
									// other thing a browser's tabs have taught the hand. Heard on
									// the cell, not the tab: on the showing tab the pointer is
									// over its cross, which is the tab's sibling, and a press there
									// never reached the tab. The wheel's own press would start the
									// page scrolling itself, or paste the selection on Linux.
									onMouseDown={(event) => {
										if (event.button === 1) event.preventDefault()
									}}
									onAuxClick={(event) => {
										if (event.button === 1 && closable()) close(page.id)
									}}
									class={`group relative flex flex-col ${
										!arrived
											? ""
											: popping()
											? "animate-tab-pop motion-reduce:animate-none"
											: "opacity-0 motion-reduce:opacity-100"
									}`}
								>
									<CorvuTooltip
										placement="right-start"
										group={props.group}
										openDelay={100}
										closeDelay={0}
										skipDelayDuration={400}
										floatingOptions={{ offset: 8, flip: true, shift: true }}
										openOnFocus
										// Pressing a tab goes to its page; what it is called should
										// not vanish at the moment it becomes the one showing.
										closeOnPointerDown={false}
									>
										<CorvuTooltip.Trigger
											type="button"
											role="tab"
											id={props.tabId(page.id)}
											aria-label={page.title}
											aria-selected={selected() ? "true" : "false"}
											aria-controls={props.pageId(page.id)}
											// One tab stop for the strip; the arrows move within it.
											tabindex={selected() ? 0 : -1}
											data-page={page.id}
											onPointerDown={(event: PointerEvent) => {
												if (event.button === 0 && !selected()) setFresh(page.id)
											}}
											onClick={() => props.shell.select(page.id)}
											onKeyDown={(event: KeyboardEvent) => {
												if (event.key === "Delete" && closable()) {
													event.preventDefault()
													close(page.id)
												}
											}}
											class={`${TAB} ${selected() ? TAB_ACTIVE : TAB_REST}`}
										>
											<span class={`flex ${armed() ? GLYPH_ARMED : ""}`}>
												<Show
													when={page.renderIcon}
													fallback={<b class="text-micro font-bold">{monogram(page.title)}</b>}
												>
													{(glyph) => <Icon glyph={glyph()} size={16} />}
												</Show>
											</span>
										</CorvuTooltip.Trigger>
										<CorvuTooltip.Portal>
											{
												/* With a picture it is a card of one width, the picture
										    edge to edge under the words; without, it is as wide as
										    the words. */
											}
											<CorvuTooltip.Content
												class={`${FLOATING_SURFACE_INVERSE} flex flex-col ${
													preview() ? "w-64" : "max-w-80"
												}`}
											>
												<span class="flex flex-col gap-tight px-2 py-snug">
													<span class={LABEL}>{page.title}</span>
													<Show when={page.description}>
														<span class="text-micro opacity-muted">{page.description}</span>
													</Show>
												</span>
												<Show when={preview()}>
													{(src) => (
														<img
															src={src()}
															// The words above it are what it is; the picture adds
															// nothing a screen reader should read out.
															alt=""
															draggable={false}
															class="block aspect-video w-full bg-white object-cover"
														/>
													)}
												</Show>
											</CorvuTooltip.Content>
										</CorvuTooltip.Portal>
									</CorvuTooltip>
									{
										/* Not a tab stop — Delete on the tab closes it from the keyboard. */
									}
									<Show when={closable()}>
										<button
											type="button"
											aria-label={`Close ${page.title}`}
											tabindex={-1}
											onClick={() => close(page.id)}
											class={selected()
												? `${CROSS_HERE} ${armed() ? CROSS_ARMED : ""}`
												: CROSS_THERE}
										>
											<Icon glyph={Close} size={16} />
										</button>
									</Show>
								</div>
							)
						}}
					</For>
				</div>
			</div>
		</nav>
	)
}
