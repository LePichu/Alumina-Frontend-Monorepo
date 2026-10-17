import { createSignal, For } from "solid-js"
import Copy from "@carbon/icons/es/copy/16"
import Download from "@carbon/icons/es/download/16"
import Edit from "@carbon/icons/es/edit/16"
import Flash from "@carbon/icons/es/flash/16"
import Launch from "@carbon/icons/es/launch/16"
import TrashCan from "@carbon/icons/es/trash-can/16"
import {
	AILabel,
	AILabelContent,
	AISkeletonPlaceholder,
	AISkeletonText,
	Button,
	Card,
	CardAction,
	CardActions,
	CardBody,
	CardFooter,
	CardHeader,
	CardMedia,
	CardTitle,
	ChatButton,
	ChatButtonSkeleton,
	Dialog,
	DialogBody,
	DialogCloseButton,
	DialogControls,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Icon,
	IconIndicator,
	IconIndicatorKinds,
	Link,
	MenuItem,
	MenuItemDivider,
	OverflowMenuV2,
	ShapeIndicator,
	ShapeIndicatorKinds,
	Slider,
	Tile,
} from "../index"
import type { InlineLoadingStatus } from "../index"
import { Row, Sub } from "./shared"

const PROMPTS = [
	"Step 12 V down to 5 V at 2 A",
	"Break out an ESP32-S3-WROOM",
	"USB-C PD trigger at 20 V",
]

/** Carbon's preview and unstable components, ported as they stand in
 *  @carbon/react 1.118. Their APIs are Carbon's and will move when Carbon's do. */
export function ExperimentalDemo() {
	const [modal, setModal] = createSignal(false)
	const [plain, setPlain] = createSignal(false)
	const [saving, setSaving] = createSignal<InlineLoadingStatus>("inactive")
	const [taken, setTaken] = createSignal<string>()
	const [range, setRange] = createSignal<[number, number]>([0.2, 0.6])

	return (
		<>
			<Sub
				title="Card"
				note="A Tile with the parts named: head, media, body, foot. Clickable, horizontal, and with a ruled strip of actions."
			>
				<div class="grid grid-cols-1 items-start gap-4 sm:grid-cols-3">
					<Card>
						<CardMedia ratio="16x9">
							<div class="pat-dots absolute inset-0" />
						</CardMedia>
						<CardHeader>
							<CardTitle label="avthenticstemcel" description="Six I²C ports off one bus.">
								i2c-fanout-6
							</CardTitle>
						</CardHeader>
						<CardBody>
							<p class="m-0 text-small">Printed on an Alumina Z1 with 0.8 mm carbon ink.</p>
						</CardBody>
						<CardActions>
							<CardAction>
								<Button kind="ghost" flat renderIcon={Download} class="w-full justify-center">
									IPC-2581
								</Button>
							</CardAction>
							<CardAction>
								<Button kind="ghost" flat renderIcon={Launch} class="w-full justify-center">
									Open
								</Button>
							</CardAction>
						</CardActions>
					</Card>

					<Card clickable href="#experimental" density="expressive">
						<CardHeader>
							<CardTitle
								titleStart={<Icon glyph={Flash} size={16} />}
								description="The whole card is the link."
							>
								Clickable
							</CardTitle>
						</CardHeader>
						<CardBody>
							<p class="m-0 text-small">
								It presses like a button and carries an arrow in its foot.
							</p>
						</CardBody>
					</Card>

					<Card
						decorator={
							<AILabel size="sm">
								<AILabelContent>
									<p class="m-0 text-small">Routed by perun from your prompt.</p>
								</AILabelContent>
							</AILabel>
						}
					>
						<CardHeader>
							<CardTitle titleTruncate description="A decorator sits in the corner of the head.">
								A title long enough that it has to be cut short
							</CardTitle>
						</CardHeader>
						<CardBody>
							<AISkeletonText paragraph lineCount={3} />
						</CardBody>
						<CardFooter>
							<Link href="#experimental" size="sm" renderIcon={Launch}>View the run</Link>
						</CardFooter>
					</Card>

					<Card horizontal class="sm:col-span-2">
						<CardMedia ratio="1x1" mediaWidth="30%">
							<div class="bg-hatch absolute inset-0" />
						</CardMedia>
						<div class="flex min-w-0 flex-1 flex-col">
							<CardHeader>
								<CardTitle label="horizontal">Media on the left</CardTitle>
							</CardHeader>
							<CardBody>
								<p class="m-0 text-small">Head, body and foot stack to its right.</p>
							</CardBody>
						</div>
					</Card>

					<Card disabled>
						<CardHeader>
							<CardTitle description="Nothing in it can be pressed.">Disabled</CardTitle>
						</CardHeader>
						<CardBody>
							<AISkeletonPlaceholder class="h-16 w-full" />
						</CardBody>
					</Card>
				</div>
			</Sub>

			<Sub
				title="Dialog"
				note="On the browser's own dialog element. Modal, or sitting over a page that stays usable."
			>
				<Row label="open">
					<Button onClick={() => setModal(true)}>Modal dialog</Button>
					<Button kind="tertiary" onClick={() => setPlain((value) => !value)}>
						Non-modal dialog
					</Button>
				</Row>
				<Dialog
					open={modal()}
					aria-labelledby="demo-dialog-title"
					onRequestClose={() => setModal(false)}
				>
					<DialogHeader>
						<DialogTitle id="demo-dialog-title">Delete this board?</DialogTitle>
						<DialogControls>
							<DialogCloseButton onClick={() => setModal(false)} />
						</DialogControls>
					</DialogHeader>
					<DialogBody>
						<p class="m-0">
							i2c-fanout-6 and its 48 forks' link to it will go. This cannot be undone.
						</p>
					</DialogBody>
					<DialogFooter
						danger
						dangerDescription="Destructive:"
						primaryButtonText="Delete"
						secondaryButtonText="Keep it"
						loadingStatus={saving()}
						loadingDescription={saving() === "finished" ? "Deleted" : "Deleting…"}
						onRequestClose={() => setModal(false)}
						onRequestSubmit={() => {
							setSaving("active")
							setTimeout(() => setSaving("finished"), 1200)
						}}
						onLoadingSuccess={() => {
							setSaving("inactive")
							setModal(false)
						}}
					/>
				</Dialog>
				<Dialog
					open={plain()}
					modal={false}
					aria-label="A note"
					class="max-w-sm"
					onRequestClose={() => setPlain(false)}
				>
					<DialogHeader>
						<DialogTitle>Non-modal</DialogTitle>
						<DialogControls>
							<DialogCloseButton onClick={() => setPlain(false)} />
						</DialogControls>
					</DialogHeader>
					<DialogBody>
						<p class="m-0">The page behind is still live. Press the button again, or the close.</p>
					</DialogBody>
				</Dialog>
			</Sub>

			<Sub
				title="ChatButton"
				note="A quick action is content, not a command — and shows itself as taken."
			>
				<Row label="quick actions">
					<For each={PROMPTS}>
						{(prompt) => (
							<ChatButton
								kind="secondary"
								isQuickAction
								isSelected={taken() === prompt}
								onClick={() => setTaken(prompt)}
							>
								{prompt}
							</ChatButton>
						)}
					</For>
				</Row>
				<Row label="kinds">
					<ChatButton kind="primary">Send</ChatButton>
					<ChatButton kind="secondary">Regenerate</ChatButton>
					<ChatButton kind="tertiary">Stop</ChatButton>
					<ChatButton kind="ghost">Dismiss</ChatButton>
					<ChatButton kind="danger">Discard</ChatButton>
					<ChatButtonSkeleton />
				</Row>
			</Sub>

			<Sub title="IconIndicator" note="Twelve states, twelve different glyphs, each with its word.">
				<Tile class="pt-tight">
					<div class="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
						<For each={IconIndicatorKinds}>
							{(kind) => <IconIndicator kind={kind} label={kind.replace("-", " ")} />}
						</For>
					</div>
					<div class="mt-4 flex flex-wrap items-center gap-4">
						<IconIndicator kind="succeeded" label="size 20" size={20} />
						<span class="flex items-center gap-2 text-small opacity-muted">
							compact:
							<IconIndicator kind="failed" label="Failed" compact />
							<IconIndicator kind="in-progress" label="In progress" compact />
							<IconIndicator kind="succeeded" label="Succeeded" compact />
						</span>
					</div>
				</Tile>
			</Sub>

			<Sub
				title="ShapeIndicator"
				note="Eleven kinds on eight shapes: three pairs share one, and are told apart by their label alone."
			>
				<Tile class="pt-tight">
					<div class="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
						<For each={ShapeIndicatorKinds}>
							{(kind) => <ShapeIndicator kind={kind} label={kind} />}
						</For>
					</div>
					<div class="mt-4">
						<ShapeIndicator kind="stable" label="text size 14" textSize={14} />
					</div>
				</Tile>
			</Sub>

			<Sub title="OverflowMenuV2 · two-handle Slider">
				<Row label="menu">
					<OverflowMenuV2 label="Board actions">
						<MenuItem label="Edit" renderIcon={Edit} shortcut="⌘E" />
						<MenuItem label="Duplicate" renderIcon={Copy} />
						<MenuItem label="Export as">
							<MenuItem label="IPC-2581" />
							<MenuItem label="Gerber X2" />
						</MenuItem>
						<MenuItemDivider />
						<MenuItem label="Delete" kind="danger" renderIcon={TrashCan} />
					</OverflowMenuV2>
					<span class="text-small opacity-muted">
						takes MenuItems, so submenus and dividers work
					</span>
				</Row>
				<Tile class="pt-tight">
					<Slider
						labelText="Trace width window"
						min={0.1}
						max={1}
						step={0.05}
						ticks
						unit="mm"
						value={range()[0]}
						unstable_valueUpper={range()[1]}
						unstable_ariaLabelInputUpper="Widest trace"
						onChange={(low, high) => setRange([low, high ?? low])}
					/>
				</Tile>
			</Sub>
		</>
	)
}
