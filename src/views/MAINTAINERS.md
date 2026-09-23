# Views — Maintainer Notes

> **Provider notes** — how to _change_ the Views family. Consumers should read
> the [Views overview](../catalog/Views.mdx) and the per-component stories.
> General conventions: [CONTRIBUTING.md](../../CONTRIBUTING.md).

The family is `ViewSwitcher`, `ListView`, `BoardView`, `CalendarView`,
`GanttView` and `ViewSet`, over the shared contract in
[types.ts](types.ts). It exists to delete one specific kind of duplication:
an app that renders the same collection as a list, a board, a calendar and a
timeline was writing four components per collection, and then again per
collection. Everything below protects that.

## Design contract (don't break these)

- **Accessors, not a record shape.** A view never reads `item.title` or
  `item.status`. It reads through `ViewAccessors<T>`, which is why one
  `ViewSet` can serve tickets, orders and opportunities without a mapping
  layer. Adding a field to a view means adding an accessor, never widening an
  assumed shape.
- **Nothing here fetches, routes or mutates.** Views take `items`, `loading`
  and `error`, and hand changes back through `onOpen` / `getHref` / `onMove`.
  The eslint `no-restricted-imports` block enforces the framework, router and
  query bans; if a view ever needs data it does not have, add a prop.
- **`accentClasses` carries no text colour, deliberately.** `--mieweb-success`
  and friends are _fill_ tokens; as ink — even on their own 10% wash — they
  fail WCAG AA, which axe reports as a serious violation. An accent is a wash,
  a border and a solid marker, and label text always uses a foreground token.
  That also means colour is never the only signal. Do not add a `text` role.
- **Dates go through `toDateTime`, never `new Date()`.** `DateTime.fromISO`
  keeps a date-only string a _wall date_: `2026-03-10` is that calendar day
  where the collection lives, not UTC midnight, which is the 9th anywhere
  behind UTC. `new Date()` collapses the two and silently shifts items a day
  earlier for half the world.
- **`stages` name statuses.** They order and pin `groupBy="status"` and the
  board's columns. They must not seed groups under any other grouping — see
  the gotcha below.
- **One collection means one set of shared props.** `ViewSet` owns `items`,
  `accessors`, `stages`, `onMove`, `timeZone`, `locale` and the load state;
  `ViewOverrides` excludes all of them from the per-view escape hatches. A
  layout that could take different stages or a different zone from its
  neighbours is the same collection disagreeing with itself as you switch
  tabs.

## Gotchas

- **`ViewSet.labels` is wider than `ViewBaseProps['labels']`.** Each view
  extends `ViewLabels` with its own strings (calendar month arrows and
  "+n more", board move announcements, Gantt's undated footnote). Those are
  shared props, so the per-view overrides cannot reach them; `ViewSetLabels`
  is the union, and a view ignores keys it does not know. Adding a label to a
  view is enough — it flows through automatically.
- **Board keyboard movement is ours, not dnd-kit's.** Cards move with
  `Ctrl`/`Cmd`+arrow, handled directly; dnd-kit supplies the pointer path
  only. That is why the anchor branch takes dnd-kit's _listeners_ but not its
  `attributes` — those carry `role="button"` and would override the native
  link role, so a card with `getHref` would announce as a button.
- **`role="table"` on the calendar, not `role="grid"`.** A grid implies roving
  focus over cells, which the month view does not implement. Each week row
  declares `role="row"` explicitly. Testing Library resolves roles from
  attributes without validating that the ARIA composition is legal, so an
  invalid `role="grid"` passes unit tests and only fails the axe run — check
  the Accessibility job, not just `pnpm test`.
- **Scroll regions must be focusable.** The board and the Gantt chart scroll;
  a scrollable region with no tab stop is a keyboard trap for anyone who
  cannot drag. Both carry `tabIndex={0}` and an accessible name.
- **A roadmap is not a component.** It is `GanttView` at `cadence="month"` or
  `"quarter"` with `groupByLane`. The `roadmap` view id exists so a switcher
  can still offer the label. For an editorial, hand-authored calendar year,
  send people to [`YearTimeline`](../components/YearTimeline/MAINTAINERS.md)
  instead — the two declare each other as alternatives in the catalog.
- **Tables are not a view.** `ViewSet` takes `table` as a slot so a consumer
  passes `DataVisNitroGrid`; the library does not reimplement a grid.
  `overview` is a slot for the same reason. Both are only offered in the
  switcher when their slot is supplied, or the option renders a blank page.
- **Class strings are safelisted in both presets.** Every class
  `accentClasses` can emit lives in `src/tailwind-preset.{ts,cjs}`; a Tailwind
  3 consumer that does not scan `node_modules` gets nothing otherwise. Keep
  the two files in sync.

## Tests

`pnpm test` covers the contract; the axe run in CI is what catches the ARIA
composition problems described above. Visual baselines for the family live in
[tests/visual/components.spec.ts](../../tests/visual/components.spec.ts) —
every view pins "today" through `now` and reads an explicit `timeZone`, so the
snapshots are stable on any agent clock.
