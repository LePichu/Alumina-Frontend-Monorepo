import { createMemo, For, Show } from "solid-js"
import { extent, formatNumber, num, str, TICK_PX } from "./core"
import type { BaseChartOptions, ChartProps } from "./core"
import { BAYER } from "./fade"
import { ChartFrame, createChart, tipHandlers } from "./frame"

/* ---- geometry in ---- */

type Position = [longitude: number, latitude: number]

/** As much of GeoJSON as a map of regions needs. */
export type GeoFeature = {
	type: "Feature"
	id?: string | number
	properties?: Record<string, unknown> | null
	geometry:
		| { type: "Polygon"; coordinates: Position[][] }
		| { type: "MultiPolygon"; coordinates: Position[][][] }
		| null
}

export type GeoFeatureCollection = { type: "FeatureCollection"; features: GeoFeature[] }

type TopoGeometry =
	| {
		type: "Polygon"
		arcs: number[][]
		id?: string | number
		properties?: Record<string, unknown>
	}
	| {
		type: "MultiPolygon"
		arcs: number[][][]
		id?: string | number
		properties?: Record<string, unknown>
	}
	| { type: "GeometryCollection"; geometries: TopoGeometry[] }
	| { type: null }

/** A TopoJSON topology: what Carbon's choropleth takes as `geoData`, and what
 *  every published world atlas is shipped as. */
export type GeoTopology = {
	type: "Topology"
	arcs: number[][][]
	transform?: { scale: [number, number]; translate: [number, number] }
	objects: Record<string, TopoGeometry>
}

/** TopoJSON to GeoJSON, for polygons.
 *
 *  The format stores each shared border once, as an arc; a region is a list of
 *  arc indices, negative ones meaning "that arc, backwards". Arcs are usually
 *  delta-encoded integers with a transform to undo. That is the whole of it —
 *  `topojson-client` does this and a good deal else, and its last release was
 *  in 2019.
 */
function fromTopology(topology: GeoTopology): GeoFeature[] {
	const { scale, translate } = topology.transform ?? { scale: [1, 1], translate: [0, 0] }
	const arcs: Position[][] = topology.arcs.map((arc) => {
		let x = 0
		let y = 0
		return arc.map((point): Position => {
			// With a transform, each point is a delta from the one before it.
			if (topology.transform) {
				x += point[0] ?? 0
				y += point[1] ?? 0
				return [x * scale[0] + translate[0], y * scale[1] + translate[1]]
			}
			return [point[0] ?? 0, point[1] ?? 0]
		})
	})

	const ring = (indices: number[]): Position[] => {
		const out: Position[] = []
		for (const index of indices) {
			const arc = index < 0 ? [...(arcs[~index] ?? [])].reverse() : (arcs[index] ?? [])
			// Consecutive arcs share an end point; keep it once.
			out.push(...(out.length > 0 ? arc.slice(1) : arc))
		}
		return out
	}

	const features: GeoFeature[] = []
	const walk = (geometry: TopoGeometry) => {
		if (geometry.type === "GeometryCollection") geometry.geometries.forEach(walk)
		else if (geometry.type === "Polygon") {
			features.push({
				type: "Feature",
				id: geometry.id,
				properties: geometry.properties ?? null,
				geometry: { type: "Polygon", coordinates: geometry.arcs.map(ring) },
			})
		} else if (geometry.type === "MultiPolygon") {
			features.push({
				type: "Feature",
				id: geometry.id,
				properties: geometry.properties ?? null,
				geometry: {
					type: "MultiPolygon",
					coordinates: geometry.arcs.map((polygon) => polygon.map(ring)),
				},
			})
		}
	}
	Object.values(topology.objects).forEach(walk)
	return features
}

/* ---- projections ---- */

/** Carbon passes D3's projection names through. These four are the ones a
 *  thematic map is drawn in. */
export type GeoProjection =
	| "geoEquirectangular"
	| "geoMercator"
	| "geoEqualEarth"
	| "geoNaturalEarth1"

const RAD = Math.PI / 180

/** Longitude and latitude in degrees to a flat plane, y pointing down. The
 *  results are in arbitrary units — the chart fits them to its box. */
const PROJECT: Record<GeoProjection, (position: Position) => [number, number]> = {
	geoEquirectangular: ([lon, lat]) => [lon * RAD, -lat * RAD],

	// Mercator runs to infinity at the poles; cut where every web map does.
	geoMercator: ([lon, lat]) => {
		const phi = Math.max(-85, Math.min(85, lat)) * RAD
		return [lon * RAD, -Math.log(Math.tan(Math.PI / 4 + phi / 2))]
	},

	// Šavrič, Patterson and Jenny's Equal Earth: areas are true, which is what a
	// choropleth should want — a tone covers as much map as its region covers
	// ground.
	geoEqualEarth: ([lon, lat]) => {
		const m = Math.sqrt(3) / 2
		const l = Math.asin(m * Math.sin(lat * RAD))
		const l2 = l * l
		const l6 = l2 * l2 * l2
		return [
			(lon * RAD * Math.cos(l)) /
			(m * (1.340264 + 3 * -0.081106 * l2 + l6 * (7 * 0.000893 + 9 * 0.003796 * l2))),
			-l * (1.340264 + -0.081106 * l2 + l6 * (0.000893 + 0.003796 * l2)),
		]
	},

	// Patterson's Natural Earth: a compromise, and Carbon's default.
	geoNaturalEarth1: ([lon, lat]) => {
		const phi = lat * RAD
		const p2 = phi * phi
		const p4 = p2 * p2
		return [
			lon * RAD *
			(0.8707 - 0.131979 * p2 + p4 * (-0.013791 + p4 * (0.003971 * p2 - 0.001529 * p4))),
			-phi * (1.007226 + p2 * (0.015085 + p4 * (-0.044475 + 0.028874 * p2 - 0.005916 * p4))),
		]
	},
}

/* ---- the chart ---- */

export type ChoroplethChartOptions = BaseChartOptions & {
	/** The regions: a GeoJSON FeatureCollection or a TopoJSON Topology. Required —
	 *  the chart ships no map of its own. */
	geoData?: GeoFeatureCollection | GeoTopology
	thematic?: {
		projection?: GeoProjection
	}
	choropleth?: {
		/** The datum key that names a region, matched against each feature's
		 *  `properties.name` (or `properties.NAME`, or its `id`). Defaults to
		 *  "name". */
		nameMapsTo?: string
		/** The datum key that carries the value. Defaults to "value". */
		valueMapsTo?: string
	}
}

/** The width of one class in the key, in px: room for a five-figure bound in
 *  10px type with air after it. */
const KEY_STEP = 64

/** How much of each 16-cell tile is inked, for the four classes. Never zero:
 *  white is "no data", so the lowest class must not look like it. */
const TONES = [2, 6, 11, 16] as const

/** Carbon's ChoroplethChart: regions shaded by a value.
 *
 *  Carbon shades with a colour ramp. Here the ramp is ink coverage — the same
 *  ordered dither the area fade uses, at four fixed densities, ending in solid.
 *  Four classes on equal steps between the smallest and largest value, because
 *  four tones are as many as the eye will reliably tell apart in one ink; white
 *  is kept for regions the data does not mention.
 *
 *  It is the one chart that needs more than data: a map. Pass GeoJSON or
 *  TopoJSON as `options.geoData`, as Carbon does. No atlas is bundled — which
 *  regions, at what detail, under what licence is a decision for the page that
 *  wants a map.
 *
 *  Borders are drawn twice: a white line under an ink hairline, so the edge
 *  between two regions that are both solid ink can still be seen.
 */
export function ChoroplethChart(props: ChartProps<ChoroplethChartOptions>) {
	const nameKey = () => props.options?.choropleth?.nameMapsTo ?? "name"
	const valueKey = () => props.options?.choropleth?.valueMapsTo ?? "value"

	const chart = createChart({
		options: () => props.options,
		groups: () => [],
		table: () => ({
			headers: [nameKey(), valueKey()],
			rows: props.data.map((datum) => [str(datum[nameKey()]), num(datum[valueKey()])]),
		}),
	})

	const features = createMemo((): GeoFeature[] => {
		const geo = props.options?.geoData
		if (!geo) return []
		return geo.type === "Topology" ? fromTopology(geo) : geo.features
	})

	const values = createMemo(() =>
		new Map(props.data.map((datum) => [str(datum[nameKey()]), num(datum[valueKey()])]))
	)
	const range = createMemo(() => extent([...values().values()]))

	const nameOf = (feature: GeoFeature) =>
		str(feature.properties?.["name"] ?? feature.properties?.["NAME"] ?? feature.id)

	/** Which of the four classes a value falls in, or -1 for no data. */
	const classOf = (value: number | undefined) => {
		if (value === undefined || Number.isNaN(value)) return -1
		const [low, high] = range()
		const share = (value - low) / (high - low || 1)
		return Math.min(TONES.length - 1, Math.floor(share * TONES.length))
	}

	/** The bounds of each class, for the key. */
	const steps = createMemo(() => {
		const [low, high] = range()
		return TONES.map((_, index) => low + ((high - low) * index) / TONES.length)
	})

	return (
		<ChartFrame chart={chart} noLegend class={props.class}>
			{(size) => {
				const project = () => PROJECT[props.options?.thematic?.projection ?? "geoNaturalEarth1"]
				// Room under the map for the key.
				const keyHeight = 28

				/** Every ring, projected once, with the bounds of the lot. */
				const projected = createMemo(() => {
					let minX = Number.POSITIVE_INFINITY
					let minY = Number.POSITIVE_INFINITY
					let maxX = Number.NEGATIVE_INFINITY
					let maxY = Number.NEGATIVE_INFINITY
					const shapes = features().map((feature) => {
						const polygons = feature.geometry?.type === "Polygon"
							? [feature.geometry.coordinates]
							: (feature.geometry?.coordinates ?? [])
						const rings = polygons.flatMap((polygon) =>
							polygon.map((ring) =>
								ring.map((position) => {
									const [x, y] = project()(position)
									if (x < minX) minX = x
									if (x > maxX) maxX = x
									if (y < minY) minY = y
									if (y > maxY) maxY = y
									return [x, y] as [number, number]
								})
							)
						)
						return { feature, rings }
					})
					return { shapes, minX, minY, maxX, maxY }
				})

				/** Fits the projected map into the box, keeping its proportions. */
				const paths = createMemo(() => {
					const { shapes, minX, minY, maxX, maxY } = projected()
					const width = size.width()
					const height = Math.max(20, size.height() - keyHeight)
					const spanX = maxX - minX || 1
					const spanY = maxY - minY || 1
					const scale = Math.min(width / spanX, height / spanY)
					const offsetX = (width - spanX * scale) / 2
					const offsetY = (height - spanY * scale) / 2
					return shapes.map(({ feature, rings }) => ({
						feature,
						d: rings
							.map((ring) =>
								`M${
									ring
										.map(([x, y]) =>
											`${((x - minX) * scale + offsetX).toFixed(1)},${
												((y - minY) * scale + offsetY).toFixed(1)
											}`
										)
										.join("L")
								}Z`
							)
							.join(""),
					}))
				})

				const fillOf = (feature: GeoFeature) => {
					const tone = classOf(values().get(nameOf(feature)))
					return tone < 0 ? "#fff" : `url(#${chart.uid}-tone-${tone})`
				}

				return (
					<>
						<defs>
							<For each={TONES}>
								{(level, index) => (
									<pattern
										id={`${chart.uid}-tone-${index()}`}
										width="8"
										height="8"
										patternUnits="userSpaceOnUse"
									>
										<rect width="8" height="8" class="fill-white" />
										<For each={BAYER}>
											{(row, y) => (
												<For each={row}>
													{(threshold, x) => (
														<Show when={threshold < level}>
															<rect x={x() * 2} y={y() * 2} width="2" height="2" class="fill-ink" />
														</Show>
													)}
												</For>
											)}
										</For>
									</pattern>
								)}
							</For>
						</defs>

						<Show
							when={features().length > 0}
							fallback={
								<text
									x={size.width() / 2}
									y={size.height() / 2}
									text-anchor="middle"
									font-size={String(TICK_PX)}
									class="fill-ink"
								>
									No map: pass regions as options.geoData.
								</text>
							}
						>
							{/* Fills, each with a white seam, then every border as an ink hairline. */}
							<For each={paths()}>
								{(shape) => (
									<path
										d={shape.d}
										fill={fillOf(shape.feature)}
										fill-rule="evenodd"
										stroke-width="3"
										stroke-linejoin="round"
										class="stroke-white"
										{...tipHandlers(chart, () => {
											const value = values().get(nameOf(shape.feature))
											return {
												title: nameOf(shape.feature),
												rows: [{
													label: valueKey(),
													value: value === undefined || Number.isNaN(value)
														? "no data"
														: chart.format(value),
												}],
											}
										})}
									/>
								)}
							</For>
							<For each={paths()}>
								{(shape) => (
									<path
										d={shape.d}
										fill="none"
										stroke-width="1"
										stroke-linejoin="round"
										class="pointer-events-none stroke-ink"
									/>
								)}
							</For>

							{/* The key: the four tones in order, each over its lower bound. */}
							<g>
								<For each={TONES}>
									{(_, index) => (
										<>
											<rect
												x={index() * KEY_STEP}
												y={size.height() - keyHeight + 6}
												width={KEY_STEP}
												height="10"
												fill={`url(#${chart.uid}-tone-${index()})`}
												stroke-width="1"
												class="stroke-ink"
											/>
											<text
												x={index() * KEY_STEP}
												y={size.height() - 1}
												font-size="10"
												class="fill-ink"
											>
												{formatNumber(steps()[index()] ?? 0)}
											</text>
										</>
									)}
								</For>
								<text
									x={TONES.length * KEY_STEP}
									y={size.height() - 1}
									text-anchor="end"
									font-size="10"
									class="fill-ink"
								>
									{formatNumber(range()[1])}
								</text>
							</g>
						</Show>
					</>
				)
			}}
		</ChartFrame>
	)
}
