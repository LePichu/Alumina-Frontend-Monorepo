import { Show } from "solid-js"

/** The fill vocabulary. Where another system would reach for a colour, this one
 *  reaches for one of these — a tool module, a production stage, a chart series
 *  and a status all separate by pattern, never by hue.
 *
 *  Ordered so the first few are as unlike each other as possible: a chart with
 *  three series takes the first three and they must not be confusable. */
export const FILLS = [
	"solid",
	"hatch",
	"dots",
	"gray",
	"cross",
	"open",
	"back",
	"lines",
	"bars",
	"grid",
	"checker",
] as const

export type Fill = (typeof FILLS)[number]

/** Each fill as a background utility. Its SVG twin lives in charts/fills.tsx. */
export const FILL_CLASS: Record<Fill, string> = {
	solid: "bg-ink",
	hatch: "bg-hatch",
	dots: "pat-dots",
	gray: "bg-gray",
	cross: "pat-cross",
	open: "bg-white",
	back: "pat-back",
	lines: "pat-lines",
	bars: "pat-bars",
	grid: "pat-grid",
	checker: "pat-checker",
}

export type SwatchSize = "md" | "lg"

export type SwatchProps = {
	fill?: Fill
	/** `md` is the 10px square that sits on a line of small text; `lg` is 16px, for
	 *  a legend where the pattern itself has to be read. */
	size?: SwatchSize
	/** Names the swatch for assistive tech. Omit when the text beside it already
	 *  says what it stands for — which is nearly always. */
	label?: string
	class?: string
}

const SIZE: Record<SwatchSize, string> = {
	// --spacing-gap is 10px, the prototypes' 9px status dot on the even grid.
	md: "size-gap",
	lg: "size-4",
}

/** A small ink-bordered square carrying one fill.
 *
 *  All three apps drew this by hand, a dozen times between them: mica's
 *  connection state, layer rows, tool bays and production legend; kiln's run
 *  steps and hand-off state; quarry's layer count and publish checklist. Filled
 *  means live, done or on; open means not. Any other fill is identity.
 */
export function Swatch(props: SwatchProps) {
	return (
		<span
			role={props.label ? "img" : undefined}
			aria-label={props.label}
			aria-hidden={props.label ? undefined : "true"}
			// border-current, not border-ink: on a selected RadioTile or an ink bar the
			// text is white, and an ink-bordered solid swatch there is ink on ink —
			// invisible. Taking the text's colour keeps the square's edge in every case.
			class={`inline-block shrink-0 border-2 border-current ${SIZE[props.size ?? "md"]}
				${FILL_CLASS[props.fill ?? "solid"]} ${props.class ?? ""}`}
		>
			<Show when={props.label}>
				<span class="sr-only">{props.label}</span>
			</Show>
		</span>
	)
}
