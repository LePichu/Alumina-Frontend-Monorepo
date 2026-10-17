import { createMemo, For, Show } from "solid-js"
import CheckmarkFilled from "@carbon/icons/es/checkmark--filled/16"
import ErrorFilled from "@carbon/icons/es/error--filled/16"
import WarningFilled from "@carbon/icons/es/warning--filled/16"
import type { CarbonGlyph } from "../icons/glyph"
import { Icon } from "../icons/Icon"
import { BOX, LABEL } from "../internal/styles"
import { FILL_CLASS, FILLS, Swatch } from "../alumina/Swatch/Swatch"
import type { Fill } from "../alumina/Swatch/Swatch"
import { formatNumber, num, str, sum } from "./core"
import type { BaseChartOptions, ChartProps } from "./core"

export type MeterStatus = "success" | "warning" | "danger"

export type MeterChartOptions = BaseChartOptions & {
	meter?: {
		/** A tick on the track: the highest the reading has been. */
		peak?: number
		/** What a plain meter is out of. Carbon's is a percentage, so 100. */
		max?: number
		/** Splits the track among several series instead of filling it with one.
		 *  `total` is what the whole track stands for. */
		proportional?: {
			total?: number
			unit?: string
		}
		status?: {
			/** Which reading counts as what. */
			ranges: { range: [number, number]; status: MeterStatus }[]
		}
		/** Formats the figure in the heading. */
		valueFormatter?: (value: number) => string
	}
}

/** Status reads as a glyph and a word. Carbon tints the bar; this does not. */
const STATUS: Record<MeterStatus, { glyph: CarbonGlyph; label: string }> = {
	success: { glyph: CheckmarkFilled, label: "ok" },
	warning: { glyph: WarningFilled, label: "warning" },
	danger: { glyph: ErrorFilled, label: "over" },
}

/** Carbon's MeterChart: how much of something is used.
 *
 *  Plain, it is one series against a maximum — a labelled track with an ink fill
 *  and an optional peak tick. Proportional, it is several series sharing the
 *  track, each in its own fill, with a legend that doubles as the breakdown.
 *
 *  This is the one chart that is not an SVG. It is a single row of boxes, which
 *  is what CSS flex lays out exactly and crisply at any width, and it lets the
 *  segments use the very same fill utilities their legend swatches do — so the
 *  two cannot drift. mica's production estimate was this, hand-built.
 */
export function MeterChart(props: ChartProps<MeterChartOptions>) {
	const meter = () => props.options?.meter ?? {}
	const key = () => props.options?.data?.groupMapsTo ?? "group"
	const proportional = () => meter().proportional
	const rows = createMemo(() =>
		props.data.map((datum, index) => ({
			group: str(datum[key()]),
			value: Number.isNaN(num(datum["value"])) ? 0 : num(datum["value"]),
			fill: (props.options?.fills?.[str(datum[key()])] ?? FILLS[index % FILLS.length] ??
				"solid") as Fill,
		}))
	)
	const used = () => sum(rows().map((row) => row.value))
	const whole = () => proportional()?.total ?? (proportional() ? used() : (meter().max ?? 100))
	const format = (value: number) => meter().valueFormatter?.(value) ?? formatNumber(value)
	const unit = () => (proportional()?.unit ? ` ${proportional()?.unit}` : "")

	const status = () => {
		const reading = used()
		return meter().status?.ranges.find(({ range }) => reading >= range[0] && reading <= range[1])
			?.status
	}

	return (
		<figure class={`m-0 flex min-w-0 flex-col gap-snug ${props.class ?? ""}`}>
			{
				/* A proportional meter that names neither itself nor a total has nothing
			    to say up here — it is a bar inside something that already has a
			    heading, which is how mica uses it. */
			}
			<Show when={!proportional() || props.options?.title !== undefined || proportional()?.total}>
				<figcaption class="flex items-baseline gap-2 text-small">
					<span class="min-w-0 flex-1 truncate font-bold">
						{props.options?.title ?? rows()[0]?.group}
					</span>
					<Show when={status()}>
						{(kind) => (
							<span class={`flex shrink-0 items-center gap-tight self-center ${LABEL}`}>
								<Icon glyph={STATUS[kind()].glyph} size={16} />
								{STATUS[kind()].label}
							</span>
						)}
					</Show>
					<span class="shrink-0 tabular-nums">
						<Show
							when={proportional()}
							fallback={<b class="font-bold">{format(used())}{meter().max ? "" : "%"}</b>}
						>
							<b class="font-bold">{format(used())}{unit()}</b>
							<Show when={proportional()?.total !== undefined}>
								<span class="ml-tight opacity-muted">of {format(whole())}{unit()}</span>
							</Show>
						</Show>
					</span>
				</figcaption>
			</Show>

			{
				/* Each segment's share is data, so it goes in as a custom property and
			    the class consumes it. The remainder is one more segment, left white. */
			}
			<div
				role="img"
				aria-label={`${format(used())} of ${format(whole())}${unit()}`}
				class={`relative flex h-4 w-full ${BOX}`}
			>
				<For each={rows()}>
					{(row) => (
						<span
							title={`${row.group} · ${format(row.value)}${unit()}`}
							class={`flex-[var(--share)] border-r-2 border-ink ${FILL_CLASS[row.fill]}`}
							style={{ "--share": String(Math.max(0, row.value)) }}
						/>
					)}
				</For>
				<span
					class="flex-[var(--share)]"
					style={{ "--share": String(Math.max(0, whole() - used())) }}
				/>
				<Show when={meter().peak !== undefined}>
					{
						/* A white sleeve around the tick, so it reads over the ink fill as
					    well as over the empty track. Inside the track, never over its
					    border. */
					}
					<span
						aria-hidden="true"
						class="absolute inset-y-0 left-[var(--peak)] flex w-snug -translate-x-1/2 justify-center
							bg-white"
						style={{ "--peak": `${Math.min(100, ((meter().peak ?? 0) / (whole() || 1)) * 100)}%` }}
					>
						<span class="h-full w-rule bg-ink" />
					</span>
				</Show>
			</div>

			<Show when={proportional() && props.options?.legend?.enabled !== false}>
				<ul class="m-0 flex list-none flex-col p-0">
					<For each={rows()}>
						{(row) => (
							<li class="flex items-center gap-snug py-rule text-small">
								<Swatch fill={row.fill} size="lg" />
								<span class="min-w-0 flex-1 truncate opacity-muted">{row.group}</span>
								<span class="shrink-0 font-bold tabular-nums">{format(row.value)}{unit()}</span>
							</li>
						)}
					</For>
				</ul>
			</Show>
		</figure>
	)
}
