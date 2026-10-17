import { createAsync, useParams } from "@solidjs/router"
import { createSignal, For, Show } from "solid-js"
import type { JSX } from "solid-js"
import Download from "@carbon/icons/es/download/16"
import Flash from "@carbon/icons/es/flash/16"
import Fork from "@carbon/icons/es/fork/16"
import Printer from "@carbon/icons/es/printer/16"
import Renew from "@carbon/icons/es/renew/16"
import Star from "@carbon/icons/es/star/16"
import {
	Breadcrumb,
	BreadcrumbItem,
	Button,
	CheckList,
	CheckListItem,
	CodeSnippet,
	ContentSwitcher,
	InlineNotification,
	openChecks,
	StructuredListBody,
	StructuredListCell,
	StructuredListRow,
	StructuredListWrapper,
	Switch,
	Tile,
} from "@alumina/design"
import { BoardHero } from "../../components/BoardHero"
import type { BoardView3D } from "../../components/BoardHero"
import { Counters } from "../../components/Counters"
import { SectionHead } from "../../components/SectionHead"
import { Shell } from "../../components/Shell"
import { getBoard, getBoardChecks, getBoardFiles, openInSlicer } from "../../lib/quarry"

const VIEWS: BoardView3D[] = ["iso", "top", "front"]

export default function BoardPage() {
	const params = useParams<{ ns: string; board: string }>()
	const board = createAsync(() => getBoard(params.ns, params.board))
	const checks = createAsync(() => getBoardChecks(params.ns, params.board))
	const files = createAsync(() => getBoardFiles(params.ns, params.board))
	const [view, setView] = createSignal(0)

	const open = () => openChecks(checks() ?? [])

	return (
		<Shell>
			<Show
				when={board()}
				fallback={
					<InlineNotification
						kind="error"
						title="Board not found"
						subtitle={`No board at ${params.ns}/${params.board}.`}
						hideCloseButton
						class="mt-6"
					/>
				}
			>
				{(data) => (
					<>
						<Breadcrumb class="mt-6">
							<BreadcrumbItem href="/">quarry</BreadcrumbItem>
							<BreadcrumbItem href="/search">boards</BreadcrumbItem>
							<BreadcrumbItem isCurrentPage>{data().slug}</BreadcrumbItem>
						</Breadcrumb>

						<section class="grid grid-cols-1 items-center gap-8 py-12 lg:grid-cols-2">
							<div>
								<h1 class="m-0 text-headline font-bold sm:text-hero">
									<span class="block opacity-60">{data().namespace}/</span>
									{data().slug}
								</h1>
								<p class="m-0 mt-6 max-w-prose text-body opacity-80">{data().description}</p>

								<div class="mt-6 flex flex-wrap gap-2">
									<Button kind="primary" renderIcon={Flash} href={openInSlicer(data())}>
										Open in foundry
									</Button>
									<Button kind="secondary" renderIcon={Download}>IPC-2581</Button>
									<Button kind="secondary" renderIcon={Fork}>Fork</Button>
								</div>

								<Counters
									class="mt-8"
									counters={[
										{ glyph: Star, value: data().stars.toLocaleString(), label: "stars" },
										{ glyph: Fork, value: data().forks, label: "forks" },
										{ glyph: Printer, value: data().prints, label: "printed" },
										{
											glyph: Download,
											value: data().downloads.toLocaleString(),
											label: "downloads",
										},
									]}
								/>
							</div>

							{
								/* The viewer owns the angle; BoardView draws whatever it is told.
							    The switcher hangs off the board's bottom-right corner rather than
							    floating over it, so it never covers the thing it is turning. */
							}
							<div class="relative">
								<BoardHero
									board={data().slug}
									angle={VIEWS[view()] ?? "iso"}
									class="h-84 w-full"
								/>
								<ContentSwitcher
									class="absolute -bottom-4 right-0"
									size="sm"
									selectedIndex={view()}
									onChange={setView}
								>
									<For each={VIEWS}>{(name) => <Switch text={name} />}</For>
								</ContentSwitcher>
							</div>
						</section>

						<SectionHead title="Repository" />

						<div class="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
							{
								/* The count rides in the heading, beside the title — Tile's `meta`
							    slot is the trailing edge, and the prototype sets these counts
							    against the word they count. */
							}
							<Tile
								headingSize="title"
								heading={
									<>
										Files <Count>{files()?.length ?? 0}</Count>
									</>
								}
								action={<Button kind="ghost" size="sm" renderIcon={Download}>Download all</Button>}
								class="flex flex-col"
							>
								<Show when={files()}>
									{(list) => (
										<StructuredListWrapper aria-label="Files in this board" isFlush>
											<StructuredListBody>
												<For each={list()}>
													{(file) => (
														<StructuredListRow>
															<StructuredListCell noWrap>{file.name}</StructuredListCell>
															<StructuredListCell trailing class="opacity-muted">
																{file.kind} · {file.size}
															</StructuredListCell>
														</StructuredListRow>
													)}
												</For>
											</StructuredListBody>
										</StructuredListWrapper>
									)}
								</Show>
								<CodeSnippet
									type="single"
									class="mt-6"
									code={`quarry clone ${data().namespace}/${data().slug}`}
								/>
							</Tile>

							<Tile
								headingSize="title"
								heading={
									<>
										Checks{" "}
										<Count>
											{open() === 0
												? "all clear"
												: `${open()} ${open() === 1 ? "warning" : "open"}`}
										</Count>
									</>
								}
								action={<Button kind="ghost" size="sm" renderIcon={Renew}>Re-run</Button>}
							>
								<Show when={checks()}>
									{(list) => (
										<CheckList>
											<For each={list()}>
												{(check) => (
													<CheckListItem severity={check.severity} detail={check.detail} verdict>
														{check.label}
													</CheckListItem>
												)}
											</For>
										</CheckList>
									)}
								</Show>
							</Tile>

							<Tile headingSize="title" heading="What it costs to make">
								<StructuredListWrapper aria-label="Cost to make this board" isFlush>
									<StructuredListBody>
										<Cost label="Alumina Z1 · consumables" value={data().ink} />
										<Cost label="JLC · 5 pieces" value={data().fab} />
										<Cost label="Bill of materials · 1 unit" value={data().bom} />
									</StructuredListBody>
								</StructuredListWrapper>
								<p class="m-0 mt-4 text-small opacity-muted">
									{data().fitsPlate
										? "Clears every rule on your Z1."
										: "Longer than the plate, so this one goes to a fab."}{" "}
									The mesh above is the slicer output, not a render of the artwork.
								</p>
							</Tile>

							<Tile headingSize="title" heading="Licence and lineage">
								<StructuredListWrapper aria-label="Licence and lineage" isFlush>
									<StructuredListBody>
										<Row label="board" value={data().licence} />
										<Row label="documentation" value="CC-BY-SA 4.0" />
										<Row label="sources" value="KiCad project" />
										<Row label="outline" value={`${data().size[0]} × ${data().size[1]} mm`} />
										<Row label="forks of this" value={`${data().forks}`} />
									</StructuredListBody>
								</StructuredListWrapper>
							</Tile>
						</div>
					</>
				)}
			</Show>
		</Shell>
	)
}

/** The dimmed number a panel title carries. */
function Count(props: { children?: JSX.Element }) {
	return <span class="text-micro font-normal normal-case opacity-muted">{props.children}</span>
}

function Row(props: { label: string; value: string }) {
	return (
		<StructuredListRow>
			<StructuredListCell class="opacity-muted">{props.label}</StructuredListCell>
			<StructuredListCell trailing class="font-bold">{props.value}</StructuredListCell>
		</StructuredListRow>
	)
}

/** Costs are the one place quarry shows money; they stay tabular so the column
 *  reads down rather than across. */
function Cost(props: { label: string; value: number }) {
	return (
		<StructuredListRow>
			<StructuredListCell class="opacity-muted">{props.label}</StructuredListCell>
			<StructuredListCell trailing class="font-bold tabular-nums">
				${props.value.toFixed(2)}
			</StructuredListCell>
		</StructuredListRow>
	)
}
