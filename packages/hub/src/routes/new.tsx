import { createAsync } from "@solidjs/router"
import { createSignal, For, Show } from "solid-js"
import type { JSX } from "solid-js"
import Add from "@carbon/icons/es/add/16"
import Branch from "@carbon/icons/es/branch/16"
import Close from "@carbon/icons/es/close/16"
import Code from "@carbon/icons/es/code/16"
import Cube from "@carbon/icons/es/cube/16"
import Document from "@carbon/icons/es/document/16"
import Download from "@carbon/icons/es/download/16"
import Flash from "@carbon/icons/es/flash/16"
import Renew from "@carbon/icons/es/renew/16"
import Terminal from "@carbon/icons/es/terminal/16"
import ToolKit from "@carbon/icons/es/tool-kit/16"
import Upload from "@carbon/icons/es/upload/16"
import View from "@carbon/icons/es/view/16"
import {
	Button,
	Checkbox,
	CheckList,
	CheckListItem,
	CodeSnippet,
	ContainedList,
	ContainedListItem,
	ContentSwitcher,
	FormGroup,
	Icon,
	IconButton,
	openChecks,
	RadioButton,
	RadioButtonGroup,
	Select,
	SelectItem,
	Slider,
	StructuredListBody,
	StructuredListCell,
	StructuredListRow,
	StructuredListWrapper,
	Swatch,
	Switch,
	Tab,
	TabList,
	TabPanel,
	TabPanels,
	Tabs,
	Tag,
	TextArea,
	TextInput,
	Tile,
	TileSection,
} from "@alumina/design"
import type { CarbonGlyph } from "@alumina/design"
import { BoardHero } from "../components/BoardHero"
import { Counters } from "../components/Counters"
import { Shell } from "../components/Shell"
import { getPublishDraft } from "../lib/quarry"
import type { Artifact, SourceFile } from "../fixtures/publish"

/** Publishing a board. Reached from "New board" in the account menu — never from
 *  a `+` in the nav, which was dropped in review.
 *
 *  All five sections at once with a rail beside them, not a wizard: four of them
 *  are already answered by the time you arrive (quarry read the repository,
 *  worked out the toolchain, exported the fabrication data and ran the checks),
 *  so the page is mostly a build report you skim and correct. A stepper would
 *  hide what has already happened behind Next.
 *
 *  Nothing here submits. Auth, git hosting and LFS are all open decisions.
 *
 *  Assembly steps are gone on purpose, replaced by the single notes textarea in
 *  the listing section.
 */
const SECTIONS = [
	{ id: "source", title: "Source", hint: "git", state: "git", done: true },
	{ id: "build", title: "Build", hint: "", state: "1 warning", done: true },
	{ id: "listing", title: "The listing", hint: "required", state: "done", done: true },
	{
		id: "licence",
		title: "Licence and visibility",
		hint: "required",
		state: "1 left",
		done: false,
	},
	{ id: "preview", title: "Preview", hint: "", state: "", done: false },
] as const

const ARTIFACT_GLYPHS: Record<Artifact["glyph"], CarbonGlyph> = {
	document: Document,
	cube: Cube,
	"tool-kit": ToolKit,
}

export default function NewBoard() {
	const draft = createAsync(() => getPublishDraft())
	const [topics, setTopics] = createSignal(["i2c", "bus", "sensors"])
	const [topic, setTopic] = createSignal("")
	const [dropped, setDropped] = createSignal<string[]>([])
	const [minutes, setMinutes] = createSignal(46)
	const [licence, setLicence] = createSignal("cc0")
	const [visibility, setVisibility] = createSignal("public")
	const [preview, setPreview] = createSignal(0)

	const artifacts = () => (draft()?.artifacts ?? []).filter((a) => !dropped().includes(a.name))

	const addTopic = () => {
		const next = topic().trim()
		if (next === "" || topics().includes(next)) return
		setTopics([...topics(), next])
		setTopic("")
	}

	return (
		<Shell>
			<section class="flex flex-col gap-8 pb-6 pt-12 lg:flex-row lg:items-end">
				<div class="min-w-0 flex-1">
					<p class="m-0 flex items-center gap-2 text-label uppercase opacity-muted">
						<Icon glyph={Add} size={16} />
						New board
					</p>
					<h1 class="m-0 mt-4 text-headline font-bold">
						Point it at <em class="not-italic opacity-60">the repository.</em>
					</h1>
					<p class="m-0 mt-2 max-w-prose text-body opacity-80">
						quarry works out what the project is, exports the fabrication data itself and runs the
						checks.
					</p>
				</div>
				{/* 144 spacing units is 36rem: room for "IPC-2581" at figure size. */}
				<Counters
					class="lg:w-144 lg:shrink-0"
					counters={[
						{ glyph: Branch, value: "KiCad 9", label: "detected" },
						{ glyph: Document, value: "IPC-2581", label: "exported" },
						{ glyph: Cube, value: "44 × 40", label: "mm outline" },
						{ glyph: ToolKit, value: 17, label: "parts" },
					]}
				/>
			</section>

			<div class="flex flex-col items-start gap-6 pb-6 lg:flex-row">
				<div class="flex w-full min-w-0 flex-1 flex-col gap-6">
					{/* ---- 1 · Source ---- */}
					<Panel index={0}>
						<TileSection size="lg">
							<div class="grid grid-cols-1 gap-6 md:grid-cols-3">
								<TextInput
									labelText="Repository"
									value="github.com/avthenticstemcel/i2c-fanout-6"
								/>
								<Picker labelText="Ref" options={["tags/v1.2", "main", "hardware/rev-b"]} />
								<Picker
									labelText="quarry keeps it as"
									options={["A mirror", "A tracked remote", "The origin"]}
								/>
							</div>
							<div class="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
								<TextInput
									labelText={
										<>
											Project file <Muted>detected</Muted>
										</>
									}
									value="hardware/i2c-fanout-6.kicad_pro"
								/>
								<Picker
									labelText="Re-sync"
									options={["On tagged releases", "On every push", "Manually"]}
								/>
							</div>
							<FormGroup class="mt-6" legendText="Large objects" hideLegend>
								<Checkbox
									checked
									labelText="Fetch large objects through Git LFS"
									helperText="Meshes and exports are pointers in the tree."
								/>
								<Checkbox
									labelText="Keep every revision of those objects"
									helperText="Otherwise only tips and tags are kept."
								/>
							</FormGroup>
						</TileSection>
					</Panel>

					{/* ---- 2 · Build ---- */}
					<Panel index={1} hint={`${draft()?.ranAgo ?? ""} · ${draft()?.commit ?? ""}`}>
						<TileSection size="lg">
							<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
								<div>
									{
										/* Read off the project, never typed — so each is a read-only
									    field, and the group says who filled them in. */
									}
									<FormGroup legendText="Detected">
										<For each={draft()?.detected}>
											{([label, value]) => (
												<TextInput inline size="sm" readOnly labelText={label} value={value} />
											)}
										</For>
									</FormGroup>
									<Picker
										class="mt-6"
										labelText="If detection is wrong"
										options={[
											"Detect automatically",
											"KiCad",
											"Horizon EDA",
											"Altium",
											"Upload fabrication data instead",
										]}
									/>
								</div>

								<div>
									<RadioButtonGroup legendText="Export to" defaultSelected="ipc">
										<RadioButton
											value="ipc"
											labelText="IPC-2581C"
											helperText="One file, layers and nets intact."
										/>
										<RadioButton value="gerber" labelText="Gerber X2 + Excellon" />
										<RadioButton value="both" labelText="Both" />
									</RadioButtonGroup>
									<FormGroup class="mt-6" legendText="Also generate">
										<Checkbox checked labelText="Mesh through mica" />
										<Checkbox checked labelText="Bill of materials" />
										<Checkbox labelText="Position file" />
									</FormGroup>
								</div>
							</div>
						</TileSection>

						<TileSection size="lg">
							<Show when={draft()}>
								{(data) => (
									<CheckList>
										<For each={data().steps}>
											{(step) => (
												<CheckListItem severity={step.severity} detail={step.detail} verdict>
													{step.label}
												</CheckListItem>
											)}
										</For>
									</CheckList>
								)}
							</Show>
							<div class="mt-4 flex flex-wrap gap-2">
								<Button kind="secondary" size="sm" renderIcon={Renew}>Run again</Button>
								<Button kind="secondary" size="sm" renderIcon={Terminal}>Full log</Button>
							</div>
						</TileSection>

						<TileSection size="lg">
							{/* Produced by the build, not uploaded. Each one is removable. */}
							<ContainedList label="Artifacts" size="sm">
								<For each={artifacts()}>
									{(artifact) => (
										<ContainedListItem
											renderIcon={ARTIFACT_GLYPHS[artifact.glyph]}
											action={
												<IconButton
													label={`Drop ${artifact.name}`}
													renderIcon={Close}
													kind="tertiary"
													size="sm"
													flat
													onClick={() => setDropped([...dropped(), artifact.name])}
												/>
											}
										>
											<span class="flex items-baseline gap-2">
												<span class="min-w-0 flex-1 truncate">{artifact.name}</span>
												<span class="shrink-0 text-small opacity-muted">{artifact.meta}</span>
											</span>
										</ContainedListItem>
									)}
								</For>
							</ContainedList>
						</TileSection>
					</Panel>

					{/* ---- 3 · The listing ---- */}
					<Panel index={2}>
						<TileSection size="lg">
							<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
								<TextInput labelText="Name" value="i2c-fanout-6" />
								<Picker
									labelText="Owner"
									options={["avthenticstemcel", "magnolia-cove", "+ new organisation"]}
								/>
							</div>
							<TextInput
								class="mt-6"
								labelText={
									<>
										Summary <Muted>one line, shown in search</Muted>
									</>
								}
								value="Six addressable I²C ports off one bus, pull-ups jumpered per port."
							/>
							<TextArea
								class="mt-6"
								rows={4}
								labelText={
									<>
										Description <Muted>markdown, or leave it to read README.md</Muted>
									</>
								}
								value="Printed on an Alumina Z1 with 0.8 mm carbon ink. Each port carries its own address jumper, so six identical sensors can share one bus without colliding."
							/>

							<FormGroup class="mt-6" legendText="Topics">
								<div class="flex flex-wrap items-center gap-2">
									<For each={topics()}>
										{(name) => (
											<Tag
												filter
												onClose={() => setTopics(topics().filter((each) => each !== name))}
											>
												{name}
											</Tag>
										)}
									</For>
									<TextInput
										class="min-w-48 flex-1"
										size="sm"
										hideLabel
										labelText="Add a topic"
										placeholder="add a topic, press enter"
										value={topic()}
										onInput={(event) => setTopic(event.currentTarget.value)}
										onKeyDown={(event) => {
											if (event.key !== "Enter") return
											event.preventDefault()
											addTopic()
										}}
									/>
								</div>
							</FormGroup>
						</TileSection>

						<TileSection size="lg">
							<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
								<FormGroup legendText="Tools someone needs">
									<Checkbox checked labelText="A printer or a fab order" />
									<Checkbox checked labelText="Soldering iron" />
									<Checkbox checked labelText="Hot plate or reflow oven" />
									<Checkbox checked labelText="Multimeter" />
									<Checkbox labelText="Hot air station" />
								</FormGroup>
								<div>
									<Slider
										labelText="Time to build"
										min={10}
										max={240}
										step={10}
										unit="min"
										value={minutes()}
										onChange={setMinutes}
									/>
									<TextArea
										class="mt-6"
										rows={4}
										labelText={
											<>
												Assembly notes <Muted>read from README.md</Muted>
											</>
										}
										value="Print the substrate, fill the channels with carbon ink and cure for 20 minutes. Reflow the passives, then hand-solder the four headers."
									/>
								</div>
							</div>
						</TileSection>
					</Panel>

					{/* ---- 4 · Licence and visibility ---- */}
					<Panel index={3}>
						<TileSection size="lg">
							<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
								<RadioButtonGroup
									legendText={
										<>
											Board licence <Muted>LICENSE says CC0</Muted>
										</>
									}
									valueSelected={licence()}
									onChange={setLicence}
								>
									<RadioButton value="cc0" labelText="CC0" helperText="No conditions." />
									<RadioButton
										value="cern"
										labelText="CERN-OHL-S v2"
										helperText="Reciprocal. Forks stay open."
									/>
									<RadioButton value="cc-by-sa" labelText="CC-BY-SA 4.0" />
									<RadioButton
										value="paid"
										labelText="Paid licence"
										helperText="Your terms, your price."
									/>
								</RadioButtonGroup>

								<div>
									<RadioButtonGroup
										legendText="Visibility"
										valueSelected={visibility()}
										onChange={setVisibility}
									>
										<RadioButton
											value="public"
											labelText="Public"
											helperText="Anyone can find it and fork it."
										/>
										<RadioButton
											value="unlisted"
											labelText="Unlisted"
											helperText="Only people with the link."
										/>
										<RadioButton value="private" labelText="Private" helperText="Only you." />
									</RadioButtonGroup>
									<div class="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
										<TextInput labelText="Price" value="0.00" />
										<Picker labelText="Currency" options={["USD", "EUR", "INR"]} />
									</div>
								</div>
							</div>
						</TileSection>

						<TileSection size="lg">
							<FormGroup legendText="Where it is listed" hideLegend>
								<Checkbox
									checked
									labelText="List on the fab index too"
									helperText="Shown to people without a printer."
								/>
								<Checkbox
									labelText={
										<span class="flex items-baseline gap-2">
											<span class="min-w-0 flex-1">
												I have the right to publish these files
											</span>
											<span class="shrink-0 text-micro font-bold uppercase">required</span>
										</span>
									}
								/>
							</FormGroup>
						</TileSection>
					</Panel>

					{/* ---- 5 · Preview ---- */}
					<Panel index={4}>
						<ContentSwitcher
							flush
							class="w-full border-b-2 border-ink"
							selectedIndex={preview()}
							onChange={setPreview}
						>
							<Switch renderIcon={Code} text="Source view" class="flex-1" />
							<Switch renderIcon={View} text="Board page" class="flex-1" />
						</ContentSwitcher>

						<TileSection size="lg">
							<Show when={preview() === 0} fallback={<PagePreview topics={topics()} />}>
								<p class="m-0 mb-4 text-small opacity-muted">
									The tree at{" "}
									<b class="font-bold">{draft()?.commit}</b>, as a reader browses it — sources from
									git, <b class="font-bold">board.xml</b> written by the build.
								</p>
								<Show when={draft()}>{(data) => <SourceView files={data().sources} />}</Show>
							</Show>
						</TileSection>
					</Panel>
				</div>

				{/* ---- the rail ---- */}
				<aside class="sticky top-20 flex w-full shrink-0 flex-col gap-6 lg:w-lane">
					<Tile flush heading="Sections" ruled>
						<ContainedList size="sm">
							<For each={SECTIONS}>
								{(section) => (
									<ContainedListItem href={`#${section.id}`} class="px-2">
										<span class="flex items-center gap-2 text-small">
											{/* Filled once the section needs nothing more from you. */}
											<Swatch
												fill={section.done ? "solid" : "open"}
												label={section.done ? "complete" : "incomplete"}
											/>
											<span class="min-w-0 flex-1 truncate">{section.title}</span>
											<Show when={section.state}>
												<span class="shrink-0 text-micro uppercase opacity-muted">
													{section.state}
												</span>
											</Show>
										</span>
									</ContainedListItem>
								)}
							</For>
						</ContainedList>
					</Tile>

					<Tile flush heading="Before you publish" ruled>
						<TileSection size="md">
							<StructuredListWrapper aria-label="What is about to be published" isFlush isCondensed>
								<StructuredListBody>
									<For each={draft()?.summary}>
										{([label, value]) => (
											<StructuredListRow>
												<StructuredListCell class="opacity-muted">{label}</StructuredListCell>
												<StructuredListCell trailing class="font-bold">
													<PathValue value={value} />
												</StructuredListCell>
											</StructuredListRow>
										)}
									</For>
								</StructuredListBody>
							</StructuredListWrapper>

							<Button kind="primary" renderIcon={Upload} class="mt-4 w-full justify-center">
								Publish board
							</Button>
							<Button kind="secondary" class="mt-2 w-full justify-center">Save as draft</Button>
							<p class="m-0 mt-4 text-small opacity-muted">
								Publishing re-runs the build against the tagged ref.{" "}
								<Show when={openChecks(draft()?.steps ?? []) > 0}>
									A warning does not block it.
								</Show>
							</p>
						</TileSection>
					</Tile>
				</aside>
			</div>
		</Shell>
	)
}

/** One numbered step of the flow. The number is a solid Tag in the heading,
 *  which is what makes five stacked panels read as an ordered list rather than
 *  five unrelated boxes. */
function Panel(props: { index: number; hint?: string; children?: JSX.Element }) {
	const section = () => SECTIONS[props.index]

	return (
		<Tile
			flush
			ruled
			headingSize="title"
			class="scroll-mt-20"
			heading={
				<>
					<Tag solid size="sm">{props.index + 1}</Tag>
					<span id={section()?.id}>{section()?.title}</span>
				</>
			}
			meta={props.hint ?? section()?.hint}
		>
			{props.children}
		</Tile>
	)
}

/** The sentence-case aside a label carries in this flow: "detected", "required",
 *  "read from README.md". */
function Muted(props: { children?: JSX.Element }) {
	return <span class="ml-2 text-micro font-normal normal-case opacity-muted">{props.children}</span>
}

/** A Select over a fixed list, opening on the first option. Six of these on the
 *  page; written out each time they were six copies of the same four lines. */
function Picker(props: { labelText: JSX.Element; options: string[]; class?: string }) {
	const [value, setValue] = createSignal(props.options[0])

	return (
		<Select
			class={props.class}
			labelText={props.labelText}
			value={value()}
			onChange={setValue}
		>
			<For each={props.options}>{(option) => <SelectItem value={option} text={option} />}</For>
		</Select>
	)
}

/** The tree at the tagged commit. Tabs, because picking one file to read is
 *  exactly what tabs are for — and the prototype's own two-pane version nests a
 *  code block inside another bordered box, which would double the border here
 *  since CodeSnippet draws its own. */
function SourceView(props: { files: SourceFile[] }) {
	const [file, setFile] = createSignal(0)

	return (
		<Tabs selectedIndex={file()} onChange={setFile}>
			<TabList aria-label="Files at this commit">
				<For each={props.files}>
					{(source) => (
						<Tab>
							{source.path}
							<span class="ml-2 font-normal opacity-muted">{source.origin}</span>
						</Tab>
					)}
				</For>
			</TabList>
			<TabPanels>
				<For each={props.files}>
					{(source) => (
						<TabPanel>
							<CodeSnippet code={source.body} lang={source.lang} />
						</TabPanel>
					)}
				</For>
			</TabPanels>
		</Tabs>
	)
}

/** And the page people land on from search or a shared link. */

/** A value that may be a path. It breaks after a slash and never inside a
 *  segment: left to the browser, "avthenticstemcel/i2c-fanout-6" wraps at its
 *  last hyphen and strands a "6" on a line of its own. */
function PathValue(props: { value: string }) {
	const parts = () => props.value.split("/")

	return (
		<For each={parts()}>
			{(part, index) => (
				<>
					<Show when={index() > 0}>
						<wbr />
					</Show>
					<span class="whitespace-nowrap">
						{part}
						{index() < parts().length - 1 ? "/" : ""}
					</span>
				</>
			)}
		</For>
	)
}

function PagePreview(props: { topics: string[] }) {
	return (
		<>
			<p class="m-0 mb-4 text-small opacity-muted">
				And the page people land on from search or a shared link.
			</p>
			{/* Flat: the panel around it already carries the one hard shadow. */}
			<Tile flat flush>
				<div class="p-6">
					<div class="flex flex-wrap items-start gap-6">
						<div class="min-w-0 flex-1">
							<h3 class="m-0 text-brand font-bold">
								<span class="font-normal opacity-60">avthenticstemcel/</span>i2c-fanout-6
							</h3>
							<div class="mt-2 flex flex-wrap gap-tight">
								<Tag solid size="sm">Public</Tag>
								<Tag size="sm">CC0</Tag>
								<Tag size="sm">2 layer</Tag>
								<For each={props.topics.slice(0, 1)}>{(name) => <Tag size="sm">{name}</Tag>}</For>
							</div>
							<p class="m-0 mt-4 max-w-prose text-body opacity-80">
								Six addressable I²C ports off one bus, pull-ups jumpered per port. Printed on an
								Alumina Z1 with 0.8 mm carbon ink.
							</p>
							<div class="mt-4 flex flex-wrap gap-2">
								<Button kind="primary" size="sm" flat renderIcon={Flash}>Open in foundry</Button>
								<Button kind="secondary" size="sm" flat renderIcon={Download}>IPC-2581</Button>
							</div>
						</div>
						<BoardHero board="i2c-fanout-6" class="h-40 w-56 shrink-0" />
					</div>

					<StructuredListWrapper aria-label="What this board costs" isFlush class="mt-6">
						<StructuredListBody>
							<StructuredListRow>
								<StructuredListCell class="opacity-muted">build time</StructuredListCell>
								<StructuredListCell trailing class="font-bold">
									45 min · printer, iron, hot plate, multimeter
								</StructuredListCell>
							</StructuredListRow>
							<StructuredListRow>
								<StructuredListCell class="opacity-muted">cost to print</StructuredListCell>
								<StructuredListCell trailing class="font-bold tabular-nums">
									$0.52
								</StructuredListCell>
							</StructuredListRow>
							<StructuredListRow>
								<StructuredListCell class="opacity-muted">cost at a fab</StructuredListCell>
								<StructuredListCell trailing class="font-bold tabular-nums">
									$12.80 for five
								</StructuredListCell>
							</StructuredListRow>
						</StructuredListBody>
					</StructuredListWrapper>
				</div>
			</Tile>
		</>
	)
}
