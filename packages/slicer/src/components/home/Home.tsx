import { createMemo, createResource, createSignal, For, Show } from "solid-js"
import Clean from "@carbon/icons/es/clean/16"
import Email from "@carbon/icons/es/email/16"
import FolderOpen from "@carbon/icons/es/folder--open/16"
import RowDelete from "@carbon/icons/es/row--delete/16"
import Time from "@carbon/icons/es/time/16"
import {
	ActionableNotification,
	Background,
	Button,
	ClickableTile,
	CodeSnippet,
	ContainedList,
	ContainedListItem,
	FileDrop,
	FileDropCover,
	FileUploaderDropContainer,
	Icon,
	IconButton,
	InlineNotification,
	Menu,
	MenuItem,
	Modal,
	ScrollArea,
	Search,
	SkeletonPlaceholder,
	Tag,
	Tile,
	TileSection,
	useContextMenu,
	Workspace,
} from "@alumina/design"
import type { CarbonGlyph } from "@alumina/design"
import { getAccount, listNews } from "../../lib/cloud"
import { BOARD_FILES, pickFiles } from "../../lib/files"
import { micaRoute } from "../../lib/mica"
import { ago } from "../../lib/recent"
import type { RecentBoard } from "../../lib/recent"
import { PrinterTile } from "../PrinterTile"
import { useStudio } from "../Studio"
import { StartPane } from "./StartPane"

/** The home screen, on the 25/75 workspace: what you can start with on the
 *  left, and on the right what you were working on, what is new, and the
 *  machine.
 *
 *  The right column is a grid of three by three: the recent projects take the
 *  top two rows, all the way across, and the bottom row is split in half — the
 *  newsletter, and the printer. Each area scrolls on its own; the column does
 *  not. When the column is too narrow for that (under 36rem of its own width:
 *  a phone) the three stack and the column scrolls instead.
 *
 *  The whole column takes a dropped board, anywhere in it, and every board
 *  dropped opens in a tab of its own. While a file is held over the column the
 *  recent projects give way to the dropper — that is where a board opened this
 *  way will join them. There is no drop box standing in the gallery: dropping
 *  is a mouse's gesture, and "Open project…" on the left is the way in for
 *  everyone else.
 */
export function Home() {
	const studio = useStudio()

	const openFiles = studio.openFiles

	return (
		<>
			{/* A screen you arrive at gets the moving floor. */}
			<Background variant="grid" static={!studio.motion()} />
			<Workspace
				asideLabel="Start"
				class="relative z-10 h-full p-gap"
				aside={<StartPane onOpenFiles={openFiles} />}
			>
				<FileDrop
					accept={BOARD_FILES}
					label="Drop to open in a new tab"
					onDrop={openFiles}
					onReject={(files) =>
						studio.setNotice({
							kind: "error",
							title: `${files.map((file) => file.name).join(", ")}: not IPC-2581`,
							subtitle: "Boards open from .xml or .cvg files exported as IPC-2581.",
						})}
					class="flex min-h-0 flex-1 flex-col"
				>
					{
						/* No fade: the column has no ground of its own, only the floor. It
					    scrolls only while the areas are stacked; side by side they fill
					    it exactly, and each scrolls itself. */
					}
					{
						/* The pane is padded so the tiles' shadows and focus rings are not
					    cut off by its edge — and pulled out by the same amounts, so the
					    padding lies in the workspace's gutter and the tiles meet the
					    column's edges, top and bottom level with the start pane. */
					}
					<ScrollArea
						fade={false}
						frameClass="-mb-snug -ml-rule -mr-snug -mt-rule flex-1"
						class="flex flex-col gap-gap pb-snug pl-rule pr-snug pt-rule @container"
					>
						{
							/* mica is what opens a board, so its absence is said first, with
						    the way to fix it. (A first-run setup screen will take this over.) */
						}
						<Show when={studio.engine().state === "down"}>
							<ActionableNotification
								inline
								kind="warning"
								title="mica is not running"
								subtitle={
									<>
										Boards open through it. Start it with{" "}
										<CodeSnippet type="inline" code="mica serve" />
										{micaRoute().via === "proxy"
											? ` — this dev server passes requests on to ${micaRoute().target}.`
											: ` — foundry looks for it at ${micaRoute().target}.`}
									</>
								}
								actionButtonLabel="Check again"
								onActionButtonClick={() => void studio.checkEngine()}
								hideCloseButton
								hasFocus={false}
							/>
						</Show>
						<Show when={studio.notice()}>
							{(notice) => (
								<InlineNotification
									kind={notice().kind}
									title={notice().title}
									subtitle={notice().subtitle}
									onClose={() => studio.setNotice(undefined)}
								/>
							)}
						</Show>
						<div class="grid grid-cols-1 gap-gap @xl:min-h-0 @xl:flex-1 @xl:grid-cols-2 @xl:grid-rows-[minmax(0,2fr)_minmax(0,1fr)]">
							<Projects onOpenFiles={openFiles} />
							<Newsletter />
							<Show when={studio.printers.state === "ready" ? studio.printers() : undefined}>
								{(list) => (
									<PrinterTile
										printers={list()}
										index={studio.printer()}
										onSelect={studio.setPrinter}
										class="@xl:min-h-0"
									/>
								)}
							</Show>
						</div>
					</ScrollArea>
				</FileDrop>
			</Workspace>
		</>
	)
}

/** What was opened here lately, newest first, as small pictures: a filter, then
 *  the gallery. Before anything has been opened, the gallery is a drop box. */
function Projects(props: { onOpenFiles: (files: File[]) => void }) {
	const studio = useStudio()
	const [query, setQuery] = createSignal("")
	const [clearing, setClearing] = createSignal(false)
	const list = () => studio.recent.list()

	const shown = createMemo(() => {
		const words = query().trim().toLowerCase()
		return words
			? list().filter((entry) => `${entry.name} ${entry.file}`.toLowerCase().includes(words))
			: list()
	})

	return (
		<Tile
			bar
			flush
			fill
			heading={<Heading glyph={Time} label="Recent projects" />}
			meta={query().trim() ? `${shown().length} of ${list().length}` : String(list().length)}
			class="flex flex-col @xl:col-span-2 @xl:min-h-0"
		>
			<TileSection>
				<div class="flex items-center gap-2">
					{/* Bare: the section's own rule beneath is the field's. */}
					<Search
						bare
						size="sm"
						labelText="Find a recent project"
						hideLabel
						placeholder="Find by name or file"
						value={query()}
						onInput={setQuery}
						onClear={() => setQuery("")}
						class="min-w-0 flex-1"
					/>
					<IconButton
						label="Clear recent projects"
						renderIcon={Clean}
						kind="ghost"
						size="sm"
						align="bottom-end"
						flat
						disabled={!list().length}
						onClick={() => setClearing(true)}
					/>
				</div>
			</TileSection>

			{/* Asked first: the list cannot be had back. The files are not touched. */}
			<Modal
				open={clearing()}
				size="xs"
				danger
				modalHeading="Clear recent projects?"
				primaryButtonText="Clear"
				secondaryButtonText="Cancel"
				onRequestClose={() => setClearing(false)}
				onRequestSubmit={() => {
					studio.recent.clear()
					setQuery("")
					setClearing(false)
				}}
			>
				<p class="m-0">
					{list().length === 1
						? "foundry forgets this board, and the copy of its document it kept."
						: `foundry forgets these ${list().length} boards, and the copies of their documents it kept.`}
					{" "}
					The files themselves are not touched, and a board open in a tab stays open.
				</p>
			</Modal>

			{/* Positioned, for the dropper that covers it while a file is held. */}
			<TileSection grow flush class="relative min-h-48 @xl:min-h-0">
				<Show
					when={list().length}
					fallback={
						<FileUploaderDropContainer
							accept={BOARD_FILES}
							multiple
							onAddFiles={props.onOpenFiles}
							onPick={() => pickFiles(BOARD_FILES, true)}
							class="grid flex-1 p-2"
							labelText={
								<>
									<b class="block text-body font-bold">Nothing opened yet</b>
									<span class="mt-tight block text-small opacity-muted">
										Drop an IPC-2581 file here, or press to choose one.
									</span>
								</>
							}
						/>
					}
				>
					<ScrollArea class="p-2">
						<Show
							when={shown().length}
							fallback={<p class="m-0 text-small opacity-muted">No recent project matches that.</p>}
						>
							{
								/* As many 10rem columns as fit: the cards keep their size and a
							    wide window gets a longer row. A phone has room for one of those,
							    and one card the width of the screen is a poster, so it has two. */
							}
							<div class="grid grid-cols-2 gap-gap @sm:grid-cols-[repeat(auto-fill,minmax(10rem,1fr))]">
								<For each={shown()}>{(entry) => <ProjectCard entry={entry} />}</For>
							</div>
						</Show>
					</ScrollArea>
				</Show>
				<FileDropCover />
			</TileSection>
		</Tile>
	)
}

/** One recent board: its picture on the sheet, what it is, and when. The whole
 *  card opens it again, from its kept document; its context menu (the secondary
 *  button, or Shift+F10 on the card) also takes it off the list. */
function ProjectCard(props: { entry: RecentBoard }) {
	const studio = useStudio()
	const [opening, setOpening] = createSignal(false)
	const [card, setCard] = createSignal<HTMLElement>()
	const menu = useContextMenu(card)
	const open = async () => {
		if (opening()) return
		setOpening(true)
		await studio.openRecent(props.entry)
		setOpening(false)
	}
	const facts = () =>
		[
			props.entry.layers === null ? undefined : `${props.entry.layers} layers`,
			props.entry.size ? `${props.entry.size.width}×${props.entry.size.height} mm` : undefined,
		].filter(Boolean).join(" · ") || props.entry.file

	return (
		// The card is the context menu's target; a ClickableTile takes no ref.
		// The card fills its cell, both ways: every card in a row the same size.
		<div ref={setCard} class="flex min-w-0 flex-col">
			<ClickableTile flat onClick={() => void open()} class="min-w-0 flex-1">
				{
					/* 16:10, on the still sheet as a slicer draws its plate. Its picture is
			    drawn by its first slice; until then, the sheet. */
				}
				<span class="blueprint-sheet block aspect-16/10 w-full border-b-2 border-ink">
					<Show when={opening()}>
						<SkeletonPlaceholder class="size-full" />
					</Show>
					<Show when={!opening() && props.entry.picture}>
						{(url) => <img src={url()} alt="" class="block size-full object-contain" />}
					</Show>
				</span>
				<span class="flex flex-col p-snug">
					<b class="truncate text-small font-bold group-hover:underline">{props.entry.name}</b>
					<span class="truncate text-micro opacity-muted">{facts()}</span>
					<span class="truncate text-micro opacity-muted">{ago(props.entry.openedAt)}</span>
				</span>
			</ClickableTile>
			<Menu label={`${props.entry.name}`} {...menu}>
				<MenuItem label="Open" renderIcon={FolderOpen} onClick={() => void open()} />
				<MenuItem
					label="Remove from recent"
					renderIcon={RowDelete}
					onClick={() => studio.recent.forget(props.entry.id)}
				/>
			</Menu>
		</div>
	)
}

/** The newsletter: releases, the monthly letter, the community's boards — and
 *  the way to have it sent. */
function Newsletter() {
	const studio = useStudio()
	const [news] = createResource(() => listNews())
	const [account] = createResource(() => getAccount())

	return (
		<Tile
			bar
			flush
			fill
			heading={<Heading glyph={Email} label="Newsletter" />}
			meta="monthly"
			class="flex flex-col @xl:min-h-0"
		>
			<TileSection grow flush>
				<ScrollArea>
					{/* Disclosed: the section has no padding, so the rows bring their own. */}
					<ContainedList size="sm" kind="disclosed">
						<For each={news.state === "ready" ? news() : []}>
							{(item) => (
								<ContainedListItem>
									<span class="flex min-w-0 flex-col gap-tight">
										<span class="flex items-center gap-2">
											{/* Solid: it says what the item is. */}
											<Tag size="sm" solid>{item.kind}</Tag>
											<span class="ml-auto text-micro opacity-muted">{item.date}</span>
										</span>
										<b class="text-small font-bold">{item.title}</b>
										<span class="text-small opacity-muted">{item.body}</span>
									</span>
								</ContainedListItem>
							)}
						</For>
					</ContainedList>
				</ScrollArea>
			</TileSection>
			<TileSection>
				<span class="flex items-center gap-2">
					<span class="min-w-0 flex-1 truncate text-small opacity-muted">
						To {account.state === "ready" ? account().email : "your account"}
					</span>
					<Button kind="secondary" size="sm" flat onClick={() => void studio.subscribe()}>
						Subscribe
					</Button>
				</span>
			</TileSection>
		</Tile>
	)
}

/** A tile's heading in this app leads with a glyph. */
function Heading(props: { glyph: CarbonGlyph; label: string }) {
	return (
		<>
			<Icon glyph={props.glyph} size={16} />
			{props.label}
		</>
	)
}
