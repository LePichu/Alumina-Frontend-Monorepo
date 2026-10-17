/** Carbon Charts, ported.
 *
 *  The same chart names, the same `data` + `options` props and the same tabular
 *  data shapes as @carbon/charts, so Carbon's chart docs work as the spec — with
 *  one substitution throughout: where Carbon separates series by colour, these
 *  separate them by fill pattern, dash rhythm and marker shape.
 *
 *  All twenty-five charts, and the frame Carbon puts round each: "show as
 *  table", export as CSV or PNG, a loading skeleton (`data.loading`), and a zoom
 *  bar on the charts with a continuous x axis.
 *
 *  ChoroplethChart draws a map it is handed (`options.geoData`, GeoJSON or
 *  TopoJSON). None is bundled.
 */

export type { AxisOptions, BaseChartOptions, ChartProps, Datum, ScaleType } from "./core"
export type { CartesianOptions } from "./cartesian"

export { GroupedBarChart, SimpleBarChart, StackedBarChart } from "./bar"
export type { BarChartOptions } from "./bar"

export {
	AreaChart,
	BubbleChart,
	LineChart,
	LollipopChart,
	ScatterChart,
	Sparkline,
	StackedAreaChart,
} from "./line"
export type { BubbleChartOptions, LineChartOptions, SparklineOptions } from "./line"
export type { FadeKind } from "./fade"

export { BoxplotChart, BulletChart, ComboChart, HistogramChart } from "./stat"
export type { ComboChartOptions, ComboChartType } from "./stat"

export { DonutChart, GaugeChart, PieChart, RadarChart } from "./radial"
export type {
	DonutChartOptions,
	GaugeChartOptions,
	PieChartOptions,
	RadarChartOptions,
} from "./radial"

export { MeterChart } from "./meter"
export type { MeterChartOptions, MeterStatus } from "./meter"

export { HeatmapChart } from "./matrix"
export type { HeatmapChartOptions } from "./matrix"

export { CirclePackChart, TreeChart, TreemapChart } from "./hierarchy"
export type { TreeChartOptions } from "./hierarchy"

export { AlluvialChart } from "./flow"
export type { AlluvialChartOptions } from "./flow"

export { WordCloudChart } from "./wordcloud"
export type { WordCloudChartOptions } from "./wordcloud"

export { ChoroplethChart } from "./geo"
export type {
	ChoroplethChartOptions,
	GeoFeature,
	GeoFeatureCollection,
	GeoProjection,
	GeoTopology,
} from "./geo"

export type { ZoomBarOptions } from "./zoom"
