# RadialExplorer — Maintainer Notes

> **Provider notes** — how to _change_ the explorer. Consumers should read the
> [Components/Showcase/RadialExplorer](RadialExplorer.stories.tsx) story.
> General conventions: [CONTRIBUTING.md](../../../CONTRIBUTING.md).

## Design contract (don't break these)

- **The attract loop must yield to people.** The `setInterval` that advances
  spokes every `attractMs` (default 2200ms, `0` disables) is skipped whenever
  the visitor is `engaged` (hover/focus/selection), under
  `prefers-reduced-motion`, or when the component is controlled. Any new
  auto-advance behavior must respect all three guards.
- **Dot navigation is `role="group"` with `aria-pressed` buttons**, matching
  the mobile chip row — deliberately _not_ a `tablist`: the spokes don't own
  separate panels, they swap one detail card. Don't "upgrade" it back to tabs.
- **Reveal animation is `motion-safe:` CSS** (`mie-fade-in`) — static under
  reduced motion, no JS animation path.

## Gotchas

- Spoke positions are computed from index/count fractions — the layout is
  content-driven, so adding a spoke reflows all of them. Keep spoke counts in
  stories stable or visual baselines churn.
- Arbitrary/tracking utilities used here are safelisted in
  `src/tailwind-preset.{ts,cjs}` ("EH frontdoor ports" block) — update both
  files together when class strings change.

## Testing

- Visual: `radialexplorer-static.png` in
  [tests/visual/components.spec.ts](../../../tests/visual/components.spec.ts)
  uses the `Static` story (`attractMs: 0`, fixed `defaultActiveId`) so the
  detail card is deterministic. If you add baselines for other stories, pin
  the active spoke the same way — never snapshot the attract loop.
