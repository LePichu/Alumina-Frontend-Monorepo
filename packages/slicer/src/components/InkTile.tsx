import { For, Show } from "solid-js"
import PaintBrush from "@carbon/icons/es/paint-brush/16"
import {
	Icon,
	MeterChart,
	StructuredListBody,
	StructuredListCell,
	StructuredListRow,
	StructuredListWrapper,
	Swatch,
	Tile,
} from "@alumina/design"
import type { Fill } from "@alumina/design"
import type { MicaRun } from "../lib/mica"

/** One fill per slab, in order: identity by pattern, never by colour. */
const FILLS: Fill[] = ["solid", "hatch", "dots", "cross", "gray", "lines"]

const mm3 = (volume: number) => `${volume.toFixed(1)} mm³`

/** Where the ink goes: mica's volume for each slab's channels, as one
 *  proportional bar and then as a list — the bar answers "which slab takes the
 *  most", the list "how much".
 *
 *  It stands where the production estimate stood. That was a guess at print
 *  time with the prototype's coefficients; time is the G-code's to say, and the
 *  G-code is shale's, which is not wired in. Ink volume is mica's, and real.
 */
export function InkTile(props: { run: MicaRun }) {
	const slabs = () => props.run.slabs
	const label = (index: number, layer: string) => `${index} · ${layer}`

	return (
		<Tile
			heading={
				<>
					<Icon glyph={PaintBrush} size={16} />Ink
				</>
			}
			meta={mm3(props.run.total_ink_mm3)}
		>
			<Show
				when={slabs().length}
				fallback={
					<p class="m-0 text-small opacity-muted">
						{props.run.outcome === "one_piece"
							? "One plate, filled from both faces: mica reports no ink per slab."
							: "No slabs, so no ink to lay."}
					</p>
				}
			>
				<MeterChart
					data={slabs().map((slab) => ({
						group: label(slab.index, slab.layer),
						value: slab.ink_mm3,
					}))}
					options={{
						fills: Object.fromEntries(
							slabs().map((slab, at) => [
								label(slab.index, slab.layer),
								FILLS[at % FILLS.length] ?? "solid",
							]),
						),
						legend: { enabled: false },
						meter: { proportional: {}, valueFormatter: mm3 },
					}}
				/>
				<StructuredListWrapper aria-label="Ink by slab" isCondensed isFlush class="mt-snug">
					<StructuredListBody>
						<For each={slabs()}>
							{(slab, at) => (
								<StructuredListRow>
									<StructuredListCell class="flex items-center gap-snug text-small">
										<Swatch fill={FILLS[at() % FILLS.length] ?? "solid"} />
										<span class="min-w-0 truncate opacity-muted">
											{label(slab.index, slab.layer)}
										</span>
									</StructuredListCell>
									<StructuredListCell trailing class="text-small font-bold tabular-nums">
										{mm3(slab.ink_mm3)}
									</StructuredListCell>
								</StructuredListRow>
							)}
						</For>
						<StructuredListRow>
							<StructuredListCell>Total</StructuredListCell>
							<StructuredListCell trailing class="text-figure font-bold tabular-nums">
								{mm3(props.run.total_ink_mm3)}
							</StructuredListCell>
						</StructuredListRow>
					</StructuredListBody>
				</StructuredListWrapper>
			</Show>
		</Tile>
	)
}
