---
name: mieweb-ui-datavis-api
description: Deep API reference for @mieweb/ui grids — DataVis NITRO (DataVisNitroSource/Grid/Graph, column API, feature flags, grouping/aggregates, operations palette, perspectives) and the eSheet form pair (Builder/Renderer, registerMieEsheetFields, EncounterVisit). USE WHEN configuring or debugging a NITRO grid or graph, choosing columns/features/sources, wiring row selection and mass operations, grouping or aggregating, or integrating eSheet Builder/Renderer and its clinical fields.
---

# DataVis NITRO + eSheet in @mieweb/ui

Sourced from `src/catalog/Grids.mdx`, `CompositeForms.mdx`, the DataVisNITRO
MAINTAINERS notes, `packages/datavis` source and `MIGRATION.md`. Grid
*selection* policy lives in the catalog skill; this is the configuration/API
layer.

## Policy (non-negotiable)

> **Tables and data grids start with DataVis NITRO.** Use `Table` only for a
> few static rows the user will not sort, filter, page or export. Never
> hand-roll grid features on a plain table; `AGGrid` is deprecated.

`Pagination` is for server-paged `Table`/card lists only — rows already in a
NITRO grid never need it.

## Architecture

- Entry: **`@mieweb/ui/datavis`** — exports `DataVisNitroSource`,
  `DataVisNitroGrid`, `DataVisNitroGraph`, `DataVisNitroContext`,
  `DataVisNitroLanguageSelector`, plus `ChartOrdersGrid`/`EncounterOrdersGrid`
  and `OrdersGroupPresets`.
- **Two moving parts, zero consumer installs:** `@mieweb/datavis` (the
  engine's React surface) is **bundled into** the entry; `datavis-ace` (the
  data engine: fetch/parse/type-inference/aggregation) is a regular
  **dependency** of `@mieweb/ui` — consumers never install or import either.
- **Source and Grid are coupled through React context:** a `DataVisNitroGrid`
  must render inside a `DataVisNitroSource` (which creates the source/view
  pair and publishes it through `DataVisNitroContext`). **Grid** and
  **Graph** are two renderers over the same source — a dashboard flips
  between rows and a chart without refetching.
- Styles: the base `@mieweb/ui/styles.css` already imports
  `@mieweb/datavis/styles.css` — no extra CSS wiring.

## DataVisNitroSource

```tsx
<DataVisNitroSource type="http" url="/api/orders.json" groupBy={['status']}>
  <DataVisNitroGrid title="Orders" />
</DataVisNitroSource>
```

- `type: 'http'` — `url` is fetched by the engine; parsing and type inference
  are automatic. **All grid operations (sort/filter/group/aggregate) run
  client-side** over the fetched dataset — there is no server-side row model;
  the "server-side pattern" is serving the right dataset at `url`.
- `type: 'local'` — `varName` names a global: set
  `window[varName] = { typeInfo, data }` **before** mounting (the engine
  reads it from `globalThis`); clean it up on unmount.
- `type: 'file'` — user-supplied file (the engine's file picker/parse path).
- `groupBy?: Array<string | { field, functionName? }>` and
  `aggregates?: Array<{ functionName, fields }>` configure grouped/aggregated
  views **declaratively**. Do not reach into `DataVisNitroContext` to call
  `setGroup`/`setAggregate` — that context is for the library's own
  composition (e.g. `OrdersGroupPresets`), not the consumer API.
- Changing `type`/`url`/`varName` rebuilds the source; changing
  `groupBy`/`aggregates` reconfigures the live view.

## DataVisNitroGrid

A curated surface over the engine's `DataGrid` (the maintainers deliberately
`Omit` `view`/`children`/`allColumns` and re-add a vetted set — do not assume
an upstream `DataGrid` prop exists here without checking the types):

- **Chrome:** `title`, `helpText`, `titleActions` (title-bar React nodes),
  `mode: 'default' | 'full' | 'minimal'` (`minimalMode` is deprecated — use
  `mode="minimal"`), `showToolbar`, `showControls`, `height` (CSS value —
  this plus the engine's show-more/limit is the scrolling story; **there is
  no row virtualization**, so cap very large result sets at the source).
- **Columns:** `columns?: Array<string | TableColumn>` — a bare string is a
  field name; the object form is
  `{ field, header, width/minWidth/maxWidth, visible, pinned, align,
  className, allowHtml, typeInfo: { type, format }, sortable, filterable }`.
  Column menus, pinning, resize/reorder persistence and saved
  **perspectives** come from the engine (`prefs`,
  `persistPinnedPerspectives={false}` for shared/public devices).
- **Features** (`features?: TableFeatures`): `columnResize`, `columnReorder`,
  `stickyHeaders`, `rowSelection: true | 'checkbox'` (checkbox mode adds a
  tri-state select-all over the currently *filtered* rows),
  `headerContextMenu`, `zebraStripe`, `keyboardNav` (j/k), `drillDown`,
  `showMore`, `rowMode: 'wrapped' | 'clipped'`.
- **Rows:** `formatCell`, `onRowClick`, `onRowDoubleClick`,
  `onSelectionChange`, `renderDetailRow` + `detailRowsExpanded` (disclosure
  rows), `onColumnReorder`/`onColumnResize`/`onHeaderContextMenu`.
- **Mass operations:** `operations?: Operation[]` — each
  `{ label, icon?, category?, callback(ctx) }` surfaces in the operations
  palette; `ctx.rows` is the current selection. Pair with
  `features.rowSelection: 'checkbox'` for bulk edit/delete/export flows.
- **i18n/formatting:** `locale` (BCP-47) drives number/date formatting.
  `DataVisNitroLanguageSelector` is the UI-language mechanism — it switches
  the engine's own i18next language (toolbar/table strings). `trans` is
  narrower than it looks: it only customizes the built-in grouping-function
  labels; it does **not** translate the general grid UI.
- **Hover row actions:** `RowActionToolbar` with `group="grid"` (main
  barrel) composes with NITRO cells, same as with `Table` rows.

## DataVisNitroGraph

Same source, chart renderer: `columns`, `config?: Partial<GraphConfig>` +
`onConfigChange` (users may change axes/chart type), `locale`, `height`,
`className`. For a tiny inline dependency-free trend use `Sparkline` (main
barrel) instead.

## Real-world composition (orders grids)

`ChartOrdersGrid` / `EncounterOrdersGrid` (this entry) are NITRO grids over
HealthSurveillance order history; the pure row builders
(`buildChartOrderRows`/`buildEncounterOrderRows`) live in the **main** entry.
`OrdersGroupPresets` renders one-click group-by chips. Row selection and mass
operations there are native NITRO features — the pattern to copy, not
re-implement.

## Accessibility caveat

The DataVis engine's DOM is **not screen-reader friendly** and automated a11y
checks are disabled on the NITRO pages. Keep critical actions reachable
outside the grid and provide textual summaries for charts. Route full audits
to the A11y agent.

## eSheet (Builder/Renderer)

- Entry: **`@mieweb/ui/esheet`**; optional peers are **all four** `@esheet/*`
  packages — `@esheet/core`, `@esheet/fields`, `@esheet/builder`,
  `@esheet/renderer` — at matching versions (`>=0.0.6-17`), even for
  renderer-only use: the shared entry exports the builder too, so all four
  must resolve. Styles: Builder and Renderer import their
  `@esheet/styles` dependency automatically (explicit entry
  `@esheet/styles/styles.css`); keep loading `@mieweb/ui/styles.css` for
  composed UI components.
- **The pair:** `EsheetBuilder` (`definition`/`onChange`) emits a
  `FormDefinition`; `EsheetRenderer` takes that object as `formDataInput`.
  Answers come back two ways: imperatively via the ref's
  `getValidResponse()`, which returns `{ response: FormResponse | null,
  errors: ValidationError[] }` (`response` is `null` while invalid — store
  `response`, not the wrapper), or via the opt-in built-in submit button —
  pass `onSubmit` (+ `submitLabel`) and the Renderer renders it and calls
  back with the validated `FormResponse`; don't build a duplicate submit
  flow next to it. **Persistence is host-owned either way** — no autosave,
  no `name`, no server calls; the host stores definition and response.
- **Clinical fields:** `registerMieEsheetFields()` plugs the Healthcare list
  fields (`medicationList`, `allergyList`, …) into both Builder and
  Renderer — call it once before rendering definitions that use them.
- **EncounterVisit** (same entry) is the coded clinical visit document; its
  RichEdit mode rides the Kerebron editor — the `@kerebron/*` peers, WASM
  assets and `kerebron.css` from the **mieweb-ui-kerebron** skill apply.
- Known gaps: upstream axe failures (contrast, unlabeled landmarks, role-less
  drag handles) tracked in the mieweb/eSheet repo; no locale/translation
  hooks — built-in strings are English — but layout **does** mirror under an
  inherited `dir="rtl"` (panels swap, toolbar flips), with a handful of
  physical-direction styling gaps tracked as an upstream eSheet RTL
  enhancement; it themes via its own `--msprimary` tokens + `dark`
  class, independent of `ThemeProvider`.

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| `datavis_ace.Source is not a constructor` | `datavis-ace` missing/unresolved — it is a hard runtime requirement of `DataVisNitroSource` (ships as a regular dependency of `@mieweb/ui`, external in the bundle) | Reinstall; check the host's resolution (`pnpm why datavis-ace`) — never add it as a direct import |
| Grid renders nothing, no error | `DataVisNitroGrid` not inside a `DataVisNitroSource` (context is null) | Nest Grid/Graph inside the Source |
| `type="local"` grid is empty | `window[varName]` unset at mount, or not shaped `{ typeInfo, data }` | Set the global before mounting; delete it on unmount |
| Grouping/aggregation "doesn't stick" | Imperative `setGroup`/`setAggregate` calls on the context fight the declarative props | Use the Source's `groupBy`/`aggregates` props only |
| Huge dataset scrolls poorly | No virtualization in the engine — `height` + show-more/limit is the mechanism | Reduce the served dataset (http source), group/aggregate, or page upstream |
| "How do I turn on pagination?" | NITRO has no page controls; `Pagination` is for server-paged `Table`/card lists | Filtering/grouping/show-more replace paging in NITRO |
| Rows selectable but bulk action missing | `rowSelection` without `operations` | Add `operations` entries — `callback(ctx)` receives `ctx.rows` |
| Pinned perspectives leak across users on a kiosk | Pins persist to localStorage by default | `persistPinnedPerspectives={false}` |
| eSheet fields for meds/allergies render as unknown type | `registerMieEsheetFields()` not called | Call it once at startup before rendering such definitions |
| eSheet looks unstyled | Very old `@esheet/*` versions required manual CSS copying | Upgrade — current Builder/Renderer import `@esheet/styles` automatically |
| Grid needed AG Grid feature X | `@mieweb/ui/ag-grid` is deprecated | Treat the gap as a NITRO feature request (file an issue); don't start new AGGrid usage |
