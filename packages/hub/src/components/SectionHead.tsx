import type { JSX } from "solid-js"
import { children, Show } from "solid-js"

/** A label, a rule running to the far edge, and optionally one control on the
 *  right. quarry divides its long pages with these rather than with more boxes —
 *  air over boxes, and a full-width ink rule before another bordered container.
 */
export function SectionHead(props: { title: string; action?: JSX.Element; class?: string }) {
	// Resolved once. Testing the prop with <Show> and then placing it reads the
	// JSX getter twice, and a getter builds a *new* element per read — so the node
	// that was tested is not the node inserted, which desyncs hydration.
	const action = children(() => props.action)

	return (
		<div class={`flex items-center gap-4 ${props.class ?? ""}`}>
			<h2 class="m-0 shrink-0 text-label font-bold uppercase opacity-muted">{props.title}</h2>
			{/* 2px, like every rule here; dimmed because it is a seam, not a boundary. */}
			<span aria-hidden="true" class="h-rule flex-1 bg-ink opacity-20" />
			<Show when={action()}>
				<span class="shrink-0">{action()}</span>
			</Show>
		</div>
	)
}
