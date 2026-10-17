import { createSignal, Show } from "solid-js"
import DocumentAdd from "@carbon/icons/es/document--add/16"
import {
	Background,
	FileUploaderDropContainer,
	Icon,
	InlineNotification,
	Tile,
	useAppShell,
} from "@alumina/design"
import { isNotABoard, openFile } from "../lib/board"
import { BOARD_FILES, pickFiles } from "../lib/files"
import { useStudio } from "./Studio"

export type ProjectPageProps = {
	/** Its own page's id, so that it can hand its tab over to the board. */
	id: string
}

/** A new project, before it has a board.
 *
 *  A project is a board and how it is to be printed, and this one has no board
 *  yet: it is one box, which a board is dropped on or picked into. The moment it
 *  has one, the board opens in a tab of its own and this one closes — the
 *  project *is* the board from then on, and its tab says so.
 */
export function ProjectPage(props: ProjectPageProps) {
	const studio = useStudio()
	const shell = useAppShell()
	const [problem, setProblem] = createSignal<string>()

	const add = async (files: File[]) => {
		const file = files[0]
		if (!file) return
		try {
			const result = await openFile(file)
			if (isNotABoard(result)) return setProblem(`${file.name}: ${result.reason}`)
			studio.openBoard(result)
			shell.close(props.id)
		} catch (error) {
			setProblem(error instanceof Error ? error.message : String(error))
		}
	}

	return (
		<>
			<Background variant="grid" />
			<div class="relative z-10 grid h-full place-items-center overflow-hidden p-gap">
				<Tile
					heading={
						<>
							<Icon glyph={DocumentAdd} size={16} />New project
						</>
					}
					class="w-full max-w-160"
				>
					<FileUploaderDropContainer
						accept={BOARD_FILES}
						onAddFiles={add}
						onPick={() => pickFiles(BOARD_FILES, true)}
						labelText={
							<>
								<b class="block text-body font-bold">
									Add a board: drop its IPC-2581 file, or click
								</b>
								<span class="mt-tight block text-small opacity-muted">
									mica reads it: its name, its layers and how it prints.
								</span>
							</>
						}
					/>
					<Show when={problem()}>
						{(text) => (
							<InlineNotification
								kind="error"
								title="Not opened"
								subtitle={text()}
								onClose={() => setProblem(undefined)}
								class="mt-gap"
							/>
						)}
					</Show>
				</Tile>
			</div>
		</>
	)
}
