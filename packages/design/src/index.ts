/// <reference path="./solid-jsx.d.ts" />
/// <reference path="./icons/carbon-icons.d.ts" />

// The two references above are load-bearing for consumers. Both files are ambient
// (`declare module`), so they are pulled in by this package's own tsconfig
// `include` but do NOT travel through the module graph — an app that imports
// @alumina/design from source would typecheck design's .tsx without them and fail
// on every @carbon/icons deep import and on attr:focusable. Referencing them from
// the barrel puts them in every consumer's program too.

export * from "./icons"
export * from "./carbon"
export * from "./alumina"
export * from "./charts"
