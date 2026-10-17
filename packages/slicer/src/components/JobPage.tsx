import {
	Background,
	ContainedList,
	ContainedListItem,
	InlineNotification,
	Tile,
} from "@alumina/design"
import type { OpenBoard } from "../lib/board"

export type JobPageProps = {
	/** The board whose print this tracks. */
	open: OpenBoard
}

/** A board's print job. A stub, on purpose.
 *
 *  The tracking screen is designed in mica.html — camera feeds, meters, an event
 *  log — but all of it reads live machine state, and that is shale's, which is
 *  not wired in. Building the UI now would mean inventing the protocol's shape in
 *  the component layer, which is exactly what src/lib/printer.ts exists to avoid.
 *  The page exists so that "Job" has somewhere to go.
 */
export function JobPage(props: JobPageProps) {
	return (
		<>
			<Background variant="grid" />
			<div class="relative z-10 mx-auto flex max-w-4xl flex-col gap-4 px-4 py-8">
				<InlineNotification
					kind="info"
					title={`${props.open.name}: job tracking is not built yet`}
					subtitle="It needs live machine state, which comes with shale. The screen is designed but
						deliberately unimplemented rather than backed by invented telemetry."
					hideCloseButton
				/>

				<Tile heading="Planned">
					<ContainedList size="lg">
						<ContainedListItem>Camera views · gantry, head, bed</ContainedListItem>
						<ContainedListItem>Meters · nozzle, bed, dryer, feed, fan</ContainedListItem>
						<ContainedListItem>
							Event log · tool changes, dry holds, ink passes, fiducial matches
						</ContainedListItem>
					</ContainedList>
				</Tile>
			</div>
		</>
	)
}
