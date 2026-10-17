import { createSignal } from "solid-js"
import type { JSX } from "solid-js"
import Upload from "@carbon/icons/es/upload/16"
import { Icon } from "../../icons/Icon"
import { createId } from "../../internal/control"

export type FileUploaderDropContainerProps = {
	id?: string
	labelText?: JSX.Element
	accept?: string[]
	multiple?: boolean
	disabled?: boolean
	name?: string
	class?: string
	onAddFiles?: (files: File[]) => void
	/** Asks for files some other way than the browser's file input: pressing
	 *  the container, or Enter or Space on it, calls this instead, and what it
	 *  resolves with is added. For a host with a picker of its own — the desktop
	 *  app's, through the desktop's portal, where WebKitGTK's file input opens a
	 *  GTK3 chooser. Drops are unchanged. */
	onPick?: () => Promise<File[]>
}

/** Drop target and file picker in one. Keyboard reaches it because the label is
 *  bound to a real file input, so Enter and Space open the picker for free. */
export function FileUploaderDropContainer(props: FileUploaderDropContainerProps) {
	const [over, setOver] = createSignal(false)
	const id = createId("file-uploader", () => props.id)

	const accept = (files: FileList | null) => {
		if (!files || props.disabled) return
		props.onAddFiles?.(Array.from(files))
	}

	return (
		<div class={props.class}>
			<label
				for={id()}
				onDragOver={(event) => {
					event.preventDefault()
					if (!props.disabled) setOver(true)
				}}
				onDragLeave={() => setOver(false)}
				onDrop={(event) => {
					event.preventDefault()
					setOver(false)
					accept(event.dataTransfer?.files ?? null)
				}}
				class={`flex min-h-touch cursor-pointer flex-col items-center justify-center gap-2
          border-2 border-dashed border-ink p-4 text-center text-body
          has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2
          has-[:focus-visible]:outline-ink
          ${over() ? "bg-gray" : "bg-white"}
          ${props.disabled ? "cursor-not-allowed opacity-40" : "hover:bg-gray"}`}
			>
				<Icon glyph={Upload} size={24} />
				<span>{props.labelText ?? "Drag and drop files here, or click to upload"}</span>
				<input
					id={id()}
					type="file"
					class="sr-only"
					name={props.name}
					accept={props.accept?.join(",")}
					multiple={props.multiple}
					disabled={props.disabled}
					onChange={(event) => {
						accept(event.currentTarget.files)
						event.currentTarget.value = ""
					}}
					// A press on the label, and Enter or Space on the input, all arrive
					// as a click on the input: stopped here, the browser's picker never
					// opens, and the host's does.
					onClick={(event) => {
						if (!props.onPick || props.disabled) return
						event.preventDefault()
						void props.onPick().then((files) => {
							if (files.length) props.onAddFiles?.(files)
						})
					}}
				/>
			</label>
		</div>
	)
}
