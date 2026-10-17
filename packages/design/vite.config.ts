import { defineConfig } from "vite"
import solid from "vite-plugin-solid"
import tailwindcss from "@tailwindcss/vite"

// Serves the playground. The library itself has no build step: apps consume
// src/ directly through the `solid` export condition.
export default defineConfig({
	plugins: [solid(), tailwindcss()],
	server: { port: 4200 },
})
