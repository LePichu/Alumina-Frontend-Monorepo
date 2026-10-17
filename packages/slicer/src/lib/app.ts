import Layers from "@carbon/icons/es/layers/16"

/** What the slicer is called where people see it, and its mark.
 *
 *  The app is **foundry**. It drives **mica**, the engine that turns an IPC-2581
 *  file into a print (reached only through `./mica.ts`), and the two names are
 *  kept apart on purpose: the tools underneath are named for stones — mica,
 *  shale — and the apps people use for the factory — kiln, quarry, foundry.
 *  Until 2026-10-14 the app wore the engine's name.
 *
 *  Every place the name is shown reads it from here.
 */
export const APP_NAME = "foundry"

/** The name as a title says it — the window's, the taskbar's, a browser tab's:
 *  capitalised, as a proper name. The wordmark keeps the lowercase `APP_NAME`,
 *  as quarry's and kiln's do. */
export const APP_TITLE = "Foundry"

/** What it is, under its name. */
export const APP_KIND = "slicer"

export const APP_VERSION = "0.1"

/** Carbon's `layers`: a print is a stack of them, and slicing is cutting a board
 *  into them. The title bar wears it; the desktop icon is drawn on its own, in
 *  `packages/desktop/src-tauri/icons`. */
export const APP_GLYPH = Layers
