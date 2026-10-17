import { createContext, createSignal, onCleanup, Show, useContext } from "solid-js"
import type { Accessor, JSX } from "solid-js"
import Upload from "@carbon/icons/es/upload/24"
import { Icon } from "../../icons/Icon"

export type FileDropProps = {
	/** The file-name endings it takes, as `FileUploaderDropContainer`'s `accept`
	 *  does: `[".xml", ".cvg"]`. Left off, it takes anything. */
	accept?: string[]
	/** The files that were dropped and are taken. Never called with none. */
	onDrop: (files: File[]) => void
	/** The files that were dropped and are not taken, so the page can say why —
	 *  a drop that silently does nothing reads as broken. */
	onReject?: (files: File[]) => void
	/** What it says while files are held over it. */
	label?: JSX.Element
	disabled?: boolean
	/** Where the region sits. It is `relative`, for the cover it draws. */
	class?: string
	children?: JSX.Element
}

type FileDropContextValue = {
	held: Accessor<boolean>
	label: () => JSX.Element
	/** A cover inside the region says it is there, and the region draws none. */
	claim: () => void
}

const FileDropContext = createContext<FileDropContextValue>()

/** Takes the extension off a file's name, lower-cased, dot and all. */
const ending = (name: string) => {
	const dot = name.lastIndexOf(".")
	return dot < 0 ? "" : name.slice(dot).toLowerCase()
}

/** A region that takes files dropped anywhere on it.
 *
 *  `FileUploaderDropContainer` is a target of its own, a box to aim at. This
 *  is for when the target is a whole part of a page — a home screen's column,
 *  a stage — and what is already there should not have to make room for a
 *  box. While files are held over it, it is covered by a drop box — the dashed
 *  ink edge on white — saying what letting go will do; the rest of the time it
 *  draws nothing.
 *
 *  Dropping is a mouse's gesture. A page that takes files this way also offers
 *  a control that opens a picker, or the keyboard and a finger have no way in.
 *
 *  Only a drag that is carrying files lights it: text or a link dragged across
 *  the page goes past. A box to aim at can still sit inside it — a drop on the
 *  box is the box's, and is not taken a second time here.
 *
 *  The cover goes over the whole region unless a `FileDropCover` inside it
 *  says where: foundry's home takes a board dropped anywhere in its column,
 *  and shows the drop over its recent boards, which is where a board opened
 *  this way will join them.
 */
export function FileDrop(props: FileDropProps) {
	// Entering a child is a `dragenter` on the child before the `dragleave` off
	// the element it came from, so a count of the two is never zero while the
	// files are still over some part of the region — where a flag set by one and
	// cleared by the other would flicker at every edge inside it.
	const [depth, setDepth] = createSignal(0)
	const [covers, setCovers] = createSignal(0)
	const held = () => depth() > 0
	const label = () => props.label ?? "Drop to add"
	const carriesFiles = (event: DragEvent) =>
		!props.disabled && (event.dataTransfer?.types.includes("Files") ?? false)

	const take = (list: FileList | undefined) => {
		const files = Array.from(list ?? [])
		const wanted = props.accept?.map((end) => end.toLowerCase())
		const taken = wanted ? files.filter((file) => wanted.includes(ending(file.name))) : files
		const left = files.filter((file) => !taken.includes(file))
		if (taken.length) props.onDrop(taken)
		if (left.length) props.onReject?.(left)
	}

	return (
		<div
			onDragEnter={(event) => {
				if (!carriesFiles(event)) return
				event.preventDefault()
				setDepth((n) => n + 1)
			}}
			onDragOver={(event) => {
				if (!carriesFiles(event)) return
				// Without this the browser keeps the drop for itself, and opens the
				// file in place of the page.
				event.preventDefault()
				if (event.dataTransfer) event.dataTransfer.dropEffect = "copy"
			}}
			onDragLeave={(event) => {
				if (!carriesFiles(event)) return
				setDepth((n) => Math.max(0, n - 1))
			}}
			onDrop={(event) => {
				if (!carriesFiles(event)) return
				setDepth(0)
				// A target inside it — a `FileUploaderDropContainer` — that has already
				// taken the drop says so by preventing its default. Taking it again
				// would open everything twice.
				if (event.defaultPrevented) return
				event.preventDefault()
				take(event.dataTransfer?.files)
			}}
			class={`relative ${props.class ?? ""}`}
		>
			<FileDropContext.Provider
				value={{
					held,
					label,
					claim: () => {
						setCovers((n) => n + 1)
						onCleanup(() => setCovers((n) => n - 1))
					},
				}}
			>
				{props.children}
			</FileDropContext.Provider>
			<Show when={held() && covers() === 0}>
				<Cover>{label()}</Cover>
			</Show>
		</div>
	)
}

/** Where a `FileDrop` shows that files are held over it, when that is not
 *  over the whole of it: the part of the page a dropped file will join. It
 *  covers its parent, which must be positioned, and draws nothing until files
 *  are held anywhere over the `FileDrop` round it. */
export function FileDropCover() {
	const drop = useContext(FileDropContext)
	if (!drop) throw new Error("FileDropCover must be used inside FileDrop")
	drop.claim()

	return (
		<Show when={drop.held()}>
			<Cover>{drop.label()}</Cover>
		</Show>
	)
}

/** A drop box over whatever is beneath: the dashed ink edge on white.
 *
 *  White, not the grey the drop container itself turns while held: a cover the
 *  size of a page's column in that grey read as a dark slab dropped over the
 *  page, where white reads as the page making room.
 *
 *  Not in the way of the drop: events go through it to whatever is underneath,
 *  and bubble to the region. Hidden from assistive tech, which has no drag to
 *  describe. */
function Cover(props: { children: JSX.Element }) {
	return (
		<div
			aria-hidden="true"
			class="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2
				border-2 border-dashed border-ink bg-white p-4 text-center text-body"
		>
			<Icon glyph={Upload} size={24} />
			<span>{props.children}</span>
		</div>
	)
}
