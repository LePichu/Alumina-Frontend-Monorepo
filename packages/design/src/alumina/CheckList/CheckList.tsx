import { children, Show } from "solid-js"
import type { JSX } from "solid-js"
import type { CarbonGlyph } from "../../icons/glyph"
import { STATUS_GLYPH } from "../../internal/severity"
import { ContainedList, ContainedListItem } from "../../carbon/ContainedList/ContainedList"
import type { ContainedListSize } from "../../carbon/ContainedList/ContainedList"

/** How a check came out. The three apps each declared this union themselves;
 *  theirs are structurally the same, so any of them passes straight in.
 *  `note` is neither a pass nor a problem: something worth knowing, as mica
 *  reports that vias run through the whole stack. */
export type Severity = "ok" | "note" | "warning" | "error"

/** Severity is an icon, a word and weight — never a colour. The glyphs are the
 *  system's status glyphs; the words are a check's own. */
const SEVERITY: Record<Severity, { glyph: CarbonGlyph; verdict: string }> = {
	ok: { glyph: STATUS_GLYPH.success, verdict: "pass" },
	note: { glyph: STATUS_GLYPH.info, verdict: "note" },
	warning: { glyph: STATUS_GLYPH.warning, verdict: "warn" },
	error: { glyph: STATUS_GLYPH.error, verdict: "fail" },
}

export type CheckListProps = {
	label?: JSX.Element
	size?: ContainedListSize
	class?: string
	children?: JSX.Element
}

/** A list of things that were checked and how each came out.
 *
 *  mica shows design rules this way, quarry shows a board's validation and its
 *  publish build log, kiln shows the checks in an agent reply — three apps, three
 *  hand-built copies that had drifted on icon, spacing and wording. It is a
 *  ContainedList whose rows lead with a severity glyph.
 */
export function CheckList(props: CheckListProps) {
	return (
		<ContainedList label={props.label} size={props.size} class={props.class}>
			{props.children}
		</ContainedList>
	)
}

export type CheckListItemProps = {
	severity: Severity
	/** A second, dimmed line: the measurement, the instance count, the command. */
	detail?: JSX.Element
	/** Spells the outcome out at the trailing edge — "pass", "warn", "fail". Bold
	 *  for anything that is not a pass, so the rows to read are the heavy ones. */
	verdict?: boolean
	class?: string
	children?: JSX.Element
}

export function CheckListItem(props: CheckListItemProps) {
	const detail = children(() => props.detail)

	return (
		<ContainedListItem
			renderIcon={SEVERITY[props.severity].glyph}
			iconLabel={SEVERITY[props.severity].verdict}
			class={props.class}
			action={
				<Show when={props.verdict}>
					<span
						class={`text-micro uppercase ${
							props.severity === "ok" || props.severity === "note" ? "opacity-muted" : "font-bold"
						}`}
					>
						{SEVERITY[props.severity].verdict}
					</span>
				</Show>
			}
		>
			<span class="block">{props.children}</span>
			<Show when={detail()}>
				<span class="block text-small opacity-muted">{detail()}</span>
			</Show>
		</ContainedListItem>
	)
}

/** How many checks are a problem — the count a panel puts in its header. A
 *  note is not one. */
export function openChecks(checks: readonly { severity: Severity }[]): number {
	return checks.filter((check) => check.severity === "warning" || check.severity === "error")
		.length
}
