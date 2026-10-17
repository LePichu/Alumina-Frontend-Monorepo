import { createSignal, For, Match, onCleanup, Show, Switch } from "solid-js"
import Image from "@carbon/icons/es/image/16"
import Printer from "@carbon/icons/es/printer/16"
import Renew from "@carbon/icons/es/renew/16"
import RuleIcon from "@carbon/icons/es/rule/16"
import Template from "@carbon/icons/es/template/16"
import Terminal from "@carbon/icons/es/terminal/16"
import Upload from "@carbon/icons/es/upload/16"
import {
	Button,
	CheckList,
	CheckListItem,
	ContainedList,
	ContainedListItem,
	ContentSwitcher,
	openChecks,
	Swatch,
	Switch as SwitchItem,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	Tile,
	TileSection,
} from "@alumina/design"
import type { Fill } from "@alumina/design"
import type {
	FigureKind,
	FormAnswers,
	FormSubmission,
	ModelId,
	ReplyChip,
	ReplySection,
	RunStep,
} from "../../lib/agent"
import { Figure, FIGURE_LABELS } from "./figures"
import { ReplyForm } from "./ReplyForm"

export type ReplyTileProps = {
	model: ModelId
	sections: ReplySection[]
	/** True while more sections are still arriving. */
	streaming?: boolean
	answers?: FormAnswers
	onSubmitForm?: (submission: FormSubmission) => void
}

/** An agent reply: one bordered tile with an ink header, ruled into sections.
 *
 *  Every section is a typed variant rendered by its own component below. There is
 *  no path here that takes markup from a reply and injects it — adding a section
 *  type means adding a Match, not widening what prose can contain.
 *
 *  The tile is flush so each section's rule runs edge to edge, and each section
 *  owns its own inset.
 */
export function ReplyTile(props: ReplyTileProps) {
	/** The run clock in the header: the sum of every step the reply reports. */
	const elapsed = () => {
		const total = props.sections
			.flatMap((section) => section.kind === "steps" ? section.steps : [])
			.reduce((sum, step) => sum + (parseFloat(step.duration) || 0), 0)
		return `${total.toFixed(1)}s`
	}

	// Each arriving section opens with the same reveal the chat tile uses.
	const reveal = () => (props.streaming ? "animate-reveal" : "")

	return (
		<Tile bar flush heading={props.model} meta={elapsed()}>
			<For each={props.sections}>
				{(section) => (
					<Switch>
						<Match when={section.kind === "steps" ? section : undefined}>
							{(steps) => <Steps steps={steps().steps} live={props.streaming} class={reveal()} />}
						</Match>

						<Match when={section.kind === "checks" ? section : undefined}>
							{(checks) => (
								<TileSection
									ruled
									renderIcon={RuleIcon}
									heading="Checks"
									meta={openChecks(checks().checks)
										? `${openChecks(checks().checks)} open`
										: "all clear"}
									class={reveal()}
								>
									<CheckList size="sm">
										<For each={checks().checks}>
											{(check) => (
												<CheckListItem severity={check.severity} detail={check.detail}>
													{check.label}
												</CheckListItem>
											)}
										</For>
									</CheckList>
								</TileSection>
							)}
						</Match>

						<Match when={section.kind === "prose" ? section : undefined}>
							{(prose) => (
								<TileSection class={reveal()}>
									<For each={prose().paragraphs}>
										{(paragraph) => <p class="m-0 mb-2 text-body last:mb-0">{paragraph}</p>}
									</For>
								</TileSection>
							)}
						</Match>

						<Match when={section.kind === "figure" ? section : undefined}>
							{(figure) => (
								<FigureCard
									title={figure().title}
									figure={figure().figure}
									views={figure().views}
									caption={figure().caption}
									class={reveal()}
								/>
							)}
						</Match>

						<Match when={section.kind === "table" ? section : undefined}>
							{(table) => (
								<TileSection
									ruled
									renderIcon={Template}
									heading={table().title}
									meta={table().note}
									class={reveal()}
								>
									<Table>
										<TableHead>
											<TableRow>
												<For each={table().headers}>
													{(header) => <TableHeader>{header}</TableHeader>}
												</For>
											</TableRow>
										</TableHead>
										<TableBody>
											<For each={table().rows}>
												{(row) => (
													<TableRow>
														<For each={row}>
															{(cell, column) => (
																// The first column names the row, so it keeps full
																// weight; the rest are data and are dimmed.
																<TableCell class={column() === 0 ? "" : "opacity-muted"}>
																	{cell}
																</TableCell>
															)}
														</For>
													</TableRow>
												)}
											</For>
										</TableBody>
									</Table>
								</TileSection>
							)}
						</Match>

						<Match when={section.kind === "form" ? section : undefined}>
							{(form) => (
								<TileSection
									ruled
									flush
									renderIcon={RuleIcon}
									heading={form().form.title}
									meta={`${form().form.fields.length} to confirm`}
									class={reveal()}
								>
									<ReplyForm
										form={form().form}
										answers={props.answers}
										onSubmit={props.onSubmitForm}
									/>
								</TileSection>
							)}
						</Match>

						<Match when={section.kind === "footer" ? section : undefined}>
							{(footer) => (
								<TileSection class={reveal()}>
									<div class="flex flex-col gap-2">
										<Show when={footer().stats}>
											{(stats) => <Chips chips={stats()} />}
										</Show>
										<Show when={footer().artifacts}>
											<div class="flex flex-wrap gap-2">
												<Button kind="tertiary" size="sm" renderIcon={Upload}>
													Open IPC-2581
												</Button>
												<Button kind="tertiary" size="sm" renderIcon={Printer}>
													Slice in foundry
												</Button>
												<Button kind="tertiary" size="sm" renderIcon={Renew}>
													Try another layout
												</Button>
											</div>
										</Show>
									</div>
								</TileSection>
							)}
						</Match>
					</Switch>
				)}
			</For>
		</Tile>
	)
}

/** Caption and footer chips: `value` in ink, `label` dimmed beside it. */
function Chips(props: { chips: ReplyChip[] }) {
	return (
		<div class="flex flex-wrap gap-x-4 gap-y-tight text-micro">
			<For each={props.chips}>
				{(chip) => (
					<span>
						<Show when={chip.value}>
							<b class="font-bold">{chip.value}</b>
						</Show>
						<Show when={chip.label}>
							<span class="opacity-muted">{chip.value ? ` ${chip.label}` : chip.label}</span>
						</Show>
					</span>
				)}
			</For>
		</div>
	)
}

/** The run block. While a reply is live each step fills in turn — open, then
 *  hatched while it runs, then solid — which is the only place in kiln where a
 *  fill pattern carries state rather than identity. */
function Steps(props: { steps: RunStep[]; live?: boolean; class?: string }) {
	const [done, setDone] = createSignal(props.live ? 0 : props.steps.length)

	if (props.live) {
		const timers: ReturnType<typeof setTimeout>[] = []
		for (let i = 1; i <= props.steps.length; i++) {
			timers.push(setTimeout(() => setDone(i), i * 260))
		}
		onCleanup(() => timers.forEach(clearTimeout))
	}

	const state = (index: number): Fill => {
		if (index < done()) return "solid"
		if (index === done()) return "hatch"
		return "open"
	}

	return (
		<TileSection
			ruled
			renderIcon={Terminal}
			heading="Run"
			meta={`${props.steps.length} calls`}
			class={props.class}
		>
			<ContainedList size="sm">
				<For each={props.steps}>
					{(step, index) => (
						<ContainedListItem
							class={index() > done() ? "opacity-40" : ""}
							action={<span class="text-micro tabular-nums opacity-muted">{step.duration}</span>}
						>
							<span class="flex items-center gap-2">
								<Swatch fill={state(index())} />
								<span class="min-w-0 flex-1">
									<span class="block truncate text-body font-bold">{step.name}</span>
									<span class="block truncate text-micro opacity-muted">{step.detail}</span>
								</span>
							</span>
						</ContainedListItem>
					)}
				</For>
			</ContainedList>
		</TileSection>
	)
}

/** A figure, its optional view switcher, and the caption strip beneath it. The
 *  caption is a band of its own, so its rule reaches the tile's edges. */
function FigureCard(props: {
	title: string
	figure: FigureKind
	views?: FigureKind[]
	caption?: ReplyChip[]
	class?: string
}) {
	const [view, setView] = createSignal<FigureKind>(props.figure)
	const views = () => props.views ?? []

	return (
		<>
			<TileSection
				ruled
				renderIcon={Image}
				heading={props.title}
				class={props.class}
				action={
					<Show when={views().length > 1}>
						<ContentSwitcher
							size="sm"
							selectedIndex={Math.max(views().indexOf(view()), 0)}
							onChange={(index) => {
								const next = views()[index]
								if (next) setView(next)
							}}
						>
							<For each={views()}>{(kind) => <SwitchItem text={FIGURE_LABELS[kind]} />}</For>
						</ContentSwitcher>
					</Show>
				}
			>
				<Figure kind={view()} />
			</TileSection>
			<Show when={props.caption}>
				{(caption) => (
					<TileSection class={props.class}>
						<Chips chips={caption()} />
					</TileSection>
				)}
			</Show>
		</>
	)
}
