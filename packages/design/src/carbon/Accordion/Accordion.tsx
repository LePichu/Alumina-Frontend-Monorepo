import CorvuAccordion from "corvu/accordion"
import { children, createContext, createSignal, createUniqueId, Show, useContext } from "solid-js"
import type { JSX } from "solid-js"
import ChevronDown from "@carbon/icons/es/chevron--down/16"
import { Icon } from "../../icons/Icon"

export type AccordionSize = "sm" | "md" | "lg"

type AccordionContextValue = {
	size: () => AccordionSize
	align: () => "start" | "end"
	/** Called by an item during its own creation, so a default-open item is open
	 *  on the very first render — server included. */
	open: (value: string) => void
}

const AccordionContext = createContext<AccordionContextValue>()

export type AccordionProps = {
	/** Carbon's align: which edge the chevron sits on. Carbon defaults to `end`;
	 *  `start` is the tree-like reading mica's layer groups want. */
	align?: "start" | "end"
	size?: AccordionSize
	disabled?: boolean
	class?: string
	children?: JSX.Element
}

/** Carbon's Accordion, on Corvu's.
 *
 *  Corvu supplies the parts that are easy to get wrong: the trigger/region
 *  wiring, arrow-key travel between headers, and a content element whose height
 *  it measures so the open/close can animate without a hard-coded max-height.
 *
 *  Any number of items may be open at once, as in Carbon. The open set is held
 *  here rather than left to Corvu's `initialValue`, because that would have to be
 *  known before the items exist — and which items start open is each item's own
 *  prop.
 */
export function Accordion(props: AccordionProps) {
	const [value, setValue] = createSignal<string[]>([])

	const ctx: AccordionContextValue = {
		size: () => props.size ?? "md",
		align: () => props.align ?? "end",
		open: (item) => setValue((current) => (current.includes(item) ? current : [...current, item])),
	}

	return (
		<AccordionContext.Provider value={ctx}>
			<CorvuAccordion
				multiple
				collapsible
				disabled={props.disabled}
				value={value()}
				onValueChange={(next) => setValue(Array.isArray(next) ? next : next ? [next] : [])}
			>
				<div class={props.class}>{props.children}</div>
			</CorvuAccordion>
		</AccordionContext.Provider>
	)
}

export type AccordionItemProps = {
	title: JSX.Element
	/** Starts open. Uncontrolled after that. */
	open?: boolean
	disabled?: boolean
	class?: string
	children?: JSX.Element
}

const TRIGGER: Record<AccordionSize, string> = {
	sm: "py-tight",
	md: "py-snug",
	lg: "py-2",
}

/** Rules run edge to edge and belong to the item, so a closed accordion is a
 *  stack of ruled headers and nothing else. The last item carries none. */
export function AccordionItem(props: AccordionItemProps) {
	const ctx = useContext(AccordionContext)
	if (!ctx) throw new Error("AccordionItem must be used inside an Accordion")

	const value = createUniqueId()
	// Untracked on purpose: `open` is where the item starts, not a binding.
	if (props.open) ctx.open(value)

	const title = children(() => props.title)

	return (
		<CorvuAccordion.Item
			value={value}
			disabled={props.disabled}
			as="section"
			class={`border-b-2 border-ink last:border-b-0 ${props.class ?? ""}`}
		>
			<h3 class="m-0">
				<CorvuAccordion.Trigger
					class={`group flex w-full cursor-pointer items-center gap-snug border-0 bg-transparent px-0
						text-left text-label font-bold uppercase text-ink
						transition-colors hover:bg-gray
						disabled:cursor-not-allowed disabled:opacity-40 pointer-coarse:min-h-touch
						${TRIGGER[ctx.size()]}`}
				>
					<Show when={ctx.align() === "start"}>
						<Chevron />
					</Show>
					<span class="flex min-w-0 flex-1 items-center gap-snug">{title()}</span>
					<Show when={ctx.align() === "end"}>
						<Chevron />
					</Show>
				</CorvuAccordion.Trigger>
			</h3>
			<CorvuAccordion.Content class="overflow-hidden pb-tight">
				{props.children}
			</CorvuAccordion.Content>
		</CorvuAccordion.Item>
	)
}

/** Points right when shut and down when open. Corvu sets data-expanded on the
 *  trigger, which is the `group` here, so the turn needs no state of its own. */
function Chevron() {
	return (
		<Icon
			glyph={ChevronDown}
			size={16}
			class="shrink-0 -rotate-90 transition-transform duration-220
				group-data-[expanded]:rotate-0"
		/>
	)
}
