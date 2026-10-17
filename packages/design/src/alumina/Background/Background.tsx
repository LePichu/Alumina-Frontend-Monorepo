import { Show } from "solid-js"
import { FAN_LAYER } from "./fan"

/** mica's two backdrops. The moving grid suits a landing screen; the still sheet
 *  suits a workspace you sit in front of. */
export type BackgroundVariant = "grid" | "sheet"

export type BackgroundProps = {
	variant?: BackgroundVariant
	/** Freezes the grid: rows hold at their resting positions and nothing moves.
	 *  Ignored by the sheet, which is still by nature. */
	static?: boolean
	class?: string
}

/** Fixed behind all content, 1:1 with mica.html's `.sky` + `.floor`.
 *
 * Two elements, matching the prototype exactly: a sky wash at the top, and one
 * floor element carrying the whole background stack — horizon rule, eight rows,
 * and the fan beneath them. Everything about the floor's geometry and layer order
 * lives in the floor-grid utility; this component only supplies the fan.
 *
 * Earlier revisions split the floor into stacked elements (a strip, an inline
 * <svg> fan, a separate horizon rule). Every value matched the prototype and it
 * still rendered differently, because the mechanism differed: an inline SVG
 * rasterises under a non-uniform preserveAspectRatio transform differently from
 * the same SVG used as a sized background layer, and DOM order had to be reversed
 * by hand to imitate background-layer order. Using the prototype's own mechanism
 * removes that whole class of divergence.
 *
 * Motion stops under prefers-reduced-motion: --outrun then holds at its initial 0
 * and the floor stands still, which is exactly what `static` produces.
 */
export function Background(props: BackgroundProps) {
	const variant = (): BackgroundVariant => props.variant ?? "grid"

	return (
		<div aria-hidden="true" class={`pointer-events-none fixed inset-0 z-0 ${props.class ?? ""}`}>
			<Show when={variant() === "grid"} fallback={<div class="blueprint-sheet absolute inset-0" />}>
				{
					/* .sky — a grey wash falling from the top edge, --sky tall.
				    Spelled out as the prototype's literal gradient rather than composed from
				    Tailwind's gradient utilities, because v4 interpolates those in oklab. A fade
				    to `transparent` (which is rgba(0,0,0,0)) takes a visibly different path in
				    oklab than in the sRGB the prototype gets — sRGB dips through a muddier dark
				    midpoint — so 1:1 requires sRGB. Naming those utilities here is avoided on
				    purpose: Tailwind scans comments for class candidates and would emit them. */
				}
				<div class="absolute inset-x-0 top-0 h-sky bg-[linear-gradient(180deg,var(--color-gray)_0,transparent_100%)]" />

				<div
					class={`floor-grid absolute inset-0 ${
						props.static ? "" : "animate-outrun motion-reduce:animate-none"
					}`}
					style={{ "--fan": FAN_LAYER }}
				/>
			</Show>
		</div>
	)
}
