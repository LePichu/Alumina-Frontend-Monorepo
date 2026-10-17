import { createSignal, For } from "solid-js"
import Chat from "@carbon/icons/es/chat/16"
import Chip from "@carbon/icons/es/chip/16"
import Cube from "@carbon/icons/es/cube/16"
import Dashboard from "@carbon/icons/es/dashboard/16"
import Document from "@carbon/icons/es/document/16"
import Layers from "@carbon/icons/es/layers/16"
import Notification from "@carbon/icons/es/notification/20"
import Printer from "@carbon/icons/es/printer/16"
import Search from "@carbon/icons/es/search/20"
import Settings from "@carbon/icons/es/settings/16"
import SwitcherIcon from "@carbon/icons/es/switcher/20"
import {
	AppShell,
	Button,
	Content,
	createAppShell,
	Header,
	HeaderContainer,
	HeaderGlobalAction,
	HeaderGlobalBar,
	HeaderMenu,
	HeaderMenuButton,
	HeaderMenuItem,
	HeaderName,
	HeaderNavigation,
	HeaderPanel,
	HeaderSideNavItems,
	Icon,
	NumberInput,
	ScrollArea,
	Select,
	SelectItem,
	SideNav,
	SideNavDivider,
	SideNavItems,
	SideNavLink,
	SideNavMenu,
	SideNavMenuItem,
	SkipToContent,
	StructuredListBody,
	StructuredListCell,
	StructuredListRow,
	StructuredListWrapper,
	Switcher,
	SwitcherDivider,
	SwitcherItem,
	TextInput,
	Tile,
	TileSection,
	Toggle,
	useAppShell,
	Workspace,
} from "../index"
import type { AppShellPage } from "../index"
import { Sub } from "./shared"

/** A window, as far as the page can show one: an edge and a ground. Both are
 *  the demo's — the shell draws neither, since a real window has its own. */
const WINDOW = "border-2 border-ink bg-white"

const BOARDS: [name: string, about: string][] = [
	["buck-5v", "rev C · 4 layers · 38 × 24 mm"],
	["i2c-fanout-6", "rev A · 2 layers · 52 × 20 mm"],
	["esp32-carrier", "rev F · 4 layers · 60 × 44 mm"],
	["usb-c-breakout", "rev B · 2 layers · 18 × 14 mm"],
]

/** The narrow column of the demo pages: a board's settings, in a tile that
 *  fills its column and scrolls inside it. */
function BoardSettings(props: { name: string; meta?: string; onClose?: () => void }) {
	return (
		<Tile
			bar
			flush
			fill
			heading={props.name}
			meta={props.meta ?? "rev C"}
			class="flex min-h-0 flex-1 flex-col"
		>
			<ScrollArea>
				<TileSection heading="Slice">
					<NumberInput
						inline
						size="sm"
						labelText="layers"
						defaultValue={4}
						min={1}
						max={8}
						unit="n"
					/>
					<NumberInput
						inline
						size="sm"
						labelText="channel"
						defaultValue={0.8}
						step={0.05}
						unit="mm"
					/>
					<Toggle inline size="sm" labelText="keyed pin" defaultToggled />
				</TileSection>
				<TileSection heading="Material">
					<Select inline size="sm" labelText="base" value="petg">
						<SelectItem value="pla" text="PLA" />
						<SelectItem value="petg" text="PETG" />
					</Select>
					<TextInput inline size="sm" labelText="ink" value="silver" readOnly />
				</TileSection>
				{props.onClose
					? (
						<TileSection>
							<Button kind="tertiary" flat onClick={props.onClose}>Close this page</Button>
						</TileSection>
					)
					: null}
			</ScrollArea>
		</Tile>
	)
}

/** The wide column: where the work would be. */
function Stage(props: { children: string }) {
	return (
		<Tile placeholder class="flex min-h-0 flex-1 items-center justify-center">
			<span class="text-small opacity-muted">{props.children}</span>
		</Tile>
	)
}

/** A page in the demo app: a board, on the 25/75 workspace. */
function BoardPage(props: { name: string }) {
	const shell = useAppShell()

	return (
		<Workspace
			asideLabel="Board settings"
			class="h-full p-gap"
			aside={<BoardSettings name={props.name} onClose={() => shell.close(props.name)} />}
		>
			<Stage>{props.name}</Stage>
		</Workspace>
	)
}

/** A page's picture for its tab's card. A real app hands over a thumbnail of
 *  the page — a render of the board, a snapshot of its canvas; the playground
 *  has neither, so it draws a wireframe of each page in ink and hands that over
 *  as an SVG. It is the function form of `preview`, asked when the card opens,
 *  which is also when the ink can be read off the page rather than restated. */
const sketch = (marks: (ink: string) => string) => () => {
	const ink = getComputedStyle(document.documentElement).getPropertyValue("--color-ink").trim()
	const svg =
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 144" fill="none" stroke="${ink}" stroke-width="2">` +
		`<rect width="256" height="144" fill="#fff" stroke="none"/>${marks(ink)}</svg>`
	return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

const SKETCH = {
	// The 25/75 page: a settings tile, and the board on its stage.
	board: sketch((ink) =>
		`<rect x="9" y="9" width="70" height="126"/><rect x="9" y="9" width="70" height="14" fill="${ink}"/>` +
		`<path d="M17 38h54M17 52h54M17 66h30M9 82h70M17 98h54M17 112h38"/>` +
		`<rect x="89" y="9" width="158" height="126" stroke-dasharray="6 4"/>` +
		`<rect x="124" y="44" width="88" height="56"/>` +
		`<path d="M136 56h24v32h40M136 88h12M176 56h24v16"/>` +
		`<circle cx="136" cy="56" r="3"/><circle cx="200" cy="88" r="3"/><circle cx="200" cy="72" r="3"/><circle cx="136" cy="88" r="3"/>`
	),
	// A thread: a prompt, a reply with an ink head, a prompt, the composer.
	thread: sketch((ink) =>
		`<rect x="120" y="11" width="124" height="18"/>` +
		`<rect x="12" y="39" width="168" height="50"/><rect x="12" y="39" width="168" height="12" fill="${ink}"/>` +
		`<path d="M22 62h148M22 72h148M22 80h92"/>` +
		`<rect x="152" y="99" width="92" height="12"/>` +
		`<rect x="12" y="121" width="232" height="14"/>`
	),
	// Layers: a stack seen from above and to one side.
	layers: sketch(() =>
		`<path d="M128 22l84 30-84 30-84-30z"/><path d="M44 70l84 30 84-30M44 88l84 30 84-30M44 106l84 30 84-30"/>`
	),
	// A print job: the bed, the board on it, and how far along it is.
	job: sketch((ink) =>
		`<rect x="56" y="14" width="144" height="76"/><rect x="88" y="34" width="80" height="36" fill="${ink}"/>` +
		`<path d="M56 100h144"/>` +
		`<rect x="24" y="112" width="208" height="16"/><rect x="24" y="112" width="136" height="16" fill="${ink}"/>`
	),
	// Settings: a row a setting, its switch at the far end.
	settings: sketch((ink) =>
		`<path d="M16 28h96M16 60h72M16 92h112M16 124h64M8 44h240M8 76h240M8 108h240"/>` +
		`<rect x="208" y="20" width="32" height="16" fill="${ink}"/><rect x="208" y="52" width="32" height="16"/>` +
		`<rect x="208" y="84" width="32" height="16" fill="${ink}"/><rect x="208" y="116" width="32" height="16"/>`
	),
}

const board = (name: string, about: string): AppShellPage => ({
	id: name,
	title: name,
	description: about,
	renderIcon: Chip,
	preview: SKETCH.board,
	content: () => <BoardPage name={name} />,
})

/** A page that is one line: what the tab strip's demo opens. */
const note = (
	id: string,
	title: string,
	description: string,
	renderIcon?: AppShellPage["renderIcon"],
	preview?: AppShellPage["preview"],
): AppShellPage => ({
	id,
	title,
	description,
	renderIcon,
	preview,
	content: () => (
		<p class="m-0 p-4 text-body">
			<b>{title}</b> — {description}
		</p>
	),
})

/** Home: where pages are opened from. */
function HomePage() {
	const shell = useAppShell()

	return (
		<div class="flex h-full flex-col gap-4 p-4">
			<p class="m-0 max-w-prose text-body">
				Home is the one page that is always open. Open a board and the strip appears down the left,
				with Home first; close the last one and it goes again.
			</p>
			<div class="flex flex-wrap gap-2">
				<For each={BOARDS}>
					{([name, about]) => (
						<Button
							renderIcon={Document}
							onClick={() => shell.open(board(name, about))}
						>
							{name}
						</Button>
					)}
				</For>
				<Button
					kind="tertiary"
					renderIcon={Settings}
					onClick={() =>
						shell.open(
							note("settings", "Settings", "Machine, units, account", Settings, SKETCH.settings),
						)}
				>
					Settings
				</Button>
			</div>
		</div>
	)
}

export function AppShellDemo() {
	const [said, setSaid] = createSignal("nothing yet")
	const [maximized, setMaximized] = createSignal(false)
	// Each made here, once. Written inline as the prop it would be made again on
	// every read of the prop.
	const shell = createAppShell({ content: () => <HomePage /> })
	const alone = createAppShell({
		content: () => <p class="m-0 p-4 text-body">Only Home is open, so there is no strip.</p>,
	})

	// The strip's own demo starts with pages open, so there is a strip to look at.
	const tabbed = createAppShell({
		content: () => (
			<p class="m-0 max-w-prose p-4 text-body">
				Every open page is one glyph in the strip. Put the pointer on one and a card opens to its
				right: its name, and a picture of the page. Go to a page, and under the pointer its tab is a
				cross that closes it; the wheel pressed on any tab closes that one. Home cannot be closed.
				From the keyboard the arrows move between pages and Delete closes the one in focus.
			</p>
		),
	})
	tabbed.open(board("buck-5v", "rev C · 4 layers · 38 × 24 mm"))
	tabbed.open(
		note("thread", "Thread", "“a 5 V buck for a Pi Zero” · 6 turns", Chat, SKETCH.thread),
	)
	tabbed.open(note("layers", "Layers", "4 copper · 2 mask · 1 silk", Layers, SKETCH.layers))
	tabbed.open(note("job", "Print job", "Alumina Z1 · 41 min left", Printer, SKETCH.job))
	// No glyph of its own, so it wears the first two letters of its title; and
	// no picture, so its card is the words alone.
	tabbed.open(note("notes", "Notes", "A page with no glyph and no picture"))
	tabbed.select("home")

	return (
		<>
			<Sub
				title="AppShell"
				note="Icon, back, forward; the title in the middle; minimise, maximise, close. Press on the bar's empty space to move the window, twice to maximise it. Open a board from Home and the strip appears."
			>
				<AppShell
					shell={shell}
					title="foundry"
					icon={<Icon glyph={Chip} size={16} />}
					onBack={shell.back}
					onForward={shell.forward}
					canGoBack={shell.canGoBack()}
					canGoForward={shell.canGoForward()}
					onMinimize={() => setSaid("minimise")}
					onMaximize={() => {
						setMaximized((was) => !was)
						setSaid(maximized() ? "maximise" : "restore")
					}}
					onClose={() => setSaid("close")}
					onDragStart={() => setSaid("move")}
					maximized={maximized()}
					class={`h-112 ${WINDOW}`}
				/>
				<p class="m-0 mt-2 text-small opacity-muted">
					The window was asked to: <b>{said()}</b> · showing <b>{shell.active()}</b> ·{" "}
					{shell.pages().length} open
				</p>
			</Sub>

			<Sub
				title="AppShell · open pages"
				note="The strip: one glyph a page, Home first. A tab's card opens to its right, with a picture of the page. The showing tab turns into a cross under the pointer."
			>
				<AppShell
					shell={tabbed}
					title="kiln"
					icon={<Icon glyph={Chip} size={16} />}
					onBack={tabbed.back}
					onForward={tabbed.forward}
					canGoBack={tabbed.canGoBack()}
					canGoForward={tabbed.canGoForward()}
					onMinimize={() => {}}
					onMaximize={() => {}}
					onClose={() => {}}
					class={`h-80 ${WINDOW}`}
				/>
			</Sub>

			<Sub
				title="AppShell, in a browser tab"
				note="No function, no button: with no window to act on, the bar is the icon and the title."
			>
				<AppShell
					shell={alone}
					title="quarry"
					icon={<Icon glyph={Chip} size={16} />}
					class={`h-32 ${WINDOW}`}
				/>
			</Sub>
		</>
	)
}

export function WorkspaceDemo() {
	return (
		<>
			<Sub
				title="Workspace"
				note="A page as two columns, 25% and 75%: what you set and read on the left, the thing itself on the right. The narrow one never goes under 16rem."
			>
				<Workspace
					asideLabel="Board settings"
					class={`h-80 p-gap ${WINDOW}`}
					aside={<BoardSettings name="buck-5v" meta="25%" />}
				>
					<Stage>75% — the work</Stage>
				</Workspace>
			</Sub>

			<Sub
				title="Workspace · narrow"
				note="Under 48rem of its own width — not the window's — there is no room for that ratio, and the columns stack, the narrow one first."
			>
				<Workspace
					asideLabel="Board settings"
					class={`max-w-96 p-gap ${WINDOW}`}
					aside={<BoardSettings name="buck-5v" />}
				>
					<div class="flex h-32 flex-col">
						<Stage>the work, beneath</Stage>
					</div>
				</Workspace>
			</Sub>
		</>
	)
}

export function UIShellDemo() {
	const [panel, setPanel] = createSignal(false)
	const [page, setPage] = createSignal("Boards")

	const links = () => (
		<>
			<For each={["Boards", "Parts", "Machines"]}>
				{(name) => (
					<HeaderMenuItem
						href="#uishell"
						isActive={page() === name}
						onClick={() => setPage(name)}
					>
						{name}
					</HeaderMenuItem>
				)}
			</For>
		</>
	)

	return (
		<>
			<Sub
				title="Header · SideNav · Content"
				note="Carbon's UI Shell. The bar's links move into the side nav below lg; the menu button opens it there."
			>
				<div class="relative flex h-96 flex-col border-2 border-ink bg-white shadow-hard">
					<HeaderContainer
						render={(state) => (
							<>
								<Header aria-label="Alumina quarry">
									<SkipToContent href="#uishell-content" />
									<HeaderMenuButton
										isActive={state.isSideNavExpanded()}
										onClick={state.onClickSideNavExpand}
									/>
									<HeaderName href="#uishell" prefix="Alumina">quarry</HeaderName>
									<HeaderNavigation aria-label="Sections">
										{links()}
										<HeaderMenu menuLinkName="More" aria-label="More">
											<HeaderMenuItem href="#uishell">Changelog</HeaderMenuItem>
											<HeaderMenuItem href="#uishell">Status</HeaderMenuItem>
										</HeaderMenu>
									</HeaderNavigation>
									<HeaderGlobalBar>
										<HeaderGlobalAction aria-label="Search">
											<Icon glyph={Search} size={20} />
										</HeaderGlobalAction>
										<HeaderGlobalAction aria-label="Notifications" disabled>
											<Icon glyph={Notification} size={20} />
										</HeaderGlobalAction>
										<HeaderGlobalAction
											aria-label="Apps"
											tooltipAlignment="end"
											isActive={panel()}
											onClick={() => setPanel((open) => !open)}
										>
											<Icon glyph={SwitcherIcon} size={20} />
										</HeaderGlobalAction>
									</HeaderGlobalBar>
									<HeaderPanel expanded={panel()} aria-label="Apps">
										<Switcher aria-label="Apps">
											<SwitcherItem href="#uishell" isSelected>quarry</SwitcherItem>
											<SwitcherItem href="#uishell">foundry</SwitcherItem>
											<SwitcherDivider />
											<SwitcherItem href="#uishell">kiln</SwitcherItem>
										</Switcher>
									</HeaderPanel>
								</Header>
								<div class="relative flex min-h-0 flex-1">
									<SideNav
										aria-label="Side navigation"
										expanded={state.isSideNavExpanded()}
										onToggle={() => state.onClickSideNavExpand()}
									>
										<SideNavItems>
											<HeaderSideNavItems hasDivider>{links()}</HeaderSideNavItems>
											<SideNavLink href="#uishell" renderIcon={Dashboard} isActive>
												Overview
											</SideNavLink>
											<SideNavLink href="#uishell" renderIcon={Cube}>Meshes</SideNavLink>
											<SideNavMenu title="Files" renderIcon={Document} defaultExpanded>
												<SideNavMenuItem href="#uishell">board.xml</SideNavMenuItem>
												<SideNavMenuItem href="#uishell">bom.csv</SideNavMenuItem>
											</SideNavMenu>
											<SideNavDivider />
											<SideNavLink href="#uishell" renderIcon={Settings}>Settings</SideNavLink>
										</SideNavItems>
									</SideNav>
									<Content id="uishell-content" tagName="div" class="p-4">
										<p class="m-0 text-body">
											Showing <b>{page()}</b>. The side nav stands at its full width from lg up.
										</p>
									</Content>
								</div>
							</>
						)}
					/>
				</div>
			</Sub>

			<Sub
				title="SideNav · rail"
				note="3rem of icons, opening over the page under the pointer or the focus."
			>
				<div class="relative flex h-48 border-2 border-ink bg-white shadow-hard">
					<SideNav isRail aria-label="Rail">
						<SideNavItems>
							<SideNavLink href="#uishell" renderIcon={Dashboard} large isActive>
								Overview
							</SideNavLink>
							<SideNavLink href="#uishell" renderIcon={Cube} large>Meshes</SideNavLink>
							<SideNavLink href="#uishell" renderIcon={Settings} large>Settings</SideNavLink>
						</SideNavItems>
					</SideNav>
					<Content tagName="div" id="uishell-rail-content" class="p-4">
						<StructuredListWrapper aria-label="What a rail is" isCondensed isFlush>
							<StructuredListBody>
								<StructuredListRow>
									<StructuredListCell class="text-small opacity-muted">shut</StructuredListCell>
									<StructuredListCell trailing class="text-small font-bold">
										3rem
									</StructuredListCell>
								</StructuredListRow>
								<StructuredListRow>
									<StructuredListCell class="text-small opacity-muted">open</StructuredListCell>
									<StructuredListCell trailing class="text-small font-bold">
										16rem, over the page
									</StructuredListCell>
								</StructuredListRow>
							</StructuredListBody>
						</StructuredListWrapper>
					</Content>
				</div>
			</Sub>
		</>
	)
}
