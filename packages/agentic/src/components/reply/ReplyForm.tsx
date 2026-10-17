import { createStore } from "solid-js/store"
import { For, Match, Show, Switch as Branch } from "solid-js"
import CheckmarkFilled from "@carbon/icons/es/checkmark--filled/16"
import {
	Button,
	Checkbox,
	ContentSwitcher,
	FormGroup,
	Icon,
	RadioButton,
	RadioButtonGroup,
	Select,
	SelectItem,
	Slider,
	Switch,
	TextArea,
	TextInput,
} from "@alumina/design"
import { describeAnswers } from "../../lib/agent"
import type { FormField, FormSubmission, ReplyForm as ReplyFormSpec } from "../../lib/agent"

export type ReplyFormProps = {
	form: ReplyFormSpec
	/** Fired with the collected answers, the prompt they amount to, and what to
	 *  run next. */
	onSubmit?: (submission: FormSubmission) => void
	/** Already answered — rendered as a record when a thread is replayed. */
	answers?: Record<string, string | number | boolean>
}

type Answers = Record<string, string | number | boolean>

function seed(fields: FormField[]): Answers {
	const initial: Answers = {}
	for (const field of fields) {
		if (field.kind === "checks") {
			for (const option of field.options) initial[option.key] = option.checked
		} else {
			initial[field.key] = field.value
		}
	}
	return initial
}

/** The agent's questions, rendered as real controls.
 *
 *  Every field type maps onto a design system component: radio groups carry a
 *  sub-description per option, checkboxes carry trade-off notes, and the slider is
 *  the tick-marked one with a live readout. A store holds the answers so the whole
 *  form is one reactive object rather than a signal per field.
 *
 *  An answered form is `inert` rather than a form of disabled controls. Disabling
 *  each one dims it to 40%, and a whole pane of 40% controls is unreadable — the
 *  prototype settles the same question by dimming the body to 62% and leaving the
 *  controls alone. `inert` gives that: the subtree leaves the tab order and stops
 *  taking pointer events, in one attribute, without touching how anything looks.
 */
export function ReplyForm(props: ReplyFormProps) {
	const [answers, setAnswers] = createStore<Answers>(
		props.answers ? { ...props.answers } : seed(props.form.fields),
	)
	const answered = () => props.answers !== undefined

	const set = (key: string, value: string | number | boolean) => setAnswers(key, value)

	const submit = () =>
		props.onSubmit?.({
			answers: { ...answers },
			said: describeAnswers(props.form, answers),
			next: props.form.next,
		})

	return (
		<form class="m-0" onSubmit={(event) => event.preventDefault()}>
			{
				/* The title is the section header above this; repeating it here is how the
			    form ended up announcing itself twice. */
			}
			<div
				inert={answered()}
				// Fields wrap by the room they have rather than at a breakpoint: the
				// chat tile is as narrow as a phone or as wide as a monitor, and a
				// field needs 14rem (56 spacing units) either way.
				class={`flex flex-wrap items-start gap-x-6 gap-y-2 px-2 py-2 ${
					answered() ? "opacity-60" : ""
				}`}
			>
				<For each={props.form.fields}>
					{(field) => (
						<div
							class={field.kind === "textarea" && field.wide ? "basis-full" : "min-w-56 flex-1"}
						>
							<Branch>
								<Match when={field.kind === "radio" ? field : undefined}>
									{(radio) => (
										<RadioButtonGroup
											legendText={radio().label}
											helperText={radio().help}
											valueSelected={String(answers[radio().key] ?? radio().value)}
											onChange={(value) => set(radio().key, value)}
										>
											<For each={radio().options}>
												{(option) => (
													<RadioButton
														value={option.value}
														labelText={option.value}
														helperText={option.description}
													/>
												)}
											</For>
										</RadioButtonGroup>
									)}
								</Match>

								<Match when={field.kind === "options" ? field : undefined}>
									{(opts) => (
										<FormGroup legendText={opts().label}>
											<ContentSwitcher
												size="sm"
												selectedIndex={Math.max(
													0,
													opts().options.indexOf(String(answers[opts().key] ?? opts().value)),
												)}
												onChange={(index) => set(opts().key, opts().options[index] ?? "")}
											>
												<For each={opts().options}>{(option) => <Switch text={option} />}</For>
											</ContentSwitcher>
										</FormGroup>
									)}
								</Match>

								<Match when={field.kind === "select" ? field : undefined}>
									{(sel) => (
										<Select
											labelText={sel().label}
											value={String(answers[sel().key] ?? sel().value)}
											onChange={(value) => set(sel().key, value)}
										>
											<For each={sel().options}>
												{(option) => <SelectItem value={option} text={option} />}
											</For>
										</Select>
									)}
								</Match>

								<Match when={field.kind === "range" ? field : undefined}>
									{(range) => (
										<Slider
											labelText={range().label}
											min={range().min}
											max={range().max}
											step={range().step}
											ticks
											unit={range().unit}
											value={Number(answers[range().key] ?? range().value)}
											onChange={(value) => set(range().key, value)}
										/>
									)}
								</Match>

								<Match when={field.kind === "checks" ? field : undefined}>
									{(checks) => (
										<FormGroup legendText={checks().label}>
											<For each={checks().options}>
												{(option) => (
													<Checkbox
														labelText={option.label}
														helperText={option.tradeOff}
														checked={Boolean(answers[option.key] ?? option.checked)}
														onChange={(next) => set(option.key, next)}
													/>
												)}
											</For>
										</FormGroup>
									)}
								</Match>

								<Match when={field.kind === "text" ? field : undefined}>
									{(text) => (
										<TextInput
											labelText={text().label}
											placeholder={text().placeholder}
											value={String(answers[text().key] ?? text().value)}
											onInput={(event) => set(text().key, event.currentTarget.value)}
										/>
									)}
								</Match>

								<Match when={field.kind === "textarea" ? field : undefined}>
									{(area) => (
										<TextArea
											labelText={area().label}
											placeholder={area().placeholder}
											rows={area().rows ?? 2}
											value={String(answers[area().key] ?? area().value)}
											onInput={(event) => set(area().key, event.currentTarget.value)}
										/>
									)}
								</Match>
							</Branch>
						</div>
					)}
				</For>
			</div>

			<div class="flex items-center gap-tight border-t-2 border-ink px-2 py-snug">
				<Show
					when={!answered()}
					fallback={
						<span class="flex items-center gap-tight text-micro uppercase opacity-muted">
							<Icon glyph={CheckmarkFilled} size={16} />answered
						</span>
					}
				>
					{
						/* "You choose" is not a shortcut past the questions — it answers them
					    with the defaults the agent already proposed, which is what the
					    store holds until you touch anything. */
					}
					<Button kind="tertiary" size="sm" flat onClick={submit}>You choose</Button>
					<span class="ml-auto">
						<Button kind="primary" size="sm" flat onClick={submit}>{props.form.cta}</Button>
					</span>
				</Show>
			</div>
		</form>
	)
}
