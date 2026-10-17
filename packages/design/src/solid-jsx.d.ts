import "solid-js"

/** Solid leaves ExplicitAttributes empty for exactly this: declaring the
 *  attributes it does not type, so `attr:<name>` becomes available. */
declare module "solid-js" {
	namespace JSX {
		interface ExplicitAttributes {
			/** Legacy SVG attribute Carbon sets on every icon. Not in SvgSVGAttributes. */
			focusable: string
		}
	}
}
