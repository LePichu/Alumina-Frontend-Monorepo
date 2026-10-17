import { useParams } from "@solidjs/router"
import { Studio } from "../../components/Studio"

/** A link straight to a board, by mica's id for it (the SHA-256 of its
 *  document): the app, opened with that board's tab showing, from the document
 *  kept on this machine. What `pcb+open://` will land on once the desktop app
 *  registers it. */
export default function Slice() {
	const params = useParams<{ board: string }>()
	return <Studio open={params.board} />
}
