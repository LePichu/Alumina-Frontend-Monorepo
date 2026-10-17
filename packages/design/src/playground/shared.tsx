import type { JSX } from "solid-js"
import { Tile } from "../index"

/** Section titles double as anchors, so the index at the top of the page and
 *  the sections themselves cannot drift apart. */
export function slug(title: string): string {
	return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

/** Every section is a full-width ruled band. Air and rules before boxes. */
export function Section(props: { title: string; children: JSX.Element }) {
	return (
		// scroll-mt so a jump from the index lands the heading clear of the top edge.
		<section id={slug(props.title)} class="scroll-mt-4 border-t-2 border-ink py-8">
			<h2 class="m-0 mb-4 text-micro font-bold uppercase">{props.title}</h2>
			{props.children}
		</section>
	)
}

export function Row(props: { label: string; children: JSX.Element }) {
	return (
		<div class="mb-4 flex flex-wrap items-center gap-4">
			<span class="w-32 shrink-0 text-micro font-bold uppercase opacity-muted">{props.label}</span>
			{props.children}
		</div>
	)
}

/** A titled group inside a section, for sections that show several things.
 *
 *  `boxed` sets the content on a Tile. Fields have no ground of their own at
 *  rest, so on the playground's bare page the moving floor would show through
 *  every input; in an app they always sit in a Tile, and here they should too. */
export function Sub(
	props: { title: string; note?: string; boxed?: boolean; children: JSX.Element },
) {
	return (
		<div class="mb-8 last:mb-0">
			<h3 class="m-0 text-micro font-bold uppercase opacity-muted">{props.title}</h3>
			{props.note ? <p class="m-0 mt-tight text-small opacity-muted">{props.note}</p> : null}
			<div class="mt-4">
				{props.boxed ? <Tile class="p-2">{props.children}</Tile> : props.children}
			</div>
		</div>
	)
}
