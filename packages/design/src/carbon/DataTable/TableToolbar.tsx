import { Show } from "solid-js"
import type { JSX } from "solid-js"
import SettingsIcon from "@carbon/icons/es/settings/16"
import type { CarbonGlyph } from "../../icons/glyph"
import { Icon } from "../../icons/Icon"
import { Button } from "../Button/Button"
import { OverflowMenu, OverflowMenuItem } from "../OverflowMenu/OverflowMenu"
import type { OverflowMenuItemProps } from "../OverflowMenu/OverflowMenu"
import { Search } from "../Search/Search"

export type TableToolbarProps = {
	"aria-label"?: string
	class?: string
	children?: JSX.Element
}

/** The bar that sits on a table's top edge.
 *
 *  It shares that edge: three sides of border here and none underneath, so the
 *  table's own frame closes it and there is one rule between the two rather than
 *  a doubled one. Cells inside divide with the same 2px rule quarry's nav uses.
 */
export function TableToolbar(props: TableToolbarProps) {
	return (
		<section
			aria-label={props["aria-label"] ?? "Table toolbar"}
			// While batch actions hold the bar, the rest of it stands down. Done in
			// CSS, off the batch region's own presence, so there is no state to keep
			// in step and nothing for the server and the browser to disagree about.
			class={`relative flex min-h-10 items-stretch border-2 border-b-0 border-ink bg-white
				[&:has([data-batch])_[data-toolbar-content]]:invisible ${props.class ?? ""}`}
		>
			{props.children}
		</section>
	)
}

export type TableToolbarContentProps = {
	class?: string
	children?: JSX.Element
}

/** Everything that is not batch actions: the search, a settings menu, the
 *  primary button. While batch actions hold the bar the toolbar makes this
 *  `invisible`, which takes it out of the tab order and the accessibility tree
 *  as well as out of sight — it is still laid out, so the bar keeps its height. */
export function TableToolbarContent(props: TableToolbarContentProps) {
	return (
		<div
			data-toolbar-content=""
			class={`flex min-w-0 flex-1 items-stretch justify-end ${props.class ?? ""}`}
		>
			{props.children}
		</div>
	)
}

export type TableToolbarSearchProps = {
	placeholder?: string
	labelText?: string
	value?: string
	class?: string
	/** Fires on every keystroke. Pass `onInputChange` from DataTable's render
	 *  props to filter with it. */
	onChange?: (value: string) => void
}

/** Carbon's persistent toolbar search: always open, taking whatever width the
 *  other controls leave. It is `bare` because the bar is already the field. */
export function TableToolbarSearch(props: TableToolbarSearchProps) {
	return (
		<Search
			bare
			size="lg"
			labelText={props.labelText ?? "Filter table"}
			placeholder={props.placeholder ?? "Filter"}
			value={props.value}
			onInput={(value) => props.onChange?.(value)}
			class={`min-w-0 flex-1 ${props.class ?? ""}`}
		/>
	)
}

export type TableToolbarMenuProps = {
	/** Accessible name for the trigger. */
	label?: string
	renderIcon?: CarbonGlyph
	children?: JSX.Element
}

/** A menu on the bar, for the things that configure the table rather than act
 *  on its rows: density, which columns show. An OverflowMenu with a cell's
 *  shape. */
export function TableToolbarMenu(props: TableToolbarMenuProps) {
	return (
		// The dividing rule is the wrapper's: the trigger already sets a border of
		// its own, and a second border utility on it would be settled by
		// stylesheet order.
		<span class="flex border-l-2 border-ink">
			<OverflowMenu
				label={props.label ?? "Table settings"}
				class="h-full px-2"
				trigger={<Icon glyph={props.renderIcon ?? SettingsIcon} size={16} />}
			>
				{props.children}
			</OverflowMenu>
		</span>
	)
}

/** One entry of a TableToolbarMenu. */
export function TableToolbarAction(props: OverflowMenuItemProps) {
	return <OverflowMenuItem {...props} />
}

export type TableBatchActionsProps = {
	/** At least one row is selected. */
	shouldShowBatchActions?: boolean
	totalSelected?: number
	/** How many rows could be selected. With `onSelectAll`, shows "Select all". */
	totalCount?: number
	class?: string
	children?: JSX.Element
	onCancel?: () => void
	onSelectAll?: () => void
}

/** What the toolbar becomes while rows are selected: how many, what can be done
 *  to them, and a way out.
 *
 *  It inverts to ink, which is the system's one way of saying "this is the
 *  active state" — the same thing the selected rows underneath it are doing.
 *  Carbon slides it in over the toolbar in blue.
 */
export function TableBatchActions(props: TableBatchActionsProps) {
	const count = () => props.totalSelected ?? 0

	return (
		<Show when={props.shouldShowBatchActions}>
			<div
				data-batch=""
				role="region"
				aria-label="Batch actions"
				class={`on-ink absolute inset-0 z-10 flex items-stretch bg-ink text-white ${
					props.class ?? ""
				}`}
			>
				<p class="m-0 flex min-w-0 flex-1 items-center gap-2 px-2 text-label font-bold uppercase">
					<span class="truncate" aria-live="polite">
						{count()} {count() === 1 ? "item" : "items"} selected
					</span>
					<Show when={props.onSelectAll && count() < (props.totalCount ?? 0)}>
						<Button kind="ghost--inverse" size="sm" onClick={() => props.onSelectAll?.()}>
							Select all ({props.totalCount})
						</Button>
					</Show>
				</p>
				<div class="flex shrink-0 items-stretch">
					{props.children}
					{
						/* The rule is the wrapper's. On the button it would be a third border
					    utility beside the two its kind already sets. */
					}
					<span class="flex border-l-2 border-white/40">
						<Button kind="ghost--inverse" onClick={() => props.onCancel?.()}>Cancel</Button>
					</span>
				</div>
			</div>
		</Show>
	)
}

export type TableBatchActionProps = {
	renderIcon?: CarbonGlyph
	disabled?: boolean
	children?: JSX.Element
	onClick?: () => void
}

/** One thing to do to the selected rows. */
export function TableBatchAction(props: TableBatchActionProps) {
	return (
		<Button
			kind="ghost--inverse"
			renderIcon={props.renderIcon}
			disabled={props.disabled}
			onClick={() => props.onClick?.()}
		>
			{props.children}
		</Button>
	)
}
