/** Stored threads, and the per-mode suggestion chips.
 *
 * All seven of the prototype's threads, with the replies they open onto now
 * transcribed into typed sections in replies.ts. A thread names its replies
 * explicitly rather than routing its own prompts, which is why two of them open
 * onto `coupon` even though `route()` would send those words elsewhere — a stored
 * transcript records what was answered, not what would be answered now.
 *
 * Reached only through src/lib/agent.ts.
 */

import type { Mode, Thread } from "../lib/agent"

export const THREADS: Thread[] = [
	{
		id: "buck-5v",
		title: "BUCK-5V · 12 V to 5 V rail",
		summary: "4 layers · 2h",
		model: "perun",
		turns: [
			{ role: "user", text: "Step 12 V down to 5 V at 2 A" },
			{
				role: "agent",
				replyId: "buckAsk",
				answers: {
					topology: "Synchronous buck",
					current: "2 A",
					substrate: "PEI-1010 · serious",
					layers: "4",
					ripple: 40,
					tp: true,
					mh: true,
					rp: false,
					led: false,
					term: false,
					name: "BUCK-5V",
					notes: "Sits under a 3D-printed lid, 26 mm of headroom.",
				},
			},
			{
				role: "user",
				text:
					"BUCK-5V · Synchronous buck · 2 A · PEI-1010 · 4 layers · 40 mV · test points, mounting holes — sits under a 3D-printed lid, 26 mm of headroom.",
			},
			{ role: "agent", replyId: "buckBuild" },
		],
	},
	{
		id: "esp32-s3-carrier",
		title: "ESP32-S3 carrier",
		summary: "4 layers · yest",
		model: "indra",
		turns: [
			{ role: "user", text: "Break out an ESP32-S3-WROOM" },
			{ role: "agent", replyId: "esp" },
		],
	},
	{
		id: "coupon-sweep",
		title: "0.1 mm coupon sweep",
		summary: "2 layers · Tue",
		model: "raijin",
		turns: [
			{ role: "user", text: "Make a 0.1 mm trace test coupon" },
			{ role: "agent", replyId: "coupon" },
		],
	},
	{
		id: "u3-clearance",
		title: "Why U3 fails clearance",
		summary: "review · Mon",
		model: "perun",
		turns: [
			{ role: "user", text: "Explain the DRC failures on U3" },
			{ role: "agent", replyId: "clearance" },
		],
	},
	{
		id: "flex-tail",
		title: "Flex sensor tail on TPC-HT",
		summary: "2 layers · Sun",
		model: "perun",
		turns: [
			{ role: "user", text: "A flexible sensor tail on TPC-HT, 2 layers" },
			{ role: "agent", replyId: "plan" },
		],
	},
	{
		id: "silver-vs-carbon",
		title: "Silver ink vs carbon at 0.3",
		summary: "review · Sat",
		model: "indra",
		turns: [
			{ role: "user", text: "Silver ink vs carbon at 0.3 mm — what changes?" },
			{ role: "agent", replyId: "coupon" },
		],
	},
	{
		id: "panel-of-six",
		title: "Panel of 6 · coupon + carrier",
		summary: "4 layers · Fri",
		model: "raijin",
		turns: [
			{ role: "user", text: "Panel six coupons next to the carrier" },
			{ role: "agent", replyId: "coupon" },
		],
	},
]

/** Suggestion chips, per mode. The icon name is a Carbon glyph. */
export const CHIPS: Record<Mode, { icon: string; prompt: string }[]> = {
	design: [
		{ icon: "flash", prompt: "Step 12 V down to 5 V at 2 A" },
		{ icon: "chip", prompt: "Break out an ESP32-S3-WROOM" },
		{ icon: "temperature", prompt: "A 4-channel thermocouple front end" },
		{ icon: "move", prompt: "Flexible sensor tail on TPC-HT" },
		{ icon: "renew", prompt: "Motor driver for a 12 V NEMA 17" },
		{ icon: "plug", prompt: "USB-C PD trigger board at 20 V" },
	],
	review: [
		{ icon: "meter", prompt: "Explain the DRC failures on U3" },
		{ icon: "rule", prompt: "Check this board against Z1 fab limits" },
		{ icon: "view", prompt: "Find traces too thin for silver ink" },
		{ icon: "layers", prompt: "Second opinion on my ground pour" },
		{ icon: "renew", prompt: "Re-route the top layer at 0.3 mm" },
	],
	fab: [
		{ icon: "border--full", prompt: "Make a 0.1 mm trace test coupon" },
		{ icon: "paint-brush", prompt: "Silver ink vs carbon at 0.3 mm" },
		{ icon: "grid", prompt: "Panel six coupons next to the carrier" },
		{ icon: "hourglass", prompt: "How long will this take to print?" },
		{ icon: "cube", prompt: "Which substrate for a board that flexes?" },
	],
}

export const PLACEHOLDERS: Record<Mode, string> = {
	design: "Describe the board you want…",
	review: "What should I look at on this board?",
	fab: "Ask about materials, print time, or the Z1 process…",
}
