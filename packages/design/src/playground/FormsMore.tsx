import { createSignal, For } from "solid-js"
import {
	Button,
	ButtonSet,
	Checkbox,
	CheckboxGroup,
	Copy,
	CopyButton,
	DatePicker,
	DatePickerInput,
	ExpandableSearch,
	FileDrop,
	FileDropCover,
	FileUploader,
	FileUploaderButton,
	FileUploaderItem,
	FileUploaderSkeleton,
	Form,
	InlineLoading,
	PasswordInput,
	Select,
	SelectItem,
	SelectItemGroup,
	TextArea,
	TextInput,
	Tile,
	TimePicker,
	TimePickerSelect,
} from "../index"
import type { FileStatus, InlineLoadingStatus } from "../index"
import { Forms } from "./Forms"
import { Row, Sub } from "./shared"

type Upload = { name: string; status: FileStatus; invalid?: boolean }

const UPLOADS: Upload[] = [
	{ name: "buck-5v.rev3.xml", status: "complete" },
	{ name: "buck-5v.step", status: "uploading" },
	{ name: "bom.csv", status: "edit" },
	{ name: "render-final-FINAL.psd", status: "edit", invalid: true },
]

/** The fields and form parts that arrived with the rest of the catalogue. */
function FormExtras() {
	const [uploads, setUploads] = createSignal(UPLOADS)
	const [day, setDay] = createSignal<Date[]>([new Date(2026, 7, 24)])
	const [span, setSpan] = createSignal<Date[]>([])
	const [saving, setSaving] = createSignal<InlineLoadingStatus>("inactive")

	const save = () => {
		setSaving("active")
		setTimeout(() => setSaving("finished"), 1400)
	}

	return (
		<>
			<Sub
				title="PasswordInput · counters"
				note="The eye is inside the rule. A counter sits at the label's trailing edge and the limit is enforced."
				boxed
			>
				<div class="grid items-start gap-4 sm:grid-cols-3">
					<PasswordInput labelText="Password" value="correct horse" autocomplete="off" />
					<PasswordInput
						labelText="Invalid"
						value="1234"
						invalid
						invalidText="At least 12 characters"
						autocomplete="off"
					/>
					<PasswordInput labelText="Disabled" value="unavailable" disabled autocomplete="off" />
					<TextInput labelText="Slug" value="i2c-fanout-6" enableCounter maxCount={32} />
					<TextArea
						class="sm:col-span-2"
						labelText="Notes"
						rows={2}
						value="Print the substrate, fill the channels, cure."
						enableCounter
						maxCount={20}
						counterMode="word"
					/>
				</div>
			</Sub>

			<Sub title="CheckboxGroup · SelectItemGroup · ExpandableSearch" boxed>
				<div class="grid items-start gap-4 sm:grid-cols-3">
					<CheckboxGroup legendText="Export" helperText="At least one.">
						<Checkbox labelText="IPC-2581" checked />
						<Checkbox labelText="Gerber X2" />
						<Checkbox labelText="Position file" />
					</CheckboxGroup>
					<CheckboxGroup
						legendText="Horizontal · warned"
						orientation="horizontal"
						warn
						warnText="Mesh export is slow"
					>
						<Checkbox labelText="STL" checked />
						<Checkbox labelText="3MF" checked />
					</CheckboxGroup>
					<Select labelText="Grouped options" value="silver">
						<SelectItemGroup label="Conductive">
							<SelectItem value="silver" text="Silver" />
							<SelectItem value="carbon" text="Carbon" />
						</SelectItemGroup>
						<SelectItemGroup label="Insulating">
							<SelectItem value="uv" text="UV dielectric" />
							<SelectItem value="epoxy" text="Epoxy mask" />
						</SelectItemGroup>
					</Select>
				</div>
				<Row label="expandable">
					<ExpandableSearch placeholder="Search boards" />
					<span class="text-small opacity-muted">an icon until it is pressed</span>
				</Row>
			</Sub>

			<Sub
				title="DatePicker · TimePicker"
				note="Type a date, or press the calendar. ISO by default. A range closes once both ends are chosen."
				boxed
			>
				<div class="flex flex-wrap items-start gap-6">
					<DatePicker datePickerType="single" value={day()} onChange={setDay}>
						<DatePickerInput
							labelText="Single"
							helperText={day()[0] ? day()[0]?.toDateString() : "No day chosen"}
						/>
					</DatePicker>
					<DatePicker
						datePickerType="range"
						value={span()}
						minDate="2026-08-01"
						maxDate="2026-09-30"
						onChange={setSpan}
					>
						<DatePickerInput labelText="Range · from" />
						<DatePickerInput labelText="to" helperText="August and September only" />
					</DatePicker>
					<DatePicker datePickerType="simple" dateFormat="m/d/Y">
						<DatePickerInput labelText="Simple · m/d/Y" />
					</DatePicker>
					<DatePicker datePickerType="single" disabled>
						<DatePickerInput labelText="Disabled" />
					</DatePicker>
					<TimePicker labelText="TimePicker" value="9:30" helperText="Local time">
						<TimePickerSelect labelText="AM or PM" value="am">
							<SelectItem value="am" text="AM" />
							<SelectItem value="pm" text="PM" />
						</TimePickerSelect>
						<TimePickerSelect labelText="Time zone" value="utc">
							<SelectItem value="utc" text="UTC" />
							<SelectItem value="ist" text="IST" />
						</TimePickerSelect>
					</TimePicker>
					<TimePicker labelText="Invalid" value="25:00" invalid invalidText="Not a time" />
				</div>
			</Sub>

			<Sub
				title="FileUploader"
				note="The button opens the picker. Each chosen file is a row that says where its upload is."
				boxed
			>
				<div class="grid items-start gap-6 sm:grid-cols-3">
					<FileUploader
						labelTitle="Upload"
						labelDescription="IPC-2581 or Gerber, 50 MB at most."
						buttonLabel="Add files"
						filenameStatus="edit"
						multiple
					/>
					<div class="flex flex-col gap-tight">
						<For each={uploads()}>
							{(file) => (
								<FileUploaderItem
									name={file.name}
									status={file.status}
									invalid={file.invalid}
									errorSubject="Not a board file"
									errorBody="Remove it, or export from your EDA tool first."
									onDelete={() => setUploads((all) => all.filter((other) => other !== file))}
								/>
							)}
						</For>
					</div>
					<div class="flex flex-col gap-4">
						<FileUploaderButton labelText="Tertiary button" buttonKind="tertiary" />
						<FileUploaderSkeleton />
					</div>
				</div>
			</Sub>

			<FileDropDemo />

			<Sub
				title="Form · ButtonSet · Copy"
				note="A form spaces its fields; the set holds its actions."
				boxed
			>
				<Form aria-label="Rename board" class="max-w-96" onSubmit={save}>
					<TextInput labelText="Board name" value="i2c-fanout-6" />
					<TextInput
						labelText="Clone URL"
						value="quarry.dev/avthenticstemcel/i2c-fanout-6"
						readOnly
					/>
					<ButtonSet>
						<Button kind="primary" type="submit">Save</Button>
						<Button kind="tertiary">Cancel</Button>
						<Copy text="quarry.dev/avthenticstemcel/i2c-fanout-6">Copy URL</Copy>
						<CopyButton text="quarry clone avthenticstemcel/i2c-fanout-6" kind="tertiary" />
						<InlineLoading
							status={saving()}
							description={saving() === "active"
								? "Saving…"
								: saving() === "finished"
								? "Saved"
								: undefined}
							onSuccess={() => setSaving("inactive")}
						/>
					</ButtonSet>
				</Form>
				<div class="h-6" />
				<Row label="stacked">
					<ButtonSet stacked class="w-48">
						<Button kind="primary">Publish</Button>
						<Button kind="tertiary">Save as draft</Button>
					</ButtonSet>
				</Row>
			</Sub>
		</>
	)
}

/** The whole Forms section: the fields the apps were built on, then the rest of
 *  Carbon's. */
export function FormsDemo() {
	return (
		<>
			<Forms />
			<div class="mt-8">
				<FormExtras />
			</div>
		</>
	)
}

/** FileDrop: a part of a page that takes files dropped on it, with nothing drawn
 *  until they are held over it. */
function FileDropDemo() {
	const [dropped, setDropped] = createSignal<string[]>([])
	const [refused, setRefused] = createSignal<string[]>([])

	return (
		<Sub
			title="FileDrop"
			note="Drag a file over the tile: the whole of it takes the drop. .xml and .cvg are taken; anything else is refused, and said so."
		>
			<FileDrop
				accept={[".xml", ".cvg"]}
				label="Drop to open the board"
				onDrop={(files) => setDropped(files.map((file) => file.name))}
				onReject={(files) => setRefused(files.map((file) => file.name))}
			>
				<Tile class="min-h-32">
					<p class="m-0 text-body">
						Taken: <b>{dropped().join(", ") || "nothing yet"}</b>
					</p>
					<p class="m-0 mt-tight text-small opacity-muted">
						Refused: {refused().join(", ") || "nothing"}
					</p>
				</Tile>
			</FileDrop>
			<p class="m-0 mb-2 mt-4 text-small opacity-muted">
				With a FileDropCover: the whole row takes the drop, and the cover goes over the left half.
			</p>
			<FileDrop
				accept={[".xml", ".cvg"]}
				label="Drop to open the board"
				onDrop={(files) => setDropped(files.map((file) => file.name))}
				onReject={(files) => setRefused(files.map((file) => file.name))}
			>
				<div class="grid grid-cols-1 gap-gap sm:grid-cols-2">
					<Tile class="relative min-h-32">
						<p class="m-0 text-body">The cover lands here.</p>
						<FileDropCover />
					</Tile>
					<Tile class="min-h-32">
						<p class="m-0 text-body">A drop here is taken too.</p>
					</Tile>
				</div>
			</FileDrop>
		</Sub>
	)
}
