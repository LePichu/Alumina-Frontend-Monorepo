// Writes the app's HTML shell to dist/client/index.html, for the desktop build.
//
// The slicer is client-rendered (`ssr: false`), but SolidStart still serves its
// HTML shell — the document with the script and style tags — from a server
// entry, so `vite build` leaves no index.html behind. A desktop window has no
// server to ask: Tauri loads files. So, once the build is done, this asks the
// built server entry for "/" a single time and writes what it answers next to
// the client assets it names. Every route after that is the client router's.
import { writeFile } from "node:fs/promises"

const { default: handler } = await import("./dist/server/entry-server.js")
const response = await handler.fetch(new Request("http://localhost/"))
if (!response.ok) throw new Error(`write-shell: the shell answered ${response.status}`)

const out = new URL("./dist/client/index.html", import.meta.url)
await writeFile(out, await response.text())
console.log(`write-shell: ${out.pathname}`)
