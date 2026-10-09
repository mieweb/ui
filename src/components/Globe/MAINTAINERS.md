# Globe — Maintainer Notes

> **Provider notes** — how to _change_ the globe. Consumers should read the
> [Showcase/Globe](Globe.stories.tsx) story. General conventions:
> [CONTRIBUTING.md](../../../CONTRIBUTING.md).

## Design contract (don't break these)

- **This component ships only on the `@mieweb/ui/globe` entry.** It imports
  `react-globe.gl` and `three` at the top level, which are _optional_ peer
  dependencies precisely because nothing reachable from `src/index.ts` may
  import this file. If Globe (or anything importing it) leaks into the main
  entry, every consumer without those peers gets a hard resolve error.
  Verify after touching entries:

  ```sh
  pnpm build && grep -rl "react-globe.gl" dist   # must match only dist/globe.*
  ```

- **Client-only.** `react-globe.gl` touches `window` at module scope; hosts
  must load the entry behind `ssr: false` (Next dynamic import or similar).
  Don't add module-scope DOM access of our own — keep it importable in tests.

- **Tooltip HTML must stay escaped.** `react-globe.gl` renders `pointLabel`
  output as raw HTML. The default label pipes `p.name` / `p.sub` through the
  module-level `escapeHtml()`. Any new default that interpolates caller data
  into label/tooltip strings must do the same — a caller-provided `pointLabel`
  opting out is their choice, our defaults must be safe.

- **`buildArcs` is the auto-wiring contract**: every non-hub point connects to
  its nearest hub (haversine), plus a hub ring when ≥2 hubs. It's exported and
  documented — treat its output shape as public API.

## Gotchas

- The default `geoUrl` fetches Natural Earth country polygons from a GitHub
  raw URL at runtime. Offline hosts pass their own `geoUrl` (or `null` to skip
  land hexes) — don't make the fetch mandatory for first paint.
- Theme colors resolve from `--mieweb-*` CSS variables at mount; the canvas
  doesn't observe later theme flips.

## Testing

- No visual regression test, deliberately: WebGL canvas output is not
  pixel-deterministic across GPUs/headless renderers. Cover logic (e.g.
  `buildArcs`, escaping) with unit tests instead.
