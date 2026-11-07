# Evals — Views / dashboards / panels / shell

Primary agent: **MIE UI Views Agent**. See [README.md](./README.md) for
format and scoring. The #588 done-when: the agent explains the
views-over-shared-data model and answers these without inventing API.

### VW-1 — The model

- **Ask:** "My tickets page needs a list, a kanban board, and a calendar the user can switch between."
- **Expect:** One `ViewSet` over one collection: a single
  `ViewAccessors<WorkItem>` adapter (`getId`/`getTitle`/`getStatus`/
  `getStart`…), `stages` naming the statuses, shared `items`/`onMove`/
  `timeZone` on the set. Not three components with three data massages.
- **Agent:** MIE UI Views Agent
- **Source:** src/views/MAINTAINERS.md; Views.mdx

### VW-2 — View vs grid

- **Ask:** "Users want to sort, filter, and export the list view."
- **Expect:** That's a grid, not a view — `DataVisNitroGrid` (Grids
  domain); `ViewSet` renders it in the `table` slot rather than wrapping
  it. `ListView` stays for the lightweight grouped list.
- **Agent:** MIE UI Grids Agent (via the Views Agent's redirect)
- **Source:** Views.mdx — "Tables are not a view"; mieweb-ui-views skill

### VW-3 — Roadmap trap

- **Ask:** "How do I import RoadmapView?"
- **Expect:** There is no `RoadmapView` — a roadmap is `GanttView` at
  `cadence="month" | "quarter"` with `groupByLane`; the `roadmap` view id
  exists only to label a switcher option. Inventing the import FAILS.
  (Editorial hand-authored year → `YearTimeline`.)
- **Agent:** MIE UI Views Agent
- **Source:** Views.mdx — roadmap callout; src/views/MAINTAINERS.md

### VW-4 — Dates shift a day

- **Ask:** "Items due 2026-03-01 show on Feb 28 for our Sydney users."
- **Expect:** A `new Date('YYYY-MM-DD')` somewhere in the adapter — that
  parses as UTC midnight. Keep date-only strings raw in accessors (views
  convert via `toDateTime` as wall dates) and set one shared `timeZone` on
  `ViewSet`.
- **Agent:** MIE UI Views Agent
- **Source:** src/views/types.ts toDateTime; src/views/MAINTAINERS.md

### VW-5 — Empty board

- **Ask:** "BoardView renders but shows no columns."
- **Expect:** Board columns come from `stages` and require the `getStatus`
  accessor; provide both — `stages` also orders and pins the columns.
- **Agent:** MIE UI Views Agent
- **Source:** BoardView.tsx; Views.mdx accessor contract

### VW-6 — Keyboard drag

- **Ask:** "How do keyboard users move cards on the board? dnd-kit's keyboard sensor doesn't seem wired."
- **Expect:** By design: the board owns Ctrl/Cmd+Arrow moves directly
  (announced via a live region); dnd-kit contributes pointer listeners
  only, and its role attributes are suppressed so `getHref` cards stay
  real anchors.
- **Agent:** MIE UI Views Agent
- **Source:** src/views/MAINTAINERS.md — board keyboard; BoardView.tsx

### VW-7 — Optimistic moves

- **Ask:** "Should I update my store optimistically when a card is dragged, then roll back on API failure?"
- **Expect:** Don't re-implement it — return your mutation promise from
  `onMove`: the board shows pending state and reverts on rejection.
- **Agent:** MIE UI Views Agent
- **Source:** BoardView.tsx onMove; lessons/wiring-headless-modules.md

### VW-8 — View persistence

- **Ask:** "I pass `view` from my router and also set `storageKey`, but the stored choice never applies."
- **Expect:** By design — `storageKey` is ignored when `view` is
  controlled (no double source of truth). URL-driven pages persist the
  view in the router; drop `storageKey`. Stored reads happen post-mount so
  SSR hydration matches.
- **Agent:** MIE UI Views Agent
- **Source:** ViewSet.tsx storageKey doc + mount effect

### VW-9 — Overview slot

- **Ask:** "The first tab of our ViewSet should be KPI tiles and quick links, not a view of the items."
- **Expect:** That's the `overview` slot — domain content the library has
  no opinion on; fill it with `CustomizableDashboard` + `DashboardWidget`
  (and `QuickLinksCard`).
- **Agent:** MIE UI Views Agent
- **Source:** Views.mdx — "Overview is not a view"; Dashboards.mdx

### VW-10 — Dashboard persistence

- **Ask:** "Where does CustomizableDashboard store the user's layout, and why did it reset after we renamed the page?"
- **Expect:** Under `storageKey`-derived keys — `{key}-portlet-order`,
  `{key}-dashboard-layout`, `{key}-dashboard-hidden` — so changing the key
  orphans saved state. Restore happens in a mount effect (SSR hydration
  matches); fully controlled `order`/`layout`/`hiddenIds` is the
  alternative.
- **Agent:** MIE UI Views Agent
- **Source:** CustomizableDashboard MAINTAINERS.md — persistence

### VW-11 — Drag handle

- **Ask:** "My custom widget can't be dragged in CustomizableDashboard."
- **Expect:** Drag handles are discovered via `dragHandleSelector`
  (default `[data-slot="dashboard-widget-header"]`) — custom widget chrome
  must carry the slot attribute or the dashboard needs a matching
  selector.
- **Agent:** MIE UI Views Agent
- **Source:** CustomizableDashboard MAINTAINERS.md — drag handles

### VW-12 — Tablet drop bug

- **Ask:** "On tablets, users can't drop a widget into an empty dashboard column."
- **Expect:** Known limitation: below `lg` in 3-column mode the columns
  flatten with `display: contents`, so an empty column has no drop box.
  Not a consumer bug — work around via another column or wider viewport.
- **Agent:** MIE UI Views Agent
- **Source:** CustomizableDashboard MAINTAINERS.md — responsive edge case

### VW-13 — Panel modality

- **Ask:** "Users should be able to keep working on the page while the detail panel is docked, but the full-screen version should trap focus."
- **Expect:** Exactly `DockablePanel`'s two modes: `full` is modal (focus
  trap, `aria-modal`, background `inert`), `docked` is a non-modal
  bottom-right strip. Host owns `mode`/`onModeChange` (and any
  persistence). Docked content is clipped, not resized.
- **Agent:** MIE UI Views Agent
- **Source:** DockablePanel.tsx modality docs

### VW-14 — FloatingWindow state

- **Ask:** "FloatingWindow closes/forgets its minimized state when my component re-renders — where's its internal state?"
- **Expect:** There is none for `open`/`minimized` — it's fully
  controlled; only transient drag size/position is internal. Own the state
  in the host, wire `MinimizedWindow` yourself; min size clamps to
  600×400; pass `aria-label` when the title isn't plain text.
- **Agent:** MIE UI Views Agent
- **Source:** FloatingWindow MAINTAINERS.md

### VW-15 — Three headers

- **Ask:** "AppHeader, PageHeader, SiteHeader — which goes where?"
- **Expect:** `AppHeader` = sticky top bar of the signed-in app (beside
  `Sidebar`, slot children); `PageHeader` = the `<h1>` block inside a page
  (not a `<header>` landmark); `SiteHeader` = marketing chrome from
  `/templates` (different domain).
- **Agent:** MIE UI Views Agent
- **Source:** Layout.mdx — "Three headers, three jobs"

### VW-16 — Sidebar collapse a11y

- **Ask:** "Collapsed sidebar sections unmount their items — shouldn't we just hide them with CSS to keep DOM stable?"
- **Expect:** No — unmounting is deliberate: keyboard users must not tab
  into invisible items, and animation height measurement depends on it.
- **Agent:** MIE UI Views Agent
- **Source:** Sidebar MAINTAINERS.md

### VW-17 — Calendar role

- **Ask:** "Axe-minded reviewer says the month view should be role=\"grid\"."
- **Expect:** `role="table"` is deliberate — `grid` promises roving focus
  the view doesn't implement; switching the role without adding that focus
  model makes a11y worse. Full audit → A11y agent.
- **Agent:** MIE UI Views Agent
- **Source:** src/views/MAINTAINERS.md — calendar semantics

### VW-18 — Scale

- **Ask:** "GanttView gets sluggish with ~5,000 items."
- **Expect:** No view virtualizes — every item renders by design.
  Page/filter upstream, or that scale of tabular data belongs to
  `DataVisNitroGrid` (Grids domain).
- **Agent:** MIE UI Views Agent
- **Source:** src/views/MAINTAINERS.md — no virtualization; Views.mdx

### VW-19 — Calendar boundaries

- **Ask:** "We need a week view with 30-minute appointment slots — CalendarView?"
- **Expect:** No — `CalendarView` is a month grid over day-granularity
  items; timed day/week slots are `ScheduleCalendar` (Date & Time family).
- **Agent:** MIE UI Views Agent
- **Source:** Views.mdx — "Which one?" table

### VW-20 — i18n posture

- **Ask:** "How do I localize the views, and is the dashboard fully translatable?"
- **Expect:** Views: `labels` objects (English defaults) + `locale`/
  `timeZone` shared via `ViewSet`. Dashboards have documented gaps
  (hard-coded English strings, English-only drag announcements) — audit →
  i18n agent.
- **Agent:** MIE UI Views Agent
- **Source:** src/views/types.ts ViewLabels; Dashboards.mdx limitations

### VW-21 — Accent colors

- **Ask:** "Can I set each stage's accent to our brand hex and color the card titles to match?"
- **Expect:** Accents are tokens (`primary`/`success`/…), applied as wash +
  border + marker and **never text color** (declared colours fail WCAG AA
  on text); the class strings are safelisted — don't synthesize new ones.
- **Agent:** MIE UI Views Agent
- **Source:** src/views/types.ts accentClasses; src/views/MAINTAINERS.md

### VW-22 — Plumbing

- **Ask:** "Does the views family need peer installs, CSS imports, or ssr:false like the charts?"
- **Expect:** No — everything exports from the main entry; `@dnd-kit/*`
  and `luxon` are bundled regular deps; all `'use client'` but nothing
  touches `window` at module scope, so a client boundary suffices and
  prerender is safe; `localStorage` access is try/catch-guarded.
- **Agent:** MIE UI Views Agent
- **Source:** src/index.ts; package.json; ViewSet.tsx readStored
