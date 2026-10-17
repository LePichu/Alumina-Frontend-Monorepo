import { createMemo, createResource, For, Show } from "solid-js"
import { Scroller } from "../../internal/scroll"
import { BOX } from "../../internal/styles"
import { CopyButton } from "../CopyButton/CopyButton"
import type { CodeLang } from "./highlight"

// A caller names the language, so the type is part of this component's API.
export type { CodeLang }

export type CodeSnippetType = "single" | "multi" | "inline"

export type CodeSnippetProps = {
	type?: CodeSnippetType
	code: string
	/** Grammar to highlight with. "text" skips highlighting. */
	lang?: CodeLang
	/** Carbon's feedback text, shown briefly after a copy. */
	feedback?: string
	copyButtonDescription?: string
	hideCopyButton?: boolean
	wrapText?: boolean
	class?: string
}

/** Highlighted by Shiki on github-light, with line numbers in a ruled gutter and
 *  no scrollbars. Falls back to the plain, escaped source until the grammar has
 *  loaded, so the snippet is readable on first paint either way. */
export function CodeSnippet(props: CodeSnippetProps) {
	const type = (): CodeSnippetType => props.type ?? "multi"
	const lang = (): CodeLang => props.lang ?? "text"
	const plain = createMemo(() => props.code.replace(/\n$/, "").split("\n"))

	// Imported dynamically so Shiki and its grammars form their own chunk and stay
	// out of the entry bundle: an app pays for the highlighter only when it first
	// renders code.
	const [highlighted] = createResource(
		() => ({ code: props.code, lang: lang() }),
		async ({ code, lang: language }) => {
			const { highlightLines } = await import("./highlight")
			return highlightLines(code, language)
		},
	)

	// Shiki's markup is generated from props.code by a tokeniser, not accepted from
	// outside, so there is no untrusted HTML in play here.
	const lines = () => highlighted() ?? plain()

	if (type() === "inline") {
		return (
			<code
				class={`${BOX} px-tight font-mono text-body ${props.class ?? ""}`}
			>
				{props.code}
			</code>
		)
	}

	const copyControl = (
		<CopyButton
			text={props.code}
			feedback={props.feedback}
			iconDescription={props.copyButtonDescription}
			align="left"
		/>
	)

	// A single line is one row, so the copy control belongs on that row's centre
	// line rather than pinned to a corner it shares with nothing.
	if (type() === "single") {
		return (
			<div
				class={`flex items-center gap-2 ${BOX} pl-2 ${props.class ?? ""}`}
			>
				<Scroller axis="x" class="flex-1" paneClass="py-snug">
					<pre class="m-0 font-mono text-body">
						<code innerHTML={lines()[0] ?? ""} />
					</pre>
				</Scroller>
				<Show when={!props.hideCopyButton}>
					<span class="shrink-0 self-center">{copyControl}</span>
				</Show>
			</div>
		)
	}

	return (
		<div class={`relative ${BOX} ${props.class ?? ""}`}>
			<Show when={!props.hideCopyButton}>
				<div class="absolute right-0 top-0 z-10">{copyControl}</div>
			</Show>

			<Scroller axis="x" paneClass="flex">
				{/* Gutter, ruled off from the code by one ink line. */}
				<div
					aria-hidden="true"
					class="shrink-0 select-none border-r-2 border-ink px-2 py-2 text-right font-mono
						text-body tabular-nums opacity-muted"
				>
					<For each={lines()}>{(_, index) => <div>{index() + 1}</div>}</For>
				</div>
				<pre
					class={`m-0 min-w-0 flex-1 py-2 pl-2 pr-8 font-mono text-body
						${props.wrapText ? "whitespace-pre-wrap break-words" : "whitespace-pre"}`}
				>
					<code>
						<For each={lines()}>
							{(line) => <div innerHTML={line === "" ? "&nbsp;" : line} />}
						</For>
					</code>
				</pre>
			</Scroller>
		</div>
	)
}
