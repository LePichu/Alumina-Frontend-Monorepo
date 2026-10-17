import { createSignal, For, Show } from "solid-js"
import Chip from "@carbon/icons/es/chip/16"
import Document from "@carbon/icons/es/document/16"
import Folder from "@carbon/icons/es/folder/16"
import Layers from "@carbon/icons/es/layers/16"
import Rule from "@carbon/icons/es/rule/16"
import Settings from "@carbon/icons/es/settings/16"
import Tag_ from "@carbon/icons/es/tag/16"
import {
	AccordionSkeleton,
	ActionableNotification,
	AILabel,
	AILabelActions,
	AILabelContent,
	AspectRatio,
	BreadcrumbSkeleton,
	Button,
	ButtonSkeleton,
	Callout,
	CheckboxSkeleton,
	CodeSnippetSkeleton,
	Column,
	ComposedModal,
	DismissibleTag,
	ExpandableTile,
	Grid,
	Heading,
	HStack,
	IconTab,
	ListItem,
	ModalBody,
	ModalFooter,
	ModalHeader,
	OperationalTag,
	OrderedList,
	Pagination,
	PaginationNav,
	PaginationSkeleton,
	ProgressIndicatorSkeleton,
	Section as HeadingSection,
	SelectableTag,
	SelectableTile,
	SelectSkeleton,
	SliderSkeleton,
	Stack,
	StructuredListSkeleton,
	TabList,
	TabPanel,
	TabPanels,
	Tabs,
	TabsSkeleton,
	TagSkeleton,
	TextAreaSkeleton,
	TextInput,
	TextInputSkeleton,
	Tile,
	TileAboveTheFoldContent,
	TileBelowTheFoldContent,
	ToastNotification,
	ToggleSkeleton,
	TreeNode,
	TreeView,
	UnorderedList,
} from "../index"
import type { NotificationKind, StackGap } from "../index"
import { Row, Sub } from "./shared"

const KINDS: NotificationKind[] = ["error", "warning", "success", "info"]

export function NotificationDemo() {
	const [toasts, setToasts] = createSignal<NotificationKind[]>(KINDS)
	const [answer, setAnswer] = createSignal("—")

	return (
		<>
			<Sub
				title="ToastNotification"
				note="Arrives on its own. Where toasts stack is the app's; this is the box and its clock."
			>
				<div class="flex flex-wrap items-start gap-4">
					<For each={toasts()}>
						{(kind) => (
							<ToastNotification
								kind={kind}
								title="Slice finished"
								subtitle="4 layers, 5h 04m estimated."
								caption="12:04:11"
								onClose={() => setToasts((all) => all.filter((other) => other !== kind))}
							/>
						)}
					</For>
					<Show when={toasts().length < KINDS.length}>
						<Button kind="tertiary" onClick={() => setToasts(KINDS)}>Bring them back</Button>
					</Show>
				</div>
			</Sub>
			<Sub
				title="ActionableNotification"
				note="Asks for something, so it takes focus and never times out."
			>
				<div class="flex flex-col gap-4">
					<ActionableNotification
						inline
						hasFocus={false}
						kind="warning"
						title="Printer profile changed"
						subtitle="The slice was made for a different nozzle."
						actionButtonLabel="Re-slice"
						onActionButtonClick={() => setAnswer("re-slice")}
						onClose={() => setAnswer("dismissed")}
					/>
					<div class="flex flex-wrap items-start gap-4">
						<ActionableNotification
							hasFocus={false}
							kind="error"
							title="Upload failed"
							subtitle="The mesh is larger than the 50 MB limit."
							actionButtonLabel="Try again"
							onActionButtonClick={() => setAnswer("try again")}
							onClose={() => setAnswer("dismissed")}
						/>
						<span class="text-small opacity-muted">last answer: {answer()}</span>
					</div>
				</div>
			</Sub>
			<Sub
				title="Callout"
				note="Part of the page, not a response to anything: no shadow, no close."
			>
				<div class="grid gap-4 sm:grid-cols-2">
					<Callout
						kind="info"
						title="Generated outputs"
						subtitle="IPC-2581 and the mesh are exported from the repository on every tagged release."
					/>
					<Callout
						kind="warning"
						title="Untested profile"
						subtitle="TPC-HT has not been validated on the Z1."
						actionButtonLabel="Read the notes"
					/>
				</div>
			</Sub>
		</>
	)
}

export function PaginationDemo() {
	const [state, setState] = createSignal({ page: 3, pageSize: 10 })
	const [nav, setNav] = createSignal(4)

	return (
		<>
			<Sub
				title="Pagination"
				note="One ruled bar. It holds no rows — it says which page and how big, and the caller slices."
			>
				<Pagination
					totalItems={97}
					page={state().page}
					pageSize={state().pageSize}
					onChange={setState}
				/>
				<p class="m-0 mt-2 text-small opacity-muted">
					page {state().page}, {state().pageSize} per page
				</p>
				<Pagination class="mt-4" pagesUnknown page={2} pageSizes={[25, 50]} />
				<Pagination class="mt-4" totalItems={40} disabled />
			</Sub>
			<Sub title="PaginationNav" note="The pages as buttons. What does not fit folds into a menu.">
				<div class="flex flex-col items-start gap-4">
					<PaginationNav totalItems={24} page={nav()} onChange={setNav} />
					<PaginationNav totalItems={5} />
					<PaginationNav totalItems={12} itemsShown={5} loop />
				</div>
			</Sub>
			<Sub title="PaginationSkeleton">
				<PaginationSkeleton />
			</Sub>
		</>
	)
}

export function TreeViewDemo() {
	const [picked, setPicked] = createSignal<string[]>(["l2"])

	return (
		<div class="grid gap-4 sm:grid-cols-2">
			<Tile heading="TreeView" meta={picked().join(", ") || "none"} flush>
				<div class="p-2">
					<TreeView label="Board layers" hideLabel selected={picked()} onSelect={setPicked}>
						<TreeNode id="assembly" label="Assembly" renderIcon={Folder} defaultIsExpanded>
							<TreeNode id="substrate" label="Substrate" renderIcon={Layers} defaultIsExpanded>
								<TreeNode id="l1" label="L1 · core" renderIcon={Document} />
								<TreeNode id="l2" label="L2 · core" renderIcon={Document} />
								<TreeNode id="l3" label="L3 · core" renderIcon={Document} />
							</TreeNode>
							<TreeNode id="conductor" label="Conductor" renderIcon={Chip}>
								<TreeNode id="f-cu" label="F.Cu" renderIcon={Document} />
								<TreeNode id="b-cu" label="B.Cu" renderIcon={Document} />
							</TreeNode>
							<TreeNode id="drill" label="Drill hits" renderIcon={Rule} disabled />
						</TreeNode>
						<TreeNode id="notes" label="Notes" renderIcon={Document} />
					</TreeView>
				</div>
			</Tile>
			<Tile heading="Multiselect · xs" flush>
				<div class="p-2">
					<TreeView
						label="Files"
						hideLabel
						multiselect
						size="xs"
						defaultSelected={["board.xml", "bom.csv"]}
					>
						<TreeNode id="hardware" label="hardware" defaultIsExpanded>
							<TreeNode id="board.xml" label="board.xml" />
							<TreeNode id="board.stl" label="board.stl" />
							<TreeNode id="bom.csv" label="bom.csv" />
						</TreeNode>
						<TreeNode id="README.md" label="README.md" />
						<TreeNode id="LICENSE" label="LICENSE" />
					</TreeView>
				</div>
			</Tile>
		</div>
	)
}

const GAPS: StackGap[] = [1, 3, 5, 7]

export function LayoutDemo() {
	return (
		<>
			<Sub title="OrderedList · UnorderedList" boxed>
				<div class="grid gap-4 sm:grid-cols-2">
					<UnorderedList>
						<ListItem>Print the substrate</ListItem>
						<ListItem>
							Fill the channels
							<UnorderedList>
								<ListItem>Silver for signal</ListItem>
								<ListItem>Carbon for the resistors</ListItem>
							</UnorderedList>
						</ListItem>
						<ListItem>Cure for twenty minutes</ListItem>
					</UnorderedList>
					<OrderedList>
						<ListItem>Home all axes</ListItem>
						<ListItem>
							Load the tool plate
							<OrderedList>
								<ListItem>Extruder</ListItem>
								<ListItem>Ink syringe</ListItem>
							</OrderedList>
						</ListItem>
						<ListItem>Start the job</ListItem>
					</OrderedList>
				</div>
			</Sub>

			<Sub
				title="Heading · Section"
				note="A Heading takes its level from how many Sections it is inside."
				boxed
			>
				<Heading>Level one</Heading>
				<HeadingSection class="mt-2">
					<Heading>Level two</Heading>
					<HeadingSection class="mt-2">
						<Heading>Level three</Heading>
						<HeadingSection class="mt-2">
							<Heading>Level four</Heading>
							<HeadingSection class="mt-2">
								<Heading>Level five</Heading>
								<HeadingSection class="mt-2">
									<Heading>Level six</Heading>
								</HeadingSection>
							</HeadingSection>
						</HeadingSection>
					</HeadingSection>
				</HeadingSection>
			</Sub>

			<Sub title="Stack" note="Carbon's spacing steps, on this system's grid.">
				<HStack gap={7} class="flex-wrap items-end">
					<For each={GAPS}>
						{(gap) => (
							<div>
								<p class="m-0 mb-tight text-micro font-bold uppercase opacity-muted">gap {gap}</p>
								<Stack gap={gap}>
									<span class="block h-4 w-24 bg-ink" />
									<span class="block h-4 w-24 bg-ink" />
									<span class="block h-4 w-24 bg-ink" />
								</Stack>
							</div>
						)}
					</For>
				</HStack>
			</Sub>

			<Sub title="AspectRatio">
				<div class="flex flex-wrap items-end gap-4">
					<For each={["16x9", "4x3", "1x1", "3x4"] as const}>
						{(ratio) => (
							<AspectRatio ratio={ratio} class="w-32 border-2 border-ink bg-white">
								<span class="absolute inset-0 flex items-center justify-center text-small">
									{ratio}
								</span>
							</AspectRatio>
						)}
					</For>
				</div>
			</Sub>

			<Sub title="Grid · Column" note="4 columns on a phone, 8 on a tablet, 16 from 1024px.">
				<Grid narrow fullWidth>
					<Column sm={4} md={4} lg={8}>
						<div class="border-2 border-ink bg-white p-2 text-small">sm 4 · md 4 · lg 8</div>
					</Column>
					<Column sm={2} md={2} lg={4}>
						<div class="border-2 border-ink bg-white p-2 text-small">2 · 2 · 4</div>
					</Column>
					<Column sm={2} md={2} lg={4}>
						<div class="border-2 border-ink bg-white p-2 text-small">2 · 2 · 4</div>
					</Column>
					<Column sm={4} md={{ span: 4, start: 3 }} lg={{ span: 8, start: 5 }}>
						<div class="border-2 border-ink bg-white p-2 text-small">offset: starts at 3 / 5</div>
					</Column>
				</Grid>
			</Sub>
		</>
	)
}

export function VariantsDemo() {
	const [open, setOpen] = createSignal(false)
	const [tags, setTags] = createSignal(["esp32", "4-layer", "silver ink"])
	const [tab, setTab] = createSignal(0)

	return (
		<>
			<Sub title="Tag · dismissible, operational, selectable">
				<Row label="dismissible">
					<For each={tags()}>
						{(tag) => (
							<DismissibleTag
								text={tag}
								onClose={() => setTags((all) => all.filter((other) => other !== tag))}
							/>
						)}
					</For>
					<DismissibleTag text="solid" solid />
					<DismissibleTag text="disabled" disabled />
				</Row>
				<Row label="operational">
					<OperationalTag text="12 boards" renderIcon={Tag_} />
					<OperationalTag text="open filter" />
					<OperationalTag text="disabled" disabled />
				</Row>
				<Row label="selectable">
					<SelectableTag text="2 layers" defaultSelected />
					<SelectableTag text="4 layers" />
					<SelectableTag text="flex" />
					<SelectableTag text="disabled" disabled />
				</Row>
			</Sub>

			<Sub title="SelectableTile · ExpandableTile">
				<div class="grid items-start gap-4 sm:grid-cols-3">
					<SelectableTile defaultSelected>
						<b class="block text-body font-bold">IPC-2581</b>
						<span class="text-small">One file, layers and nets intact.</span>
					</SelectableTile>
					<SelectableTile>
						<b class="block text-body font-bold">Gerber X2</b>
						<span class="text-small">One file per layer, plus drill.</span>
					</SelectableTile>
					<SelectableTile disabled>
						<b class="block text-body font-bold">ODB++</b>
						<span class="text-small">Not supported yet.</span>
					</SelectableTile>
					<ExpandableTile class="sm:col-span-2">
						<TileAboveTheFoldContent>
							<b class="block text-body font-bold">Design rules</b>
							<span class="text-small">2 errors, 4 warnings.</span>
						</TileAboveTheFoldContent>
						<TileBelowTheFoldContent>
							<p class="m-0 text-small">
								Clearance 0.14 mm below the 0.20 mm minimum near J2, and an unrouted net between
								U1.7 and C9.1. The warnings are via drills under the profile's comfort size.
							</p>
						</TileBelowTheFoldContent>
					</ExpandableTile>
					<ExpandableTile defaultExpanded>
						<TileAboveTheFoldContent>
							<b class="block text-body font-bold">Starts open</b>
						</TileAboveTheFoldContent>
						<TileBelowTheFoldContent>
							<p class="m-0 text-small">Ruled off from what is above it.</p>
						</TileBelowTheFoldContent>
					</ExpandableTile>
				</div>
			</Sub>

			<Sub title="IconTab">
				<Tabs selectedIndex={tab()} onChange={setTab}>
					<TabList aria-label="Board views">
						<IconTab label="Layers" renderIcon={Layers} />
						<IconTab label="Rules" renderIcon={Rule} />
						<IconTab label="Settings" renderIcon={Settings} />
					</TabList>
					<TabPanels>
						<TabPanel>Layers panel</TabPanel>
						<TabPanel>Rules panel</TabPanel>
						<TabPanel>Settings panel</TabPanel>
					</TabPanels>
				</Tabs>
			</Sub>

			<Sub
				title="ComposedModal"
				note="The dialog in parts, for a footer or header Modal's props do not cover."
			>
				<Button onClick={() => setOpen(true)}>Open composed modal</Button>
				<ComposedModal open={open()} onClose={() => setOpen(false)} size="sm">
					<ModalHeader label="Publish" title="Three ways out" />
					<ModalBody>
						<TextInput labelText="Release tag" value="v1.2" />
					</ModalBody>
					<ModalFooter
						primaryButtonText="Publish"
						secondaryButtonText="Cancel"
						onRequestClose={() => setOpen(false)}
						onRequestSubmit={() => setOpen(false)}
					>
						<Button kind="ghost" flat class="mr-auto" onClick={() => setOpen(false)}>
							Save as draft
						</Button>
					</ModalFooter>
				</ComposedModal>
			</Sub>

			<Sub
				title="AI label"
				note="Marks something as generated and explains it on demand. No gradient: two letters and a popover."
			>
				<Row label="sizes">
					<AILabel size="sm">
						<AILabelContent>
							<p class="m-0 text-micro font-bold uppercase">Generated by perun</p>
							<p class="m-0 mt-tight text-small">From your prompt and the Z1 process rules.</p>
						</AILabelContent>
					</AILabel>
					<AILabel>
						<AILabelContent>
							<p class="m-0 text-micro font-bold uppercase">Generated by perun</p>
							<p class="m-0 mt-tight text-small">
								Routed from your prompt and the Z1 process rules. DRC passed with two warnings.
							</p>
						</AILabelContent>
						<AILabelActions>
							<Button kind="tertiary" size="sm" flat>View run</Button>
						</AILabelActions>
					</AILabel>
					<AILabel size="lg" kind="inline" aiTextLabel="routed">
						<AILabelContent>
							<p class="m-0 text-small">Every trace on this layer was placed by the agent.</p>
						</AILabelContent>
					</AILabel>
				</Row>
				<Tile bar heading="On an ink bar" action={<AILabel size="sm" />} class="max-w-80">
					<p class="m-0 text-small">The mark takes the ink of what it sits on.</p>
				</Tile>
			</Sub>
		</>
	)
}

export function SkeletonsDemo() {
	return (
		<Tile class="pt-tight">
			<div class="grid grid-cols-1 gap-6 sm:grid-cols-3">
				<TextInputSkeleton />
				<SelectSkeleton />
				<TextAreaSkeleton />
				<div class="flex flex-col gap-2">
					<CheckboxSkeleton />
					<CheckboxSkeleton />
					<ToggleSkeleton />
				</div>
				<SliderSkeleton />
				<div class="flex flex-wrap items-center gap-2">
					<ButtonSkeleton />
					<ButtonSkeleton size="sm" />
					<TagSkeleton />
					<TagSkeleton />
				</div>
				<TabsSkeleton class="sm:col-span-2" />
				<BreadcrumbSkeleton />
				<AccordionSkeleton count={3} />
				<StructuredListSkeleton rowCount={3} />
				<div class="flex flex-col gap-4">
					<ProgressIndicatorSkeleton count={3} />
					<CodeSnippetSkeleton />
				</div>
			</div>
		</Tile>
	)
}
