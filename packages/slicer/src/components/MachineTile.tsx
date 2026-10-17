import PrinterIcon from "@carbon/icons/es/printer/16"
import { Icon, NumberInput, TextInput, Tile, Toggle } from "@alumina/design"
import type { MachineSettings } from "../lib/printer"

export type MachineTileProps = {
	machine: MachineSettings
	onChange: (patch: Partial<MachineSettings>) => void
}

/** The machine's limits, in a board's Machine panel. */
export function MachineTile(props: MachineTileProps) {
	return (
		<Tile
			heading={
				<>
					<Icon glyph={PrinterIcon} size={16} />Alumina Z1
				</>
			}
		>
			<MachineFields machine={props.machine} onChange={props.onChange} />
			<p class="m-0 mt-snug text-small opacity-muted">{TOOL_CHANGE_NOTE}</p>
		</Tile>
	)
}

/** What a tool change costs, said under the limits wherever they are set. */
export const TOOL_CHANGE_NOTE = "Tool changes cost ~14 s each — the slice order minimises swaps."

/** The machine's limits as inline fields. Reported on connect, but travel,
 *  acceleration and the bed are the operator's to override, so unlike the tool
 *  modules these are editable — in a board's Machine panel and in Settings,
 *  which edit the same settings. */
export function MachineFields(props: MachineTileProps) {
	return (
		<>
			<TextInput
				inline
				size="sm"
				readOnly
				labelText="kinematics"
				value={props.machine.kinematics}
			/>
			<NumberInput
				inline
				size="sm"
				labelText="bed"
				unit="°C"
				value={props.machine.bed}
				max={110}
				onChange={(bed) => props.onChange({ bed })}
			/>
			<NumberInput
				inline
				size="sm"
				labelText="travel"
				unit="mm/s"
				value={props.machine.travel}
				step={10}
				onChange={(travel) => props.onChange({ travel })}
			/>
			<NumberInput
				inline
				size="sm"
				labelText="accel"
				unit="mm/s²"
				value={props.machine.accel}
				step={100}
				onChange={(accel) => props.onChange({ accel })}
			/>
			<Toggle
				inline
				size="sm"
				labelText="park on swap"
				toggled={props.machine.parkOnSwap}
				onToggle={(parkOnSwap) => props.onChange({ parkOnSwap })}
			/>
			<Toggle
				inline
				size="sm"
				labelText="probe each tool"
				toggled={props.machine.probeEachTool}
				onToggle={(probeEachTool) => props.onChange({ probeEachTool })}
			/>
		</>
	)
}
