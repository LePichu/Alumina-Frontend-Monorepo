import { createSignal, createUniqueId, For, Match, Show, Switch } from "solid-js"
import type { JSX } from "solid-js"
import CheckmarkFilled from "@carbon/icons/es/checkmark--filled/16"
import Close from "@carbon/icons/es/close/16"
import { Icon } from "../../icons/Icon"
import { BOX, LABEL } from "../../internal/styles"
import { Button } from "../Button/Button"
import type { ButtonKind, ButtonSize } from "../Button/Button"
import { Loading } from "../Loading/Loading"
import { SkeletonText } from "../Skeleton/Skeleton"

/** Where one file is in its upload: on its way, done and removable, or done. */
export type FileStatus = "uploading" | "edit" | "complete"

export type FileUploaderButtonProps = {
	labelText?: string
	buttonKind?: ButtonKind
	size?: ButtonSize
	accept?: string[]
	multiple?: boolean
	disabled?: boolean
	name?: string
	class?: string
	onChange?: (files: File[]) => void
}

/** Carbon's FileUploaderButton: a button that opens the file picker.
 *
 *  A real Button driving a hidden file input, so it has a button's keyboard and
 *  its look. The input is taken out of the tab order and the accessibility tree:
 *  the button is the control, and announcing both would announce one thing
 *  twice. */
export function FileUploaderButton(props: FileUploaderButtonProps) {
	let input: HTMLInputElement | undefined

	return (
		<span class={`inline-flex ${props.class ?? ""}`}>
			<Button
				kind={props.buttonKind ?? "primary"}
				size={props.size}
				disabled={props.disabled}
				onClick={() => input?.click()}
			>
				{props.labelText ?? "Add file"}
			</Button>
			<input
				ref={input}
				type="file"
				tabindex={-1}
				aria-hidden="true"
				class="sr-only"
				name={props.name}
				accept={props.accept?.join(",")}
				multiple={props.multiple}
				disabled={props.disabled}
				onChange={(event) => {
					props.onChange?.(Array.from(event.currentTarget.files ?? []))
					// Cleared so choosing the same file again still fires a change.
					event.currentTarget.value = ""
				}}
			/>
		</span>
	)
}

export type FileUploaderItemProps = {
	name: string
	status?: FileStatus
	/** The file was refused. Reads as weight: a thick rule under the row, an
	 *  uppercase subject — never as red. */
	invalid?: boolean
	/** What is wrong, in a few words. */
	errorSubject?: JSX.Element
	/** And what to do about it. */
	errorBody?: JSX.Element
	/** Accessible name for the remove control. */
	iconDescription?: string
	class?: string
	onDelete?: () => void
}

/** Carbon's FileUploaderItem: one chosen file, and how its upload is going. */
export function FileUploaderItem(props: FileUploaderItemProps) {
	const status = (): FileStatus => props.status ?? "uploading"

	return (
		<div
			class={`${BOX} ${props.invalid ? "border-b-4" : ""} ${props.class ?? ""}`}
		>
			<div class="flex items-center gap-2 px-2 py-tight">
				<span class="min-w-0 flex-1 truncate text-body" title={props.name}>{props.name}</span>
				<Switch>
					<Match when={status() === "uploading"}>
						<Loading small description={`Uploading ${props.name}`} />
					</Match>
					<Match when={status() === "complete"}>
						<Icon glyph={CheckmarkFilled} size={16} label="Uploaded" />
					</Match>
					<Match when={status() === "edit"}>
						<button
							type="button"
							aria-label={props.iconDescription ?? `Remove ${props.name}`}
							onClick={() => props.onDelete?.()}
							class="-mr-tight flex shrink-0 cursor-pointer items-center justify-center border-0
								bg-transparent p-tight text-ink hover:bg-gray pointer-coarse:min-h-touch
								pointer-coarse:min-w-touch"
						>
							<Icon glyph={Close} size={16} />
						</button>
					</Match>
				</Switch>
			</div>
			<Show when={props.invalid && (props.errorSubject || props.errorBody)}>
				<div role="alert" class="border-t-2 border-ink px-2 py-tight">
					<p class={`m-0 ${LABEL}`}>{props.errorSubject}</p>
					<Show when={props.errorBody}>
						<p class="m-0 mt-tight text-small">{props.errorBody}</p>
					</Show>
				</div>
			</Show>
		</div>
	)
}

export type FileUploaderProps = {
	labelTitle?: JSX.Element
	labelDescription?: JSX.Element
	buttonLabel?: string
	buttonKind?: ButtonKind
	size?: ButtonSize
	/** The status every listed file is shown in. This component keeps the list;
	 *  it does not upload anything, so the status is the caller's to say. */
	filenameStatus?: FileStatus
	accept?: string[]
	multiple?: boolean
	disabled?: boolean
	name?: string
	iconDescription?: string
	class?: string
	onChange?: (files: File[]) => void
	onDelete?: (file: File) => void
}

/** Carbon's FileUploader: a title, a button, and the files chosen so far.
 *
 *  The whole thing in one piece, for the common case. When the page needs to
 *  know more — per-file progress, a refused file — compose FileUploaderButton or
 *  FileUploaderDropContainer with FileUploaderItems and hold the list yourself.
 */
export function FileUploader(props: FileUploaderProps) {
	const id = createUniqueId()
	const [files, setFiles] = createSignal<File[]>([])

	return (
		<div class={props.class}>
			<Show when={props.labelTitle}>
				<p id={`${id}-title`} class={`m-0 ${LABEL}`}>{props.labelTitle}</p>
			</Show>
			<Show when={props.labelDescription}>
				<p class="m-0 mt-tight text-small opacity-muted">{props.labelDescription}</p>
			</Show>
			<FileUploaderButton
				class="mt-2"
				labelText={props.buttonLabel}
				buttonKind={props.buttonKind}
				size={props.size}
				accept={props.accept}
				multiple={props.multiple}
				disabled={props.disabled}
				name={props.name}
				onChange={(added) => {
					setFiles((current) => (props.multiple ? [...current, ...added] : added))
					props.onChange?.(added)
				}}
			/>
			<Show when={files().length > 0}>
				<div class="mt-2 flex max-w-80 flex-col gap-tight">
					<For each={files()}>
						{(file) => (
							<FileUploaderItem
								name={file.name}
								status={props.filenameStatus ?? "uploading"}
								iconDescription={props.iconDescription}
								onDelete={() => {
									setFiles((current) => current.filter((other) => other !== file))
									props.onDelete?.(file)
								}}
							/>
						)}
					</For>
				</div>
			</Show>
		</div>
	)
}

/** A FileUploader that has not loaded. */
export function FileUploaderSkeleton(props: { class?: string }) {
	return (
		<div aria-busy="true" class={`flex flex-col gap-snug ${props.class ?? ""}`}>
			<SkeletonText heading width="8rem" />
			<SkeletonText width="16rem" />
			<SkeletonText heading width="6rem" class="mt-tight" />
		</div>
	)
}
