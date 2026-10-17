import type { JSX } from "solid-js"

/** Carbon's Switcher: the list a HeaderPanel holds — other products, other
 *  places to go — one link to a row. */
export type SwitcherProps = {
	"aria-label"?: string
	"aria-labelledby"?: string
	class?: string
	/** SwitcherItems and SwitcherDividers. */
	children?: JSX.Element
}

export function Switcher(props: SwitcherProps) {
	return (
		<ul
			aria-label={props["aria-label"]}
			aria-labelledby={props["aria-labelledby"]}
			class={`m-0 flex list-none flex-col p-0 ${props.class ?? ""}`}
		>
			{props.children}
		</ul>
	)
}

export type SwitcherItemProps = {
	href?: string
	/** Where you already are. */
	isSelected?: boolean
	target?: string
	rel?: string
	"aria-label"?: string
	class?: string
	children?: JSX.Element
	onClick?: () => void
}

export function SwitcherItem(props: SwitcherItemProps) {
	return (
		<li class="m-0 list-none p-0">
			<a
				href={props.href}
				target={props.target}
				rel={props.rel}
				aria-label={props["aria-label"]}
				aria-current={props.isSelected ? "page" : undefined}
				onClick={() => props.onClick?.()}
				class={`flex w-full cursor-pointer items-center px-2 py-snug text-small no-underline transition-colors
					focus-visible:-outline-offset-2 pointer-coarse:min-h-touch
					${props.isSelected ? "on-ink bg-ink font-bold text-white" : "text-ink hover:bg-gray"}
					${props.class ?? ""}`}
			>
				<span class="min-w-0 truncate">{props.children}</span>
			</a>
		</li>
	)
}

/** A rule between groups of items, edge to edge. */
export function SwitcherDivider(props: { class?: string }) {
	return (
		<li role="separator" class={`m-0 list-none border-t-2 border-ink p-0 ${props.class ?? ""}`} />
	)
}
