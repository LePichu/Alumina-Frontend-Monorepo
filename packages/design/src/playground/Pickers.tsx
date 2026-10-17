import { createSignal } from "solid-js"
import { ComboBox, Dropdown, FilterableMultiSelect, MultiSelect } from "../index"
import { Sub } from "./shared"

type Substrate = { id: string; label: string; temp: number }

const SUBSTRATES: Substrate[] = [
	{ id: "pla", label: "PLA", temp: 60 },
	{ id: "petg", label: "PETG", temp: 80 },
	{ id: "pc-gf", label: "PC-GF", temp: 115 },
	{ id: "pei-1010", label: "PEI-1010", temp: 215 },
	{ id: "tpc-ht", label: "TPC-HT", temp: 150 },
]

const PARTS = [
	"0402 resistor",
	"0603 resistor",
	"0805 capacitor",
	"ESP32-S3-WROOM",
	"JST-PH 2 pin",
	"JST-PH 4 pin",
	"LM2596 buck",
	"SOT-23 MOSFET",
	"USB-C receptacle",
]

const LAYERS = ["Substrate", "Conductor", "Insulator", "Drill hits", "Silkscreen", "Registration"]

export function PickersDemo() {
	const [substrate, setSubstrate] = createSignal<Substrate>()
	const [part, setPart] = createSignal<string | null>("ESP32-S3-WROOM")
	const [layers, setLayers] = createSignal<string[]>(["Substrate", "Conductor"])

	return (
		<>
			<Sub
				title="Dropdown"
				note="Driven by an array of items. A box, like Select: it is pressed, not typed into."
				boxed
			>
				<div class="grid items-start gap-4 sm:grid-cols-3">
					<Dropdown
						titleText="Substrate"
						label="Choose a substrate"
						items={SUBSTRATES}
						selectedItem={substrate()}
						helperText={substrate() ? `Bed at ${substrate()?.temp} °C` : "Nothing chosen"}
						onChange={({ selectedItem }) => setSubstrate(selectedItem)}
					/>
					<Dropdown
						titleText="With rich rows"
						items={SUBSTRATES}
						initialSelectedItem={SUBSTRATES[2]}
						itemToElement={(item) => (
							<span class="flex items-baseline justify-between gap-2">
								<span>{item.label}</span>
								<span class="text-micro">{item.temp} °C</span>
							</span>
						)}
					/>
					<Dropdown
						titleText="Invalid"
						items={SUBSTRATES}
						invalid
						invalidText="Pick one to slice"
					/>
					<Dropdown titleText="Warned" items={SUBSTRATES} warn warnText="Untested profile" />
					<Dropdown
						titleText="Read only"
						items={SUBSTRATES}
						initialSelectedItem={SUBSTRATES[3]}
						readOnly
					/>
					<Dropdown titleText="Disabled" items={SUBSTRATES} disabled />
					<Dropdown titleText="Size sm" items={SUBSTRATES} size="sm" />
					<Dropdown titleText="Opens upward" items={SUBSTRATES} direction="top" />
					<Dropdown
						type="inline"
						titleText="inline"
						items={SUBSTRATES}
						initialSelectedItem={SUBSTRATES[0]}
						size="sm"
					/>
				</div>
			</Sub>

			<Sub
				title="ComboBox"
				note="Type to narrow, then choose. A recess, because this one is typed into."
				boxed
			>
				<div class="grid items-start gap-4 sm:grid-cols-3">
					<ComboBox
						titleText="Part"
						placeholder="Search parts"
						items={PARTS}
						selectedItem={part()}
						helperText={`Chosen: ${part() ?? "nothing"}`}
						onChange={({ selectedItem }) => setPart(selectedItem)}
					/>
					<ComboBox
						titleText="Custom value allowed"
						placeholder="Type any footprint"
						items={PARTS}
						allowCustomValue
					/>
					<ComboBox titleText="Invalid" items={PARTS} invalid invalidText="Not in the library" />
					<ComboBox titleText="Read only" items={PARTS} initialSelectedItem={PARTS[3]} readOnly />
					<ComboBox titleText="Disabled" items={PARTS} disabled placeholder="unavailable" />
				</div>
			</Sub>

			<Sub
				title="MultiSelect"
				note="The list stays open. The ink count is how many are chosen, and clears them."
				boxed
			>
				<div class="grid items-start gap-4 sm:grid-cols-3">
					<MultiSelect
						titleText="Layers to export"
						label="Layers"
						items={LAYERS}
						selectedItems={layers()}
						helperText={layers().join(", ") || "None"}
						onChange={({ selectedItems }) => setLayers(selectedItems)}
					/>
					<MultiSelect
						titleText="Fixed order"
						label="Layers"
						items={LAYERS}
						selectionFeedback="fixed"
						initialSelectedItems={["Drill hits"]}
					/>
					<MultiSelect
						titleText="Invalid"
						label="Layers"
						items={LAYERS}
						invalid
						invalidText="Choose at least one"
					/>
					<MultiSelect titleText="Disabled" label="Layers" items={LAYERS} disabled />
					<FilterableMultiSelect
						titleText="FilterableMultiSelect"
						placeholder="Filter parts"
						items={PARTS}
						initialSelectedItems={["0402 resistor", "USB-C receptacle"]}
					/>
				</div>
			</Sub>
		</>
	)
}
