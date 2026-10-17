import CorvuPopover from "corvu/popover"
import { children, createContext, createSignal, Show, useContext } from "solid-js"
import type { JSX } from "solid-js"
import ChevronDown from "@carbon/icons/es/chevron--down/16"
import Close from "@carbon/icons/es/close/20"
import Menu from "@carbon/icons/es/menu/20"
import { Icon } from "../../icons/Icon"
import { FLOATING_SURFACE } from "../../internal/styles"
import { Tooltip } from "../Tooltip/Tooltip"

/** Carbon's UI Shell, the header half: the bar across the top of an app.
 *
 *  An ink bar, 3rem tall, cut into cells. A cell lights on hover and inverts
 *  when it is the active one — white ground, ink mark — which is how the system
 *  says "this one" everywhere else.
 *
 *  Two things differ from Carbon on purpose. The bar is not `position: fixed`:
 *  it is laid out by whatever holds it (`AppShell` is a column), so nothing has
 *  to be pushed down by a magic 3rem to clear it. And `on-ink` is on each cell
 *  rather than on the bar, because a `HeaderPanel` hangs inside the bar's own
 *  element and is white: marked on the bar, the panel's focus rings and text
 *  selection would be flipped for a ground it does not have.
 */

/** What every cell of the bar shares. No ground and no ink here — those are
 *  the two whole strings below, never a base with an override. */
const CELL =
	"flex h-full shrink-0 cursor-pointer items-center border-0 no-underline transition-colors focus-visible:-outline-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
const CELL_REST = "on-ink bg-transparent text-white hover:bg-white/20 disabled:hover:bg-transparent"
const CELL_ACTIVE = "bg-white text-ink"

const cell = (active: boolean | undefined) => `${CELL} ${active ? CELL_ACTIVE : CELL_REST}`

export type HeaderProps = {
	"aria-label"?: string
	"aria-labelledby"?: string
	class?: string
	children?: JSX.Element
}

export function Header(props: HeaderProps) {
	return (
		<header
			aria-label={props["aria-label"]}
			aria-labelledby={props["aria-labelledby"]}
			// Positioned, so a HeaderPanel can hang from it; raised, so that panel
			// and an expanded rail's shadow fall over the page and not under it.
			class={`relative z-20 flex h-12 shrink-0 items-stretch border-b-2 border-ink bg-ink text-white ${
				props.class ?? ""
			}`}
		>
			{props.children}
		</header>
	)
}

export type HeaderContainerRenderProps = {
	isSideNavExpanded: () => boolean
	onClickSideNavExpand: () => void
}

export type HeaderContainerProps = {
	/** Whether the side nav starts open. */
	isSideNavExpanded?: boolean
	render: (state: HeaderContainerRenderProps) => JSX.Element
}

/** Carbon's HeaderContainer: holds whether the side nav is open, for a header
 *  whose menu button and side nav need to agree. */
export function HeaderContainer(props: HeaderContainerProps) {
	const [expanded, setExpanded] = createSignal(props.isSideNavExpanded ?? false)

	return (
		<>
			{props.render({
				isSideNavExpanded: expanded,
				onClickSideNavExpand: () => setExpanded((open) => !open),
			})}
		</>
	)
}

export type HeaderMenuButtonProps = {
	"aria-label"?: string
	"aria-labelledby"?: string
	class?: string
	/** The side nav it controls is open. */
	isActive?: boolean
	/** Shown at every width. Left off, it appears only where the side nav is not
	 *  already standing — below `lg`. */
	isCollapsible?: boolean
	renderMenuIcon?: JSX.Element
	renderCloseIcon?: JSX.Element
	onClick?: () => void
}

/** The button that opens and shuts the side nav. */
export function HeaderMenuButton(props: HeaderMenuButtonProps) {
	// Resolved once — see "Slots" in CLAUDE.md.
	const menuIcon = children(() => props.renderMenuIcon)
	const closeIcon = children(() => props.renderCloseIcon)

	return (
		<button
			type="button"
			aria-label={props["aria-label"] ?? (props.isActive ? "Close menu" : "Open menu")}
			aria-labelledby={props["aria-labelledby"]}
			aria-expanded={props.isActive ? "true" : "false"}
			onClick={() => props.onClick?.()}
			class={`${cell(props.isActive)} w-12 justify-center ${
				props.isCollapsible ? "" : "lg:hidden"
			} ${props.class ?? ""}`}
		>
			<Show
				when={props.isActive}
				fallback={
					<Show when={menuIcon()} fallback={<Icon glyph={Menu} size={20} />}>{menuIcon()}</Show>
				}
			>
				<Show when={closeIcon()} fallback={<Icon glyph={Close} size={20} />}>{closeIcon()}</Show>
			</Show>
		</button>
	)
}

export type HeaderNameProps = {
	href?: string
	/** Set before the name in regular weight: a company, ahead of its product. */
	prefix?: string
	class?: string
	children?: JSX.Element
}

/** The product's name, as the way home. */
export function HeaderName(props: HeaderNameProps) {
	const inside = () => (
		<>
			<Show when={props.prefix}>
				<span class="font-normal">{props.prefix}</span>
			</Show>
			<b class="font-bold">{props.children}</b>
		</>
	)
	const look = () => `gap-snug px-2 text-body ${props.class ?? ""}`

	return (
		<Show
			when={props.href}
			fallback={
				<span class={`flex h-full shrink-0 items-center text-white ${look()}`}>{inside()}</span>
			}
		>
			<a href={props.href} class={`${cell(false)} ${look()}`}>{inside()}</a>
		</Show>
	)
}

/** Whether an item is being drawn on white — in a HeaderMenu's list, or in the
 *  side nav — rather than on the bar itself. */
const InMenuContext = createContext(false)

export type HeaderNavigationProps = {
	"aria-label"?: string
	"aria-labelledby"?: string
	class?: string
	/** HeaderMenuItems and HeaderMenus. */
	children?: JSX.Element
}

/** The bar's links. Below `lg` they leave the bar — put the same items in the
 *  side nav with `HeaderSideNavItems`. */
export function HeaderNavigation(props: HeaderNavigationProps) {
	return (
		<nav
			aria-label={props["aria-label"]}
			aria-labelledby={props["aria-labelledby"]}
			class={`hidden items-stretch lg:flex ${props.class ?? ""}`}
		>
			<ul class="m-0 flex list-none items-stretch p-0">{props.children}</ul>
		</nav>
	)
}

export type HeaderMenuItemProps = {
	href?: string
	/** The page being shown. */
	isActive?: boolean
	"aria-current"?: "page" | "true" | "false"
	class?: string
	children?: JSX.Element
	onClick?: () => void
}

export function HeaderMenuItem(props: HeaderMenuItemProps) {
	const inMenu = useContext(InMenuContext)
	const current = () => props["aria-current"] ?? (props.isActive ? "page" : undefined)

	return (
		<li class="m-0 flex list-none p-0">
			<a
				href={props.href}
				aria-current={current()}
				onClick={() => props.onClick?.()}
				// On the bar it is a cell; in a menu's list it is a row on white.
				class={inMenu
					? `flex w-full cursor-pointer items-center px-2 py-snug text-small no-underline
						focus-visible:-outline-offset-2 pointer-coarse:min-h-touch
						${props.isActive ? "on-ink bg-ink font-bold text-white" : "text-ink hover:bg-gray"}
						${props.class ?? ""}`
					: `${cell(props.isActive)} px-2 text-small ${props.class ?? ""}`}
			>
				{props.children}
			</a>
		</li>
	)
}

export type HeaderMenuProps = {
	"aria-label"?: string
	"aria-labelledby"?: string
	/** What the bar says for this menu. */
	menuLinkName: string
	/** One of its items is the page being shown. */
	isActive?: boolean
	class?: string
	/** HeaderMenuItems. */
	children?: JSX.Element
}

/** A link on the bar that opens a list of links. Corvu Popover places the list
 *  and handles Escape and outside presses. */
export function HeaderMenu(props: HeaderMenuProps) {
	return (
		<li class="m-0 flex list-none p-0">
			<CorvuPopover
				placement="bottom-start"
				floatingOptions={{ offset: 0, flip: true, shift: true }}
			>
				<CorvuPopover.Trigger
					type="button"
					aria-label={props["aria-label"]}
					aria-labelledby={props["aria-labelledby"]}
					class={`${
						cell(props.isActive)
					} gap-tight px-2 text-small data-[open]:bg-white data-[open]:text-ink
						${props.class ?? ""}`}
				>
					{props.menuLinkName}
					<Icon glyph={ChevronDown} size={16} />
				</CorvuPopover.Trigger>
				<CorvuPopover.Portal>
					<CorvuPopover.Content class={`${FLOATING_SURFACE} min-w-48 focus-visible:outline-none`}>
						<InMenuContext.Provider value>
							<ul class="m-0 list-none p-0">{props.children}</ul>
						</InMenuContext.Provider>
					</CorvuPopover.Content>
				</CorvuPopover.Portal>
			</CorvuPopover>
		</li>
	)
}

export type HeaderSideNavItemsProps = {
	/** Rules them off from what follows. */
	hasDivider?: boolean
	class?: string
	/** The same HeaderMenuItems the bar has. */
	children?: JSX.Element
}

/** The header's links, where the header has no room for them: below `lg`
 *  `HeaderNavigation` leaves the bar, and the same items go here, inside the
 *  side nav — where they are rows on white, not cells on ink. */
export function HeaderSideNavItems(props: HeaderSideNavItemsProps) {
	return (
		<InMenuContext.Provider value>
			<ul
				class={`m-0 flex list-none flex-col p-0 lg:hidden ${
					props.hasDivider ? "border-b-2 border-ink" : ""
				} ${props.class ?? ""}`}
			>
				{props.children}
			</ul>
		</InMenuContext.Provider>
	)
}

/** The actions at the bar's trailing end. */
export function HeaderGlobalBar(props: { class?: string; children?: JSX.Element }) {
	return <div class={`ml-auto flex items-stretch ${props.class ?? ""}`}>{props.children}</div>
}

export type HeaderGlobalActionProps = {
	/** Required in practice: the action's name, and its tooltip. An icon alone
	 *  never says what it does. */
	"aria-label"?: string
	/** The panel or mode this action opens is showing. */
	isActive?: boolean
	/** Which end of the button the tooltip lines up with. `end` for the last
	 *  actions on the bar, so it does not hang off the window. */
	tooltipAlignment?: "start" | "center" | "end"
	disabled?: boolean
	class?: string
	/** The icon. */
	children?: JSX.Element
	onClick?: () => void
}

const TOOLTIP = { start: "bottom-start", center: "bottom", end: "bottom-end" } as const

/** One icon action on the bar: a square cell, and a tooltip that names it. */
export function HeaderGlobalAction(props: HeaderGlobalActionProps) {
	return (
		<Tooltip
			label={props["aria-label"] ?? ""}
			align={TOOLTIP[props.tooltipAlignment ?? "center"]}
			disabled={props.disabled}
			onClick={() => props.onClick?.()}
			// The face is a span inside the trigger, not the trigger: Tooltip gives
			// its button a transparent ground of its own, and a second ground beside
			// it would be settled by stylesheet order.
			class={`h-full focus-visible:-outline-offset-2 ${props.isActive ? "" : "on-ink"}`}
		>
			<span
				class={`${cell(props.isActive)} w-12 justify-center ${props.disabled ? "opacity-40" : ""} ${
					props.class ?? ""
				}`}
			>
				{props.children}
			</span>
		</Tooltip>
	)
}

export type HeaderPanelProps = {
	/** Whether it is showing. */
	expanded?: boolean
	"aria-label"?: string
	class?: string
	/** Usually a Switcher. */
	children?: JSX.Element
}

/** A panel hung from the bar's trailing end, opened by a HeaderGlobalAction.
 *  It holds no state: the action that opens it says whether it is open. */
export function HeaderPanel(props: HeaderPanelProps) {
	return (
		<Show when={props.expanded}>
			<div
				aria-label={props["aria-label"]}
				class={`absolute right-0 top-full w-64 max-w-[86vw] border-2 border-ink bg-white text-ink
					shadow-hard ${props.class ?? ""}`}
			>
				{props.children}
			</div>
		</Show>
	)
}

export type SkipToContentProps = {
	/** Where the content is. `#main-content`, which is what `Content` is called. */
	href?: string
	class?: string
	children?: string
}

/** The first thing a keyboard reaches: a link past the shell to the page. It
 *  is not shown until it is focused. */
export function SkipToContent(props: SkipToContentProps) {
	return (
		<a
			href={props.href ?? "#main-content"}
			class={`sr-only border-2 border-ink bg-white px-2 py-snug text-label font-bold uppercase text-ink
				no-underline focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50
				${props.class ?? ""}`}
		>
			{props.children ?? "Skip to main content"}
		</a>
	)
}
