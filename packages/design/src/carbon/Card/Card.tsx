import { children, createContext, Show, useContext } from "solid-js"
import type { JSX } from "solid-js"
import { Dynamic } from "solid-js/web"
import ArrowRight from "@carbon/icons/es/arrow--right/16"
import type { CarbonGlyph } from "../../icons/glyph"
import { Icon } from "../../icons/Icon"
import { BOX, PRESS } from "../../internal/styles"
import { AspectRatio } from "../AspectRatio/AspectRatio"
import type { Ratio } from "../AspectRatio/AspectRatio"

type CardContextValue = {
	clickable: () => boolean
	disabled: () => boolean
	horizontal: () => boolean
	density: () => "productive" | "expressive"
	decorator: () => JSX.Element
}

const CardContext = createContext<CardContextValue>()

function useCard(component: string): CardContextValue {
	const ctx = useContext(CardContext)
	if (!ctx) throw new Error(`${component} must be used inside a Card`)
	return ctx
}

export type CardProps = {
	/** The element to render. `a` with `href` and `clickable` makes a navigation
	 *  card. */
	as?: "div" | "article" | "section" | "li" | "a" | "button"
	href?: string
	/** The whole card is one target. It gains a pressed state and a footer with
	 *  an arrow, and anything interactive inside it should be taken out. */
	clickable?: boolean
	disabled?: boolean
	/** `productive` sets the title at body size; `expressive` a step up, for a
	 *  page with room to spare. */
	density?: "productive" | "expressive"
	/** Shown at the top-right of the header: typically an `AILabel`. */
	decorator?: JSX.Element
	/** Media on the left, everything else stacked to its right. */
	horizontal?: boolean
	/** The glyph in a clickable card's built-in footer. An arrow by default. */
	renderFooterIcon?: CarbonGlyph
	class?: string
	children?: JSX.Element
	onClick?: (event: MouseEvent) => void
}

/** Carbon's Card (preview, as of @carbon/react 1.118): a box with a head, a
 *  body and a foot.
 *
 *  It is a Tile with the parts named. A Tile is a surface and what goes in it is
 *  the caller's; a Card says where the title, the media, the text and the
 *  actions go, so a grid of them lines up without each one being laid out by
 *  hand. Same box, same one hard shadow.
 *
 *  A clickable card presses like a Button — the face lands where the shadow
 *  was — rather than changing ground, for the reason ClickableTile gives: a
 *  surface the size of a hand going grey under the pointer is a lot of grey.
 */
export function Card(props: CardProps) {
	const decorator = children(() => props.decorator)

	const ctx: CardContextValue = {
		clickable: () => props.clickable ?? false,
		disabled: () => props.disabled ?? false,
		horizontal: () => props.horizontal ?? false,
		density: () => props.density ?? "productive",
		decorator,
	}

	const element = () => props.as ?? (props.clickable ? (props.href ? "a" : "button") : "div")

	return (
		<CardContext.Provider value={ctx}>
			<Dynamic
				component={element()}
				href={element() === "a" && !props.disabled ? props.href : undefined}
				type={element() === "button" ? "button" : undefined}
				disabled={element() === "button" ? props.disabled : undefined}
				aria-disabled={props.disabled ? "true" : undefined}
				onClick={(event: MouseEvent) => {
					if (props.clickable && !props.disabled) props.onClick?.(event)
				}}
				class={`relative flex min-w-0 ${BOX} text-left text-ink no-underline
					shadow-hard ${props.horizontal ? "flex-row" : "flex-col"}
					${props.clickable && !props.disabled ? `cursor-pointer ${PRESS}` : ""}
					${props.disabled ? "pointer-events-none opacity-40" : ""} ${props.class ?? ""}`}
			>
				{props.children}
				<Show when={props.clickable}>
					<span class="mt-auto flex justify-end px-2 pb-2 pt-tight">
						<Icon glyph={props.renderFooterIcon ?? ArrowRight} size={16} />
					</span>
				</Show>
			</Dynamic>
		</CardContext.Provider>
	)
}

/** The head: the title and what goes with it, and the card's decorator in the
 *  corner. */
export function CardHeader(props: { class?: string; children?: JSX.Element }) {
	const ctx = useCard("CardHeader")

	return (
		<div class={`flex items-start gap-2 px-2 pt-2 ${props.class ?? ""}`}>
			<div class="min-w-0 flex-1">{props.children}</div>
			<Show when={ctx.decorator()}>
				<span class="shrink-0">{ctx.decorator()}</span>
			</Show>
		</div>
	)
}

/** Media set in the head, above the title: a pictogram, a logo. */
export function CardHeaderMedia(props: { class?: string; children?: JSX.Element }) {
	return <div class={`mb-2 ${props.class ?? ""}`}>{props.children}</div>
}

/** A slot to the left of the title for an icon or a small image. It stays at
 *  the top when the title wraps. */
export function CardTitleMedia(props: { class?: string; children?: JSX.Element }) {
	return (
		<div class={`flex size-12 shrink-0 items-center justify-center ${props.class ?? ""}`}>
			{props.children}
		</div>
	)
}

/** Line counts are structure, not size, so the odd ones are allowed. */
const CLAMP: Record<number, string> = {
	1: "truncate",
	2: "line-clamp-2",
	3: "line-clamp-3",
	4: "line-clamp-4",
}

const clamp = (value: boolean | number | undefined) =>
	value === true ? "truncate" : typeof value === "number" ? (CLAMP[value] ?? "") : ""

export type CardTitleProps = {
	/** A small line above the title. */
	label?: JSX.Element
	/** A line below it. */
	description?: JSX.Element
	/** Before the title text: an icon. */
	titleStart?: JSX.Element
	/** After it. */
	titleEnd?: JSX.Element
	/** `true` cuts to one line with an ellipsis; a number clamps to that many. */
	titleTruncate?: boolean | number
	labelTruncate?: boolean | number
	descriptionTruncate?: boolean | number
	/** Any CSS width: the most the title's row may take while truncating. */
	maxWidth?: string
	class?: string
	children?: JSX.Element
}

export function CardTitle(props: CardTitleProps) {
	const ctx = useCard("CardTitle")
	const label = children(() => props.label)
	const description = children(() => props.description)
	const start = children(() => props.titleStart)
	const end = children(() => props.titleEnd)

	return (
		<div class={`min-w-0 ${props.class ?? ""}`}>
			<Show when={label()}>
				<p class={`m-0 mb-tight text-micro uppercase opacity-muted ${clamp(props.labelTruncate)}`}>
					{label()}
				</p>
			</Show>
			<div
				style={{ "--card-title-w": props.maxWidth ?? "100%" }}
				class="flex max-w-[var(--card-title-w)] items-center gap-snug"
			>
				<Show when={start()}>
					<span class="shrink-0">{start()}</span>
				</Show>
				<h3
					class={`m-0 min-w-0 font-bold ${
						ctx.density() === "expressive" ? "text-figure tracking-tight" : "text-body"
					} ${clamp(props.titleTruncate)}`}
				>
					{props.children}
				</h3>
				<Show when={end()}>
					<span class="shrink-0">{end()}</span>
				</Show>
			</div>
			<Show when={description()}>
				<p class={`m-0 mt-tight text-small opacity-muted ${clamp(props.descriptionTruncate)}`}>
					{description()}
				</p>
			</Show>
		</div>
	)
}

export type CardMediaProps = {
	ratio?: Ratio
	/** In a horizontal card, how wide the media column is. Any CSS width; a
	 *  third of the card unless told otherwise. No effect in a vertical card. */
	mediaWidth?: string
	class?: string
	children?: JSX.Element
}

/** The picture: a figure, a render, a chart. It runs to the card's edges, ruled
 *  off from the text by one ink line on whichever side the text is. */
export function CardMedia(props: CardMediaProps) {
	const ctx = useCard("CardMedia")

	return (
		<div
			style={{ "--card-media-w": props.mediaWidth ?? "33.33%" }}
			class={`shrink-0 border-ink ${
				ctx.horizontal() ? "w-[var(--card-media-w)] border-r-2" : "border-b-2"
			} ${props.class ?? ""}`}
		>
			<AspectRatio ratio={props.ratio ?? "16x9"} class="overflow-hidden">
				{props.children}
			</AspectRatio>
		</div>
	)
}

export type CardBodyProps = {
	/** No padding: for a body that is a table, a chart or an image and brings its
	 *  own insets. */
	isFlush?: boolean
	class?: string
	children?: JSX.Element
}

export function CardBody(props: CardBodyProps) {
	return (
		<div class={`min-w-0 flex-1 text-body ${props.isFlush ? "" : "p-2"} ${props.class ?? ""}`}>
			{props.children}
		</div>
	)
}

/** The foot: a link, a line of meta. For buttons, put a `CardActions` in the
 *  card instead — it is ruled off and runs edge to edge. */
export function CardFooter(props: { class?: string; children?: JSX.Element }) {
	return <div class={`mt-auto px-2 pb-2 ${props.class ?? ""}`}>{props.children}</div>
}

export type CardActionsProps = {
	class?: string
	/** CardActions. */
	children?: JSX.Element
}

/** The card's actions as a ruled strip across its foot, one cell each.
 *
 *  Carbon folds the actions that do not fit into an overflow menu. That needs
 *  the strip to measure itself and each action to be describable as a menu
 *  item, and is not built: here the cells share the width, and a card is
 *  expected to carry two or three actions, which fit.
 */
export function CardActions(props: CardActionsProps) {
	return (
		<div class={`mt-auto flex items-stretch border-t-2 border-ink ${props.class ?? ""}`}>
			{props.children}
		</div>
	)
}

export type CardActionProps = {
	/** Names the action where its content does not — an icon button. */
	label?: string
	class?: string
	/** A Button or an IconButton. Give it `flat`, and `class="w-full"` to fill
	 *  the cell: the card already carries the one shadow. */
	children?: JSX.Element
}

/** One cell of a CardActions strip, ruled off from the next. */
export function CardAction(props: CardActionProps) {
	return (
		<div
			aria-label={props.label}
			class={`flex min-w-0 flex-1 items-stretch border-l-2 border-ink first:border-l-0 ${
				props.class ?? ""
			}`}
		>
			{props.children}
		</div>
	)
}
