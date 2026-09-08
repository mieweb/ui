# DataVisNITRO — Maintainer Notes

> **Provider notes** — how to *change* the DataVis NITRO grid. Consumers should
> read the Storybook stories and use `@mieweb/ui/datavis`. General conventions:
> [CONTRIBUTING.md](../../../CONTRIBUTING.md).

## What's in here

Compatibility re-exports and Storybook examples for MIE's **datavis** engine, exported from a **separate entry** ([src/datavis.ts](../../datavis.ts) → `@mieweb/ui/datavis`):

- `DataVisNitroSource` — declares a data source (`type: 'http' | 'local' | 'file'`)
  and publishes a view through `DataVisNitroContext`.
- `DataVisNitroGrid` — consumes the context and renders the grid/table.
- `DataVisNitroContext` — the shared view context.

The implementation lives in `packages/datavis/src/components/DataVisNitro.tsx` and `DataVisNitroGraph.tsx`. [DataVisNITRO.tsx](DataVisNITRO.tsx) and [DataVisNitroGraph.tsx](DataVisNitroGraph.tsx) preserve local import compatibility by re-exporting those public DataVis components.

## Prefer NITRO over AGGrid

NITRO DataVis is the **default** choice for tables and data grids. It's lighter
than AG Grid and avoids the `ag-grid-*` peer dependencies. Only fall back to
[AGGrid](../AGGrid/MAINTAINERS.md) when NITRO genuinely lacks a needed capability —
and when that happens, treat the gap as a NITRO feature request so usages can move
back here later.

## Dependencies — two moving parts

1. **`datavis-ace`** (optional peer dep) — provides `ComputedView`, `Source`.
2. **`@mieweb/datavis`** (optional peer dep, developed in the `packages/datavis` git submodule) — owns the high-level source/grid/graph wrappers and lower-level DataVis components. Local development links the submodule; published consumers still install it alongside `datavis-ace` and import the supported surface from `@mieweb/ui/datavis`.

## Gotchas

- **Ozwell Assistant story.** The `OzwellAssistant` story wires `GridAssistant`
  (from `@mieweb/datavis`) to the grid's shared view. It needs an Ozwell API key +
  base URL at runtime — set `localStorage['ozwellConfig']` as described in
  [../AI/OZWELL-BACKEND.md](../AI/OZWELL-BACKEND.md); without it the chat falls
  back to a "not configured" reply.
- **ESM and styles.** `@mieweb/datavis` ships ESM and publishes its semantic grid/graph styles as `@mieweb/datavis/styles.css`. The ui base stylesheet imports that entry so DataVis owns its selectors while ui supplies the design tokens.
- Source/Grid are **coupled through React context** — a `DataVisNitroGrid` must be
  rendered inside a `DataVisNitroSource`. Don't refactor one without the other.
- View instances are tagged (`_dvType` / `_dvUrl`) for tracking; preserve those
  when touching `useView` wiring.
- A `TranslateFn` hook is threaded for i18n — keep labels translatable, don't
  hardcode strings.
- `DataVisNitroGridProps` deliberately `Omit`s `view`/`children`/`allColumns` from
  the underlying `DataGridProps` and re-adds a curated set. Keep that surface
  intentional when the submodule's props change.
