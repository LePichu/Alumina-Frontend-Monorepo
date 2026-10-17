import { Show } from "solid-js"
import Hourglass from "@carbon/icons/es/hourglass/16"
import { Icon } from "@alumina/design"
import type { FormAnswers, FormSubmission, ModelId, ReplySection } from "../../lib/agent"
import { ReplyTile } from "./ReplyTile"

export type AgentTurnProps = {
	model: ModelId
	/** Status line shown above the tile while the reply is being worked out. */
	thinking: string
	sections: ReplySection[]
	streaming?: boolean
	answers?: FormAnswers
	onSubmitForm?: (submission: FormSubmission) => void
}

/** One agent turn: the thinking line, then the reply tile.
 *
 *  The thinking line sits outside the tile rather than inside its header, which is
 *  where the prototype puts it. It is the agent talking about itself, not part of
 *  the reply — so it stays above, and dims once the reply has landed instead of
 *  disappearing and shifting everything up. */
export function AgentTurn(props: AgentTurnProps) {
	return (
		<div class="flex flex-col gap-2">
			<p
				class="m-0 flex items-center gap-2 text-micro uppercase tracking-micro"
				classList={{ "opacity-60": !props.streaming }}
			>
				<Icon glyph={Hourglass} size={16} />
				<span>{props.thinking}</span>
				<Show when={props.streaming}>
					<span aria-hidden="true" class="inline-block h-4 w-2 animate-blink bg-ink" />
				</Show>
			</p>
			<ReplyTile
				model={props.model}
				sections={props.sections}
				streaming={props.streaming}
				answers={props.answers}
				onSubmitForm={props.onSubmitForm}
			/>
		</div>
	)
}
