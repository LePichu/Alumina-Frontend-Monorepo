import { createSignal, Match, Switch } from "solid-js"
import User from "@carbon/icons/es/user/16"
import UserLarge from "@carbon/icons/es/user/24"
import type { CarbonGlyph } from "../../icons/glyph"
import { Icon } from "../../icons/Icon"

export type AvatarSize = "sm" | "md" | "lg" | "xl"

export type AvatarProps = {
	/** Whose avatar this is. Supplies the initials when there is no image, or the
	 *  image fails to load. */
	name?: string
	/** The picture's URL. */
	image?: string
	/** Accessible name. Leave it off when the person's name is printed right
	 *  beside the avatar — which is nearly always — so it is not read twice. */
	imageDescription?: string
	size?: AvatarSize
	/** Replaces the default person glyph, for an account that is not a person: a
	 *  machine, an organisation. Pass the 16px descriptor. */
	renderIcon?: CarbonGlyph
	class?: string
}

/** The box, and the type an initial is set in at that size. */
const SIZE: Record<AvatarSize, string> = {
	sm: "size-6 text-micro",
	md: "size-8 text-label",
	lg: "size-12 text-figure",
	xl: "size-16 text-brand",
}

/** Up to two initials: the first letter of the first and last words. A handle
 *  with no spaces gives its first two characters instead, so `avthenticstemcel`
 *  is AV rather than a lone A. */
function initialsOf(name: string): string {
	const words = name.trim().split(/\s+/).filter(Boolean)
	const first = words[0]
	if (!first) return ""
	const last = words.length > 1 ? words[words.length - 1] : undefined
	return (last ? `${first.charAt(0)}${last.charAt(0)}` : first.slice(0, 2)).toUpperCase()
}

/** A person, as a square.
 *
 *  Named for what it is rather than ported: Carbon's core has no avatar. The
 *  props follow Carbon for IBM Products' `UserAvatar` (`name`, `image`,
 *  `imageDescription`, `size`, `renderIcon`) so its docs still read as the spec;
 *  its `backgroundColor` is dropped, since it only picks a hue.
 *
 *  kiln's rail and settings and quarry's nav had each drawn this as a bare
 *  `<img>` with a border — the last thing in the apps that was not a design
 *  system part. Square, because nothing here is round; 2px ink, like every other
 *  edge.
 *
 *  It falls back in order: the image, then initials on ink, then a glyph. A
 *  failed image load drops to the next one down rather than leaving the
 *  browser's broken-image mark in a bordered box.
 */
export function Avatar(props: AvatarProps) {
	const [failed, setFailed] = createSignal(false)
	const size = (): AvatarSize => props.size ?? "md"
	const initials = () => initialsOf(props.name ?? "")
	const large = () => size() === "lg" || size() === "xl"

	return (
		<span
			role={props.imageDescription ? "img" : undefined}
			aria-label={props.imageDescription}
			aria-hidden={props.imageDescription ? undefined : "true"}
			class={`flex shrink-0 items-center justify-center overflow-hidden border-2 border-ink
				font-bold uppercase leading-none tracking-normal ${SIZE[size()]} ${props.class ?? ""}`}
		>
			<Switch
				fallback={
					<span class="flex size-full items-center justify-center bg-white text-ink">
						<Icon glyph={props.renderIcon ?? (large() ? UserLarge : User)} />
					</span>
				}
			>
				<Match when={props.image && !failed()}>
					<img
						src={props.image}
						alt=""
						onError={() => setFailed(true)}
						class="block size-full object-cover"
					/>
				</Match>
				<Match when={!props.renderIcon && initials()}>
					<span class="on-ink flex size-full items-center justify-center bg-ink text-white">
						{initials()}
					</span>
				</Match>
			</Switch>
		</span>
	)
}
