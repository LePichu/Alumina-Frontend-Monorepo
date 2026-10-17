import { For } from "solid-js"
import Chip from "@carbon/icons/es/chip/16"
import Home from "@carbon/icons/es/home/16"
import PrinterIcon from "@carbon/icons/es/printer/16"
import Rule from "@carbon/icons/es/rule/16"
import SettingsIcon from "@carbon/icons/es/settings/16"
import User from "@carbon/icons/es/user/16"
import View from "@carbon/icons/es/view/16"
import Wifi from "@carbon/icons/es/wifi/16"
import {
	Avatar,
	Button,
	ContentSwitcher,
	FormGroup,
	Icon,
	Modal,
	NumberInput,
	Select,
	SelectItem,
	Switch,
	Tab,
	TabListVertical,
	TabPanel,
	TabPanels,
	TabsVertical,
	TextInput,
	Tile,
	TileSection,
	Toggle,
} from "@alumina/design"
import avatarUrl from "../fixtures/avatar.jpg?url"
import { MODELS } from "../lib/agent"
import type { ModelId } from "../lib/agent"
import { describeWhere, getAccount, listPrinters } from "../lib/workspace"
import type { Where } from "../lib/workspace"

/** The five things kiln can be told about — what it thinks with, what it
 *  designs to, where the board goes, who you are, and how the screen behaves.
 *  Order here is tab order, and panel order below has to match it. */
const PANES = [
	{ label: "Agent", glyph: Chip },
	{ label: "Process", glyph: Rule },
	{ label: "Hand-off", glyph: PrinterIcon },
	{ label: "Account", glyph: User },
	{ label: "Interface", glyph: View },
] as const

const WHERE_ORDER: Where[] = ["local", "remote"]

export type SettingsProps = {
	open: boolean
	model: ModelId
	where: Where
	printer: string
	onModelChange: (model: ModelId) => void
	onWhereChange: (where: Where) => void
	onPrinterChange: (id: string) => void
	onClose: () => void
}

/** Settings as a two-pane modal: left navigation, right body.
 *
 *  Vertical Tabs around a Modal. The tab list sits in the Modal's navigation
 *  slot and the panels in its body — two different places in the dialog — so the
 *  Tabs wrapper goes outside both and only supplies the context that joins them.
 *  The nav was a column of hand-built buttons with `aria-pressed`; as tabs it
 *  gets arrow-key travel and "tab 2 of 5" for nothing.
 *
 *  Each pane is ruled into sections, each section a FormGroup of inline fields:
 *  what it is on the left, the control that sets it hard against the right.
 *
 *  Only the settings that something outside this dialog can see are wired up:
 *  the model, where runs execute, and the target printer. The rest are real
 *  controls with no consumer yet, exactly as in the prototype — they are how the
 *  pane is specified, and they will bind when there is a backend to bind to.
 */
export function Settings(props: SettingsProps) {
	const account = getAccount()

	return (
		<TabsVertical>
			<Modal
				open={props.open}
				onRequestClose={props.onClose}
				onRequestSubmit={props.onClose}
				modalHeading={
					<>
						<Icon glyph={SettingsIcon} size={16} />Settings
					</>
				}
				size="lg"
				flush
				primaryButtonText="Save"
				secondaryButtonText="Cancel"
				// 136 spacing units is 34rem: a fixed height, so the nav's signature has
				// a floor to sit on and the dialog does not jump as panes change.
				class="h-136"
				navigation={
					<div class="flex h-full flex-col">
						<TabListVertical aria-label="Settings sections">
							<For each={PANES}>
								{(pane) => (
									<Tab>
										<Icon glyph={pane.glyph} size={16} />
										{pane.label}
									</Tab>
								)}
							</For>
						</TabListVertical>
						<p class="m-0 mt-auto hidden border-t-2 border-ink p-2 text-micro normal-case opacity-muted sm:block">
							kiln v0.1
							<br />
							{describeWhere(props.where).signature}
						</p>
					</div>
				}
			>
				<TabPanels>
					{/* ---- agent ---- */}
					<TabPanel>
						<TileSection>
							<FormGroup
								legendText="Model"
								helperText="raijin is quick and literal. perun plans before it writes. indra is slow and worth it on boards you intend to fabricate."
							>
								<Select
									inline
									size="sm"
									labelText="default model"
									value={props.model}
									onChange={(value) => props.onModelChange(value as ModelId)}
								>
									<For each={MODELS}>{(model) => <SelectItem value={model} text={model} />}</For>
								</Select>
								<Select inline size="sm" labelText="fall back when a run stalls" value="perun">
									<SelectItem value="raijin" text="raijin" />
									<SelectItem value="perun" text="perun" />
									<SelectItem value="none" text="none" />
								</Select>
							</FormGroup>
						</TileSection>
						<TileSection>
							<FormGroup legendText="Behaviour">
								<Toggle inline size="sm" labelText="ask before routing" toggled />
								<Toggle inline size="sm" labelText="run DRC every pass" toggled />
								<Toggle inline size="sm" labelText="simulate power nets" toggled />
								<Toggle inline size="sm" labelText="retry once on a failed check" toggled />
								<NumberInput inline size="sm" labelText="route time limit" value={120} unit="s" />
							</FormGroup>
						</TileSection>
					</TabPanel>

					{/* ---- process ---- */}
					<TabPanel>
						<TileSection>
							<FormGroup legendText="Rules">
								<NumberInput
									inline
									size="sm"
									labelText="trace floor"
									step={0.01}
									value={0.1}
									unit="mm"
								/>
								<NumberInput
									inline
									size="sm"
									labelText="target width"
									step={0.01}
									value={0.3}
									unit="mm"
								/>
								<NumberInput
									inline
									size="sm"
									labelText="minimum clearance"
									step={0.01}
									value={0.3}
									unit="mm"
								/>
								<NumberInput inline size="sm" labelText="default layers" value={4} unit="n" />
							</FormGroup>
						</TileSection>
						<TileSection>
							<FormGroup
								legendText="Materials"
								helperText="These are what the agent designs to when you don't say otherwise. A prompt that names a material wins over anything set here."
							>
								<Select inline size="sm" labelText="default substrate" value="PEI-1010">
									<SelectItem value="PC-GF" text="PC-GF" />
									<SelectItem value="PEI-1010" text="PEI-1010" />
									<SelectItem value="TPC-HT" text="TPC-HT" />
								</Select>
								<Select inline size="sm" labelText="conductive ink" value="silver">
									<SelectItem value="silver" text="silver" />
									<SelectItem value="carbon" text="carbon" />
									<SelectItem value="graphene" text="graphene" />
								</Select>
							</FormGroup>
						</TileSection>
					</TabPanel>

					{/* ---- hand-off ---- */}
					<TabPanel>
						<TileSection>
							<FormGroup legendText="Printer">
								<Select
									inline
									size="sm"
									labelText="default machine"
									value={props.printer}
									onChange={props.onPrinterChange}
								>
									<For each={listPrinters()}>
										{(printer) => <SelectItem value={printer.id} text={printer.name} />}
									</For>
								</Select>
								<Toggle inline size="sm" labelText="slice in foundry automatically" toggled />
								<Toggle inline size="sm" labelText="hold the job until I confirm" toggled />
							</FormGroup>
						</TileSection>
						<TileSection>
							<FormGroup legendText="Export">
								<Toggle inline size="sm" labelText="write IPC-2581 alongside" toggled />
								<Toggle inline size="sm" labelText="write Gerber too" />
							</FormGroup>
							<TextInput class="mt-2" labelText="Output folder" value="~/boards/kiln" size="sm" />
						</TileSection>
					</TabPanel>

					{/* ---- account ---- */}
					<TabPanel>
						<TileSection>
							<FormGroup legendText="Signed in">
								{/* Flat: the dialog already carries the one hard shadow. */}
								<Tile flat flush>
									<div class="flex items-center gap-2 p-2">
										<Avatar image={avatarUrl} name={account.handle} size="lg" />
										<span class="flex min-w-0 flex-1 flex-col">
											<b class="truncate text-body font-bold">{account.handle}</b>
											<small class="truncate text-micro opacity-muted">{account.email}</small>
											<small class="truncate text-micro opacity-muted">{account.role}</small>
										</span>
										<Button kind="tertiary" size="sm">Sign out</Button>
									</div>
								</Tile>
							</FormGroup>
						</TileSection>
						<TileSection>
							<FormGroup
								legendText="Where runs execute"
								helperText={describeWhere(props.where).note}
							>
								<ContentSwitcher
									class="w-full"
									size="sm"
									selectedIndex={WHERE_ORDER.indexOf(props.where)}
									onChange={(index) => props.onWhereChange(WHERE_ORDER[index] ?? "local")}
								>
									<Switch text="Local" renderIcon={Home} class="flex-1" />
									<Switch text="Remote" renderIcon={Wifi} class="flex-1" />
								</ContentSwitcher>
							</FormGroup>
						</TileSection>
						<TileSection>
							<FormGroup legendText="Workspace">
								<div class="mb-2 flex flex-col gap-2">
									<TextInput labelText="Name" value={account.handle} size="sm" />
									<TextInput labelText="Remote endpoint" value="kiln.cloud/eu-west" size="sm" />
								</div>
								<Toggle inline size="sm" labelText="share anonymised runs" />
								<Toggle inline size="sm" labelText="sync threads across machines" />
							</FormGroup>
						</TileSection>
					</TabPanel>

					{/* ---- interface ---- */}
					<TabPanel>
						<TileSection>
							<FormGroup legendText="Appearance">
								<Toggle inline size="sm" labelText="perspective floor" toggled />
								<Toggle inline size="sm" labelText="stream replies" toggled />
								<Toggle inline size="sm" labelText="show run steps expanded" toggled />
							</FormGroup>
						</TileSection>
						<TileSection>
							<FormGroup
								legendText="Composer"
								helperText="Turning off the perspective floor leaves a plain white backdrop, which is easier to read against on a small screen."
							>
								<Toggle inline size="sm" labelText="enter sends" toggled />
								<Toggle inline size="sm" labelText="suggestions on the new board page" toggled />
							</FormGroup>
						</TileSection>
					</TabPanel>
				</TabPanels>
			</Modal>
		</TabsVertical>
	)
}
