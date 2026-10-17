import { createMemo, For } from "solid-js"
import { FILLS } from "../alumina/Swatch/Swatch"
import { fitText, num, str, TICK_PX } from "./core"
import type { BaseChartOptions, ChartProps } from "./core"
import { paintThrough } from "./fills"
import { ChartFrame, createChart, PlateLabel, tipHandlers } from "./frame"

export type AlluvialChartOptions = BaseChartOptions & {
	alluvial?: {
		/** Which column each node belongs to. Columns are drawn left to right in
		 *  the order their categories first appear here. Without it, a node's
		 *  column is how many links it is from a source. */
		nodes?: { name: string; category?: string }[]
		/** Appended to values in the tooltip. */
		units?: string
	}
}

type FlowNode = { name: string; column: number; value: number; x: number; y: number; h: number }
type FlowLink = {
	source: FlowNode
	target: FlowNode
	value: number
	/** Where the ribbon leaves and arrives, top edge. */
	y0: number
	y1: number
	thickness: number
}

const NODE_WIDTH = 8
const NODE_GAP = 10

/** Carbon's AlluvialChart: how a total splits and recombines across stages.
 *  Data is `{ source, target, value }`, one row per flow.
 *
 *  Each node is an ink bar whose height is what passes through it; each flow is
 *  a ribbon as thick as its value. Ribbons wear their source's fill with nothing
 *  behind the ink, so where two cross you can follow both — Carbon does this
 *  with translucent colour, which is the same idea in a different material.
 */
export function AlluvialChart(props: ChartProps<AlluvialChartOptions>) {
	const flows = createMemo(() =>
		props.data
			.map((datum) => ({
				source: str(datum["source"]),
				target: str(datum["target"]),
				value: num(datum["value"]),
			}))
			.filter((flow) => !Number.isNaN(flow.value) && flow.value > 0)
	)

	const chart = createChart({
		options: () => props.options,
		groups: () => [],
		table: () => ({
			headers: ["source", "target", "value"],
			rows: flows().map((flow) => [flow.source, flow.target, flow.value]),
		}),
	})

	/** Column per node: from the options when given, else its distance from a
	 *  node nothing flows into. */
	const columns = createMemo(() => {
		const declared = props.options?.alluvial?.nodes
		const column = new Map<string, number>()
		if (declared?.length) {
			const categories = [...new Set(declared.map((node) => node.category ?? ""))]
			for (const node of declared) column.set(node.name, categories.indexOf(node.category ?? ""))
		}
		const names = [...new Set(flows().flatMap((flow) => [flow.source, flow.target]))]
		// Longest path from a source. Bounded by the node count, so a cycle in the
		// data cannot spin this forever.
		for (const name of names) if (!column.has(name)) column.set(name, 0)
		if (!declared?.length) {
			for (let pass = 0; pass < names.length; pass++) {
				let moved = false
				for (const flow of flows()) {
					const from = column.get(flow.source) ?? 0
					if ((column.get(flow.target) ?? 0) < from + 1) {
						column.set(flow.target, from + 1)
						moved = true
					}
				}
				if (!moved) break
			}
		}
		return { names, column }
	})

	return (
		<ChartFrame chart={chart} noLegend class={props.class}>
			{(size) => {
				const layout = createMemo(() => {
					const { names, column } = columns()
					const count = Math.max(1, ...names.map((name) => (column.get(name) ?? 0) + 1))
					const through = (name: string) =>
						Math.max(
							flows().filter((flow) => flow.source === name).reduce((t, f) => t + f.value, 0),
							flows().filter((flow) => flow.target === name).reduce((t, f) => t + f.value, 0),
						)

					const byColumn = Array.from({ length: count }, (_, at) =>
						names.filter((name) => (column.get(name) ?? 0) === at))
					// One scale for every column, set by whichever is tightest — a node
					// in one column must be comparable with a node in another.
					const height = size.height() - 8
					const scale = Math.min(
						...byColumn.map((members) => {
							const total = members.reduce((t, name) =>
								t + through(name), 0)
							return (height - NODE_GAP * Math.max(0, members.length - 1)) / (total || 1)
						}),
					)

					// Room either side for the outermost columns' labels.
					const widest = (members: string[]) =>
						Math.min(18, Math.max(0, ...members.map((name) => name.length))) * TICK_PX * 0.6 + 10
					const left = widest(byColumn[0] ?? [])
					const right = count > 1 ? widest(byColumn[count - 1] ?? []) : 0
					const span = Math.max(20, size.width() - left - right - NODE_WIDTH)

					const nodes = new Map<string, FlowNode>()
					byColumn.forEach((members, at) => {
						const used = members.reduce((t, name) => t + through(name) * scale, 0) +
							NODE_GAP * Math.max(0, members.length - 1)
						let y = 4 + (height - used) / 2
						for (const name of members) {
							const h = through(name) * scale
							nodes.set(name, {
								name,
								column: at,
								value: through(name),
								x: left + (count === 1 ? 0 : (at / (count - 1)) * span),
								y,
								h,
							})
							y += h + NODE_GAP
						}
					})

					// Ribbons stack down each node in the order of where they go, which
					// keeps them from crossing more than the data makes them.
					const out = new Map<string, number>()
					const into = new Map<string, number>()
					const links: FlowLink[] = [...flows()]
						.sort((a, b) =>
							(nodes.get(a.source)?.y ?? 0) - (nodes.get(b.source)?.y ?? 0) ||
							(nodes.get(a.target)?.y ?? 0) - (nodes.get(b.target)?.y ?? 0)
						)
						.flatMap((flow) => {
							const source = nodes.get(flow.source)
							const target = nodes.get(flow.target)
							if (!source || !target) return []
							const thickness = flow.value * scale
							const y0 = source.y + (out.get(source.name) ?? 0)
							const y1 = target.y + (into.get(target.name) ?? 0)
							out.set(source.name, (out.get(source.name) ?? 0) + thickness)
							into.set(target.name, (into.get(target.name) ?? 0) + thickness)
							return [{ source, target, value: flow.value, y0, y1, thickness }]
						})

					return { nodes: [...nodes.values()], links, count }
				})

				const ribbon = (link: FlowLink) => {
					const x0 = link.source.x + NODE_WIDTH
					const x1 = link.target.x
					const mid = (x0 + x1) / 2
					return `M${x0},${link.y0}C${mid},${link.y0} ${mid},${link.y1} ${x1},${link.y1}` +
						`L${x1},${link.y1 + link.thickness}` +
						`C${mid},${link.y1 + link.thickness} ${mid},${link.y0 + link.thickness} ${x0},${
							link.y0 + link.thickness
						}Z`
				}
				const units =
					() => (props.options?.alluvial?.units ? ` ${props.options.alluvial.units}` : "")
				const fillOf = (name: string) => {
					const sources = [...new Set(layout().links.map((link) => link.source.name))]
					// Skips "solid": a ribbon needs to be seen through.
					const palette = FILLS.filter((fill) =>
						fill !== "solid" && fill !== "open" && fill !== "gray"
					)
					return palette[sources.indexOf(name) % palette.length] ?? "hatch"
				}

				return (
					<>
						<For each={layout().links}>
							{(link) => (
								<path
									d={ribbon(link)}
									stroke-width="1"
									{...paintThrough(chart.uid, fillOf(link.source.name), "stroke-ink")}
									{...tipHandlers(chart, () => ({
										title: `${link.source.name} → ${link.target.name}`,
										rows: [{ label: "flow", value: `${chart.format(link.value)}${units()}` }],
									}))}
								/>
							)}
						</For>
						<For each={layout().nodes}>
							{(node) => {
								const last = () => node.column === layout().count - 1 && layout().count > 1
								return (
									<g
										{...tipHandlers(chart, () => ({
											title: node.name,
											rows: [{ label: "through", value: `${chart.format(node.value)}${units()}` }],
										}))}
									>
										<rect
											x={node.x}
											y={node.y}
											width={NODE_WIDTH}
											height={Math.max(1, node.h)}
											class="fill-ink"
										/>
										<PlateLabel
											x={last()
												? node.x + NODE_WIDTH + 4
												: node.column === 0
												? node.x - 4
												: node.x + NODE_WIDTH + 4}
											y={node.y + node.h / 2}
											anchor={node.column === 0 ? "end" : "start"}
											text={fitText(node.name, 110)}
											on={node.column === 0 || last() ? "bare" : "plate"}
										/>
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
