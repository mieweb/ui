# CustomizableDashboard — maintainer notes

Ported from echart-sim's `app/src/components/layout/Dashboard.tsx` (the
3-column portlet grid used by its Home, Patient Summary, and Reports pages),
generalized for library use.

## Hidden coupling

- **@dnd-kit** (`core`, `sortable`, `utilities`) is a regular dependency —
  the library's only drag-and-drop library. `useDragReorder` (HTML5 DnD)
  remains the lightweight flat-list alternative; this component needs
  cross-column moves and keyboard sorting, which HTML5 DnD can't do well.
- **Drag-handle header contract**: each portlet's handle is appended into the
  first element matching `dragHandleSelector` inside its content (default:
  `[data-slot="dashboard-widget-header"]`, the `DashboardWidget` header).
  Discovery uses a MutationObserver because portlet content can render
  asynchronously; it disconnects once found. The discovered header gets
  `flex flex-row flex-nowrap items-center [&>:nth-child(2)]:ms-auto` added —
  the auto start-margin on the 2nd child beats `justify-between`, keeping
  trailing header controls (and the handle after them) at the end. Portlets
  with no matching header get a floating handle in the top end corner.
- **Tailwind scanning**: the classes added via `classList` in
  `HEADER_LAYOUT_CLASSES` are string literals in the source so the library's
  CSS build includes them. Don't move them into computed strings.

## Persistence semantics

- `storageKey` derives `{key}-portlet-order` and `{key}-dashboard-layout` —
  the exact keys echart-sim already writes, so its saved layouts survive
  adoption.
- **Persisted values are restored in a mount effect, not in state
  initializers**, so the first client render always matches SSR output and
  hydration cannot mismatch. Saved order slots are validated (arrays of
  strings) before use; corrupted storage falls back to the props layout.
- Drag math lives in exported pure helpers — `moveAcrossColumns`
  (drag-over), `reorderOnDrop` (drop, with the cross-column guard),
  `consolidateColumns`, `requiredColumns` (gap-aware auto-shrink) — unit
  tested directly; sensor-level interaction coverage belongs to the
  Storybook/visual layer. Persistence and callbacks fire outside React
  state updaters so Strict Mode replays cannot double-write.
- Controlled (`order`/`layout`) and uncontrolled modes can mix per concern.
  During a drag, internal state is authoritative; `onOrderChange` fires only
  at commit points (drop, layout consolidation) so hosts can persist to a
  server without per-pixel writes. Controlled `order` is re-synced when a
  drag is not in progress.
- `mergeColumnOrder` reconciles saved/controlled order with props: saved
  positions win, stale ids are dropped, new items append to their props
  column. It is exported for host-side migrations.

## Known tradeoffs (inherited from the original)

- At `max-lg` widths in 3-column mode, logical columns are flattened with
  `display: contents` so portlets flow into the responsive grid — dropping
  into an *empty* column doesn't work at those widths (the droppable has no
  box).
- Drag-and-drop is pointer/keyboard via dnd-kit sensors; the keyboard
  coordinate getter provides arrow-key sorting once a handle is focused and
  activated with Space/Enter.
