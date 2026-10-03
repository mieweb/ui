# PointMap — Maintainer Notes

> **Provider notes** — how to _change_ PointMap. Consumers should read the
> [Modules/Presentations/PointMap](../../catalog/Presentations.mdx) docs page.

Covers `src/components/PointMap/` and the `@mieweb/ui/maps` entry (`src/maps.ts`).

## Design contract

- **`leaflet` is an optional peer, isolated to `@mieweb/ui/maps`.** It is
  `external` in `tsup.config.ts` and loaded with a dynamic `import('leaflet')`
  inside the effect, so neither the main entry nor server rendering touches it.
  Never import it statically or re-export PointMap from `src/index.ts`.
- **Cancellation.** The effect sets `cancelled` on cleanup and checks it after
  every await (the Leaflet import and the `outlineUrl` fetch); cleanup calls
  `map.remove()`. StrictMode double-mounts and data changes must never leave a
  second map on the same element.
- **The effect re-runs on data, not view.** `points`, `tileUrl`, `attribution`,
  `outlineUrl`, `sizeBy` and `showValues` rebuild the map; `center`/`zoom` only seed it.
- **Colours come from tokens read at runtime** (`--mieweb-primary-500`,
  `--mieweb-border`) because Leaflet paints SVG/canvas outside Tailwind.
- **The text list is the accessible data.** The map is a labelled `role="group"`
  (`aria-roledescription="map"`), not `role="img"`, so Leaflet's zoom buttons,
  keyboard panning and attribution link stay reachable. Keep every point's label
  and value in the list beneath it (`hideList` is opt-out).
- **Styles.** Consumers import `leaflet/dist/leaflet.css`; the permanent value
  label (`.mie-map-value`) is styled in `src/styles/effects.css`.

## Testing

jsdom can't run Leaflet, so there is no unit test of the map itself; verify in
the `Modules/Presentations/PointMap` stories (tiles load, one marker per point,
no console errors, story switches leave no stale map). The stories use
OpenStreetMap tiles, so they need network access.
