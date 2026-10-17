import { createSignal, For, Show } from "solid-js"
import type { Component } from "solid-js"
import { Background, Link, PageScrollbar } from "../index"
import {
	BackgroundDemo,
	BreadcrumbDemo,
	ButtonDemo,
	CodeSnippetDemo,
	ContentSwitcherDemo,
	IconButtonDemo,
	IconDemo,
	InlineNotificationDemo,
	ModalDemo,
	OverflowMenuDemo,
	ProgressIndicatorDemo,
	StructuredListDemo,
	TabsDemo,
	TagDemo,
	TileDemo,
	TooltipDemo,
} from "./Basics"
import type { Backdrop } from "./Basics"
import { Charts } from "./Charts"
import { DataTableDemo } from "./Data"
import { ExperimentalDemo } from "./Experimental"
import { AvatarDemo, DrawerDemo, LoadingDemo, ProgressBarDemo, SkeletonDemo } from "./Feedback"
import { FluidDemo } from "./Fluid"
import { FormsDemo } from "./FormsMore"
import {
	AccordionDemo,
	LinkDemo,
	ListDemo,
	SwatchDemo,
	TileFamilyDemo,
	VerticalTabsDemo,
} from "./More"
import { MenuDemo, PopoverDemo, ToggletipDemo } from "./Overlays"
import { PickersDemo } from "./Pickers"
import { Section, slug } from "./shared"
import { AppShellDemo, UIShellDemo, WorkspaceDemo } from "./Shell"
import {
	LayoutDemo,
	NotificationDemo,
	PaginationDemo,
	SkeletonsDemo,
	TreeViewDemo,
	VariantsDemo,
} from "./Structure"

type Entry = [title: string, demo: Component]

/** The page, in order: each group, and in it each section's title — which is
 *  also its anchor — and the demo that fills it. Adding a component to the
 *  playground is adding a line here; the index at the top is drawn from the
 *  same table, so the two cannot drift apart.
 *
 *  `background` is passed in because it is the page's own: the switch that
 *  picks the backdrop the page sits on. */
const groups = (background: Component): [group: string, sections: Entry[]][] => [
	["Foundation", [
		["Background", background],
		["Icon", IconDemo],
		["Swatch", SwatchDemo],
	]],
	["Shell", [
		["AppShell", AppShellDemo],
		["Workspace", WorkspaceDemo],
		["UIShell", UIShellDemo],
	]],
	["Actions", [
		["Button", ButtonDemo],
		["IconButton", IconButtonDemo],
		["Link", LinkDemo],
		["OverflowMenu", OverflowMenuDemo],
		["Menu", MenuDemo],
	]],
	["Navigation", [
		["Breadcrumb", BreadcrumbDemo],
		["ContentSwitcher", ContentSwitcherDemo],
		["Tabs", TabsDemo],
		["Vertical tabs", VerticalTabsDemo],
		["Pagination", PaginationDemo],
		["TreeView", TreeViewDemo],
	]],
	["Forms", [
		["Forms", FormsDemo],
		["Dropdown", PickersDemo],
		["Fluid forms", FluidDemo],
	]],
	["Feedback", [
		["InlineNotification", InlineNotificationDemo],
		["Notification", NotificationDemo],
		["Loading", LoadingDemo],
		["ProgressBar", ProgressBarDemo],
		["ProgressIndicator", ProgressIndicatorDemo],
		["Skeleton", SkeletonDemo],
		["Component skeletons", SkeletonsDemo],
	]],
	["Overlays", [
		["Tooltip", TooltipDemo],
		["Toggletip", ToggletipDemo],
		["Popover", PopoverDemo],
		["Modal", ModalDemo],
		["Drawer", DrawerDemo],
	]],
	["Content", [
		["Tile", TileDemo],
		["Tile family", TileFamilyDemo],
		["Accordion", AccordionDemo],
		["Tag", TagDemo],
		["Avatar", AvatarDemo],
		["Lists", ListDemo],
		["StructuredList", StructuredListDemo],
		["CodeSnippet", CodeSnippetDemo],
	]],
	["Data", [
		["DataTable", DataTableDemo],
		["Charts", Charts],
	]],
	// Last, and in this order, on purpose. An AspectRatio box is as tall as its
	// width divided by its ratio, which is rarely a whole number of pixels, so
	// these two sections are a fraction of a pixel tall — and everything after
	// such a section is drawn a fraction of a pixel down, its rules greyed by it.
	["More", [
		["Variants", VariantsDemo],
		["Layout", LayoutDemo],
		["Experimental", ExperimentalDemo],
	]],
]

export function App() {
	const [backdrop, setBackdrop] = createSignal<Backdrop>("grid")
	const page = groups(() => <BackgroundDemo backdrop={backdrop()} onChange={setBackdrop} />)

	return (
		<>
			<Show when={backdrop() !== "off"}>
				<Background
					variant={backdrop() === "sheet" ? "sheet" : "grid"}
					static={backdrop() === "static"}
				/>
			</Show>
			<PageScrollbar />
			{
				/* No ground of its own, so the floor shows through behind the content —
			    which is how the prototypes compose over it. */
			}
			<main class="relative z-10 mx-auto max-w-4xl px-4 py-8">
				<h1 class="m-0 text-body font-bold uppercase tracking-micro">@alumina/design</h1>
				<p class="mb-4 mt-2 text-body opacity-muted">
					Every component in every state. This is what gets compared against the prototypes.
				</p>
				{
					/* The index: a row a group, its name in the label column and its
				    sections after it — the same two columns every demo row below is
				    laid out on. One run of forty-odd links had no shape to scan. */
				}
				<nav
					aria-label="Sections"
					class="mb-8 grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-4 gap-y-2 border-t-2 border-ink pt-4"
				>
					<For each={page}>
						{([group, sections]) => (
							<>
								{
									/* As tall as one line of its links, and centred in that — not
								    aligned to their baseline, which lays the rows out to a
								    fraction of a pixel and shifts every section below by it. */
								}
								<span class="flex h-4 items-center text-micro font-bold uppercase opacity-muted pointer-coarse:h-touch">
									{group}
								</span>
								<span class="flex flex-wrap gap-x-4 gap-y-tight">
									<For each={sections}>
										{([title]) => <Link href={`#${slug(title)}`} size="sm">{title}</Link>}
									</For>
								</span>
							</>
						)}
					</For>
					{/* Pages of their own on this server: things made with the system. */}
					<span class="flex h-4 items-center text-micro font-bold uppercase opacity-muted pointer-coarse:h-touch">
						Tools
					</span>
					<span class="flex flex-wrap gap-x-4 gap-y-tight">
						<Link href="/app-icon.html" size="sm">App icon</Link>
					</span>
				</nav>

				<For each={page.flatMap(([, sections]) => sections)}>
					{([title, Demo]) => (
						<Section title={title}>
							<Demo />
						</Section>
					)}
				</For>
			</main>
		</>
	)
}
