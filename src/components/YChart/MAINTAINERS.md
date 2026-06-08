# YChart — Maintainer Notes

> **Provider notes.** YChart is currently a **Storybook-only showcase** — it is
> **not part of the public API**. General conventions:
> [CONTRIBUTING.md](../../../CONTRIBUTING.md).

## What's in here (and what isn't)

- This folder has **only** [YChart.stories.tsx](YChart.stories.tsx). There is **no
  `src` implementation and no `index.ts`**, and YChart is **not exported** from the
  library barrel or any `tsup` entry — so it **never ships in the npm package**.
- The chart engine is a **vanilla (non-React) `YChartEditor` class** living in the
  **`packages/ychart` git submodule**. The story **dynamically imports** it:

  ```ts
  await import('../../../packages/ychart/src/ychartEditor');
  ```

- The story hand-rolls a thin React wrapper: it `initView(container, yaml)` on
  mount and calls `destroy()` on unmount. It's YAML-driven.

## Gotchas

- Requires the **`ychart` submodule** to be initialized, or the dynamic import
  404s in Storybook. (`git submodule update --init --recursive`.)
- **Must call `destroy()` on unmount** — the editor manages DOM/SVG imperatively
  and will leak if the wrapper skips teardown.
- **Theming is bespoke**, not the standard `--mieweb-*` tokens: the story bridges
  light/dark via `[data-ychart-story-root][data-yc-theme="…"]` CSS selectors that
  target the editor's emitted markup. If the submodule changes its DOM/inline
  colors, those selectors must be updated.

## Promoting YChart to a shipped component

If YChart should become a real export, it needs the full treatment: a React
component in `src/components/YChart/` (not just a story), an `index.ts`, a barrel
export, a `tsup` entry, brand-token theming instead of story-only CSS, and a
decision on whether the engine is bundled or a peer dep. Until then, treat it as a
demo only.
