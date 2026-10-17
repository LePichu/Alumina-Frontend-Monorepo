import { A, createAsync, useLocation, useNavigate } from "@solidjs/router"
import { For, Show } from "solid-js"
import ArrowLeft from "@carbon/icons/es/arrow--left/16"
import Add from "@carbon/icons/es/add/16"
import CaretDown from "@carbon/icons/es/caret--down/16"
import Chip from "@carbon/icons/es/chip/16"
import Fork from "@carbon/icons/es/fork/16"
import Grid from "@carbon/icons/es/grid/16"
import Printer from "@carbon/icons/es/printer/16"
import SearchIcon from "@carbon/icons/es/search/16"
import Settings from "@carbon/icons/es/settings/16"
import Star from "@carbon/icons/es/star/16"
import Upload from "@carbon/icons/es/upload/16"
import {
	Avatar,
	ContentSwitcher,
	Icon,
	OverflowMenu,
	OverflowMenuItem,
	Search,
	Switch,
	Tile,
} from "@alumina/design"
import type { CarbonGlyph } from "@alumina/design"
import avatarUrl from "../fixtures/avatar.jpg?url"
import { getViewer } from "../lib/quarry"

/** quarry's nav: one sticky bordered container, divided into sections.
 *
 * Not a row of controls with gaps between them — the whole bar is a single box
 * and every section is a cell inside it, separated by the same 2px ink rule the
 * box is drawn with. That is why the switcher is `flush`: a boxed one would draw
 * a second border inside this one and its selected cell would stop short of the
 * bar's own top and bottom edges.
 *
 * Deliberately absent, per the prototype review: a "Repo" item, and a `+` button.
 * Publishing starts from "New board" in the account menu, not from the nav.
 */

/** Where each switcher cell goes. Index order is the tab order. */
const SECTIONS = [
	{ icon: Grid, label: "Home", href: "/" },
	{ icon: SearchIcon, label: "Search boards", href: "/search" },
] as const

export function Nav() {
	const viewer = createAsync(() => getViewer())
	const navigate = useNavigate()
	const location = useLocation()

	// A board page is reached from search, so it keeps search lit — the prototype
	// does the same. Anything else falls back to home.
	const selected = () =>
		location.pathname.startsWith("/search") || location.pathname.split("/").length > 2 ? 1 : 0

	return (
		// The bar is a Tile; the sections inside it are the nav's own.
		<nav aria-label="quarry" class="sticky top-4 z-30 mt-6">
			<Tile flush>
				<div class="flex h-14 items-stretch">
					{/* The wordmark is an ink block, not a link styled to look like one. */}
					<A
						href="/"
						class="flex items-center gap-snug border-r-2 border-ink bg-ink px-4 text-white no-underline"
					>
						<b class="text-brand font-bold">quarry</b>
						<span class="hidden text-micro uppercase opacity-muted sm:inline">boards</span>
					</A>

					{
						/* The switcher's own dividers separate its cells; the rule on the right
			    is the seam between this section and the next. */
					}
					<ContentSwitcher
						flush
						selectedIndex={selected()}
						onChange={(index) => navigate(SECTIONS[index]?.href ?? "/")}
						class="border-r-2 border-ink"
					>
						<For each={SECTIONS}>
							{(section) => (
								<Switch renderIcon={section.icon} iconDescription={section.label} class="w-14" />
							)}
						</For>
					</ContentSwitcher>

					{
						/* Takes the slack. Bare, because the bar around it already is the field.
			    Gone on a phone, where there is no slack to take: the switcher's second
			    cell already goes to the search page, so nothing is lost but a field
			    squeezed to nothing. */
					}
					<div class="hidden min-w-0 flex-1 items-center border-r-2 border-ink px-2 md:flex">
						<Search
							bare
							class="min-w-0 flex-1"
							labelText="Search boards, parts, owners"
							placeholder="Search boards, parts, owners"
							shortcut="/"
							size="sm"
							onFocus={() => {
								if (!location.pathname.startsWith("/search")) navigate("/search")
							}}
						/>
					</div>

					<Show when={viewer()}>
						{(user) => (
							<OverflowMenu
								label={`Account · ${user().handle}`}
								align="bottom-end"
								// Layout only: the cell has to fill the bar's height and read
								// left-to-right. The invert-when-open is the component's own.
								// ml-auto so the account still sits at the far edge once the search
								// field is gone.
								class="ml-auto h-full gap-2 border-0 px-2"
								trigger={
									<>
										<Avatar image={avatarUrl} name={user().handle} size="sm" />
										<span class="hidden min-w-0 flex-col text-left sm:flex">
											<span class="truncate text-body font-bold">{user().handle}</span>
											<span class="text-micro uppercase opacity-muted">{user().machine}</span>
										</span>
										<Icon glyph={CaretDown} size={16} />
									</>
								}
							>
								<div class="flex items-center gap-2 border-b-2 border-ink px-2 py-snug">
									<Avatar image={avatarUrl} name={user().handle} />
									<span class="flex min-w-0 flex-col">
										<b class="truncate text-body font-bold">{user().handle}</b>
										<span class="text-micro opacity-muted">
											Signed in · {user().boards} boards
										</span>
									</span>
								</div>

								<OverflowMenuItem
									itemText={<MenuRow glyph={Add} label="New board" />}
									onClick={() => navigate("/new")}
								/>
								<OverflowMenuItem
									itemText={<MenuRow glyph={Chip} label="Your boards" value={user().boards} />}
									onClick={() => navigate("/search?owner=me")}
								/>
								<OverflowMenuItem
									itemText={<MenuRow glyph={Fork} label="Your forks" value={user().forks} />}
									onClick={() => navigate("/search")}
								/>
								<OverflowMenuItem
									itemText={<MenuRow glyph={Star} label="Starred" value={user().starred} />}
								/>
								<OverflowMenuItem
									hasDivider
									itemText={
										<MenuRow glyph={Printer} label="Machine profile" value={user().machine} />
									}
								/>
								<OverflowMenuItem
									itemText={
										<MenuRow
											glyph={Upload}
											label="Uploads today"
											value={`${user().uploadsUsed} of ${user().uploadsAllowed}`}
										/>
									}
								/>
								<OverflowMenuItem
									hasDivider
									itemText={<MenuRow glyph={Settings} label="Settings" />}
								/>
								<OverflowMenuItem itemText={<MenuRow glyph={ArrowLeft} label="Sign out" />} />
							</OverflowMenu>
						)}
					</Show>
				</div>
			</Tile>
		</nav>
	)
}

type MenuRowProps = {
	glyph: CarbonGlyph
	label: string
	value?: string | number
}

/** One line of the account menu: glyph, label, and the count or setting it
 *  carries, dimmed at the trailing edge. */
function MenuRow(props: MenuRowProps) {
	return (
		<span class="flex w-full items-center gap-2">
			<Icon glyph={props.glyph} size={16} />
			{props.label}
			<Show when={props.value !== undefined}>
				<span class="ml-auto text-micro uppercase opacity-muted">{props.value}</span>
			</Show>
		</span>
	)
}
