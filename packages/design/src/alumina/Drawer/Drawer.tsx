import CorvuDrawer from "corvu/drawer"
import type { JSX } from "solid-js"
import Close from "@carbon/icons/es/close/16"
import { Icon } from "../../icons/Icon"
import { Scroller } from "../../internal/scroll"
import { INK_BAR, INK_BAR_CONTROL, LABEL, SCRIM } from "../../internal/styles"

export type DrawerSide = "left" | "right" | "bottom"

export type DrawerProps = {
	open: boolean
	/** Names the drawer, and is shown on its ink bar. */
	label: JSX.Element
	side?: DrawerSide
	/** Drops the body's padding, for content that is already a stack of ruled
	 *  sections — kiln's rail goes in as it is. */
	flush?: boolean
	class?: string
	children?: JSX.Element
	onClose?: () => void
}

/** Where the sheet sits, and which of its edges is the one facing the page —
 *  that edge gets the ink rule. Whole strings per side. */
const SIDE: Record<DrawerSide, string> = {
	left: "inset-y-0 left-0 w-80 max-w-[86vw] border-r-2",
	right: "inset-y-0 right-0 w-80 max-w-[86vw] border-l-2",
	bottom: "inset-x-0 bottom-0 max-h-[86vh] border-t-2",
}

/** A sheet that slides in from an edge of the screen.
 *
 *  For the part of a wide layout that has no room on a narrow one: kiln's rail
 *  and quarry's search facets are both a column beside the content on a desktop
 *  and a drawer on a phone. It is the same content either way — the drawer is
 *  only where it goes when there is nowhere to stand it.
 *
 *  Corvu Drawer, which is in the stack for exactly this: it follows a finger,
 *  snaps shut on a flick, traps focus, locks the page behind it and closes on
 *  Escape. Carbon's core has no drawer; its nearest relation is the UI shell's
 *  side nav, which is part of the AppShell work and not built.
 *
 *  Dressed like a Modal — ink bar, one white close control — because it is one:
 *  a dialog, set against an edge instead of in the middle.
 */
export function Drawer(props: DrawerProps) {
	return (
		<CorvuDrawer
			open={props.open}
			onOpenChange={(open: boolean) => {
				if (!open) props.onClose?.()
			}}
			side={props.side ?? "left"}
		>
			<CorvuDrawer.Portal>
				<CorvuDrawer.Overlay
					class={`${SCRIM} data-[closed]:opacity-0 data-[transitioning]:transition-opacity data-[transitioning]:duration-300 motion-reduce:transition-none`}
				/>
				<CorvuDrawer.Content
					class={`fixed z-50 flex flex-col border-ink bg-white
						data-[transitioning]:transition-transform data-[transitioning]:duration-300
 motion-reduce:transition-none
						${SIDE[props.side ?? "left"]} ${props.class ?? ""}`}
				>
					<div class={INK_BAR}>
						<CorvuDrawer.Label class={`m-0 flex min-w-0 flex-1 items-center gap-tight ${LABEL}`}>
							{props.label}
						</CorvuDrawer.Label>
						<CorvuDrawer.Close aria-label="Close" class={INK_BAR_CONTROL}>
							<Icon glyph={Close} size={16} />
						</CorvuDrawer.Close>
					</div>
					<Scroller class="flex-1" paneClass={props.flush ? "" : "p-2"}>
						{props.children}
					</Scroller>
				</CorvuDrawer.Content>
			</CorvuDrawer.Portal>
		</CorvuDrawer>
	)
}
