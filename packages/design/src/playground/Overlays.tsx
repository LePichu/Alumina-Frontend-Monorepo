import { createSignal } from "solid-js"
import Copy from "@carbon/icons/es/copy/16"
import Download from "@carbon/icons/es/download/16"
import Edit from "@carbon/icons/es/edit/16"
import Launch from "@carbon/icons/es/launch/16"
import TrashCan from "@carbon/icons/es/trash-can/16"
import {
	Button,
	Checkbox,
	ComboButton,
	ContainedList,
	ContainedListItem,
	DefinitionTooltip,
	Link,
	Menu,
	MenuButton,
	MenuItem,
	MenuItemDivider,
	MenuItemGroup,
	MenuItemRadioGroup,
	MenuItemSelectable,
	Popover,
	PopoverContent,
	Tile,
	Toggletip,
	ToggletipActions,
	ToggletipButton,
	ToggletipContent,
	ToggletipLabel,
	useContextMenu,
} from "../index"
import { Row, Sub } from "./shared"

export function PopoverDemo() {
	const [open, setOpen] = createSignal(false)
	const [tabTip, setTabTip] = createSignal(false)
	const [dark, setDark] = createSignal(false)

	return (
		<>
			<Row label="content">
				<Popover open={open()} onRequestClose={() => setOpen(false)} align="bottom-start">
					<Button onClick={() => setOpen((value) => !value)}>Layer visibility</Button>
					<PopoverContent aria-label="Layer visibility" class="flex w-56 flex-col gap-tight p-2">
						<Checkbox labelText="Substrate" checked />
						<Checkbox labelText="Conductor" checked />
						<Checkbox labelText="Drill hits" />
					</PopoverContent>
				</Popover>
			</Row>
			<Row label="tab tip">
				<Popover
					open={tabTip()}
					onRequestClose={() => setTabTip(false)}
					align="bottom-start"
					isTabTip
				>
					<Button kind="tertiary" onClick={() => setTabTip((value) => !value)}>Recent</Button>
					<PopoverContent aria-label="Recent files" class="w-64">
						<ContainedList kind="disclosed" label="Recent files" size="sm">
							<ContainedListItem onClick={() => setTabTip(false)}>
								buck-5v.rev3.xml
							</ContainedListItem>
							<ContainedListItem onClick={() => setTabTip(false)}>
								esp32-carrier.xml
							</ContainedListItem>
							<ContainedListItem onClick={() => setTabTip(false)}>flex-tail.cvg</ContainedListItem>
						</ContainedList>
					</PopoverContent>
				</Popover>
			</Row>
			<Row label="high contrast">
				<Popover open={dark()} onRequestClose={() => setDark(false)} align="right">
					<Button kind="ghost" onClick={() => setDark((value) => !value)}>
						What is a keyed pin?
					</Button>
					<PopoverContent highContrast class="max-w-64 p-2 text-small">
						A registration pin with one flat, so a layer can only be laid down the right way round.
					</PopoverContent>
				</Popover>
			</Row>
		</>
	)
}

export function ToggletipDemo() {
	return (
		<>
			<Row label="toggletip">
				<Toggletip align="bottom-start">
					<ToggletipLabel>Cure time</ToggletipLabel>
					<ToggletipButton label="About cure time" />
					<ToggletipContent>
						<p class="m-0">
							How long the ink is held at temperature after each conductor layer. Silver ink wants
							twenty minutes.
						</p>
						<ToggletipActions>
							<Link href="#toggletip" renderIcon={Launch}>Ink profiles</Link>
							<Button kind="ghost--inverse" size="sm">Reset</Button>
						</ToggletipActions>
					</ToggletipContent>
				</Toggletip>
			</Row>
			<Row label="definition">
				<p class="m-0 max-w-prose text-body">
					Each conductor layer is checked against the{" "}
					<DefinitionTooltip definition="The narrowest trace the fitted nozzle can lay down reliably. 0.10 mm on the Z1.">
						trace floor
					</DefinitionTooltip>{" "}
					before it is sliced.
				</p>
			</Row>
		</>
	)
}

const DENSITIES = ["Compact", "Normal", "Roomy"]

export function MenuDemo() {
	const [last, setLast] = createSignal("—")
	const [area, setArea] = createSignal<HTMLElement>()
	const context = useContextMenu(area)

	return (
		<>
			<Row label="MenuButton">
				<MenuButton label="Export">
					<MenuItem label="IPC-2581" shortcut="⌘E" onClick={() => setLast("IPC-2581")} />
					<MenuItem label="Gerber X2" onClick={() => setLast("Gerber X2")} />
					<MenuItem label="Mesh">
						<MenuItem label="STL" onClick={() => setLast("STL")} />
						<MenuItem label="3MF" onClick={() => setLast("3MF")} />
						<MenuItem label="OBJ" disabled />
					</MenuItem>
					<MenuItemDivider />
					<MenuItem label="Delete board" kind="danger" onClick={() => setLast("Delete board")} />
				</MenuButton>
				<MenuButton label="View" kind="tertiary">
					<MenuItemGroup label="Layers">
						<MenuItemSelectable label="Substrate" defaultSelected />
						<MenuItemSelectable label="Conductor" defaultSelected />
						<MenuItemSelectable label="Drill hits" />
					</MenuItemGroup>
					<MenuItemDivider />
					<MenuItemRadioGroup label="Density" items={DENSITIES} defaultSelectedItem="Normal" />
				</MenuButton>
				<MenuButton label="Row" kind="ghost" size="sm" menuAlignment="bottom-end">
					<MenuItem label="Edit" renderIcon={Edit} onClick={() => setLast("Edit")} />
					<MenuItem label="Duplicate" renderIcon={Copy} onClick={() => setLast("Duplicate")} />
					<MenuItem label="Download" renderIcon={Download} onClick={() => setLast("Download")} />
				</MenuButton>
				<span class="text-small opacity-muted">last: {last()}</span>
			</Row>
			<Row label="ComboButton">
				<ComboButton label="Slice" onClick={() => setLast("Slice")}>
					<MenuItem label="Slice and validate" onClick={() => setLast("Slice and validate")} />
					<MenuItem label="Slice and print" onClick={() => setLast("Slice and print")} />
					<MenuItemDivider />
					<MenuItem label="Discard slice" kind="danger" renderIcon={TrashCan} />
				</ComboButton>
			</Row>
			<Sub title="Menu · context" note="Press the secondary button inside the tile.">
				<Tile placeholder class="p-0">
					<div ref={setArea} class="flex h-24 items-center justify-center text-small opacity-muted">
						Right-click here
					</div>
				</Tile>
				<Menu label="Board actions" {...context}>
					<MenuItem
						label="Open in foundry"
						renderIcon={Launch}
						onClick={() => setLast("Open in foundry")}
					/>
					<MenuItem label="Duplicate" renderIcon={Copy} onClick={() => setLast("Duplicate")} />
					<MenuItemDivider />
					<MenuItem
						label="Delete"
						kind="danger"
						renderIcon={TrashCan}
						onClick={() => setLast("Delete")}
					/>
				</Menu>
			</Sub>
		</>
	)
}
