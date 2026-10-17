import { createSignal, For, Show } from "solid-js"
import Upload from "@carbon/icons/es/upload/16"
import {
	Button,
	Checkbox,
	FileUploaderDropContainer,
	FormGroup,
	NumberInput,
	RadioButton,
	RadioButtonGroup,
	Search,
	Select,
	SelectItem,
	Slider,
	Tag,
	TextArea,
	TextInput,
	Tile,
	TileSection,
	Toggle,
} from "../index"
import type { FieldSize } from "../index"
import { Sub } from "./shared"

const SIZES: FieldSize[] = ["sm", "md", "lg"]

/** Every field in every state, then the two layouts fields are composed into:
 *  the stacked form and the inline settings panel.
 *
 *  Focus cannot be shown standing still — click into any field. It lights the
 *  field's ground rather than drawing a ring; see FIELD_BASE for why. */
export function Forms() {
	const [layers, setLayers] = createSignal(4)
	const [radio, setRadio] = createSignal("balanced")
	const [files, setFiles] = createSignal<string[]>([])
	const [topics, setTopics] = createSignal(["i2c", "bus"])
	const [topic, setTopic] = createSignal("")
	const [minutes, setMinutes] = createSignal(40)

	return (
		<>
			<Sub
				boxed
				title="TextInput"
				note="A rule and nothing else at rest. Click in: the ground lights. Read-only drops the rule."
			>
				<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					<TextInput labelText="Empty" placeholder="pixelexia-z1" />
					<TextInput labelText="Filled" value="i2c-fanout-6" />
					<TextInput labelText="Helper" value="rev-C" helperText="From the IPC file." />
					<TextInput
						labelText="Invalid"
						value="rev C"
						invalid
						invalidText="No spaces in a revision"
					/>
					<TextInput
						labelText="Warned"
						value="rev-0"
						warn
						warnText="Older than the published one"
					/>
					<TextInput
						labelText="Read only"
						value="Sambhav Arora"
						readOnly
						helperText="From the file."
					/>
					<TextInput labelText="Disabled" placeholder="unavailable" disabled />
					<For each={SIZES}>
						{(size) => <TextInput labelText={`Size ${size}`} size={size} value={size} />}
					</For>
				</div>
			</Sub>

			<Sub boxed title="TextArea">
				<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					<TextArea labelText="Empty" placeholder="Assembly notes…" rows={4} />
					<TextArea
						labelText="Filled"
						rows={4}
						value="Print the substrate, fill the channels with carbon ink and cure for 20 minutes."
					/>
					<TextArea
						labelText="Invalid"
						rows={4}
						value="tbd"
						invalid
						invalidText="Say what someone needs to know"
					/>
					<TextArea
						labelText="Warned"
						rows={4}
						value="See README"
						warn
						warnText="README.md is empty"
					/>
					<TextArea
						labelText="Read only"
						rows={4}
						readOnly
						value="Reported by the build. Not editable."
					/>
					<TextArea labelText="Disabled" rows={4} disabled placeholder="unavailable" />
					<div class="border-2 border-ink sm:col-span-2 lg:col-span-3">
						<TextArea
							labelText="Bare, growing"
							hideLabel
							bare
							autoResize
							rows={2}
							maxRows={6}
							class="p-2"
							placeholder="bare + autoResize — the box around it is the field. Type a few lines."
						/>
					</div>
				</div>
			</Sub>

			<Sub
				boxed
				title="NumberInput"
				note="Steppers replace the OS spinner. A unit is shown, never stored."
			>
				<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					<NumberInput labelText="Layers" value={4} min={1} max={8} />
					<NumberInput labelText="Channel" value={0.8} step={0.05} unit="mm" />
					<NumberInput labelText="No steppers" value={120} unit="s" hideSteppers />
					<NumberInput
						labelText="Invalid"
						value={9}
						max={8}
						invalid
						invalidText="At most 8 layers"
					/>
					<NumberInput
						labelText="Warned"
						value={0.1}
						unit="mm"
						warn
						warnText="Under the Z1 floor"
					/>
					<NumberInput labelText="Read only" value={1.6} unit="mm" readOnly />
					<NumberInput labelText="Disabled" value={2} disabled />
					<For each={SIZES}>
						{(size) => <NumberInput labelText={`Size ${size}`} size={size} value={12} />}
					</For>
				</div>
			</Sub>

			<Sub
				boxed
				title="Select"
				note="The one boxed field: nothing is typed into it, it is pressed."
			>
				<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					<Select labelText="Placeholder" placeholder="Choose a substrate">
						<SelectItem value="pla" text="PLA" />
						<SelectItem value="petg" text="PETG" />
						<SelectItem value="pei" text="PEI-1010" />
					</Select>
					<Select labelText="Chosen" value="petg" helperText="Reported by the machine.">
						<SelectItem value="pla" text="PLA" />
						<SelectItem value="petg" text="PETG" />
						<SelectItem value="pei" text="PEI-1010" disabled />
					</Select>
					<Select labelText="Invalid" value="ag" invalid invalidText="Out of stock">
						<SelectItem value="ag" text="Silver conductive" />
					</Select>
					<Select labelText="Warned" value="c" warn warnText="Not calibrated for this tool">
						<SelectItem value="c" text="Carbon" />
					</Select>
					<Select labelText="Disabled" value="pla" disabled>
						<SelectItem value="pla" text="PLA" />
					</Select>
					<For each={SIZES}>
						{(size) => (
							<Select labelText={`Size ${size}`} size={size} value="a">
								<SelectItem value="a" text={size} />
							</Select>
						)}
					</For>
				</div>
			</Sub>

			<Sub boxed title="Search">
				<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					<Search labelText="Search boards" placeholder="Search boards" />
					<Search labelText="With a value" placeholder="Search" value="buck 4-layer" />
					<Search labelText="Disabled" placeholder="Search" disabled />
					<div class="flex h-12 items-center border-2 border-ink px-2 sm:col-span-2 lg:col-span-3">
						<Search
							bare
							class="min-w-0 flex-1"
							labelText="Bare, with a shortcut"
							placeholder="bare + shortcut — a section of a bar that is already the field"
							shortcut="/"
							size="sm"
						/>
					</div>
				</div>
			</Sub>

			<Sub boxed title="Checkbox">
				<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					<Checkbox labelText="Unchecked" />
					<Checkbox labelText="Checked" checked />
					<Checkbox labelText="Indeterminate" indeterminate />
					<Checkbox labelText="With a note" helperText="Adds ~40s to the build." checked />
					<Checkbox labelText="Invalid" invalid invalidText="Pick at least one output" />
					<Checkbox labelText="Warned" warn warnText="Slower on this machine" checked />
					<Checkbox labelText="Read only" readOnly checked />
					<Checkbox labelText="Disabled" disabled />
					<Checkbox
						checked
						labelText={
							<span class="flex items-baseline gap-2">
								<span class="min-w-0 flex-1">Trailing content</span>
								<span class="text-micro font-bold uppercase">required</span>
							</span>
						}
					/>
				</div>
			</Sub>

			<Sub boxed title="RadioButton" note="Square, like everything else. Helper text per option.">
				<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					<RadioButtonGroup
						legendText="Vertical"
						valueSelected={radio()}
						onChange={setRadio}
						helperText="Each option trades speed against yield."
					>
						<RadioButton value="fast" labelText="Fast" helperText="Wider traces, fewer passes." />
						<RadioButton
							value="balanced"
							labelText="Balanced"
							helperText="The two-layer default."
						/>
						<RadioButton value="fine" labelText="Fine" helperText="0.15mm pitch, slowest." />
					</RadioButtonGroup>
					<RadioButtonGroup legendText="Horizontal" orientation="horizontal" defaultSelected="b">
						<RadioButton value="a" labelText="IPC-2581" />
						<RadioButton value="b" labelText="Gerber" />
						<RadioButton value="c" labelText="Both" />
					</RadioButtonGroup>
					<RadioButtonGroup
						legendText="Invalid"
						invalid
						invalidText="Choose a licence to publish"
					>
						<RadioButton value="cc0" labelText="CC0" />
						<RadioButton value="cern" labelText="CERN-OHL-S" />
					</RadioButtonGroup>
					<RadioButtonGroup legendText="Disabled" disabled defaultSelected="a">
						<RadioButton value="a" labelText="Public" />
						<RadioButton value="b" labelText="Private" />
					</RadioButtonGroup>
					<RadioButtonGroup legendText="One option disabled" defaultSelected="a">
						<RadioButton value="a" labelText="Alumina Z1" />
						<RadioButton value="b" labelText="4-layer fab" disabled helperText="Not offered yet." />
					</RadioButtonGroup>
				</div>
			</Sub>

			<Sub boxed title="Toggle">
				<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					<Toggle labelText="Off" />
					<Toggle labelText="On" toggled />
					<Toggle labelText="With state text" labelA="off" labelB="on" toggled />
					<Toggle labelText="Small" size="sm" toggled />
					<Toggle labelText="Read only" readOnly toggled />
					<Toggle labelText="Disabled" disabled />
				</div>
			</Sub>

			<Sub boxed title="Slider">
				<div class="grid gap-4 sm:grid-cols-2">
					<Slider
						labelText="Ticks and a live readout"
						min={2}
						max={12}
						step={2}
						ticks
						unit="layers"
						value={layers()}
						onChange={setLayers}
					/>
					<Slider labelText="No ticks" min={0} max={100} value={40} unit="%" />
					<Slider labelText="No readout" min={0} max={10} value={6} hideTextInput ticks />
					<Slider labelText="Disabled" min={0} max={10} value={3} disabled />
				</div>
			</Sub>

			<Sub
				boxed
				title="FormGroup"
				note="A fieldset and its legend: the label for several controls at once. The hint is its aside."
			>
				<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					<FormGroup legendText="Also generate">
						<Checkbox checked labelText="Mesh through mica" />
						<Checkbox checked labelText="Bill of materials" />
						<Checkbox labelText="Position file" />
					</FormGroup>
					<FormGroup
						legendText="Tools"
						hint="read from README.md"
						helperText="Shown on the board page."
					>
						<Checkbox checked labelText="Soldering iron" />
						<Checkbox labelText="Hot air station" />
					</FormGroup>
					<FormGroup legendText="Outputs" invalid invalidText="Pick at least one">
						<Checkbox labelText="IPC-2581" />
						<Checkbox labelText="Gerber" />
					</FormGroup>
				</div>
			</Sub>

			<Sub
				title="Inline fields"
				note="The label beside the control: a settings panel. The value is the heavy thing in the row."
			>
				<div class="grid gap-4 sm:grid-cols-2">
					<Tile heading="Slice">
						<NumberInput inline size="sm" labelText="layers" value={4} min={1} max={8} unit="n" />
						<NumberInput inline size="sm" labelText="channel" value={0.8} step={0.05} unit="mm" />
						<NumberInput inline size="sm" labelText="thickness" value={1.6} unit="mm" readOnly />
						<TextInput inline size="sm" labelText="kinematics" value="CoreXY" readOnly />
						<Toggle inline size="sm" labelText="keyed pin" toggled />
						<Toggle inline size="sm" labelText="mirror B_Cu" />
						<Toggle inline size="sm" labelText="validate DRC" toggled />
					</Tile>
					<Tile heading="Agent">
						<Select inline size="sm" labelText="default model" value="perun">
							<SelectItem value="raijin" text="raijin" />
							<SelectItem value="perun" text="perun" />
							<SelectItem value="indra" text="indra" />
						</Select>
						<Select inline size="sm" labelText="conductive ink" value="silver">
							<SelectItem value="silver" text="silver" />
							<SelectItem value="carbon" text="carbon" />
						</Select>
						<NumberInput inline size="sm" labelText="route time limit" value={120} unit="s" />
						<NumberInput
							inline
							size="sm"
							labelText="trace floor"
							value={0.05}
							step={0.01}
							unit="mm"
							warn
							warnText="Under the Z1 floor"
						/>
						<Toggle inline size="sm" labelText="ask before routing" toggled />
						<Toggle inline size="sm" labelText="share anonymised runs" disabled />
					</Tile>
				</div>
			</Sub>

			<Sub boxed title="FileUploaderDropContainer">
				<FileUploaderDropContainer
					labelText="Drop an IPC-2581 file, or click to browse"
					accept={[".ipc", ".xml"]}
					multiple
					onAddFiles={(added) => setFiles(added.map((file) => file.name))}
				/>
				<Show when={files().length > 0}>
					<div class="mt-2 flex flex-wrap gap-2">
						<For each={files()}>{(name) => <Tag>{name}</Tag>}</For>
					</div>
				</Show>
			</Sub>

			<Sub
				title="A whole form"
				note="Nothing here but design system components: a flush Tile in ruled sections, groups, fields."
			>
				<Tile flush ruled headingSize="title" heading="Publish a board" meta="required">
					<TileSection size="lg">
						<div class="grid gap-6 md:grid-cols-2">
							<TextInput labelText="Name" value="i2c-fanout-6" />
							<Select labelText="Owner" value="avthenticstemcel">
								<SelectItem value="avthenticstemcel" text="avthenticstemcel" />
								<SelectItem value="magnolia-cove" text="magnolia-cove" />
							</Select>
						</div>
						<TextArea
							class="mt-6"
							rows={4}
							labelText="Description"
							helperText="Markdown, or leave it empty to read README.md."
							value="Six addressable I²C ports off one bus, pull-ups jumpered per port."
						/>
						<FormGroup class="mt-6" legendText="Topics">
							<div class="flex flex-wrap items-center gap-2">
								<For each={topics()}>
									{(name) => (
										<Tag
											filter
											onClose={() => setTopics(topics().filter((each) => each !== name))}
										>
											{name}
										</Tag>
									)}
								</For>
								<TextInput
									class="min-w-48 flex-1"
									size="sm"
									hideLabel
									labelText="Add a topic"
									placeholder="add a topic, press enter"
									value={topic()}
									onInput={(event) => setTopic(event.currentTarget.value)}
									onKeyDown={(event) => {
										if (event.key !== "Enter" || topic().trim() === "") return
										event.preventDefault()
										setTopics([...topics(), topic().trim()])
										setTopic("")
									}}
								/>
							</div>
						</FormGroup>
					</TileSection>

					<TileSection size="lg">
						<div class="grid gap-6 md:grid-cols-2">
							<RadioButtonGroup legendText="Board licence" defaultSelected="cc0">
								<RadioButton value="cc0" labelText="CC0" helperText="No conditions." />
								<RadioButton
									value="cern"
									labelText="CERN-OHL-S v2"
									helperText="Reciprocal. Forks stay open."
								/>
								<RadioButton value="paid" labelText="Paid licence" helperText="Your terms." />
							</RadioButtonGroup>
							<div class="flex flex-col gap-6">
								<FormGroup legendText="Tools someone needs">
									<Checkbox checked labelText="Soldering iron" />
									<Checkbox checked labelText="Hot plate or reflow oven" />
									<Checkbox labelText="Hot air station" />
								</FormGroup>
								<Slider
									labelText="Time to build"
									min={10}
									max={240}
									step={10}
									unit="min"
									value={minutes()}
									onChange={setMinutes}
								/>
							</div>
						</div>
					</TileSection>

					<TileSection size="lg">
						<div class="flex flex-wrap items-center gap-2">
							<Checkbox
								labelText="I have the right to publish these files"
								class="min-w-0 flex-1"
							/>
							<Button kind="tertiary" flat>Save as draft</Button>
							<Button kind="primary" flat renderIcon={Upload}>Publish board</Button>
						</div>
					</TileSection>
				</Tile>
			</Sub>
		</>
	)
}
