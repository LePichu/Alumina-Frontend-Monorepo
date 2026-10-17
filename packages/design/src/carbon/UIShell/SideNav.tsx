import { createContext, createSignal, onCleanup, Show, useContext } from "solid-js"
import type { JSX } from "solid-js"
import ChevronDown from "@carbon/icons/es/chevron--down/16"
import type { CarbonGlyph } from "../../icons/glyph"
import { Icon } from "../../icons/Icon"
import { createControllable } from "../../internal/control"
import { Scroller } from "../../internal/scroll"

/** Carbon's UI Shell, the side half: the navigation down the leading edge.
 *
 *  It comes three ways, as in Carbon:
 *
 *    rail     3rem of icons that is always there, and opens to its full width
 *             over the page — not pushing it — while the pointer or the focus
 *             is in it. `isRail`.
 *    fixed    always its full width. `isFixedNav`.
 *    default  its full width from `lg` up; below that it is off the page until
 *             `expanded`, and then lies over it behind a scrim.
 *
 *  Like the header it is laid out by what holds it rather than fixed to the
 *  window: give it a row beside the content and it fills the row's height.
 */

type SideNavState = {
	/** Showing its labels: a fixed nav always, a rail only while it is open. */
	expanded: () => boolean
	rail: () => boolean
}

const SideNavContext = createContext<SideNavState>({ expanded: () => true, rail: () => false })

/** For a part that is drawn differently in a shut rail than an open one —
 *  what Carbon hands its children as `isSideNavExpanded`. */
export const useSideNav = () => useContext(SideNavContext)

export type SideNavProps = {
	"aria-label"?: string
	"aria-labelledby"?: string
	/** Controlled when there is an `onToggle` to take the change. */
	expanded?: boolean
	defaultExpanded?: boolean
	isRail?: boolean
	isFixedNav?: boolean
	/** Stands at its full width from `lg` up. On unless turned off; off, it is
	 *  only ever there while `expanded`. Not a rail's or a fixed nav's business. */
	isPersistent?: boolean
	/** A rail opens when focus enters it and shuts when focus leaves. */
	addFocusListeners?: boolean
	/** A rail opens under the pointer and shuts when the pointer leaves. */
	addMouseListeners?: boolean
	/** How long the pointer rests on a rail before it opens, so that crossing it
	 *  on the way somewhere else does not. */
	enterDelayMs?: number
	class?: string
	children?: JSX.Element
	onToggle?: (expanded: boolean) => void
	/** A press on the scrim behind an open default nav. */
	onOverlayClick?: () => void
	/** Focus has left the nav. */
	onSideNavBlur?: () => void
}

/** The frame is what takes room in the layout; the panel is what is drawn. They
 *  are two elements because a rail's panel outgrows its frame when it opens.
 *  `box-content`, so the widths below are the widths of what is inside and the
 *  2px rule is added to them — a rail's icon cells are exactly as wide as it. */
const FRAME = "relative box-content shrink-0 border-r-2 border-ink"
// `flex` or `hidden` is added per state, as one or the other — never both.
const PANEL = "flex-col bg-white text-ink"

export function SideNav(props: SideNavProps) {
	const [open, setOpen] = createControllable(
		() => props.expanded,
		props.defaultExpanded ?? false,
		() => props.onToggle,
	)
	const rail = () => props.isRail ?? false
	const fixed = () => props.isFixedNav ?? false
	const persistent = () => props.isPersistent ?? true

	const toggle = (next: boolean) => {
		if (next === open()) return
		setOpen(next)
		props.onToggle?.(next)
	}

	let timer: ReturnType<typeof setTimeout> | undefined
	onCleanup(() => clearTimeout(timer))

	const state: SideNavState = {
		expanded: () => fixed() || open() || (!rail() && persistent()),
		rail,
	}

	const frame = () => {
		if (rail()) return `${FRAME} w-12`
		if (fixed()) return `${FRAME} w-64`
		// Nothing below `lg`: there the panel lies over the page, and takes no room.
		return persistent()
			? "relative shrink-0 lg:box-content lg:w-64 lg:border-r-2 lg:border-ink"
			: "relative shrink-0"
	}

	const panel = () => {
		// An open rail's own rule and shadow: it is over the page now, and the
		// frame's rule is 13rem behind its edge.
		if (rail()) {
			return `${PANEL} absolute inset-y-0 left-0 z-20 flex overflow-hidden transition-[width]
				motion-reduce:transition-none
				${open() ? "box-content w-64 border-r-2 border-ink shadow-hard" : "w-12"}`
		}
		if (fixed()) return `${PANEL} flex h-full`
		// Over the page below `lg`, and only while open; standing in the frame
		// from `lg` up, where the frame has the rule.
		return `${PANEL} absolute inset-y-0 left-0 z-20 box-content w-64 border-r-2 border-ink
			${open() ? "flex" : "hidden"}
			${persistent() ? "lg:static lg:flex lg:h-full lg:border-r-0" : ""}`
	}

	return (
		<SideNavContext.Provider value={state}>
			<nav
				aria-label={props["aria-label"]}
				aria-labelledby={props["aria-labelledby"]}
				class={`${frame()} ${props.class ?? ""}`}
			>
				<Show when={!rail() && !fixed() && open()}>
					{/* The page behind an open nav, where it is over the page. */}
					<div
						aria-hidden="true"
						onClick={() => {
							toggle(false)
							props.onOverlayClick?.()
						}}
						class={`fixed inset-0 z-10 bg-ink/40 ${persistent() ? "lg:hidden" : ""}`}
					/>
				</Show>
				<div
					onPointerEnter={(event) => {
						// A finger has no hover; a tap on a rail's icon is the tap, not
						// a request to open it first.
						if (!rail() || !(props.addMouseListeners ?? true) || event.pointerType === "touch") {
							return
						}
						clearTimeout(timer)
						timer = setTimeout(() => toggle(true), props.enterDelayMs ?? 100)
					}}
					onPointerLeave={() => {
						if (!rail() || !(props.addMouseListeners ?? true)) return
						clearTimeout(timer)
						toggle(false)
					}}
					onFocusIn={() => {
						if (rail() && (props.addFocusListeners ?? true)) toggle(true)
					}}
					onFocusOut={(event) => {
						const next = event.relatedTarget
						if (next instanceof Node && event.currentTarget.contains(next)) return
						if (rail() && (props.addFocusListeners ?? true)) toggle(false)
						props.onSideNavBlur?.()
					}}
					class={panel()}
				>
					<Scroller class="flex-1">{props.children}</Scroller>
				</div>
			</nav>
		</SideNavContext.Provider>
	)
}

/** The list the links are in. */
export function SideNavItems(props: { class?: string; children?: JSX.Element }) {
	return <ul class={`m-0 flex list-none flex-col p-0 ${props.class ?? ""}`}>{props.children}</ul>
}

/** One row of the list. */
export function SideNavItem(props: { class?: string; children?: JSX.Element }) {
	return <li class={`m-0 list-none p-0 ${props.class ?? ""}`}>{props.children}</li>
}

/** The cell a row's icon sits in. It is as wide as a shut rail, so the icon is
 *  in the same place whether the rail is open or shut and nothing slides when
 *  it opens. */
export function SideNavIcon(props: { class?: string; children?: JSX.Element }) {
	return (
		<span class={`flex w-12 shrink-0 items-center justify-center ${props.class ?? ""}`}>
			{props.children}
		</span>
	)
}

/** A row's words. They are cut off, not wrapped, and a shut rail simply has no
 *  room to show them. */
export function SideNavLinkText(props: { class?: string; children?: JSX.Element }) {
	return (
		<span class={`min-w-0 flex-1 truncate pr-2 text-small ${props.class ?? ""}`}>
			{props.children}
		</span>
	)
}

/** A row's box. The row for the page being shown inverts to ink, edge to edge. */
const ROW =
	"flex w-full cursor-pointer items-center border-0 text-left no-underline transition-colors focus-visible:-outline-offset-2 pointer-coarse:min-h-touch"
const ROW_REST = "bg-transparent text-ink hover:bg-gray"
const ROW_ACTIVE = "on-ink bg-ink font-bold text-white"

export type SideNavLinkProps = {
	href?: string
	renderIcon?: CarbonGlyph
	/** The page being shown. */
	isActive?: boolean
	/** A taller row: 3rem rather than 2. What a rail's rows should be, so each is
	 *  a square. */
	large?: boolean
	"aria-label"?: string
	class?: string
	children?: JSX.Element
	onClick?: () => void
}

export function SideNavLink(props: SideNavLinkProps) {
	return (
		<SideNavItem>
			<a
				href={props.href}
				aria-label={props["aria-label"]}
				aria-current={props.isActive ? "page" : undefined}
				onClick={() => props.onClick?.()}
				class={`${ROW} ${props.isActive ? ROW_ACTIVE : ROW_REST} ${props.large ? "h-12" : "h-8"}
					${props.renderIcon ? "" : "pl-4"} ${props.class ?? ""}`}
			>
				<Show when={props.renderIcon}>
					{(glyph) => (
						<SideNavIcon>
							<Icon glyph={glyph()} size={16} />
						</SideNavIcon>
					)}
				</Show>
				<SideNavLinkText>{props.children}</SideNavLinkText>
			</a>
		</SideNavItem>
	)
}

export type SideNavMenuProps = {
	/** What the row says. */
	title: string
	renderIcon?: CarbonGlyph
	defaultExpanded?: boolean
	/** One of its items is the page being shown. Marked on the menu's own row
	 *  while it is shut — open, the item says so itself. */
	isActive?: boolean
	large?: boolean
	class?: string
	/** SideNavMenuItems. */
	children?: JSX.Element
}

/** A row that opens a list of links beneath it. In a shut rail its list is put
 *  away, there being no room for words. */
export function SideNavMenu(props: SideNavMenuProps) {
	const nav = useSideNav()
	const [open, setOpen] = createSignal(props.defaultExpanded ?? false)
	const shown = () => open() && nav.expanded()

	return (
		<SideNavItem class={props.class}>
			<button
				type="button"
				aria-expanded={shown() ? "true" : "false"}
				onClick={() => setOpen((was) => !was)}
				class={`${ROW} ${props.isActive && !shown() ? ROW_ACTIVE : ROW_REST} ${
					props.large ? "h-12" : "h-8"
				}
					${props.renderIcon ? "" : "pl-4"}`}
			>
				<Show when={props.renderIcon}>
					{(glyph) => (
						<SideNavIcon>
							<Icon glyph={glyph()} size={16} />
						</SideNavIcon>
					)}
				</Show>
				<SideNavLinkText>{props.title}</SideNavLinkText>
				<Icon
					glyph={ChevronDown}
					size={16}
					class={`mr-2 transition-transform duration-220 ${shown() ? "rotate-180" : ""}`}
				/>
			</button>
			<Show when={shown()}>
				<ul class="m-0 list-none p-0">{props.children}</ul>
			</Show>
		</SideNavItem>
	)
}

export type SideNavMenuItemProps = {
	href?: string
	isActive?: boolean
	class?: string
	children?: JSX.Element
	onClick?: () => void
}

/** A link inside a SideNavMenu, set in past the icon column. */
export function SideNavMenuItem(props: SideNavMenuItemProps) {
	return (
		<SideNavItem>
			<a
				href={props.href}
				aria-current={props.isActive ? "page" : undefined}
				onClick={() => props.onClick?.()}
				class={`${ROW} ${props.isActive ? ROW_ACTIVE : ROW_REST} h-8 pl-12 pr-2 text-small ${
					props.class ?? ""
				}`}
			>
				<span class="min-w-0 truncate">{props.children}</span>
			</a>
		</SideNavItem>
	)
}

/** A rule across the nav, edge to edge. */
export function SideNavDivider(props: { class?: string }) {
	return (
		<li role="separator" class={`m-0 list-none border-t-2 border-ink p-0 ${props.class ?? ""}`} />
	)
}
