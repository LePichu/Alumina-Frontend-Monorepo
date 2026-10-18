import { Show } from "solid-js"
import CaretUp from "@carbon/icons/es/caret--up/16"
import CloudUpload from "@carbon/icons/es/cloud--upload/16"
import Login from "@carbon/icons/es/login/16"
import Logout from "@carbon/icons/es/logout/16"
import Printer from "@carbon/icons/es/printer/16"
import Settings from "@carbon/icons/es/settings/16"
import {
	Avatar,
	ContainedList,
	ContainedListItem,
	Icon,
	OverflowMenu,
	OverflowMenuItem,
	TileSection,
} from "@alumina/design"
import type { CarbonGlyph } from "@alumina/design"
import avatarUrl from "../../fixtures/avatar.jpg?url"
import { useStudio } from "../Studio"

/** Who is signed in, at the foot of the start pane, and what goes with the
 *  account — as kiln's rail ends on its account and quarry's nav on its menu.
 *  With nobody signed in, it is one more command, the start list's last: Sign
 *  in, which opens the sign-in page.
 *
 *  The whole row is the menu's trigger, and the menu opens upwards: it is at the
 *  bottom of the window. */
export function AccountMenu() {
	const studio = useStudio()
	// Only once the account has been read: a sign-in row that flashes up before
	// the account arrives would be a lie for a moment.
	const signedOut = () => studio.account.state === "ready" && !studio.account()

	return (
		<TileSection flush>
			<Show when={signedOut()}>
				<ContainedList commands size="lg">
					<ContainedListItem
						renderIcon={Login}
						onClick={() => studio.openSignIn()}
					>
						Sign in
					</ContainedListItem>
				</ContainedList>
			</Show>
			<Show when={studio.account()}>
				{(user) => (
					<OverflowMenu
						label={`Account · ${user().handle}`}
						align="top-start"
						// Layout only: the trigger is the section's whole width, read left to
						// right. Inverting while the menu is open is the component's own.
						class="w-full justify-start gap-2 px-2 py-snug"
						menuOptionsClass="min-w-64"
						trigger={
							<>
								<Avatar image={avatarUrl} name={user().handle} size="sm" />
								<span class="flex min-w-0 flex-1 flex-col text-left">
									<span class="truncate text-small font-bold">{user().handle}</span>
									<span class="text-micro uppercase opacity-muted">{user().plan} · signed in</span>
								</span>
								<Icon glyph={CaretUp} size={16} />
							</>
						}
					>
						<div class="flex items-center gap-2 border-b-2 border-ink px-2 py-snug">
							<Avatar image={avatarUrl} name={user().handle} />
							<span class="flex min-w-0 flex-col">
								<b class="truncate text-body font-bold">{user().handle}</b>
								<span class="truncate text-micro opacity-muted">{user().email}</span>
							</span>
						</div>
						<OverflowMenuItem
							itemText={<MenuRow glyph={Printer} label="Machine profile" value={user().machine} />}
							onClick={() => studio.openSettings("machine")}
						/>
						<OverflowMenuItem
							itemText={<MenuRow glyph={CloudUpload} label="Sync to cloud" />}
							onClick={() => void studio.sync()}
						/>
						<OverflowMenuItem
							hasDivider
							itemText={<MenuRow glyph={Settings} label="Settings" />}
							onClick={() => studio.openSettings()}
						/>
						<OverflowMenuItem
							itemText={<MenuRow glyph={Logout} label="Sign out" />}
							onClick={() => void studio.signOut()}
						/>
					</OverflowMenu>
				)}
			</Show>
		</TileSection>
	)
}

/** One line of the menu: glyph, label, and the setting it carries, dimmed at
 *  the trailing edge. quarry's account menu draws its rows the same way. */
function MenuRow(props: { glyph: CarbonGlyph; label: string; value?: string }) {
	return (
		<span class="flex w-full items-center gap-2">
			<Icon glyph={props.glyph} size={16} />
			{props.label}
			<Show when={props.value}>
				<span class="ml-auto text-micro uppercase opacity-muted">{props.value}</span>
			</Show>
		</span>
	)
}
