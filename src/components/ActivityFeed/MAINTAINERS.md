# ActivityFeed — maintainer notes

Ported from Waggleline's `UnifiedActivityTimeline` (`app/imports/ui/components/activity-timeline/`) as a headless module. Call streaks, sentiment, call roll-ups and AI summaries stayed in the app; they plug in through `renderItemMeta`, `renderDaySummary` and `renderItem`.

## Shared with the other Records modules

`FieldHistory`, `AssociationList` and `ActionPlan` import three internals from this folder. They are not exported from `src/index.ts`; promote them to `src/utils` / `src/hooks` if a fourth family needs them.

- `dayGroups.ts` — `groupByDay` (newest first, undated last) and `formatDayLabel` (Today / Yesterday / localized date, year only when it differs).
- `usePendingOverrides.ts` — optimistic per-id state for async callbacks. The override is dropped when the promise settles either way, so on success the caller's props take over and on rejection the old value shows again. Rejections are swallowed on purpose: the caller reports errors.
- `RecordState.tsx` — the loading (skeleton + `role="status"`), error (`role="alert"` + retry) and empty states.

## Decisions

- **Pinned rows appear once**, in the Pinned section, not again under their day. Two copies would mean two rows with the same id for `highlightedId` and two tab stops for one record.
- **`storageKey` is read after mount**, never in a state initializer, so server and first client render agree. Writes happen in the change handlers, not an effect, so the stored value is never overwritten with defaults before it is read.
- **The pin toggle sits beside the row link**, not inside it — interactive content can't nest inside an `<a>` or `<button>`.
- **Anchors open on Space** as well as Enter, matching button rows.
- **Day keys are ISO dates in `timeZone`** (via `toDateTime` from `src/views/types`), so a date-only string stays on its wall day instead of shifting to the previous day west of UTC.
