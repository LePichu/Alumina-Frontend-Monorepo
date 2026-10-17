import { children } from "solid-js"
import type { JSX } from "solid-js"

export type WorkspaceProps = {
	/** The narrow column: what frames the work — its settings, its facts, what
	 *  can be done to it. */
	aside: JSX.Element
	/** Names the narrow column for assistive tech, as the landmark it is. */
	asideLabel?: string
	/** Where the workspace sits. It fills the height it is given. */
	class?: string
	/** The wide column: the work itself. */
	children?: JSX.Element
}

/** A page as two columns, 25% and 75%.
 *
 *  This is the layout the apps are being reworked onto: what you set and read
 *  on the left, the thing you are setting on the right, in that proportion
 *  everywhere, so a page in foundry, quarry and kiln is the same shape. It was
 *  30/70, and in use the narrow column took more than its work needed.
 *
 *  The split is `1fr 3fr`, so the gap between the columns comes out of both and
 *  nothing overflows by it — with a floor of 16rem under the narrow one, which is
 *  what a column of inline fields needs to keep its labels. On a page under
 *  64rem that floor is more than a quarter, and the wide column gives way.
 *
 *  Under 48rem there is no room for two columns at all, so they stack, the
 *  narrow one first: as tall as it needs, up to the whole height, and the wide
 *  one in what is left. (Stacked on auto rows, the two together ran past the
 *  bottom of a phone, and the wide one could not be scrolled to.) That is 48rem of the workspace's *own* width, not the
 *  window's: it is a page inside a shell, and how much room it has depends on
 *  the shell's strip and on whatever else it has been put beside, so it asks its
 *  container and not the viewport. (It asked the viewport at first, at `lg`. A
 *  window at 150% zoom is 960px wide, which is under `lg`, and the split was
 *  never seen.)
 *
 *  Each column is its own box with a height to fill, so each can hold a
 *  `ScrollArea` and scroll by itself; the workspace itself never scrolls.
 */
export function Workspace(props: WorkspaceProps) {
	// Resolved once — see "Slots" in CLAUDE.md.
	const aside = children(() => props.aside)

	return (
		// Two elements, because a container cannot answer a query about itself:
		// this one is measured, the grid inside it is what changes.
		<div class={`@container flex min-h-0 flex-col ${props.class ?? ""}`}>
			<div class="grid min-h-0 flex-1 grid-cols-1 grid-rows-[minmax(0,auto)_minmax(0,1fr)] gap-gap @3xl:grid-cols-[minmax(16rem,1fr)_3fr] @3xl:grid-rows-[minmax(0,1fr)]">
				<aside aria-label={props.asideLabel} class="flex min-h-0 min-w-0 flex-col">{aside()}</aside>
				<div class="flex min-h-0 min-w-0 flex-col">{props.children}</div>
			</div>
		</div>
	)
}
