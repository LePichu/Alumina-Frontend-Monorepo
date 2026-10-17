import type { JSX } from "solid-js"
import { Background, PageScrollbar } from "@alumina/design"
import { Footer } from "./Footer"
import { Nav } from "./Nav"

/** Every quarry page is the same frame: the moving grid behind, a centred column
 *  with the sticky nav at its top, and the ink footer under it.
 *
 *  A component rather than a route-group layout because the footer has to sit
 *  outside the centred column — it runs the full width of the viewport — while
 *  the nav sits inside it. Nesting that in each route would put four copies of
 *  the same two wrappers in the app.
 */
export function Shell(props: { children?: JSX.Element }) {
	return (
		<>
			<Background variant="grid" />
			{/* quarry's pages scroll, unlike foundry's and kiln's fixed windows. */}
			<PageScrollbar />
			{/* 1180px in the prototype; 296 spacing units is 74rem, the nearest even fit. */}
			<div class="relative z-10 mx-auto max-w-296 px-4 sm:px-8">
				<Nav />
				<main>{props.children}</main>
			</div>
			<Footer />
		</>
	)
}
