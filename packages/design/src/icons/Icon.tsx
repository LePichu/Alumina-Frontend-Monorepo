import { For, Show } from "solid-js"
import { Dynamic } from "solid-js/web"
import type { CarbonGlyph, CarbonGlyphNode, IconSize } from "./glyph"

export type IconProps = {
	/** A descriptor from @carbon/icons, e.g. `import Add from "@carbon/icons/es/add/16"`. */
	glyph: CarbonGlyph
	/** Overrides the descriptor's own size. Defaults to whichever size was imported. */
	size?: IconSize
	/** Accessible name. Omit for decorative icons — those are hidden from AT. */
	label?: string
	class?: string
}

/** Carbon nests content a few levels deep (g, switch). Dynamic is safe for SVG
 *  here: Solid's createDynamic checks SVGElements and uses createElementNS. */
function GlyphNode(props: { node: CarbonGlyphNode }) {
	return (
		<Dynamic component={props.node.elem} {...(props.node.attrs ?? {})}>
			<Show when={props.node.content}>
				{(content) => <For each={content()}>{(child) => <GlyphNode node={child} />}</For>}
			</Show>
		</Dynamic>
	)
}

/** Carbon's four icon sizes as lengths on the spacing scale, so an icon is in
 *  rem like everything it sits beside. The `width` and `height` attributes say
 *  the same in pixels, but a pixel does not follow the root font size: with a
 *  larger default text size the labels grew and their icons did not. */
const SIZE: Record<IconSize, string> = {
	16: "size-4",
	20: "size-icon",
	24: "size-6",
	32: "size-8",
}

/** Renders a Carbon descriptor in ink. Colour comes from currentColor, so an
 *  Icon takes the ink of whatever it sits in. */
export function Icon(props: IconProps) {
	// A glyph-only icon has no size of its own to default to; it is drawn at 16.
	const size = (): IconSize =>
		props.size ?? (typeof props.glyph.size === "number" ? (props.glyph.size as IconSize) : 16)

	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox={String(props.glyph.attrs?.["viewBox"] ?? "0 0 32 32")}
			width={size()}
			height={size()}
			fill="currentColor"
			// Not in Solid's SvgSVGAttributes, so forced through as a plain attribute.
			attr:focusable="false"
			role={props.label ? "img" : undefined}
			aria-hidden={props.label ? undefined : "true"}
			class={`block shrink-0 ${SIZE[size()]} ${props.class ?? ""}`}
		>
			<Show when={props.label}>{(label) => <title>{label()}</title>}</Show>
			<For each={props.glyph.content ?? []}>{(node) => <GlyphNode node={node} />}</For>
		</svg>
	)
}
