/// <reference types="vite/client" />

interface ImportMetaEnv {
	/** Where the dev server's /mica proxy sends requests (vite.config.ts). */
	readonly MICA_PROXIED_TO: string
}
