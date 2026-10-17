import { children, createContext, Show, useContext } from "solid-js"
import type { JSX } from "solid-js"
import { Dynamic } from "solid-js/web"
import type { CarbonGlyph } from "../../icons/glyph"
import { Icon } from "../../icons/Icon"
import { LABEL } from "../../internal/styles"

export type ContainedListSize = "sm" | "md" | "lg"

/** Carbon's two kinds. `on-page` is a list that is part of the page; `disclosed`
 *  is one inside something that opened — a popover, a side panel, a menu. */
export type ContainedListKind = "on-page" | "disclosed"

type ListContextValue = {
	size: () => ContainedListSize
	kind: () => ContainedListKind
	commands: () => boolean
}

const ListContext = createContext<ListContextValue>()

export type ContainedListProps = {
	/** Carbon's label: the list's heading. Optional here — a list inside a Tile
	 *  usually takes its name from the tile. */
	label?: JSX.Element
	/** One control beside the label: a search, an add button. */
	action?: JSX.Element
	size?: ContainedListSize
	kind?: ContainedListKind
	/** A column of commands rather than a list of things — foundry's Start:
	 *  New project, Open project, Settings. The rows are not ruled apart (they
	 *  are told apart by the ground the pointer lights, which runs the width of
	 *  whatever holds the list), they speak uppercase and step back until they
	 *  are pointed at, and each glyph sits centred on its line. Not Carbon's;
	 *  put it somewhere with no side padding of its own, as `disclosed` is. */
	commands?: boolean
	class?: string
	children?: JSX.Element
}

const ROW: Record<ContainedListSize, string> = {
	sm: "py-tight",
	md: "py-snug",
	lg: "py-2",
}

/** Carbon's ContainedList: a short list of rows inside something else, each row
 *  optionally pressable and optionally carrying its own trailing action.
 *
 *  It replaces every hand-built "list of rows in a tile" across the apps — mica's
 *  recent files, quarry's search results, build artifacts and section jump list —
 *  which had each re-derived the same three things: a rule between rows, a hover
 *  ground on the pressable ones, and a control at the trailing edge that must not
 *  be part of the pressable area.
 *
 *  Carbon's `isInset` is dropped: it insets the dividers, and dividers here run
 *  edge to edge.
 *
 *  `kind="disclosed"` is for a list inside a surface with no padding of its own.
 *  The label becomes a ruled band that stays at the top while the rows scroll
 *  under it, and the rows bring their own side inset — on a page, whatever
 *  holds the list supplies both.
 */
export function ContainedList(props: ContainedListProps) {
	const label = children(() => props.label)
	const action = children(() => props.action)
	const kind = (): ContainedListKind => props.kind ?? "on-page"
	const ctx: ListContextValue = {
		size: () => props.size ?? "md",
		kind,
		commands: () => props.commands ?? false,
	}

	return (
		<ListContext.Provider value={ctx}>
			<div class={props.class}>
				<Show when={label()}>
					<div
						class={`flex items-center gap-2 ${LABEL} ${
							kind() === "disclosed"
								? "sticky top-0 z-10 border-b-2 border-ink bg-white px-2 py-tight"
								: "mb-tight"
						}`}
					>
						<span class="min-w-0 flex-1 truncate">{label()}</span>
						<Show when={action()}>
							<span class="shrink-0">{action()}</span>
						</Show>
					</div>
				</Show>
				<ul class="m-0 list-none p-0">{props.children}</ul>
			</div>
		</ListContext.Provider>
	)
}

export type ContainedListItemProps = {
	/** Leads the row. */
	renderIcon?: CarbonGlyph
	/** Accessible name for the icon, when it carries meaning the text does not —
	 *  a severity glyph, say. Decorative icons leave it off. */
	iconLabel?: string
	/** Trailing control. Sits outside the pressable area, so pressing it never
	 *  also presses the row. */
	action?: JSX.Element
	/** Makes the row a link. */
	href?: string
	/** Makes the row a button. */
	onClick?: () => void
	disabled?: boolean
	class?: string
	children?: JSX.Element
}

export function ContainedListItem(props: ContainedListItemProps) {
	const ctx = useContext(ListContext)
	if (!ctx) throw new Error("ContainedListItem must be used inside a ContainedList")
	const action = children(() => props.action)
	const pressable = () => props.href !== undefined || props.onClick !== undefined
	// The inset is on the pressable part itself, so a hover ground reaches the
	// surface's edge instead of stopping short of it.
	const inset = () => (ctx.kind() === "disclosed" || ctx.commands() ? "px-2" : "px-0")
	// A command steps back until the pointer or focus is on it.
	const voice = () =>
		ctx.commands() ? "opacity-muted group-hover:opacity-100 group-focus-visible:opacity-100" : ""

	const content = () => (
		<>
			<Show when={props.renderIcon}>
				{(glyph) => (
					// Against the first line, for a row of several lines — a check and
					// its detail. A command is one line, and its glyph is centred on it.
					<span class={`flex shrink-0 ${ctx.commands() ? "" : "self-start"} ${voice()}`}>
						<Icon glyph={glyph()} size={16} label={props.iconLabel} />
					</span>
				)}
			</Show>
			{/* Uppercase here, not on the row: a button resets `text-transform`. */}
			<span class={`min-w-0 flex-1 ${ctx.commands() ? `uppercase ${voice()}` : ""}`}>
				{props.children}
			</span>
		</>
	)

	return (
		<li
			class={`flex items-center gap-2 ${
				ctx.commands() ? "text-small" : "border-b-2 border-ink text-body last:border-b-0"
			} ${props.disabled ? "opacity-40" : ""} ${props.class ?? ""}`}
		>
			<Show
				when={pressable()}
				fallback={
					<span class={`flex min-w-0 flex-1 items-center gap-2 ${inset()} ${ROW[ctx.size()]}`}>
						{content()}
					</span>
				}
			>
				<Dynamic
					component={props.href !== undefined ? "a" : "button"}
					href={props.href}
					type={props.href !== undefined ? undefined : "button"}
					disabled={props.href !== undefined ? undefined : props.disabled}
					onClick={() => props.onClick?.()}
					class={`group flex min-w-0 flex-1 cursor-pointer items-center gap-2 border-0 bg-transparent
						${inset()} text-left text-ink no-underline
						transition-colors hover:bg-gray
						focus-visible:-outline-offset-2
						disabled:cursor-not-allowed pointer-coarse:min-h-touch ${ROW[ctx.size()]}`}
				>
					{content()}
				</Dynamic>
			</Show>
			<Show when={action()}>
				<span class={`shrink-0 ${ctx.kind() === "disclosed" ? "pr-2" : ""}`}>{action()}</span>
			</Show>
		</li>
	)
}
