import { createMemo, For, Show } from "solid-js"
import { fitText, num, str, TICK_PX } from "./core"
import type { BaseChartOptions, ChartProps, Datum } from "./core"
import { labelOn, paint, paintThrough } from "./fills"
import { ChartFrame, createChart, PlateLabel, tipHandlers } from "./frame"

/** A node of Carbon's hierarchical data: `{ name, value }` for a leaf,
 *  `{ name, children }` for a branch. */
type Node = { name: string; value: number; children: Node[] }

function toNode(datum: Datum): Node {
	const kids = Array.isArray(datum["children"]) ? (datum["children"] as Datum[]).map(toNode) : []
	const own = num(datum["value"])
	return {
		name: str(datum["name"]),
		children: kids,
		// A branch is worth the sum of what is under it.
		value: kids.length
			? kids.reduce((total, kid) => total + kid.value, 0)
			: (Number.isNaN(own) ? 0 : own),
	}
}

function leaves(node: Node): Node[] {
	return node.children.length ? node.children.flatMap(leaves) : [node]
}

function hierarchyTable(roots: readonly Node[]) {
	const rows: (string | number)[][] = []
	const walk = (node: Node, path: string[]) => {
		if (node.children.length === 0) rows.push([path.join(" / ") || "—", node.name, node.value])
		for (const kid of node.children) walk(kid, [...path, node.name])
	}
	for (const root of roots) walk(root, [])
	return { headers: ["group", "name", "value"], rows }
}

// ---------------------------------------------------------------------------
// treemap

type Rect = { x: number; y: number; w: number; h: number }

/** Squarified treemap (Bruls, Huizing, van Wijk). Rows are filled along the
 *  shorter side and closed as soon as adding another item would make the row's
 *  worst rectangle less square — which is what keeps a treemap from degenerating
 *  into slivers nobody can compare. Expects `values` sorted largest first. */
function squarify(values: readonly number[], frame: Rect): Rect[] {
	const total = values.reduce((a, b) => a + b, 0)
	if (total <= 0) return values.map(() => ({ x: frame.x, y: frame.y, w: 0, h: 0 }))
	const areas = values.map((value) => (value / total) * frame.w * frame.h)
	const out: Rect[] = []
	const rest: Rect = { ...frame }

	const worst = (row: readonly number[], side: number) => {
		const s = row.reduce((a, b) => a + b, 0)
		const big = Math.max(...row)
		const small = Math.min(...row)
		return Math.max((side * side * big) / (s * s), (s * s) / (side * side * small))
	}

	const close = (row: readonly number[]) => {
		const s = row.reduce((a, b) => a + b, 0)
		if (rest.w >= rest.h) {
			const w = s / (rest.h || 1)
			let y = rest.y
			for (const area of row) {
				const h = area / (w || 1)
				out.push({ x: rest.x, y, w, h })
				y += h
			}
			rest.x += w
			rest.w -= w
		} else {
			const h = s / (rest.w || 1)
			let x = rest.x
			for (const area of row) {
				const w = area / (h || 1)
				out.push({ x, y: rest.y, w, h })
				x += w
			}
			rest.y += h
			rest.h -= h
		}
	}

	let row: number[] = []
	for (const area of areas) {
		const side = Math.min(rest.w, rest.h)
		if (row.length === 0 || worst([...row, area], side) <= worst(row, side)) {
			row.push(area)
		} else {
			close(row)
			row = [area]
		}
	}
	if (row.length) close(row)
	return out
}

/** Carbon's TreemapChart: parts of a whole, where the parts have parts. Each
 *  top-level group takes a share of the frame and its leaves share that; a
 *  group wears one fill throughout, so you see the groups first and the leaves
 *  second. */
export function TreemapChart(props: ChartProps<BaseChartOptions>) {
	const roots = createMemo(() => props.data.map(toNode))
	const chart = createChart({
		options: () => props.options,
		groups: () => roots().map((root) => root.name),
		table: () => hierarchyTable(roots()),
	})

	return (
		<ChartFrame chart={chart} class={props.class}>
			{(size) => {
				const cells = createMemo(() => {
					const groups = roots()
						.filter((root) => chart.isActive(root.name))
						.sort((a, b) => b.value - a.value)
					const frames = squarify(
						groups.map((group) => group.value),
						{ x: 1, y: 1, w: size.width() - 2, h: size.height() - 2 },
					)
					return groups.flatMap((group, at) => {
						const frame = frames[at]
						if (!frame) return []
						const kids = leaves(group).sort((a, b) => b.value - a.value)
						return squarify(kids.map((kid) => kid.value), frame).map((rect, i) => ({
							group: group.name,
							leaf: kids[i] as Node,
							rect,
						}))
					})
				})

				return (
					<For each={cells()}>
						{(cell) => (
							<g
								{...tipHandlers(chart, () => ({
									title: cell.group,
									rows: [{ label: cell.leaf.name, value: chart.format(cell.leaf.value) }],
								}))}
							>
								<rect
									// Inset by a pixel each side: the white that shows between cells is
									// the only thing separating two solid-ink neighbours.
									x={cell.rect.x + 1}
									y={cell.rect.y + 1}
									width={Math.max(0, cell.rect.w - 2)}
									height={Math.max(0, cell.rect.h - 2)}
									stroke-width="2"
									{...paint(chart.uid, chart.fillOf(cell.group), "stroke-ink")}
								/>
								{/* Only where the name fits; a clipped label is worse than none. */}
								<Show when={cell.rect.w > 44 && cell.rect.h > 22}>
									<PlateLabel
										x={cell.rect.x + 4}
										y={cell.rect.y + 12}
										text={fitText(cell.leaf.name, cell.rect.w - 14)}
										on={labelOn(chart.fillOf(cell.group))}
									/>
								</Show>
							</g>
						)}
					</For>
				)
			}}
		</ChartFrame>
	)
}

// ---------------------------------------------------------------------------
// circle pack

type Disc = { x: number; y: number; r: number }

/** Packs discs of the given radii around the origin: largest first, each new one
 *  set tangent to two already placed, in whichever such spot is nearest the
 *  centre and overlaps nothing. Cubic in the number of discs, which is fine — a
 *  circle pack with more than a few dozen circles is unreadable anyway. */
function packDiscs(radii: readonly number[]): Disc[] {
	const order = radii.map((r, index) => ({ r, index })).sort((a, b) => b.r - a.r)
	const placed: (Disc & { index: number })[] = []

	const clear = (candidate: Disc) =>
		placed.every((other) =>
			Math.hypot(candidate.x - other.x, candidate.y - other.y) >= candidate.r + other.r - 1e-6
		)

	for (const { r, index } of order) {
		if (placed.length === 0) {
			placed.push({ x: 0, y: 0, r, index })
			continue
		}
		if (placed.length === 1) {
			const first = placed[0] as Disc
			placed.push({ x: first.r + r, y: 0, r, index })
			continue
		}
		let best: Disc | undefined
		for (let i = 0; i < placed.length; i++) {
			for (let j = i + 1; j < placed.length; j++) {
				const a = placed[i] as Disc
				const b = placed[j] as Disc
				// The two points at distance (a.r + r) from a and (b.r + r) from b.
				const d = Math.hypot(b.x - a.x, b.y - a.y)
				const ra = a.r + r
				const rb = b.r + r
				if (d === 0 || d > ra + rb) continue
				const along = (ra * ra - rb * rb + d * d) / (2 * d)
				const off = Math.sqrt(Math.max(0, ra * ra - along * along))
				const ux = (b.x - a.x) / d
				const uy = (b.y - a.y) / d
				for (const sign of [1, -1]) {
					const candidate = {
						x: a.x + ux * along - uy * off * sign,
						y: a.y + uy * along + ux * off * sign,
						r,
					}
					if (!clear(candidate)) continue
					if (!best || Math.hypot(candidate.x, candidate.y) < Math.hypot(best.x, best.y)) {
						best = candidate
					}
				}
			}
		}
		placed.push({ ...(best ?? { x: 0, y: 0, r }), index })
	}

	const out: Disc[] = radii.map((r) => ({ x: 0, y: 0, r }))
	for (const disc of placed) out[disc.index] = { x: disc.x, y: disc.y, r: disc.r }
	return out
}

/** A circle that holds every disc: centred on their weighted middle, as wide as
 *  the furthest edge. Not the minimal enclosing circle, but within a few percent
 *  of it and a great deal shorter than Welzl. */
function enclose(discs: readonly Disc[]): Disc {
	if (discs.length === 0) return { x: 0, y: 0, r: 0 }
	const weight = discs.reduce((total, disc) => total + disc.r, 0) || 1
	const x = discs.reduce((total, disc) => total + disc.x * disc.r, 0) / weight
	const y = discs.reduce((total, disc) => total + disc.y * disc.r, 0) / weight
	return { x, y, r: Math.max(...discs.map((disc) => Math.hypot(disc.x - x, disc.y - y) + disc.r)) }
}

type Packed = { node: Node; group: string; depth: number; disc: Disc }

/** Packs a branch's children, then reports the branch's own enclosing disc and
 *  everything beneath it in the branch's local coordinates. */
function packNode(node: Node, group: string, depth: number): { r: number; inside: Packed[] } {
	if (node.children.length === 0) return { r: Math.sqrt(Math.max(node.value, 0)) || 1, inside: [] }
	const kids = node.children.map((kid) => packNode(kid, group, depth + 1))
	// A little air between siblings, so their outlines do not merge into one line.
	const discs = packDiscs(kids.map((kid) => kid.r * 1.06))
	const hull = enclose(discs)
	const inside: Packed[] = []
	node.children.forEach((kid, at) => {
		const disc = discs[at] as Disc
		const sub = kids[at] as { r: number; inside: Packed[] }
		const dx = disc.x - hull.x
		const dy = disc.y - hull.y
		inside.push({ node: kid, group, depth: depth + 1, disc: { x: dx, y: dy, r: sub.r } })
		for (const deeper of sub.inside) {
			inside.push({
				...deeper,
				disc: { x: deeper.disc.x + dx, y: deeper.disc.y + dy, r: deeper.disc.r },
			})
		}
	})
	return { r: hull.r * 1.04, inside }
}

/** Carbon's CirclePackChart: a hierarchy as circles inside circles. Each
 *  top-level group is one enclosing circle; what it holds is packed inside.
 *  Leaves carry the group's fill with nothing behind it, so a parent's outline
 *  shows through where circles are close. */
export function CirclePackChart(props: ChartProps<BaseChartOptions>) {
	const roots = createMemo(() => props.data.map(toNode))
	const chart = createChart({
		options: () => props.options,
		groups: () => roots().map((root) => root.name),
		table: () => hierarchyTable(roots()),
		overlap: true,
	})

	return (
		<ChartFrame chart={chart} class={props.class}>
			{(size) => {
				const packed = createMemo(() => {
					const groups = roots().filter((root) => chart.isActive(root.name))
					const subs = groups.map((group) => packNode(group, group.name, 0))
					const discs = packDiscs(subs.map((sub) => sub.r * 1.04))
					const hull = enclose(discs)
					const scale = (Math.min(size.width(), size.height()) / 2 - 4) / (hull.r || 1)
					const cx = size.width() / 2
					const cy = size.height() / 2
					const place = (disc: Disc, dx: number, dy: number): Disc => ({
						x: cx + (disc.x + dx - hull.x) * scale,
						y: cy + (disc.y + dy - hull.y) * scale,
						r: disc.r * scale,
					})
					const out: Packed[] = []
					groups.forEach((group, at) => {
						const disc = discs[at] as Disc
						const sub = subs[at] as { r: number; inside: Packed[] }
						out.push({
							node: group,
							group: group.name,
							depth: 0,
							disc: place({ x: 0, y: 0, r: sub.r }, disc.x, disc.y),
						})
						for (const inner of sub.inside) {
							out.push({ ...inner, disc: place(inner.disc, disc.x, disc.y) })
						}
					})
					// Parents first, so children are drawn over them.
					return out.sort((a, b) => a.depth - b.depth)
				})

				return (
					<For each={packed()}>
						{(item) => {
							const leaf = () => item.node.children.length === 0
							return (
								<g
									{...tipHandlers(chart, () => ({
										title: item.group,
										rows: [{ label: item.node.name, value: chart.format(item.node.value) }],
									}))}
								>
									<circle
										cx={item.disc.x}
										cy={item.disc.y}
										r={Math.max(0, item.disc.r)}
										stroke-width="2"
										{...(leaf()
											? paintThrough(chart.uid, chart.fillOf(item.group), "stroke-ink")
											: { class: "fill-white stroke-ink" })}
									/>
									<Show when={leaf() && item.disc.r > 22}>
										<PlateLabel
											x={item.disc.x}
											y={item.disc.y}
											anchor="middle"
											text={fitText(item.node.name, item.disc.r * 1.6)}
											on="plate"
										/>
									</Show>
								</g>
							)
						}}
					</For>
				)
			}}
		</ChartFrame>
	)
}

// ---------------------------------------------------------------------------
// tree

export type TreeChartOptions = BaseChartOptions & {
	tree?: {
		/** `dendrogram` lines every leaf up on the far edge, whatever its depth. */
		type?: "tree" | "dendrogram"
		/** Names the root when the data has several top-level nodes. */
		rootTitle?: string
	}
}

type Placed = { node: Node; depth: number; x: number; y: number; parent?: Placed }

/** Carbon's TreeChart: a hierarchy read left to right. Leaves take an even
 *  share of the height, and every branch sits level with the middle of what is
 *  under it.
 *
 *  Links are right-angled, not curved — a square elbow is the same flat 2px ink
 *  stroke as every other figure here, and it makes the levels line up as
 *  columns you can read down. */
export function TreeChart(props: ChartProps<TreeChartOptions>) {
	const root = createMemo<Node>(() => {
		const tops = props.data.map(toNode)
		const only = tops[0]
		if (tops.length === 1 && only) return only
		return {
			name: props.options?.tree?.rootTitle ?? "",
			children: tops,
			value: tops.reduce((total, top) => total + top.value, 0),
		}
	})
	const chart = createChart({
		options: () => props.options,
		groups: () => [],
		table: () => hierarchyTable([root()]),
	})

	return (
		<ChartFrame chart={chart} noLegend class={props.class}>
			{(size) => {
				const laid = createMemo(() => {
					const all: Placed[] = []
					let slot = 0
					let deepest = 0
					const walk = (node: Node, depth: number, parent?: Placed): Placed => {
						const placed: Placed = { node, depth, x: 0, y: 0, parent }
						all.push(placed)
						deepest = Math.max(deepest, depth)
						if (node.children.length === 0) {
							placed.y = slot++
						} else {
							const kids = node.children.map((kid) => walk(kid, depth + 1, placed))
							placed.y = ((kids[0]?.y ?? 0) + (kids.at(-1)?.y ?? 0)) / 2
						}
						return placed
					}
					walk(root(), 0)

					const longest = Math.max(
						...all.filter((p) => p.node.children.length === 0).map((p) => p.node.name.length),
						0,
					)
					const rootName = root().name.length
					const left = rootName ? Math.min(rootName, 14) * TICK_PX * 0.6 + 16 : 8
					const right = Math.min(longest, 22) * TICK_PX * 0.6 + 16
					const span = Math.max(20, size.width() - left - right)
					const rowHeight = (size.height() - 16) / Math.max(1, slot)
					const dendrogram = props.options?.tree?.type === "dendrogram"
					for (const placed of all) {
						const level = dendrogram && placed.node.children.length === 0 ? deepest : placed.depth
						placed.x = left + (level / Math.max(1, deepest)) * span
						placed.y = 8 + (placed.y + 0.5) * rowHeight
					}
					return { all, labelRoom: right - 16 }
				})

				return (
					<>
						<For each={laid().all}>
							{(placed) => (
								<Show when={placed.parent}>
									{(parent) => (
										<path
											d={`M${parent().x},${parent().y}H${
												(parent().x + placed.x) / 2
											}V${placed.y}H${placed.x}`}
											fill="none"
											stroke-width="2"
											class="stroke-ink"
										/>
									)}
								</Show>
							)}
						</For>
						<For each={laid().all}>
							{(placed) => {
								const leaf = () => placed.node.children.length === 0
								return (
									<g
										{...tipHandlers(chart, () => ({
											title: placed.node.name || "root",
											rows: [{
												label: leaf() ? "value" : "total",
												value: chart.format(placed.node.value),
											}],
										}))}
									>
										{/* Solid where it branches, open where it ends. */}
										<rect
											x={placed.x - 4}
											y={placed.y - 4}
											width="8"
											height="8"
											stroke-width="2"
											class={`stroke-ink ${leaf() ? "fill-white" : "fill-ink"}`}
										/>
										<Show when={placed.node.name}>
											<PlateLabel
												x={leaf() ? placed.x + 8 : placed.x - 8}
												y={leaf() ? placed.y : placed.y - 12}
												anchor={leaf() ? "start" : "end"}
												text={fitText(placed.node.name, leaf() ? laid().labelRoom : 120)}
												on={leaf() ? "bare" : "plate"}
												bold={!leaf()}
											/>
										</Show>
									</g>
								)
							}}
						</For>
					</>
				)
			}}
		</ChartFrame>
	)
}
