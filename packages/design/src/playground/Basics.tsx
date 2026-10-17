import { createSignal, For } from "solid-js"
import Add from "@carbon/icons/es/add/16"
import ArrowRight from "@carbon/icons/es/arrow--right/16"
import Checkmark from "@carbon/icons/es/checkmark/16"
import Close from "@carbon/icons/es/close/16"
import Document from "@carbon/icons/es/document/16"
import Edit from "@carbon/icons/es/edit/16"
import Settings from "@carbon/icons/es/settings/24"
import TrashCan from "@carbon/icons/es/trash-can/16"
import WarningAlt from "@carbon/icons/es/warning--alt/32"
import {
	Breadcrumb,
	BreadcrumbItem,
	Button,
	CodeSnippet,
	ContentSwitcher,
	Icon,
	IconButton,
	InlineNotification,
	Modal,
	OverflowMenu,
	OverflowMenuItem,
	ProgressIndicator,
	ProgressStep,
	StructuredListBody,
	StructuredListCell,
	StructuredListHead,
	StructuredListRow,
	StructuredListWrapper,
	Switch,
	Tab,
	TabList,
	TabPanel,
	TabPanels,
	Tabs,
	Tag,
	Tile,
	Tooltip,
} from "../index"
import type { ButtonKind, ButtonSize, NotificationKind } from "../index"
import { Row } from "./shared"

/** The first components ported, each in every state. One demo per section of
 *  the playground; `App.tsx` lists them. */

const KINDS: ButtonKind[] = [
	"primary",
	"secondary",
	"tertiary",
	"ghost",
	"danger",
	"danger--tertiary",
	"danger--ghost",
]

const SIZES: ButtonSize[] = ["sm", "md", "lg"]

const BACKDROPS = ["grid", "static", "sheet", "off"] as const

const NOTIFICATIONS: NotificationKind[] = ["error", "warning", "success", "info"]

const SAMPLE_CODE = `import { slice } from "@alumina/mica"

// Two-layer board, silver conductive ink.
const job = await slice("pixelexia-z1.ipc", {
	layers: 2,
	substrate: "pla",
})

console.log(job.rules.filter((rule) => rule.severity === "error"))`

export type Backdrop = (typeof BACKDROPS)[number]

/** The backdrop is the page's, so the page owns which one is showing; this is
 *  only the switch. */
export function BackgroundDemo(props: { backdrop: Backdrop; onChange: (next: Backdrop) => void }) {
	return (
		<>
			<Row label="backdrop">
				<ContentSwitcher
					selectedIndex={BACKDROPS.indexOf(props.backdrop)}
					onChange={(index) => props.onChange(BACKDROPS[index] ?? "grid")}
				>
					<Switch text="grid" />
					<Switch text="static" />
					<Switch text="sheet" />
					<Switch text="off" />
				</ContentSwitcher>
			</Row>
			<Row label="notes">
				<span class="text-micro opacity-muted">
					grid animates · static freezes the same rows · sheet is the blueprint backdrop · all stop
					under prefers-reduced-motion
				</span>
			</Row>
		</>
	)
}

export function IconDemo() {
	return (
		<>
			<Row label="sizes">
				<For each={[16, 20, 24, 32] as const}>
					{(size) => (
						<span class="flex items-center gap-2">
							<Icon glyph={Add} size={size} label={`Add at ${size}`} />
							<span class="text-micro opacity-muted">{size}</span>
						</span>
					)}
				</For>
			</Row>
			<Row label="glyphs">
				<Icon glyph={Checkmark} label="Checkmark" />
				<Icon glyph={Close} label="Close" />
				<Icon glyph={Settings} label="Settings" />
				<Icon glyph={WarningAlt} label="Warning" />
			</Row>
			<Row label="inherits ink">
				<span class="flex items-center gap-2 bg-ink px-2 py-snug text-white">
					<Icon glyph={Checkmark} />
					<span class="text-micro uppercase">on ink</span>
				</span>
			</Row>
		</>
	)
}

export function ButtonDemo() {
	return (
		<>
			<For each={KINDS}>
				{(kind) => (
					<Row label={kind}>
						<For each={SIZES}>
							{(size) => (
								<Button kind={kind} size={size}>
									{size}
								</Button>
							)}
						</For>
						<Button kind={kind} renderIcon={ArrowRight}>
							with icon
						</Button>
						<Button kind={kind} disabled>
							disabled
						</Button>
					</Row>
				)}
			</For>
			<Row label="as link">
				<Button href="#button" kind="primary" renderIcon={ArrowRight}>
					anchor
				</Button>
			</Row>
		</>
	)
}

export function IconButtonDemo() {
	return (
		<>
			<Row label="kinds">
				<IconButton label="Add board" renderIcon={Add} kind="primary" />
				<IconButton label="Edit" renderIcon={Edit} kind="secondary" />
				<IconButton label="Settings" renderIcon={Settings} kind="tertiary" />
				<IconButton label="Close" renderIcon={Close} kind="ghost" />
				<IconButton label="Delete" renderIcon={TrashCan} kind="danger" />
			</Row>
			<Row label="no tooltip">
				<span class="flex items-center gap-2 bg-ink px-2 py-snug">
					<IconButton label="Close panel" renderIcon={Close} kind="ghost" hideTooltip />
				</span>
			</Row>
		</>
	)
}

export function TooltipDemo() {
	return (
		<>
			<Row label="alignment">
				<For each={["top", "bottom", "left", "right"] as const}>
					{(align) => (
						<Tooltip label={`Aligned ${align}`} align={align}>
							<Button kind="tertiary">{align}</Button>
						</Tooltip>
					)}
				</For>
			</Row>
		</>
	)
}

export function TagDemo() {
	return (
		<>
			<Row label="sizes">
				<Tag size="sm">sm</Tag>
				<Tag size="md">md</Tag>
				<Tag size="lg">lg</Tag>
			</Row>
			<Row label="variants">
				<Tag renderIcon={Document}>with icon</Tag>
				<Tag filter onClose={() => undefined}>
					filter
				</Tag>
				<Tag disabled>disabled</Tag>
			</Row>
		</>
	)
}

export function BreadcrumbDemo() {
	return (
		<>
			<Breadcrumb>
				<BreadcrumbItem href="#quarry">quarry</BreadcrumbItem>
				<BreadcrumbItem href="#boards">boards</BreadcrumbItem>
				<BreadcrumbItem isCurrentPage>pixelexia-z1</BreadcrumbItem>
			</Breadcrumb>
		</>
	)
}

export function ContentSwitcherDemo() {
	const [switcher, setSwitcher] = createSignal(0)

	return (
		<>
			<Row label="text">
				<ContentSwitcher selectedIndex={switcher()} onChange={setSwitcher}>
					<Switch text="design" />
					<Switch text="review" />
					<Switch text="fab" />
				</ContentSwitcher>
			</Row>
			<Row label="icons">
				<ContentSwitcher>
					<Switch renderIcon={Document} iconDescription="Boards" />
					<Switch renderIcon={Edit} iconDescription="Edit" />
					<Switch renderIcon={Settings} iconDescription="Settings" />
				</ContentSwitcher>
			</Row>
			<Row label="flush">
				{
					/* A switcher that is a section of something already bordered. The
			    bar supplies the box; the switcher supplies only the dividers. */
				}
				<div class="flex h-12 items-stretch border-2 border-ink bg-white">
					<span class="flex items-center border-r-2 border-ink bg-ink px-4 text-micro font-bold uppercase text-white">
						bar
					</span>
					<ContentSwitcher flush class="border-r-2 border-ink">
						<Switch renderIcon={Document} iconDescription="Boards" class="w-12" />
						<Switch renderIcon={Edit} iconDescription="Edit" class="w-12" />
					</ContentSwitcher>
					<span class="flex items-center px-4 text-small opacity-muted">
						the rest of the bar
					</span>
				</div>
			</Row>
			<Row label="sizes">
				<For each={["sm", "md", "lg"] as const}>
					{(size) => (
						<ContentSwitcher size={size}>
							<Switch text={size} />
							<Switch text="two" />
							<Switch text="off" disabled />
						</ContentSwitcher>
					)}
				</For>
			</Row>
		</>
	)
}

export function TabsDemo() {
	const [tab, setTab] = createSignal(0)

	return (
		<>
			<Tabs selectedIndex={tab()} onChange={setTab}>
				<TabList aria-label="Board sections">
					<Tab>overview</Tab>
					<Tab>layers</Tab>
					<Tab>rules</Tab>
					<Tab disabled>disabled</Tab>
				</TabList>
				<TabPanels>
					<TabPanel>Arrow keys move between tabs. Home and End jump to the ends.</TabPanel>
					<TabPanel>Second panel.</TabPanel>
					<TabPanel>Third panel.</TabPanel>
					<TabPanel>Never reachable.</TabPanel>
				</TabPanels>
			</Tabs>
		</>
	)
}

export function InlineNotificationDemo() {
	return (
		<>
			<div class="flex flex-col gap-4">
				<For each={NOTIFICATIONS}>
					{(kind) => (
						<InlineNotification
							kind={kind}
							title="Design rule check"
							subtitle="Via 0.25mm drill under the 0.40mm bit floor — 3 instances."
						/>
					)}
				</For>
			</div>
		</>
	)
}

export function ProgressIndicatorDemo() {
	return (
		<>
			<Row label="horizontal">
				<ProgressIndicator currentIndex={2}>
					<ProgressStep label="Source" />
					<ProgressStep label="Build" />
					<ProgressStep label="Listing" secondaryLabel="in progress" />
					<ProgressStep label="Licence" />
					<ProgressStep label="Preview" />
				</ProgressIndicator>
			</Row>
			<Row label="with invalid">
				<ProgressIndicator currentIndex={1} vertical>
					<ProgressStep label="Source" />
					<ProgressStep label="Build" invalid secondaryLabel="export failed" />
					<ProgressStep label="Listing" disabled />
				</ProgressIndicator>
			</Row>
		</>
	)
}

export function OverflowMenuDemo() {
	return (
		<>
			<Row label="menu">
				<OverflowMenu label="Board actions">
					<OverflowMenuItem itemText="Open in slicer" />
					<OverflowMenuItem itemText="Fork" />
					<OverflowMenuItem itemText="Download IPC-2581" />
					<OverflowMenuItem itemText="Delete board" isDelete hasDivider />
				</OverflowMenu>
			</Row>
		</>
	)
}

export function ModalDemo() {
	const [modal, setModal] = createSignal(false)
	const [navModal, setNavModal] = createSignal(false)
	const [said, setSaid] = createSignal("nothing")

	return (
		<>
			<Row label="variants">
				<Button onClick={() => setModal(true)}>Open modal</Button>
				<Button onClick={() => setNavModal(true)}>Two-pane with side nav</Button>
			</Row>
			<Modal
				open={modal()}
				onRequestClose={() => setModal(false)}
				onRequestSubmit={() => setModal(false)}
				modalLabel="pixelexia-z1"
				modalHeading="Publish board"
				primaryButtonText="Publish"
				secondaryButtonText="Cancel"
			>
				<p class="m-0">
					Corvu supplies the focus trap, scroll lock and escape handling. Everything visual is ours.
				</p>
			</Modal>
			<Modal
				open={navModal()}
				onRequestClose={() => setNavModal(false)}
				modalHeading="Settings"
				passiveModal
				navigation={
					<ul class="m-0 list-none p-0">
						<For each={["General", "Models", "Machine", "Appearance"]}>
							{(item, index) => (
								<li
									class={`border-b-2 border-ink px-2 py-snug text-micro uppercase last:border-b-0
                      ${index() === 0 ? "bg-ink text-white" : ""}`}
								>
									{item}
								</li>
							)}
						</For>
					</ul>
				}
			>
				<p class="m-0">The two-pane variant: side nav down the left of the body.</p>
			</Modal>
			<Row label="inline">
				{
					/* A dialog that has become a page: drawn here, in the flow, and closed
				    only by its own controls. foundry's Settings tab is this. */
				}
				<div class="flex h-64 w-full">
					<Modal
						inline
						size="sm"
						modalHeading="Settings"
						primaryButtonText="Done"
						onRequestClose={() => setSaid("closed")}
						onRequestSubmit={() => setSaid("done")}
					>
						<p class="m-0">
							Inline: no scrim, no portal, no focus trap. Last pressed: <b>{said()}</b>
						</p>
					</Modal>
				</div>
			</Row>
		</>
	)
}

export function CodeSnippetDemo() {
	return (
		<>
			<div class="flex flex-col gap-4">
				<CodeSnippet code={SAMPLE_CODE} lang="typescript" />
				<CodeSnippet type="single" lang="bash" code="mica slice pixelexia-z1.ipc --layers 2" />
				<p class="m-0 text-body">
					Inline: <CodeSnippet type="inline" code="pcb+open://" /> opens the slicer.
				</p>
			</div>
		</>
	)
}

export function TileDemo() {
	return (
		<>
			<div class="grid gap-4 sm:grid-cols-2">
				<Tile>
					<p class="m-0 text-body">Plain tile. Border, hard shadow, no heading.</p>
				</Tile>
				<Tile heading="Inline heading" meta="4 layers">
					<p class="m-0 text-body">The prototype's default: an uppercase label inside.</p>
				</Tile>
				<Tile bar heading="Ink bar">
					<p class="m-0 text-body">Ink ground, white text.</p>
				</Tile>
				<Tile headingSize="title" heading="Section title" meta="5">
					<p class="m-0 text-body">
						Figure size, sentence case — a section of the page that happens to be boxed.
					</p>
				</Tile>
				<Tile headingSize="title" ruled flush heading="Title, ruled, flush">
					<p class="m-0 border-b-2 border-ink p-2 text-body">
						The rule under the heading is what stops the first band's own rule reading as the
						header's bottom edge.
					</p>
					<p class="m-0 p-2 text-body">A second band.</p>
				</Tile>
				<Tile placeholder flush>
					<p class="m-0 p-4 text-center text-body opacity-muted">
						Placeholder: dashed, no shadow. The space where the next one goes.
					</p>
				</Tile>
				<Tile
					bar
					heading="Ink bar with action"
					action={<IconButton label="Close" renderIcon={Close} kind="ghost--inverse" hideTooltip />}
				>
					<p class="m-0 text-body">One borderless white icon. Never two controls.</p>
				</Tile>
			</div>
		</>
	)
}

export function StructuredListDemo() {
	const [profile, setProfile] = createSignal("silver")

	return (
		<>
			<div class="grid gap-4 sm:grid-cols-2">
				<Tile headingSize="title" heading="Label and value">
					<StructuredListWrapper aria-label="Board metadata" isFlush>
						<StructuredListBody>
							<StructuredListRow>
								<StructuredListCell class="opacity-muted">outline</StructuredListCell>
								<StructuredListCell trailing class="font-bold">70 × 60 mm</StructuredListCell>
							</StructuredListRow>
							<StructuredListRow>
								<StructuredListCell class="opacity-muted">layers</StructuredListCell>
								<StructuredListCell trailing class="font-bold">4</StructuredListCell>
							</StructuredListRow>
							<StructuredListRow>
								<StructuredListCell class="opacity-muted">licence</StructuredListCell>
								<StructuredListCell trailing class="font-bold">CC0</StructuredListCell>
							</StructuredListRow>
						</StructuredListBody>
					</StructuredListWrapper>
				</Tile>

				<Tile headingSize="title" heading="With a head row, condensed">
					<StructuredListWrapper aria-label="Files" isFlush isCondensed>
						<StructuredListHead>
							<StructuredListRow head>
								<StructuredListCell head>File</StructuredListCell>
								<StructuredListCell head trailing>Size</StructuredListCell>
							</StructuredListRow>
						</StructuredListHead>
						<StructuredListBody>
							<StructuredListRow>
								<StructuredListCell noWrap>board.xml</StructuredListCell>
								<StructuredListCell trailing class="opacity-muted">412 KB</StructuredListCell>
							</StructuredListRow>
							<StructuredListRow>
								<StructuredListCell noWrap>board.stl</StructuredListCell>
								<StructuredListCell trailing class="opacity-muted">319 KB</StructuredListCell>
							</StructuredListRow>
						</StructuredListBody>
					</StructuredListWrapper>
				</Tile>

				<Tile headingSize="title" heading="Selection" meta={profile()} class="sm:col-span-2">
					<StructuredListWrapper
						aria-label="Ink profile"
						selection
						value={profile()}
						onChange={setProfile}
					>
						<StructuredListHead>
							<StructuredListRow head>
								<StructuredListCell head>Profile</StructuredListCell>
								<StructuredListCell head trailing>Cure</StructuredListCell>
							</StructuredListRow>
						</StructuredListHead>
						<StructuredListBody>
							<StructuredListRow value="silver">
								<StructuredListCell>Silver conductive</StructuredListCell>
								<StructuredListCell trailing>20 min</StructuredListCell>
							</StructuredListRow>
							<StructuredListRow value="carbon">
								<StructuredListCell>Carbon resistive</StructuredListCell>
								<StructuredListCell trailing>12 min</StructuredListCell>
							</StructuredListRow>
							<StructuredListRow value="graphene" disabled>
								<StructuredListCell>Graphene (not fitted)</StructuredListCell>
								<StructuredListCell trailing>—</StructuredListCell>
							</StructuredListRow>
						</StructuredListBody>
					</StructuredListWrapper>
				</Tile>
			</div>
		</>
	)
}
