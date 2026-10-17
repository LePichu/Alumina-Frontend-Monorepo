import { createMemo, For, Show } from "solid-js"

/** How an area fades from its line down to the axis, in one ink.
 *
 *  Carbon fills an area with a gradient: the series colour at the line, falling
 *  to transparent at the baseline. It is a good idea — the fill says "everything
 *  under here" without competing with the line — and it cannot be done here as
 *  drawn, because a gradient in ink is a run of greys, and the system has no
 *  greys to spend.
 *
 *  What a one-ink process does instead is change *coverage*: the ink is always
 *  full strength, and there is simply less of it per square as you go down.
 *  Three ways of doing that are built, because which reads best is a matter of
 *  looking:
 *
 *    dither    an ordered (Bayer) dither — the 1-bit gradient of early screens.
 *              The smoothest of the three: sixteen even steps of density.
 *    halftone  dots on a fixed grid that shrink — how a newspaper prints a
 *              photograph. Reads as a texture more than as a tone.
 *    lines     level rules that thin out — an engraver's shading. The most
 *              restrained, and the only one that also reads as a scale.
 */
export type FadeKind = "dither" | "halftone" | "lines"

/** The classic 4×4 Bayer threshold map. A cell is inked at level L when its
 *  threshold is below L, so each level adds exactly one more cell in sixteen and
 *  they arrive spread out, never in clumps. */
export const BAYER = [
	[0, 8, 2, 10],
	[12, 4, 14, 6],
	[3, 11, 1, 9],
	[15, 7, 13, 5],
] as const

/** Each kind's row pitch in px. Rows sit on multiples of it, so a row always
 *  shows whole pattern tiles and neighbouring rows' dots line up into a grid. */
const PITCH: Record<FadeKind, number> = { dither: 8, halftone: 6, lines: 6 }

/** Densest the fade gets, as a share of full ink. Not 1: the top of the area is
 *  under the line, and a solid band there would swallow it. */
const START = 0.62

/** A halftone dot's side, in whole pixels. Its *area* is the ink, so the side
 *  goes with the square root. Whole pixels only: a 2.5px dot is drawn as a 2px
 *  dot with a grey fringe, and a grey fringe is exactly the tone this is here to
 *  avoid. */
function dotOf(ink: number): number {
	return Math.round(Math.sqrt(ink) * 6)
}

/** A level rule's thickness for its row, in whole pixels — and, once a row has
 *  less than one pixel's worth of ink, whether it is drawn at all. Below 1px a
 *  line cannot get thinner, so it gets rarer instead: every second row, then
 *  every third, which carries the fade on down without a hairline in sight. */
function ruleOf(ink: number, pitch: number, row: number): number {
	const exact = ink * pitch
	if (exact >= 1) return Math.round(exact)
	const every = Math.max(2, Math.round(1 / Math.max(exact, 0.2)))
	return row % every === 0 ? 1 : 0
}

export type FadeProps = {
	/** Scopes the pattern and clip ids to one chart. */
	uid: string
	kind: FadeKind
	/** The closed area to fill. */
	path: string
	left: number
	right: number
	/** Where the fade is densest: the top of the area. */
	top: number
	/** Where it runs out: the baseline. */
	bottom: number
}

/** Numbers in this file are SVG user units — geometry inside a viewBox, not CSS
 *  lengths — so they are outside the even-number rule, as every chart's are. */
export function Fade(props: FadeProps) {
	const pitch = () => PITCH[props.kind]
	const clip = () => `${props.uid}-fade-clip`

	/** One entry per row: where it sits and how much ink it carries, 0–1. */
	const rows = createMemo(() => {
		const step = pitch()
		const first = Math.floor(props.top / step) * step
		const span = Math.max(1, props.bottom - props.top)
		const out: { y: number; ink: number }[] = []
		for (let y = first; y < props.bottom; y += step) {
			const t = Math.min(1, Math.max(0, (y + step / 2 - props.top) / span))
			out.push({ y, ink: START * (1 - t) })
		}
		return out
	})

	/** The dither levels and dot sizes actually used, so only those patterns are
	 *  defined. */
	const levels = createMemo(() => [...new Set(rows().map((row) => Math.round(row.ink * 16)))])
	const sizes = createMemo(() => [...new Set(rows().map((row) => dotOf(row.ink)))])

	return (
		<g class="pointer-events-none">
			<defs>
				<clipPath id={clip()}>
					<path d={props.path} />
				</clipPath>
				<Show when={props.kind === "dither"}>
					<For each={levels().filter((level) => level > 0)}>
						{(level) => (
							<pattern
								id={`${props.uid}-dither-${level}`}
								width="8"
								height="8"
								patternUnits="userSpaceOnUse"
							>
								<For each={BAYER}>
									{(row, y) => (
										<For each={row}>
											{(threshold, x) => (
												<Show when={threshold < level}>
													<rect x={x() * 2} y={y() * 2} width="2" height="2" class="fill-ink" />
												</Show>
											)}
										</For>
									)}
								</For>
							</pattern>
						)}
					</For>
				</Show>
				<Show when={props.kind === "halftone"}>
					<For each={sizes().filter((size) => size > 0)}>
						{(size) => (
							<pattern
								id={`${props.uid}-half-${size}`}
								width="6"
								height="6"
								patternUnits="userSpaceOnUse"
							>
								{
									/* Floored, so an odd-sized dot sits on whole pixels instead of
								    straddling two and coming out as a grey smear. */
								}
								<rect
									x={Math.floor((6 - size) / 2)}
									y={Math.floor((6 - size) / 2)}
									width={size}
									height={size}
									class="fill-ink"
								/>
							</pattern>
						)}
					</For>
				</Show>
			</defs>

			<g clip-path={`url(#${clip()})`}>
				<For each={rows()}>
					{(row, index) => {
						const level = Math.round(row.ink * 16)
						const size = dotOf(row.ink)
						const rule = ruleOf(row.ink, pitch(), index())
						return (
							<Show
								when={props.kind === "lines"}
								fallback={
									<Show when={props.kind === "dither" ? level > 0 : size > 0}>
										<rect
											x={props.left}
											y={row.y}
											width={Math.max(0, props.right - props.left)}
											height={pitch()}
											fill={props.kind === "dither"
												? `url(#${props.uid}-dither-${level})`
												: `url(#${props.uid}-half-${size})`}
										/>
									</Show>
								}
							>
								<Show when={rule > 0}>
									<rect
										x={props.left}
										y={row.y}
										width={Math.max(0, props.right - props.left)}
										height={rule}
										class="fill-ink"
									/>
								</Show>
							</Show>
						)
					}}
				</For>
			</g>
		</g>
	)
}
