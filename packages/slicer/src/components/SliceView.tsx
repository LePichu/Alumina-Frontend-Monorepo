import {
	createEffect,
	createMemo,
	createResource,
	createSignal,
	For,
	on,
	onMount,
	Show,
} from "solid-js"
import { createStore, reconcile } from "solid-js/store"
import Activity from "@carbon/icons/es/activity/16"
import Chip from "@carbon/icons/es/chip/16"
import PlayFilledAlt from "@carbon/icons/es/play--filled--alt/16"
import Renew from "@carbon/icons/es/renew/16"
import Rule from "@carbon/icons/es/rule/16"
import {
	Background,
	Button,
	CheckList,
	CheckListItem,
	ContentSwitcher,
	Icon,
	InlineLoading,
	InlineNotification,
	ScrollArea,
	StructuredListBody,
	StructuredListCell,
	StructuredListRow,
	StructuredListWrapper,
	Switch,
	Tile,
} from "@alumina/design"
import type { Severity } from "@alumina/design"
import { runOpen } from "../lib/board"
import type { OpenBoard } from "../lib/board"
import { isMicaError } from "../lib/mica"
import type { MicaOptions, MicaOptionSpec, MicaRun, MicaSeverity } from "../lib/mica"
import { partMeshes, partsOf, runKey } from "../lib/parts"
import { pictureOf } from "../lib/picture"
import { InkTile } from "./InkTile"
import { PartsTile } from "./PartsTile"
import { PrinterTile } from "./PrinterTile"
import { SettingsPanel } from "./SettingsPanel"
import type { OptionValue } from "./SettingsPanel"
import { useStudio } from "./Studio"
import { Viewport } from "./Viewport"

/** Which lane is on show when there is not room for all three.
 *
 *  The slicing view is three lanes side by side, and below `lg` they do not
 *  fit. So it shows what does: from `md`, one lane beside the stage; below
 *  that, one thing at a time. The lanes themselves do not change — the same
 *  three boxes, with a switcher choosing between them.
 */
type Pane = "setup" | "stage" | "run"

const PANES: Pane[] = ["setup", "stage", "run"]

/** What is inside a lane's scroller: its tiles in a column, with room round
 *  them for the hard shadows the scroller would otherwise clip. */
const LANE = "flex flex-col gap-gap pb-snug pl-rule pr-snug pt-rule"

/** Each lane's display at each width, as whole strings keyed by the pane that
 *  is chosen, so no two display utilities ever compete. From `@5xl` every lane
 *  is on show whatever the choice. */
const LEFT: Record<Pane, string> = {
	setup: "flex",
	// Beside the stage from `@3xl`: the stage always shows there, and Setup is
	// the lane that keeps it company unless Run was asked for.
	stage: "hidden @3xl:flex",
	run: "hidden @5xl:flex",
}

const STAGE: Record<Pane, string> = {
	setup: "hidden @3xl:block",
	stage: "block",
	run: "hidden @3xl:block",
}

const RIGHT: Record<Pane, string> = {
	setup: "hidden @5xl:flex",
	stage: "hidden @5xl:flex",
	run: "flex",
}

/** mica's three severities, as a check list draws them. */
const SEVERITY: Record<MicaSeverity, Severity> = {
	blocker: "error",
	warning: "warning",
	note: "note",
}

const plural = (count: number, one: string, many = `${one}s`) =>
	`${count} ${count === 1 ? one : many}`

/** A finding's kind, as a sentence starts. */
const sentence = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

export type SliceViewProps = {
	/** The board, as mica read it. A tab holds one board for as long as it is open. */
	open: OpenBoard
}

/** A board, being sliced by mica: the page a board's tab shows.
 *
 *  Three lanes — the machine and what to slice with on the left, what mica made
 *  in the middle, running it and what came of it on the right. It fills its
 *  page rather than the window, since the window's top and left edge are the
 *  shell's.
 *
 *  The board is converted as the page opens, at mica's defaults, and again on
 *  "Slice" with whatever options have been set since: a slice is asked for, as
 *  a slicer's is, rather than rerun on every keystroke. The same options are the
 *  same run, which mica answers from its store.
 *
 *  (It is the next screen due to move onto the 25/75 `Workspace`; see "The
 *  rework" in CLAUDE.md. The lanes here are the layout being replaced.)
 */
export function SliceView(props: SliceViewProps) {
	const studio = useStudio()
	// The grid is the default backdrop across all three apps; the sheet is what the
	// viewport's backdrop control switches to.
	const [sheet, setSheet] = createSignal(false)
	// On a narrow screen the board is what you came for, so it is what you get.
	const [pane, setPane] = createSignal<Pane>("stage")

	// What the operator has set. An option left out is mica's default.
	const [options, setOptions] = createStore<Partial<MicaOptions>>({})
	const [run, setRun] = createSignal<MicaRun>()
	const [running, setRunning] = createSignal(false)
	const [failure, setFailure] = createSignal<string>()

	const slice = async () => {
		setRunning(true)
		setFailure(undefined)
		try {
			setRun(await runOpen(props.open, { ...options }))
		} catch (error) {
			setFailure(error instanceof Error ? error.message : String(error))
			// A mica that is not there is the app's news, not this page's alone.
			if (isMicaError(error) && error.code === "unreachable") void studio.checkEngine()
		} finally {
			setRunning(false)
		}
	}
	onMount(() => void slice())

	/** An option as its field shows it: set here, else as the last run had it,
	 *  else mica's default. */
	const value = (spec: MicaOptionSpec): OptionValue =>
		(options as Record<string, OptionValue | undefined>)[spec.name] ??
			(run()?.options as Record<string, OptionValue> | undefined)?.[spec.name] ??
			spec.default

	/** Options set since the run on show, which a slice would change. */
	const stale = createMemo(() => {
		const current = run()
		if (!current) return false
		return Object.entries(options).some(
			([name, set]) =>
				set !== undefined && set !== (current.options as Record<string, unknown>)[name],
		)
	})

	// ---- the stage: one part of what mica made ----
	const parts = createMemo(() => {
		const current = run()
		return current ? partsOf(current) : []
	})
	const [picked, setPicked] = createSignal<string>()
	const part = createMemo(() => parts().find((entry) => entry.id === picked()) ?? parts()[0])
	const [meshes] = createResource(
		() => {
			const current = run()
			const shown = part()
			return current && shown ? { current, shown } : undefined
		},
		({ current, shown }) => partMeshes(current, shown),
	)
	// Only while there is a part: a run that made none leaves the resource holding
	// the last part it loaded, which is not this run's.
	const body = () => (part() && meshes.state === "ready" ? meshes().body : undefined)
	const ink = () => (part() && meshes.state === "ready" ? meshes().ink : undefined)
	const thickness = createMemo(() => {
		const geometry = body()
		if (!geometry) return 0
		geometry.computeBoundingBox()
		const box = geometry.boundingBox
		return box ? box.max.z - box.min.z : 0
	})
	/** Print layers in the part: its height over the run's layer height. */
	const layers = createMemo(() => {
		const height = run()?.options.layer_height ?? 0
		return height > 0 && thickness() > 0 ? Math.max(1, Math.round(thickness() / height)) : 1
	})
	// All of a part shows until the slider says otherwise; a new part starts whole.
	const [layer, setLayer] = createSignal<number>()
	createEffect(on(part, () => setLayer(undefined)))
	const shownLayer = () => Math.min(layer() ?? layers(), layers())

	// ---- the board's picture, for Home and its tab ----
	// Drawn from the first part of the run on show (the assembly, or the plate)
	// unless the board's picture is already of this run. A beat after the run,
	// for the same reason the stage waits: making the picture makes a WebGL
	// context, which holds the desktop window's frames.
	createEffect(on(run, (current) => {
		const first = current ? partsOf(current)[0] : undefined
		if (!current || !first) return
		const key = runKey(current)
		const entry = studio.recent.list().find((other) => other.id === props.open.id)
		if (entry?.picture && entry.pictureOf === key) return
		setTimeout(() => {
			void partMeshes(current, first).then(
				({ body }) => studio.recent.setPicture(props.open.id, pictureOf(body), key),
				() => undefined,
			)
		}, 600)
	}))

	const verdict = () => run()?.verdict
	const printable = () => verdict()?.printable ?? false
	const findings = () => run()?.diagnostics ?? []

	return (
		<>
			{/* The moving floor, or the still sheet: the viewport's backdrop control. */}
			<Background variant={sheet() ? "sheet" : "grid"} />

			{
				// The window: three lanes, fixed, never scrolling. pointer-events are off
				// on the grid so the stage behind the overlay stays draggable; each lane
				// turns them back on. grid-rows is explicit: left to itself the single
				// implicit row is content-sized, so it grows past the viewport, the lanes
				// never need to scroll internally, and the stage — whose only content is
				// absolutely positioned — collapses to zero height. The page is its own
				// container, and its lanes answer to its width, not the window's.
			}
			<div class="pointer-events-none relative z-10 h-full @container">
				<div class="grid h-full grid-rows-[auto_minmax(0,1fr)] gap-gap p-gap @3xl:grid-cols-[var(--spacing-lane)_minmax(0,1fr)] @5xl:grid-cols-[var(--spacing-lane)_minmax(0,1fr)_var(--spacing-lane)] @5xl:grid-rows-[minmax(0,1fr)]">
					{/* ---- the lane switcher, wherever the three do not fit ---- */}
					<div class="pointer-events-auto col-span-full pr-snug @5xl:hidden">
						<Tile flush>
							{/* One thing at a time. */}
							<ContentSwitcher
								flush
								class="@3xl:hidden"
								selectedIndex={PANES.indexOf(pane())}
								onChange={(index) => setPane(PANES[index] ?? "stage")}
							>
								<Switch text="Setup" class="flex-1" />
								<Switch text="Board" class="flex-1" />
								<Switch text="Run" class="flex-1" />
							</ContentSwitcher>
							{/* The board is always there; this picks its neighbour. */}
							<ContentSwitcher
								flush
								class="hidden @3xl:flex"
								selectedIndex={pane() === "run" ? 1 : 0}
								onChange={(index) => setPane(index === 1 ? "run" : "setup")}
							>
								<Switch text="Setup" class="flex-1" />
								<Switch text="Run" class="flex-1" />
							</ContentSwitcher>
						</Tile>
					</div>

					{/* ---- left lane: the machine, what to slice with, what came out ---- */}
					<div
						class={`pointer-events-auto min-h-0 flex-col @3xl:col-start-1 @3xl:row-start-2 @5xl:row-start-1
							${LEFT[pane()]}`}
					>
						{/* No fade: a lane has no ground of its own to wash. */}
						<ScrollArea fade={false} class={LANE}>
							<Show when={studio.printers()}>
								{(list) => (
									<PrinterTile
										printers={list()}
										index={studio.printer()}
										onSelect={studio.setPrinter}
									/>
								)}
							</Show>

							<SettingsPanel
								open={props.open}
								specs={studio.micaOptions.state === "ready" ? studio.micaOptions() : undefined}
								value={value}
								onOptionChange={(name, next) =>
									setOptions(name as keyof MicaOptions, next as never)}
								onOptionsReset={() => setOptions(reconcile({}))}
								modules={studio.modules() ?? []}
								machine={studio.machine}
								onMachineChange={(patch) => studio.setMachine(patch)}
							/>

							<PartsTile
								parts={parts()}
								selected={part()?.id}
								onSelect={setPicked}
								empty={run()?.outcome === "refused"
									? "mica refused to build this board at these options: see Findings."
									: running()
									? "Slicing…"
									: "Nothing yet: slice the board."}
							/>
						</ScrollArea>
					</div>

					{/* ---- centre: the stage ---- */}
					<div
						class={`pointer-events-auto relative min-h-0 @3xl:col-start-2 @3xl:row-start-2 @5xl:row-start-1
							${STAGE[pane()]}`}
					>
						<Viewport
							body={body()}
							ink={ink()}
							waiting={running() ? "Slicing" : "Loading the part"}
							error={run()?.outcome === "refused"
								? "Refused: no part was built at these options"
								: meshes.error
								? "The part could not be loaded from mica"
								: failure() && !run()
								? "mica made nothing: see Run"
								: undefined}
							layer={shownLayer()}
							layers={layers()}
							thickness={thickness()}
							onLayerChange={setLayer}
							sheet={sheet()}
							onBackdropToggle={() => setSheet((current) => !current)}
						/>
					</div>

					{/* ---- right lane: run it, what comes out, what's wrong ---- */}
					<div
						class={`pointer-events-auto min-h-0 flex-col @3xl:col-start-1 @3xl:row-start-2 @5xl:col-start-3
							@5xl:row-start-1 ${RIGHT[pane()]}`}
					>
						<ScrollArea fade={false} class={LANE}>
							<Tile
								heading={
									<>
										<Icon glyph={PlayFilledAlt} size={16} />Run
									</>
								}
								meta={run() ? `run ${run()?.run.slice(0, 8)}` : undefined}
							>
								<div class="grid grid-cols-2 gap-tight">
									<Button
										kind={stale() || !run() ? "primary" : "secondary"}
										size="sm"
										renderIcon={Renew}
										flat
										disabled={running()}
										onClick={() => void slice()}
									>
										Slice
									</Button>
									<Button
										kind="secondary"
										size="sm"
										renderIcon={Rule}
										flat
										disabled={running()}
										// Against the IPC-2581C schema, from now on: a document that
										// fails it is refused, and says why. It is the `validate` option,
										// so its switch shows it on.
										onClick={() => {
											setOptions("validate", true)
											void slice()
										}}
									>
										Validate
									</Button>
								</div>
								<div class="mt-tight grid grid-cols-[2fr_1fr] gap-tight">
									{/* Printing is shale's, and shale is not wired in. */}
									<Button kind="primary" size="sm" renderIcon={PlayFilledAlt} flat disabled>
										Print
									</Button>
									<Button
										kind="secondary"
										size="sm"
										renderIcon={Activity}
										flat
										onClick={() => studio.openJob(props.open)}
									>
										Job
									</Button>
								</div>

								<div class="mt-snug flex flex-col gap-tight">
									<Show when={running()}>
										<InlineLoading description="mica is slicing…" />
									</Show>
									<Show when={failure()}>
										{(message) => (
											<InlineNotification
												kind="error"
												title="Not sliced"
												subtitle={message()}
												onClose={() => setFailure(undefined)}
											/>
										)}
									</Show>
									<Show when={verdict()}>
										{(current) => (
											<p class={`m-0 text-label uppercase ${printable() ? "" : "font-bold"}`}>
												{current().text.replace(/^VERDICT:\s*/, "")}
											</p>
										)}
									</Show>
									<Show when={run()}>
										{(current) => (
											<p class="m-0 text-small opacity-muted">
												{current().outcome === "one_piece"
													? "one piece"
													: current().outcome === "refused"
													? "refused"
													: `laminated · ${plural(current().slabs.length, "slab")}`}
												{" · "}
												{current().stages
													.filter((stage) => !stage.cached)
													.map((stage) => `${stage.name} ${Math.round(stage.millis)} ms`)
													.join(" · ") || "from mica's store"}
											</p>
										)}
									</Show>
									<Show when={stale()}>
										<p class="m-0 text-small font-bold">Options changed since this slice.</p>
									</Show>
									<p class="m-0 text-small opacity-muted">
										Printing needs shale, which is not connected yet.
									</p>
								</div>
							</Tile>

							<Show when={run()}>{(current) => <InkTile run={current()} />}</Show>

							<Tile
								// The same floor the parts list has: see the left lane's note.
								class="flex min-h-40 flex-1 flex-col"
								flush
								fill
								heading={
									<>
										<Icon glyph={Rule} size={16} />Findings
									</>
								}
								meta={verdict()
									? `${verdict()?.blockers} block · ${verdict()?.warnings} warn · ${verdict()?.notes} note`
									: undefined}
							>
								<ScrollArea class="px-2 pb-2">
									<Show
										when={findings().length}
										fallback={
											<p class="m-0 pt-snug text-small opacity-muted">
												{run() ? "mica found nothing to report." : "Nothing yet: slice the board."}
											</p>
										}
									>
										{
											/* Severity is the glyph each row leads with — never a colour.
										    The kind is the finding's name; mica's message says the rest. */
										}
										<CheckList size="sm">
											<For each={findings()}>
												{(finding) => (
													<CheckListItem
														severity={SEVERITY[finding.severity]}
														detail={[finding.message, ...finding.detail].join(" ")}
													>
														<span class="text-small font-bold">{sentence(finding.kind)}</span>
													</CheckListItem>
												)}
											</For>
										</CheckList>
									</Show>
								</ScrollArea>
							</Tile>

							<Tile
								heading={
									<>
										<Icon glyph={Chip} size={16} />Board
									</>
								}
							>
								{/* Label and value, twice across, as the prototype pairs them. */}
								<div class="grid grid-cols-2 gap-x-snug">
									<For each={[figures().slice(0, 4), figures().slice(4)]}>
										{(column) => (
											<StructuredListWrapper aria-label="Board figures" isCondensed isFlush>
												<StructuredListBody>
													<For each={column}>
														{([label, figure]) => (
															<StructuredListRow>
																<StructuredListCell noWrap class="text-small opacity-muted">
																	{label}
																</StructuredListCell>
																<StructuredListCell
																	trailing
																	class="text-small font-bold tabular-nums"
																>
																	{figure}
																</StructuredListCell>
															</StructuredListRow>
														)}
													</For>
												</StructuredListBody>
											</StructuredListWrapper>
										)}
									</For>
								</div>
							</Tile>
						</ScrollArea>
					</div>
				</div>
			</div>
		</>
	)

	/** The board tile's eight figures, in reading order: four down the left, four
	 *  down the right. mica's reading of the board, and of the run on show. */
	function figures(): [label: string, figure: string][] {
		const board = props.open.board
		const size = run()?.size_mm ?? board.size_mm
		const known = (figure: number | null | undefined) =>
			figure === null || figure === undefined ? "—" : String(figure)
		return [
			["outline", size ? `${size.width}×${size.height}` : "—"],
			["layers", known(board.layers)],
			["drills", known(board.drills)],
			["vias", known(board.vias)],
			["thick", run() ? `${run()?.options.thickness}` : "—"],
			["slabs", run() ? String(run()?.slabs.length) : "—"],
			["ink mm³", run() ? (run()?.total_ink_mm3 ?? 0).toFixed(1) : "—"],
			["file kB", (board.bytes / 1024).toFixed(0)],
		]
	}
}
