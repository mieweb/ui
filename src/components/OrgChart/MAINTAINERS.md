# OrgChart — Maintainer Notes

> **Provider notes** — how to _change_ the org chart. Consumers should read the
> [Modules/Records/OrgChart](OrgChart.stories.tsx) story. General conventions:
> [CONTRIBUTING.md](../../../CONTRIBUTING.md).

## Files

| File                 | Owns                                                                  |
| -------------------- | --------------------------------------------------------------------- |
| `tree.ts`            | Pure hierarchy helpers: forest building, visibility, search matching  |
| `layout.ts`          | elkjs layout (lazy) + the depth-grid fallback                         |
| `shared.ts`          | Labels, slots, accents, render-slot context types                     |
| `OrgChartCanvas.tsx` | React Flow canvas, card, theming                                      |
| `OrgChartTree.tsx`   | The accessible `role="tree"` list view                                |
| `OrgChart.tsx`       | State (expansion, search, filter, view, fullscreen), toolbar, details |

## Design contract (don't break these)

- **Ships only on `@mieweb/ui/org-chart`.** `@xyflow/react` and `elkjs` are
  _optional_ peers and tsup externalises both; nothing reachable from
  `src/index.ts` may import this folder, or every consumer without the peers
  gets a hard resolve error. After touching entries:

  ```sh
  pnpm build && grep -rlE "@xyflow/react|elkjs" dist   # only dist/org-chart.*
  ```

- **elkjs is imported lazily** (`import('elkjs/lib/elk.bundled.js')`, cached in
  a module-level promise) so the ~1.6MB layout engine loads on first layout,
  not on import. Use the bundled build — the worker build needs a worker URL
  the consumer's bundler would have to resolve.

- **Layout invariants** (`ORG_CHART_LAYOUT_OPTIONS`, exported and tested):
  - `layered` + `elk.direction` from the `direction` prop; RTL mirrors x after
    layout (and swaps handle sides for `RIGHT`) instead of asking elk for
    `LEFT`, so RTL needs no second code path in elk.
  - `considerModelOrder: NODES_AND_EDGES` keeps siblings in input order, so
    expanding one branch never reshuffles its neighbours. Don't drop it.
  - Every card is the same size per `nodeVariant` (`ORG_CHART_NODE_SIZE`) and
    passed to React Flow as `width`/`height`, so layout, fit-to-view and the
    minimap never wait on DOM measurement. A `renderNode` that grows taller
    than the card will overflow — size changes go through that constant.
  - Only **visible** nodes are laid out; the layout re-runs when the visible
    id list, direction or variant changes (`layoutKey`). Stale results are
    discarded with a cancelled flag.
  - If elk rejects, `gridLayout` places nodes by depth so the chart still
    renders.

- **The forest is always a tree.** `buildOrgForest` keeps the first duplicate
  id, promotes nodes with unknown parents to roots, and breaks cycles by
  promoting the first unvisited node. Everything downstream (visibility,
  `aria-setsize`, edges) relies on each node having exactly one effective
  parent — use `forest.parentOf` / `forest.children`, never the raw
  `parentId`.

- **Why the accessible tree exists.** React Flow's canvas is absolutely
  positioned, pan/zoom content: reading order is DOM order, not visual order,
  and there is no structure for a screen reader to announce. The list view is
  the WAI-ARIA tree pattern over the same `visible` list and state, so it is
  the primary path for assistive tech and narrow screens (it is the default
  below 640px). Keep feature parity: anything added to cards (badges, the
  highlighted marker, group) must also reach the tree row. Canvas nodes are
  not focusable/selectable in React Flow (`nodesFocusable={false}`); the card
  and expander are our own buttons, so tab order is ours.

- **React Flow disables pointer events** on nodes that are neither selectable
  nor draggable. The card sets `pointer-events: auto` inline; without it the
  buttons inside cards are unclickable.

- **CSS import is the consumer's job.** The component does not import
  `@xyflow/react/dist/style.css`: a CSS import from an externalised package
  survives into `dist/org-chart.js` and breaks consumers whose bundler or test
  runner doesn't handle CSS, and it would duplicate the stylesheet for apps
  that already load React Flow. The story imports it, as AGGrid and Q stories
  do for theirs. Brand theming does not depend on the stylesheet: the canvas
  maps React Flow's `--xy-*` variables to `--mieweb-*` tokens inline
  (`flowStyle`), so dark mode and brand switches follow without `colorMode`.

- **Group colour is a token name** (`Accent` from `src/views/types`) rendered
  through `accentClasses` — a wash and a marker, never text colour (fill tokens
  fail contrast as ink).

## Testing

- `elkjs/lib/elk.bundled.js` is mocked with a deterministic one-row layout;
  a hoisted flag makes it reject to cover the grid fallback.
- jsdom lacks what React Flow measures with: the test installs a no-op
  `ResizeObserver` (the shared stub in `src/test/setup.ts` fires entries
  without `contentRect`, which React Flow's pan-zoom reads), a
  `DOMMatrixReadOnly`, and fixed `offsetWidth`/`offsetHeight`.
- Fullscreen is covered both ways: jsdom has no Fullscreen API (fallback
  overlay), and a stubbed `requestFullscreen`/`exitFullscreen` covers the
  native path.
- Visual baseline: `orgchart-default.png` in `tests/visual/components.spec.ts`
  waits for the first `.react-flow__node` after the async layout. Review and
  update it whenever layout, card styling or the toolbar changes; cover
  behaviour through the tree view and the cards' buttons.
