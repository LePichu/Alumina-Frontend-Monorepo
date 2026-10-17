import { createMemo, For } from "solid-js"
import { extent, GLYPH, num, str, unique } from "./core"
import type { BaseChartOptions, ChartProps } from "./core"
import { ChartFrame, createChart, tipHandlers } from "./frame"

export type WordCloudChartOptions = BaseChartOptions & {
	wordCloud?: {
		/** The datum key holding the word. */
		wordMapsTo?: string
		/** The datum key that sizes it. */
		fontSizeMapsTo?: string
		/** Smallest and largest font size, in px. */
		fontSizeRange?: [number, number]
	}
}

type Word = {
	text: string
	group: string
	value: number
	px: number
	x: number
	y: number
	w: number
	h: number
}

/** Carbon's WordCloudChart: words sized by how much each matters.
 *
 *  Placement walks an Archimedean spiral out from the middle and drops each word
 *  in the first spot where its box touches nothing already placed, largest word
 *  first. It is the usual algorithm with the two expensive parts removed: there
 *  is no rotation, and a word's box is computed rather than measured, since every
 *  glyph in the system's one face is the same width. That also makes it
 *  deterministic — the same data gives the same cloud on the server and in the
 *  browser, with no random seed to keep in step.
 *
 *  Carbon colours words by group. Here a group is weight: the first is bold, the
 *  rest are regular, and hiding one from the legend takes its words out.
 */
export function WordCloudChart(props: ChartProps<WordCloudChartOptions>) {
	const key = () => props.options?.data?.groupMapsTo ?? "group"
	const wordKey = () => props.options?.wordCloud?.wordMapsTo ?? "word"
	const sizeKey = () => props.options?.wordCloud?.fontSizeMapsTo ?? "value"

	const chart = createChart({
		options: () => props.options,
		groups: () => unique(props.data, key()).filter((group) => group !== ""),
		table: () => ({
			headers: [wordKey(), key(), sizeKey()],
			rows: props.data.map((
				datum,
			) => [str(datum[wordKey()]), str(datum[key()]), num(datum[sizeKey()])]),
		}),
	})

	return (
		<ChartFrame chart={chart} noLegend={chart.groups().length < 2} class={props.class}>
			{(size) => {
				const placed = createMemo(() => {
					const [low, high] = extent(props.data.map((datum) => num(datum[sizeKey()])))
					const [small, large] = props.options?.wordCloud?.fontSizeRange ?? [10, 44]
					const words = props.data
						.filter((datum) => chart.groups().length === 0 || chart.isActive(str(datum[key()])))
						.map((datum) => {
							const value = num(datum[sizeKey()])
							const t = Math.sqrt((value - low) / (high - low || 1))
							const px = Math.round(small + (Number.isNaN(t) ? 0 : t) * (large - small))
							const text = str(datum[wordKey()])
							return {
								text,
								group: str(datum[key()]),
								value,
								px,
								x: 0,
								y: 0,
								w: text.length * px * GLYPH + 6,
								h: px + 4,
							}
						})
						.sort((a, b) => b.px - a.px)

					const cx = size.width() / 2
					const cy = size.height() / 2
					const done: Word[] = []
					const hits = (word: Word) =>
						done.some((other) =>
							word.x < other.x + other.w && word.x + word.w > other.x &&
							word.y < other.y + other.h && word.y + word.h > other.y
						)
					// The spiral is stretched to the frame's shape, so a wide chart fills
					// sideways instead of leaving its ends empty.
					const stretch = size.width() / Math.max(1, size.height())

					for (const word of words) {
						for (let step = 0; step < 2400; step++) {
							const angle = step * 0.32
							const reach = step * 0.55
							word.x = cx + Math.cos(angle) * reach * stretch - word.w / 2
							word.y = cy + Math.sin(angle) * reach - word.h / 2
							const inside = word.x >= 0 && word.y >= 0 && word.x + word.w <= size.width() &&
								word.y + word.h <= size.height()
							if (inside && !hits(word)) {
								done.push({ ...word })
								break
							}
						}
					}
					return done
				})
				const bold = (group: string) => chart.groups().length < 2 || chart.indexOf(group) === 0

				return (
					<For each={placed()}>
						{(word) => (
							<text
								x={word.x + 3}
								y={word.y + word.h / 2}
								dominant-baseline="central"
								font-size={String(word.px)}
								class={`fill-ink ${bold(word.group) ? "font-bold" : ""}`}
								{...tipHandlers(chart, () => ({
									title: word.text,
									rows: [{ label: word.group || sizeKey(), value: chart.format(word.value) }],
								}))}
							>
								{word.text}
							</text>
						)}
					</For>
				)
			}}
		</ChartFrame>
	)
}
