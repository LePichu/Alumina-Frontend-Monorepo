import bash from "@shikijs/langs/bash"
import css from "@shikijs/langs/css"
import csv from "@shikijs/langs/csv"
import html from "@shikijs/langs/html"
import javascript from "@shikijs/langs/javascript"
import json from "@shikijs/langs/json"
import markdown from "@shikijs/langs/markdown"
import python from "@shikijs/langs/python"
import rust from "@shikijs/langs/rust"
import scheme from "@shikijs/langs/scheme"
import toml from "@shikijs/langs/toml"
import tsx from "@shikijs/langs/tsx"
import typescript from "@shikijs/langs/typescript"
import xml from "@shikijs/langs/xml"
import yaml from "@shikijs/langs/yaml"
import githubLight from "@shikijs/themes/github-light"
import { createHighlighterCore } from "shiki/core"
import { createJavaScriptRegexEngine } from "shiki/engine/javascript"

/** Shiki on github-light, over pure white.
 *
 *  This is the one place colour is allowed anywhere in the system. github-light
 *  was settled in quarry's review; do not swap it for another theme.
 *
 *  Deliberately the fine-grained bundle (shiki/core plus named grammars) rather
 *  than shiki's root entry. The root entry reaches its whole registry — 361
 *  grammars, which built out to 11 MB across 309 chunks. This pulls fifteen.
 *
 *  csv, markdown and scheme are here for quarry's publish preview, whose four
 *  files are exactly IPC-2581 XML, a KiCad board (an s-expression, so scheme), a
 *  bill of materials and a README. The prototype hand-wrote a tokeniser for those
 *  three; that only existed so a single offline file could highlight anything, and
 *  CLAUDE.md says not to port it.
 *
 *  The JavaScript regex engine is used instead of Oniguruma so no WASM ships;
 *  `forgiving` lets it skip the rare pattern it cannot compile rather than throw.
 *
 *  CodeSnippet imports this module dynamically, so none of it is in the entry
 *  chunk — an app pays for the highlighter only once it renders code.
 */
const CODE_THEME = "github-light"

const CODE_LANGS = [
	"bash",
	"csv",
	"css",
	"html",
	"javascript",
	"json",
	"markdown",
	"python",
	"rust",
	"scheme",
	"toml",
	"tsx",
	"typescript",
	"xml",
	"yaml",
] as const

/** "text" is not a grammar — it skips Shiki entirely and is escaped by hand. */
export type CodeLang = (typeof CODE_LANGS)[number] | "text"

let instance: ReturnType<typeof createHighlighterCore> | undefined

function highlighter() {
	instance ??= createHighlighterCore({
		themes: [githubLight],
		langs: [
			bash,
			csv,
			css,
			html,
			javascript,
			json,
			markdown,
			python,
			rust,
			scheme,
			toml,
			tsx,
			typescript,
			xml,
			yaml,
		],
		engine: createJavaScriptRegexEngine({ forgiving: true }),
	})
	return instance
}

const ESCAPES: Record<string, string> = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	'"': "&quot;",
}

function escapeHtml(value: string) {
	return value.replace(/[&<>"]/g, (char) => ESCAPES[char] ?? char)
}

/** One entry per line, each a fragment of trusted markup produced from `code`. */
export async function highlightLines(code: string, lang: CodeLang): Promise<string[]> {
	const source = code.replace(/\n$/, "")

	if (lang === "text") return source.split("\n").map(escapeHtml)

	const shiki = await highlighter()
	// structure "inline" emits only the token spans, with no <pre>/<code> wrapper
	// — which is what lets the lines be laid out beside a line-number gutter.
	// "classic" would hand back a <pre> owning its own scrolling, and this system
	// has no visible scrollbars.
	const html = shiki.codeToHtml(source, { lang, theme: CODE_THEME, structure: "inline" })
	// It separates lines with <br>, NOT with newlines. Splitting on "\n" returns
	// the whole snippet as a single entry, which is why the gutter only ever
	// numbered line 1.
	return html.split(/<br\s*\/?>/)
}
