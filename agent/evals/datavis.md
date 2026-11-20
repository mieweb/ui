# Evals — Charts / maps / decks / org charts

Primary agent: **MIE UI DataVis Agent**. See [README.md](./README.md) for
format and scoring. The #606 done-when: the agent routes correctly vs the
Grids agent (charts ≠ grids) and answers these without inventing API.

### DV-1 — Chart vs grid routing (the boundary)

- **Ask:** "I fetched a dataset and want a chart the user can regroup and change axes on."
- **Expect:** That's `DataVisNitroGraph` over a `DataVisNitroSource` — the
  Grids domain (route/defer to the Grids Agent, cite the datavis-api skill).
  The charts family is for presentation visuals, not dataset exploration.
- **Agent:** MIE UI Grids Agent (via the DataVis Agent's redirect)
- **Source:** mieweb-ui-charts skill — Which visual?; grids.md GRD-14

### DV-2 — Inline trend

- **Ask:** "I need a tiny trend indicator inside a table cell / stat card."
- **Expect:** `Sparkline` from the **main** entry — pure HTML, no chart
  library, no peers. `data: SparklinePoint[]` is pre-bucketed
  (`{ key, label?, value }`); it does not aggregate. `onSelect` makes bars
  clickable toggles; without it the bars are read-only.
- **Agent:** MIE UI DataVis Agent
- **Source:** src/components/Sparkline/Sparkline.tsx

### DV-3 — Globe won't build

- **Ask:** "Importing `@mieweb/ui/globe` fails to resolve `react-globe.gl`."
- **Expect:** `/globe` needs the optional peers `react-globe.gl>=2.30.0` +
  `three>=0.160.0` (~700KB, deliberately out of the main bundle). Optional
  peers don't warn at install — the entry just fails without them.
- **Agent:** MIE UI DataVis Agent
- **Source:** src/globe.ts header; package.json peerDependencies

### DV-4 — Broken map tiles

- **Ask:** "PointMap shows markers but the map looks like an unstyled tile mosaic."
- **Expect:** Missing `import 'leaflet/dist/leaflet.css'` — the one required
  CSS import for `/maps` (plus `leaflet>=1.9.0` as peer).
- **Agent:** MIE UI DataVis Agent
- **Source:** src/maps.ts header; PointMap.stories.tsx

### DV-5 — SSR crash

- **Ask:** "Globe/OrgChart throws `window is not defined` in my Next.js build."
- **Expect:** Only **Globe** needs a dynamic import with `ssr: false` —
  `react-globe.gl` touches `window` at module scope, so a Client Component
  boundary alone still prerenders and crashes. OrgChart/Deck just need a
  client boundary, and PointMap prerenders safely (Leaflet is
  dynamic-imported in an effect — keep its accessible point list in the
  initial HTML). Sparkline and the report sections are server-safe.
- **Agent:** MIE UI DataVis Agent
- **Source:** Globe MAINTAINERS.md; PointMap MAINTAINERS.md; entry headers
  src/org-chart.ts, src/deck.ts

### DV-6 — OrgChart missing styles

- **Ask:** "OrgChart renders nodes but edges and the canvas look unstyled."
- **Expect:** Import `@xyflow/react/dist/style.css` once; `/org-chart` also
  needs peers `@xyflow/react>=12.0.0` + `elkjs>=0.9.0` (elkjs ~1.6MB,
  lazy-loaded on first layout from its bundled build).
- **Agent:** MIE UI DataVis Agent
- **Source:** src/org-chart.ts header; OrgChart MAINTAINERS.md

### DV-7 — Deck slide wants a callback

- **Ask:** "How do I put an onClick handler / custom React element inside a Deck slide?"
- **Expect:** You don't — slides are **JSON-only** (no functions, elements,
  closures). Behavior and custom rendering come through the registries:
  `renderers` (slide types), `graphics` (named components for
  `{ type: 'custom', component: 'name' }`), `components` (framework
  image/link), `labels`, `onSlideChange`.
- **Agent:** MIE UI DataVis Agent
- **Source:** Deck MAINTAINERS.md; Deck.tsx props

### DV-8 — Map inside a deck

- **Ask:** "A slide in my Deck needs a geographic map."
- **Expect:** Register PointMap in the `graphics` map
  (`<Deck graphics={{ map: PointMap }} />`) and reference it from a slide's
  `graphic` field — e.g. a `chart` slide with
  `graphic: { type: 'custom', component: 'map', props }`. A top-level
  `{ type: 'custom' }` **slide** resolves through `renderers` instead and
  renders nothing without one.
- **Agent:** MIE UI DataVis Agent
- **Source:** Deck.tsx slide resolution; Deck graphics.tsx custom lookup

### DV-9 — Globe stuck in light mode

- **Ask:** "After toggling dark mode, the Globe keeps its old colors."
- **Expect:** Globe never reads CSS tokens — a fixed hex default palette
  merges with the `theme` prop on every render, so remounting alone changes
  nothing. Resolve brand tokens host-side and pass/update an explicit
  `theme: GlobeTheme`.
- **Agent:** MIE UI DataVis Agent
- **Source:** Globe.tsx DEFAULT_THEME merge

### DV-10 — Globe with no land

- **Ask:** "On our locked-down network the Globe renders ocean but no continents."
- **Expect:** Continent outlines come from the runtime `geoUrl` fetch (not
  bundled). Pass a self-hosted GeoJSON URL, or `null` to skip land hexes.
- **Agent:** MIE UI DataVis Agent
- **Source:** Globe MAINTAINERS.md; Globe.tsx geoUrl

### DV-11 — Custom tooltip XSS

- **Ask:** "Can I put rich HTML in Globe point tooltips?"
- **Expect:** Yes via `pointLabel`, but it returns **raw HTML** — the caller
  owns sanitization (the default label HTML-escapes). Flag the XSS risk for
  user-derived names.
- **Agent:** MIE UI DataVis Agent
- **Source:** Globe MAINTAINERS.md — tooltip HTML

### DV-12 — Production tiles

- **Ask:** "We're shipping PointMap to all customers — anything to change from the demo?"
- **Expect:** The default `tileUrl` is OpenStreetMap — production/heavy use
  must configure a licensed tile service and matching `attribution`.
- **Agent:** MIE UI DataVis Agent
- **Source:** PointMap.tsx tileUrl/attribution docs

### DV-13 — Map accessibility

- **Ask:** "Can I set `hideList` to clean up the UI under the PointMap?"
- **Expect:** Caution — the text list **is** the accessible data (the map is
  `role="group"`, not an image; Leaflet canvas has no accessible tree). Only
  hide it if the same data is rendered elsewhere on the page.
- **Agent:** MIE UI DataVis Agent
- **Source:** PointMap MAINTAINERS.md — a11y model

### DV-14 — Regional shading

- **Ask:** "I want a US map where every state is shaded by a metric bucket and small states stay visible."
- **Expect:** `TileCartogramSection` (`/templates`, server-safe) — every
  region equal size, shaded by bucket. `PointMap` is for real geographic
  positions/bubbles instead.
- **Agent:** MIE UI DataVis Agent
- **Source:** Reports.mdx; charts skill matrix

### DV-15 — YChart import

- **Ask:** "How do I import YChart from @mieweb/ui?"
- **Expect:** You can't — YChart is a Storybook-only evaluation of the
  `packages/ychart` submodule, **not exported from any entry**. Use
  `OrgChart` (hierarchy) or `DataVisNitroGraph` (charting), or install
  `@mieweb/ychart` directly and own the integration. Inventing an import
  path FAILS.
- **Agent:** MIE UI DataVis Agent
- **Source:** YChart MAINTAINERS.md; DataDisplay.mdx

### DV-16 — OrgChart data hygiene

- **Ask:** "My org data has a cycle and some employees point at managers that don't exist — will OrgChart crash?"
- **Expect:** No — input is normalized to a forest: first duplicate id wins,
  unknown-parent nodes become roots, cycles are broken. But fix the data;
  and reason about the normalized tree, not raw `parentId`.
- **Agent:** MIE UI DataVis Agent
- **Source:** OrgChart MAINTAINERS.md — buildOrgForest

### DV-17 — OrgChart keyboard path

- **Ask:** "Is the OrgChart canvas keyboard accessible?"
- **Expect:** The canvas is pointer-first; the **list view** is the
  keyboard/screen-reader path (WAI-ARIA tree pattern, default view under
  640px). Keep it reachable; detail panel is a non-modal dialog. Full audit
  → A11y agent.
- **Agent:** MIE UI DataVis Agent
- **Source:** OrgChart MAINTAINERS.md — a11y

### DV-18 — OrgChart theming

- **Ask:** "How do I give each department its own color in OrgChart?"
- **Expect:** `getGroupAccent(group, index)` returning **token names**
  (drawn as wash + marker, never as text color); React Flow chrome themes
  via `--xy-*` variables mapped from `--mieweb-*`. No raw hex.
- **Agent:** MIE UI DataVis Agent
- **Source:** OrgChart.tsx getGroupAccent; MAINTAINERS.md theming

### DV-19 — Shared barrel trap

- **Ask:** "Can I re-export PointMap and Globe from our app's shared components barrel?"
- **Expect:** No — their optional peers would hard-break every page that
  imports the barrel without leaflet/three installed. Keep chart imports at
  the subpath entry, inside the pages that use them.
- **Agent:** MIE UI DataVis Agent
- **Source:** Globe/PointMap MAINTAINERS.md — main-entry warnings

### DV-20 — Deck i18n

- **Ask:** "How do I localize a Deck — numbers and the chrome labels?"
- **Expect:** `locale` (BCP-47) drives number formatting; `labels` overrides
  the chrome strings; slide content is the host's data. There's an RTL
  story. String audits → i18n agent.
- **Agent:** MIE UI DataVis Agent
- **Source:** Deck.tsx props; Deck.stories.tsx RTL

### DV-21 — Chart a11y posture

- **Ask:** "Are the Deck charts screen-reader accessible?"
- **Expect:** Yes by design: every built-in chart ships an `sr-only` value
  table and the drawing is `aria-hidden`; count-ups respect
  `prefers-reduced-motion`. Custom `graphics` must carry the same posture.
- **Agent:** MIE UI DataVis Agent
- **Source:** Deck MAINTAINERS.md — a11y

### DV-22 — Testing the map

- **Ask:** "My vitest unit test for the PointMap page explodes inside Leaflet."
- **Expect:** Leaflet can't run in jsdom — don't unit-test the map itself;
  cover it in Storybook/Playwright. (Similarly: Globe has no visual
  regression — WebGL isn't pixel-deterministic.)
- **Agent:** MIE UI DataVis Agent
- **Source:** PointMap MAINTAINERS.md; Globe MAINTAINERS.md

### DV-23 — Canned reports

- **Ask:** "We need to render existing WebChart reports with a date-range picker — which component family?"
- **Expect:** `WebChartReportViewer` + `ReportTimeRange`/`ReportDatePicker`
  (main entry) for canned backend reports; `ReportDashboard` for the KPI +
  bar-chart analytics page. For report *pages*, compose the `/templates`
  sections (Methodology, Byline, Legend, MetricStatusBadge…).
- **Agent:** MIE UI DataVis Agent
- **Source:** WebChartReportViewer/index.ts; Dashboards.mdx; Reports.mdx
