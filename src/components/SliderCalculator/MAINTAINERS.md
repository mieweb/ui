# SliderCalculator — Maintainer Notes

> **Provider notes** — how to _change_ the calculator. Consumers should read
> the [Inputs/Composite forms/SliderCalculator](SliderCalculator.stories.tsx)
> story. General conventions: [CONTRIBUTING.md](../../../CONTRIBUTING.md).

## Design contract (don't break these)

- **State ownership**: slider `values` are internal; the host observes via
  `onChange(values, result)`. The notification effect is keyed on `values`
  **only** — `onChange` and the memoized `result` are read through `notifyRef`
  so an inline `compute`/`onChange` (new identity every parent render) can
  never re-fire it or loop. `skipInitialNotify` suppresses the mount call.
  Keep `set()` a pure state update; never call `compute` from it.
- **`compute` must be pure.** It runs in a `useMemo` keyed on
  `[compute, values]`; a side-effecting compute will double-fire under
  StrictMode.
- **Announcements are settled-only.** The result container is _not_ a live
  region: `AnimatedNumber` updates every animation frame, so a container-level
  `aria-live` spams screen readers mid-drag. Instead a visually-hidden
  `aria-live="polite"` span announces the formatted total 600ms after the last
  change (initial value skipped). Don't re-add `aria-live` to the container.
- **`AnimatedNumber` collapses under `prefers-reduced-motion`** (and SSR) to a
  direct value set — no rAF. Keep that branch first.
- **Composition**: the inputs are the library `Slider`; format handling goes
  through `makeFormatter(format, locale, currency)` (`Intl.NumberFormat`) —
  don't hand-roll number formatting in render.

## Gotchas

- The result panel's radial gradient and eyebrow classes are arbitrary-value
  utilities safelisted in `src/tailwind-preset.{ts,cjs}` ("EH frontdoor ports"
  block) — keep both files in sync when class strings change.
- Eyebrow text is `text-primary-800` for WCAG contrast at its small size —
  `primary-700` fails 4.5:1 on white; don't "fix" it back.

## Testing

- Unit: [SliderCalculator.test.tsx](SliderCalculator.test.tsx) pins the
  notify-once-per-change contract and formatter behavior.
- Visual: `slidercalculator-roi.png` in
  [tests/visual/components.spec.ts](../../../tests/visual/components.spec.ts),
  recorded with `animations: 'disabled'` so the settled values (not an
  animation frame) are what's pinned.
