import CorvuPopover from "corvu/popover"
import {
	createContext,
	createEffect,
	createSignal,
	createUniqueId,
	For,
	onCleanup,
	Show,
	useContext,
} from "solid-js"
import type { JSX } from "solid-js"
import Checkmark from "@carbon/icons/es/checkmark/16"
import ChevronDown from "@carbon/icons/es/chevron--down/16"
import ChevronRight from "@carbon/icons/es/chevron--right/16"
import OverflowMenuVertical from "@carbon/icons/es/overflow-menu--vertical/16"
import type { CarbonGlyph } from "../../icons/glyph"
import { Icon } from "../../icons/Icon"
import { createControllable } from "../../internal/control"
import { createRoving, focusRow } from "../../internal/roving"
import { Scroller } from "../../internal/scroll"
import { FLOATING_SURFACE } from "../../internal/styles"
import { Button } from "../Button/Button"
import type { ButtonSize } from "../Button/Button"
import type { PopoverAlign } from "../Popover/Popover"

export type MenuSize = "sm" | "md" | "lg"

type MenuContextValue = {
	size: () => MenuSize
	/** Closes the whole tree, from the root — what choosing an item does. */
	closeRoot: () => void
	/** Some row at this level has an icon or a tick, so every row keeps the
	 *  leading column and their labels stay in one line down the menu. */
	leading: () => boolean
	claimLeading: () => void
	/** Which submenu at this level is open, by its trigger's id. One at a time. */
	openSub: () => string | undefined
	setOpenSub: (id: string | undefined) => void
}

const MenuContext = createContext<MenuContextValue>()

/** Opening a menu puts focus on its first row. */
const focusFirstRow = focusRow("[role^='menuitem']")

function useMenu(component: string): MenuContextValue {
	const ctx = useContext(MenuContext)
	if (!ctx) throw new Error(`${component} must be used inside a Menu, MenuButton or ComboButton`)
	return ctx
}

const ROW: Record<MenuSize, string> = {
	sm: "py-tight",
	md: "py-snug",
	lg: "py-2",
}

/** One row's box. Focus is an *inset* outline: the list scrolls, and an outline
 *  set off from the row would be cut by the list's own edge. */
function rowClass(size: MenuSize, danger: boolean): string {
	return `flex w-full cursor-pointer items-center gap-2 border-0 bg-transparent px-2 text-left
		text-body text-ink transition-colors
		focus-visible:-outline-offset-2 disabled:cursor-not-allowed disabled:opacity-40
		data-[open]:bg-gray pointer-coarse:min-h-touch
		${danger ? "font-bold uppercase hover:bg-hatch" : "hover:bg-gray"} ${ROW[size]}`
}

type MenuContentProps = {
	label?: string
	size?: MenuSize
	closeRoot: () => void
	class?: string
	children?: JSX.Element
	onKeyDown?: (event: KeyboardEvent) => void
}

/** The floating list itself. Rendered inside a Corvu Popover root by Menu,
 *  MenuButton, ComboButton and every submenu.
 *
 *  Roving focus is `createRoving`, per the WAI-ARIA menu pattern: the arrows
 *  move, Home and End jump, and a printable key goes to the next row that
 *  starts with it. Submenus live in their own portals, so every `menuitem` inside this element
 *  belongs to this level and no filtering by depth is needed.
 */
function MenuContent(props: MenuContentProps) {
	const parent = useContext(MenuContext)
	const [list, setList] = createSignal<HTMLElement>()
	const [leading, setLeading] = createSignal(false)
	const [openSub, setOpenSub] = createSignal<string>()
	const ctx: MenuContextValue = {
		size: () => props.size ?? parent?.size() ?? "md",
		closeRoot: () => props.closeRoot(),
		leading,
		claimLeading: () => setLeading(true),
		openSub,
		setOpenSub,
	}

	const roving = createRoving(list, "[role^='menuitem']")

	// The caller's handler goes first — a submenu's uses it for the arrow that
	// closes it — and whatever it prevents, the list leaves alone.
	const onKeyDown = (event: KeyboardEvent) => {
		props.onKeyDown?.(event)
		roving.onKeyDown(event)
	}

	return (
		<CorvuPopover.Portal>
			<CorvuPopover.Content
				ref={setList}
				role="menu"
				aria-label={props.label}
				onKeyDown={onKeyDown}
				// A column, so the scroller inside gives way when the menu is taller
				// than the window allows.
				class={`${FLOATING_SURFACE} flex max-h-[80vh] min-w-48 flex-col focus-visible:outline-none
					${props.class ?? ""}`}
			>
				<Scroller>
					<MenuContext.Provider value={ctx}>{props.children}</MenuContext.Provider>
				</Scroller>
			</CorvuPopover.Content>
		</CorvuPopover.Portal>
	)
}

/** The leading column: an icon or a tick, or the space where one would be. */
function Leading(props: { children?: JSX.Element }) {
	const ctx = useMenu("MenuItem")

	return (
		<Show when={ctx.leading()}>
			<span class="flex w-4 shrink-0 justify-center">{props.children}</span>
		</Show>
	)
}

export type MenuItemProps = {
	label: string
	/** Shown at the trailing edge. Display only — binding the key is the app's. */
	shortcut?: string
	renderIcon?: CarbonGlyph
	/** `danger` is destructive: bold, uppercase, and it takes the hatch on hover.
	 *  Never a colour. */
	kind?: "default" | "danger"
	disabled?: boolean
	onClick?: () => void
	/** More MenuItems make this row open a submenu instead of acting. */
	children?: JSX.Element
}

/** One row. With children it is the trigger of a submenu: a press, the right
 *  arrow or a hovering mouse opens it; the left arrow or Escape closes it. */
export function MenuItem(props: MenuItemProps) {
	const ctx = useMenu("MenuItem")
	const id = createUniqueId()
	if (props.renderIcon) ctx.claimLeading()

	// Asked of the props object, not read: reading `children` would build the
	// submenu's rows here, under this level's context, before there is a submenu
	// for them to belong to.
	const hasSubmenu = "children" in props

	const body = () => (
		<>
			<Leading>
				<Show when={props.renderIcon}>{(glyph) => <Icon glyph={glyph()} size={16} />}</Show>
			</Leading>
			<span class="min-w-0 flex-1 truncate">{props.label}</span>
			<Show when={props.shortcut}>
				<span class="shrink-0 text-micro uppercase opacity-muted">{props.shortcut}</span>
			</Show>
		</>
	)

	if (!hasSubmenu) {
		return (
			<button
				type="button"
				role="menuitem"
				tabindex={-1}
				disabled={props.disabled}
				onPointerEnter={(event) => {
					if (event.pointerType === "mouse") ctx.setOpenSub(undefined)
				}}
				onClick={() => {
					props.onClick?.()
					ctx.closeRoot()
				}}
				class={rowClass(ctx.size(), props.kind === "danger")}
			>
				{body()}
			</button>
		)
	}

	return (
		<CorvuPopover
			open={ctx.openSub() === id}
			onOpenChange={(open: boolean) => ctx.setOpenSub(open ? id : undefined)}
			placement="right-start"
			floatingOptions={{ offset: 0, flip: true, shift: true }}
			onInitialFocus={focusFirstRow}
		>
			<CorvuPopover.Trigger
				type="button"
				role="menuitem"
				aria-haspopup="menu"
				tabindex={-1}
				disabled={props.disabled}
				onPointerEnter={(event: PointerEvent) => {
					if (event.pointerType === "mouse") ctx.setOpenSub(id)
				}}
				onKeyDown={(event: KeyboardEvent) => {
					if (event.key === "ArrowRight") {
						event.preventDefault()
						ctx.setOpenSub(id)
					}
				}}
				class={rowClass(ctx.size(), false)}
			>
				{body()}
				<Icon glyph={ChevronRight} size={16} />
			</CorvuPopover.Trigger>
			<MenuContent
				label={props.label}
				closeRoot={ctx.closeRoot}
				onKeyDown={(event) => {
					if (event.key === "ArrowLeft") {
						event.preventDefault()
						// Stopped here so the parent level does not also act on it.
						event.stopPropagation()
						ctx.setOpenSub(undefined)
					}
				}}
			>
				{props.children}
			</MenuContent>
		</CorvuPopover>
	)
}

/** An ink rule, edge to edge, between two runs of rows. */
export function MenuItemDivider() {
	return <div role="separator" class="border-t-2 border-ink" />
}

export type MenuItemGroupProps = {
	/** Names the group for assistive tech. Not shown, as in Carbon. */
	label: string
	children?: JSX.Element
}

export function MenuItemGroup(props: MenuItemGroupProps) {
	return (
		<div role="group" aria-label={props.label}>
			{props.children}
		</div>
	)
}

export type MenuItemSelectableProps = {
	label: string
	/** Controlled when given. */
	selected?: boolean
	defaultSelected?: boolean
	disabled?: boolean
	onChange?: (selected: boolean) => void
}

/** A row that is on or off. The tick sits in the leading column. */
export function MenuItemSelectable(props: MenuItemSelectableProps) {
	const ctx = useMenu("MenuItemSelectable")
	ctx.claimLeading()
	const [selected, setSelected] = createControllable(
		() => props.selected,
		props.defaultSelected ?? false,
		() => props.onChange,
	)

	return (
		<button
			type="button"
			role="menuitemcheckbox"
			aria-checked={selected()}
			tabindex={-1}
			disabled={props.disabled}
			onPointerEnter={(event) => {
				if (event.pointerType === "mouse") ctx.setOpenSub(undefined)
			}}
			onClick={() => {
				const next = !selected()
				setSelected(next)
				props.onChange?.(next)
				ctx.closeRoot()
			}}
			class={rowClass(ctx.size(), false)}
		>
			<Leading>
				<Show when={selected()}>
					<Icon glyph={Checkmark} size={16} />
				</Show>
			</Leading>
			<span class="min-w-0 flex-1 truncate">{props.label}</span>
		</button>
	)
}

export type MenuItemRadioGroupProps<Item> = {
	/** Names the group for assistive tech. */
	label: string
	items: Item[]
	/** Controlled when given. */
	selectedItem?: Item
	defaultSelectedItem?: Item
	/** How an item reads in its row. Defaults to `String(item)`. */
	itemToString?: (item: Item) => string
	onChange?: (item: Item) => void
}

/** A run of rows of which exactly one is chosen. */
export function MenuItemRadioGroup<Item>(props: MenuItemRadioGroupProps<Item>) {
	const ctx = useMenu("MenuItemRadioGroup")
	ctx.claimLeading()
	const [selected, setSelected] = createControllable(
		() => props.selectedItem,
		props.defaultSelectedItem,
		() => props.onChange,
	)
	const text = (item: Item) => (props.itemToString ? props.itemToString(item) : String(item))

	return (
		<div role="group" aria-label={props.label}>
			<For each={props.items}>
				{(item) => (
					<button
						type="button"
						role="menuitemradio"
						aria-checked={selected() === item}
						tabindex={-1}
						onPointerEnter={(event) => {
							if (event.pointerType === "mouse") ctx.setOpenSub(undefined)
						}}
						onClick={() => {
							setSelected(item)
							props.onChange?.(item)
							ctx.closeRoot()
						}}
						class={rowClass(ctx.size(), false)}
					>
						<Leading>
							<Show when={selected() === item}>
								<Icon glyph={Checkmark} size={16} />
							</Show>
						</Leading>
						<span class="min-w-0 flex-1 truncate">{text(item)}</span>
					</button>
				)}
			</For>
		</div>
	)
}

export type MenuProps = {
	open: boolean
	/** Names the menu for assistive tech. */
	label: string
	/** Where its top-left corner goes, in viewport pixels. */
	x?: number
	y?: number
	size?: MenuSize
	class?: string
	children?: JSX.Element
	onClose?: () => void
}

/** Carbon's Menu: the list on its own, placed at a point.
 *
 *  This is the context menu — pair it with `useContextMenu`, which supplies
 *  `open`, `x`, `y` and `onClose` for a right-click. A menu that hangs from a
 *  button is a `MenuButton`, a `ComboButton` or an `OverflowMenu`.
 *
 *  The point is handed to CSS as two custom properties on an empty anchor,
 *  which Corvu then positions against exactly as it would a trigger, so a menu
 *  opened near the viewport's edge still flips to stay inside it.
 */
export function Menu(props: MenuProps) {
	return (
		<CorvuPopover
			open={props.open}
			onOpenChange={(open: boolean) => {
				if (!open) props.onClose?.()
			}}
			placement="bottom-start"
			floatingOptions={{ offset: 0, flip: true, shift: true }}
			onInitialFocus={focusFirstRow}
		>
			<CorvuPopover.Anchor
				as="span"
				aria-hidden="true"
				style={{ "--menu-x": `${props.x ?? 0}px`, "--menu-y": `${props.y ?? 0}px` }}
				class="pointer-events-none fixed left-[var(--menu-x)] top-[var(--menu-y)] size-0"
			/>
			<MenuContent
				label={props.label}
				size={props.size}
				closeRoot={() => props.onClose?.()}
				class={props.class}
			>
				{props.children}
			</MenuContent>
		</CorvuPopover>
	)
}

export type ContextMenuState = {
	readonly open: boolean
	readonly x: number
	readonly y: number
	onClose: () => void
}

/** Carbon's useContextMenu: opens a Menu where the secondary button was pressed.
 *
 *  Spread the result onto a `Menu`. Without a target it listens on the whole
 *  document; with one, only inside that element. Reads live — the fields are
 *  getters over signals, which survive the spread.
 *
 *  Keyboard users reach the same event with Shift+F10 or the Menu key, which
 *  browsers report at the focused element's position.
 */
export function useContextMenu(target?: () => HTMLElement | undefined): ContextMenuState {
	const [open, setOpen] = createSignal(false)
	const [position, setPosition] = createSignal({ x: 0, y: 0 })

	createEffect(() => {
		const el: HTMLElement | Document | undefined = target ? target() : document
		if (!el) return

		const onContextMenu = (event: Event) => {
			if (!(event instanceof MouseEvent)) return
			event.preventDefault()
			setPosition({ x: event.clientX, y: event.clientY })
			setOpen(true)
		}

		el.addEventListener("contextmenu", onContextMenu)
		onCleanup(() => el.removeEventListener("contextmenu", onContextMenu))
	})

	return {
		get open() {
			return open()
		},
		get x() {
			return position().x
		},
		get y() {
			return position().y
		},
		onClose: () => setOpen(false),
	}
}

export type MenuButtonProps = {
	label: string
	kind?: "primary" | "tertiary" | "ghost"
	size?: ButtonSize
	menuAlignment?: PopoverAlign
	disabled?: boolean
	class?: string
	/** MenuItems. */
	children?: JSX.Element
}

/** Carbon's MenuButton: a button whose only job is to open a menu.
 *
 *  The trigger is a real `Button`, so it wears a kind and a size like any
 *  other. The chevron trails the label — the one place an icon does, because
 *  here it is not the button's subject but a note that there is more beneath.
 */
export function MenuButton(props: MenuButtonProps) {
	const [open, setOpen] = createSignal(false)

	return (
		<CorvuPopover
			open={open()}
			onOpenChange={setOpen}
			placement={props.menuAlignment ?? "bottom-start"}
			floatingOptions={{ offset: 4, flip: true, shift: true }}
			onInitialFocus={focusFirstRow}
		>
			<CorvuPopover.Trigger
				as={Button}
				kind={props.kind ?? "primary"}
				size={props.size}
				disabled={props.disabled}
				// An open menu inverts its trigger, as OverflowMenu's does — except the
				// primary kind, which is ink already and has nothing left to invert to.
				class={`${
					(props.kind ?? "primary") === "primary" ? "" : "data-[open]:bg-ink data-[open]:text-white"
				} ${props.class ?? ""}`}
			>
				{props.label}
				<Icon glyph={ChevronDown} size={16} />
			</CorvuPopover.Trigger>
			<MenuContent label={props.label} size={props.size} closeRoot={() => setOpen(false)}>
				{props.children}
			</MenuContent>
		</CorvuPopover>
	)
}

export type OverflowMenuV2Props = {
	/** What the menu holds: the trigger's accessible name and tooltip, and the
	 *  menu's own name. */
	label?: string
	/** Replaces the vertical dots. */
	renderIcon?: CarbonGlyph
	size?: MenuSize
	menuAlignment?: "top-start" | "top-end" | "bottom-start" | "bottom-end"
	disabled?: boolean
	class?: string
	/** MenuItems. */
	children?: JSX.Element
}

/** Carbon's next OverflowMenu (unstable, as of @carbon/react 1.118): the dots,
 *  opening a `Menu`.
 *
 *  The stable `OverflowMenu` takes `OverflowMenuItem`s, which are its own and
 *  can only be plain rows. This one takes `MenuItem`s, so it gets everything a
 *  Menu has — submenus, dividers, ticked and radio rows, shortcuts. Carbon means
 *  it to replace the other eventually; both are here until it does.
 */
export function OverflowMenuV2(props: OverflowMenuV2Props) {
	const [open, setOpen] = createSignal(false)

	return (
		<CorvuPopover
			open={open()}
			onOpenChange={setOpen}
			placement={props.menuAlignment ?? "bottom-end"}
			floatingOptions={{ offset: 4, flip: true, shift: true }}
			onInitialFocus={focusFirstRow}
		>
			<CorvuPopover.Trigger
				type="button"
				aria-label={props.label ?? "Options"}
				title={props.label ?? "Options"}
				disabled={props.disabled}
				class={`inline-flex cursor-pointer items-center justify-center border-2 border-transparent
					bg-transparent p-tight text-ink transition-colors
 hover:bg-gray disabled:cursor-not-allowed disabled:opacity-40
					data-[open]:bg-ink data-[open]:text-white pointer-coarse:min-h-touch
					pointer-coarse:min-w-touch ${props.class ?? ""}`}
			>
				<Icon glyph={props.renderIcon ?? OverflowMenuVertical} size={16} />
			</CorvuPopover.Trigger>
			<MenuContent
				label={props.label ?? "Options"}
				size={props.size}
				closeRoot={() => setOpen(false)}
			>
				{props.children}
			</MenuContent>
		</CorvuPopover>
	)
}

export type ComboButtonProps = {
	/** The primary action's label. */
	label: string
	size?: ButtonSize
	menuAlignment?: PopoverAlign
	/** Accessible name for the half that opens the menu. */
	menuLabel?: string
	disabled?: boolean
	class?: string
	/** The other actions, as MenuItems. */
	children?: JSX.Element
	/** The primary action. */
	onClick?: () => void
}

/** Carbon's ComboButton: one action up front, and the rest behind a chevron.
 *
 *  Two buttons drawn as one object: a single hard shadow under the pair, and a
 *  white rule between the halves. The menu hangs from the pair, not from the
 *  chevron, so it lines up with the control's leading edge.
 */
export function ComboButton(props: ComboButtonProps) {
	const [open, setOpen] = createSignal(false)

	return (
		<CorvuPopover
			open={open()}
			onOpenChange={setOpen}
			placement={props.menuAlignment ?? "bottom-start"}
			floatingOptions={{ offset: 4, flip: true, shift: true }}
			onInitialFocus={focusFirstRow}
		>
			<CorvuPopover.Anchor as="span" class={`inline-flex shadow-hard ${props.class ?? ""}`}>
				<Button
					kind="primary"
					flat
					size={props.size}
					disabled={props.disabled}
					onClick={() => props.onClick?.()}
				>
					{props.label}
				</Button>
				<span class="flex border-l-2 border-white">
					<CorvuPopover.Trigger
						as={Button}
						kind="primary"
						flat
						size={props.size}
						disabled={props.disabled}
						aria-label={props.menuLabel ?? "More actions"}
						class="justify-center pointer-coarse:min-w-touch"
					>
						<Icon glyph={ChevronDown} size={16} />
					</CorvuPopover.Trigger>
				</span>
			</CorvuPopover.Anchor>
			<MenuContent
				label={props.menuLabel ?? "More actions"}
				size={props.size}
				closeRoot={() => setOpen(false)}
			>
				{props.children}
			</MenuContent>
		</CorvuPopover>
	)
}
