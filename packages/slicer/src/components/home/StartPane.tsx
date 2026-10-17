import Add from "@carbon/icons/es/add/16"
import CloudUpload from "@carbon/icons/es/cloud--upload/16"
import FolderOpen from "@carbon/icons/es/folder--open/16"
import Settings from "@carbon/icons/es/settings/16"
import { ContainedList, ContainedListItem, ScrollArea, Tile, TileSection } from "@alumina/design"
import { APP_KIND, APP_NAME, APP_VERSION } from "../../lib/app"
import { BOARD_FILES, pickFiles } from "../../lib/files"
import { useStudio } from "../Studio"
import { AccountMenu } from "./AccountMenu"

export type StartPaneProps = {
	/** Opens files as boards; the home screen's, so a picked file and a dropped
	 *  one take the same way in. */
	onOpenFiles: (files: File[]) => void
}

/** The home screen's narrow column: the app's name, what you can start with,
 *  and who is signed in. (The printer has a third of the right column.)
 *
 *  One tile, ruled into sections, filling the column; the account is pinned to
 *  its foot and the rest scrolls above it when the window is short. */
export function StartPane(props: StartPaneProps) {
	const studio = useStudio()

	const open = async () => props.onOpenFiles(await pickFiles(BOARD_FILES, true))

	return (
		<Tile
			bar
			flush
			fill
			heading={
				<>
					<b class="text-brand normal-case">{APP_NAME}</b>
					<small class="text-micro opacity-muted">{APP_KIND}</small>
				</>
			}
			meta={`v${APP_VERSION}`}
			class="flex min-h-0 flex-1 flex-col"
		>
			<ScrollArea>
				{/* Flush, so a command's ground runs the tile's full width. */}
				<TileSection heading="Start" flush>
					<ContainedList commands size="lg">
						<ContainedListItem renderIcon={Add} onClick={() => studio.newProject()}>
							New project
						</ContainedListItem>
						<ContainedListItem renderIcon={FolderOpen} onClick={open}>
							Open project…
						</ContainedListItem>
						<ContainedListItem renderIcon={CloudUpload} onClick={() => void studio.sync()}>
							Sync to cloud
						</ContainedListItem>
						<ContainedListItem renderIcon={Settings} onClick={() => studio.openSettings()}>
							Settings
						</ContainedListItem>
					</ContainedList>
				</TileSection>
			</ScrollArea>

			<AccountMenu />
		</Tile>
	)
}
