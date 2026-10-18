import { createResource, createSignal, For, Show } from "solid-js"
import Chip from "@carbon/icons/es/chip/16"
import Cube from "@carbon/icons/es/cube/16"
import Information from "@carbon/icons/es/information/16"
import Login from "@carbon/icons/es/login/16"
import PrinterIcon from "@carbon/icons/es/printer/16"
import User from "@carbon/icons/es/user/16"
import View from "@carbon/icons/es/view/16"
import {
	Avatar,
	Background,
	Button,
	FormGroup,
	Icon,
	ScrollArea,
	Select,
	SelectItem,
	Tab,
	TabListVertical,
	TabPanel,
	TabPanels,
	TabsVertical,
	TextInput,
	Tile,
	TileSection,
	Toggle,
	Workspace,
} from "@alumina/design"
import avatarUrl from "../fixtures/avatar.jpg?url"
import { APP_KIND, APP_NAME, APP_VERSION } from "../lib/app"
import { cacheStats, MICA_DEFAULT, micaAddress, micaRoute, setMicaAddress } from "../lib/mica"
import { inDesktop, ZOOMS } from "../lib/window"
import { MachineFields, TOOL_CHANGE_NOTE } from "./MachineTile"
import { useStudio } from "./Studio"

/** The five things foundry can be told about. Order here is tab order, and
 *  panel order below has to match it. */
export const SETTINGS_PANES = [
	{ id: "printer", label: "Printer", glyph: PrinterIcon },
	{ id: "machine", label: "Machine", glyph: Chip },
	{ id: "engine", label: "Engine", glyph: Cube },
	{ id: "account", label: "Account", glyph: User },
	{ id: "interface", label: "Interface", glyph: View },
	{ id: "about", label: "About", glyph: Information },
] as const

export type SettingsPane = (typeof SETTINGS_PANES)[number]["id"]

/** Settings' tab: a page on the 25/75 workspace, on the moving floor — the
 *  sections down the narrow column, the one chosen in the wide one, ruled into
 *  groups of inline fields.
 *
 *  It has been kiln's settings dialog over the page, and then that dialog drawn
 *  in a tab: a box inside a box, with a bar and a "Done" of its own, in a page
 *  that has both already. Now it is the page — the same shape as Home — and
 *  the tab's own cross closes it.
 *
 *  Every change takes effect as it is made — the machine's limits are the same
 *  store a board's Machine panel edits — so there is nothing to save. The
 *  toggles with no consumer yet are real controls, as kiln's are: they are how
 *  the pane is specified, and they bind when there is a printer protocol to
 *  bind to.
 */
export function SettingsPage() {
	const studio = useStudio()
	const account = studio.account
	const printer = () => studio.printers()?.[studio.printer()]
	// What mica holds, read when its pane is shown and again on asking.
	const [store, { refetch: recount }] = createResource(
		() => studio.settingsPane() === "engine" && studio.engine().state === "up",
		(asked) => (asked ? cacheStats() : undefined),
	)
	const [address, setAddress] = createSignal(micaAddress())
	const route = micaRoute()
	const megabytes = (bytes: number) => `${(bytes / 1048576).toFixed(1)} MB`
	const health = () => {
		const engine = studio.engine()
		return engine.state === "up" ? engine.health : undefined
	}

	const pane = () =>
		SETTINGS_PANES.find((entry) => entry.id === studio.settingsPane()) ??
			SETTINGS_PANES[0]

	return (
		<>
			<Background variant="grid" static={!studio.motion()} />
			{
				/* The tabs' context wraps both columns: the list is in the narrow one,
			    the panels in the wide one. */
			}
			<TabsVertical
				class="relative z-10 flex h-full flex-col"
				selectedIndex={Math.max(
					0,
					SETTINGS_PANES.findIndex((entry) => entry.id === studio.settingsPane()),
				)}
				onChange={(index) => studio.setSettingsPane(SETTINGS_PANES[index]?.id ?? "printer")}
			>
				<Workspace
					asideLabel="Settings sections"
					class="h-full p-gap"
					aside={
						// The sections and nothing else: no bar over them — the shell's own
						// already says Settings — no padding round them, and no footer
						// (About has the version). The chosen section is the one inked row.


							<Tile flush fill class="flex min-h-0 flex-1 flex-col">
								{
									/* No fade: a fade is 4rem tall and holds its pane open to that, so on a
							    phone the list lying in one row had a blank band beneath it. */
								}
								<ScrollArea fade={false}>
									<TabListVertical aria-label="Settings sections">
										<For each={SETTINGS_PANES}>
											{(entry) => (
												<Tab>
													<Icon glyph={entry.glyph} size={16} />
													{entry.label}
												</Tab>
											)}
										</For>
									</TabListVertical>
								</ScrollArea>
							</Tile>

					}
				>
					<Tile
						bar
						flush
						fill
						heading={
							<>
								<Icon glyph={pane().glyph} size={16} />
								{pane().label}
							</>
						}
						class="flex min-h-0 flex-1 flex-col"
					>
						<ScrollArea>
							<TabPanels>
								{/* ---- printer ---- */}
								<TabPanel>
									<TileSection>
										<FormGroup
											legendText="Printer"
											helperText="The machine every open board slices for, and the one a job is sent to."
										>
											<Show when={studio.printers()}>
												{(list) => (
													<Select
														inline
														size="sm"
														labelText="printer"
														value={String(studio.printer())}
														onChange={(value) => studio.setPrinter(Number(value))}
													>
														<For each={list()}>
															{(entry, at) => (
																<SelectItem
																	value={String(at())}
																	text={entry.name}
																/>
															)}
														</For>
													</Select>
												)}
											</Show>
											<Show when={printer()}>
												{(current) => (
													<>
														<TextInput
															inline
															size="sm"
															readOnly
															labelText="state"
															value={current().state}
														/>
														<TextInput
															inline
															size="sm"
															readOnly
															labelText="link"
															value={current().link || "none"}
														/>
														<TextInput
															inline
															size="sm"
															readOnly
															labelText="address"
															value={current().address || "—"}
														/>
														<TextInput
															inline
															size="sm"
															readOnly
															labelText="firmware"
															value={current().firmware || "—"}
														/>
													</>
												)}
											</Show>
										</FormGroup>
									</TileSection>
									<TileSection>
										<FormGroup legendText="Connection">
											<Toggle
												inline
												size="sm"
												labelText="connect on launch"
												toggled
											/>
											<Toggle
												inline
												size="sm"
												labelText="reconnect when the link drops"
												toggled
											/>
											<Toggle
												inline
												size="sm"
												labelText="hold a job until I confirm"
												toggled
											/>
										</FormGroup>
									</TileSection>
								</TabPanel>

								{/* ---- machine ---- */}
								<TabPanel>
									<TileSection>
										<FormGroup
											legendText="Alumina Z1"
											helperText={TOOL_CHANGE_NOTE}
										>
											<MachineFields
												machine={studio.machine}
												onChange={(patch) => studio.setMachine(patch)}
											/>
										</FormGroup>
									</TileSection>
									<TileSection>
										<p class="m-0 text-small opacity-muted">
											The same limits as each board's Machine panel: the machine is the app's, not a
											board's. Its tool modules are reported when it connects, and shown with each
											board.
										</p>
									</TileSection>
								</TabPanel>

								{/* ---- engine ---- */}
								<TabPanel>
									<TileSection>
										<FormGroup
											legendText="mica"
											helperText="The engine: it reads a board and makes the slabs, their ink and the fixtures. It keeps all of that in memory, so after a restart foundry hands it the board again from this machine."
										>
											<TextInput
												inline
												size="sm"
												readOnly
												labelText="status"
												value={studio.engine().state === "up"
													? "answering"
													: studio.engine().state === "down"
													? "not answering"
													: "checking"}
											/>
											<Show when={health()}>
												{(up) => (
													<>
														<TextInput
															inline
															size="sm"
															readOnly
															labelText="version"
															value={up().version}
														/>
														<TextInput
															inline
															size="sm"
															readOnly
															labelText="up for"
															value={`${Math.floor(up().uptime_s / 60)} min`}
														/>
													</>
												)}
											</Show>
											<Show
												when={route.via === "direct"}
												fallback={
													<TextInput
														inline
														size="sm"
														readOnly
														labelText="reached"
														value={`through the dev server, at ${route.target}`}
													/>
												}
											>
												{
													/* Where the desktop app asks for it. Loopback only: mica has no
											    authentication, and the window is allowed no further. */
												}
												<TextInput
													inline
													size="sm"
													labelText="address"
													value={address()}
													placeholder={MICA_DEFAULT}
													onChange={(event) => {
														setAddress(event.currentTarget.value)
														setMicaAddress(event.currentTarget.value)
														void studio.checkEngine()
													}}
												/>
											</Show>
											<Button
												kind="secondary"
												size="sm"
												flat
												class="mt-2"
												onClick={() => {
													void studio.checkEngine()
													void recount()
												}}
											>
												Check again
											</Button>
										</FormGroup>
									</TileSection>
									<Show when={store.state === "ready" ? store() : undefined}>
										{(held) => (
											<TileSection>
												<FormGroup legendText="What it holds">
													<TextInput
														inline
														size="sm"
														readOnly
														labelText="memory"
														value={`${megabytes(held().vfs.bytes)} of ${
															megabytes(held().vfs.budget)
														}`}
													/>
													<TextInput
														inline
														size="sm"
														readOnly
														labelText="runs"
														value={`${held().runs.computed} made · ${held().runs.served_from_cache} again`}
													/>
													<TextInput
														inline
														size="sm"
														readOnly
														labelText="pushed out"
														value={String(held().vfs.evictions)}
													/>
												</FormGroup>
											</TileSection>
										)}
									</Show>
								</TabPanel>

								{/* ---- account ---- */}
								<TabPanel>
									<Show when={account.state === "ready" && !account()}>
										<TileSection>
											<FormGroup
												legendText="Not signed in"
												helperText="Foundry works without an account. One keeps your boards in the cloud, publishes them to quarry and brings the news."
											>
												<Button
													kind="primary"
													size="sm"
													flat
													renderIcon={Login}
													onClick={() => studio.openSignIn()}
												>
													Sign in
												</Button>
											</FormGroup>
										</TileSection>
									</Show>
									<Show when={account()}>
										{(user) => (
											<>
												<TileSection>
													<FormGroup legendText="Signed in">
														{/* Flat: the dialog already carries the one hard shadow. */}
														<Tile flat flush>
															<div class="flex items-center gap-2 p-2">
																<Avatar
																	image={avatarUrl}
																	name={user().handle}
																	size="lg"
																/>
																<span class="flex min-w-0 flex-1 flex-col">
																	<b class="truncate text-body font-bold">
																		{user().handle}
																	</b>
																	<small class="truncate text-micro opacity-muted">
																		{user().email}
																	</small>
																	<small class="truncate text-micro opacity-muted">
																		{user().plan} · slices for {user().machine}
																	</small>
																</span>
																<Button
																	kind="tertiary"
																	size="sm"
																	onClick={() => void studio.signOut()}
																>
																	Sign out
																</Button>
															</div>
														</Tile>
													</FormGroup>
												</TileSection>
												<TileSection>
													<FormGroup
														legendText="Cloud"
														helperText="Boards stay on this machine until there is a cloud to keep them in."
													>
														<Toggle
															inline
															size="sm"
															labelText="sync boards as they are saved"
														/>
														<Button
															kind="secondary"
															size="sm"
															flat
															class="mt-2"
															onClick={() => void studio.sync()}
														>
															Sync now
														</Button>
													</FormGroup>
												</TileSection>
												<TileSection>
													<FormGroup
														legendText="Newsletter"
														helperText={`Monthly, to ${user().email}: releases, a technique, and a board from the community.`}
													>
														<Button
															kind="secondary"
															size="sm"
															flat
															onClick={() => void studio.subscribe()}
														>
															Subscribe
														</Button>
													</FormGroup>
												</TileSection>
											</>
										)}
									</Show>
								</TabPanel>

								{/* ---- interface ---- */}
								<TabPanel>
									<TileSection>
										<FormGroup
											legendText="Display"
											helperText={inDesktop()
												? "Ctrl + and Ctrl − step through the same levels, and Ctrl 0 is 100%."
												: "In a browser the page follows the browser's own zoom."}
										>
											<Show
												when={studio.window()}
												fallback={
													<TextInput
														inline
														size="sm"
														readOnly
														labelText="zoom"
														value="the browser's"
													/>
												}
											>
												{(win) => (
													<Select
														inline
														size="sm"
														labelText="zoom"
														value={String(win().zoom())}
														onChange={(value) => win().setZoom(Number(value))}
													>
														<For each={ZOOMS}>
															{(level) => (
																<SelectItem
																	value={String(level)}
																	text={`${Math.round(level * 100)}%`}
																/>
															)}
														</For>
													</Select>
												)}
											</Show>
										</FormGroup>
									</TileSection>
									<TileSection>
										<FormGroup
											legendText="Backdrop"
											helperText="The floor stands still on its own when the system asks for reduced motion."
										>
											<Toggle
												inline
												size="sm"
												labelText="move the home screen's floor"
												toggled={studio.motion()}
												onToggle={studio.setMotion}
											/>
										</FormGroup>
									</TileSection>
								</TabPanel>

								{/* ---- about ---- */}
								<TabPanel>
									<TileSection>
										<FormGroup legendText={`${APP_NAME} ${APP_KIND}`}>
											<TextInput
												inline
												size="sm"
												readOnly
												labelText="version"
												value={APP_VERSION}
											/>
											<TextInput
												inline
												size="sm"
												readOnly
												labelText="running in"
												value={inDesktop() ? "desktop app" : "browser"}
											/>
											<TextInput
												inline
												size="sm"
												readOnly
												labelText="engine"
												value={health() ? `mica ${health()?.version}` : "mica · not answering"}
											/>
											<TextInput
												inline
												size="sm"
												readOnly
												labelText="machine"
												value="Alumina Z1"
											/>
										</FormGroup>
									</TileSection>
									<TileSection>
										<p class="m-0 text-small opacity-muted">
											{APP_NAME}{" "}
											turns an IPC-2581 board into a print for the Alumina Z1: the substrate printed
											in layers, conductive ink laid in its channels.
										</p>
									</TileSection>
								</TabPanel>
							</TabPanels>
						</ScrollArea>
					</Tile>
				</Workspace>
			</TabsVertical>
		</>
	)
}
