import { For, Show } from "solid-js"
import DocumentAdd from "@carbon/icons/es/document--add/16"
import Home from "@carbon/icons/es/home/16"
import PrinterIcon from "@carbon/icons/es/printer/16"
import Rule from "@carbon/icons/es/rule/16"
import SettingsIcon from "@carbon/icons/es/settings/16"
import Time from "@carbon/icons/es/time/16"
import User from "@carbon/icons/es/user/16"
import Wifi from "@carbon/icons/es/wifi/16"
import {
	Avatar,
	Button,
	ContentSwitcher,
	IconButton,
	ScrollArea,
	Select,
	SelectItem,
	Swatch,
	Switch,
	TextInput,
	Tile,
	TileSection,
} from "@alumina/design"
import avatarUrl from "../fixtures/avatar.jpg?url"
import { describeWhere, getAccount, getMachine, getProcess, listPrinters } from "../lib/workspace"
import type { Where } from "../lib/workspace"
import type { Thread } from "../lib/agent"

const WHERE_ORDER: Where[] = ["local", "remote"]

export type RailProps = {
	threads: Thread[]
	/** The thread currently replayed, if any. */
	activeId?: string
	where: Where
	printer: string
	onOpenThread: (thread: Thread) => void
	onNewBoard: () => void
	onWhereChange: (where: Where) => void
	onPrinterChange: (id: string) => void
	onOpenSettings: () => void
}

/** kiln's left rail: one bordered tile ruled into sections.
 *
 *  It is a single object, not a stack of tiles — mica's left lane is the stack,
 *  and the difference is deliberate. mica's panels are things you act on
 *  separately; these are one standing description of the workspace, so they share
 *  a border and divide with rules.
 *
 *  Each band is a TileSection. This file used to define its own.
 */
export function Rail(props: RailProps) {
	return (
		<Tile
			bar
			flush
			fill
			class="flex min-h-0 flex-1 flex-col"
			heading={<RailMark />}
			meta="v0.1"
		>
			<RailSections {...props} />
		</Tile>
	)
}

/** The wordmark. On the rail's ink bar on a desktop; on the top bar and the
 *  drawer's bar on a phone, where the rail has no room to stand. */
export function RailMark() {
	return (
		<>
			<b class="text-brand normal-case">kiln</b>
			<small class="text-micro opacity-muted">agent</small>
		</>
	)
}

/** The rail's bands, without the tile around them.
 *
 *  Split out because the rail goes two places. Beside the chat it is a Tile;
 *  on a phone it is the body of a Drawer, which is already a box with an ink
 *  bar — and a tile inside that would be a box in a box with two headers.
 */
export function RailSections(props: RailProps) {
	const account = getAccount()
	const copy = () => describeWhere(props.where)

	return (
		<>
			<TileSection>
				<Button
					kind="primary"
					renderIcon={DocumentAdd}
					flat
					class="w-full justify-center"
					onClick={props.onNewBoard}
				>
					New board
				</Button>
			</TileSection>

			{
				/* Threads take whatever height is left, so the sections below stay pinned
			    to the bottom of the rail however few threads there are. */
			}
			<TileSection renderIcon={Time} heading="Threads" meta={String(props.threads.length)} grow>
				<ScrollArea class="pr-tight">
					<For each={props.threads}>
						{(thread) => (
							<Button
								content
								flat
								// The open thread is ink-on-white inverted, which is the same
								// pressed state every other control in the system uses.
								kind={props.activeId === thread.id ? "primary" : "tertiary"}
								aria-pressed={props.activeId === thread.id}
								onClick={() => props.onOpenThread(thread)}
								class="mb-tight w-full text-left"
							>
								<span class="min-w-0 flex-1 truncate">{thread.title}</span>
								<span class="shrink-0 pl-2 text-micro opacity-muted">{thread.summary}</span>
							</Button>
						)}
					</For>
				</ScrollArea>
			</TileSection>

			<TileSection renderIcon={Rule} heading="Process" meta={getMachine()}>
				{/* Reported by the machine on connect, so each is a read-only field. */}
				<For each={getProcess()}>
					{(rule) => (
						<TextInput inline size="sm" readOnly labelText={rule.label} value={rule.value} />
					)}
				</For>
			</TileSection>

			<TileSection renderIcon={PrinterIcon} heading="Hand-off">
				<Select
					labelText="Printer"
					hideLabel
					size="sm"
					value={props.printer}
					onChange={props.onPrinterChange}
				>
					<For each={listPrinters()}>
						{(printer) => <SelectItem value={printer.id} text={printer.name} />}
					</For>
				</Select>
				<State class="mt-tight" on label="Ready" meta="USB" />
			</TileSection>

			<TileSection renderIcon={User} heading="Account" meta={props.where}>
				<ContentSwitcher
					size="sm"
					class="w-full"
					selectedIndex={WHERE_ORDER.indexOf(props.where)}
					onChange={(index) =>
						props.onWhereChange(WHERE_ORDER[index] ?? "local")}
				>
					<Switch text="Local" renderIcon={Home} class="flex-1" />
					<Switch text="Remote" renderIcon={Wifi} class="flex-1" />
				</ContentSwitcher>
				<State class="mt-tight" on label={copy().status} meta={copy().meta} />
			</TileSection>

			{/* The rail's foot: who is signed in, and the way into settings. */}
			<TileSection>
				<div class="flex items-center gap-2">
					<Avatar image={avatarUrl} name={account.handle} />
					<span class="flex min-w-0 flex-1 flex-col">
						<span class="truncate text-small font-bold">{account.handle}</span>
						<span class="text-micro uppercase opacity-muted">signed in · {props.where}</span>
					</span>
					<IconButton
						label="Settings"
						renderIcon={SettingsIcon}
						kind="secondary"
						align="top"
						onClick={props.onOpenSettings}
					/>
				</div>
			</TileSection>
		</>
	)
}

/** A connection state: filled square when live, label, and the transport or
 *  count dimmed on the right. */
function State(props: { on?: boolean; label: string; meta?: string; class?: string }) {
	return (
		<p class={`m-0 flex items-center gap-tight text-small ${props.class ?? ""}`}>
			<Swatch fill={props.on ? "solid" : "open"} label={props.on ? "live" : "not live"} />
			<span class="min-w-0 truncate">{props.label}</span>
			<Show when={props.meta}>
				<span class="ml-auto shrink-0 pl-2 opacity-muted">{props.meta}</span>
			</Show>
		</p>
	)
}
