import type { ChartTable } from "./frame"

/** Getting a chart out of the page: its data as CSV, its picture as PNG.
 *
 *  Both are browser work — a Blob and a temporary link — and neither runs until
 *  someone asks, so none of this is on the server's path.
 */

/** One CSV field. Quoted when it has to be: a comma, a quote or a line break
 *  inside it would otherwise be read as structure. */
function field(value: string | number): string {
	const text = String(value)
	return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/** RFC 4180: comma-separated, CRLF line ends. Numbers go out unformatted — a
 *  spreadsheet should get `12500`, not `12.5k`. */
export function toCsv(table: ChartTable): string {
	return [table.headers, ...table.rows].map((row) => row.map(field).join(",")).join("\r\n")
}

/** A name for the file: the chart's title, made safe, or a plain fallback. */
export function fileName(title: string | undefined, extension: string): string {
	const base = (title ?? "chart").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
	return `${base || "chart"}.${extension}`
}

/** Hands a Blob to the browser as a download. */
export function save(blob: Blob, name: string) {
	const url = URL.createObjectURL(blob)
	const link = document.createElement("a")
	link.href = url
	link.download = name
	document.body.append(link)
	link.click()
	link.remove()
	// Revoked on the next tick: revoking before the click has been acted on
	// cancels the download in some browsers.
	setTimeout(() => URL.revokeObjectURL(url), 0)
}

/** The presentation an SVG node needs to carry with it once it has left the
 *  page. A chart is styled by utility classes, and a serialised SVG has no
 *  stylesheet — so what the classes resolved to is written onto each node. */
const CARRIED = [
	"fill",
	"fill-opacity",
	"stroke",
	"stroke-width",
	"stroke-dasharray",
	"stroke-linecap",
	"stroke-linejoin",
	"opacity",
	"font-family",
	"font-size",
	"font-weight",
	"letter-spacing",
	"text-anchor",
	"dominant-baseline",
	"text-transform",
] as const

function inline(source: Element, copy: Element) {
	const computed = getComputedStyle(source)
	const style = CARRIED.map((property) => `${property}:${computed.getPropertyValue(property)}`)
	copy.setAttribute("style", style.join(";"))
	// Classes mean nothing outside the page, and focus/ARIA state is not a
	// picture's business.
	copy.removeAttribute("class")
	const sources = source.children
	const copies = copy.children
	for (let index = 0; index < sources.length; index++) {
		const from = sources[index]
		const to = copies[index]
		if (from && to) inline(from, to)
	}
}

/** The page's own font, as a data URI the exported image can embed. An SVG
 *  drawn into a canvas may not fetch anything, so without this the picture
 *  falls back to the platform's monospace and every measured label is a little
 *  off. Returns nothing if the stylesheet cannot be read — the export then goes
 *  ahead in the fallback face rather than failing. */
async function embeddedFonts(family: string): Promise<string> {
	const rules: string[] = []
	for (const sheet of Array.from(document.styleSheets)) {
		let list: CSSRuleList
		try {
			list = sheet.cssRules
		} catch {
			continue
		}
		for (const rule of Array.from(list)) {
			if (!(rule instanceof CSSFontFaceRule)) continue
			if (!rule.style.getPropertyValue("font-family").includes(family)) continue
			const url = /url\(["']?([^"')]+)["']?\)/.exec(rule.style.getPropertyValue("src"))?.[1]
			if (!url) continue
			try {
				const response = await fetch(new URL(url, sheet.href ?? location.href))
				const bytes = new Uint8Array(await response.arrayBuffer())
				let binary = ""
				for (const byte of bytes) binary += String.fromCharCode(byte)
				rules.push(
					`@font-face{font-family:"${family}";font-weight:${
						rule.style.getPropertyValue("font-weight") || "400"
					};src:url(data:font/woff2;base64,${btoa(binary)}) format("woff2")}`,
				)
			} catch {
				// One weight missing is not worth abandoning the export for.
			}
		}
	}
	return rules.join("")
}

/** Renders a chart's SVG to a PNG, on white, at twice its size on screen. */
export async function toPng(svg: SVGSVGElement): Promise<Blob | null> {
	const box = svg.getBoundingClientRect()
	const width = Math.max(1, Math.round(box.width))
	const height = Math.max(1, Math.round(box.height))

	const copy = svg.cloneNode(true) as SVGSVGElement
	inline(svg, copy)
	copy.setAttribute("xmlns", "http://www.w3.org/2000/svg")
	copy.setAttribute("width", String(width))
	copy.setAttribute("height", String(height))

	const fonts = await embeddedFonts("IBM Plex Mono")
	if (fonts) {
		const style = document.createElementNS("http://www.w3.org/2000/svg", "style")
		style.textContent = fonts
		copy.prepend(style)
	}

	const source = new XMLSerializer().serializeToString(copy)
	const url = URL.createObjectURL(new Blob([source], { type: "image/svg+xml;charset=utf-8" }))

	try {
		const image = new Image()
		image.decoding = "sync"
		await new Promise<void>((resolve, reject) => {
			image.onload = () => resolve()
			image.onerror = () => reject(new Error("The chart could not be drawn to an image."))
			image.src = url
		})

		const scale = 2
		const canvas = document.createElement("canvas")
		canvas.width = width * scale
		canvas.height = height * scale
		const context = canvas.getContext("2d")
		if (!context) return null
		// White first: the SVG's own ground is transparent, and a PNG with a clear
		// ground is black in half the places it gets pasted.
		context.fillStyle = "#fff"
		context.fillRect(0, 0, canvas.width, canvas.height)
		context.drawImage(image, 0, 0, canvas.width, canvas.height)
		return await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"))
	} finally {
		URL.revokeObjectURL(url)
	}
}
