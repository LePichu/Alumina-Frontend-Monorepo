import { children as resolveChildren, For, Show } from "solid-js"
import type { JSX } from "solid-js"

export type BreadcrumbProps = {
	/** Carbon's noTrailingSlash. Separators always sit between items; this only
	 *  controls whether one also trails the last. */
	noTrailingSlash?: boolean
	class?: string
	children?: JSX.Element
}

export function Breadcrumb(props: BreadcrumbProps) {
	const items = resolveChildren(() => props.children)
	const list = () => items.toArray()

	return (
		<nav aria-label="Breadcrumb" class={props.class}>
			<ol class="m-0 flex list-none flex-wrap items-stretch gap-tight p-0">
				<For each={list()}>
					{(item, index) => (
						<>
							{item}
							<Show when={index() < list().length - 1 || props.noTrailingSlash === false}>
								<li aria-hidden="true" class="flex items-center text-micro opacity-muted">
									/
								</li>
							</Show>
						</>
					)}
				</For>
			</ol>
		</nav>
	)
}

export type BreadcrumbItemProps = {
	href?: string
	isCurrentPage?: boolean
	class?: string
	children?: JSX.Element
}

/** Each crumb is a solid block, not an underlined link. An underline plus a hover
 *  tint read as unstyled browser default next to everything else here; a filled
 *  chip matches the ink-ground language the rest of the system already uses, and
 *  makes the current page unmistakable without relying on weight alone. */
export function BreadcrumbItem(props: BreadcrumbItemProps) {
	return (
		<li class={`flex text-micro uppercase ${props.class ?? ""}`}>
			<Show
				when={props.href && !props.isCurrentPage}
				fallback={
					<span
						aria-current={props.isCurrentPage ? "page" : undefined}
						class={`flex items-center px-2 py-tight ${
							props.isCurrentPage ? "on-ink bg-ink font-bold text-white" : "bg-gray"
						}`}
					>
						{props.children}
					</span>
				}
			>
				<a
					href={props.href}
					class="flex items-center bg-gray px-2 py-tight text-ink no-underline
						transition-colors
						hover:bg-ink hover:text-white pointer-coarse:min-h-touch"
				>
					{props.children}
				</a>
			</Show>
		</li>
	)
}
