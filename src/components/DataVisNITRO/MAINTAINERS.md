# DataVisNITRO — Maintainer Notes

> **Provider notes** — how to *change* the DataVis NITRO grid. Consumers should
> read the Storybook stories and use `@mieweb/ui/datavis`. General conventions:
> [CONTRIBUTING.md](../../../CONTRIBUTING.md).

## What's in here

A React adapter over MIE's **datavis** engine, exported from a **separate entry**
([src/datavis.ts](../../datavis.ts) → `@mieweb/ui/datavis`):

- `DataVisNitroSource` — declares a data source (`type: 'http' | 'local' | 'file'`)
  and publishes a view through `DataVisNitroContext`.
- `DataVisNitroGrid` — consumes the context and renders the grid/table.
- `DataVisNitroContext` — the shared view context.

Implementation: [DataVisNITRO.tsx](DataVisNITRO.tsx); exports in [index.ts](index.ts).

## Prefer NITRO over AGGrid

NITRO DataVis is the **default** choice for tables and data grids. It's lighter
than AG Grid and avoids the `ag-grid-*` peer dependencies. Only fall back to
[AGGrid](../AGGrid/MAINTAINERS.md) when NITRO genuinely lacks a needed capability —
and when that happens, treat the gap as a NITRO feature request so usages can move
back here later.

## Dependencies — two moving parts

1. **`datavis-ace`** (optional peer dep) — provides `ComputedView`, `Source`.
2. **The `datavis` git submodule** — imported via deep paths like
   `datavis/src/components/DataGrid`, `datavis/src/adapters/*`,
   `datavis/src/components/table/TableRenderer`. The submodule lives in
   `packages/datavis` and is **linked into `node_modules/datavis`**.

Because it reaches into `datavis/src/...`, the submodule **and its transitive
deps** must be resolvable.

## Gotchas

- **Stale submodule link** is the classic failure. `postinstall` auto-detects and
  re-links it; if imports still fail, run `git submodule update --init
  --recursive` then `pnpm install`. [.storybook/main.ts](../../../.storybook/main.ts)
  also aliases datavis's deps from the pnpm virtual store so Storybook resolves
  them.
- Source/Grid are **coupled through React context** — a `DataVisNitroGrid` must be
  rendered inside a `DataVisNitroSource`. Don't refactor one without the other.
- View instances are tagged (`_dvType` / `_dvUrl`) for tracking; preserve those
  when touching `useView` wiring.
- A `TranslateFn` hook is threaded for i18n — keep labels translatable, don't
  hardcode strings.
- `DataVisNitroGridProps` deliberately `Omit`s `view`/`children`/`allColumns` from
  the underlying `DataGridProps` and re-adds a curated set. Keep that surface
  intentional when the submodule's props change.
