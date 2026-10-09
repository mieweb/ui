# MegaMenu / MegaMenuBar — Maintainer Notes

> **Provider notes** — how to _change_ the mega menu. Consumers should read the
> [Components/Navigation/MegaMenu](MegaMenu.stories.tsx) story. General
> conventions: [CONTRIBUTING.md](../../../CONTRIBUTING.md).

## Design contract (don't break these)

- **Controlled only.** `MegaMenu` never owns `open`; `MegaMenuBar` (and
  `SiteHeader` through it) supplies one shared open state for a whole nav row
  so only one panel is ever open. Don't add an uncontrolled mode — it would
  break the bar's exclusivity.
- **Hover-intent delays are load-bearing**: `OPEN_DELAY_MS = 70`,
  `CLOSE_DELAY_MS = 150`. Opening instantly makes diagonal mouse travel
  flicker adjacent menus; closing instantly drops the panel while crossing the
  gap between trigger and panel. Hover-open is disabled below `hoverMinWidth`
  (default 900px) where the chevron toggles on click/tap instead.
- **The panel is clamped to the viewport (16px padding) and must re-clamp**
  on resize _and_ when the contextual feature column swaps the panel between
  its 600px and 880px layouts — that's why the positioning effect depends on
  `featured`, not just `open`. Regression: open a menu near the right viewport
  edge, hover an item that adds/removes the feature column.
- **A11y shape**: trigger carries `aria-haspopup`/`aria-expanded`/
  `aria-controls`; the panel is a labelled `role="region"` (deliberately not a
  `menu` — links are ordinary tab stops). Escape closes and restores focus to
  the trigger. `currentPath` marks the active link `aria-current="page"`,
  comparing paths with query/hash/trailing-slash stripped.
- `external: true` items get `target="_blank" rel="noopener noreferrer"` —
  both here and in `SiteHeader`'s mobile drawer, which flattens the same menu
  config.

## Gotchas

- The feature-column gradient and dark-bar trigger styles use arbitrary-value
  utilities safelisted in `src/tailwind-preset.{ts,cjs}` ("EH frontdoor ports"
  block) — update both files together when class strings change.
- Footer fallbacks (`"Browse all"`, `"Get started"`) and the toggle label are
  hard-coded English; `allLabel`/`ctaLabel` are the override points.

## Testing

- Visual: `megamenu-smart-featured.png` (open panel + feature column) and
  `megamenu-bar.png` in
  [tests/visual/components.spec.ts](../../../tests/visual/components.spec.ts).
  Stories keep panels open via the `Controlled` helper, so no pointer
  choreography is needed.
