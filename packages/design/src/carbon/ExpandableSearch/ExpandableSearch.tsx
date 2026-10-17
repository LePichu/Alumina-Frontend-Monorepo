import { createSignal, Show } from "solid-js"
import SearchIcon from "@carbon/icons/es/search/16"
import { IconButton } from "../IconButton/IconButton"
import { Search } from "../Search/Search"
import type { SearchProps } from "../Search/Search"

export type ExpandableSearchProps = SearchProps & {
	/** Starts open. */
	isExpanded?: boolean
	onExpand?: () => void
}

/** Carbon's ExpandableSearch: a search that is an icon until it is wanted.
 *
 *  For a toolbar too crowded to spend a field's width on something used now and
 *  then. Pressing the icon swaps it for the field and puts the caret in it;
 *  leaving the field empty swaps it back. A field with something in it stays
 *  open — collapsing would hide the filter that is narrowing what is on screen.
 */
export function ExpandableSearch(props: ExpandableSearchProps) {
	const [expanded, setExpanded] = createSignal(props.isExpanded ?? false)
	const [value, setValue] = createSignal(props.value ?? "")
	let root: HTMLDivElement | undefined

	const expand = () => {
		setExpanded(true)
		props.onExpand?.()
		// After the swap: the input does not exist until the field has rendered.
		queueMicrotask(() => root?.querySelector("input")?.focus())
	}

	return (
		<div
			ref={root}
			class={`inline-flex items-center ${props.class ?? ""}`}
			onFocusOut={(event) => {
				const next = event.relatedTarget
				if (next instanceof Node && event.currentTarget.contains(next)) return
				if (value() === "") setExpanded(false)
			}}
		>
			<Show
				when={expanded()}
				fallback={
					<IconButton
						label={props.placeholder ?? "Search"}
						renderIcon={SearchIcon}
						size={props.size}
						disabled={props.disabled}
						onClick={expand}
					/>
				}
			>
				<Search
					id={props.id}
					labelText={props.labelText}
					hideLabel={props.hideLabel}
					placeholder={props.placeholder}
					size={props.size}
					value={props.value}
					disabled={props.disabled}
					closeButtonLabelText={props.closeButtonLabelText}
					bare={props.bare}
					class="w-64"
					onFocus={props.onFocus}
					onClear={props.onClear}
					onInput={(next) => {
						setValue(next)
						props.onInput?.(next)
					}}
				/>
			</Show>
		</div>
	)
}
