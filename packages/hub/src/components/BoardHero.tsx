import { createMemo, createSignal, onCleanup, onMount, Show } from "solid-js"
import { BoardView, Tile } from "@alumina/design"
import type { BoardViewAngle } from "@alumina/design"
import { PHASES } from "../fixtures/boards"
import { decodeMesh, loadBoardMeshes } from "../lib/mesh"
import type { BoardMeshes } from "../lib/mesh"

export type BoardView3D = BoardViewAngle

export type BoardHeroProps = {
	/** Board slug; must exist in the mesh fixture. */
	board: string
	/** Runs the print sweep and its caption. Off gives a still board, which is what
	 *  a board page wants — the sweep is the home page's pitch, not a property of
	 *  every render. */
	sweep?: boolean
	angle?: BoardViewAngle
	class?: string
}

/** One sweep, in seconds. The prototype's 5.4 — it plays once and then rests. A
 *  hero that keeps re-printing the same board reads as a loading state that never
 *  finishes. */
const SWEEP_SECONDS = 5.4

/** quarry's print sweep: the design system's BoardView with its reveal animated
 *  from the bottom of the board to the top, so it appears to print.
 *
 *  What is local to quarry is the *pitch* — the timing, the phase captions, the
 *  decision to play once. BoardView owns the drawing. */
export function BoardHero(props: BoardHeroProps) {
	// Loaded on mount, not through createResource: a resource would run on the
	// server, and SolidStart serialises whatever it resolved there for the client
	// to hydrate with. The fetch cannot work server-side, so the client would
	// hydrate a permanent `undefined` and never try again.
	const [meshes, setMeshes] = createSignal<BoardMeshes>()
	const [failed, setFailed] = createSignal(false)
	const [progress, setProgress] = createSignal(1)

	onMount(() => {
		void loadBoardMeshes()
			.then((all) => all && setMeshes(all))
			.catch(() => setFailed(true))

		if (!props.sweep || matchMedia("(prefers-reduced-motion: reduce)").matches) return

		setProgress(0)
		let raf = 0
		const start = performance.now()
		const tick = (now: number) => {
			const t = Math.min(1, (now - start) / 1000 / SWEEP_SECONDS)
			setProgress(t)
			// No frame is scheduled past the end, so the hero costs nothing once the
			// board is built.
			if (t < 1) raf = requestAnimationFrame(tick)
		}
		raf = requestAnimationFrame(tick)
		onCleanup(() => cancelAnimationFrame(raf))
	})

	const decoded = createMemo(() => {
		const packed = meshes()?.[props.board]
		return packed ? decodeMesh(packed) : undefined
	})
	const geometry = () => decoded()?.faces
	const size = createMemo(() => meshes()?.[props.board]?.size)
	const done = () => progress() >= 1
	const phase = () => Math.min(PHASES.length - 1, Math.floor(progress() * PHASES.length))

	return (
		<div class={`relative ${props.class ?? ""}`}>
			<BoardView
				geometry={geometry()}
				edges={decoded()?.edges}
				angle={props.angle ?? "iso"}
				reveal={progress()}
				transparent
				fallback="Loading board"
				error={failed() ? "Board mesh unavailable" : undefined}
				// size-full, not "absolute inset-0": BoardView's root is `relative`
				// and a position utility passed in loses to it, collapsing the canvas.
				class="size-full"
			/>
			<Show when={props.sweep && geometry()}>
				{
					/* Counts layers while it prints, then states what came out. Centred on
				    the board and hung below it, not tucked into a corner: it is a plate
				    under a figure, and the board is the figure. */
				}
				<Tile
					flat
					flush
					class="absolute -bottom-4 left-1/2 max-w-full -translate-x-1/2 overflow-hidden"
				>
					<p
						aria-live="polite"
						class="m-0 flex items-stretch whitespace-nowrap text-label uppercase"
					>
						<Show
							when={done()}
							fallback={
								<>
									<b class="on-ink flex items-center bg-ink px-2 py-tight font-bold tabular-nums text-white">
										{phase() + 1}/{PHASES.length}
									</b>
									<span class="flex items-center px-2 py-tight opacity-muted">
										{PHASES[phase()]}
									</span>
								</>
							}
						>
							<b class="on-ink flex shrink-0 items-center bg-ink px-2 py-tight font-bold text-white">
								done
							</b>
							{
								/* The one part that may shorten: on a phone it ends in an ellipsis
							    rather than running out under the plate's edge. */
							}
							<span class="block min-w-0 truncate px-2 py-tight opacity-muted">
								1.6 mm{size() ? ` · ${size()?.[0]} × ${size()?.[1]} mm` : ""} · ready to populate
							</span>
						</Show>
					</p>
				</Tile>
			</Show>
		</div>
	)
}
