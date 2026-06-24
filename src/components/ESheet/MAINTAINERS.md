# ESheet — Maintainer Notes

> **Provider notes** — how to *change* the eSheet integration. Consumers should
> read the Storybook stories and use `@mieweb/ui/esheet`. General conventions:
> [CONTRIBUTING.md](../../../CONTRIBUTING.md).

## The implementation is NOT in this folder

This folder contains **only Storybook stories**
([EsheetBuilder.stories.tsx](EsheetBuilder.stories.tsx),
[EsheetRenderer.stories.tsx](EsheetRenderer.stories.tsx)). The real code lives in
the **`packages/esheet` git submodule**, an **nx monorepo** of packages:

```
@esheet/core      @esheet/fields   @esheet/adapters
@esheet/builder   @esheet/renderer
```

It's surfaced to consumers through a **separate entry**,
[src/esheet.ts](../../esheet.ts) → `@mieweb/ui/esheet`, which re-exports:

- `FormDefinition` (from `@esheet/core`)
- `EsheetBuilder`, `EsheetBuilderProps` (from `@esheet/builder`)
- `EsheetRenderer`, `EsheetRendererProps`, `EsheetRendererHandle` (from `@esheet/renderer`)

`@esheet/builder` and `@esheet/renderer` are **optional peer deps**.

## How to work on it

- **You edit the submodule, not `src`.** Changes to builder/renderer behavior go
  into `packages/esheet/...` and must be committed in that submodule's repo, then
  the submodule pointer bumped here.
- **Storybook uses the submodule source directly.** [.storybook/main.ts](../../../.storybook/main.ts)
  aliases `@esheet/<pkg>` → `packages/esheet/packages/<pkg>/src/index.ts`, so
  stories pick up source edits with HMR — no rebuild needed for Storybook.
- **The library build needs a built submodule.** `prebuild` runs `build:esheet`,
  which nx-builds the five projects (only if their `dist` is missing). If you
  change submodule source and build the library, force a rebuild of those
  packages.

## Gotchas

- `@esheet/*` failing to resolve almost always means the submodule isn't
  initialized (`git submodule update --init --recursive`) or hasn't been built
  (`pnpm build:esheet`).
- **Vitest excludes `packages/esheet/**`** — submodule code has its own tests;
  don't expect this repo's `pnpm test` to cover it.
- Keep `src/esheet.ts`'s re-export surface minimal and stable — it's the public
  contract; the submodule's internal exports are not.
