---
name: mieweb-ui-charts
description: Chart, map, globe and presentation components of @mieweb/ui — Sparkline, DataVisNitroGraph pointer, Deck slide decks, Globe, PointMap, OrgChart, TileCartogramSection and the report-template sections. Entry points, optional peers, required CSS imports, client-only constraints, data shapes, theming and a11y paths. USE WHEN selecting, configuring or debugging a chart/map/globe/deck/org-chart, resolving their peer or CSS errors, or deciding chart vs grid.
---

# @mieweb/ui charts, maps & presentation visuals

Sourced from the entry-file headers (`src/deck.ts`, `src/globe.ts`,
`src/maps.ts`, `src/org-chart.ts`), component MAINTAINERS notes, and the
catalog pages (Presentations, Reports, Dashboards, Records, Data Display).

> **Which visual?** Exploring a fetched dataset (axes the user can change)
> → **DataVisNitroGraph** beside its grid — that's the Grids domain (see the
> **mieweb-ui-datavis-api** skill). Tiny inline trend in a card/table row →
> **Sparkline** (main entry, dependency-free). Full-screen narrative →
> **Deck**. Real geographic locations → **PointMap**; equal-area regional
> shading (every state same size) → **TileCartogramSection**; global
> network showcase → **Globe**. Reporting lines / location hierarchy →
> **OrgChart**. Canned backend reports → **WebChartReportViewer** /
> **ReportDashboard** (main entry). **YChart is not a component** — it's a
> Storybook-only evaluation of the `@mieweb/ychart` submodule; point
> consumers at OrgChart or DataVisNitroGraph.

## Entry / peers / CSS matrix

| Component | Entry | Optional peers | Required CSS | Client-only? |
| --- | --- | --- | --- | --- |
| `Sparkline` | main `@mieweb/ui` | none | none | SSR-safe |
| `DataVisNitroGraph` | `/datavis` | none (engine bundled) | base styles.css | yes |
| `Deck` | `/deck` | none beyond main | built into `@mieweb/ui/styles.css` | yes (scroll/keys/fullscreen) |
| `Globe` | `/globe` | `react-globe.gl>=2.30.0`, `three>=0.160.0` (~700KB) | none (WebGL canvas) | yes — `ssr: false` boundary |
| `PointMap` | `/maps` | `leaflet>=1.9.0` | **`leaflet/dist/leaflet.css`** | client boundary; prerenders safely (Leaflet dynamic-imported in an effect) |
| `OrgChart` | `/org-chart` | `@xyflow/react>=12.0.0`, `elkjs>=0.9.0` | **`@xyflow/react/dist/style.css`** | client boundary |
| Report sections (`TileCartogramSection`, `BenchmarkTableSection`, `RankedListSection`, `MetricListSection`, `ReportMethodology`, `ReportByline`, `ReportLegend`, `MetricStatusBadge`, `LinkGroupsSection`, `PdfEmbedSection`) | `/templates` | none | base styles.css | server-safe |
| `WebChartReportViewer`, `ReportDashboard` | main | none | base styles.css | SSR-safe |

The chart peers are **optional**: installs don't warn when absent, but the
subpath entry hard-fails to resolve without them. They are kept out of the
main bundle deliberately — never re-export these components from your own
shared barrel that non-map/globe pages import.

## Sparkline (main entry)

Pure-HTML bars, no chart library. `data: SparklinePoint[]`
(`{ key, label?, value }` — pre-bucketed; it does not aggregate),
`selectedKey`/`onSelect` (bars become toggle buttons; read-only without
`onSelect`), `label`, `height` (px, default 32), `formatValue(point)` for the
tooltip, `ariaLabel`. A11y: `role="group"` + labels; it is a glanceable
summary, not a data-exploration surface.

## Deck (`@mieweb/ui/deck`)

Full-screen slide deck rendered from **JSON slides** — no functions,
elements or closures in the slide array; site behavior arrives through
props: `renderers` (override/add slide types; top-level `{ type: 'custom' }`
**slides** resolve here and render nothing without one), `graphics`
(components for a slide's `graphic: { type: 'custom', component: '<name>',
props }` — e.g. `<Deck graphics={{ map: PointMap }} />` with a `chart`
slide), `components` (framework
image/link), `icons`, `labels` (chrome strings), `locale` (BCP-47 number
formatting), `syncHash` (default true — slide deep-links in
`location.hash`), `home`, `onSlideChange`. ~24 built-in slide types plus
built-in graphic renderers `bar`, `horizontal-bar`, `multi-line`,
`kpi-row`, `spark`. Fills the viewport (`h-dvh`) — hide site chrome on deck
routes. A11y: every chart ships an `sr-only` value table, drawings are
`aria-hidden`, count-ups respect `prefers-reduced-motion`; reveal is
CSS-only (reduced-motion and print show everything). The window key handler
skips typing targets and `role="tab"` elements.

## Globe (`@mieweb/ui/globe`)

`react-globe.gl` + three.js showcase globe. `points: GlobePoint[]`
(`{ id, lat, lng, name, sub?, hub?, color?, timeZone?, flag?, href? }`),
`arcs` (`kind: 'backbone' | 'spoke'`), `connectHubs`, `hexResolution` (2–4),
`pointOfView`, `autoRotateSpeed` (respects `prefers-reduced-motion`),
`selectedId`/`onSelect`/`onPointHover`, `callout`, `height` (default
`clamp(360px, 54vw, 560px)`). Traps:

- Globe never reads CSS tokens: a fixed hex default palette merges with the
  `theme` prop on every render, so remounting alone changes nothing. Resolve
  `--mieweb-*` tokens host-side and pass/update an explicit `GlobeTheme` for
  brand or dark-mode colors.
- `geoUrl` (continent outlines) is **fetched at runtime**, not bundled —
  offline/locked-down hosts pass `null` (skip land hexes) or a self-hosted
  GeoJSON URL.
- The default `pointLabel` HTML-escapes names; a custom `pointLabel` returns
  **raw HTML** — the caller owns sanitization.
- Visual showcase only: the WebGL canvas has no accessible tree; put the
  real data in accompanying text/table content.

## PointMap (`@mieweb/ui/maps`)

Leaflet dots/bubbles map. `points: MapPoint[]`
(`{ lat, lng, label, value?, detail? }`), required `label` (accessible map
name), `center`/`zoom` (seed initial state only — not reactive deps),
`tileUrl` + `attribution` (**default is OpenStreetMap; production/heavy use
must configure a licensed tile service**), `outlineUrl` (runtime-fetched
GeoJSON overlays), `sizeBy: 'value' | 'none'`, `showValues`, `hideList`.
A11y model: the map is `role="group"` with `aria-roledescription="map"`;
**the text list under the map is the accessible data** — `hideList` opts out
of it, so keep it unless the same data is rendered elsewhere. Colors come
from runtime `--mieweb-*` tokens (Leaflet paints outside Tailwind). Leaflet
cannot run in jsdom — verify map behavior in Storybook/Playwright, not unit
tests. In a Deck, register it in `graphics` and reference it from a slide's
`graphic: { type: 'custom', component: 'map', props }` (e.g. a `chart` slide).

## OrgChart (`@mieweb/ui/org-chart`)

React Flow canvas + elkjs layered layout over a **flat node list**:
`nodes: OrgChartNode[]` (`{ id, parentId, name, title?, subtitle?, group?,
avatarUrl?, meta? }`). The input is normalized to a forest (`buildOrgForest`
keeps the first duplicate id, promotes unknown-parent nodes to roots, breaks
cycles) — reason about the normalized tree, not raw `parentId`. Key props:
`nodeVariant: 'person' | 'location'`, `direction: 'DOWN' | 'RIGHT'` (RTL
mirrors the x-axis), `initialDepth`, `focusId`/`highlightedId`,
`view`/`defaultView: 'chart' | 'list'` (list is the default under 640px),
`defaultQuery`/`defaultGroup`, `getGroupAccent` (returns token names, never
raw colors), `onSelect`/`onOpen`/`getHref`, `renderDetail`, `labels` (every
string localizable, some are count functions), `classNames`. elkjs
(~1.6MB) is lazy-loaded on first layout from its **bundled** build. A11y:
the canvas is pointer-first; **the list view is the keyboard/screen-reader
path** (full WAI-ARIA tree pattern), the detail panel is a non-modal dialog.
Custom node content must not exceed the fixed card size (layout measures
nothing from the DOM).

## YChart (not shipped)

`src/components/YChart/` is a Storybook-only evaluation wrapper around the
`packages/ychart` git submodule (published separately as `@mieweb/ychart` —
vanilla D3 + YAML editor with its own `--yc-color-*` theming). It is **not
exported from any entry**. For app use: `OrgChart` (hierarchy) or
`DataVisNitroGraph` (charting); if a consumer truly wants the YAML editor,
they install `@mieweb/ychart` directly and own the integration.

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| Build fails resolving `react-globe.gl`/`three` or `@xyflow/react`/`elkjs` | Optional peers of `/globe` / `/org-chart` not installed (no install-time warning) | Install the pair listed in the matrix |
| Map renders as a broken/unstyled tile mosaic | `leaflet/dist/leaflet.css` not imported | Import it once where `PointMap` is used |
| OrgChart nodes float without edges/handles styling | `@xyflow/react/dist/style.css` missing | Import it once where `OrgChart` is used |
| Globe crashes during SSR (`window is not defined`) | `react-globe.gl` touches `window` at module scope — a Client Component boundary alone still prerenders | Dynamic import with `ssr: false` (Globe only — PointMap/OrgChart/Deck need just a client boundary; PointMap prerenders its accessible point list) |
| Globe colors stale after dark-mode toggle | Globe never reads CSS tokens — fixed hex defaults merge with `theme` each render | Resolve tokens host-side and update the `theme` prop (remount alone does nothing) |
| Globe renders ocean but no land | `geoUrl` runtime fetch blocked (offline/CSP) | Pass `null` or a self-hosted GeoJSON URL |
| Tile requests throttled / licensing concern | Default `tileUrl` is OpenStreetMap | Configure a licensed tile service + matching `attribution` |
| Deck slide "needs" a callback or JSX | Slides are JSON-only by design | Move behavior into `renderers`/`graphics`/`components` registries |
| `YChart` import not found | Not exported — Storybook-only submodule demo | Use `OrgChart` or `DataVisNitroGraph`; or install `@mieweb/ychart` directly |
| OrgChart drops/duplicates people | Duplicate ids, unknown `parentId`, or cycles in input | Input is normalized (first-id wins, orphans become roots, cycles broken) — fix the data |
| PointMap unit tests fail in jsdom | Leaflet can't run in jsdom | Cover with Storybook/Playwright instead |
| Screen reader gets nothing from the map/globe | Canvas has no accessible tree | Keep PointMap's list (`hideList` off) / pair Globe with text content |
