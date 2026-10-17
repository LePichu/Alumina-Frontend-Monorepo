import { createSignal, Show } from "solid-js"
import type { JSX } from "solid-js"
import Close from "@carbon/icons/es/close/16"
import SearchIcon from "@carbon/icons/es/search/16"
import { Icon } from "../../icons/Icon"
import { createId } from "../../internal/control"
import {
	Field,
	FIELD_BARE,
	FIELD_BASE,
	FIELD_INNER,
	FIELD_READONLY,
	FIELD_SIZE,
	useFluid,
} from "../../internal/field"
import type { FieldSize } from "../../internal/field"

export type SearchProps = {
	id?: string
	labelText?: JSX.Element
	/** Carbon hides the label by default on Search; the placeholder carries it. */
	hideLabel?: boolean
	placeholder?: string
	size?: FieldSize
	value?: string
	disabled?: boolean
	closeButtonLabelText?: string
	/** Drops the field's ground and rule so the input *is* the surface of whatever
	 *  contains it. quarry's nav: the bordered bar already reads as the field, and
	 *  a recess inside it is a well inside a well. */
	bare?: boolean
	/** The shortcut that focuses this search, shown dimmed at the trailing edge —
	 *  quarry's `/`. Hidden once there is something to clear, since the clear
	 *  control takes that corner. */
	shortcut?: string
	class?: string
	onInput?: (value: string) => void
	onClear?: () => void
	onFocus?: () => void
}

export function Search(props: SearchProps) {
	const [value, setValue] = createSignal(props.value ?? "")
	let input: HTMLInputElement | undefined

	const id = createId("search", () => props.id)
	const size = () => props.size ?? "md"
	const fluid = useFluid()

	const clear = () => {
		setValue("")
		props.onClear?.()
		props.onInput?.("")
		input?.focus()
	}

	// The glyph and the clear control are laid over the input's own padding, so
	// the whole width is one thing to click into. In a fluid cell the cell
	// supplies the side padding and the glyph sits flush with the label above it.
	const surface = () => {
		if (fluid) return `${FIELD_INNER} w-full py-0 pl-6 pr-8`
		return `${props.bare ? FIELD_BARE : `${FIELD_BASE} ${FIELD_READONLY}`} ${
			FIELD_SIZE[size()]
		} pl-8 pr-8`
	}

	return (
		// Carbon hides the label on Search and lets the placeholder carry it. A
		// fluid cell has a place for the label, so there it shows.
		<Field
			id={id()}
			labelText={props.labelText}
			hideLabel={props.hideLabel ?? !fluid}
			class={props.class}
		>
			<div class="relative">
				<span
					class={`pointer-events-none absolute inset-y-0 flex items-center ${
						fluid ? "left-0" : "left-2"
					}`}
				>
					<Icon glyph={SearchIcon} size={16} />
				</span>
				<input
					ref={input}
					id={id()}
					type="search"
					role="searchbox"
					placeholder={props.placeholder}
					disabled={props.disabled}
					value={value()}
					onFocus={() => props.onFocus?.()}
					onInput={(event) => {
						setValue(event.currentTarget.value)
						props.onInput?.(event.currentTarget.value)
					}}
					class={`${surface()} [&::-webkit-search-cancel-button]:appearance-none`}
				/>
				<Show
					when={value().length > 0}
					fallback={
						<Show when={props.shortcut}>
							<span
								aria-hidden="true"
								class="pointer-events-none absolute inset-y-0 right-2 flex items-center text-micro
									uppercase opacity-muted"
							>
								{props.shortcut}
							</span>
						</Show>
					}
				>
					<button
						type="button"
						onClick={clear}
						aria-label={props.closeButtonLabelText ?? "Clear search"}
						class="absolute inset-y-0 right-0 flex cursor-pointer items-center border-0 bg-transparent
							px-2 text-ink hover:bg-gray pointer-coarse:min-w-touch"
					>
						<Icon glyph={Close} size={16} />
					</button>
				</Show>
			</div>
		</Field>
	)
}
