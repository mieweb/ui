---
name: mieweb-ui-views
description: Views & layout components of @mieweb/ui — the ViewSet system (ListView, BoardView, CalendarView, GanttView, ViewSwitcher), dashboards (DashboardWidget, CustomizableDashboard), panels (DockablePanel, FloatingWindow) and the app shell (Sidebar, AppHeader, PageHeader). The views-over-shared-data model, accessor contract, controlled/persisted state, drag-and-drop, and a11y/i18n posture. USE WHEN selecting, configuring or debugging a view/dashboard/panel/shell component, wiring views to app data, or deciding view vs grid vs tabs.
---

# @mieweb/ui views & layout

Sourced from `src/views/MAINTAINERS.md` (the family's design contract),
component source/MAINTAINERS, and `src/catalog/Views.mdx` / `Dashboards.mdx`
/ `Layout.mdx`. Verify props against the installed `.d.ts` — never invent.

## Which layout?

> Most pages want **`ViewSet`** and nothing else: it renders the switcher,
> the enabled views, and shared slots. Reach for an individual view only
> when a page draws exactly one layout forever.

- **ViewSwitcher** — users pick between layouts of *one collection*. Two
  unrelated pages → `Tabs` instead.
- **ListView** — scannable vertical list, optional grouping, row slot you
  own. Rows need sorting/filtering/paging/export → DataVis NITRO (Grids
  domain).
- **BoardView** — items move between named stages and the stage is the
  primary fact. Stages fixed, items never move → ListView grouped by status.
- **CalendarView** — items land on/span calendar days; month grid is the
  point. Timed appointments in day/week slots → `ScheduleCalendar`.
- **GanttView** — items have start+end and overlap matters across a range.
  One record's progress through steps → `Timeline`.
- **A roadmap is not a component.** It is `GanttView` at
  `cadence="month" | "quarter"` with `groupByLane`; the `roadmap` view id
  exists only so a switcher can label it. There is no `RoadmapView` export.
  Editorial hand-authored year → `YearTimeline`.
- **Tables are not views.** A tabular layout of the collection is
  `DataVisNitroGrid`, rendered in `ViewSet`'s `table` slot.
- **Overview is not a view.** It's domain content — fill the `overview`
  slot with `CustomizableDashboard` + `DashboardWidget`.

## Entries, deps, SSR

Everything in this family exports from the **main** entry — no subpath, no
optional peers, no extra CSS (`@dnd-kit/*` and `luxon` are bundled regular
dependencies). All are `'use client'` components but nothing touches
`window` at module scope: a client boundary is enough, prerender is safe.
`localStorage` access (ViewSet, CustomizableDashboard) is try/catch-guarded
— Safari private browsing throws on *access*, optional chaining alone is
insufficient.

## The views-over-shared-data model

One collection, several layouts, one adapter:

- **Accessors, not records.** Views read through `ViewAccessors<T>`
  (`getId`, `getTitle`, `getSubtitle`, `getStatus`, `getStart`, `getEnd`,
  `getGroup`, `getAccent`) and never assume item shape. Write one adapter
  per entity; each view uses only the accessors it needs — `BoardView`
  requires `getStatus`, `GanttView`/`CalendarView` require `getStart`.
- **Nothing fetches, routes, or mutates.** Views take `items` / `loading` /
  `error` and hand changes back through `onOpen`, `getHref`, `onMove`.
- **Dates go through `toDateTime`, never `new Date()`.** Date-only strings
  stay wall dates; `new Date('2026-03-01')` is UTC midnight and shifts a
  day for half the world.
- **Accent tokens carry no text color** (`primary`/`success`/`warning`/
  `destructive`/`info`/`neutral`) — wash + border + marker only; labels use
  foreground tokens. The class strings are safelisted in both Tailwind
  presets.
- **`stages` name statuses.** They order and pin board columns and
  `groupBy="status"` lists — and must not seed groups under other groupings.
- **`ViewSet` owns the shared props** — `items`, `accessors`, `stages`,
  `onMove`, `timeZone`, `locale`, load state. Per-view escape hatches
  (`listProps` etc.) exclude them by type: one collection shows the same
  data in every view.

## ViewSet

`view`/`defaultView`/`onViewChange`; `storageKey` remembers the choice but
is **ignored when `view` is controlled** — a page with URL state owns it in
the router. Stored value is read in a post-mount effect so server and first
client render agree. Slots: `toolbar`, `filters`, `overview`, `table`,
`detail` (list-plus-detail). `ViewSetLabels` is the union of every view's
labels — not the same type as a single view's `labels` prop.

## BoardView

Columns come from `stages`; drag-and-drop is `@dnd-kit` **pointer listeners
only** — dnd-kit's role attributes are deliberately suppressed so cards with
`getHref` stay real anchors. Keyboard moves are the board's own
Ctrl/Cmd+Arrow handling (not dnd-kit's sensor), announced via a live region;
the selected card carries `aria-current`. `onMove` may return a promise:
the board shows pending state and reverts on rejection — optimistic updates
are built in, don't re-implement them.

## CalendarView

Month grid over Luxon. `timeZone` (IANA) sets day boundaries, `locale`
formats month/weekday names, `weekStartsOn` is 1 (Monday) … 7 (Sunday);
controlled `month`/`defaultMonth`; `maxPerDay` collapses overflow into a
"+N more" row. The grid is `role="table"` **on purpose** — `role="grid"`
promises roving focus the view doesn't implement; don't "fix" axe output by
switching roles.

## GanttView

`cadence: 'day' | 'week' | 'month' | 'quarter'`; bars are visual only — no
dependency links. Range auto-computes from item min/max when
`rangeStart`/`rangeEnd` are omitted. The scroll region is focusable
(`tabIndex={0}` + accessible name) — keep it that way.

## Dashboards

- **`DashboardWidget`** is the portlet tile (title bar, count badge, body
  variants). It knows nothing about position.
- **`CustomizableDashboard`** adds user drag/hide/show. Persistence:
  `storageKey` writes **three** keys — `{key}-portlet-order`,
  `{key}-dashboard-layout`, `{key}-dashboard-hidden` — restored in a mount
  effect so SSR hydration matches; or go fully controlled with
  `order`/`layout`/`hiddenIds`. Drag handles are discovered by
  `dragHandleSelector` (default `[data-slot="dashboard-widget-header"]`).
  Known trap: below `lg` in 3-column mode the columns flatten with
  `display: contents`, so dropping into an *empty* column has no drop box.

## Panels

- **`DockablePanel`** — two modes via `mode`/`onModeChange` (host persists):
  `full` is modal (focus trap, `aria-modal`, background `inert`); `docked`
  is a non-modal bottom-right strip you can work behind. Docked content is
  clipped (`overflow: hidden`), not resized — embedded ResizeObservers don't
  remeasure. Portals into `container` (default `document.body`).
- **`FloatingWindow`** — fully controlled (`open`/`minimized` are the
  host's); hand-rolled pointer drag/resize clamped to 600×400 minimum;
  stacks via `--mieweb-dockable-panel-z` (default 45); forwards a dialog
  role — pass `aria-label` when the title isn't plain text.
  `MinimizedWindow` is a separate export; wiring the pair is the host's job.

## App shell — three headers, three jobs

- **`AppHeader`** — sticky top bar of the signed-in app, beside `Sidebar`;
  slot children (`AppHeaderBrand`/`Title`/`Search`/`IconButton`/`UserMenu`),
  no nav opinions of its own.
- **`PageHeader`** — the `<h1>` block inside a page (title, subtitle, icon,
  actions, Breadcrumb/Tabs children). Not a `<header>` landmark.
- **`SiteHeader`/`SiteFooter`** are *marketing* chrome (`/templates`) — a
  different domain.
- **`Sidebar`** — mobile drawer uses `100dvh`; collapsed nav groups
  **unmount** rather than CSS-hide (keyboard users must not tab into
  invisible items). Record-banner headers (`PatientHeader` etc.) are
  clinical components, not shell.

## Performance

**No view virtualizes.** Every item renders; fetching/paging stays upstream.
Hundreds of items are fine; thousands are not — that's a
`DataVisNitroGrid` problem (Grids domain).

## i18n & a11y posture

Every view takes a `labels` object (English defaults); date views take
`locale` + `timeZone` (shared via ViewSet so all views agree on day
boundaries). Known catalog-documented gaps: dashboard strings are
hard-coded English, drag announcements English-only, some `DashboardWidget`
styling is physical-direction (RTL gaps). String/RTL audits belong to the
i18n agent; views carry the structural a11y themselves.

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| Items land a day early for some users | `new Date('YYYY-MM-DD')` parses as UTC midnight | Keep date-only strings raw in accessors; views convert via `toDateTime` as wall dates |
| Board renders no columns | Missing `getStatus` accessor or `stages` | Provide both; `stages` orders and pins the columns |
| Can't drag cards with the keyboard | Expecting dnd-kit's keyboard sensor | Use Ctrl/Cmd+Arrow — the board's own handling, announced via live region |
| Card loses link semantics when draggable | Assuming dnd-kit role attributes | They're suppressed by design; `getHref` cards stay anchors |
| Chosen view doesn't persist | `view` is controlled, so `storageKey` is ignored | Persist in your URL/router state, or go uncontrolled |
| Calendar/Gantt disagree on an item's day | Views given different zones | Set one `timeZone` on `ViewSet` — it's shared on purpose |
| Dashboard order lost after refactor | `storageKey` prefix changed | It writes `-portlet-order` / `-dashboard-layout` / `-dashboard-hidden` under the key |
| Can't drop into an empty dashboard column on tablet | `display: contents` flattening below `lg` in 3-col mode | Known limitation; move via another column or wider viewport |
| Axe/reviewer wants calendar `role="grid"` | Grid implies roving focus the view doesn't implement | `role="table"` is deliberate — don't switch roles without adding the focus model |
| Gantt/list sluggish with thousands of rows | No view virtualizes | Page/filter upstream, or use `DataVisNitroGrid` |
| FloatingWindow won't stay open/minimized | It's fully controlled | Own `open`/`minimized` in host state; wire `MinimizedWindow` yourself |
| `RoadmapView` import fails | It doesn't exist | `GanttView` with `cadence="month"|"quarter"` + `groupByLane` |
