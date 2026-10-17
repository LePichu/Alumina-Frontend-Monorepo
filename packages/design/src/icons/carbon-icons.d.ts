/** @carbon/icons ships no declarations (0 .d.ts files in the tarball), so deep
 *  imports of descriptor modules are typed here. Matches `@carbon/icons/es/add/16`,
 *  `@carbon/icons/es/watson-health/3D-Cursor/32`, and so on. */
declare module "@carbon/icons/es/*" {
	const glyph: import("./glyph").CarbonGlyph
	export default glyph
}
