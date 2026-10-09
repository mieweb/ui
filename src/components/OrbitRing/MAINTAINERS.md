# OrbitRing — Maintainer Notes

> **Provider notes** — how to _change_ the orbit graphic. Consumers should read
> the [Components/Showcase/OrbitRing](OrbitRing.stories.tsx) story. General
> conventions: [CONTRIBUTING.md](../../../CONTRIBUTING.md).

## Design contract (don't break these)

- **Rotation is pure CSS, no JS timers.** Each ring spins with
  `motion-safe:animate-[mie-spin_var(--dur)_linear_infinite]` (`--dur`
  defaults to `88s + 36s·ringIndex`), and every chip counter-spins with the
  inverse `animationDirection` so logos stay upright. If you change a ring's
  duration or direction, its chips must change with it or logos rotate.
- **`motion-safe:` is the reduced-motion story.** Under
  `prefers-reduced-motion` the graphic is simply static — don't add a JS
  fallback that reintroduces movement.
- **Pause on engagement**: `group-hover/orbit:` and `group-focus-within/orbit:`
  set `animation-play-state: paused` so chips are clickable targets. The named
  groups (`group/orbit`, `group/sat`) are part of that contract.
- **Sizing is container-driven** (`[container-type:size]`, `aspect-square`,
  radii as fractions) — the component scales with its box, no pixel math in
  JS.

## Gotchas

- The glow ring / radial washes are arbitrary-value `[background:...]` and
  `shadow-[...]` utilities safelisted in `src/tailwind-preset.{ts,cjs}` ("EH
  frontdoor ports" block) — keep both files in sync when class strings change.
- `mie-spin` keyframes live in `src/styles/effects.css`, which the main entry
  imports via `base.css` — TW3 consumers get them from the compiled CSS, not
  from Tailwind.

## Testing

- Visual: `orbitring-default.png` in
  [tests/visual/components.spec.ts](../../../tests/visual/components.spec.ts),
  recorded with `animations: 'disabled'` so the frozen layout (not a rotation
  frame) is what's pinned.
