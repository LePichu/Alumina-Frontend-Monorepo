import { createMemo, createResource, createSignal, For, Show } from "solid-js"
import Application from "@carbon/icons/es/application/16"
import Download from "@carbon/icons/es/download/16"
import {
	Background,
	Button,
	ButtonSet,
	ContentSwitcher,
	FormGroup,
	Icon,
	RadioTile,
	ScrollArea,
	Search,
	Select,
	SelectItem,
	SkeletonIcon,
	SkeletonPlaceholder,
	Slider,
	Switch,
	TextInput,
	Tile,
	TileGroup,
	TileSection,
	Toggle,
	Workspace,
} from "../../index"
import {
	appIconSvg,
	GLYPH_NAMES,
	loadGlyph,
	pngOf,
	readInk,
	saveFile,
	svgAddress,
	wordsOf,
} from "./icon"
import type { Face } from "./icon"

/** As many glyphs as the picker draws at once: sixteen rows of four. */
const SHOWN = 64

const FACES: Face[] = ["white", "ink"]

/** The PNG sizes an icon set asks for, up to the 1024 an app store wants. */
const PNG_SIZES = [16, 32, 48, 64, 128, 256, 512, 1024]

/** The preview sizes, as the spacing scale has them: 256, 128, 64, 32, 16px. */
const PREVIEW: [px: number, size: string][] = [
	[256, "size-64"],
	[128, "size-32"],
	[64, "size-16"],
	[32, "size-8"],
	[16, "size-4"],
]

/** The app icon generator: the system's own `Tile`, a Carbon glyph on its face —
 *  the system's furniture made the app's mark — on transparency and cropped to
 *  the tile and its shadow, saved as SVG or as PNG at any of the sizes an icon
 *  set needs.
 *
 *  A page of its own on the playground's server (`/app-icon.html`), not one of
 *  its sections: it is a tool for making a thing, not a component on show. Its
 *  first use is the desktop app's icon — `pnpm --filter @alumina/desktop tauri
 *  icon <the saved PNG or SVG>` renders the platform set from what it saves.
 */
export function AppIconPage() {
	const [query, setQuery] = createSignal("")
	// foundry's own glyph, to start from.
	const [name, setName] = createSignal("layers")
	const [face, setFace] = createSignal<Face>("white")
	const [bar, setBar] = createSignal(false)
	const [share, setShare] = createSignal(56)
	const [pngSize, setPngSize] = createSignal("1024")
	const [file, setFile] = createSignal("")
	const ink = readInk()

	const matches = createMemo(() => {
		const words = query().trim().toLowerCase().split(/\s+/).filter(Boolean)
		return words.length
			? GLYPH_NAMES.filter((glyph) => words.every((word) => glyph.toLowerCase().includes(word)))
			: GLYPH_NAMES
	})

	const [glyph] = createResource(name, loadGlyph)
	// The last glyph drawn stays while the next one loads, so the preview does
	// not blink between them.
	const svg = createMemo(() => {
		const current = glyph.latest
		return current
			? appIconSvg(
				current,
				{ face: face(), bar: bar(), glyph: share() / 100 },
				ink,
			)
			: undefined
	})
	const address = () => {
		const current = svg()
		return current ? svgAddress(current) : undefined
	}
	const fileName = () => file().trim() || `${wordsOf(name()).replace(/\s+/g, "-")}-app-icon`

	const saveSvg = () => {
		const current = svg()
		if (current) {
			saveFile(
				new Blob([current], { type: "image/svg+xml" }),
				`${fileName()}.svg`,
			)
		}
	}
	const savePng = async () => {
		const current = svg()
		if (!current) return
		const size = Number(pngSize())
		saveFile(await pngOf(current, size), `${fileName()}-${size}.png`)
	}

	return (
		<>
			<Background variant="grid" />
			<Workspace
				asideLabel="App icon"
				class="relative z-10 h-dvh p-gap"
				aside={
					<Tile
						bar
						flush
						fill
						heading={
							<>
								<Icon glyph={Application} size={16} />App icon
							</>
						}
						meta="square · SVG · PNG"
						class="flex min-h-0 flex-1 flex-col"
					>
						{
							/* The glyphs take what height the settings leave, and scroll in it;
						    the settings stay where they can be reached. */
						}
						<TileSection heading="Glyph" grow class="min-h-48">
							<Search
								size="sm"
								labelText="Find a glyph"
								hideLabel
								placeholder={`Find one of ${GLYPH_NAMES.length} glyphs`}
								value={query()}
								onInput={setQuery}
								onClear={() => setQuery("")}
							/>
							<ScrollArea
								frameClass="mt-snug min-h-0 flex-1"
								class="pb-rule pr-snug"
							>
								<TileGroup
									legend="Glyph"
									hideLegend
									valueSelected={name()}
									onChange={setName}
									class="grid grid-cols-4 gap-tight"
								>
									<For each={matches().slice(0, SHOWN)}>
										{(entry) => <GlyphChoice name={entry} />}
									</For>
								</TileGroup>
							</ScrollArea>
							<p class="m-0 mt-snug text-small opacity-muted">
								{matches().length > SHOWN
									? `${SHOWN} of ${matches().length} shown: narrow the search.`
									: matches().length
									? `${matches().length} shown.`
									: "No glyph by that name."} Chosen: <b class="font-bold opacity-100">{name()}</b>
							</p>
						</TileSection>

						<TileSection heading="Tile">
							<FormGroup legendText="Face" class="mb-snug">
								<ContentSwitcher
									size="sm"
									selectedIndex={FACES.indexOf(face())}
									onChange={(index) => setFace(FACES[index] ?? "white")}
									class="w-full"
								>
									<Switch text="White" class="flex-1" />
									<Switch text="Ink" class="flex-1" />
								</ContentSwitcher>
							</FormGroup>
							<Slider
								labelText="Glyph size"
								min={30}
								max={90}
								step={2}
								unit="%"
								value={share()}
								onChange={(value) => setShare(value)}
							/>
							<Toggle
								inline
								size="sm"
								labelText="header bar"
								toggled={bar()}
								onToggle={setBar}
							/>
						</TileSection>

						<TileSection heading="Save">
							<TextInput
								size="sm"
								labelText="File name"
								placeholder={fileName()}
								value={file()}
								onInput={(event) => setFile(event.currentTarget.value)}
							/>
							<Select
								inline
								size="sm"
								labelText="PNG size"
								value={pngSize()}
								onChange={setPngSize}
								class="mt-snug"
							>
								<For each={PNG_SIZES}>
									{(size) => (
										<SelectItem
											value={String(size)}
											text={`${size} × ${size}`}
										/>
									)}
								</For>
							</Select>
							<ButtonSet class="mt-2">
								<Button
									kind="secondary"
									size="sm"
									renderIcon={Download}
									flat
									disabled={!svg()}
									onClick={saveSvg}
								>
									Save SVG
								</Button>
								<Button
									kind="primary"
									size="sm"
									renderIcon={Download}
									flat
									disabled={!svg()}
									onClick={() => void savePng()}
								>
									Save PNG
								</Button>
							</ButtonSet>
						</TileSection>
					</Tile>
				}
			>
				{/* No fade: the column has no ground of its own, only the floor. */}
				<ScrollArea
					fade={false}
					class="flex flex-col gap-gap pb-snug pl-rule pr-snug pt-rule"
				>
					<Preview heading="On white" address={address()} />
					{/* An icon also has to hold its own on a dark dock. */}
					<Preview heading="On ink" address={address()} inverse />
				</ScrollArea>
			</Workspace>
		</>
	)
}

/** One glyph in the picker, loaded when it is drawn. */
function GlyphChoice(props: { name: string }) {
	const [glyph] = createResource(() => props.name, loadGlyph)

	return (
		<RadioTile value={props.name} class="h-12 justify-center">
			<Show when={glyph.latest} fallback={<SkeletonIcon size={24} />}>
				{(current) => <Icon glyph={current()} size={24} label={wordsOf(props.name)} />}
			</Show>
		</RadioTile>
	)
}

/** The icon at the sizes it is seen at, on one ground. */
function Preview(
	props: { heading: string; address?: string; inverse?: boolean },
) {
	return (
		<Tile heading={props.heading} inverse={props.inverse}>
			<div class="flex flex-wrap items-end gap-6">
				<For each={PREVIEW}>
					{([px, size]) => (
						<figure class="m-0 flex flex-col items-center gap-snug">
							<Show
								when={props.address}
								fallback={<SkeletonPlaceholder class={size} />}
							>
								{(address) => <img src={address()} alt="" class={`block ${size}`} />}
							</Show>
							<figcaption class="text-micro opacity-muted">{px}</figcaption>
						</figure>
					)}
				</For>
			</div>
		</Tile>
	)
}
