import { Show } from "solid-js"
import Fork from "@carbon/icons/es/fork/16"
import Star from "@carbon/icons/es/star/16"
import { ClickableTile, Icon, Swatch, Tag } from "@alumina/design"
import { BoardHero } from "./BoardHero"
import type { Board } from "../lib/quarry"

/** One board in the grid: who owns it, what it is, what it looks like, and the
 *  numbers under a rule.
 *
 *  The render is the point — a board listing without the board is a row of text,
 *  and the whole reason quarry ships meshes is so you can see the thing before
 *  you open it.
 *
 *  A ClickableTile: the tile itself is the link, so its 24px inset is as
 *  pressable as its text. It had been an anchor laid inside a Tile.
 */
export function BoardTile(props: { board: Board }) {
	return (
		<ClickableTile
			href={`/${props.board.namespace}/${props.board.slug}`}
			class="flex min-w-0 flex-col p-6"
		>
			<span class="flex items-center gap-2">
				<h3 class="m-0 min-w-0 truncate text-figure font-bold tracking-tight group-hover:underline">
					<span class="font-normal opacity-muted">{props.board.namespace}/</span>
					{props.board.slug}
				</h3>
				{/* Solid: it states something about the board it sits on. */}
				<Tag solid size="sm">Public</Tag>
			</span>

			<p class="m-0 mt-2 text-body opacity-muted">{props.board.description}</p>

			{/* Takes the slack, so every tile in a row ends its meta on the same line. */}
			<span class="mt-4 flex flex-1 items-center">
				<BoardHero board={props.board.slug} class="h-32 w-full" />
			</span>

			<span class="mt-4 flex flex-wrap items-center gap-4 border-t-2 border-ink pt-4 text-small opacity-muted">
				<span class="flex items-center gap-tight">
					<Swatch fill="open" />
					{props.board.layers} layer
				</span>
				<span class="flex items-center gap-tight">
					<Icon glyph={Star} size={16} label="stars" />
					<span class="tabular-nums">{props.board.stars.toLocaleString()}</span>
				</span>
				<span class="flex items-center gap-tight">
					<Icon glyph={Fork} size={16} label="forks" />
					<span class="tabular-nums">{props.board.forks}</span>
				</span>
				<Show when={!props.board.fitsPlate}>
					<span class="font-bold uppercase opacity-100">fab only</span>
				</Show>
				<span class="ml-auto">{props.board.updated}</span>
			</span>
		</ClickableTile>
	)
}
