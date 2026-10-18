import { Show, splitProps } from "solid-js"
import type { JSX } from "solid-js"
import { Dynamic } from "solid-js/web"
import type { CarbonGlyph } from "../../icons/glyph"
import { Icon } from "../../icons/Icon"
import { PRESS } from "../../internal/styles"

/** Carbon's full kind vocabulary. The three danger variants are red in Carbon;
 *  here they carry the hatch fill instead, since severity never reads as hue. */
export type ButtonKind =
	| "primary"
	| "secondary"
	| "tertiary"
	| "ghost"
	/** Ghost on an ink ground. The one control CLAUDE.md allows on a Tile's ink
	 *  bar is "one borderless white icon", and plain `ghost` is ink on ink there —
	 *  invisible. A kind rather than a modifier prop, so it cannot be combined
	 *  with another kind into something undefined. */
	| "ghost--inverse"
	| "danger"
	| "danger--tertiary"
	| "danger--ghost"

/** Carbon's sm/md/lg. Its xl and 2xl are expressive sizes the prototypes never
 *  use, so they are not built yet. */
export type ButtonSize = "sm" | "md" | "lg"

export type ButtonProps = {
	kind?: ButtonKind
	size?: ButtonSize
	/** Carbon's renderIcon. Shown before the label here — see the render below. */
	renderIcon?: CarbonGlyph
	/** Drops the hard shadow. For buttons packed into a grid inside a tile, where
	 *  the tile already carries the one shadow and per-button shadows read as
	 *  clutter — the prototypes' `.pad`, `.ops` and `.util` clusters. */
	flat?: boolean
	/** The label is content, not a command.
	 *
	 *  A command button shouts: uppercase, bold, tracked out. That is right for
	 *  VALIDATE and wrong for a button whose text is the thing being chosen — a
	 *  stored thread's title, a suggested prompt, a value in a picker. Those read
	 *  as the sentence they are, at body size. kiln's `.rec`, `.chip` and
	 *  `.opts button` are all this. */
	content?: boolean
	/** Renders an anchor instead of a button. */
	href?: string
	type?: "button" | "submit" | "reset"
	disabled?: boolean
	class?: string
	children?: JSX.Element
	onClick?: JSX.EventHandlerUnion<HTMLElement, MouseEvent>
	"aria-pressed"?: boolean | "true" | "false"
	"aria-label"?: string
}

/** What each kind looks like. IconButton wears the same table: an icon button
 *  is a button, and the two must not drift. */
export const BUTTON_KIND: Record<ButtonKind, string> = {
	// Hover is one language across the plain kinds: the face goes to --gray.
	primary: "bg-ink text-white border-ink shadow-hard hover:bg-gray hover:text-ink",
	secondary: "bg-white text-ink border-ink shadow-hard hover:bg-gray",
	tertiary: "bg-white text-ink border-ink hover:bg-gray",
	ghost: "bg-transparent text-ink border-transparent hover:bg-gray",
	// Hover is a wash of the ground it sits on, since --gray would vanish against
	// ink the way ink vanishes against ink.
	"ghost--inverse": "bg-transparent text-white border-transparent hover:bg-white/20",

	// Danger wears the hatch at rest and resolves to solid ink on hover, so the
	// pattern reads as a warning rather than as texture.
	danger: "bg-hatch text-ink border-ink shadow-hard hover:bg-none hover:bg-ink hover:text-white",
	"danger--tertiary": "bg-white text-ink border-ink hover:bg-hatch",
	"danger--ghost": "bg-transparent text-ink border-transparent hover:bg-hatch",
}

/** Padding-driven, as in the prototypes. md lands at 26px tall, which is the
 *  prototype's ~27px once the type scale and padding are made even. */
const SIZE: Record<ButtonSize, string> = {
	sm: "px-snug py-tight",
	md: "px-2 py-snug",
	lg: "px-gap py-2",
}

/** Written as two whole, mutually exclusive strings rather than a base plus
 *  overrides. `text-body` and `text-label` are the same utility family, so which
 *  one wins would be decided by their order in the generated stylesheet, not by
 *  the order they appear in the class string — a coin flip dressed up as a
 *  cascade. Only ever emitting one of them removes the question. */
const VOICE = {
	command: "text-label font-bold uppercase",
	// --text-small, not --text-body: the prototypes set these at 10.5px, which is
	// the dense-row step, and at body size a list of thread titles stopped fitting
	// its lane. Same size as --text-label, without the uppercase tracking.
	content: "text-small font-normal",
}

export function Button(props: ButtonProps) {
	const [local, rest] = splitProps(props, [
		"kind",
		"size",
		"flat",
		"content",
		"renderIcon",
		"href",
		"type",
		"class",
		"children",
	])

	const kind = (): ButtonKind => local.kind ?? "secondary"
	const size = (): ButtonSize => local.size ?? "md"

	return (
		<Dynamic
			component={local.href ? "a" : "button"}
			href={local.href}
			// Carbon's default. A <button> in a <form> otherwise submits it, so a
			// "Forgot your password?" beside the sign-in fields sent the form on
			// the way to its own onClick. A button that submits says so.
			type={local.href ? undefined : local.type ?? "button"}
			// The press lands the face exactly where its shadow was.
			class={`inline-flex cursor-pointer select-none items-center gap-snug border-2 no-underline
				transition-colors disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none
				pointer-coarse:min-h-touch ${PRESS}
				${VOICE[local.content ? "content" : "command"]}
				${BUTTON_KIND[kind()]} ${SIZE[size()]}
				${local.flat ? "shadow-none active:translate-none" : ""} ${local.class ?? ""}`}
			{...rest}
		>
			{
				/* Glyph leads the label. Carbon trails it, but every button in the three
			    prototypes puts the icon first, and matching them is what keeps a
			    ported screen recognisable. */
			}
			<Show when={local.renderIcon}>
				{(glyph) => <Icon glyph={glyph()} size={16} />}
			</Show>
			{local.children}
		</Dynamic>
	)
}
