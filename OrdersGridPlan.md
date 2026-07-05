# Orders Grid Plan — EncounterOrdersGrid + ChartOrdersGrid

NITRO-backed (DataVis) grid views over the order history, complementing the
HealthSurveillance due-list card. Rows are **encounter orders** — orders placed
during encounters — which get bundled into **requisitions** (documents routing
orders to a provider/referral).

- **ChartOrdersGrid** — chart-wide: every pending and past order across all
  encounters. Group/filter by reason (program), provider, requisition, status,
  kind, and date.
- **EncounterOrdersGrid** — the current encounter's orders: due-list picks and
  pending unprocessed items, with multi-select mass operations (order, bundle
  into requisition, cancel).

Both render `DataVisNitroGrid` inside a `DataVisNitroSource` fed by an
object-URL `{ typeInfo, data }` payload (NITRO's `local` source type is not
yet implemented). Grouping presets use `DataVisNitroContext` →
`view.setGroup()`; users can also group/filter freely via `showControls`.

## Phase 1 — Data model + flatten engine

- [x] `history.ts`: optional `provider?`, `requisitionId?`, `encounterId?` on
      `HistoryOrder` (requisition = routing document; encounter = visit)
- [x] `orderRows.ts`: `OrderRow` type + `buildChartOrderRows(history, programs,
      opts)` — one row per history order **plus** one row per orderable
      due-list order key; reason resolved by reverse program lookup;
      per-order status `completed | pending | available | blocked`
- [x] `buildEncounterOrderRows(history, programs, { encounterId, … })` —
      current-encounter subset + actionable due-list rows
- [x] Unit tests for both builders (alt groups, blocked deps, provider /
      requisition / encounter passthrough)
- [x] Commit

## Phase 2 — Shared grid infrastructure

- [x] `useNitroRowsUrl` hook — rows → `{ typeInfo, data }` object-URL with
      dates typed `date` (revoked on change/unmount)
- [x] `OrdersGridChrome` internals: status-badge `formatCell`, group-preset
      chips (context + `setGroup`/`clearGroup`), selection action bar
- [x] Commit

## Phase 3 — ChartOrdersGrid

- [ ] `ChartOrdersGrid.tsx` — controlFields (Reason, Provider, Requisition,
      Status, Kind, Date), filters, group presets; `onRequisition` /
      `onCancel` for selected pending unprocessed rows
- [ ] Export from `index.ts`
- [ ] Story: enriched sample history (providers, requisition + encounter IDs);
      `ChartOrders` story under Healthcare/HealthSurveillance
- [ ] Commit

## Phase 4 — EncounterOrdersGrid

- [ ] `EncounterOrdersGrid.tsx` — current-encounter rows; mass ops
      **Order (N)** / **Create requisition (N)** / **Cancel (N)** via
      `onOrderMany` / `onRequisition` / `onCancel`
- [ ] ChartDemo story: toggle HealthSurveillance card ↔ EncounterOrdersGrid
      sharing placed-orders state
- [ ] Commit

## Phase 5 — Verification & polish

- [ ] `vitest run src/components/HealthSurveillance` green
- [ ] Type/lint clean on touched files
- [ ] Storybook manual pass: group by each preset, filter by status,
      multi-select action bar; screenshots
- [ ] Final commit

## Out of scope

- Assessment ↔ grid toggle inside the Assessment component (follow-up)
- Real requisition document generation (callbacks only)
- Upstream `datavis` `local` source implementation
