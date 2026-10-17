# Alumina — frontend monorepo

Alumina is an open-source ecosystem around the Alumina Z1, a desktop PCB printer (FDM-printed
substrate, conductive ink in printed channels). This repo holds its web side: one design system
and the apps built on it.

Three single-file HTML prototypes already exist (slicer, hub, agent). The job now is to build the
design system properly, then re-implement those prototypes on top of it as real apps.

## Packages

| Package            | Dir                | What it is                                        | Framework                 | Status                |
|--------------------|--------------------|---------------------------------------------------|---------------------------|-----------------------|
| `@alumina/design`  | `packages/design`  | Carbon ported to monochrome neo-brutalism, plus Alumina's own components | Solid library + Tailwind theme | **Build first** |
| `@alumina/slicer`  | `packages/slicer`  | **foundry**, the slicer GUI                       | SolidStart, `ssr: false`  | Home reworked; in `AppShell` |
| `@alumina/desktop` | `packages/desktop` | The desktop app: foundry in a frameless window    | Tauri 2                   | Running; not packaged |
| `@alumina/hub`     | `packages/hub`     | **quarry**, "HuggingFace for PCBs"                | SolidStart, SSR           | Ported; no backend    |
| `@alumina/agentic` | `packages/agentic` | **kiln**, the PCB agent UI                        | SolidStart, SSR           | Ported; no backend    |
| `@alumina/eda`     | `packages/eda`     | HTML → EDA pipeline                               | —                         | **Frozen**            |
| `@alumina/www`     | `packages/www`     | Public website                                    | Astro (when work starts)  | **Frozen**            |

- Product names (foundry, quarry, kiln) are what users see in UI copy. Package names are functional.
- **Naming: the tools underneath are named for stones, the apps people use for the factory.** mica
  is the engine that turns an IPC-2581 file into a print, shale turns geometry into G-code; the
  apps are foundry (the slicer), kiln (the agent) and quarry (the hub). The slicer GUI wore the
  engine's name until 2026-10-14, and older comments still call it mica. Where the *engine* is
  meant, it stays mica: `src/lib/mica.ts`, quarry's "mica validation", "mesh from mica".
  "foundry" was picked when no settled name could be found; it is one constant
  (`packages/slicer/src/lib/app.ts`) plus copy, if it changes.
- `shale` (geometry → G-code) and the Rust crates are not in this repo.
- The old `@magnolia-cove/*` scope is retired. Rename anything still using it to `@alumina/*`.

## Repo layout

```
CLAUDE.md
package.json            private; workspace scripts only; packageManager pinned
pnpm-workspace.yaml     packages: ["packages/*"]
tsconfig.base.json      shared strict config; every package extends it
docs/prototypes/        reference HTML demos (read-only)
  mica.html               → slicer, and the origin of the visual language
  quarry.html             → hub
  kiln.html               → agentic
packages/
  design/  slicer/  hub/  agentic/  desktop/  eda/  www/
scripts/                PowerShell scripts (Verb-Noun)
  Start-DevServer.ps1     starts an app's dev server unless its port already answers
  Register-DesktopEntry.ps1  the desktop app's .desktop entry and icons, so the desktop knows it
```

- Dependency direction: apps → `@alumina/design`. Apps never import from each other, and `design`
  imports from no app.
- `@alumina/design` is consumed from source: its `exports` use the `solid` condition and point at
  `src/`, so each app's Solid plugin compiles it. No build step until something outside the repo
  needs one. It also exports `./theme.css`.
- Every package has `dev` and `typecheck` scripts; apps also have `build`. `design`'s `dev` runs
  the component playground. `desktop`'s `typecheck` is `cargo check`, and its `build` compiles
  the app without packaging it; `bundle` makes the installers.
- Don't create new packages without asking. If two apps start duplicating code, flag it rather
  than extracting it yourself.

## Environment

- Every dev tool (Node, pnpm, …) lives inside the distrobox container **`my-distrobox`**, but
  Claude Code itself runs on the **host**, which has no Node or pnpm at all. Wrap dev commands:
  `distrobox enter my-distrobox -- bash -lc '…'`. Don't use `distrobox-host-exec` or anything else
  that reaches further onto the host.
- **Node 24 is not the container default.** The container's `node` is 22; Node 24 is installed
  beside it as Fedora's `nodejs24` (`/usr/bin/node-24`, no `alternatives` entry, so nothing else in
  the container was disturbed). This repo requires it — `@solidjs/start` declares
  `engines.node >= 24`. Select it with the PATH shim, which holds `node`/`npm`/`npx` symlinks:

  ```bash
  export PATH=$HOME/.local/share/alumina-node24:$PATH
  ```

  Prefix every `pnpm` invocation with that, or pnpm runs under Node 22 and the engine check fails.
- If a tool is missing, install it inside the container and say what you installed.
- The container has three browser engines for checking work: `chromium-browser`, `firefox`, and
  WebKitGTK (`WebKitWebDriver` driving `/usr/libexec/webkit2gtk-4.1/MiniBrowser`). Run WebKit
  under `xvfb-run` with `GDK_BACKEND=x11` and `WAYLAND_DISPLAY` unset, or its window opens on
  the desktop.
- Distrobox shares the host's network, so dev servers on `localhost` open in the host browser.
- The desktop app needs Rust and Tauri's Linux libraries, and the container has both: `cargo` and
  `rustc` 1.96 under `~/.cargo`, and `webkit2gtk4.1-devel`, `libsoup3-devel`,
  `libappindicator-gtk3-devel`, `librsvg2-devel`, `openssl-devel`. A Tauri window opens on the
  host's desktop; to check one without that, run it under `xvfb-run` and capture the display.
- Scripts in `scripts/` are PowerShell 7 (`pwsh`, present on both host and container). Claude Code's
  own shell tool is bash, so ad-hoc commands it runs are bash; committed scripts stay PowerShell.
- Node 24+ (SolidStart 2 requires it), pnpm, Vite 8.
- Scripts in `scripts/` use approved verbs (check with `Get-Verb`) and singular PascalCase nouns,
  e.g. `Start-DevServer.ps1`, never `utils.ps1`. Use `[CmdletBinding()]`, typed `param()` blocks
  and `$ErrorActionPreference = 'Stop'`.

## Commands

Inside `my-distrobox`, with the Node 24 shim on PATH (see Environment):

```powershell
pnpm install
pnpm dev                               # all four at once (not the desktop app)
pnpm dev:apps                          # the three apps, without the playground
pnpm dev:desktop                       # foundry in its desktop window, over the slicer's dev server
pnpm --filter @alumina/design dev      # component playground, port 4200 (+ /app-icon.html)
pnpm --filter @alumina/slicer dev      # foundry, port 4300
pnpm --filter @alumina/hub dev         # quarry, port 4400
pnpm --filter @alumina/agentic dev     # kiln,   port 4500
pnpm -r typecheck
pnpm -r build
pnpm --filter @alumina/desktop bundle  # the desktop installers
pnpm fmt                               # deno fmt
pnpm lint                              # deno lint
```

Ports are pinned with `strictPort`, so all four run side by side and a clash fails
loudly instead of landing on a neighbour's port.

Run `pnpm -r typecheck`, and build every app you touched, before calling a task done.

## Stack and dependencies

- **Solid 1.x + SolidStart 2.** SolidStart 2 runs on Vite 8 with its config in `vite.config.ts`
  (there is no `app.config.ts`). It is stable but in maintenance mode, and Solid 2.0's start mode is
  its successor. Don't migrate to Solid 2 or start mode without asking, and check the `solid-js`
  peer range of Corvu and every other Solid dependency before any Solid upgrade.
- **Corvu** wherever it has a primitive: Dialog, Popover, Tooltip, Accordion, Disclosure, Drawer,
  Resizable. It's in the stack because it covers most overlays and behaves properly on mobile.
  Everything it lacks is hand-rolled (see the design system section).
- **Tailwind v4**, CSS-first. No `tailwind.config.js`.
- **Carbon** through `@carbon/icons` only. The components are ported, not installed.
- **IBM Plex Mono**, self-hosted so apps work offline. No Google Fonts CDN.
- **three.js** for 3D (slicer renderer, hub hero). **Shiki** for code, bundled.
- Before adding a dependency, check npm for the current release; don't trust remembered version
  numbers. Prefer actively maintained packages and flag stale ones instead of adding them.
- Don't add: another component kit (Kobalte, Ark, etc.), any Carbon runtime package, CSS-in-JS, or
  a task runner (Turborepo, Nx).

## Design system (`@alumina/design`)

**A full port of Carbon to monochrome neo-brutalism, plus Alumina's own components.**

```
packages/design/src/
  theme.css        the one stylesheet: tokens, keyframes, a few utilities, element defaults
  carbon/          Carbon ports, one folder per component family, Carbon names
  charts/          Carbon Charts ports, Carbon names, one file per chart family
  alumina/         Alumina's own components
  icons/           Icon, over @carbon/icons
  internal/        what components share with each other; not exported
  playground/      every component in every state
  tools/           pages made with the system, served beside the playground (not exported)
  index.ts
```

### Inside the package

`internal/` is where a decision that several components share is made once. Reach for it before
writing the same thing in a second component, and add to it when a third copy appears.

- **`field.tsx`** — what every field is made of. `Field` wraps a control with its label and its
  message in one of three layouts: stacked, `inline`, or fluid (by context — see "A fluid field
  is a cell" under Look).
  The surfaces are named: `FIELD_BASE` (the recess), `FIELD_GROUP` (a recess holding an input and
  a tool), `FIELD_INNER`, `FIELD_BARE`. `fieldProps(props)` is the part of a field's props to
  spread onto `Field`; `describedBy(id, props)` is its `aria-describedby`, set only while there
  is a message to point at.
- **`listbox.tsx`** — `PickerField` (pressed: Select, Dropdown, MultiSelect) and `ComboField`
  (typed into: ComboBox, FilterableMultiSelect), `ListOption`, `ListGroup`. One trigger, one list,
  one set of keys.
- **`control.ts`** — `createControllable` and `createId`. **The rule for a controllable prop:**
  a value *with* its change handler is controlled, and the prop always wins; a value *without* a
  handler is where the component starts, and it looks after itself from there (starting over
  whenever the prop moves); neither is the component's own. A control that takes a press and does
  not move is broken, not controlled — something that must not change says `readOnly` or
  `disabled`.
- **`roving.ts`** — arrows, Home, End and type-ahead for a list that holds real focus (menus,
  listboxes, the tree with `wrap: false`), and `focusRow` for Corvu's `onInitialFocus`.
- **`marks.tsx`** — `CheckMark` and `RadioMark`, the two 16px boxes a choice is drawn with.
- **`styles.ts`** — the class strings more than one component is made of: `LABEL` (the label
  voice), `BOX`, `FLOATING_SURFACE`, `INK_BAR` and its one `INK_BAR_CONTROL`, `SCRIM`,
  `DIALOG_SURFACE`, `RULED_GRID`, `PRESS`. A redesign of any of these is a one-line change.
- **`severity.ts`** — `STATUS_GLYPH`: which glyph says error, warning, success, info.
- **`scroll.tsx`** — the scrollbar, which is drawn here and not by the browser: `Scroller` (a
  pane that scrolls, and its gutters), `ScrollTrack`, and `createScrollbars` for the two things
  that cannot be wrapped in a `Scroller` — a `<textarea>` and the page. **A pane that scrolls
  is `relative`.** Every checkbox, radio and toggle hides its real input with `sr-only`, which is
  absolute, and an absolute element whose containing block is outside a scroller is neither
  clipped nor scrolled by it: a long layer tree's hidden inputs once reached past the window and
  made foundry's whole page scroll, bar and all. Anything else that scrolls must be positioned
  for the same reason.
- **`skeleton.ts`** — `SKELETON`, the class a skeleton block wears. Import it rather than
  writing the class: loading this module is what keeps every skeleton fading in step.

Rules that go with it:

- **A family shares a folder; unrelated components do not.** `Tile/` holds every tile, `Menu/`
  every menu, `Notification/` all four notifications. `Modal` is `ComposedModal`'s parts in the
  usual arrangement, not a second dialog.
- **`carbon/index.ts` is derived, not curated**: every export of every `.tsx` in a component
  folder is public, except `SCREAMING_CASE` constants, which components share among themselves.
  Helper modules are lowercase `.ts` (`dates.ts`, `highlight.ts`) and are not public. So adding a
  component is writing its file; forgetting to export a prop type is not possible.
- **Imports run from far to near**: packages, `@carbon/icons`, then `icons/`, `internal/`,
  sibling folders, the same folder. A type import follows its value import.
- **Slots.** A JSX prop is a getter, and each read builds a new tree. Testing a slot and then
  placing it (`<Show when={props.x}>{props.x}</Show>`) inserts a different node than the one
  tested, which desyncs hydration — so resolve it once with `children(() => props.x)` and use
  that. Two riders: to ask only *whether* a slot was passed, ask the props object
  (`"helperText" in props`) rather than reading it; and a slot that renders inside a portal
  (a dialog's header, a modal's side nav) must be resolved by a component that is itself inside
  the portal, never in the body of the component that owns the dialog — the server emits nothing
  for a closed portal, and resolving early builds DOM it has no markers for.

### The Carbon port

The goal is Carbon's whole component catalogue and its whole icon set. Take the inventory from
Carbon's current component list at carbondesignsystem.com; check it rather than working from
memory.

Order of work:
1. What the three apps need: `Button`, `IconButton`, `ContentSwitcher`, `Tabs`, `Search`,
   `TextInput`, `TextArea`, `NumberInput`, `Select`, `Checkbox`, `RadioButtonGroup` (helper text
   per option), `Slider` (tick marks, live readout), `Toggle`, `Tag`, `Tile`, `Breadcrumb`,
   `Modal` (including two-pane with side nav), `OverflowMenu`, `Tooltip`, `InlineNotification`,
   `ProgressIndicator`, `DataTable`, `CodeSnippet`, `FileUploaderDropContainer`. **Done.**
2. What the apps turned out to be drawing by hand: `Accordion`, `ContainedList`, `FormGroup`,
   `Link`, `StructuredList`, vertical `Tabs` (`TabsVertical`, `TabListVertical`), the `Tile`
   family (`TileSection`, `ClickableTile`, `TileGroup` + `RadioTile`), and Carbon's `inline` field
   layout on `TextInput`, `NumberInput`, `Select` and `Toggle`. **Done.**
3. Carbon Charts — see below. **Done.**
4. The rest of the catalogue, checked against `@carbon/react` 1.118.0's own exports. **Done**,
   with a short list of things that are deliberately not ported:
   - **Not built: Carbon's `dismissable` `Tabs`.** `Tabs` claim their index once, at creation,
     which a tab that can be removed breaks. `AppShell`'s strip is tabs that open and close, and
     it keys them by id itself; give `Tabs` the same treatment if something else needs it.
   - **Not ported, on purpose.** Carbon's infrastructure, which has no meaning here
     (`ClassPrefix`, `IdPrefix`, `FeatureFlags`, `LayoutDirection`, `Theme`, `Layer`: there is
     one theme and no elevation layers). Its legacy aliases (`PrimaryButton`, `SecondaryButton`,
     `DangerButton`, `ModalWrapper`). `ErrorBoundary`, which is Solid's own. And `PageHeader`,
     which Carbon has deprecated while still in preview.
5. Carbon's preview and unstable components, ported as they stand in `@carbon/react` 1.118.0.
   **Done.** Their names and props are Carbon's and will move when Carbon's do; when they
   graduate, check them against the stable API. `IconIndicator`, `ShapeIndicator`, `AISkeleton*`,
   `ChatButton`, `Card` and its parts, the native-`<dialog>` `Dialog` and its parts,
   `OverflowMenuV2`, the two-handle `Slider` (`unstable_valueUpper`), and the **fluid forms**:
   `FluidForm` and `FluidTextInput`, `FluidPasswordInput`, `FluidTextArea`, `FluidNumberInput`,
   `FluidSearch`, `FluidSelect`, `FluidDropdown`, `FluidComboBox`, `FluidMultiSelect`,
   `FluidDatePicker`(`Input`), `FluidTimePicker`(`Select`), each with its skeleton.

6. **UI Shell**, whose anatomy `AppShell` follows. **Done**: `Header`, `HeaderContainer`,
   `HeaderMenuButton`, `HeaderName`, `HeaderNavigation`, `HeaderMenu`, `HeaderMenuItem`,
   `HeaderGlobalBar`, `HeaderGlobalAction`, `HeaderPanel`, `HeaderSideNavItems`, `SkipToContent`,
   `SideNav` (default, `isFixedNav`, `isRail`), `SideNavItems`, `SideNavItem`, `SideNavIcon`,
   `SideNavLink`, `SideNavLinkText`, `SideNavMenu`, `SideNavMenuItem`, `SideNavDivider`,
   `Switcher`, `SwitcherItem`, `SwitcherDivider`, `Content`. Two things differ from Carbon on
   purpose: nothing is `position: fixed` — the header and the side nav are laid out by what holds
   them, so nothing needs a magic inset to clear them — and the bar is ink cells that invert when
   active. Not ported: `SideNavHeader`, `SideNavDetails`, `SideNavFooter` and `SideNavSwitcher`,
   which Carbon keeps for older layouts.

What was added in that pass, by family — Carbon's docs are the spec for each:
- **Data:** `DataTable` (the render-prop wrapper: sort, filter, select, expand, batch actions)
  over `Table` and its parts (`TableContainer`, `TableToolbar`, `TableToolbarSearch`,
  `TableBatchActions`, `TableSelectAll`/`Row`, `TableExpandHeader`/`Row`/`ExpandedRow`),
  `DataTableSkeleton`, `Pagination`, `PaginationNav`, `TreeView`, `StructuredList` `selection`,
  `ContainedList` `kind="disclosed"`.
- **Overlays:** `Popover`, `Toggletip`, `DefinitionTooltip`, `Menu` (with submenus, selectable
  and radio items), `MenuButton`, `ComboButton`, `useContextMenu`, `AILabel`, `ComposedModal`.
- **Pickers:** `Dropdown`, `ComboBox`, `MultiSelect`, `FilterableMultiSelect`, `DatePicker` (on
  Corvu Calendar), `TimePicker`, `SelectItemGroup`.
- **Fields and forms:** `PasswordInput`, counters on `TextInput`/`TextArea`, `Form`, `FormItem`,
  `FormLabel`, `CheckboxGroup`, `ButtonSet`, `CopyButton`, `Copy`, `ExpandableSearch`, the whole
  `FileUploader` family.
- **Feedback:** `Loading`, `InlineLoading`, `ProgressBar`, `ToastNotification`,
  `ActionableNotification`, `Callout`, `SkeletonText`/`Placeholder`/`Icon` and a skeleton per
  component.
- **Structure:** `OrderedList`/`UnorderedList`/`ListItem`, `Heading`/`Section`, `Stack`,
  `AspectRatio`, `Grid`/`Column`, and the tag, tile and tab variants (`DismissibleTag`,
  `OperationalTag`, `SelectableTag`, `SelectableTile`, `ExpandableTile`, `IconTab`).

Carbon supplies the component names, anatomy, interaction states (hover, focus, active, disabled,
invalid, read-only, skeleton), accessibility behaviour, icons, and prop vocabulary (`kind`, `size`,
…). Keep all of these so Carbon's usage docs work as the spec.

Carbon is not a runtime dependency. Don't install `@carbon/react`, `@carbon/web-components` or
`@carbon/styles`. Every one of their styles would be overridden, and the web components' shadow DOM
fights Tailwind. The components are Solid and are built here.

- A `Tag` has exactly three values: ink on white, ink on `--color-field` (`muted`), or white on ink
  (`solid`). `solid` states something about the thing it sits on ("Public"); plain is for a list the
  eye skims, like topics.
- Props that exist only to pick a colour (e.g. Tag `type`) are dropped. Status props
  (`kind="error"`, `"warning"`, `"info"`, `"success"`) keep their meaning through icon and label.
- Where Corvu has a primitive, build on it: Dialog for `Modal`, Popover for popovers, toggletips
  and menu positioning, Tooltip, Accordion, Disclosure, Drawer, Resizable.
- Everything else is hand-rolled on the WAI-ARIA Authoring Practices patterns: selects, dropdowns
  and combo boxes, menus, `Tabs`, `ContentSwitcher`, `Checkbox`, `RadioButton`, `Slider`, `Toggle`,
  `NumberInput`, `DatePicker`, and so on.
- Hand-rolled controls must match Corvu on mobile. Keyboard, pointer and touch all work. Use pointer
  events, not mouse events. Hit areas are at least 44px even when the visual is smaller. Check every
  control at a phone viewport.
- `Icon` renders `@carbon/icons` descriptors at 16, 20, 24 or 32, in ink. Don't paste SVG path
  strings from the prototypes. Those sizes are rem (`size-4`, `size-icon`, `size-6`, `size-8`),
  so an icon follows the root font size like the text beside it; don't size one in pixels.

### Alumina's own components

These live in `src/alumina/` and are added as the apps need them, not ahead of time.

- **`Background`** is the first, and carries both of mica's backdrops behind all content:
  `variant="grid"` is the synthwave tile floor (sky + perspective fan + moving rows), and
  `variant="sheet"` is the still blueprint grid. `static` freezes the grid's rows without
  swapping variant. The sheet's grids are one cell drawn and tiled (`background-size`), not the
  prototype's repeating gradients: at a fractional device pixel ratio (150% zoom) WebKit rounded
  each stop of a long repeating ramp on its own and the hairlines smeared into a grey wash. Motion stops under `prefers-reduced-motion`, which is the same state `static`
  produces. The floor is **the prototype's own mechanism**: one full-viewport element carrying one
  background stack — horizon rule, eight rows, and the fan as the bottom layer (`floor-grid` in
  `theme.css`). A version built from a bottom strip, an inline `<svg>` fan and a separate horizon
  matched every value and still rendered differently, because an inline SVG rasterises
  differently from the same SVG as a sized background layer; it was replaced to get 1:1. Don't
  rebuild it from parts.
- **`BoardView`** draws a printed board: flat white faces, ink edges, orthographic camera, and a
  clipping plane driven by a `reveal` prop. Both apps need it — mica reveals layer by layer while
  slicing, quarry sweeps the same clip upward to look like printing — so it lives here and neither
  app owns a copy. It draws and stops: a caller that wants animation animates `reveal`, which keeps
  "how fast does it print" out of the renderer. `transparent` lets the page backdrop show through;
  `angle`, `spin` and `fitToken` are passed in, so it never owns input. (This reverses the earlier
  rule that the renderers stay in their apps.) **`ink`** is a second solid drawn in ink under the
  same clip — a slab's conductors. **`snapshotBoard`** is the same drawing as a
  still — an image's address, rendered once and the context let go — for where a live view would
  be one WebGL context too many: foundry's gallery of recent boards and a board tab's card.
  Until it has geometry it shows the `Loading` cells (`fallback` names what is loading), or
  `error`'s words with the error glyph — never a line of "Loading…" text.
- **`Swatch`** is a small ink-bordered square carrying one fill from the fill vocabulary
  (`solid`, `hatch`, `dots`, `gray`, `cross`, `open`, `back`, `lines`, `bars`, `grid`,
  `checker`). Filled means live, done or on; open means not; any other fill is identity. All three
  apps had drawn it by hand. Its border is `currentColor`, so it survives on an ink ground.
- **`CheckList`** / `CheckListItem` is a list of things that were checked and how each came out,
  built on `ContainedList`: a severity glyph, a label, an optional detail line, and optionally the
  verdict spelled out — `ok`, `note` (worth knowing, not a problem: mica's notes), `warning`,
  `error`. mica's findings, quarry's validation and build log, and kiln's reply
  checks are all this. It exports the shared `Severity` union.
- **`ScrollArea`** is a pane that scrolls inside a fixed layout: the system's scrollbar, and a
  white fade at whichever edge has more to read (`fade={false}` for a pane with no ground of its
  own, like foundry's lanes). **In an app, anything that scrolls is one of these** — the browser's
  own scrollbars are switched off, so a bare `overflow-auto` scrolls and shows nothing. `axis`
  is `"y"` unless told `"x"` or `"both"`; `class` goes on the pane, `frameClass` on the frame.
- **`PageScrollbar`** is the same scrollbar for the page itself. Mount one in an app whose
  pages scroll (quarry has it in `Shell`); a fixed-window app (foundry, kiln) has none. The page
  is inset by its gutter, so a block whose *ground* must reach the window's edge — quarry's ink
  footer — takes the `page-bleed` utility and runs under the gutter; without it a strip of
  backdrop shows down the side of the block. That is also why the page's thumb is white under
  `mix-blend-difference` rather than ink: it shows as the inverse of whatever it is over — ink on
  the page, white on the footer — where an ink thumb vanished into an ink footer.
- **`Avatar`** is a person as a square: the image, else initials on ink, else a glyph. Carbon's
  core has none; the props follow Carbon for IBM Products' `UserAvatar`. kiln's rail and settings
  and quarry's nav had each drawn it as a bordered `<img>`.
- **`Drawer`** is a sheet that slides in from an edge, on Corvu Drawer. It is where a column goes
  when there is no room to stand it: kiln's rail and quarry's search facets are a column beside
  the content on a desktop and a drawer on a phone — the same content either way. Dressed like a
  Modal, because it is one.
- **`FileDrop`** is a part of a page that takes files dropped anywhere on it — a home screen's
  column, not a box to aim at (that is `FileUploaderDropContainer`, which can sit inside one; a
  drop on the box is the box's and is not taken twice). It draws nothing until files are held
  over it, then covers itself in a drop box — the dashed ink edge on white (it was the drop
  container's held grey, which over a whole column read as a dark slab) — and says what letting go
  will do — or, with a **`FileDropCover`** inside it, covers that instead: foundry's Home takes a
  board dropped anywhere in its column and shows the dropper over the recent boards, where the
  board will join them. Only a drag carrying files lights it. `accept` filters by ending, and what is not
  taken goes to `onReject` so the page can say why. Dropping is a mouse's gesture: a page that
  takes files this way also has a control that opens a picker.
- **`IconButtonGroup`** is a cluster of independent icon actions in one ink box, ruled apart by
  the grid's own gaps (`RULED_GRID`). It has the content switcher's anatomy and is deliberately
  not one: a switcher is a tablist with one item selected, and these are actions. Not a Carbon
  component, so it lives here.
- **`AppShell`** is the frame an app lives in: a title bar, a strip of open pages, and the
  page. It follows the UI Shell's anatomy (a header, a side nav, `Content`, `SkipToContent`
  ahead of them) and is drawn as none of it.
  - **It is a window's chrome, so it is quiet — not a Tile.** No box, no shadow: a thin ink bar
    2rem tall across the top and, while there are pages to switch between, an ink strip 2.5rem
    wide down the left — one L of ink round the page — with 16px glyphs. The first
    version was Carbon's `Header` on a bordered, shadowed box with 20px glyphs in 3rem cells,
    and in review it read as one more tile, with icons that were "massive" at 150%. The shell
    has no ground and no edge of its own — a real window has both — so the page's backdrop
    shows through the page area.
  - **The bar is ink**, and has been both ways: white with a rule beneath for one review, then
    back to ink at the next. Don't turn it white again. Left to right: the app's icon, back,
    forward; **the app's title in the middle of the window**; minimise, maximise, close. The
    title is `text-label`, regular weight, uppercase and `opacity-60`: small, thin and grey, as
    asked for in review. Every action is a function handed in (`onBack`, `onForward`,
    `onMinimize`, `onMaximize`, `onClose`) — none of them is the shell's to carry out — and an
    action with no function has no button, so in a browser tab the bar is the icon and the
    title. **`onDragStart` makes the bar a handle**: pressing its empty space and moving calls
    it (the host's "start dragging the window" — Tauri's `startDragging`), and a double press
    calls `onMaximize`, as a title bar does. The move starts on the first held movement, not on
    the press: handed to the window manager on the press, the window is the manager's until the
    button comes up and the second press of a double-click never reaches the page (it maximised
    one time in two under openbox). It listens to *mouse* events on purpose: only those count the
    presses, and a finger has no window to move. Each control is a cell the bar's height and the strip's width, with an inset focus
    ring: one drawn outside would be cut by the window's edge.
  - **It is a subrouter.** `createAppShell({ content })` makes its state — which pages are open,
    which is showing, and the order they were shown in — and anything in the app opens a page
    with `shell.open({ id, title, description?, preview?, renderIcon?, content })`; a page reaches the
    shell with
    `useAppShell()`. A page is an *instance*: built once when opened and kept until closed, so
    going to another tab hides it and does not rebuild it. `shell.back` / `shell.forward` walk
    the pages that have been shown; hand them to the bar's arrows, or hand in another history.
  - **The strip** is the open pages as vertical tabs on ink, **one glyph each and nothing
    else**: a 2.5rem square, white glyph on the strip's ink. The pointer washes a tab with the
    bar's grey-over-ink (`bg-white/20`), and **the showing tab keeps that wash** — nothing
    more. It has been inverted to white (it read as part of the page rather than as a tab) and
    has worn a 4px white rule down its leading edge (Carbon's rail mark; too loud against the
    ink round it). Both were reversed in review. The strip runs straight on from the bar, with
    no gap. It does not widen: the first
    version was a `SideNav` rail that opened to 16rem over the page to show titles, and the
    card below is what replaced that. **Home is always the first tab and cannot be closed.
    With only Home open there is no strip at all**: it **slides in from the window's left
    edge** with the first page opened and slides back out when the last one is closed. **It
    slides by `transform`, never by its width**: the room is made at once (open, the strip
    stands in the layout at full width; shut, it is lifted out, `absolute` and `invisible`, so
    its tabs leave the tab order) and only the column of tabs inside moves. It ran its width
    0 → 2.5rem at first, which laid the whole page out again every frame and resized a board's
    WebGL view every frame, and it stuttered as each board opened. **A tab that opens pops in**
    (`animate-tab-pop`: up from 40% past full size and back, 260ms); the tabs the strip starts
    with are simply there. **Both motions wait two frames** (`afterPaint`), so they start after
    the new page's first paint rather than inside the work of building it — started with the
    page, the slide was three-quarters done before it was seen. Visibility is never
    transitioned on the way in: WebKit flips a `visibility` transition halfway, not at its
    start, and the column slid in unseen for its first half. A tab without a glyph wears the first two letters of its title. Arrows move between tabs and show the
    page. More tabs than the window is tall scroll, with no bar. (For one review the strip was
    white, ruled off from the page, with a 2px white gap under the bar. Both reversed.)
  - **A tab's card** opens to its right, as a browser's does over a tab: the title, the page's
    `description` under it, and **a picture of the page** — `preview`, an image's address shown
    16:9, or a function returning one that is asked each time the card opens (so a page drawn
    on a canvas can hand over `canvas.toDataURL()`). With no `preview` the card is the words
    alone. The shell cannot photograph a page itself; the picture is the app's to supply.
  - **Every tab but Home has a cross under the pointer**, and where it stands depends on what
    a press on the tab means. On the *showing* tab a press means nothing else, so the cross
    takes the glyph's place in the middle, as a browser's narrow tabs do it, and turns white
    under the pointer. On any other tab a press means "go to this page", and a cross in the
    middle would turn the reach for its glyph into "close it" — so there the glyph stays and
    the cross is a 1rem white square in the tab's corner (keyboard focus brings it out too).
    Don't move the background tabs' cross into the middle. The showing tab's cross is held
    back on a tab a *pointer press* has just gone to, until the pointer leaves it, so a
    double-click does not open and then close; a tab reached from the keyboard has its cross
    at once. The wheel pressed on any tab closes it — heard on the tab's cell, because on the
    showing tab the pointer is over its cross, the tab's sibling — and Delete closes the one in
    focus. Under a
    finger, which has no hover, the showing tab's cross is a second full-size square beneath
    it, and the others have none.
- **`Workspace`** is a page as two columns, **25% and 75%** (`1fr 3fr`, so the gap comes out of
  both, with a 16rem floor under the narrow one): what you set and read on the left, the thing
  you are setting on the right. It was 30/70, which gave the left column more than it used.
  Under 48rem
  **of its own width** they stack — the narrow one as tall as it needs (up to the whole height),
  the wide one in what is left, so each still scrolls; on auto rows the two ran past the bottom
  of a phone and the wide one could not be reached — — a container query (`@container`, `@3xl:`), not a breakpoint,
  because it is a page inside a shell and its room is not the window's. It was `lg:` at first,
  and at 150% zoom (a 960px window) the split never appeared. **This is the layout the apps are
  being reworked onto** — see "The rework" below.
- App-specific pieces still stay in their app: what drives `reveal` is mica's layer slider and
  quarry's sweep timing, and those stay put.

### Charts

`src/charts/` is a port of Carbon Charts (`@carbon/charts`): the same chart names, the same
`data` + `options` props and the same tabular data shapes, so Carbon's chart docs work as the
spec. All twenty-five charts: simple/grouped/stacked bar (floating too), line (step and
smoothed), area, stacked area, scatter, bubble, lollipop, histogram, boxplot, bullet, combo, pie,
donut, gauge, meter (plain and proportional), radar, heatmap, treemap, circle pack, tree,
alluvial, word cloud and choropleth, plus `Sparkline`.

- **Series separate by fill, dash and marker — never by colour.** Bars and slices wear a fill from
  `Swatch`'s vocabulary; lines take a dash rhythm and a marker shape. Each SVG pattern in
  `charts/fills.tsx` is the twin of a background utility in `theme.css`, because a legend entry is
  drawn with one and its mark with the other. Keep them in step.
- Marks that overlap (area, bubble, radar, circle pack, alluvial) use fills with nothing behind
  the ink, so both show. Pass `overlap: true` to `createChart` and the palette skips the flat fills.
- A heatmap has no colour ramp to use, so each cell holds an ink square whose *area* is the value.
- Carbon's area gradient (`color.gradient.enabled`) is a change in ink *coverage* here, not a run
  of greys: `charts/fade.tsx` draws it as an ordered dither by default, with `halftone` and
  `lines` as alternatives under `gradient.kind`. As in Carbon it applies only while one series is
  showing. Fades are kept on whole pixels — a half-pixel dot renders as the grey this avoids.
- **No D3.** Its scale and shape modules last shipped in 2021–22. `charts/core.ts` is the small
  part a chart needs: linear, band, time and log scales, nice ticks, a monotone curve. Text is
  measured by arithmetic — every Plex Mono glyph is 0.6em wide — so layout is identical on the
  server and in the browser.
- Charts draw at the container's real pixel size (the viewBox is rewritten on resize), so type
  stays at token sizes instead of scaling with the chart. Coordinates inside an SVG are geometry,
  not CSS lengths, and are outside the even-number rule — as kiln's figures already are.
- Every chart has "Show as table": the same data in a `Table` inside a `Modal`. It is the
  accessible form of the chart.
- `MeterChart` is the one chart that is HTML, not SVG: a row of boxes is what flex lays out
  exactly, and it lets the segments use the same fill utilities their legend swatches do.
- The frame every chart shares also carries Carbon's toolbar and states: export as CSV (the
  table's data, unformatted) or PNG (the SVG with its computed styles written onto each node and
  the page's font embedded, since a serialised SVG has no stylesheet), and a skeleton while
  `data.loading` is set.
- `zoomBar.top.enabled` puts Carbon's zoom bar over a line, area or scatter chart with a
  continuous x axis (`charts/zoom.tsx`). Zooming pins the axis and clips the marks; it does not
  filter the data, so a line still runs off the edge towards a point that is out of view. Each
  handle is a slider.
- `ChoroplethChart` shades regions by ink coverage in four steps — the same ordered dither as
  the area fade — with white kept for "no data". It draws the map it is handed
  (`options.geoData`, GeoJSON or TopoJSON) and **bundles none**: which regions, at what detail
  and under what licence is the page's call. It carries its own TopoJSON decoder and four
  projections, so no `d3-geo` or `topojson-client`. The playground's map is a hand-drawn
  schematic, not a survey.

### Look

- **Strict monochrome.** Black ink on white, light theme only. No hue anywhere: no accent, no
  status colours. Greys only where the prototypes already use `--gray`; don't introduce new ones.
- Severity (design rules, notifications, validation) is carried by icon, text label and weight.
  Never by colour.
- The one exception is code blocks, which keep Shiki `github-light` on pure white. That theme was
  chosen in quarry's review.
- 2px ink borders, hard offset shadows with zero blur, square corners.
- **Keyboard focus and text selection show on ink grounds too.** Both are drawn in ink over
  whatever is behind them, and the `on-ink` utility turns both white. Put `on-ink` on anything
  with an ink ground that holds text or a control — a tile's bar, a modal's header, a
  batch-action bar, an inverted row, a solid tag. Without it the ring and the highlight are ink
  on ink, which is to say absent. Not on a control whose own ring is drawn *outside* it, on the
  page — a selected tab, a primary button — where that ring must stay ink. A row in a list that
  scrolls takes an *inset* outline (`focus-visible:-outline-offset-2`), or the list's own edge
  cuts it.
- Loading is square. `Loading` is eight cells round a square, inked one at a time in hard steps;
  an indeterminate `ProgressBar` is a block of ink crossing its track. A skeleton is a
  `--color-gray` block that fades down and back (the `skeleton` utility), **and every skeleton on
  the page fades together**: each runs the same opacity animation, and `internal/skeleton.ts`
  starts them all from the page's own zero, so they are in step however staggered their
  arrival. Take the class from `SKELETON`, and don't give a skeleton an animation of its own.
  **Something loading is shown with these, never with a line of text saying so**: a view that
  waits is a `Loading`, a list an `InlineLoading` with its words, a picture still being drawn a
  `SkeletonPlaceholder`.
  (It was once a stepped clock on the root that each block *transitioned* to. Chromium and
  WebKit obliged; a transition is not meant to start from an animated change, and Firefox,
  correctly, did not — its skeletons blinked.) All three stop under `prefers-reduced-motion`.
- Anything that floats — menus, listboxes, calendars, popovers — is `FLOATING_SURFACE`: one box,
  one hard shadow, no caret. Its inverse is what a tooltip and a toggletip are.
- **Nothing is smaller than 10px, and secondary text is `opacity-muted`, never a number.** The
  type scale is `micro` 10 / `label` 12 / `small` 12 / `body` 14 / `figure` 16px — the prototypes'
  scale rounded to even and lifted 2px at every step. It has been cut back to the prototypes'
  8 / 10 / 12 once, to match them pixel for pixel, and it read too small and too light both times
  it was reviewed: mica had 97% of its text at 10px or under and dozens of labels at 2.6:1. Do not
  "restore" the prototype sizes.
- `opacity-muted` is one token, `--opacity-muted` in `theme.css` (80%, 12.6:1 on white), so how
  far labels, helper lines and meta step back is changed in one place. It was 40%, then 60%, and
  both were too light at the zoom the pages are actually read at (125–150%) — judge small text
  there, not at 100%. A literal `opacity-60` is kept for four things that are not secondary
  text: placeholders, the second tone of a display headline, a turn or form already dealt
  with, and the window's title on `AppShell`'s bar — chrome to be glanced at, asked for grey in
  review. `opacity-40` is for *state* only — disabled, switched off, not yet run.

**Deliberate deviations from Carbon.** These came out of prototype review. Don't "correct" them.
- Form fields are a rule, not a box and not a fill: a single 2px ink rule underneath, no side or
  top borders, and **no resting ground at all**. The 2px box with a hard shadow belongs to `Tile`
  and `Button`, and when fields wore it too, everything on a form read as the same object at the
  same depth. Severity thickens the rule to 4px; read-only drops the rule, so the field reads as
  the value it holds; disabled keeps it, dimmed with the rest of the field — off is not the same
  as read-only, though CSS's `:read-only` matches both. (This replaces the earlier four-sided-border rule, and then the
  `--color-field` ground that replaced *that* — a grey block behind every input on the page. Both
  reversed in review.) **`Select` is the one exception — see below.**
- **A focused field lights its ground; it does not gain an outline.** `--color-field` (a near-white
  96%) is the focus state and nothing else. CSS matches `:focus-visible` on a text input for *every*
  focus, mouse included, so an ink ring appeared each time you clicked into a field — a detached
  black box around a control drawn deliberately without one. Fields opt out of the outline;
  everything with no ground to light (`Checkbox`'s 16px box, `RadioButton`, `Toggle`, `Button`,
  `Switch`, `Tab`) keeps it.
- `Select` is a hand-rolled listbox on Corvu Popover, not a native `<select>`. A native one renders
  its options through the OS, so they can't be styled and it was the one control that ignored the
  design system.
- **Pressed to open is a box; typed into is a recess.** `Select`, `Dropdown` and `MultiSelect`
  are boxes for the reason below. `ComboBox`, `FilterableMultiSelect`, `DatePickerInput` and
  `TimePicker` are typed into, so they are fields like any other: one rule, lit when focused.
- `DatePicker` defaults to ISO 8601 (`Y-m-d`), not Carbon's `m/d/Y`: it cannot be misread and it
  is how every date in the apps is already written. The calendar opens from its button or the
  down arrow, not on focus.
- **`Select` is a box, not a recess.** The only field that is. A recess says "put something here",
  which is right for a text field and wrong for this: nothing is typed into a Select, it is pressed
  to open a menu, so it is drawn like the button it behaves as — white ground, 2px ink on all four
  sides, greying on hover, no shadow (whatever it sits in already carries the one). The prototypes
  box theirs for the same reason. Severity still thickens only the bottom rule, so the flagged
  state matches every other field and doesn't shift the layout.
- **A fluid field is a cell.** Carbon's fluid forms put the label inside the field; here that
  makes the field a white cell with the label in the label voice above the value, lit on focus
  like any other field. It is the one place a *text* field is boxed, because the box is the
  point of the layout: in a `FluidForm` the cells tile in one ruled frame (`RULED_GRID` — the
  rules are the grid's gap, so each is drawn once), and alone each is its own 2px box. No shadow.
  A fluid field is the ordinary component rendered under a context (`Fluid` in
  `internal/field.tsx`), as in Carbon — never a second implementation. Fill the last row of a
  fluid grid: an empty cell shows the frame's ground, which is ink.
- One hard shadow. No elevation layers, blur or rounded corners.
- Dividers are ink and run full width, edge to edge. No inset rules and no grey rules. No divider
  lines between checkbox or radio groups.
- **The scrollbar is a 4px ink thumb in a gutter exactly as wide, and we draw it** (this
  reverses "no visible scrollbars anywhere", and then two styled-native versions). The thumb
  fills its gutter, so it is the only mark the bar makes; where the thumb is not, the gutter is
  empty and whatever is behind the pane shows through. Square-ended, the same at rest and under
  the pointer (it can be *grabbed* over 8px — an unseen margin into the pane — because 4px is too
  little to catch). A gutter exists only while its pane overflows. Every native scrollbar is
  switched off in `theme.css`, because no engine can be styled into this: Chromium and WebKit
  paint the *page's* gutter opaque whatever its track is told, which ran a white strip down the
  window's edge over the backdrop, and Firefox takes a colour and a width keyword and draws a
  rounded pill. So `internal/scroll.tsx` draws the bar and the browser still does the scrolling.
  What scrolls is a `Scroller` inside `design`, a `ScrollArea` in an app, and the page has a
  `PageScrollbar`; its gutter is reserved on the body from the first paint, so the backdrop runs
  under it and nothing in the page does — except a ground marked `page-bleed`, and the page's
  thumb inverts against whatever it is over so it is seen on that too. A strip that scrolls sideways by design — a row of tabs,
  page numbers on a narrow screen — is a bare `overflow-x-auto` and has no bar. No bar and no
  gutter under a coarse pointer: a finger drags the content. It has been 12px with a ruled track,
  then 8px with air round the thumb; both were too much. Don't bring back a track, a rule, air
  beside the thumb, or a thumb that grows on hover.
- **Selected text inverts**: ink ground, white text, and the reverse on an ink ground. The
  browser's highlight was the platform accent colour — the one hue on the page nobody chose.
  `accent-color` and the tap highlight are pinned for the same reason. The rule sets `fill` as
  well as `color`: SVG text is painted with its fill, and Chromium keeps it under a selection, so
  without it every chart label selects as ink on ink. Check selection over a chart, in Chromium.

### Even numbers only

- Every number in a Tailwind class is an even integer: `p-2`, `gap-4`, `w-64`, `border-2`,
  `translate-x-2`, `[6px]`. `0` is fine.
- Never odd (`p-3`, `leading-5`), fractional (`p-1.5`, `p-0.5`) or odd arbitrary values (`[3px]`).
  Bare `border` is 1px, so it's out too; use `border-2`.
- The only exception is counts that describe structure rather than size, such as `grid-cols-3` for
  the slicer's three lanes.
- The same rule applies to lengths in `theme.css`. If a prototype value breaks it, flag it instead
  of rounding it silently.
- **No arbitrary `rem` or `px` lengths in a class.** `max-w-[46rem]` is `max-w-184`: Tailwind v4's
  spacing scale is multiplicative, so any whole even number of quarter-rems is already a utility.
  A length that is not one — 2px, 6px, 10px — is a named token (`rule`, `snug`, `gap`), never
  `[0.125rem]`. If neither fits, the length is off the grid: move it onto the grid, don't escape
  it. What remains arbitrary is structure, not length: grid templates, `calc()` over tokens, and
  the custom-property pattern for runtime data.

### Tokens

- Take exact values from the prototypes' `:root` (`--ink`, `--gap`, `--shadow`, `--gray`,
  `--line`, …). Don't invent or "improve" them. **The one exception is ink, which is pure
  black (`#000`)**, not the prototypes' `#141417`: that near-black read as grey wherever it met
  true black — a dark dock, the desktop round the frameless window — and every near-black was
  made black in review (2026-10-14). Nothing restates it: the 3D board's edges, the app icon and
  the playground read `--color-ink`.
- If the prototypes disagree on a value, `mica.html` wins, since the other two were built from it.
  List any disagreement you resolve.
- Tokens live once, in `theme.css`. Port them into `@theme` under Tailwind's namespaces
  (`--color-*`, `--spacing-*`, `--shadow-*`, …) so they generate utilities, keeping the values
  identical. `--line` is a bare HSL triplet used as `hsl(var(--line) / <alpha>)`, not a colour, so
  it stays a plain `:root` variable.
- Small lengths are named so class names stay free of numeric literals: `--spacing-rule` (2px, one
  ink rule's thickness), `-tight` (4px), `-snug` (6px), `-gap` (10px), `-icon` (20px, Carbon's
  second icon size), `-scroll` (4px, a scrollbar's thumb and its gutter), `-touch` (44px), `-lane` (20rem).
- **Line heights are whole, even pixels**, like every other length: 12px under `micro` and
  `label`, 16px under `small`, 20px under `body`, 36 and 46px under the two display sizes. The
  prototypes' ratios (1.45 on the body) gave 20.3 and 16.8px lines on this type scale, which put
  every block of text — and so everything under it — on a fraction of a pixel. A line height that
  comes out fractional is a rem length in `theme.css`, not a ratio.
- Each app's stylesheet:

  ```css
  @import "tailwindcss";
  @import "@alumina/design/theme.css";
  @source "../../design/src";   /* relative to this CSS file */
  ```

  The `@source` is required. Tailwind v4's automatic detection won't find classes in the design
  package's source, so without it those styles are silently missing.

### Shared patterns

- `Tile`: bordered, hard shadow, optional ink header bar (ink ground, white text). A close or
  collapse control on an ink bar is one borderless white icon, never two controls. `flush` drops
  the body padding so a stack of ruled sections can divide edge to edge, and each of those
  sections is a `TileSection` — kiln's rail and replies, quarry's publish panels and search facets.
  Anything drawn as `border-2 border-ink bg-white shadow-hard` is a Tile and should be one:
  `flat` drops the shadow inside another tile, `placeholder` is the dashed empty slot, `inverse`
  is the ink one, and `ClickableTile` is the whole tile as a link — or, given no `href`, as a
  button, for a press that does something in the page (foundry's recent boards open a tab). A
  `ClickableTile` inside a tile is `flat`, and greys under the pointer instead of pressing.
- **A column of commands is a `ContainedList` with `commands`** — foundry's Start: rows not ruled
  apart, uppercase and `opacity-muted` until pointed at, glyphs centred on their line (a list of
  *things* keeps its glyph against the first line, for a check and its detail), and a hover
  ground that runs the width of what holds it, so put it in a `flush` section. A label inside
  a button speaks uppercase only if the class is on the label: Tailwind's preflight resets
  `text-transform` on every button.
- **A dialog drawn in the page is the same `Modal`, `inline`**: in the page's flow, with no
  scrim, portal or focus trap, and closed only by its own close and buttons. (foundry's Settings
  was one for a while; it is a `Workspace` page now.)
- **A vertical tab list is a plain column**: no rule between tabs, the chosen one the single
  inked row (with an inset ring, white on the ink, since it usually sits flush in a pane that
  scrolls) — what the shell's strip does. It was a ruled column, a rule under every tab, and
  six rules for six sections read as busy (2026-10-18). kiln's settings dialog has the same list.
- **A drop box can ask the host for files**: `FileUploaderDropContainer`'s `onPick` replaces the
  browser's file input on a press or Enter — foundry's desktop build hands it the desktop's own
  picker. Drops are unchanged.
- **A menu item hands focus back before it acts.** `OverflowMenu` returns focus to its trigger
  and closes, *then* runs the item, so a dialog an item opens starts from the trigger and gives
  focus back to it. Left to Corvu, focus came back a frame later and pulled it out of the dialog
  the item had just opened. And a modal is not closed by focus leaving it
  (`closeOnOutsideFocus={false}`, as Carbon's): Escape, its own controls and the scrim close it.
- A settings row — what it is on the left, the control that sets it hard against the right — is a
  field's `inline` layout, not a row built around a field with its label hidden. A value the user
  cannot change is a `readOnly` field in the same rows: mica's board header and tool modules,
  kiln's process rules, quarry's detected toolchain.
- A label standing over several controls is a `FormGroup` (a fieldset and its legend), not a bold
  `<p>`.
- Fill patterns carry identity where hue would: `bg-hatch` marks hazard, and `pat-dots` /
  `pat-cross` join it so mica's six tool modules each get their own swatch.
- Air over boxes. Group with whitespace and full-width rules before adding another bordered
  container.
- Figures are inline SVG in the same flat 2px ink stroke.
- Code blocks have a line-number gutter. A line too long for the block scrolls it sideways,
  with the system scrollbar along its foot.
- Keyboard focus is always visible. Never remove it. For most controls that is an ink outline; a
  form field lights its ground instead — see the field rules above.
- Apps may pass `class` for layout (placement, margin). A different look is a variant in `design`,
  not an override in the app.
- **Apps are composed from `design` components, and so are an app's own components.** An app may
  define a component — quarry's `Counters`, kiln's `Composer` — but its parts are design system
  parts: no raw `<button>`, `<input>`, `<select>` or `<table>`, no hand-drawn box, list, tab strip
  or status dot. If the part an app needs does not exist, port it from Carbon into `design` first.
  The exception is what genuinely is one app's alone and has no anatomy to share: mica's rotate
  pad and renderer, kiln's figures.
- Any visual element a second app needs moves into `design`.
- The playground is what gets compared against the prototypes.

**Motion gotcha.** A `clip-path` reveal clips the element's own box-shadow. Use
`animation-fill-mode: backwards`, not `both`, so the clip-path is gone once the animation ends.

## The rework

The three apps are about to be laid out again, and wired to real data. What is decided:

- **Every app sits in an `AppShell`**, and its screens become the shell's pages: Home, plus
  whatever is opened from it. foundry is the first one moved: its Home, boards, new projects,
  Settings and print jobs are pages. Which things are pages in kiln and quarry — a thread, a
  board, a search — is not decided; ask.
- **A page is a `Workspace`: 25% and 75%.** foundry's Home is; its board page's
  three lanes, kiln's rail beside the chat and quarry's centred column are the layouts being
  replaced. Don't extend them, and don't design a new screen on them; `--spacing-lane` (the 20rem
  lane) goes when the board page moves.
- The design system has the parts: `AppShell`, `Workspace`, `ScrollArea` for a column that
  scrolls, and inline fields for a column of settings. The playground's AppShell and Workspace
  sections show them, alone and together. In a narrow column an inline field's label is cut short rather than wrapped —
  check a real 25% column before settling a page's copy.
- **The desktop host is Tauri** (`@alumina/desktop`), and the window is dragged by `AppShell`'s
  `onDragStart`, handed Tauri's `startDragging` — not Tauri's `data-tauri-drag-region`
  attribute, so the design system knows nothing of Tauri.
- foundry hands its bar's arrows the shell's own page history: opening a tab does not change the
  URL, so there is no other history to walk. Still not decided, so ask: whether that holds for
  kiln and quarry, which do have URLs; and whether open pages survive a reload.

## Porting a prototype

1. The prototypes are large and embed base64 images and mesh data. Grep for the screen or
   component you need; don't read a whole file.
2. Add or extend `design` components first, then compose the screen in the app.
3. Reimplement, don't transplant. No prototype CSS or JS copied in wholesale.
4. Match the prototype to the pixel (spacing, borders, shadows, alignment) at the same viewport
   widths. The prototypes predate the strict-monochrome and even-number rules; where they conflict,
   the rules win. Any other deviation, say so and why.
5. Move embedded data (avatar, meshes, sample threads, sample boards) into the app's
   `src/fixtures/` as real files.
6. Anything the prototype fakes (timers, canned replies) goes behind an adapter in `src/lib/`, so
   a real backend replaces it without touching components.
7. Fixture identities: signed-in user `avthenticstemcel`, dummy author "Sambhav Arora", dummy
   company "Pixelexia".

## `@alumina/slicer` — foundry

- **The app is one `AppShell`** (`components/Studio.tsx`). Home is always there; a board, an
  empty project, Settings and a board's print job each open as a tab beside it and keep their
  state while another shows. `Studio` holds what every page shares — the printers and the one
  chosen, the machine's limits (the machine is the app's, not a board's: a board's Machine panel
  and Settings edit the same store), the recent boards, and one notice slot shown on Home — and
  the ways to open a page (`useStudio()`), and **whether mica is answering** (`engine`, checked on
  start and whenever a call fails to reach it) with mica's option table. The routes are only `/`
  and `/slice/<board>` — mica's id for a board — which opens the app with that board's tab
  showing, from its kept document: what `pcb+open://` will land on.
- **Settings is a tab on the 25/75 `Workspace`** (`components/Settings.tsx`), the same shape as
  Home: `TabsVertical` round both columns, the sections (`TabListVertical`) flush in a plain
  tile on the left — no bar (the shell's says Settings), no padding, no footer (About has the
  version): an inset bar, a list inset in white and a footer read as overdone in review — the
  chosen one in a tile on the right headed by its name — Printer, Machine, Engine (mica: answering or not, its version, how it is
  reached — the dev proxy's target, or in the desktop build an editable loopback address — and
  what its store holds), Account, Interface and About, each ruled into `FormGroup`s of inline
  fields. Changes take effect as they are made — Machine is the same store a board's Machine
  panel edits — so there is no "Done": the tab's cross closes it. The account menu's "Machine
  profile" opens it on Machine. It has been a tab on the 30/70 workspace, a dialog over the
  page, and that dialog drawn in a tab (a box in a box, with a bar and a "Done" of its own);
  each was reversed in review.
- **Home is the 25/75 `Workspace`.** Left, one tile: the name, then Start (New project, Open
  project…, Sync to cloud, Settings) as a `ContainedList` of `commands` — no rules, uppercase,
  stepped back until pointed at, each glyph centred on its line and the hover ground the tile's
  full width — and the account menu pinned to the foot, opening upwards.
  **Right, a three-by-three grid** on the moving floor, as asked for: "Recent projects" takes
  the top two rows across, and the bottom row is halved — the newsletter (its kinds as `solid`
  tags: each says what its item is) and the printer (`PrinterTile`, moved out of the left pane).
  Each area scrolls on its own and the column does not; under 36rem of its own width (a phone)
  they stack and the column scrolls. Recent projects is a filter over a gallery of small cards
  — flat `ClickableTile`s in as many 10rem columns as fit (two on a phone), each a
  `snapshotBoard` still on the sheet (`lib/picture.ts`), drawn from the board's first slice — the
  assembly, or the one-piece plate — and kept with its place on the list, so the list shows it
  without asking mica. A card shows a board's layers and size as mica read them, and reopens it
  from its kept document. While mica is not answering the column leads with an
  `ActionableNotification` saying so, how to start it and "Check again" (the first-run setup
  screen will take that over). There is no drop card in
  the gallery: **the whole right column is a `FileDrop`**, and while a file is held over it the
  gallery gives way to the dropper (`FileDropCover`). Before anything has been opened the
  gallery is a `FileUploaderDropContainer`. An IPC-2581 file dropped opens in a tab of its own,
  several at once; a file that is not one is refused with a notice, by ending or by content. A
  file let go anywhere else in the app is ignored (`ignoreStrayDrops`), not opened by the
  webview in place of the app. The floor stops when Settings says so (a kept preference,
  `lib/preferences.ts`).
- **mica opens a board** (`openFile` in `lib/board.ts`): the file's text is uploaded, and mica
  decides whether it is a board — a refusal (`unparseable`, …) is a notice in mica's words — and
  reads its name, layers, conductors, size, drills and vias. What mica does not report — the
  header's revision, author, company, exporting tool and date, units and role — is read out of
  the same text here (`readHeader`): real, never typed in, never a stand-in.
- **The document is kept** (`lib/documents.ts`, IndexedDB, keyed by mica's id for it — the
  SHA-256 of the bytes), because mica keeps everything in memory: restarted, or with a full
  store, it forgets boards. Reopening a recent board, or running one mica has forgotten
  (`board_not_found`), hands mica the document again first (`openStored`, `runOpen`). The recent
  list (`lib/recent.ts`, local storage) holds ids, names, mica's figures and pictures; it starts
  empty, and documents follow their boards off its end — or off the list, by a card's context
  menu ("Remove from recent") or the tile's Clear, which asks first.
- **A run is its board's id and its run id together** (`runKey` in `lib/parts.ts`). mica derives
  the run id from the options alone, so every board run at the same options shares one; meshes
  cached by the run id alone drew the first board's model for every board after it. Anything
  kept per run — meshes, a board's picture (`pictureOf` records which run it shows) — is keyed
  by both.
- New project opens an "Untitled n" tab that is one drop container; given a board, the board
  opens in its own tab and the untitled one closes.
- The board page (`components/SliceView.tsx`) is still the three lanes: information and actions
  left and right, the 3D layer renderer in the centre. **It slices with mica**: at mica's
  defaults as it opens, and again on "Slice" (asked for, as a slicer's is, not rerun per
  keystroke; options set since the run on show say so). "Validate" switches on mica's
  `validate` option and slices. The Slice panel is the file's header over **mica's own option
  table** (`GET /v1/options`, read live; `step` and `verbose` left out, a new option shown under
  its own name until `FIELD` in `SettingsPanel` names it), with "mica's defaults" to go back.
  Right: Run (mica's verdict line, the outcome, the stages that ran and how long), **Ink** (mica's
  volume per slab, a proportional `MeterChart` over a `StructuredList` — where the production
  time estimate stood: time is the G-code's, and the G-code is shale's), **Findings** (mica's
  diagnostics as a `CheckList`: blocker, warning, note; the kind is the row, the message its
  detail) and Board (mica's figures). Print stays disabled: printing is shale's. It fills its page rather than the window,
  and **its breakpoints are its own width, not the window's** (container queries, as on
  `Workspace`): under 64rem (`@5xl`) a switcher chooses — from 48rem (`@3xl`), Setup or Run
  beside the stage; below that, Setup, Board or Run one at a time — and under 42rem (`@2xl`) the
  viewport bar drops its rotate pad. They were `lg`/`md`/`sm` until the desktop app showed the
  two-lane layout on a maximised 1920px window at 150%. The lanes do not scroll while the
  window has room: the Slice and Tools panels and the parts list shrink to a floor and scroll
  inside themselves first. **It is the next screen due on the `Workspace`.**
- **The title follows the tab**: "Foundry — <the tab's name>" on the shell's bar, the window
  (taskbar, window switcher) and a browser's tab; just "Foundry" on Home.
- The three.js renderer lives in this package. **Its view is made 320ms after its page**
  (`LayerRenderer`): WebKitGTK holds the window's frames for about a tenth of a second while it
  makes a WebGL context, and made with the page that hold landed in the strip's slide and the
  tab's pop. The mesh still loads at once; only the drawing waits.
- **The stage shows one of what mica made** (`lib/parts.ts`): the assembly (or the one-piece
  plate), each slab as it is printed with its ink solid, and the fixtures — every file is in the
  board's own coordinates, so each stands alone, and a slab's ink is drawn in ink in it
  (`BoardView`'s `ink`). The parts list (`PartsTile`, radio groups by kind) replaced the
  prototype's layer tree. The viewport's switch is All / Shell / Ink over the real solids (Drill
  went: it had no geometry), and its slider runs over the part's print layers — its height over
  the run's `layer_height`. A refused run made no parts, and the stage says so.
- Tool modules are reported by the machine on connect, not configured in the slicer. Show them
  read-only: the bays are a `TileGroup` of `RadioTile`s, and a bay's settings are `readOnly` inline
  fields. They are stand-ins until shale, and the panel says so.
- Findings show severity by icon and label, not colour.
- The print-job page is a tab now, and still a stub: it is blocked on shale.
- Adapters, each the only way to what it names: `lib/mica.ts` the engine — **mica's HTTP API**
  (`mica serve`, docs/API.md in the mica repo), typed as it answers, every failure a `MicaError`
  with mica's code — `lib/board.ts` a board as the app holds it, `lib/parts.ts` a run's parts and
  meshes, `lib/documents.ts` kept documents, `lib/printer.ts` the printer, its tool modules and
  limits (**fixtures until shale**, `fixtures/printer.ts`), `lib/cloud.ts` the account,
  newsletter and sync (fixtures; sync says there is nowhere to sync to), `lib/recent.ts` the
  recent boards, `lib/window.ts` the desktop window (and the drags it takes),
  `lib/files.ts` the file picker, the stray-drop guard and the replay of the window's drags, `lib/picture.ts` a board's still, `lib/preferences.ts` what the app
  keeps between launches. `lib/app.ts` holds the name, the title, the version and the glyph.
- **How the page reaches mica.** mica sends no CORS headers. In development — the browser, and
  the desktop window under `tauri dev`, which loads the dev server — the slicer's dev server
  proxies `/mica` to it (`vite.config.ts`; `MICA_URL` moves it from `http://127.0.0.1:8781`). The
  desktop build asks through Tauri's http plugin, a request the window makes rather than the
  page, scoped to loopback in the capability. A slicer served on the web would need mica to
  allow its origin. Run `mica serve` (`~/.cargo/bin/mica`, in the container) to work on the
  slicer; the mica repo's `coupon/` has real KiCad exports to drop in.
- The account menu's rows are drawn the way quarry's are (a glyph, a label, a dimmed value) —
  a second copy, flagged rather than extracted.

## `@alumina/desktop` — foundry's window

- **A Tauri 2 shell around the slicer**, and nearly nothing else: the crate is the window, and two
  commands (`pick_files` and `read_chosen`, below). Its page
  is the slicer — `devUrl` is the slicer's dev server, and a build loads the slicer's static
  output.
- **No frame** (`decorations: false`). `AppShell`'s bar is the title bar: `lib/window.ts` hands
  it Tauri's minimise, toggle-maximise, close and `startDragging`, and in a browser hands it
  nothing, so the bar there has no window buttons. The capability (`capabilities/default.json`)
  allows exactly those four window calls, setting the page's zoom, and the http plugin's
  `fetch` to loopback (`http://127.0.0.1:*`, `http://localhost:*`) on top of `core:default`.
- **`tauri-plugin-http` is how the built app reaches mica** — see the slicer's "How the page
  reaches mica". Without TLS or a system proxy (`default-features = false`): it only ever talks
  plain HTTP to this machine.
- **The file picker is the desktop's own**: `tauri-plugin-dialog` with its `xdg-portal` backend
  (default features off), so "Open project…" and the drop boxes show GNOME's GTK4 dialog on
  GNOME and KDE's Qt one on KDE — through the XDG desktop portal, which the app inside the
  container reaches on the host's session bus — instead of the GTK3 chooser WebKitGTK opens for
  a file input. The crate's `pick_files` calls it from Rust (`blocking_pick_files` on a blocking
  thread, the window as its parent) and grants what comes back to `read_chosen`; the page asks
  through `pickHostFiles` (`lib/window.ts`), which `pickFiles` uses in the desktop build. No
  community plugin for this turned up (2026-10-18); the official plugin's portal backend is
  the one that reaches the desktop's own picker.
- **The window takes a dropped file for the page** (`dragDropEnabled: true`). WebKitGTK no longer
  hands a page the files in a drop: `dataTransfer.files` arrives empty, with `text/uri-list` and
  no `Files` type (WebKit bugs 320301 and 323277, a regression from the fix for CVE-2025-13947,
  unfixed as of 2026-10-15; seen in plain MiniBrowser on 2.52.1). It was `false` at first, on the
  theory that the page would then get an ordinary HTML drop — and a board dropped on the window
  opened nothing. Now Tauri reports the drag with the files' paths; `onHostDrag`
  (`lib/window.ts`) turns its positions into page pixels and asks the crate's `read_chosen` for
  each file's bytes — refused for any path that was not dropped or picked — and `replayHostDrags`
  (`lib/files.ts`) plays the drag into the page as the `dragenter`/`dragover`/`dragleave`/`drop`
  events a browser sends. Home's `FileDrop` and the drop boxes take it unchanged, and the design
  system still knows nothing of Tauri. When WebKit is fixed this can go back to `false` and the
  replay can go.
- `pnpm dev:desktop` runs `tauri dev`, whose `beforeDevCommand` is `scripts/Start-DevServer.ps1`:
  it starts the slicer's dev server unless port 4300 already answers (the dev servers are usually
  up, and strictPort would make a second one fail).
- **The slicer has no index.html of its own.** It is client-rendered, but SolidStart still serves
  its HTML shell from a server entry, and a window has no server. `pnpm --filter
  @alumina/slicer build:static` builds it and then `write-shell.mjs` asks the built server entry
  for "/" once and writes the answer to `dist/client/index.html` — which is the `frontendDist`.
  (SolidStart 2's own route is Nitro's `static` preset, and Nitro 3 is still a beta.)
- **The icon** is the user's to draw (2026-10-15): the generator script that made the current
  one — Carbon's `layers` in white on an ink tile — is gone. **The app icon page**
  (`/app-icon.html` on the playground's server; `design/src/tools/app-icon/`) draws one: **the
  system's own `Tile`, the glyph on its face, on transparency and cropped to the tile and its
  shadow** — no backdrop and no margin (the platform's icon grid puts the air round an icon);
  a white face or an ink one; an ink border a fortieth of the tile and the one hard shadow at
  twice it; an optional header bar. Any of Carbon's ~2,800 glyphs at 32 (searchable, loaded one
  at a time through `import.meta.glob`), glyph sized, previewed at 256 down to 16 on white and
  on ink, saved as SVG or as a PNG drawn at its size (16–1024; 1024 unless told). Square: the shadow falls as far
  down as across. One SVG string is the preview, the SVG and the PNG's source, so all three
  agree; it is plain SVG (`rgb()` colours, no CSS), for the tools that read app icons.
  **foundry's icon is its output at the defaults** — `layers`, white face, glyph at 56%, no
  bar — saved to `src-tauri/icons/icon.svg`, from which `tauri icon` rendered the set
  (2026-10-18; its Android and iOS folders deleted, the app being desktop-only), plus the page's
  PNG at 1024 as `512x512@2x.png` (the page's default size, asked for when the icon read
  low-res), and `pnpm --filter @alumina/desktop register` copied into the user's icon theme —
  1024 is the theme's `512x512@2`, its largest. The set lives in `src-tauri/icons`;
  `pnpm --filter @alumina/desktop tauri icon <image>` renders the PNG, ICO and ICNS from one
  image. **The window's own icon stays the 256** (the first PNG in `bundle.icon`): GTK on X11
  drops a window icon of 512 × 512 or more — it will not fit the property it is sent in — and
  the window then has none. The dock and the app grid read the theme instead. The app's bar wears the
  glyph plain, through `Icon` (`APP_GLYPH`).
- **Its titles say "Foundry"** (`APP_TITLE`): the window, the taskbar, the desktop entry and a
  browser's tab, as a proper name. The wordmark on Home stays lowercase, as quarry's and
  kiln's do.
- **The desktop knows the window by its app id.** `enableGTKAppId` makes the GTK application id
  the bundle identifier, `org.alumina.foundry`, and GNOME (Wayland or X11) shows a running
  window's icon and name from the `.desktop` entry of that name — without one, foundry ran with a
  blank icon. `pnpm --filter @alumina/desktop register` (`scripts/Register-DesktopEntry.ps1`)
  writes it to `~/.local/share/applications` with the icons in the user's hicolor theme, and
  `-Remove` takes them away; from inside distrobox the entry starts the release build through
  `distrobox enter`. The price of the app id: GTK registers the app on the session bus, so one
  copy runs at a time — dev and release included.
- **Zoom is the app's**, since a window has no browser zoom: Ctrl + / − / 0 (`lib/window.ts`)
  step through a browser's levels — 110, 125, 150, 175% — and the level is kept between
  launches. Tauri's own `zoomHotkeysEnabled` steps by 20% and never lands on 125 or 150, so it
  is off. Settings' Interface pane shows the level and sets it.
- The bundle identifier `org.alumina.foundry` is a placeholder until there is a domain to put in
  it — and it is now the app id the desktop entry is named for, so changing it means
  re-registering. Installers (`bundle`) are not set up beyond Tauri's defaults.

## `@alumina/hub` — quarry

- Boards are backed by git repositories (Git LFS for large objects), not uploaded archives.
- Home: a Steam-style hero with an animated print-sweep render of a real board mesh, then
  GitHub-style 2×2 tiles. The hero render lives in this package.
- The nav is one sticky bordered container in sections: ink wordmark, Carbon icon content switcher
  with tooltips, search, and an account popover (boards, forks, starred, machine profile, uploads
  remaining, settings, sign out).
- Board pages are reached from tiles, with a breadcrumb back. Search (`/search`) lists results in
  one tile with the facets in another; there is no search backend, so nothing filters. Below `lg`
  the facets are a `Drawer` behind a "Filters" button.
- Publishing starts from "New board" in the account menu. Five sections: Source → Build → The
  listing → Licence and visibility → Preview. Build is automatic export: detect the EDA project,
  export IPC-2581 and/or Gerber, run mica validation. Outputs are labelled as generated.
- "Open in slicer" uses the `pcb+open://` protocol.
- 3D gotchas from the prototype: lift the sweep's clipping plane clear of the board's top face
  when the animation finishes (otherwise it z-fights), and fit camera near/far to the scene bounds.
- The prototype's fallback syntax tokeniser only existed for offline single-file use. Use bundled
  Shiki and don't port it.
- Removed on purpose: the three-column fixed-pane layout, a "Repo" nav item, a `+` button in the
  nav, and assembly steps in publish (replaced by one notes textarea).

## `@alumina/agentic` — kiln

- Front end for a PCB agent: natural-language prompts in, board designs out through the HTML → EDA
  pipeline. The pipeline belongs to `@alumina/eda`, not this package.
- The left pane is one ruled tile of stored threads. Clicking one replays it instantly. Below
  `lg` the rail does not stand beside the chat: a top bar carries the wordmark, "new board" and a
  menu button, and the rail's sections (`RailSections`) open in a `Drawer`.
- Chat opens as its own bordered tile with a clip-path reveal (see the motion gotcha).
- Model switcher (`raijin`, `perun`, `indra`). Modes are Design, Review and Fab, each with its own
  suggestion chips.
- Settings is a two-pane modal with left navigation: `TabsVertical` around a `Modal`, the tab list
  in its navigation slot and the panels in its body.
- An agent reply is one bordered tile with an ink header, ruled into sections: run steps, checks,
  prose, figures, tables, forms, footer. Replies are typed data rendered by one component per
  section type. Never render model output as raw HTML.
- Reply forms use radio groups with sub-descriptions, checkboxes with trade-off notes, the
  tick-mark slider with live readout, text inputs and textareas.
- No backend yet. `src/lib/agent.ts` streams replies from fixtures, and its `route()` maps a
  prompt to one of them. That table is the seam a real model replaces — keep prompt→reply
  selection there, never in a component.
- No `AILabel`. Carbon's AI label is ported and stays in the design system, but kiln does not
  wear it: decided 2026-10-13. Everything kiln shows is the agent's, so marking it says nothing.
- "Attach reference" on the composer is the prototype's own and stays, inert until there is
  somewhere to attach to. It is not the file picker listed below.
- Removed on purpose: file picker and import (the flow is purely generative), the jobs/run panel,
  rail collapse, and duplicate close buttons in the chat head.

## Conventions

- TypeScript `strict`, no `any`.
- Idiomatic Solid: components run once. Don't destructure props (use `splitProps` and
  `mergeProps`), use `<Show>`, `<For>` and `<Switch>`, `createMemo` for derived values, and stores
  for nested state. Don't port React habits.
- Tailwind utilities only. The one exception is `theme.css` in `design`: tokens, keyframes, the
  few utilities Tailwind cannot express, and element defaults. No per-component CSS files. A
  class string that several components share is a named constant in `internal/styles.ts`, not a
  CSS class.
- Style Corvu state through the data attributes it sets.
- Every app works at a phone viewport as well as on desktop — and at the widths in between,
  which is where a zoomed desktop lands (150% zoom on a 1440px window is 960 CSS px wide and
  about 620 tall).
  - A layout of fixed lanes shows what fits and switches between the rest; it never clips. A
    lane that is too tall for the window scrolls.
  - A column that has no room becomes a `Drawer`, not a hidden element. Nothing an app does on
    a desktop is out of reach on a phone.
  - A responsive grid states its base: `grid grid-cols-1 sm:grid-cols-2`, never just
    `grid sm:grid-cols-2`. Left implicit, the single column is as wide as its widest item's
    min-content, which on a phone is wider than the screen.
  - Under a coarse pointer every control is at least 44px: fields too, not only buttons.
- **Three engines: Chromium, Firefox, WebKit.** The apps lay out box-for-box the same in all
  three, and it is cheap to keep that: measure every element's box in each and diff them, rather
  than comparing screenshots. Measure at a 40px root font size (everything is rem, so it is the
  same page 2.5× larger) — at 40px every step of the type scale has a whole-pixel glyph width,
  which takes out the noise from WebKitGTK rounding glyph advances. Where the engines have
  actually differed, so far:
  - **A size that depends on itself.** `aspect-square` or a percentage height inside an `auto`
    grid track or a stretched flex item resolves three ways in three engines (mica's viewport
    toolbar; the time picker's field). State the size, or let the item stretch as a flex item.
  - **Paint order of things sharing a grid cell.** A scrolling pane is painted as its own layer;
    WebKit puts that above an unpositioned sibling in the same cell. Give an overlay `relative`.
  - **A transition does not start from a change an animation made.** That is the spec, and
    Firefox follows it. Don't drive a `transition` off an animated custom property.
  - **A selected `<svg>`.** Chromium paints selected SVG text with its `fill`, not `color`;
    WebKit washes the whole box in the highlight. `theme.css` handles both — check a selection
    dragged across a chart.
  - **Form-control internals**: how a range input's thumb is boxed and placed.
  Not a difference in the engine: where a long unbroken string wraps (each follows its own
  line-breaking tables), and text a few percent narrower in WebKitGTK when font hinting is on.

## Open decisions — ask before choosing

1. ~~**How apps reach mica.**~~ Settled (2026-10-15): **a local service** — `mica serve`, mica's
   HTTP API — reached through `lib/mica.ts`. Still open, so ask: whether the desktop app starts
   mica itself (a sidecar, or `mica::server` mounted in the crate) rather than expecting it to
   be running, and whether the Rust crates join this repo under `crates/`. **shale** — G-code,
   and the printer connection — is not wired in yet; the printer side stays on fixtures.
2. **Hub backend:** auth, git hosting, LFS, search. None yet; server functions return fixtures.
3. **Agent backend**, and its contract with `@alumina/eda`.
4. ~~**Lint and format.**~~ Settled: **Deno** (`deno fmt`, `deno lint`), configured in `deno.json`.
   Deno is the tooling binary only — it is not the runtime, and apps still run on Node 24 under
   Vite. `pnpm fmt` and `pnpm lint` at the root wrap it.

## Don't

- Touch `packages/eda` or `packages/www`: no scaffolding, edits or dependency changes.
- Edit anything in `docs/prototypes/`.
- Reintroduce anything listed above as removed.
- Use colour anywhere outside code blocks.
- Use odd or fractional numbers in Tailwind classes.
- Put a component or visual style in an app when another app will need it.
