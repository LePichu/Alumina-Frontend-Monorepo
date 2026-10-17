import { For, Show } from "solid-js"
import ArrowRight from "@carbon/icons/es/arrow--right/16"
import FolderOpen from "@carbon/icons/es/folder--open/16"
import {
	ContentSwitcher,
	IconButton,
	Select,
	SelectItem,
	Switch,
	TextArea,
	Tile,
} from "@alumina/design"
import { MODELS, MODES } from "../lib/agent"
import type { Mode, ModelId } from "../lib/agent"

/** Sentence case for the mode tabs — Carbon's ContentSwitcher uppercases them
 *  itself, so these are written the way they read. */
const MODE_LABELS: Record<Mode, string> = {
	design: "Design",
	review: "Review",
	fab: "Fab",
}

export type ComposerProps = {
	value: string
	placeholder: string
	mode: Mode
	model: ModelId
	/** Docked under the chat rather than standing on the home screen: drops the
	 *  box's own border and shadow, since the chat tile already has both. */
	docked?: boolean
	onInput: (value: string) => void
	onModeChange: (mode: Mode) => void
	onModelChange: (model: ModelId) => void
	onSubmit: () => void
}

/** The prompt box: a textarea that grows, over a bar of everything that changes
 *  what the prompt means.
 *
 *  The textarea is `bare` — the box around it is the field, and a rule inside a
 *  box reads as two edges. Standing on the home screen that box is a Tile; docked
 *  under a chat, the chat's own tile is already it.
 */
export function Composer(props: ComposerProps) {
	const submit = () => {
		if (props.value.trim() !== "") props.onSubmit()
	}

	const form = () => (
		<form
			class="bg-white"
			onSubmit={(event) => {
				event.preventDefault()
				submit()
			}}
		>
			<TextArea
				labelText="Prompt"
				hideLabel
				bare
				autoResize
				// Three lines at rest, which is the prototype's 3.4rem floor once the
				// type scale is even. It grows from there and stops at eight.
				rows={3}
				maxRows={8}
				class={props.docked ? "px-tight pb-tight pt-snug" : "px-2 pb-tight pt-2"}
				placeholder={props.placeholder}
				value={props.value}
				onInput={(event) => props.onInput(event.currentTarget.value)}
				onKeyDown={(event: KeyboardEvent) => {
					// Enter sends, shift+Enter breaks the line. The prototype's rule, and
					// the one every chat composer has trained people to expect.
					if (event.key === "Enter" && !event.shiftKey) {
						event.preventDefault()
						submit()
					}
				}}
			/>

			{
				/* One row from `sm` up. Below it the bar is two: the mode switcher takes
			    the first beside the attach control, and the model and the send button
			    take the second. A grid rather than a wrapping flex row, so which
			    control lands on which line is stated and not left to arithmetic. */
			}
			<div
				class={`grid grid-cols-[auto_minmax(0,1fr)_auto] gap-tight border-t-2 border-ink
					sm:flex sm:items-stretch ${props.docked ? "px-0 pb-0 pt-snug" : "p-snug"}`}
			>
				<IconButton
					label="Attach reference"
					renderIcon={FolderOpen}
					kind="tertiary"
					align="top"
				/>

				{
					/* 62 spacing units is 15.5rem — the prototype's width, and an even
				    number in Tailwind's 4px scale where an arbitrary rem would be
				    fractional. */
				}
				<ContentSwitcher
					size="sm"
					class="col-span-2 sm:w-62"
					selectedIndex={MODES.indexOf(props.mode)}
					onChange={(index) => props.onModeChange(MODES[index] ?? "design")}
				>
					<For each={MODES}>
						{(mode) => <Switch text={MODE_LABELS[mode]} class="flex-1" />}
					</For>
				</ContentSwitcher>

				<span class="hidden flex-1 sm:block" />

				<Select
					labelText="Model"
					hideLabel
					size="sm"
					class="col-span-2 sm:w-38"
					value={props.model}
					onChange={(value) => props.onModelChange(value as ModelId)}
				>
					<For each={MODELS}>{(model) => <SelectItem value={model} text={model} />}</For>
				</Select>

				<IconButton
					label="Run"
					renderIcon={ArrowRight}
					kind="primary"
					align="top"
					flat
					onClick={submit}
				/>
			</div>
		</form>
	)

	return (
		<Show when={!props.docked} fallback={<div class="mx-auto w-full max-w-184">{form()}</div>}>
			<Tile flush class="mx-auto w-full max-w-184">{form()}</Tile>
		</Show>
	)
}
