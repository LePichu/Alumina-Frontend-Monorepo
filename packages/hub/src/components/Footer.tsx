import { For, Show } from "solid-js"
import { Link } from "@alumina/design"

/** The page ends on ink.
 *
 * Inverted rather than ruled off: quarry is the only app that is also a public
 * website, so its pages have a bottom, and a white footer on a white page has
 * none. The one hard shadow rule is untouched — this is a ground, not a box.
 */

type Column = { heading: string; links: [label: string, note?: string][] }

const COLUMNS: Column[] = [
	{
		heading: "Boards",
		links: [["Browse all", "3"], ["Fits your machine", "2"], ["Most built"], ["Collections"]],
	},
	{
		heading: "Publishing",
		links: [["Upload a board"], ["Check reference"], ["Licensing guide"], ["Rate limits"]],
	},
	{
		heading: "Ecosystem",
		links: [
			["foundry", "slicer"],
			["shale", "g-code"],
			["Alumina Z1", "printer"],
			["pcb+open", "protocol"],
		],
	},
]

const LEGAL = ["Docs", "API", "Status", "Terms"]

export function Footer() {
	return (
		<footer class="on-ink page-bleed relative z-10 mt-20 bg-ink text-white">
			<div class="mx-auto max-w-296 px-4 py-8 sm:px-8">
				<div class="grid gap-8 lg:grid-cols-[1.4fr_repeat(3,minmax(0,1fr))]">
					<div>
						<b class="text-brand font-bold">quarry</b>
						<span class="ml-2 text-micro uppercase opacity-muted">boards</span>
						<p class="m-0 mt-2 max-w-prose text-body opacity-muted">
							A home for boards and the sources behind them. Nothing here is locked to one machine
							or one fab.
						</p>
					</div>

					<For each={COLUMNS}>
						{(column) => (
							<div>
								<h2 class="m-0 mb-2 text-micro font-bold uppercase opacity-muted">
									{column.heading}
								</h2>
								<ul class="m-0 list-none p-0">
									<For each={column.links}>
										{([label, note]) => (
											<li class="py-tight opacity-80 hover:opacity-100">
												<Link href="#">
													{label}
													<Show when={note}>
														<span class="ml-tight text-micro opacity-muted">{note}</span>
													</Show>
												</Link>
											</li>
										)}
									</For>
								</ul>
							</div>
						)}
					</For>
				</div>

				{
					/* The one rule on the ink ground. White at low alpha rather than the ink
				    divider used everywhere else, which would be invisible here. */
				}
				<div class="mt-8 flex flex-wrap items-center gap-4 border-t-2 border-white/20 pt-4 text-micro uppercase opacity-muted">
					<b class="bg-white px-2 py-tight font-bold text-ink opacity-100">v0.1</b>
					<span>Boards belong to their authors, under the licence each one carries</span>
					<span class="ml-auto flex gap-4">
						<For each={LEGAL}>
							{(label) => <Link href="#" size="sm">{label}</Link>}
						</For>
					</span>
				</div>
			</div>
		</footer>
	)
}
