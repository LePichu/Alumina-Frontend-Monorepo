/** Everything the publish flow shows, lifted from quarry.html.
 *
 * Publishing is not a form that asks what the board is — quarry reads the git
 * repository, works out the toolchain, exports the fabrication data itself and
 * runs mica's validation. So most of this is *output*: what the build found and
 * what it produced. It is fixture data only until there is a backend to run a
 * build at all.
 */

import type { CodeLang } from "@alumina/design"
import type { Check } from "../lib/quarry"

/** What the build read off the project. Displayed, never typed in. */
export const DETECTED: [label: string, value: string][] = [
	["toolchain", "KiCad 9"],
	["matched", "*.kicad_pro"],
	["layers", "2"],
	["outline", "44.0 × 40.0 mm"],
	["nets · pads", "6 · 54"],
	["narrowest trace", "0.25 mm"],
	["drill range", "0.30 – 3.20 mm"],
]

/** The build log, as severity rows. The same shape as mica's validation, because
 *  the last three steps are mica's validation. */
export const BUILD_STEPS: Check[] = [
	{ severity: "ok", label: "Checkout", detail: "a3f19c2 at v1.2 · LFS objects fetched" },
	{
		severity: "ok",
		label: "kicad-cli pcb export ipc2581",
		detail: "--units mm --precision 4 → board.xml",
	},
	{ severity: "ok", label: "mica --validate", detail: "319 KB mesh, 2 layers" },
	{
		severity: "warning",
		label: "Design rules",
		detail: "8 vias at 0.30 mm, under the Z1 comfort floor",
	},
	{ severity: "ok", label: "Provenance and licence", detail: "no duplicate · CC0 → CC0" },
	{ severity: "ok", label: "Bill of materials", detail: "17 parts across 2 distributors" },
]

export type Artifact = { name: string; glyph: "document" | "cube" | "tool-kit"; meta: string }

/** Produced by the build, not uploaded. Each one is removable. */
export const ARTIFACTS: Artifact[] = [
	{ name: "board.xml", glyph: "document", meta: "IPC-2581C · 412 KB" },
	{ name: "board.stl", glyph: "cube", meta: "mica · 319 KB" },
	{ name: "bom.csv", glyph: "tool-kit", meta: "from schematic · 4 KB" },
]

export type SourceFile = {
	path: string
	glyph: "document" | "chip" | "tool-kit"
	/** Whether the file came out of git or out of the build. */
	origin: "source" | "built"
	lang: CodeLang
	body: string
}

/** The tree a reader would browse at the tagged commit. Sources come from git;
 *  board.xml is written by the build.
 *
 *  KiCad's board format is a Lisp s-expression, so it is highlighted as Scheme —
 *  which is what the prototype's own tokeniser did with it. That tokeniser is not
 *  ported: it existed only so one offline file could highlight anything.
 */
export const SOURCE_FILES: SourceFile[] = [
	{
		path: "board.xml",
		glyph: "document",
		origin: "built",
		lang: "xml",
		body: `<IPC-2581 revision="C">
  <Content>
    <FunctionMode mode="ASSEMBLY" level="3"/>
    <StepRef name="i2c-fanout-6"/>
    <LayerRef name="TOP"/>
    <LayerRef name="BOTTOM"/>
  </Content>
  <Ecad name="quarry-export">
    <CadHeader units="MILLIMETER"/>
    <CadData>
      <Layer name="TOP" layerFunction="CONDUCTOR" side="TOP"/>
      <Layer name="BOTTOM" layerFunction="CONDUCTOR" side="BOTTOM"/>
      <Step name="i2c-fanout-6">
        <Profile>
          <Polygon>
            <PolyBegin x="0.0" y="0.0"/>
            <PolyStepSegment x="44.0" y="0.0"/>
            <PolyStepSegment x="44.0" y="40.0"/>
            <PolyStepSegment x="0.0" y="40.0"/>
          </Polygon>
        </Profile>
        <LayerFeature layerRef="TOP"/>
      </Step>
    </CadData>
  </Ecad>
</IPC-2581>`,
	},
	{
		path: "hardware/i2c-fanout-6.kicad_pcb",
		glyph: "chip",
		origin: "source",
		lang: "scheme",
		body: `(kicad_pcb (version 20221018) (generator pcbnew)
  (general (thickness 1.6))
  (layers
    (0 "F.Cu" signal)
    (31 "B.Cu" signal)
    (44 "Edge.Cuts" user))
  (net 0 "")
  (net 1 "GND")
  (net 2 "SDA")
  (segment (start 118.0 92.5) (end 126.5 92.5) (width 0.25) (layer "F.Cu") (net 2)))`,
	},
	{
		path: "bom.csv",
		glyph: "tool-kit",
		origin: "built",
		lang: "csv",
		body: `ref,part,package,qty,each
U1,MCP1700T-3302E,SOT-23,1,0.38
R1-R2,RC0805FR-074K7L,0805,2,0.02
C1-C5,GRM31CR61E106KA,0805,5,0.11
J1-J4,PinHeader_1x06,THT,4,0.24`,
	},
	{
		path: "README.md",
		glyph: "document",
		origin: "source",
		lang: "markdown",
		body: `# i2c-fanout-6

Six addressable I²C ports off one bus, pull-ups jumpered per port.

## Build
1. Print the substrate on an Alumina Z1 (0.8 mm carbon ink).
2. Fill the channels, cure for 20 minutes.
3. Reflow the 0805 passives, hand-solder the headers.`,
	},
]

/** The rail's summary of what is about to be published. */
export const BEFORE_PUBLISH: [label: string, value: string][] = [
	["slug", "avthenticstemcel/i2c-fanout-6"],
	["source", "mirrored · v1.2"],
	["artifacts", "3 generated"],
	["licence", "CC0"],
]
