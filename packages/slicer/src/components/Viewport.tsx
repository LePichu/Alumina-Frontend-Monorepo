import { createSignal, For, onCleanup } from "solid-js"
import type { BufferGeometry } from "three"
import Cube from "@carbon/icons/es/cube/16"
import FitToScreen from "@carbon/icons/es/fit-to-screen/16"
import Layers from "@carbon/icons/es/layers/16"
import Maximize from "@carbon/icons/es/maximize/16"
import Minimize from "@carbon/icons/es/minimize/16"
import PaintBrush from "@carbon/icons/es/paint-brush/16"
import PrinterIcon from "@carbon/icons/es/printer/16"
import Template from "@carbon/icons/es/template/16"
import { ContentSwitcher, IconButton, IconButtonGroup, Slider, Switch, Tile } from "@alumina/design"
import type { CarbonGlyph } from "@alumina/design"
import { LayerRenderer } from "./LayerRenderer"
import type { RendererShow, RendererView } from "./LayerRenderer"
import { RotateStick } from "./RotateStick"

export type ViewportProps = {
	/** The part on the stage, and its ink solid if it has one. */
	body?: BufferGeometry
	ink?: BufferGeometry
	/** What the stage is waiting for, and why it may have nothing to show. */
	waiting?: string
	error?: string
	layer: number
	layers: number
	onLayerChange: (layer: number) => void
	/** The part's height in mm, for the readout. */
	thickness: number
	sheet: boolean
	onBackdropToggle: () => void
}

/** What of the part is drawn: all of it, the printed body alone, or the ink
 *  alone — mica writes the ink as solids of their own. (The prototype had a
 *  fourth, Drill, with no geometry behind it; the vias are in the body.) A part
 *  with no ink — the assembly, a fixture, a run with `no_ink` — offers only the
 *  body. */
const OPS: { name: string; glyph: CarbonGlyph; show: RendererShow }[] = [
	{ name: "All", glyph: Layers, show: "all" },
	{ name: "Shell", glyph: PrinterIcon, show: "shell" },
	{ name: "Ink", glyph: PaintBrush, show: "ink" },
]

/** The stage: the render, and the control bar that floats over its bottom edge. */
export function Viewport(props: ViewportProps) {
	const [view, setView] = createSignal<RendererView>("iso")
	const [fitToken, setFitToken] = createSignal(0)
	const [full, setFull] = createSignal(false)
	const [op, setOp] = createSignal(0)
	const [spin, setSpin] = createSignal(0)
	const [tilt, setTilt] = createSignal(0)
	let stage: HTMLDivElement | undefined

	const onFullscreenChange = () => setFull(document.fullscreenElement === stage)
	document.addEventListener("fullscreenchange", onFullscreenChange)
	onCleanup(() => document.removeEventListener("fullscreenchange", onFullscreenChange))

	const toggleFullscreen = () => {
		if (document.fullscreenElement) void document.exitFullscreen()
		else void stage?.requestFullscreen().catch(() => setFull(false))
	}

	/** Height revealed, in millimetres — what the big readout shows. */
	const height = () => (props.layers > 0 ? props.thickness * props.layer / props.layers : 0)
	/** What is drawn: with no ink to show, only the body is. */
	const show = (): RendererShow => (props.ink ? OPS[op()]?.show ?? "all" : "shell")
	const objects = () => (show() === "all" && props.ink ? 2 : props.body ? 1 : 0)

	return (
		// No background: the stage is transparent so the page's backdrop — the sheet
		// or the grid — runs behind the board, as it does in the prototype.
		// size-full, not min-h-0: the stage is a grid cell that has to fill its
		// track, and the overlay below is positioned against this box. Without a
		// height the canvas collapses and the bar floats to the top of the page.
		<div ref={stage} class="relative size-full">
			<LayerRenderer
				body={props.body}
				ink={props.ink}
				show={show()}
				waiting={props.waiting}
				error={props.error}
				layer={props.layer}
				layers={props.layers}
				view={view()}
				spin={spin()}
				tilt={tilt()}
				fitToken={fitToken()}
				// size-full, not "absolute inset-0": the renderer's own root is
				// `relative`, and a position utility passed in loses to it.
				class="size-full"
			/>

			{
				/* One bordered bar on the prototype's three tracks, spanning the stage.
			    A flex row here let the middle push the bar wider than the stage.
			    The box is a Tile; what is ours is only the three-track grid inside.
			    inset-x-gap with mx-auto pins it a gap in from each side and centres it
			    once max-width takes over — the same result the prototype reached with
			    a calc() on the width. */
			}
			<Tile flush class="absolute inset-x-gap bottom-gap mx-auto max-w-208">
				{
					/* Three tracks once the page is 42rem wide (`@2xl`, its own width, not the
				    window's). Below that the rotate pad is dropped: a phone
				    has no room for a pad beside the slider, and no need of one — the
				    board itself is dragged with a finger, and "refit" is still in the
				    utility group. */
				}
				<div class="grid grid-cols-1 @md:grid-cols-[minmax(0,1fr)_auto] @2xl:grid-cols-[auto_minmax(0,1fr)_auto]">
					{
						/* left: hold to rotate, tap to reset. No padding on the cell — the pad
				    carries its own margin, exactly as the utility group does, and both
				    end caps are the same stated square: 28 units, which with their
				    margins is the height the middle column comes to.
				    They used to square themselves off the row's height (aspect-square
				    and a percentage height in an auto track). That is circular, and
				    only Chromium resolved it the way it was meant: Firefox collapsed
				    the pad's column to nothing, so the pad sat on top of the slider,
				    and WebKit gave it a third size. A stated size is the same
				    everywhere. */
					}
					<div class="hidden place-items-center border-r-2 border-ink @2xl:grid">
						<RotateStick
							onRotate={(nextSpin, nextTilt) => {
								setSpin(nextSpin)
								setTilt(nextTilt)
							}}
							onPin={() => {
								setView("iso")
								setFitToken((n) => n + 1)
							}}
						/>
					</div>

					{
						/* middle: what is revealed, and how far. Under 28rem of page — a phone,
					    less the shell's strip — the utility group goes below it rather than
					    beside it, or the slider's numbers ran together and the last mode
					    was cut off under the group. */
					}
					<div class="min-w-0 border-b-2 border-ink p-snug @md:border-b-0 @md:border-r-2">
						<div class="mb-tight flex items-baseline gap-snug text-label uppercase tracking-micro">
							<span>{props.ink ? OPS[op()]?.name : "Body"}</span>
							<span class="normal-case tracking-normal opacity-muted">{objects()} obj</span>
							<b class="ml-auto text-figure tracking-normal">{height().toFixed(2)} mm</b>
						</div>

						{
							/* The design system's slider, with the prototype's tick marks. It
					    starts at 0 — a bare plate — not at layer 1. */
						}
						<Slider
							labelText="Reveal to layer"
							hideLabel
							hideTextInput
							min={0}
							max={props.layers}
							step={1}
							ticks
							value={props.layer}
							onChange={props.onLayerChange}
						/>

						{/* One number per major tick, not just the ends. */}
						<div class="flex justify-between text-micro opacity-muted">
							<For each={[0, 1, 2, 3, 4]}>
								{(step) => <span>{(props.thickness * step / 4).toFixed(2)}</span>}
							</For>
						</div>

						{
							/* The design system's switcher — one ink box divided by ink rules.
					    Hand-rolling this from buttons gave every cell its own border, so
					    the dividers doubled and read as gaps. */
						}
						<ContentSwitcher
							class="mt-tight w-full"
							selectedIndex={props.ink ? op() : 1}
							onChange={setOp}
						>
							<For each={OPS}>
								{(entry) => (
									<Switch
										renderIcon={entry.glyph}
										iconDescription={entry.name}
										disabled={!props.ink && entry.show !== "shell"}
										class="flex-1"
									/>
								)}
							</For>
						</ContentSwitcher>
					</div>

					{/* right: view, backdrop, fit, full screen */}
					<IconButtonGroup
						label="Viewport controls"
						columns={4}
						class="m-snug h-12 @md:size-28 @md:grid-cols-2"
					>
						<Util
							label={view() === "iso" ? "View · isometric" : "View · top"}
							glyph={Cube}
							onClick={() => setView((c) => (c === "iso" ? "top" : "iso"))}
						/>
						<Util
							label={props.sheet ? "Backdrop · sheet" : "Backdrop · grid"}
							glyph={Template}
							onClick={props.onBackdropToggle}
						/>
						<Util
							label="Refit the frame"
							glyph={FitToScreen}
							onClick={() => setFitToken((n) => n + 1)}
						/>
						<Util
							label={full() ? "Leave full screen" : "Full screen"}
							glyph={full() ? Minimize : Maximize}
							onClick={toggleFullscreen}
						/>
					</IconButtonGroup>
				</div>
			</Tile>
		</div>
	)
}

/** One utility control. IconButton carries the tooltip, which every control on
 *  this bar needs — they are all icon-only. */
function Util(props: { label: string; glyph: CarbonGlyph; onClick: () => void }) {
	return (
		<IconButton
			label={props.label}
			renderIcon={props.glyph}
			kind="secondary"
			align="top"
			flat
			fill
			borderless
			onClick={props.onClick}
		/>
	)
}
