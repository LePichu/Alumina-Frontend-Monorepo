import { defineConfig } from "vite"
import { solidStart } from "@solidjs/start/config"
import tailwindcss from "@tailwindcss/vite"

// SolidStart 2 has no app.config.ts — framework options live here.
export default defineConfig({
	// See slicer/vite.config.ts for the port allocation.
	server: { port: 4400, strictPort: true },
	// See slicer/vite.config.ts for why devOverlay is off.
	plugins: [solidStart({ ssr: true, devOverlay: false }), tailwindcss()],
})
