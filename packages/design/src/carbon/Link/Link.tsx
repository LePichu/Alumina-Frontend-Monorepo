import { Show } from "solid-js"
import type { JSX } from "solid-js"
import type { CarbonGlyph } from "../../icons/glyph"
import { Icon } from "../../icons/Icon"

export type LinkSize = "sm" | "md" | "lg"

export type LinkProps = {
	href: string
	/** Carbon's inline: the link sits in a sentence. Underlined at rest, since
	 *  without colour an underline is the only thing that says "link" in running
	 *  text. A standalone link — one of a list of destinations — underlines on
	 *  hover instead, where its position already says what it is. */
	inline?: boolean
	size?: LinkSize
	/** Trails the label, as Carbon's does: an arrow, a launch glyph. */
	renderIcon?: CarbonGlyph
	disabled?: boolean
	target?: "_blank" | "_self"
	class?: string
	children?: JSX.Element
}

const SIZE: Record<LinkSize, string> = {
	sm: "text-small",
	md: "text-body",
	lg: "text-figure",
}

/** Carbon's Link.
 *
 *  Takes its ink from whatever it sits on rather than setting one: quarry's
 *  footer is white text on ink, and a link that insisted on `text-ink` would
 *  vanish there. Carbon's `visited` is dropped — it exists to change the colour.
 */
export function Link(props: LinkProps) {
	return (
		<a
			href={props.disabled ? undefined : props.href}
			aria-disabled={props.disabled ? "true" : undefined}
			target={props.target}
			rel={props.target === "_blank" ? "noreferrer" : undefined}
			class={`inline-flex items-center gap-tight text-current underline-offset-2
				${
				props.inline
					? "underline hover:no-underline"
					// A link standing on its own is a destination to be pressed, and takes a
					// finger's height. One in a sentence stays on its line: making a word
					// 44px tall would tear the paragraph apart, and WCAG exempts it.
					: "no-underline hover:underline pointer-coarse:min-h-touch"
			}
				${props.disabled ? "pointer-events-none opacity-40" : "cursor-pointer"}
				${SIZE[props.size ?? "md"]} ${props.class ?? ""}`}
		>
			{props.children}
			<Show when={props.renderIcon}>{(glyph) => <Icon glyph={glyph()} size={16} />}</Show>
		</a>
	)
}
