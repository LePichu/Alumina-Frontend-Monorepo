/** The shape @carbon/icons ships. The package has no type declarations of its
 *  own, so these are ours; see carbon-icons.d.ts for the module declaration. */

export type GlyphAttrs = Readonly<Record<string, string | number>>

export type CarbonGlyphNode = {
	readonly elem: string
	readonly attrs?: GlyphAttrs
	readonly content?: readonly CarbonGlyphNode[]
}

/** A descriptor module's default export, e.g. `@carbon/icons/es/add/16`. */
export type CarbonGlyph = CarbonGlyphNode & {
	readonly name: string
	/** A pixel size for the icons that ship at four of them, or `"glyph"` for the
	 *  handful Carbon draws once, at 16 — the status shapes among them. */
	readonly size: number | "glyph"
}

/** Carbon ships every icon at exactly these four sizes. */
export type IconSize = 16 | 20 | 24 | 32
