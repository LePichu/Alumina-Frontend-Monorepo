import { children, createContext, createUniqueId, Show, useContext } from "solid-js"
import type { JSX } from "solid-js"
import Checkmark from "@carbon/icons/es/checkmark/16"
import ChevronDown from "@carbon/icons/es/chevron--down/16"
import type { CarbonGlyph } from "../../icons/glyph"
import { Icon } from "../../icons/Icon"
import { createControllable, createId } from "../../internal/control"
import { BOX, LABEL, PRESS } from "../../internal/styles"

export type TileProps = {
	heading?: JSX.Element
	/** Renders the heading as an ink bar (ink ground, white text) rather than an
	 *  inline label. */
	bar?: boolean
	/** How loudly the heading speaks.
	 *
	 *  `label` is the default — small, bold, uppercase — for a box whose heading
	 *  names what is inside it. `title` is a section of the page that happens to
	 *  be boxed: figure size, sentence case, tight tracking. quarry's board panels
	 *  ("Files", "What it costs to make") and its publish steps are titles; kiln's
	 *  reply sections and mica's tool tiles are labels. Ignored under `bar`, whose
	 *  voice is the ink ground itself. */
	headingSize?: "label" | "title"
	/** An ink rule under the heading. For a tile whose body is itself divided into
	 *  ruled sections — without it the first section's own rule is read as the
	 *  heading's and the header band loses its bottom edge. */
	ruled?: boolean
	/** An empty slot rather than a filled one: dashed border, no shadow.
	 *
	 *  For a tile that is an invitation — quarry's "publish a board" cell at the end
	 *  of its grid of boards. Solid and shadowed, it reads as one more board that
	 *  happens to be blank; dashed and flat, it reads as the space where the next
	 *  one goes. */
	placeholder?: boolean
	/** Muted, right-aligned trailing text in the heading — the prototype's `.n`. */
	meta?: JSX.Element
	/** One control in the heading, trailing the meta. On an ink bar it must be a
	 *  single borderless icon — never two: a close and a collapse together is the
	 *  thing this API exists to prevent. */
	action?: JSX.Element
	/** Drops the body's padding so children own their own insets. Use it when the
	 *  content is a stack of ruled sections: dividers run edge to edge, which a
	 *  padded body makes impossible. */
	flush?: boolean
	/** Makes the body a flex column that fills the tile. Required for a tile that
	 *  stretches in a lane and scrolls inside: without it the body is a plain block
	 *  with auto height, so a `flex-1` child has nothing to fill and the content
	 *  grows past the tile instead of scrolling within it. */
	fill?: boolean
	/** Drops the hard shadow. For a tile that sits inside another tile, which
	 *  already carries the one shadow — kiln's account card in its settings dialog. */
	flat?: boolean
	/** Ink ground, white text: the whole tile inverted, not just its header bar.
	 *  For the one thing on a screen that is yours rather than the system's —
	 *  what you said to kiln, set against the agent's white replies. */
	inverse?: boolean
	class?: string
	children?: JSX.Element
}

/** The box every tile variant shares. Written as whole strings per state so no
 *  two utilities of one family ever compete in the same class list. */
function surface(props: { placeholder?: boolean; flat?: boolean; inverse?: boolean }): string {
	if (props.placeholder) return "border-2 border-dashed border-ink bg-white"
	return `border-2 border-ink ${props.inverse ? "on-ink bg-ink text-white" : "bg-white"} ${
		props.flat ? "" : "shadow-hard"
	}`
}

export function Tile(props: TileProps) {
	// Each slot is resolved once through `children`. Testing a JSX prop with
	// `<Show when={props.x}>` and then placing `{props.x}` inside reads the prop
	// getter twice, and a JSX getter builds a *new* element per read — so the node
	// that was tested is not the node that gets inserted. Under SSR that desyncs
	// hydration and Solid dies with "template is not a function".
	const heading = children(() => props.heading)
	const meta = children(() => props.meta)
	const action = children(() => props.action)

	// Written as two whole, mutually exclusive strings. text-micro and text-figure
	// are the same utility family, so a base plus an override would be settled by
	// their order in the generated stylesheet rather than in the class string.
	// `ruled` adds the bottom padding as well. Without a rule the body's own top
	// padding supplies the gap under the heading; with one, the label would
	// otherwise sit directly on the rule.
	const voice = () =>
		props.headingSize === "title"
			? "py-snug text-figure font-bold tracking-tight"
			: `pt-snug ${LABEL} ${props.ruled ? "pb-snug" : ""}`

	return (
		<div class={`${surface(props)} ${props.class ?? ""}`}>
			<Show when={heading()}>
				<Show
					when={props.bar}
					fallback={
						<h2
							class={`m-0 flex items-center gap-snug px-2 ${voice()}
								${props.ruled ? "border-b-2 border-ink" : ""}`}
						>
							{heading()}
							<Show when={meta()}>
								<span class="ml-auto text-micro font-normal normal-case tracking-micro opacity-muted">
									{meta()}
								</span>
							</Show>
							<Show when={action()}>
								<span class={meta() ? "" : "ml-auto"}>{action()}</span>
							</Show>
						</h2>
					}
				>
					<h2
						class={`on-ink m-0 flex items-center gap-snug bg-ink px-2 py-snug ${LABEL} text-white`}
					>
						{heading()}
						<Show when={meta()}>
							<span class="ml-auto text-micro font-normal normal-case opacity-muted">{meta()}</span>
						</Show>
						<Show when={action()}>
							<span class={meta() ? "" : "ml-auto"}>{action()}</span>
						</Show>
					</h2>
				</Show>
			</Show>
			<div
				class={`${props.flush ? "" : "px-2 pb-2 pt-snug"} ${
					props.fill ? "flex min-h-0 flex-1 flex-col" : ""
				}`}
			>
				{props.children}
			</div>
		</div>
	)
}

export type TileSectionSize = "sm" | "md" | "lg"

export type TileSectionProps = {
	heading?: JSX.Element
	/** Leads the heading, as mica's and kiln's section labels do. */
	renderIcon?: CarbonGlyph
	/** Muted, right-aligned trailing text in the heading. */
	meta?: JSX.Element
	/** One control trailing the heading — a view switcher, a re-run button. */
	action?: JSX.Element
	/** How much air the band holds: `sm` for a rail or a reply (8px), `md` for a
	 *  panel (16px), `lg` for a page-width form (24px). */
	size?: TileSectionSize
	/** Puts the heading on its own ruled band instead of inline above the content.
	 *  For a section whose content is a table or a figure that runs edge to edge —
	 *  an inline label would have nothing to sit against. */
	ruled?: boolean
	/** Drops the content's padding so it owns its own insets. */
	flush?: boolean
	/** Takes whatever height the other sections leave. The section becomes a flex
	 *  column, so a ScrollArea inside it scrolls instead of growing the tile. */
	grow?: boolean
	class?: string
	children?: JSX.Element
}

const SECTION_PAD: Record<TileSectionSize, string> = {
	sm: "p-2",
	md: "p-4",
	lg: "p-6",
}

const SECTION_PAD_X: Record<TileSectionSize, string> = {
	sm: "px-2",
	md: "px-4",
	lg: "px-6",
}

/** One ruled band of a `flush` Tile.
 *
 *  Every app had drawn this by hand — kiln's rail sections and reply sections,
 *  quarry's publish panels and search facets — each with its own padding and its
 *  own copy of the small uppercase heading. It is one thing: a full-width band,
 *  divided from the next by an ink rule that runs edge to edge, optionally
 *  labelled in the Tile's own voice.
 *
 *  The last section carries no rule, so the tile's own border closes it.
 */
export function TileSection(props: TileSectionProps) {
	const heading = children(() => props.heading)
	const meta = children(() => props.meta)
	const action = children(() => props.action)
	const size = (): TileSectionSize => props.size ?? "sm"

	const label = () => (
		<>
			<Show when={props.renderIcon}>{(glyph) => <Icon glyph={glyph()} size={16} />}</Show>
			<span class="min-w-0 truncate">{heading()}</span>
			<Show when={meta()}>
				<span class="ml-auto shrink-0 font-normal normal-case tracking-normal opacity-muted">
					{meta()}
				</span>
			</Show>
			<Show when={action()}>
				<span class={`shrink-0 ${meta() ? "" : "ml-auto"}`}>{action()}</span>
			</Show>
		</>
	)

	return (
		<section
			class={`border-b-2 border-ink last:border-b-0 ${
				props.grow ? "flex min-h-0 flex-1 flex-col" : ""
			} ${props.class ?? ""}`}
		>
			<Show when={heading() && props.ruled}>
				<h3
					class={`m-0 flex items-center gap-tight border-b-2 border-ink py-tight text-micro
						font-bold uppercase ${SECTION_PAD_X[size()]}`}
				>
					{label()}
				</h3>
			</Show>
			<div
				class={`${props.flush ? "" : SECTION_PAD[size()]} ${
					props.grow ? "flex min-h-0 flex-1 flex-col" : ""
				}`}
			>
				<Show when={heading() && !props.ruled}>
					<h3
						class={`m-0 mb-tight flex items-center gap-tight ${LABEL} ${
							props.flush ? `${SECTION_PAD_X[size()]} pt-2` : ""
						}`}
					>
						{label()}
					</h3>
				</Show>
				{props.children}
			</div>
		</section>
	)
}

export type ClickableTileProps = {
	/** Where the tile goes. Without one the tile is a button, for a press that
	 *  does something in the page rather than going somewhere — foundry's recent
	 *  boards open in a tab, and have no address to go to. */
	href?: string
	/** Dashed and flat — see Tile's `placeholder`. */
	placeholder?: boolean
	/** Drops the hard shadow, for a tile inside another tile — foundry's recent
	 *  boards, in the tile that holds them. With no shadow to land in, it greys
	 *  under the pointer instead, as a placeholder does. */
	flat?: boolean
	/** Fired on activation, in addition to following the link. */
	onClick?: () => void
	class?: string
	children?: JSX.Element
}

/** Carbon's ClickableTile: the whole tile is one link.
 *
 *  The link is the tile itself, not an anchor laid over or inside a Tile — a
 *  nested anchor leaves the tile's own padding dead to the pointer, and that
 *  strip is exactly where people aim.
 *
 *  It presses like a Button: the face lands where the shadow was. Children get
 *  the `group` hook, so a title inside can underline on hover; the tile itself
 *  does not change ground, because a board listing the size of a hand going grey
 *  under the pointer is a lot of grey.
 */
export function ClickableTile(props: ClickableTileProps) {
	const look = () =>
		`group block cursor-pointer text-ink no-underline ${surface(props)}
		${props.placeholder || props.flat ? "hover:bg-gray" : PRESS}
		${props.class ?? ""}`

	return (
		<Show
			when={props.href !== undefined}
			fallback={
				<button
					type="button"
					onClick={() => props.onClick?.()}
					// The width a block link has of itself: a button, block or not, shrinks
					// to its content, and a row of tiles came out as wide as their names.
					class={`${look()} w-full text-left`}
				>
					{props.children}
				</button>
			}
		>
			<a href={props.href} onClick={() => props.onClick?.()} class={look()}>
				{props.children}
			</a>
		</Show>
	)
}

type TileGroupContextValue = {
	name: () => string
	value: () => string | undefined
	disabled: () => boolean
	select: (value: string) => void
}

const TileGroupContext = createContext<TileGroupContextValue>()

export type TileGroupProps = {
	/** Carbon's legend. Names the group; hidden visually with `hideLegend`. */
	legend: JSX.Element
	hideLegend?: boolean
	name?: string
	valueSelected?: string
	defaultSelected?: string
	disabled?: boolean
	/** Lays the tiles out. A grid or a flex row — the group has no opinion. */
	class?: string
	children?: JSX.Element
	onChange?: (value: string) => void
}

/** Carbon's TileGroup: a radio group whose options are tiles.
 *
 *  Real radio inputs underneath, so arrow keys move the selection and assistive
 *  tech announces "2 of 6" without a line of ARIA here. mica picks one of its six
 *  tool bays with this; it had been a hand-built tablist of buttons.
 */
export function TileGroup(props: TileGroupProps) {
	const name = createId("tile-group", () => props.name)
	const legend = children(() => props.legend)
	const [selected, setSelected] = createControllable(
		() => props.valueSelected,
		props.defaultSelected,
		() => props.onChange,
	)

	const ctx: TileGroupContextValue = {
		name,
		value: selected,
		disabled: () => props.disabled ?? false,
		select: (value) => {
			setSelected(value)
			props.onChange?.(value)
		},
	}

	return (
		<TileGroupContext.Provider value={ctx}>
			<fieldset class="m-0 min-w-0 border-0 p-0">
				<legend
					class={`mb-tight p-0 ${LABEL} ${props.hideLegend ? "sr-only" : ""}`}
				>
					{legend()}
				</legend>
				<div class={props.class}>{props.children}</div>
			</fieldset>
		</TileGroupContext.Provider>
	)
}

export type RadioTileProps = {
	id?: string
	value: string
	disabled?: boolean
	class?: string
	children?: JSX.Element
}

/** One option of a TileGroup. Selection is a full inversion — ink ground, white
 *  text — the same way a ContentSwitcher or a Tab says "this one". No shadow:
 *  radio tiles pack into a grid inside something that already carries it. */
export function RadioTile(props: RadioTileProps) {
	const ctx = useContext(TileGroupContext)
	if (!ctx) throw new Error("RadioTile must be used inside a TileGroup")

	const id = createId("radio-tile", () => props.id)
	const selected = () => ctx.value() === props.value
	const disabled = () => props.disabled || ctx.disabled()

	return (
		<label
			for={id()}
			class={`flex cursor-pointer items-center gap-snug border-2 border-ink px-snug py-tight
				transition-colors
				pointer-coarse:min-h-touch
				has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2
				has-[:focus-visible]:outline-ink
				${selected() ? "bg-ink text-white" : "bg-white text-ink hover:bg-gray"}
				${disabled() ? "cursor-not-allowed opacity-40" : ""} ${props.class ?? ""}`}
		>
			<input
				id={id()}
				type="radio"
				class="sr-only"
				name={ctx.name()}
				value={props.value}
				checked={selected()}
				disabled={disabled()}
				onChange={() => ctx.select(props.value)}
			/>
			{props.children}
		</label>
	)
}

export type SelectableTileProps = {
	id?: string
	/** Controlled when given. */
	selected?: boolean
	defaultSelected?: boolean
	name?: string
	value?: string
	disabled?: boolean
	class?: string
	children?: JSX.Element
	onChange?: (selected: boolean) => void
}

/** Carbon's SelectableTile: a tile that is a checkbox. Any number of them may
 *  be on — where exactly one must be, that is a TileGroup of RadioTiles.
 *
 *  On, it inverts, as a RadioTile does, and a tick sits in its corner: with
 *  several on at once the tick is what tells a chosen tile from one that simply
 *  has an ink ground. A real checkbox underneath, so Space toggles it and
 *  assistive tech says "checked".
 */
export function SelectableTile(props: SelectableTileProps) {
	const id = createId("selectable-tile", () => props.id)
	const [selected, setSelected] = createControllable(
		() => props.selected,
		props.defaultSelected ?? false,
		() => props.onChange,
	)

	return (
		<label
			for={id()}
			class={`relative flex cursor-pointer items-start gap-snug border-2 border-ink p-2
				transition-colors
				pointer-coarse:min-h-touch
				has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2
				has-[:focus-visible]:outline-ink
				${selected() ? "bg-ink text-white" : "bg-white text-ink hover:bg-gray"}
				${props.disabled ? "cursor-not-allowed opacity-40" : ""} ${props.class ?? ""}`}
		>
			<input
				id={id()}
				type="checkbox"
				class="sr-only"
				name={props.name}
				value={props.value}
				checked={selected()}
				disabled={props.disabled}
				onChange={(event) => {
					setSelected(event.currentTarget.checked)
					props.onChange?.(event.currentTarget.checked)
				}}
			/>
			<span class="min-w-0 flex-1">{props.children}</span>
			{/* Holds its place when off, so turning it on does not reflow the tile. */}
			<span aria-hidden="true" class={`shrink-0 ${selected() ? "" : "invisible"}`}>
				<Icon glyph={Checkmark} size={16} />
			</span>
		</label>
	)
}

export type ExpandableTileProps = {
	/** Controlled when given. */
	expanded?: boolean
	defaultExpanded?: boolean
	/** What the chevron's button is called when shut, and when open. */
	tileCollapsedIconText?: string
	tileExpandedIconText?: string
	class?: string
	/** A TileAboveTheFoldContent and a TileBelowTheFoldContent. */
	children?: JSX.Element
	onClick?: (expanded: boolean) => void
}

const FoldContext = createContext<() => boolean>()

/** Carbon's ExpandableTile: a tile with more underneath.
 *
 *  Carbon makes the whole tile the button. Here the chevron is, and only the
 *  chevron: a tile's content is often selectable text or holds a link, and a
 *  box that folds shut when you try to copy from it is worse than a smaller
 *  target. It is still a full 44px on touch.
 */
export function ExpandableTile(props: ExpandableTileProps) {
	const id = createUniqueId()
	const [expanded, setExpanded] = createControllable(
		() => props.expanded,
		props.defaultExpanded ?? false,
		() => props.onClick,
	)

	return (
		<FoldContext.Provider value={expanded}>
			<div class={`relative ${BOX} shadow-hard ${props.class ?? ""}`}>
				<div id={`${id}-content`} class="px-2 pb-8 pt-2">{props.children}</div>
				<button
					type="button"
					aria-expanded={expanded() ? "true" : "false"}
					aria-controls={`${id}-content`}
					aria-label={expanded()
						? (props.tileExpandedIconText ?? "Show less")
						: (props.tileCollapsedIconText ?? "Show more")}
					onClick={() => {
						const next = !expanded()
						setExpanded(next)
						props.onClick?.(next)
					}}
					class="absolute bottom-0 right-0 flex size-8 cursor-pointer items-center justify-center border-0
						bg-transparent text-ink hover:bg-gray focus-visible:-outline-offset-2
						pointer-coarse:size-touch"
				>
					<Icon
						glyph={ChevronDown}
						size={16}
						class={`transition-transform duration-220 ${expanded() ? "rotate-180" : ""}`}
					/>
				</button>
			</div>
		</FoldContext.Provider>
	)
}

/** Always showing. */
export function TileAboveTheFoldContent(props: { class?: string; children?: JSX.Element }) {
	return <div class={props.class}>{props.children}</div>
}

/** Showing only while the tile is expanded, ruled off from what is above. */
export function TileBelowTheFoldContent(props: { class?: string; children?: JSX.Element }) {
	const expanded = useContext(FoldContext)
	if (!expanded) throw new Error("TileBelowTheFoldContent must be used inside an ExpandableTile")

	return (
		<Show when={expanded()}>
			<div class={`-mx-2 mt-2 border-t-2 border-ink px-2 pt-2 ${props.class ?? ""}`}>
				{props.children}
			</div>
		</Show>
	)
}
