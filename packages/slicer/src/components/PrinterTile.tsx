import { For, Show } from "solid-js"
import Plug from "@carbon/icons/es/plug/16"
import PrinterIcon from "@carbon/icons/es/printer/16"
import Renew from "@carbon/icons/es/renew/16"
import StopFilledAlt from "@carbon/icons/es/stop--filled--alt/16"
import Terminal from "@carbon/icons/es/terminal/16"
import { Button, Icon, ScrollArea, Select, SelectItem, Swatch, Tile } from "@alumina/design"
import type { Printer } from "../lib/printer"

export type PrinterTileProps = {
	printers: Printer[]
	index: number
	onSelect: (index: number) => void
	/** Where it sits. Given a height, it keeps to it and scrolls inside. */
	class?: string
}

/** The machine: which one, whether it is up, and the four things you do to it.
 *
 *  Connection state is a filled square and a word. The prototype's dot was green;
 *  monochrome carries it by fill instead.
 *
 *  On the board page it stands at its own height; on Home it has a third of
 *  the column, which at 150% is less than it needs, so its body scrolls. */
export function PrinterTile(props: PrinterTileProps) {
	const printer = () => props.printers[props.index]
	const linked = () => Boolean(printer()?.link)

	return (
		<Tile
			heading={
				<>
					<Icon glyph={PrinterIcon} size={16} />Printer
				</>
			}
			fill
			class={`flex flex-col ${props.class ?? ""}`}
		>
			<ScrollArea>
				<Select
					labelText="Printer"
					hideLabel
					size="sm"
					value={String(props.index)}
					onChange={(value) => props.onSelect(Number(value))}
				>
					<For each={props.printers}>
						{(entry, at) => <SelectItem value={String(at())} text={entry.name} />}
					</For>
				</Select>

				<Show when={printer()}>
					{(current) => (
						<p class="m-0 mb-snug mt-snug flex items-center gap-snug text-small">
							<Swatch
								fill={linked() ? "solid" : "open"}
								label={linked() ? "connected" : "not connected"}
							/>
							<span>{current().state}</span>
							<Show when={current().address}>
								<span class="ml-auto truncate opacity-muted">
									{current().address} · fw {current().firmware}
								</span>
							</Show>
						</p>
					)}
				</Show>

				{/* Four controls on a 2×2 pad, shadowless so the tile keeps the only one. */}
				<div class="grid grid-cols-2 gap-tight">
					<Button kind={linked() ? "primary" : "secondary"} size="sm" renderIcon={Plug} flat>
						Connect
					</Button>
					<Button kind="secondary" size="sm" renderIcon={Terminal} flat>Console</Button>
					<Button kind="secondary" size="sm" renderIcon={Renew} flat>Reconnect</Button>
					<Button kind="secondary" size="sm" renderIcon={StopFilledAlt} flat>E-stop</Button>
				</div>
			</ScrollArea>
		</Tile>
	)
}
