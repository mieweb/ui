# AGGrid — Maintainer Notes

> **Provider notes** — how to *change* the AG Grid wrapper. Consumers should read
> the in-folder [implementation-guide.md](implementation-guide.md) (usage) and the
> Storybook stories. General conventions: [CONTRIBUTING.md](../../../CONTRIBUTING.md).

## ⚠️ Prefer NITRO DataVis over AGGrid

**AGGrid is a last resort, not the default grid.** `ag-grid-community` /
`ag-grid-react` are heavy dependencies and pull significant weight into any bundle
that uses them. To minimize bloat:

- **Reach for [DataVisNITRO](../DataVisNITRO/MAINTAINERS.md) first** for tables and
  data grids. Use AGGrid **only** when NITRO DataVis genuinely lacks the required
  functionality.
- When you do use AGGrid, **document why** NITRO couldn't cover the case — that
  gap is a candidate feature request for NITRO so the next consumer can avoid the
  dependency.
- Whenever NITRO gains the missing capability, **migrate AGGrid usages back to
  NITRO** and drop the AG Grid peers where possible.

The separate `@mieweb/ui/ag-grid` entry already keeps AG Grid out of the default
bundle (see below) — but the cheapest dependency is the one you never import.

## What's in here

A themeable wrapper around **ag-grid-react / ag-grid-community** (both are
**optional peer deps**). It ships from a **separate entry**, not the main barrel:

```ts
import { AGGrid } from '@mieweb/ui/ag-grid';   // → src/ag-grid.ts → ./components/AGGrid
```

This keeps AG Grid out of the default install/bundle for consumers who don't need
grids.

## Two surfaces: base vs. enhanced

| Surface | Entry | Contents |
|---------|-------|----------|
| Base | [index.ts](index.ts) | `AGGrid`, `AgGridReact`, `CellRenderers` + per-renderer + **Memoized** variants, utilities |
| Enhanced | [index-enhanced.ts](index-enhanced.ts) | `Enhanced*` cell renderers (richer, design-system-integrated) |

Keep the two in sync conceptually but don't merge them — the enhanced renderers
pull in more and are opt-in. Stories: [AGGrid.stories.tsx](AGGrid.stories.tsx) and
[AGGrid.enhanced.stories.tsx](AGGrid.enhanced.stories.tsx).

## Invariants & gotchas

- **Module registration is a deliberate import-time side effect.**
  [AGGrid.tsx](AGGrid.tsx) calls
  `ModuleRegistry.registerModules([AllCommunityModule])` at module scope. This is
  the documented exception to the repo's "side-effect-free JS" rule — AG Grid
  won't render without it. Don't move it into the component body.
- **Consumers must import AG Grid's own CSS** (`ag-grid-community/styles/...`).
  Our wrapper only adds theme/density on top via the `.ag-theme-custom` class.
- **Theming** is CVA-driven ([AGGrid.tsx](AGGrid.tsx)): `variant`
  (default/bordered/striped/card), `size` (xs–xl row density), and `brand`
  (`ag-brand-*` classes). Brand visuals come from
  [ag-grid-theme.css](ag-grid-theme.css) + [brand-theme-utils.ts](brand-theme-utils.ts)
  (`useAGGridBrandTheme`) + the `brandConfig` prop. Add new brands in **all
  three** places.
- **`rowSelection` accepts both the v35+ object form and the legacy string**
  (`'single' | 'multiple'`). Preserve that compatibility shim when bumping AG Grid.
- Prefer the **Memoized** renderers in docs/examples — unmemoized renderers
  re-render the whole grid on data changes.
- `AGGridProps` is `AgGridReactProps` minus `className`/`rowSelection`, plus our
  additions (`height`, `loading`, `onRowClick`, `gridRef`, `brandConfig`,
  `pagination`, `resizable`, sorting). Keep the `Omit` accurate across upgrades.

## Reference

- [implementation-guide.md](implementation-guide.md) — consumer usage walkthrough.
- [ag-grid-audit.md](ag-grid-audit.md) — audit / parity notes.
