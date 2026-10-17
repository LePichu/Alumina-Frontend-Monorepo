import { createSignal, For } from "solid-js"
import Add from "@carbon/icons/es/add/16"
import ArrowRight from "@carbon/icons/es/arrow--right/16"
import Chip from "@carbon/icons/es/chip/16"
import Close from "@carbon/icons/es/close/16"
import Document from "@carbon/icons/es/document/16"
import Launch from "@carbon/icons/es/launch/16"
import Layers from "@carbon/icons/es/layers/16"
import Rule from "@carbon/icons/es/rule/16"
import Settings from "@carbon/icons/es/settings/16"
import Time from "@carbon/icons/es/time/16"
import User from "@carbon/icons/es/user/16"
import {
	Accordion,
	AccordionItem,
	Button,
	Checkbox,
	CheckList,
	CheckListItem,
	ClickableTile,
	ContainedList,
	ContainedListItem,
	FILLS,
	Icon,
	IconButton,
	Link,
	RadioTile,
	Swatch,
	Tab,
	TabListVertical,
	TabPanel,
	TabPanels,
	TabsVertical,
	Tag,
	Tile,
	TileGroup,
	TileSection,
} from "../index"
import { Row, Sub } from "./shared"

/** The fill vocabulary: what the system uses where another would use colour. */
export function SwatchDemo() {
	return (
		<>
			<Row label="fills · lg">
				<For each={FILLS}>
					{(fill) => (
						<span class="flex items-center gap-snug text-small">
							<Swatch fill={fill} size="lg" />
							{fill}
						</span>
					)}
				</For>
			</Row>
			<Row label="fills · md">
				<For each={FILLS}>{(fill) => <Swatch fill={fill} />}</For>
			</Row>
			<Row label="as status">
				<span class="flex items-center gap-snug text-small">
					<Swatch fill="solid" label="connected" />Ready
				</span>
				<span class="flex items-center gap-snug text-small">
					<Swatch fill="open" label="disconnected" />Offline
				</span>
				<span class="flex items-center gap-snug text-small">
					<Swatch fill="hatch" label="in progress" />Running
				</span>
			</Row>
		</>
	)
}

export function AccordionDemo() {
	return (
		<div class="grid gap-4 sm:grid-cols-2">
			<Tile heading="align start · sm">
				<Accordion align="start" size="sm">
					<AccordionItem
						open
						title={
							<>
								<span class="flex-1">Substrate</span>
								<span class="font-normal opacity-muted">4/4</span>
							</>
						}
					>
						<Checkbox checked labelText="L1 · core" />
						<Checkbox checked labelText="L2 · core" />
						<Checkbox checked labelText="L3 · core" />
						<Checkbox checked labelText="L4 · cap" />
					</AccordionItem>
					<AccordionItem
						title={
							<>
								<span class="flex-1">Conductor</span>
								<span class="font-normal opacity-muted">4/5</span>
							</>
						}
					>
						<Checkbox checked labelText="F.Cu · traces" />
						<Checkbox labelText="B.Cu · pour" />
					</AccordionItem>
					<AccordionItem title="Drill" disabled>
						<p class="m-0 text-body">Never reachable.</p>
					</AccordionItem>
				</Accordion>
			</Tile>
			<Tile heading="align end · md">
				<Accordion>
					<AccordionItem title="What is a board on quarry?" open>
						<p class="m-0 text-body">
							A git repository. The fabrication data is built from it, never uploaded beside it.
						</p>
					</AccordionItem>
					<AccordionItem title="Can I print a 4-layer board?">
						<p class="m-0 text-body">Yes — the Z1 laminates up to four.</p>
					</AccordionItem>
					<AccordionItem title="Who owns what I publish?">
						<p class="m-0 text-body">You do, under the licence the board carries.</p>
					</AccordionItem>
				</Accordion>
			</Tile>
		</div>
	)
}

export function ListDemo() {
	const [picked, setPicked] = createSignal("—")

	return (
		<div class="grid gap-4 sm:grid-cols-2">
			<Tile heading="ContainedList · pressable" meta={picked()}>
				<ContainedList
					label="Recent"
					action={<Button kind="ghost" size="sm" renderIcon={Add}>Open</Button>}
				>
					<For each={["buck-5v.rev3.xml", "esp32-carrier.xml", "flex-tail.cvg"]}>
						{(file) => (
							<ContainedListItem renderIcon={Chip} onClick={() => setPicked(file)}>
								{file}
							</ContainedListItem>
						)}
					</For>
					<ContainedListItem renderIcon={Chip} disabled onClick={() => undefined}>
						archived.xml
					</ContainedListItem>
				</ContainedList>
			</Tile>

			<Tile heading="ContainedList · with actions">
				<ContainedList size="sm">
					<For each={[["board.xml", "412 KB"], ["board.stl", "319 KB"], ["bom.csv", "4 KB"]]}>
						{([name, size]) => (
							<ContainedListItem
								renderIcon={Document}
								action={
									<IconButton
										label={`Drop ${name}`}
										renderIcon={Close}
										kind="tertiary"
										size="sm"
										flat
									/>
								}
							>
								<span class="flex items-baseline gap-2">
									<span class="min-w-0 flex-1 truncate">{name}</span>
									<span class="text-small opacity-muted">{size}</span>
								</span>
							</ContainedListItem>
						)}
					</For>
				</ContainedList>
			</Tile>

			<Tile heading="ContainedList · links">
				<ContainedList size="lg">
					<ContainedListItem href="#charts" renderIcon={Rule}>Jump to charts</ContainedListItem>
					<ContainedListItem href="#forms" renderIcon={Settings}>Jump to forms</ContainedListItem>
					<ContainedListItem>A row that is only a row</ContainedListItem>
				</ContainedList>
			</Tile>

			<Tile heading="CheckList" meta="1 err · 1 warn">
				<CheckList>
					<CheckListItem severity="ok" detail="revision C · 1 step" verdict>
						Parses as IPC-2581C
					</CheckListItem>
					<CheckListItem severity="warning" detail="8 vias at 0.30 mm" verdict>
						Via drill under profile comfort
					</CheckListItem>
					<CheckListItem severity="error" detail="GND to VBUS near J2" verdict>
						Clearance 0.14 mm below 0.20 mm
					</CheckListItem>
					<CheckListItem severity="ok">A row with no detail and no verdict</CheckListItem>
				</CheckList>
			</Tile>
		</div>
	)
}

export function LinkDemo() {
	return (
		<>
			<Row label="standalone">
				<Link href="#link">Browse all</Link>
				<Link href="#link" renderIcon={ArrowRight}>With an icon</Link>
				<Link href="#link" renderIcon={Launch} target="_blank">Opens elsewhere</Link>
				<Link href="#link" disabled>Disabled</Link>
			</Row>
			<Row label="sizes">
				<Link href="#link" size="sm">sm</Link>
				<Link href="#link" size="md">md</Link>
				<Link href="#link" size="lg">lg</Link>
			</Row>
			<Row label="inline">
				<p class="m-0 max-w-prose text-body">
					Boards are{" "}
					<Link href="#link" inline>git repositories</Link>, and the fabrication data is built from
					them. In running text a link is underlined at rest — without colour, nothing else says so.
				</p>
			</Row>
			<Row label="on ink">
				<span class="flex gap-4 bg-ink px-2 py-snug text-white">
					<Link href="#link">Docs</Link>
					<Link href="#link">API</Link>
					<Link href="#link">Status</Link>
				</span>
			</Row>
		</>
	)
}

export function VerticalTabsDemo() {
	return (
		<Tile flush>
			<TabsVertical class="flex">
				<TabListVertical aria-label="Settings" class="w-46 shrink-0 border-r-2 border-ink">
					<Tab>
						<Icon glyph={Chip} size={16} />Agent
					</Tab>
					<Tab>
						<Icon glyph={Rule} size={16} />Process
					</Tab>
					<Tab>
						<Icon glyph={User} size={16} />Account
					</Tab>
					<Tab disabled>
						<Icon glyph={Settings} size={16} />Disabled
					</Tab>
				</TabListVertical>
				<div class="min-w-0 flex-1 p-4 text-body">
					<TabPanels>
						<TabPanel>Up and down move between tabs; Home and End jump to the ends.</TabPanel>
						<TabPanel>What the agent designs to when you don't say otherwise.</TabPanel>
						<TabPanel>Who you are and where runs execute.</TabPanel>
						<TabPanel>Never reachable.</TabPanel>
					</TabPanels>
				</div>
			</TabsVertical>
		</Tile>
	)
}

export function TileFamilyDemo() {
	const [bay, setBay] = createSignal("t1")
	const bays = [
		{ id: "t1", name: "Shell", fill: "solid" as const },
		{ id: "t2", name: "Ink", fill: "hatch" as const },
		{ id: "t3", name: "Dryer", fill: "dots" as const },
		{ id: "t4", name: "Drill", fill: "gray" as const },
		{ id: "t5", name: "Press", fill: "cross" as const },
		{ id: "t6", name: "Empty", fill: "open" as const },
	]

	return (
		<>
			<Sub
				title="TileSection"
				note="One ruled band of a flush Tile, labelled in the Tile's own voice."
			>
				<div class="grid gap-4 sm:grid-cols-2">
					<Tile bar flush heading="Rail" meta="v0.1">
						<TileSection heading="Threads" renderIcon={Time} meta="7">
							<p class="m-0 text-body">Inline heading, small padding.</p>
						</TileSection>
						<TileSection heading="Process" renderIcon={Rule} meta="Alumina Z1">
							<p class="m-0 text-body">A second band. The rule between them runs edge to edge.</p>
						</TileSection>
						<TileSection>
							<p class="m-0 text-body">No heading at all.</p>
						</TileSection>
					</Tile>
					<Tile bar flush heading="perun" meta="4.2s">
						<TileSection
							ruled
							heading="Checks"
							renderIcon={Rule}
							meta="1 open"
							action={<Button kind="ghost" size="sm">Re-run</Button>}
						>
							<p class="m-0 text-body">
								`ruled` puts the heading on its own band — for content that runs edge to edge.
							</p>
						</TileSection>
						<TileSection ruled flush heading="Layers" renderIcon={Layers}>
							<p class="m-0 bg-gray p-2 text-body">`flush`: the content owns its insets.</p>
						</TileSection>
						<TileSection size="md">
							<p class="m-0 text-body">size md — 16px.</p>
						</TileSection>
					</Tile>
				</div>
			</Sub>

			<Sub title="ClickableTile" note="The whole tile is the link. It presses like a Button.">
				<div class="grid gap-4 sm:grid-cols-2">
					<ClickableTile href="#tile-family" class="p-4">
						<span class="flex items-center gap-2">
							<b class="text-figure font-bold tracking-tight group-hover:underline">
								<span class="font-normal opacity-muted">avthenticstemcel/</span>i2c-fanout-6
							</b>
							<Tag solid size="sm">Public</Tag>
						</span>
						<p class="m-0 mt-2 text-body opacity-muted">Six addressable I²C ports off one bus.</p>
					</ClickableTile>
					<ClickableTile
						href="#tile-family"
						placeholder
						class="grid place-items-center p-4 text-center"
					>
						<span>
							<b class="text-figure font-bold tracking-tight">Publish a board</b>
							<p class="m-0 mt-tight text-body opacity-muted">placeholder — dashed, no shadow.</p>
						</span>
					</ClickableTile>
				</div>
			</Sub>

			<Sub
				title="TileGroup + RadioTile"
				note="A radio group whose options are tiles. Arrow keys move it."
			>
				<div class="grid gap-4 sm:grid-cols-2">
					<Tile heading="Tool plate" meta={bay()}>
						<TileGroup
							legend="Tool modules"
							hideLegend
							valueSelected={bay()}
							onChange={setBay}
							class="grid grid-cols-2 gap-tight"
						>
							<For each={bays}>
								{(entry) => (
									<RadioTile value={entry.id} disabled={entry.fill === "open"}>
										<Swatch fill={entry.fill} />
										<span class="min-w-0 flex-1 truncate text-label font-bold uppercase">
											{entry.name}
										</span>
										<span class="text-label opacity-muted">{entry.id}</span>
									</RadioTile>
								)}
							</For>
						</TileGroup>
					</Tile>
					<Tile heading="Flat tile inside a tile">
						<Tile flat class="p-2">
							<p class="m-0 text-body">
								`flat` drops the shadow: the outer tile already carries the one.
							</p>
						</Tile>
					</Tile>
				</div>
			</Sub>
		</>
	)
}
