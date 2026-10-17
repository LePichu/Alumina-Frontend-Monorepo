import { createSignal, For, onCleanup } from "solid-js"
import {
	Avatar,
	Button,
	Checkbox,
	Drawer,
	FormGroup,
	InlineLoading,
	Loading,
	ProgressBar,
	SkeletonIcon,
	SkeletonPlaceholder,
	SkeletonText,
	Tile,
	TileSection,
} from "../index"
import type { DrawerSide } from "../index"
import { Row } from "./shared"

/** A stand-in portrait, inline so the playground needs no image file: a head and
 *  shoulders in two ink rectangles. */
const avatarUrl = `data:image/svg+xml,${
	encodeURIComponent(
		"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' fill='#fff'/><rect x='20' y='12' width='24' height='24' fill='#000'/><rect x='8' y='44' width='48' height='20' fill='#000'/></svg>",
	)
}`

export function LoadingDemo() {
	const [overlay, setOverlay] = createSignal(false)

	return (
		<>
			<Row label="Loading">
				<Loading description="Slicing" />
				<Loading small description="Slicing" />
				<Button
					kind="tertiary"
					onClick={() => {
						setOverlay(true)
						setTimeout(() => setOverlay(false), 1600)
					}}
				>
					With overlay
				</Button>
				<Loading withOverlay active={overlay()} description="Loading the board" />
			</Row>
			<Row label="InlineLoading">
				<InlineLoading status="active" description="Uploading mesh…" />
				<InlineLoading status="finished" description="Uploaded" />
				<InlineLoading status="error" description="Upload failed" />
				<InlineLoading status="inactive" description="Waiting" />
			</Row>
		</>
	)
}

export function ProgressBarDemo() {
	const [value, setValue] = createSignal(12)
	const timer = setInterval(() => setValue((current) => (current >= 100 ? 0 : current + 4)), 400)
	onCleanup(() => clearInterval(timer))

	return (
		<Tile class="pt-tight">
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<ProgressBar
					label="Slicing"
					value={value()}
					helperText={`${value()}% · layer ${Math.ceil(value() / 25)} of 4`}
				/>
				<ProgressBar label="Indeterminate" helperText="Waiting for the printer" />
				<ProgressBar label="Finished" status="finished" helperText="4 layers, 5h 04m" />
				<ProgressBar label="Error" status="error" helperText="Lost the printer at layer 2" />
				<ProgressBar label="Small" size="small" value={64} />
				<ProgressBar label="Inline" type="inline" value={value()} helperText={`${value()}%`} />
			</div>
		</Tile>
	)
}

export function SkeletonDemo() {
	return (
		<Tile class="pt-tight">
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
				<div class="flex flex-col gap-2">
					<SkeletonText heading width="60%" />
					<SkeletonText paragraph lineCount={3} />
				</div>
				<div class="flex items-center gap-2">
					<SkeletonIcon size={32} />
					<div class="min-w-0 flex-1">
						<SkeletonText width="80%" />
					</div>
				</div>
				<SkeletonPlaceholder class="h-24 w-full" />
			</div>
		</Tile>
	)
}

export function AvatarDemo() {
	return (
		<>
			<Row label="image">
				<Avatar image={avatarUrl} name="avthenticstemcel" size="sm" />
				<Avatar image={avatarUrl} name="avthenticstemcel" />
				<Avatar image={avatarUrl} name="avthenticstemcel" size="lg" />
				<Avatar image={avatarUrl} name="avthenticstemcel" size="xl" />
			</Row>
			<Row label="initials">
				<Avatar name="Sambhav Arora" size="sm" />
				<Avatar name="Sambhav Arora" />
				<Avatar name="Pixelexia" size="lg" />
				<Avatar name="avthenticstemcel" size="xl" />
			</Row>
			<Row label="glyph · failed image">
				<Avatar size="sm" />
				<Avatar />
				<Avatar size="lg" />
				<Avatar image="/missing.png" name="Sambhav Arora" imageDescription="Sambhav Arora" />
			</Row>
		</>
	)
}

const SIDES: DrawerSide[] = ["left", "right", "bottom"]

export function DrawerDemo() {
	const [side, setSide] = createSignal<DrawerSide>()

	return (
		<>
			<Row label="side">
				<For each={SIDES}>
					{(each) => <Button kind="tertiary" onClick={() => setSide(each)}>{each}</Button>}
				</For>
				<span class="text-small opacity-muted">drag it, flick it shut, or press Escape</span>
			</Row>
			<Drawer
				open={side() !== undefined}
				side={side() ?? "left"}
				label="Filters"
				flush
				onClose={() => setSide(undefined)}
			>
				<TileSection size="md">
					<FormGroup legendText="Process">
						<Checkbox labelText="Alumina Z1" checked />
						<Checkbox labelText="2-layer fab" />
						<Checkbox labelText="Flex" />
					</FormGroup>
				</TileSection>
				<TileSection size="md">
					<Button
						kind="secondary"
						size="sm"
						class="w-full justify-center"
						onClick={() => setSide(undefined)}
					>
						Done
					</Button>
				</TileSection>
			</Drawer>
		</>
	)
}
