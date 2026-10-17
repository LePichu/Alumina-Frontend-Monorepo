import { defineConfig, loadEnv } from "vite"
import { solidStart } from "@solidjs/start/config"
import tailwindcss from "@tailwindcss/vite"

// SolidStart 2 has no app.config.ts — framework options live here.
export default defineConfig(({ mode }) => {
	/** Where `mica serve` listens: its own default, unless MICA_URL says otherwise
	 *  (in the environment, or a .env file beside this one). */
	const MICA = loadEnv(mode, ".", "MICA_")["MICA_URL"] || "http://127.0.0.1:8781"

	return {
		server: {
			// Pinned so all four dev servers can run at once: 4200 design, 4300 slicer,
			// 4400 hub, 4500 agentic. strictPort makes a clash fail loudly rather than
			// silently landing on a neighbour's port.
			port: 4300,
			strictPort: true,
			// mica sends no CORS headers, so a page served from here cannot call it
			// directly. Through this proxy it is the same origin: the page asks for
			// /mica/v1/…, and the dev server asks mica. The desktop window under
			// `tauri dev` loads this server too, so it goes the same way.
			proxy: {
				"/mica": {
					target: MICA,
					changeOrigin: true,
					rewrite: (path) => path.replace(/^\/mica/, ""),
				},
			},
		},
		define: { "import.meta.env.MICA_PROXIED_TO": JSON.stringify(MICA) },
		// devOverlay is off because it does not load under Vite 8. SolidStart's error
		// viewer imports @jridgewell/trace-mapping, which imports @jridgewell/resolve-uri
		// — and that package lists "browser" ahead of "import" in its exports map,
		// pointing the browser condition at a UMD file with no default export. The
		// import throws while the app is still booting, so the overlay meant to report
		// errors is itself the error, and every page renders blank.
		plugins: [solidStart({ ssr: false, devOverlay: false }), tailwindcss()],
	}
})
