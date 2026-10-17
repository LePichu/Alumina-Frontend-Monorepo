import { createSignal } from "solid-js"
import {
	DatePickerInput,
	FluidComboBox,
	FluidDatePicker,
	FluidDatePickerSkeleton,
	FluidDropdown,
	FluidForm,
	FluidMultiSelect,
	FluidNumberInput,
	FluidPasswordInput,
	FluidSearch,
	FluidSelect,
	FluidTextArea,
	FluidTextAreaSkeleton,
	FluidTextInput,
	FluidTextInputSkeleton,
	FluidTimePicker,
	FluidTimePickerSelect,
	FluidTimePickerSkeleton,
	SelectItem,
	TextInput,
} from "../index"
import { Sub } from "./shared"

const SUBSTRATES = ["PLA", "PETG", "PC-GF", "PEI-1010", "TPC-HT"]
const LAYERS = ["Top copper", "Bottom copper", "Top mask", "Bottom mask", "Silk", "Outline"]
const PARTS = ["0402 resistor", "0603 capacitor", "SOT-23", "SOIC-8", "QFN-32", "USB-C 16P"]

/** Carbon's fluid forms: the label inside the field, the fields tiled into one
 *  ruled frame. Every one is the ordinary component under a context. */
export function FluidDemo() {
	const [name, setName] = createSignal("buck-5v")

	return (
		<>
			<Sub
				title="FluidForm"
				note="One frame. The rules between fields are the grid's gap, so each is drawn once; columns are the caller's."
			>
				<FluidForm aria-label="Board" class="max-w-184 grid-cols-1 sm:grid-cols-2">
					<TextInput
						labelText="Board name"
						value={name()}
						onInput={(event) => setName(event.currentTarget.value)}
						enableCounter
						maxCount={32}
					/>
					<FluidNumberInput labelText="Revision" value={3} min={1} max={99} />
					<FluidSelect labelText="Substrate" value="petg">
						<SelectItem value="pla" text="PLA" />
						<SelectItem value="petg" text="PETG" />
						<SelectItem value="pc" text="PC-GF" />
					</FluidSelect>
					<FluidDropdown
						titleText="Ink"
						label="Choose an ink"
						items={["Silver", "Carbon", "Copper"]}
					/>
					<FluidMultiSelect
						titleText="Layers"
						label="Layers to print"
						items={LAYERS}
						initialSelectedItems={["Top copper", "Outline"]}
					/>
					<FluidComboBox titleText="Footprint" placeholder="Type to search" items={PARTS} />
					<FluidDatePicker datePickerType="range">
						<DatePickerInput labelText="Start" />
						<DatePickerInput labelText="Ship by" />
					</FluidDatePicker>
					<FluidTimePicker labelText="Cut-off" placeholder="hh:mm">
						<FluidTimePickerSelect labelText="Half" value="pm">
							<SelectItem value="am" text="AM" />
							<SelectItem value="pm" text="PM" />
						</FluidTimePickerSelect>
					</FluidTimePicker>
					<FluidSearch labelText="Find a part" placeholder="Reference or value" />
					<FluidPasswordInput labelText="Machine token" autocomplete="off" />
					<FluidTextArea
						labelText="Notes"
						rows={3}
						placeholder="Anything the operator should know"
						class="sm:col-span-2"
					/>
				</FluidForm>
			</Sub>

			<Sub
				title="Fluid fields, alone"
				note="Outside a form each is its own box. Severity thickens the bottom edge, as on every other field."
				boxed
			>
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
					<FluidTextInput
						labelText="Net"
						placeholder="VIN"
						helperText="As it is named in the schematic."
					/>
					<FluidTextInput
						labelText="Track width"
						value="0.05 mm"
						invalid
						invalidText="Below the 0.2 mm minimum."
					/>
					<FluidSelect labelText="Finish" value="enig" warn warnText="Adds two days.">
						<SelectItem value="hasl" text="HASL" />
						<SelectItem value="enig" text="ENIG" />
					</FluidSelect>
					<FluidTextInput labelText="Machine" value="Alumina Z1" readOnly />
					<FluidNumberInput labelText="Copies" value={1} min={1} disabled />
					<FluidDropdown titleText="Substrate" label="Choose one" items={SUBSTRATES} />
					<FluidDatePicker datePickerType="single">
						<DatePickerInput labelText="Ship by" />
					</FluidDatePicker>
					<FluidMultiSelect
						isFilterable
						titleText="Layers"
						placeholder="Filter layers"
						items={LAYERS}
					/>
				</div>
			</Sub>

			<Sub title="Fluid skeletons" boxed>
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
					<FluidTextInputSkeleton />
					<FluidDatePickerSkeleton datePickerType="range" />
					<FluidTimePickerSkeleton />
					<FluidTextAreaSkeleton />
				</div>
			</Sub>
		</>
	)
}
