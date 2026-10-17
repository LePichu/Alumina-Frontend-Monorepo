import type { CarbonGlyph, CarbonGlyphNode } from "../../icons/glyph"

/** Every Carbon icon at 32, by its path under @carbon/icons/es: `layers`,
 *  `checkmark--filled`, `watson-health/3D-Cursor`. Loaded one at a time, when
 *  it is drawn — the whole set at once is thousands of modules. */
const LOADERS = import.meta.glob<CarbonGlyph>("../../../node_modules/@carbon/icons/es/**/32.js", {
	import: "default",
})

const nameOf = (path: string) =>
	path.replace(/^.*\/@carbon\/icons\/es\//, "").replace(/\/32\.js$/, "")

const BY_NAME = new Map(Object.entries(LOADERS).map(([path, load]) => [nameOf(path), load]))

/** Every icon's name, in order. */
export const GLYPH_NAMES: readonly string[] = [...BY_NAME.keys()].sort((a, b) => a.localeCompare(b))

/** A name as words: `checkmark--filled` reads "checkmark filled". */
export const wordsOf = (name: string) => name.split("/").pop()?.replace(/-+/g, " ") ?? name

export function loadGlyph(name: string): Promise<CarbonGlyph> {
	const load = BY_NAME.get(name)
	return load ? load() : Promise.reject(new Error(`No Carbon icon named ${name}`))
}

/** The tile: a white one with an ink glyph, or the inverse. */
export type Face = "white" | "ink"

export type AppIconOptions = {
	face: Face
	/** The tile's ink header bar, as a `Tile` with `bar` has. */
	bar: boolean
	/** How much of the tile's face the glyph's box takes, from 0 to 1. */
	glyph: number
}

/** The system's ink as the page has it, as `rgb(…)`: an SVG written to a file
 *  has no stylesheet, and the tools that read app icons know `rgb()` better
 *  than CSS's newer forms. */
export function readInk(): string {
	const probe = document.createElement("span")
	document.body.append(probe)
	probe.style.color = "var(--color-ink)"
	const ink = getComputedStyle(probe).color
	probe.remove()
	return ink
}

/** The icon's own coordinates. App icons are drawn at 1024 and scaled down;
 *  an SVG scales anyway, and a PNG is drawn from it at whatever size is asked. */
const SIDE = 1024

const attr = (value: string | number) =>
	String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;")

/** A Carbon descriptor's node, as SVG markup. */
function markup(node: CarbonGlyphNode): string {
	const attrs = Object.entries(node.attrs ?? {})
		.map(([name, value]) => ` ${name}="${attr(value)}"`)
		.join("")
	const inner = (node.content ?? []).map(markup).join("")
	return inner ? `<${node.elem}${attrs}>${inner}</${node.elem}>` : `<${node.elem}${attrs}/>`
}

/** The app icon: the system's own `Tile`, the glyph on its face — an ink
 *  border, square corners and the one hard shadow down and right, twice the
 *  border's width, as `border-2` is to `shadow-hard` — drawn at an icon's
 *  weight: the border is a fortieth of the tile.
 *
 *  The tile and its shadow are the whole of the image: nothing round them,
 *  transparent where the shadow leaves the corners empty, and no margin — the
 *  platform's own icon grid puts the air round an icon, and air drawn in here
 *  as well only made the tile smaller. Still square: the shadow falls as far
 *  down as across.
 *
 *  One SVG is what the preview shows, what "Save SVG" writes and what a PNG is
 *  drawn from, so all three are the same picture. */
export function appIconSvg(glyph: CarbonGlyph, options: AppIconOptions, ink: string): string {
	// The tile and its shadow fill the side: the tile is 20/21 of it, the shadow
	// a twentieth of the tile.
	const size = SIDE * 20 / 21
	const border = size / 40
	const shadow = border * 2
	const face = options.face === "ink" ? ink : "#fff"
	const figure = options.face === "ink" ? "#fff" : ink
	const barHeight = options.bar ? size / 8 : 0

	// The face inside the border, below the bar.
	const innerTop = border + barHeight
	const innerWidth = size - border * 2
	const innerHeight = size - border * 2 - barHeight
	const box = Math.min(innerWidth, innerHeight) * options.glyph
	const viewBox = String(glyph.attrs?.["viewBox"] ?? "0 0 32 32").split(/\s+/).map(Number)
	const glyphX = border + (innerWidth - box) / 2
	const glyphY = innerTop + (innerHeight - box) / 2

	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIDE} ${SIDE}" width="${SIDE}" height="${SIDE}">` +
		`<rect x="${shadow}" y="${shadow}" width="${size}" height="${size}" fill="${ink}"/>` +
		`<rect width="${size}" height="${size}" fill="${face}"/>` +
		(options.bar ? `<rect width="${size}" height="${barHeight + border}" fill="${ink}"/>` : "") +
		`<rect x="${border / 2}" y="${border / 2}" width="${size - border}" height="${
			size - border
		}" fill="none" stroke="${ink}" stroke-width="${border}"/>` +
		`<g transform="translate(${glyphX} ${glyphY}) scale(${
			box / (viewBox[2] || 32)
		})" fill="${figure}">` +
		(glyph.content ?? []).map(markup).join("") +
		"</g></svg>"
}

/** An SVG as an image's address. */
export const svgAddress = (svg: string) =>
	`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`

/** The icon as a PNG, `size` pixels square, drawn from the SVG at that size —
 *  not shrunk from a large bitmap, so a small one is as sharp as it can be. */
export async function pngOf(svg: string, size: number): Promise<Blob> {
	const image = new Image()
	image.src = svgAddress(svg)
	await image.decode()
	const canvas = document.createElement("canvas")
	canvas.width = size
	canvas.height = size
	const context = canvas.getContext("2d")
	if (!context) throw new Error("No 2D canvas to draw the PNG on")
	context.imageSmoothingQuality = "high"
	context.drawImage(image, 0, 0, size, size)
	return new Promise((resolve, reject) =>
		canvas.toBlob(
			(blob) => (blob ? resolve(blob) : reject(new Error("The PNG could not be made"))),
			"image/png",
		)
	)
}

/** Hands a file to the browser to save. */
export function saveFile(contents: Blob, name: string) {
	const link = document.createElement("a")
	link.href = URL.createObjectURL(contents)
	link.download = name
	link.click()
	setTimeout(() => URL.revokeObjectURL(link.href), 1000)
}
