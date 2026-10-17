import { For, Show } from "solid-js"
import { SKELETON } from "../../internal/skeleton"
import { BOX } from "../../internal/styles"
import { SkeletonIcon, SkeletonText } from "./Skeleton"

/** Carbon's per-component skeletons: each component's shape, before its content.
 *
 *  Small on purpose. Every one is the `skeleton` block at the component's own
 *  size and in its own arrangement, so that when the data lands nothing on the
 *  page moves. They keep the real component's ink rules where it has them — a
 *  field's underline, a list's dividers — because the rules are the layout and
 *  only the text is missing.
 */

type Sized = { class?: string }

/** A field with its label: TextInput, NumberInput, Search, DatePickerInput. */
export function TextInputSkeleton(props: Sized & { hideLabel?: boolean }) {
	return (
		<div aria-hidden="true" class={props.class}>
			<Show when={!props.hideLabel}>
				<SkeletonText width="6rem" class="mb-tight" />
			</Show>
			<div class="border-b-2 border-ink pb-tight">
				<SkeletonText width="60%" />
			</div>
		</div>
	)
}

export function TextAreaSkeleton(props: Sized & { hideLabel?: boolean }) {
	return (
		<div aria-hidden="true" class={props.class}>
			<Show when={!props.hideLabel}>
				<SkeletonText width="6rem" class="mb-tight" />
			</Show>
			<div class="border-b-2 border-ink pb-tight">
				<SkeletonText paragraph lineCount={3} />
			</div>
		</div>
	)
}

export const NumberInputSkeleton = TextInputSkeleton
export const SearchSkeleton = TextInputSkeleton
export const DatePickerSkeleton = TextInputSkeleton

/** A boxed field with its label: Select, Dropdown, MultiSelect. */
export function SelectSkeleton(props: Sized & { hideLabel?: boolean }) {
	return (
		<div aria-hidden="true" class={props.class}>
			<Show when={!props.hideLabel}>
				<SkeletonText width="6rem" class="mb-tight" />
			</Show>
			<div class="border-2 border-ink px-2 py-snug">
				<SkeletonText width="50%" />
			</div>
		</div>
	)
}

export const DropdownSkeleton = SelectSkeleton

export function ButtonSkeleton(props: Sized & { size?: "sm" | "md" | "lg" }) {
	const height = () => (props.size === "sm" ? "h-6" : props.size === "lg" ? "h-10" : "h-8")
	return (
		<span
			aria-hidden="true"
			class={`${SKELETON} inline-block w-24 ${height()} ${props.class ?? ""}`}
		/>
	)
}

/** A box and a line: Checkbox and RadioButton. */
export function CheckboxSkeleton(props: Sized) {
	return (
		<div aria-hidden="true" class={`flex items-center gap-2 ${props.class ?? ""}`}>
			<SkeletonIcon size={16} />
			<SkeletonText width="8rem" />
		</div>
	)
}

export const RadioButtonSkeleton = CheckboxSkeleton

export function ToggleSkeleton(props: Sized) {
	return (
		<div aria-hidden="true" class={`flex items-center gap-2 ${props.class ?? ""}`}>
			<span class={`${SKELETON} block h-6 w-12`} />
			<SkeletonText width="6rem" />
		</div>
	)
}

export function SliderSkeleton(props: Sized) {
	return (
		<div aria-hidden="true" class={props.class}>
			<SkeletonText width="6rem" class="mb-2" />
			<span class={`${SKELETON} block h-rule w-full`} />
		</div>
	)
}

export function TagSkeleton(props: Sized) {
	return (
		<span aria-hidden="true" class={`${SKELETON} inline-block h-6 w-16 ${props.class ?? ""}`} />
	)
}

export function TabsSkeleton(props: Sized & { count?: number }) {
	return (
		<div aria-hidden="true" class={`flex gap-tight border-b-2 border-ink ${props.class ?? ""}`}>
			<For each={Array.from({ length: props.count ?? 4 })}>
				{() => <span class={`${SKELETON} block h-8 w-20`} />}
			</For>
		</div>
	)
}

export function BreadcrumbSkeleton(props: Sized & { count?: number }) {
	return (
		<div aria-hidden="true" class={`flex items-center gap-tight ${props.class ?? ""}`}>
			<For each={Array.from({ length: props.count ?? 3 })}>
				{(_, index) => (
					<>
						<Show when={index() > 0}>
							<span class="text-micro opacity-muted">/</span>
						</Show>
						<span class={`${SKELETON} block h-6 w-16`} />
					</>
				)}
			</For>
		</div>
	)
}

/** Ruled rows of one line each: Accordion, StructuredList, ContainedList. */
export function AccordionSkeleton(props: Sized & { count?: number }) {
	return (
		<div aria-hidden="true" class={props.class}>
			<For each={Array.from({ length: props.count ?? 4 })}>
				{() => (
					<div class="border-b-2 border-ink py-snug last:border-b-0">
						<SkeletonText width="40%" />
					</div>
				)}
			</For>
		</div>
	)
}

export function StructuredListSkeleton(props: Sized & { rowCount?: number }) {
	return (
		<div aria-hidden="true" class={props.class}>
			<For each={Array.from({ length: props.rowCount ?? 5 })}>
				{() => (
					<div class="flex items-center justify-between gap-2 border-b-2 border-ink py-gap last:border-b-0">
						<SkeletonText width="6rem" />
						<SkeletonText width="4rem" />
					</div>
				)}
			</For>
		</div>
	)
}

export function ProgressIndicatorSkeleton(props: Sized & { count?: number; vertical?: boolean }) {
	return (
		<div
			aria-hidden="true"
			class={`flex ${props.vertical ? "flex-col gap-4" : "flex-wrap gap-x-8 gap-y-4"} ${
				props.class ?? ""
			}`}
		>
			<For each={Array.from({ length: props.count ?? 4 })}>
				{() => (
					<div class="flex items-center gap-snug">
						<SkeletonIcon size={16} />
						<SkeletonText width="4rem" />
					</div>
				)}
			</For>
		</div>
	)
}

export function PaginationSkeleton(props: Sized) {
	return (
		<div
			aria-hidden="true"
			class={`flex items-center justify-between gap-2 ${BOX} p-2 ${props.class ?? ""}`}
		>
			<SkeletonText width="8rem" />
			<SkeletonText width="6rem" />
		</div>
	)
}

export function CodeSnippetSkeleton(props: Sized & { type?: "single" | "multi" }) {
	return (
		<div aria-hidden="true" class={`${BOX} p-2 ${props.class ?? ""}`}>
			<Show when={props.type === "single"} fallback={<SkeletonText paragraph lineCount={3} />}>
				<SkeletonText width="70%" />
			</Show>
		</div>
	)
}
