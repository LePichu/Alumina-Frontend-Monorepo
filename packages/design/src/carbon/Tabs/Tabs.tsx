import { createContext, createUniqueId, Show, useContext } from "solid-js"
import type { JSX } from "solid-js"
import type { CarbonGlyph } from "../../icons/glyph"
import { Icon } from "../../icons/Icon"
import { createControllable } from "../../internal/control"

type Orientation = "horizontal" | "vertical"

type TabsContextValue = {
	selected: () => number
	select: (index: number) => void
	orientation: () => Orientation
	claimTab: () => number
	claimPanel: () => number
	/** A list or a set of panels calls these as it is created, so indices start
	 *  from zero again each time one mounts. */
	resetTabs: () => void
	resetPanels: () => void
	baseId: string
	register: (el: HTMLButtonElement) => void
	focusAt: (index: number) => void
	count: () => number
}

const TabsContext = createContext<TabsContextValue>()

function useTabs(component: string) {
	const ctx = useContext(TabsContext)
	if (!ctx) throw new Error(`${component} must be used inside Tabs`)
	return ctx
}

export type TabsProps = {
	selectedIndex?: number
	class?: string
	children?: JSX.Element
	onChange?: (index: number) => void
}

function createTabs(
	props: TabsProps,
	orientation: Orientation,
): TabsContextValue {
	let tabCounter = 0
	let panelCounter = 0
	let buttons: HTMLButtonElement[] = []
	const [selected, setSelected] = createControllable(
		() => props.selectedIndex,
		0,
		() => props.onChange,
	)

	const select = (index: number) => {
		setSelected(index)
		props.onChange?.(index)
	}

	return {
		selected,
		select,
		orientation: () => orientation,
		claimTab: () => tabCounter++,
		claimPanel: () => panelCounter++,
		// Tabs can outlive its list. kiln wraps a Modal in one: the list lives in
		// the dialog's portal and is rebuilt every time the dialog opens, while this
		// provider stays put. Without the reset the second opening's tabs would
		// claim 5–9 instead of 0–4 and match no panel.
		resetTabs: () => {
			tabCounter = 0
			buttons = []
		},
		resetPanels: () => {
			panelCounter = 0
		},
		baseId: `tabs-${createUniqueId()}`,
		register: (el) => buttons.push(el),
		count: () => buttons.length,
		focusAt: (index) => {
			const count = buttons.length
			if (count === 0) return
			const next = ((index % count) + count) % count
			buttons[next]?.focus()
			select(next)
		},
	}
}

export function Tabs(props: TabsProps) {
	const ctx = createTabs(props, "horizontal")

	return (
		<TabsContext.Provider value={ctx}>
			<div class={props.class}>{props.children}</div>
		</TabsContext.Provider>
	)
}

/** Carbon's TabsVertical: the list runs down the side and the panels sit beside
 *  it.
 *
 *  It lays nothing out itself. The list and the panels are often not siblings —
 *  kiln's settings puts the list in a Modal's navigation slot and the panels in
 *  its body — so the wrapper only provides the context, and placement is whoever
 *  holds the two halves. Pass `class` for the common case where they *are*
 *  siblings and just need to sit in a row.
 */
export function TabsVertical(props: TabsProps) {
	const ctx = createTabs(props, "vertical")

	return (
		<TabsContext.Provider value={ctx}>
			<div class={props.class}>{props.children}</div>
		</TabsContext.Provider>
	)
}

export type TabListProps = {
	"aria-label": string
	class?: string
	children?: JSX.Element
}

export function TabList(props: TabListProps) {
	const ctx = useTabs("TabList")
	ctx.resetTabs()

	return (
		<div
			role="tablist"
			aria-label={props["aria-label"]}
			class={`flex flex-wrap items-stretch gap-tight border-b-2 border-ink ${props.class ?? ""}`}
		>
			{props.children}
		</div>
	)
}

/** A plain column: no rules between the tabs and no gaps, and the chosen one
 *  the single inked row — what the shell's own strip does with its tabs. It was
 *  a ruled column, an ink rule under every tab, and in review six rules for six
 *  sections read as busy rather than ordered.
 *
 *  Below `sm` it lies down: a column of tabs beside its panels needs a width a
 *  phone does not have, so the same tabs run in a row that scrolls sideways.
 *  It is still one tab list — the arrow keys answer in both directions while it
 *  is vertical, so whichever way it happens to be lying, the key that points
 *  along it works. */
export function TabListVertical(props: TabListProps) {
	const ctx = useTabs("TabListVertical")
	ctx.resetTabs()

	return (
		<div
			role="tablist"
			aria-label={props["aria-label"]}
			aria-orientation="vertical"
			class={`flex flex-row overflow-x-auto sm:flex-col sm:overflow-x-visible ${props.class ?? ""}`}
		>
			{props.children}
		</div>
	)
}

export type TabProps = {
	disabled?: boolean
	class?: string
	children?: JSX.Element
	/** For a tab whose content is not text. */
	"aria-label"?: string
	title?: string
}

/** Written as whole, mutually exclusive strings per orientation and state — a
 *  base plus overrides would be settled by stylesheet order, not class order. */
const TAB: Record<Orientation, { base: string; on: string; off: string }> = {
	horizontal: {
		base: "px-2 py-snug",
		// The selected tab is an ink block standing on the list's own rule. A bare
		// underline plus a dimmed label left the active tab ambiguous at a glance,
		// so selection reads as a full inversion — the same language the
		// ContentSwitcher and the Tile header bar already use.
		on: "bg-ink text-white",
		off: "bg-gray text-ink hover:bg-ink hover:text-white",
	},
	vertical: {
		// The ring is inset: the list usually sits flush in a pane that scrolls,
		// whose edge would cut one drawn outside. Focus rests on the chosen tab,
		// which is ink, so there the ring is white.
		base:
			"flex shrink-0 items-center gap-tight px-2 py-2 text-left focus-visible:-outline-offset-2 sm:w-full",
		on: "on-ink bg-ink text-white",
		off: "bg-white text-ink hover:bg-gray",
	},
}

export function Tab(props: TabProps) {
	const ctx = useTabs("Tab")
	const index = ctx.claimTab()
	const isSelected = () => ctx.selected() === index
	const look = () => TAB[ctx.orientation()]

	return (
		<button
			ref={(el) => ctx.register(el)}
			type="button"
			role="tab"
			id={`${ctx.baseId}-tab-${index}`}
			aria-controls={`${ctx.baseId}-panel-${index}`}
			aria-selected={isSelected()}
			tabindex={isSelected() ? 0 : -1}
			disabled={props.disabled}
			aria-label={props["aria-label"]}
			title={props.title}
			onClick={() => ctx.select(index)}
			onKeyDown={(event) => {
				// The arrow pair follows the list's direction, per the WAI-ARIA tabs
				// pattern: left/right along a row, up/down along a column.
				const vertical = ctx.orientation() === "vertical"
				const keys: Record<string, number> = {
					ArrowRight: index + 1,
					ArrowLeft: index - 1,
					Home: 0,
					End: ctx.count() - 1,
				}
				// A vertical list takes the up/down pair as well: it is a column on a
				// wide screen and a row on a narrow one, and both pairs should work.
				if (vertical) {
					keys["ArrowDown"] = index + 1
					keys["ArrowUp"] = index - 1
				}
				const next = keys[event.key]
				if (next !== undefined) {
					event.preventDefault()
					ctx.focusAt(next)
				}
			}}
			// No bg-* in the base: a base background-color utility competes with the
			// selected one, and Tailwind emits .bg-transparent after .bg-ink, so the
			// transparent one won and a selected tab was white text on nothing. The
			// ternary is the only place background-color is set.
			class={`cursor-pointer border-0 text-label font-bold uppercase
        transition-colors
        disabled:cursor-not-allowed disabled:opacity-40 pointer-coarse:min-h-touch
        ${look().base} ${isSelected() ? look().on : look().off}
        ${props.class ?? ""}`}
		>
			{props.children}
		</button>
	)
}

export type IconTabProps = {
	/** Required: the tab's accessible name, and its tooltip. An icon alone never
	 *  says what it opens. */
	label: string
	renderIcon: CarbonGlyph
	disabled?: boolean
	class?: string
}

/** Carbon's IconTab: a tab that is only an icon.
 *
 *  A Tab with the glyph as its content, the label as its name, and the same
 *  label in a native `title` — which is the browser's own tooltip, shown on
 *  hover and read by assistive tech, and asks nothing of the tab's markup. A
 *  Corvu tooltip would need to *be* the tab button, as ContentSwitcher's does,
 *  and a tab already has a role and a tabindex to keep.
 */
export function IconTab(props: IconTabProps) {
	return (
		<Tab
			disabled={props.disabled}
			class={`pointer-coarse:min-w-touch ${props.class ?? ""}`}
			aria-label={props.label}
			title={props.label}
		>
			<Icon glyph={props.renderIcon} size={16} />
		</Tab>
	)
}

export type TabPanelsProps = { children?: JSX.Element }

export function TabPanels(props: TabPanelsProps) {
	const ctx = useTabs("TabPanels")
	ctx.resetPanels()

	return <>{props.children}</>
}

export type TabPanelProps = {
	class?: string
	children?: JSX.Element
}

export function TabPanel(props: TabPanelProps) {
	const ctx = useTabs("TabPanel")
	const index = ctx.claimPanel()

	return (
		<Show when={ctx.selected() === index}>
			<div
				role="tabpanel"
				id={`${ctx.baseId}-panel-${index}`}
				aria-labelledby={`${ctx.baseId}-tab-${index}`}
				tabindex={0}
				// Vertical panels carry no padding of their own: they sit in whatever
				// the caller put them in, which already has an inset.
				class={`${ctx.orientation() === "vertical" ? "" : "py-4"} ${props.class ?? ""}`}
			>
				{props.children}
			</div>
		</Show>
	)
}
