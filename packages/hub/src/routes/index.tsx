import { createAsync } from "@solidjs/router"
import { For, Show } from "solid-js"
import ChevronDown from "@carbon/icons/es/chevron--down/16"
import Chip from "@carbon/icons/es/chip/16"
import Fork from "@carbon/icons/es/fork/16"
import Printer from "@carbon/icons/es/printer/16"
import Rule from "@carbon/icons/es/rule/16"
import SearchIcon from "@carbon/icons/es/search/16"
import Upload from "@carbon/icons/es/upload/16"
import { Button, ClickableTile, Icon, InlineLoading } from "@alumina/design"
import { BoardHero } from "../components/BoardHero"
import { BoardTile } from "../components/BoardTile"
import { Counters } from "../components/Counters"
import { SectionHead } from "../components/SectionHead"
import { Shell } from "../components/Shell"
import { listBoards } from "../lib/quarry"
import type { Board } from "../lib/quarry"

/** quarry's home: a Steam-style hero with a board printing itself, then
 *  GitHub-style 2×2 tiles. Deliberately not the three-column fixed-pane layout
 *  the prototype started with — that was dropped in review. */
export default function Home() {
	const boards = createAsync(() => listBoards())
	const featured = () => boards()?.[0]

	const sum = (pick: (board: Board) => number) =>
		(boards() ?? []).reduce((total, board) => total + pick(board), 0)

	return (
		<Shell>
			<section class="grid grid-cols-1 items-center gap-8 py-14 lg:grid-cols-2">
				<div>
					<h1 class="m-0 text-headline font-bold sm:text-hero">
						Every board,<br />
						<em class="not-italic opacity-60">printed or fabbed.</em>
					</h1>
					<p class="m-0 mt-6 max-w-prose text-body opacity-80">
						A home for boards and the sources behind them. Publish IPC-2581 or Gerber with the
						project files that made it, and anyone can read it, fork it, or build it — on a desktop
						printer or at a traditional fab. Both are first-class here.
					</p>
					<div class="mt-6 flex flex-wrap gap-2">
						<Button kind="primary" renderIcon={Upload} href="/new">Publish a board</Button>
						<Button kind="secondary" renderIcon={SearchIcon} href="/search">
							Browse {boards()?.length ?? 0}
						</Button>
					</div>

					<Counters
						class="mt-8"
						counters={[
							{ glyph: Chip, value: boards()?.length ?? 0, label: "boards" },
							{
								glyph: Printer,
								value: sum((board) => board.prints).toLocaleString(),
								label: "prints",
							},
							{ glyph: Fork, value: sum((board) => board.forks), label: "forks" },
							{ glyph: Rule, value: 3, label: "processes" },
						]}
					/>
				</div>

				{
					/* The pitch: a real board mesh, printing. It runs once and rests — a
				    hero that keeps re-printing reads as a loading state that never
				    finishes. No frame around it; the board is the picture. */
				}
				<Show when={featured()}>
					{(board) => <BoardHero board={board().slug} sweep class="h-88 w-full" />}
				</Show>
			</section>

			<SectionHead
				title="Boards"
				action={<Button kind="ghost" size="sm">Sort: recently updated</Button>}
			/>

			<div class="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
				<Show when={boards()} fallback={<InlineLoading description="Loading boards…" />}>
					{(list) => (
						<>
							<For each={list()}>{(board) => <BoardTile board={board} />}</For>

							{/* The publish affordance is the last slot in the grid, not a nav button. */}
							<ClickableTile
								href="/new"
								placeholder
								class="flex flex-col items-center justify-center gap-2 p-6 text-center"
							>
								<Icon glyph={Upload} size={32} />
								<b class="text-figure font-bold tracking-tight">Publish a board</b>
								<p class="m-0 max-w-prose text-body opacity-muted">
									Drop an IPC-2581 or Gerber set. Checks run before it is visible to anyone else.
								</p>
							</ClickableTile>
						</>
					)}
				</Show>
			</div>

			<div class="mt-6 flex justify-center">
				<Button kind="secondary" renderIcon={ChevronDown} class="min-w-72 justify-center">
					View more boards
					<span class="ml-tight font-normal opacity-muted">showing {boards()?.length ?? 0}</span>
				</Button>
			</div>
		</Shell>
	)
}
