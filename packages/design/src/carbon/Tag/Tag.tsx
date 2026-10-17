import { Show } from "solid-js"
import type { JSX } from "solid-js"
import Close from "@carbon/icons/es/close/16"
import type { CarbonGlyph } from "../../icons/glyph"
import { Icon } from "../../icons/Icon"
import { createControllable } from "../../internal/control"
import { LABEL } from "../../internal/styles"

export type TagSize = "sm" | "md" | "lg"

export type TagProps = {
	size?: TagSize
	/** Ink ground, white text — the prototypes' `.chip.solid`. Use it when the tag
	 *  states something about the thing it sits on ("Public"); leave it off when
	 *  the tag is one of a list the eye should skim, such as topics. */
	solid?: boolean
	/** A grey ground instead of white, for a tag on a white tile that would
	 *  otherwise read as an empty outline. */
	muted?: boolean
	/** Carbon's filter tag: adds a close control. */
	filter?: boolean
	disabled?: boolean
	renderIcon?: CarbonGlyph
	onClose?: () => void
	class?: string
	children?: JSX.Element
}

/** Carbon's `type` prop is dropped: it exists only to pick a colour. A tag is ink
 *  on white, ink on grey, or white on ink — three values, no hue. */
const SIZE: Record<TagSize, string> = {
	sm: "px-tight py-0",
	md: "px-snug py-tight",
	lg: "px-2 py-snug",
}

export function Tag(props: TagProps) {
	const size = (): TagSize => props.size ?? "md"

	return (
		<span
			class={`inline-flex items-center gap-tight border-2 border-ink ${LABEL}
        ${
				props.solid
					? "on-ink bg-ink text-white"
					: `${props.muted ? "bg-field" : "bg-white"} text-ink`
			}
        ${SIZE[size()]} ${props.disabled ? "opacity-40" : ""} ${props.class ?? ""}`}
		>
			<Show when={props.renderIcon}>{(glyph) => <Icon glyph={glyph()} size={16} />}</Show>
			{props.children}
			<Show when={props.filter}>
				<button
					type="button"
					disabled={props.disabled}
					onClick={() => props.onClose?.()}
					aria-label="Clear filter"
					class={`-mr-tight flex cursor-pointer items-center border-0 bg-transparent p-tight pointer-coarse:min-h-touch pointer-coarse:min-w-touch
            disabled:cursor-not-allowed ${
						props.solid ? "text-white hover:bg-white hover:text-ink" : "text-ink hover:bg-gray"
					}`}
				>
					<Icon glyph={Close} size={16} />
				</button>
			</Show>
		</span>
	)
}

export type DismissibleTagProps = Omit<TagProps, "filter" | "children"> & {
	text: JSX.Element
}

/** Carbon's DismissibleTag: a tag with a close control. The same thing as
 *  `Tag filter`, under the name Carbon now gives it. */
export function DismissibleTag(props: DismissibleTagProps) {
	return (
		<Tag
			filter
			size={props.size}
			solid={props.solid}
			muted={props.muted}
			disabled={props.disabled}
			renderIcon={props.renderIcon}
			onClose={props.onClose}
			class={props.class}
		>
			{props.text}
		</Tag>
	)
}

/** A tag that is itself a button. The box a Tag is in, plus what a button adds:
 *  a pointer, a hover ground and a real focus ring. */
function tagButton(size: TagSize, solid: boolean, extra?: string) {
	return `inline-flex cursor-pointer items-center gap-tight border-2 border-ink text-micro font-bold
		uppercase transition-colors
		disabled:cursor-not-allowed disabled:opacity-40 pointer-coarse:min-h-touch
		${solid ? "bg-ink text-white hover:bg-gray hover:text-ink" : "bg-white text-ink hover:bg-gray"}
		${SIZE[size]} ${extra ?? ""}`
}

export type OperationalTagProps = {
	text: JSX.Element
	size?: TagSize
	renderIcon?: CarbonGlyph
	disabled?: boolean
	class?: string
	onClick?: () => void
}

/** Carbon's OperationalTag: a tag you press to do something — open a view of
 *  everything it applies to, say. */
export function OperationalTag(props: OperationalTagProps) {
	return (
		<button
			type="button"
			disabled={props.disabled}
			onClick={() => props.onClick?.()}
			class={tagButton(props.size ?? "md", false, props.class)}
		>
			<Show when={props.renderIcon}>{(glyph) => <Icon glyph={glyph()} size={16} />}</Show>
			{props.text}
		</button>
	)
}

export type SelectableTagProps = {
	text: JSX.Element
	/** Controlled when given. */
	selected?: boolean
	defaultSelected?: boolean
	size?: TagSize
	renderIcon?: CarbonGlyph
	disabled?: boolean
	class?: string
	onChange?: (selected: boolean) => void
}

/** Carbon's SelectableTag: a tag that is on or off — a filter chip. On is the
 *  `solid` tag: ink ground, white text. */
export function SelectableTag(props: SelectableTagProps) {
	const [selected, setSelected] = createControllable(
		() => props.selected,
		props.defaultSelected ?? false,
		() => props.onChange,
	)

	return (
		<button
			type="button"
			aria-pressed={selected()}
			disabled={props.disabled}
			onClick={() => {
				const next = !selected()
				setSelected(next)
				props.onChange?.(next)
			}}
			class={tagButton(props.size ?? "md", selected(), props.class)}
		>
			<Show when={props.renderIcon}>{(glyph) => <Icon glyph={glyph()} size={16} />}</Show>
			{props.text}
		</button>
	)
}
