# YearTimeline — Maintainer Notes

> **Provider notes** — how to _change_ the timeline. Consumers should read the
> [Data display/YearTimeline](YearTimeline.stories.tsx) story. General
> conventions: [CONTRIBUTING.md](../../../CONTRIBUTING.md).

## Design contract (don't break these)

- **Cadence drives layout**: `scheduled` bars span their `months` window;
  `continuous` and `event` run full-width in their own lanes. When `cadence`
  is omitted it's inferred — `months` set ⇒ `scheduled`, else `continuous`
  (`cadenceOf`). Changing that inference is a breaking API change.
- **The playhead is SSR-safe.** `current` defaults to the viewer's month
  *resolved after mount* (no `new Date()` during render), `null` hides the
  marker. Keep `resolveCurrent` pure — it's exported and unit-tested.
- **Colors are brand tokens, not hexes**: bar fills come from CSS variables
  with `color-mix` tints (accent/info fall back to primary scales). New
  cadences must follow that pattern so brands re-theme without code changes.
- **Contrast is deliberate**: `GROUP_TEXT` uses `text-primary-800` /
  `text-success-800` and the marker/status pills use `bg-primary-800` because
  the 700 shades fail WCAG 4.5:1 at the tiny label sizes. Don't lighten them
  back.
- **i18n**: `monthLabels` / `monthNames` are props (defaults exported as
  `MONTH_LETTERS` / `MONTH_NAMES`); never hardcode month strings in render.

## Gotchas

- Grid/mask/marker classes (e.g. `grid-cols-12`, the gradient masks) are
  safelisted in `src/tailwind-preset.{ts,cjs}` ("EH frontdoor ports" block) —
  keep both files in sync when class strings change.
- The mobile layout is a genuinely different arrangement, not just wrapping —
  verify both visual baselines when touching layout.

## Testing

- Unit: [YearTimeline.test.tsx](YearTimeline.test.tsx) pins `resolveCurrent`
  and the cadence/window helpers.
- Visual: `yeartimeline-default.png` **and** `yeartimeline-default-mobile.png`
  in [tests/visual/components.spec.ts](../../../tests/visual/components.spec.ts)
  — the mobile baseline exists precisely because the layout diverges.
