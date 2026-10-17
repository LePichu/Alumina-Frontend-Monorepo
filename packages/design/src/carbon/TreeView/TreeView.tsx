import { createContext, createSignal, createUniqueId, Show, useContext } from "solid-js"
import type { JSX } from "solid-js"
import CaretDown from "@carbon/icons/es/caret--down/16"
import type { CarbonGlyph } from "../../icons/glyph"
import { Icon } from "../../icons/Icon"
import { createControllable, createId } from "../../internal/control"
import { createRoving } from "../../internal/roving"
import { LABEL } from "../../internal/styles"

export type TreeSize = "xs" | "sm"

type TreeContextValue = {
	size: () => TreeSize
	multiselect: () => boolean
	selected: () => string[]
	/** The node the arrow keys are on: the tree's one tab stop. */
	current: () => string | undefined
	setCurrent: (id: string) => void
	/** Called by each node as it is created, so the first one can be the tab
	 *  stop before anything has been focused. */
	announce: (id: string) => void
	select: (id: string, additive: boolean) => void
}

const TreeContext = createContext<TreeContextValue>()

/** How deep a node sits. The root's children are at 0. */
const DepthContext = createContext(0)

export type TreeViewProps = {
	/** Names the tree. Shown above it unless `hideLabel`. */
	label: string
	hideLabel?: boolean
	/** The ids of the selected nodes. Controlled when given. */
	selected?: string[]
	defaultSelected?: string[]
	/** More than one node may be selected: with Ctrl/Cmd held, or by toggling
	 *  with Space. */
	multiselect?: boolean
	size?: TreeSize
	class?: string
	/** TreeNodes. */
	children?: JSX.Element
	onSelect?: (selected: string[]) => void
}

/** Carbon's TreeView: a hierarchy you walk with the arrow keys.
 *
 *  The WAI-ARIA tree pattern, hand-rolled, as it is in Carbon. One node is the
 *  tab stop; Up and Down move through whatever is showing; Right opens a branch
 *  or steps into it; Left closes it or steps out to its parent; Home and End
 *  jump; a letter goes to the next node that starts with it; Enter or Space
 *  selects.
 *
 *  A collapsed branch's children are not rendered, so "the nodes that are
 *  showing" is simply every row in the DOM — no walking the data to decide what
 *  an arrow key lands on.
 *
 *  Selection inverts the row to ink, edge to edge. Indent is inside the row,
 *  not around it, for the same reason: the ground has to reach both edges.
 */
export function TreeView(props: TreeViewProps) {
	const id = createUniqueId()
	const [selected, setSelected] = createControllable<string[]>(
		() => props.selected,
		props.defaultSelected ?? [],
		() => props.onSelect,
	)
	const [current, setCurrent] = createSignal<string>()
	const [first, setFirst] = createSignal<string>()
	const [tree, setTree] = createSignal<HTMLElement>()
	const ctx: TreeContextValue = {
		size: () => props.size ?? "sm",
		multiselect: () => props.multiselect ?? false,
		selected,
		current: () => current() ?? selected()[0] ?? first(),
		setCurrent,
		announce: (node) => {
			if (first() === undefined) setFirst(node)
		},
		select: (node, additive) => {
			const now = selected()
			const next = props.multiselect && additive
				? (now.includes(node) ? now.filter((other) => other !== node) : [...now, node])
				: [node]
			setSelected(next)
			props.onSelect?.(next)
		},
	}

	// Up, Down, Home, End and type-ahead over every row that is showing, at any
	// depth. Left, Right and the choosing keys are each node's own. Which row is
	// the tab stop follows focus: every row reports it as it is focused.
	const { onKeyDown } = createRoving(tree, "[data-tree-row]", { wrap: false })

	return (
		<TreeContext.Provider value={ctx}>
			<div class={props.class}>
				<p
					id={`${id}-label`}
					class={`m-0 mb-tight ${LABEL} ${props.hideLabel ? "sr-only" : ""}`}
				>
					{props.label}
				</p>
				<ul
					ref={setTree}
					role="tree"
					aria-labelledby={`${id}-label`}
					aria-multiselectable={props.multiselect ? "true" : undefined}
					onKeyDown={onKeyDown}
					class="m-0 list-none p-0"
				>
					{props.children}
				</ul>
			</div>
		</TreeContext.Provider>
	)
}

const ROW: Record<TreeSize, string> = {
	xs: "py-rule",
	sm: "py-tight",
}

export type TreeNodeProps = {
	/** Identifies the node in `selected`. Generated when left off, but then
	 *  nothing outside the tree can name it. */
	id?: string
	label: JSX.Element
	renderIcon?: CarbonGlyph
	/** Whether a branch shows its children. Controlled when given. */
	isExpanded?: boolean
	defaultIsExpanded?: boolean
	disabled?: boolean
	/** More TreeNodes make this one a branch. */
	children?: JSX.Element
	onSelect?: () => void
	onToggle?: (isExpanded: boolean) => void
}

export function TreeNode(props: TreeNodeProps) {
	const ctx = useContext(TreeContext)
	if (!ctx) throw new Error("TreeNode must be used inside a TreeView")

	const depth = useContext(DepthContext)
	// Read once, not kept as an accessor: the id is the node's identity in the
	// tree's selection, and that cannot change under it.
	const id = createId("tree-node", () => props.id)()
	ctx.announce(id)

	// Asked of the props object, not read: reading `children` would build the
	// subtree here whether or not the branch is open.
	const isBranch = "children" in props
	const [open, setOpen] = createControllable(
		() => props.isExpanded,
		props.defaultIsExpanded ?? false,
		() => props.onToggle,
	)
	const expanded = () => isBranch && open()
	const selected = () => ctx.selected().includes(id)

	const toggle = (next = !expanded()) => {
		if (!isBranch) return
		setOpen(next)
		props.onToggle?.(next)
	}

	let row: HTMLDivElement | undefined

	const onKeyDown = (event: KeyboardEvent) => {
		// Only the node that is focused acts: the event bubbles up through every
		// ancestor node on its way to the tree.
		if (event.target !== row) return

		if (event.key === "ArrowRight" && isBranch) {
			event.preventDefault()
			if (!expanded()) toggle(true)
			// `:scope >` matters: without it the selector's `ul` can be an *ancestor*
			// list, and the first match is then this very row.
			else row?.parentElement?.querySelector<HTMLElement>(":scope > ul [data-tree-row]")?.focus()
		} else if (event.key === "ArrowLeft") {
			event.preventDefault()
			if (expanded()) toggle(false)
			else {
				row?.parentElement?.parentElement?.closest("li")
					?.querySelector<HTMLElement>("[data-tree-row]")?.focus()
			}
		} else if (event.key === "Enter" || event.key === " ") {
			event.preventDefault()
			if (props.disabled) return
			ctx.select(id, event.key === " " || event.ctrlKey || event.metaKey)
			props.onSelect?.()
		}
	}

	return (
		<li role="none" class="m-0 list-none p-0">
			<div
				ref={row}
				data-tree-row={id}
				role="treeitem"
				aria-expanded={isBranch ? (expanded() ? "true" : "false") : undefined}
				aria-selected={selected() ? "true" : "false"}
				aria-disabled={props.disabled ? "true" : undefined}
				tabindex={ctx.current() === id ? 0 : -1}
				onFocus={() => ctx.setCurrent(id)}
				onKeyDown={onKeyDown}
				onClick={(event) => {
					if (props.disabled) return
					ctx.select(id, event.ctrlKey || event.metaKey)
					props.onSelect?.()
				}}
				// The indent is this node's depth, handed to CSS: one step in per level,
				// measured on Tailwind's own spacing unit.
				style={{ "--tree-depth": String(depth) }}
				class={`flex cursor-pointer items-center gap-tight
					pl-[calc(var(--tree-depth)*var(--spacing)*4_+_var(--spacing)*2)] pr-2 text-body
					transition-colors
					focus-visible:-outline-offset-2 pointer-coarse:min-h-touch
					${selected() ? "on-ink bg-ink font-bold text-white" : "text-ink hover:bg-gray"}
					${props.disabled ? "cursor-not-allowed opacity-40" : ""} ${ROW[ctx.size()]}`}
			>
				{
					/* The caret is its own target: pressing it opens the branch without
				    selecting it. A leaf keeps the caret's width, so labels line up. */
				}
				<Show when={isBranch} fallback={<span class="w-4 shrink-0" />}>
					<span
						aria-hidden="true"
						onClick={(event) => {
							event.stopPropagation()
							toggle()
						}}
						class="flex shrink-0 items-center justify-center"
					>
						<Icon
							glyph={CaretDown}
							size={16}
							class={`transition-transform duration-220 ${expanded() ? "" : "-rotate-90"}`}
						/>
					</span>
				</Show>
				<Show when={props.renderIcon}>{(glyph) => <Icon glyph={glyph()} size={16} />}</Show>
				<span class="min-w-0 flex-1 truncate">{props.label}</span>
			</div>
			<Show when={expanded()}>
				<ul role="group" class="m-0 list-none p-0">
					<DepthContext.Provider value={depth + 1}>{props.children}</DepthContext.Provider>
				</ul>
			</Show>
		</li>
	)
}
