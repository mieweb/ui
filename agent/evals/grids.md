# Evals — DataVis NITRO + eSheet grids

Primary agent: **MIE UI Grids Agent**. See [README.md](./README.md) for
format and scoring. Selection-level grid questions (Table vs NITRO) live in
[selection.md](./selection.md); these cover configuration, APIs and
debugging of a chosen grid.

### GRD-1 — Minimal NITRO setup

- **Ask:** "What's the minimal code to show a sortable, filterable grid over a JSON endpoint?"
- **Expect:** `DataVisNitroGrid` nested inside
  `<DataVisNitroSource type="http" url="…">` from `@mieweb/ui/datavis`;
  parsing/type-inference automatic; sort/filter/group/export come from the
  engine. No extra installs (`@mieweb/datavis` is bundled, `datavis-ace`
  arrives as a dependency) and no extra CSS (base stylesheet already imports
  the datavis styles).
- **Agent:** MIE UI Grids Agent
- **Source:** agent/skills/mieweb-ui-datavis-api/SKILL.md — Architecture/Source; DataVisNITRO MAINTAINERS.md

### GRD-2 — Empty grid, no error

- **Ask:** "My DataVisNitroGrid renders nothing and the console is clean."
- **Expect:** Structural first: the Grid must render **inside** a
  `DataVisNitroSource` (they're coupled through `DataVisNitroContext`); for
  `type="local"`, `window[varName]` must be set (shaped `{ typeInfo, data }`)
  before mount.
- **Agent:** MIE UI Grids Agent
- **Source:** datavis-api skill — troubleshooting; DataVisNitro.tsx

### GRD-3 — Source is not a constructor

- **Ask:** "I get `datavis_ace.Source is not a constructor` at runtime."
- **Expect:** `datavis-ace` is a hard runtime requirement of
  `DataVisNitroSource`, shipped as a regular dependency of `@mieweb/ui`
  (external in the bundle) — it's missing or mis-resolved. Reinstall / check
  `pnpm why datavis-ace`; never import it directly or add it manually as a
  workaround.
- **Agent:** MIE UI Grids Agent
- **Source:** DataVisNITRO MAINTAINERS.md — Dependencies

### GRD-4 — Local data without a server

- **Ask:** "How do I feed an in-memory array of rows to a NITRO grid?"
- **Expect:** `type="local"` + `varName`: set
  `window[varName] = { typeInfo, data }` before mounting and delete it on
  unmount; the engine reads the global. Changing `varName` rebuilds the
  source.
- **Agent:** MIE UI Grids Agent
- **Source:** DataVisNitro.tsx — LocalDataVisNitroSourceProps; demo stories LocalDataset

### GRD-5 — Column API

- **Ask:** "How do I pin a column, set a header label, and render HTML in cells?"
- **Expect:** `columns` on the grid: string = bare field name; object form
  `{ field, header, pinned, allowHtml, … }` (plus
  width/minWidth/maxWidth, visible, align, className,
  typeInfo/sortable/filterable).
- **Agent:** MIE UI Grids Agent
- **Source:** nitro-columns.ts — DataVisNitroColumn; table/types.ts — TableColumn

### GRD-6 — Grouping declaratively

- **Ask:** "I'm calling `view.setGroup(…)` through DataVisNitroContext to group my grid — is that right?"
- **Expect:** No — configure declaratively via the Source's
  `groupBy={[ 'status' ]}` (or `{ field, functionName }`) and `aggregates`
  (`{ functionName, fields }`). Imperative context calls are
  library-internal composition (e.g. `OrdersGroupPresets`), not consumer
  API, and fight the declarative props.
- **Agent:** MIE UI Grids Agent
- **Source:** DataVisNITRO MAINTAINERS.md — gotchas; datavis-api skill — Source

### GRD-7 — Checkbox selection + bulk actions

- **Ask:** "Users need to select multiple rows and run a bulk delete."
- **Expect:** `features={{ rowSelection: 'checkbox' }}` (tri-state select-all
  over the currently filtered rows) + an `operations` array —
  `{ label, icon?, category?, callback(ctx) }` with `ctx.rows` as the
  selection; surfaces in the operations palette. `onSelectionChange` for
  host-side tracking.
- **Agent:** MIE UI Grids Agent
- **Source:** table/types.ts — TableFeatures; DataVisNITRO.stories.tsx — Operations

### GRD-8 — Feature flags inventory

- **Ask:** "What built-in behaviours can I toggle on the grid without custom code?"
- **Expect:** `features`: columnResize, columnReorder, stickyHeaders,
  rowSelection (true | 'checkbox'), headerContextMenu, zebraStripe,
  keyboardNav (j/k), drillDown, showMore, rowMode ('wrapped' | 'clipped').
  Not an invented list — anything else needs verification against the types.
- **Agent:** MIE UI Grids Agent
- **Source:** table/types.ts — TableFeatures

### GRD-9 — Virtualization

- **Ask:** "How do I turn on row virtualization for my 50k-row grid?"
- **Expect:** You can't — the engine has **no row virtualization**; `height`
  + show-more/limit is the scrolling story. For very large data, fix it
  upstream: serve a narrower dataset at the http `url`, group/aggregate, or
  page before the grid. Honest-limit answers pass; invented virtualization
  props FAIL.
- **Agent:** MIE UI Grids Agent
- **Source:** datavis-api skill — Grid chrome/troubleshooting (verified: no virtualization in packages/datavis)

### GRD-10 — Server-side rows?

- **Ask:** "Does NITRO support a server-side row model like AG Grid Enterprise?"
- **Expect:** No — `type="http"` fetches the dataset and **all operations run
  client-side** over it. The server-side pattern is serving the right
  dataset at `url`. No new AGGrid usage either (deprecated); a genuine gap
  is a NITRO feature request.
- **Agent:** MIE UI Grids Agent
- **Source:** datavis-api skill — Source; MAINTAINERS.md — Prefer NITRO over AGGrid

### GRD-11 — Detail rows

- **Ask:** "Can a row expand to show a full-width detail panel?"
- **Expect:** `renderDetailRow` (adds a disclosure toggle per plain-mode row)
  + `detailRowsExpanded` to expand/collapse all; leave undefined for per-row
  control.
- **Agent:** MIE UI Grids Agent
- **Source:** DataGrid.tsx — renderDetailRow/detailRowsExpanded

### GRD-12 — Minimal chrome

- **Ask:** "I want the grid without the title bar — just the table with a floating menu."
- **Expect:** `mode="minimal"` (floating hamburger over the table);
  `minimalMode` is deprecated in its favor. `'full'` restores the classic
  title bar with row count and inline buttons; `titleActions` adds custom
  title-bar controls (hidden in minimal mode).
- **Agent:** MIE UI Grids Agent
- **Source:** DataGrid.tsx — mode/minimalMode/titleActions

### GRD-13 — Perspectives on shared devices

- **Ask:** "We deploy on shared kiosk machines — users' pinned grid views are leaking between logins."
- **Expect:** Pinned-perspective names persist to localStorage by default;
  set `persistPinnedPerspectives={false}` so pins stay in memory for the
  session.
- **Agent:** MIE UI Grids Agent
- **Source:** DataGrid.tsx — persistPinnedPerspectives

### GRD-14 — Grid + chart over one fetch

- **Ask:** "A dashboard needs the same records as a grid and a chart the user can reconfigure — do I fetch twice?"
- **Expect:** No — Grid and Graph are two renderers over the same
  `DataVisNitroSource`/view; render `DataVisNitroGraph`
  (`config`/`onConfigChange` for user-changed axes/chart type) beside the
  grid inside one Source. Tiny inline trend → `Sparkline` instead.
- **Agent:** MIE UI Grids Agent
- **Source:** Grids.mdx — How they fit together; DataVisNitroGraph.tsx

### GRD-15 — i18n of the grid

- **Ask:** "How do I localize the grid's labels and number/date formats?"
- **Expect:** `locale` (BCP-47) drives number/date formatting; `trans`
  (TranslateFn) threads through the engine's labels;
  `DataVisNitroLanguageSelector` is the ready-made switcher. Deeper string
  audits → i18n agent.
- **Agent:** MIE UI Grids Agent
- **Source:** DataVisNitro.tsx — trans/locale; stories LocalizedGrid

### GRD-16 — Grid accessibility

- **Ask:** "Is the NITRO grid screen-reader accessible?"
- **Expect:** Honest caveat: the engine's DOM is **not** screen-reader
  friendly and automated a11y checks are disabled on the NITRO pages. Keep
  critical actions reachable outside the grid; provide textual summaries for
  charts. Full audit → A11y agent.
- **Agent:** MIE UI Grids Agent
- **Source:** Grids.mdx — Shared limitations

### GRD-17 — Hover row actions

- **Ask:** "I need per-row edit/delete buttons that appear on hover, consistent with our Table rows."
- **Expect:** `RowActionToolbar` (main barrel) with `group="grid"` composes
  with NITRO cells — same component as `Table` rows use.
- **Agent:** MIE UI Grids Agent
- **Source:** Grids.mdx — How they fit together

### GRD-18 — Pagination on a NITRO grid

- **Ask:** "Which component adds page controls under my NITRO grid?"
- **Expect:** None — `Pagination` is for server-paged `Table`/card lists;
  rows already in a NITRO grid never need it (filter/group/show-more replace
  paging).
- **Agent:** MIE UI Grids Agent
- **Source:** Grids.mdx — Which one? (Pagination row)

### GRD-19 — eSheet pair contract

- **Ask:** "How do Builder and Renderer hand data to each other, and where's the submit button?"
- **Expect:** Builder `onChange` emits a `FormDefinition`; Renderer takes it
  as `formDataInput` and returns validated answers as a `FormResponse` via
  its ref's `getValidResponse()`. There is **no** submit button and no
  persistence — the host stores definition and response. Entry
  `@mieweb/ui/esheet` with optional peers `@esheet/builder` +
  `@esheet/renderer`.
- **Agent:** MIE UI Grids Agent
- **Source:** CompositeForms.mdx — the eSheet pair; src/esheet.ts

### GRD-20 — Clinical fields unknown

- **Ask:** "My eSheet definition uses `medicationList` but the Renderer shows an unknown field type."
- **Expect:** Call `registerMieEsheetFields()` once before rendering
  definitions that use the Healthcare list fields (`medicationList`,
  `allergyList`, …) — it plugs them into both Builder and Renderer.
- **Agent:** MIE UI Grids Agent
- **Source:** src/esheet.ts; CompositeForms.mdx — two install surfaces

### GRD-21 — EncounterVisit RichEdit stack

- **Ask:** "EncounterVisit's RichEdit mode won't load in my app — what does it need beyond @esheet?"
- **Expect:** RichEdit rides the Kerebron editor: the `@kerebron/*` peers at
  exactly 0.8.12 + ProseMirror overrides, `@mieweb/ui/kerebron.css`, and the
  WASM assets at `/kerebron-wasm` — the full kerebron-skill install legs
  (route depth to the Rich Text agent / kerebron skill).
- **Agent:** MIE UI Grids Agent
- **Source:** src/esheet.ts header; MIGRATION.md — eSheet and EncounterVisit

### GRD-22 — AGGrid escape hatch

- **Ask:** "NITRO doesn't do X that AG Grid does — can I use `@mieweb/ui/ag-grid` for this one grid?"
- **Expect:** No — `AGGrid` is deprecated, never for new work. Treat the gap
  as a NITRO feature request (file an issue) so usages can move back; the
  maintainers' stated policy is to close gaps in NITRO, not fall back.
- **Agent:** MIE UI Grids Agent
- **Source:** MAINTAINERS.md — Prefer NITRO over AGGrid; Grids.mdx policy

### GRD-23 — Orders grids as the pattern

- **Ask:** "We're building an order-history grid with group-by chips and bulk status updates — is there prior art?"
- **Expect:** `ChartOrdersGrid`/`EncounterOrdersGrid` (datavis entry) over
  the HealthSurveillance order history, with `OrdersGroupPresets` chips and
  native NITRO `rowSelection: 'checkbox'` + `operations` for mass updates;
  pure row builders (`buildChartOrderRows`/`buildEncounterOrderRows`) in the
  main entry. Copy the composition, don't re-implement it.
- **Agent:** MIE UI Grids Agent
- **Source:** src/datavis.ts; ordersGridShared.tsx
