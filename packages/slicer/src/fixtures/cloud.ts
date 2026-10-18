/** Stand-in data for the Alumina cloud: who is signed in, and the newsletter.
 *
 * There is no cloud yet — quarry has no backend (CLAUDE.md, open decision 2) —
 * so this is what the home screen would be handed. Reached only through
 * src/lib/cloud.ts.
 */

import type { Account, NewsItem } from "../lib/cloud"

/** The sign-in prototype refuses an address here, so the refusal can be seen:
 *  the dummy company's domain. */
export const REFUSED_DOMAIN = "pixelexia.com"

export const ACCOUNT: Account = {
	handle: "avthenticstemcel",
	email: "avthenticstemcel@alumina.cloud",
	plan: "Maker",
	machine: "Alumina Z1",
}

export const NEWS: NewsItem[] = [
	{
		date: "2026-10-09",
		kind: "Release",
		title: "Z1 firmware 3.5.1",
		body: "Shorter dry holds between ink passes, and the probe re-zeroes after every tool swap.",
	},
	{
		date: "2026-10-02",
		kind: "Newsletter",
		title: "October: why the channel is 0.8 mm",
		body: "How the pen sets the narrowest trace, with three coupons to print and measure yourself.",
	},
	{
		date: "2026-09-24",
		kind: "Community",
		title: "Board of the week: i2c-fanout-6",
		body: "Six I²C ports off one header, printed in four slabs by Sambhav Arora at Pixelexia.",
	},
	{
		date: "2026-09-18",
		kind: "Release",
		title: "foundry 0.1",
		body:
			"The slicer as a desktop app: boards open in tabs, and a dropped IPC-2581 file opens itself.",
	},
]
