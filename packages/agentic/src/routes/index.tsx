import { createMemo, createSignal, For, onCleanup, onMount, Show } from "solid-js"
import type { JSX } from "solid-js"
import BorderFull from "@carbon/icons/es/border--full/16"
import Chip from "@carbon/icons/es/chip/16"
import Close from "@carbon/icons/es/close/16"
import Cube from "@carbon/icons/es/cube/16"
import DocumentAdd from "@carbon/icons/es/document--add/16"
import Flash from "@carbon/icons/es/flash/16"
import Grid from "@carbon/icons/es/grid/16"
import Hourglass from "@carbon/icons/es/hourglass/16"
import Layers from "@carbon/icons/es/layers/16"
import Menu from "@carbon/icons/es/menu/16"
import Meter from "@carbon/icons/es/meter/16"
import Move from "@carbon/icons/es/move/16"
import PaintBrush from "@carbon/icons/es/paint-brush/16"
import Plug from "@carbon/icons/es/plug/16"
import Renew from "@carbon/icons/es/renew/16"
import Rule from "@carbon/icons/es/rule/16"
import Temperature from "@carbon/icons/es/temperature/16"
import Terminal from "@carbon/icons/es/terminal/16"
import View from "@carbon/icons/es/view/16"
import { Background, Button, Drawer, Icon, IconButton, ScrollArea, Tile } from "@alumina/design"
import type { CarbonGlyph } from "@alumina/design"
import { Composer } from "../components/Composer"
import { Rail, RailMark, RailSections } from "../components/Rail"
import { AgentTurn } from "../components/reply/AgentTurn"
import { Settings } from "../components/Settings"
import { CHIPS, PLACEHOLDERS } from "../fixtures/threads"
import { getReply, listThreads, route, streamReply } from "../lib/agent"
import type { FormAnswers, Mode, ModelId, ReplySection, Thread } from "../lib/agent"
import { getAccount } from "../lib/workspace"
import type { Where } from "../lib/workspace"

/** Chips carry a glyph name; the mapping to a descriptor lives here so the
 *  fixtures stay free of imports and the set stays tree-shakeable. */
const GLYPHS: Record<string, CarbonGlyph> = {
	flash: Flash,
	chip: Chip,
	temperature: Temperature,
	move: Move,
	renew: Renew,
	plug: Plug,
	meter: Meter,
	rule: Rule,
	view: View,
	layers: Layers,
	"border--full": BorderFull,
	"paint-brush": PaintBrush,
	grid: Grid,
	hourglass: Hourglass,
	cube: Cube,
}

type LiveTurn =
	| { role: "user"; text: string }
	| {
		role: "agent"
		replyId: string
		sections: ReplySection[]
		streaming: boolean
		answers?: FormAnswers
	}

/** The prototype's five bands. Computed on the client as well as the server, so
 *  a page rendered at 23:59 does not keep greeting you with yesterday. */
function partOfDay(hour: number): string {
	if (hour < 5) return "Still up"
	if (hour < 12) return "Good morning"
	if (hour < 17) return "Good afternoon"
	if (hour < 22) return "Good evening"
	return "Late shift"
}

export default function Kiln() {
	const threads = listThreads()
	const account = getAccount()

	const [model, setModel] = createSignal<ModelId>("perun")
	const [mode, setMode] = createSignal<Mode>("design")
	const [where, setWhere] = createSignal<Where>("local")
	const [printer, setPrinter] = createSignal("bench")
	const [settingsOpen, setSettingsOpen] = createSignal(false)
	// The rail as a drawer, on screens too narrow to stand it beside the chat.
	const [railOpen, setRailOpen] = createSignal(false)
	const [prompt, setPrompt] = createSignal("")
	const [turns, setTurns] = createSignal<LiveTurn[]>([])
	const [open, setOpen] = createSignal(false)
	const [title, setTitle] = createSignal("")
	/** When a stored thread is open, when it was — the tail of its summary. A live
	 *  conversation has no such age, so this is empty for one. */
	const [age, setAge] = createSignal("")
	const [activeId, setActiveId] = createSignal<string>()
	const [greeting, setGreeting] = createSignal(partOfDay(new Date().getHours()))

	onMount(() => setGreeting(partOfDay(new Date().getHours())))

	let controller: AbortController | undefined
	onCleanup(() => controller?.abort())

	/** The head's right-hand meta: how far in, on which model. */
	const userTurns = createMemo(() => turns().filter((turn) => turn.role === "user").length)

	/** Threads replay instantly: no streaming, answers shown as given. */
	const replay = (thread: Thread) => {
		controller?.abort()
		setModel(thread.model)
		setTitle(thread.title)
		setAge(thread.summary.split(" · ").at(-1) ?? "")
		setActiveId(thread.id)
		setTurns(
			thread.turns.map((turn): LiveTurn =>
				turn.role === "user" ? { role: "user", text: turn.text } : {
					role: "agent",
					replyId: turn.replyId,
					sections: getReply(turn.replyId)?.sections ?? [],
					streaming: false,
					// A replayed thread shows its form as it was answered, not at
					// its defaults — that is what makes it a transcript.
					answers: turn.answers,
				}
			),
		)
		setOpen(true)
	}

	/** Back to the home screen: the composer travels with it, so the draft
	 *  survives and the thread list drops its selection. */
	const close = () => {
		controller?.abort()
		setOpen(false)
		setTurns([])
		setTitle("")
		setAge("")
		setActiveId(undefined)
	}

	const run = async (replyId: string) => {
		controller?.abort()
		controller = new AbortController()
		const reply = getReply(replyId)
		if (!reply) return

		setTurns((current) => [
			...current,
			{ role: "agent", replyId, sections: [], streaming: true },
		])

		for await (const section of streamReply(replyId, { signal: controller.signal })) {
			setTurns((current) =>
				current.map((turn, index) =>
					index === current.length - 1 && turn.role === "agent"
						? { ...turn, sections: [...turn.sections, section] }
						: turn
				)
			)
		}

		setTurns((current) =>
			current.map((turn, index) =>
				index === current.length - 1 && turn.role === "agent" ? { ...turn, streaming: false } : turn
			)
		)
	}

	const ask = (text: string) => {
		if (text.trim() === "") return
		// The first prompt names the thread, as it does in the prototype.
		if (turns().length === 0) setTitle(text)
		setOpen(true)
		setTurns((current) => [...current, { role: "user", text }])
		setPrompt("")
		// Which reply a prompt lands on is the fixture's job, not the component's:
		// route() is the seam a real model replaces.
		void run(route(text))
	}

	const composer = (docked: boolean) => (
		<Composer
			docked={docked}
			value={prompt()}
			placeholder={docked ? "Reply, or ask it to change something…" : PLACEHOLDERS[mode()]}
			mode={mode()}
			model={model()}
			onInput={setPrompt}
			onModeChange={setMode}
			onModelChange={setModel}
			onSubmit={() => ask(prompt())}
		/>
	)

	return (
		<>
			<Background variant="grid" />

			{
				/* The window: rail and main column, fixed, never scrolling as a page.
			    grid-rows is explicit — left implicit the single row is content-sized,
			    so the column grows past the viewport instead of scrolling inside it. */
			}
			<main class="fixed inset-0 z-10 grid grid-rows-[auto_minmax(0,1fr)] gap-gap p-gap lg:grid-cols-[var(--spacing-lane)_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)]">
				{
					/* Below lg the rail does not stand beside the chat — it is reference,
				    and the composer is the screen's job — so a bar takes its place: the
				    wordmark, a new board, and the way to the rail, which opens as a
				    drawer. Nothing the rail does is out of reach on a phone. */
				}
				<div class="pr-snug lg:hidden">
					<Tile flush>
						<div class="flex items-stretch">
							<span class="on-ink flex items-center gap-snug bg-ink px-2 py-snug text-micro font-bold uppercase text-white">
								<RailMark />
							</span>
							<span class="ml-auto flex items-stretch">
								<IconButton
									label="New board"
									renderIcon={DocumentAdd}
									kind="ghost"
									align="bottom"
									onClick={close}
								/>
								<IconButton
									label="Threads and settings"
									renderIcon={Menu}
									kind="ghost"
									align="bottom-end"
									onClick={() => setRailOpen(true)}
								/>
							</span>
						</div>
					</Tile>
				</div>

				<div class="hidden min-h-0 flex-col pb-snug pl-rule pr-snug pt-rule lg:flex">
					<Rail
						threads={threads}
						activeId={activeId()}
						where={where()}
						printer={printer()}
						onOpenThread={replay}
						onNewBoard={close}
						onWhereChange={setWhere}
						onPrinterChange={setPrinter}
						onOpenSettings={() => setSettingsOpen(true)}
					/>
				</div>

				<div class="flex min-h-0 min-w-0 flex-col pb-snug pl-rule pr-snug pt-rule">
					<Show
						when={open()}
						fallback={
							/* ---- home: the greeting, the composer, the suggestions ---- */


								<section class="flex min-h-0 flex-1 flex-col items-center justify-center gap-gap">
									<div class="flex w-full max-w-176 flex-col gap-gap">
										<h1 class="m-0 flex items-center justify-center gap-snug text-brand font-normal">
											<span
												aria-hidden="true"
												class="grid size-6 shrink-0 place-items-center bg-ink text-white"
											>
												<Icon glyph={Chip} size={16} />
											</span>
											<span>
												{greeting()}, {account.handle}.{" "}
												<b class="font-bold">What are we building?</b>
											</span>
										</h1>
										{composer(false)}
									</div>

									{
										/* Suggestions fill the composer rather than sending: the prompt
								    is a starting point, not a command. */
									}
									{
										/* gap-2, not gap-tight: every chip carries the hard shadow, and at
								    4px the shadow of one row landed on the chip below it. Nothing
								    with a shadow may sit closer to its neighbour than the shadow is
								    deep. */
									}
									<div class="flex w-full max-w-184 flex-wrap justify-center gap-2">
										<For each={CHIPS[mode()]}>
											{(chip) => (
												<Button
													content
													kind="secondary"
													renderIcon={GLYPHS[chip.icon]}
													onClick={() => setPrompt(chip.prompt)}
												>
													{chip.prompt}
												</Button>
											)}
										</For>
									</div>
								</section>

						}
					>
						{/* ---- chat: its own bordered tile, opened with a clip-path reveal ---- */}
						<Tile
							bar
							flush
							fill
							class="flex min-h-0 flex-1 animate-reveal flex-col"
							heading={
								<>
									<Icon glyph={Terminal} size={16} />
									<span class="truncate">{title()}</span>
								</>
							}
							meta={`${userTurns()} turn${userTurns() === 1 ? "" : "s"} · ${model()}${
								age() ? ` · ${age()}` : ""
							}`}
							action={
								<IconButton
									label="Close"
									renderIcon={Close}
									kind="ghost--inverse"
									hideTooltip
									onClick={close}
								/>
							}
						>
							<Feed>
								<For each={turns()}>
									{(turn, index) => (
										<Show
											when={turn.role === "agent" ? turn : undefined}
											fallback={
												/* What you said: the one inverted tile on the screen, set
											   against the right edge and the agent's white replies. */


													<Tile inverse flush class="max-w-128 self-end">
														<p class="m-0 whitespace-pre-wrap px-2 py-snug text-body">
															{turn.role === "user" ? turn.text : ""}
														</p>
													</Tile>

											}
										>
											{(agent) => (
												<AgentTurn
													model={model()}
													thinking={getReply(agent().replyId)?.thinking ?? ""}
													sections={agent().sections}
													streaming={agent().streaming}
													answers={agent().answers}
													// Addressed by index. Object identity would not survive the
													// map that replaces turn objects as sections stream in, so
													// `t === agent()` could silently match nothing.
													onSubmitForm={(submission) => {
														const at = index()
														setTurns((current) => [
															...current.map((t, i) =>
																i === at && t.role === "agent"
																	? { ...t, answers: submission.answers }
																	: t
															),
															// Answering is a turn, not a side channel: what the form
															// amounts to is said out loud before the agent replies,
															// which is also how the stored threads record it.
															{ role: "user" as const, text: submission.said },
														])
														if (submission.next) void run(submission.next)
													}}
												/>
											)}
										</Show>
									)}
								</For>
							</Feed>

							<div class="border-t-2 border-ink p-snug">{composer(true)}</div>
						</Tile>
					</Show>
				</div>
			</main>

			{
				/* The same rail, as a drawer. Anything in it that takes you somewhere —
			    a thread, a new board, settings — closes it on the way. */
			}
			<Drawer open={railOpen()} onClose={() => setRailOpen(false)} label={<RailMark />} flush>
				<div class="flex h-full min-h-0 flex-col">
					<RailSections
						threads={threads}
						activeId={activeId()}
						where={where()}
						printer={printer()}
						onOpenThread={(thread) => {
							setRailOpen(false)
							replay(thread)
						}}
						onNewBoard={() => {
							setRailOpen(false)
							close()
						}}
						onWhereChange={setWhere}
						onPrinterChange={setPrinter}
						onOpenSettings={() => {
							setRailOpen(false)
							setSettingsOpen(true)
						}}
					/>
				</div>
			</Drawer>

			<Settings
				open={settingsOpen()}
				model={model()}
				where={where()}
				printer={printer()}
				onModelChange={setModel}
				onWhereChange={setWhere}
				onPrinterChange={setPrinter}
				onClose={() => setSettingsOpen(false)}
			/>
		</>
	)
}

/** The transcript, in a column no wider than a paragraph wants to be. */
function Feed(props: { children?: JSX.Element }) {
	return (
		<ScrollArea pin class="px-tight">
			{
				/* Turns sit a long way apart — the prototype's 1.35rem, rounded to 24px.
			    Each reply is a shadowed tile, so a tight gap both collides the shadow
			    with the next tile and loses the boundary between one exchange and the
			    next. */
			}
			<div class="mx-auto flex w-full max-w-184 flex-col gap-6 pb-gap pt-2">
				{props.children}
			</div>
		</ScrollArea>
	)
}
