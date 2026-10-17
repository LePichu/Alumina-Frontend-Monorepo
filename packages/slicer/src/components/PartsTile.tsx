import { createMemo, createUniqueId, For, Show } from "solid-js"
import Layers from "@carbon/icons/es/layers/16"
import { Icon, RadioButton, RadioButtonGroup, ScrollArea, Tile } from "@alumina/design"
import type { Part } from "../lib/parts"

export type PartsTileProps = {
	parts: Part[]
	/** The part on the stage. */
	selected?: string
	onSelect: (id: string) => void
	/** Said in place of the list when a run made nothing — refused, or not run. */
	empty: string
}

/** What mica made of the board, one part at a time on the stage: the assembly
 *  (or the one-piece plate), each slab as it is printed with its ink, and the
 *  fixtures the slabs are laminated in.
 *
 *  It replaces the layer tree, whose groups and switches were the prototype's
 *  invention. These are mica's own files, and one is shown at a time because
 *  each lies in the frame it is printed in. A choice of one is a radio group —
 *  a group per kind of part, sharing one name, so the arrows run through all.
 */
export function PartsTile(props: PartsTileProps) {
	const name = `parts-${createUniqueId()}`
	const groups = createMemo(() => {
		const order: Part["group"][] = ["Board", "Slabs", "Fixtures"]
		return order
			.map((group) => ({ group, parts: props.parts.filter((part) => part.group === group) }))
			.filter((entry) => entry.parts.length > 0)
	})

	return (
		<Tile
			// Takes the lane's leftover height, with a floor: on a short window it
			// stays tall enough to use and the lane scrolls to it.
			class="flex min-h-48 flex-1 flex-col"
			flush
			fill
			heading={
				<>
					<Icon glyph={Layers} size={16} />Parts
				</>
			}
			meta={String(props.parts.length)}
		>
			<ScrollArea class="flex flex-col gap-2 px-2 pb-2 pt-snug">
				<Show
					when={props.parts.length}
					fallback={<p class="m-0 text-small opacity-muted">{props.empty}</p>}
				>
					<For each={groups()}>
						{(entry) => (
							<RadioButtonGroup
								legendText={entry.group}
								name={name}
								orientation="vertical"
								valueSelected={props.selected ?? ""}
								onChange={props.onSelect}
							>
								<For each={entry.parts}>
									{(part) => (
										<RadioButton value={part.id} labelText={part.label} helperText={part.detail} />
									)}
								</For>
							</RadioButtonGroup>
						)}
					</For>
				</Show>
			</ScrollArea>
		</Tile>
	)
}
