import { createSignal, For, Match, Show, Switch as Branch } from "solid-js"
import Document from "@carbon/icons/es/document/16"
import PrinterIcon from "@carbon/icons/es/printer/16"
import Rule from "@carbon/icons/es/rule/16"
import ToolKit from "@carbon/icons/es/tool-kit/16"
import Reset from "@carbon/icons/es/reset/16"
import {
	Button,
	ContentSwitcher,
	Icon,
	NumberInput,
	RadioTile,
	ScrollArea,
	Swatch,
	Switch,
	TextInput,
	Tile,
	TileGroup,
	TileSection,
	Toggle,
} from "@alumina/design"
import type { OpenBoard } from "../lib/board"
import type { MicaOptionSpec } from "../lib/mica"
import type { MachineSettings, ToolModule } from "../lib/printer"
import { MachineTile } from "./MachineTile"

/** An option's value as a field shows it. */
export type OptionValue = number | boolean | string | null

export type SettingsPanelProps = {
	open: OpenBoard
	/** mica's option table; nothing while mica is not answering. */
	specs?: MicaOptionSpec[]
	/** What an option is set to: the operator's, else the last run's, else mica's default. */
	value: (spec: MicaOptionSpec) => OptionValue
	onOptionChange: (name: string, value: OptionValue) => void
	/** Back to the board's own options — its stackup's thickness — and mica's
	 *  defaults for the rest. */
	onOptionsReset: () => void
	modules: ToolModule[]
	machine: MachineSettings
	onMachineChange: (patch: Partial<MachineSettings>) => void
}

/** Options that are not a slicing setting: `step` picks a board out of a
 *  document that holds several (none of ours does yet), and `verbose` only
 *  changes how mica's report reads. */
const NOT_SETTINGS = new Set(["step", "verbose"])

/** How the options mica has today read as fields. An option mica adds later is
 *  shown all the same, under its own name, until it is given a line here. */
const FIELD: Record<string, { label?: string; unit?: string; step?: number }> = {
	thickness: { unit: "mm", step: 0.1 },
	pen: { unit: "mm", step: 0.05 },
	depth: { label: "channel depth", unit: "mm", step: 0.05 },
	nozzle: { unit: "mm", step: 0.05 },
	layer_height: { unit: "mm", step: 0.02 },
	floor_layers: { unit: "n", step: 1 },
	no_ink: { label: "skip ink solids" },
}

const labelOf = (spec: MicaOptionSpec) => FIELD[spec.name]?.label ?? spec.name.replace(/_/g, " ")

const PANELS = ["Slice", "Tools", "Machine"] as const
type Panel = (typeof PANELS)[number]

const PANEL_ICON = { Slice: Rule, Tools: ToolKit, Machine: PrinterIcon }

/** A panel that gives way before the lane does. It stands at its own height
 *  while there is room, shrinks to a floor when there is not — scrolling inside
 *  itself — and only past that does the lane scroll. With the layer tree doing
 *  the same below it, the lane fits a window down to about 600px tall; the
 *  shell's bar took the room that used to make it fit without this. */
const SHRINKS = "flex min-h-40 flex-col"

/** The three settings panels behind one content switcher.
 *
 *  Slice is mica's: the board's header, as the file has it, over the options
 *  mica converts it with — its own option table, read live, with its own
 *  defaults. Machine is the machine's limits. Tools is not editable: modules are
 *  reported by the machine on connect, so this panel shows what is on the plate
 *  and what it is set to, and offers nothing to change.
 *
 *  Every row is a design system field in its `inline` layout — label on the
 *  left, value hard against the right. This file used to carry its own row grid
 *  and its own bare `<input>`; neither is here now, and a row that has to change
 *  changes for kiln's settings dialog too.
 */
export function SettingsPanel(props: SettingsPanelProps) {
	const [panel, setPanel] = createSignal<Panel>("Slice")
	const [picked, setPicked] = createSignal(props.modules[0]?.id ?? "")
	const module = () => props.modules.find((entry) => entry.id === picked())

	return (
		<>
			{
				/* The switcher stands in the lane as an object of its own, so it wears a
			    Tile — which is what gives it the one hard shadow — and is itself
			    `flush` inside it, so the two borders do not double. */
			}
			<Tile flush>
				<ContentSwitcher
					flush
					class="w-full"
					selectedIndex={PANELS.indexOf(panel())}
					onChange={(index) => setPanel(PANELS[index] ?? "Slice")}
				>
					<For each={PANELS}>
						{(name) => <Switch text={name} renderIcon={PANEL_ICON[name]} spread class="flex-1" />}
					</For>
				</ContentSwitcher>
			</Tile>

			<Branch>
				<Match when={panel() === "Slice"}>
					<Tile
						flush
						fill
						class={SHRINKS}
						heading={
							<>
								<Icon glyph={Document} size={16} />
								{props.open.name}
							</>
						}
						meta={props.open.header.revision}
					>
						<ScrollArea>
							{
								/* Off the IPC file: read, never typed — so they are read-only
							    fields, in the same rows as the editable ones below and ruled off
							    from them. */
							}
							<TileSection>
								<For each={props.open.header.rows}>
									{(row) => (
										<TextInput inline size="sm" readOnly labelText={row.label} value={row.value} />
									)}
								</For>
							</TileSection>

							{/* mica's options, as its own table lists them. */}
							<TileSection>
								<Show
									when={props.specs}
									fallback={
										<p class="m-0 text-small opacity-muted">
											mica's options appear here once it is answering.
										</p>
									}
								>
									{(specs) => (
										<For each={specs().filter((spec) => !NOT_SETTINGS.has(spec.name))}>
											{(spec) => <OptionField spec={spec} {...props} />}
										</For>
									)}
								</Show>
							</TileSection>
							<Show when={props.specs}>
								<TileSection>
									<Button
										kind="ghost"
										size="sm"
										renderIcon={Reset}
										flat
										onClick={props.onOptionsReset}
									>
										Defaults
									</Button>
								</TileSection>
							</Show>
						</ScrollArea>
					</Tile>
				</Match>

				<Match when={panel() === "Tools"}>
					<Tile
						flush
						fill
						class={SHRINKS}
						heading={
							<>
								<Icon glyph={ToolKit} size={16} />Tool plate
							</>
						}
						meta={`${props.modules.filter((m) => m.online).length}/${props.modules.length}`}
					>
						<ScrollArea class="px-2 pb-2 pt-snug">
							{/* Honest until it is not: no machine connects yet. */}
							<p class="m-0 mb-snug text-small opacity-muted">
								Stand-ins: a machine reports its tool plate when it connects, and nothing connects
								until shale is wired in.
							</p>
							{/* Six bays, two across. Pick one to read its settings. */}
							<TileGroup
								legend="Tool modules"
								hideLegend
								valueSelected={picked()}
								onChange={setPicked}
								class="mb-snug grid grid-cols-2 gap-tight"
							>
								<For each={props.modules}>
									{(entry) => (
										// An offline bay is dimmed but still selectable: its settings
										// are what you want to read when working out why it is offline.
										<RadioTile value={entry.id} class={entry.online ? "" : "opacity-40"}>
											<Swatch fill={entry.pattern} />
											<span class="min-w-0 flex-1 truncate text-label font-bold uppercase">
												{entry.name}
											</span>
											<span class="text-label opacity-muted">{entry.id}</span>
										</RadioTile>
									)}
								</For>
							</TileGroup>

							<Show when={module()}>
								{(current) => (
									<For each={current().fields}>
										{(field) => (
											<TextInput
												inline
												size="sm"
												readOnly
												labelText={field.label}
												value={field.unit ? `${field.value} ${field.unit}` : field.value}
											/>
										)}
									</For>
								)}
							</Show>
						</ScrollArea>
					</Tile>
				</Match>

				<Match when={panel() === "Machine"}>
					<MachineTile machine={props.machine} onChange={props.onMachineChange} />
				</Match>
			</Branch>
		</>
	)
}

/** One of mica's options, as a field in the inline rows. */
function OptionField(props: SettingsPanelProps & { spec: MicaOptionSpec }) {
	const field = () => FIELD[props.spec.name] ?? {}
	const value = () => props.value(props.spec)

	return (
		<Branch
			fallback={
				<TextInput
					inline
					size="sm"
					labelText={labelOf(props.spec)}
					value={String(value() ?? "")}
					onChange={(event) =>
						props.onOptionChange(props.spec.name, event.currentTarget.value || null)}
				/>
			}
		>
			<Match when={props.spec.type === "boolean"}>
				<Toggle
					inline
					size="sm"
					labelText={labelOf(props.spec)}
					toggled={value() === true}
					// mica: "Two layers only".
					disabled={props.spec.name === "one_piece" && props.open.board.layers !== 2}
					onToggle={(next) => props.onOptionChange(props.spec.name, next)}
				/>
			</Match>
			<Match when={props.spec.type === "number" || props.spec.type === "integer"}>
				<NumberInput
					inline
					size="sm"
					labelText={labelOf(props.spec)}
					unit={field().unit}
					step={field().step ?? (props.spec.type === "integer" ? 1 : 0.1)}
					// mica takes dimensions finite and positive.
					min={props.spec.type === "integer" ? 0 : field().step ?? 0.01}
					value={typeof value() === "number" ? (value() as number) : undefined}
					onChange={(next) => props.onOptionChange(props.spec.name, next)}
				/>
			</Match>
		</Branch>
	)
}
