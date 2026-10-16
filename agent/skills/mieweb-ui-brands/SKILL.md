---
name: mieweb-ui-brands
description: Brand theming for @mieweb/ui — available brands, switching brands at build or runtime, the dark-mode model, and the step-by-step procedure for creating a new brand. USE WHEN applying a brand to an app, switching themes, debugging brand colors not applying, or adding a brand for a new product.
---

# @mieweb/ui brands

A brand is a set of `--mieweb-*` CSS variable overrides. Components never change per brand — they read tokens via the Tailwind preset (see the `mieweb-ui-tokens` skill for every token). Brand names, logos, and assets are trademarks of Medical Informatics Engineering — see `BRAND_GUIDELINES.md`; they are not covered by the code license.

## Available brands

`bluehive`, `ccme`, `default`, `enterprise-health`, `mieweb`, `ozwell`, `waggleline`, `webchart` — each has a `BrandConfig` in `src/brands/<name>.ts`, and all except `default` ship a committed CSS file exported as `@mieweb/ui/brands/<name>.css`.

## Applying a brand

**Static (most apps)** — import the brand CSS once:

```ts
import '@mieweb/ui/styles.css'; // or init.css — REQUIRED, see pitfall below
import '@mieweb/ui/brands/bluehive.css';
```

Tailwind 4 consumers: keep both imports plain (unlayered), in that order. Do **not** wrap only the brand CSS in `layer(theme)` — the base stylesheet's `:root` defaults are unlayered, and unlayered declarations beat layered ones, so a layered brand's overrides would silently lose and the brand would not apply.

**Runtime switching** — generate CSS from a brand config and inject it:

```ts
import { brands, generateBrandCSS } from '@mieweb/ui/brands';

const config = await brands['waggleline']();
styleEl.textContent = generateBrandCSS(config);
```

`createBrandPreset(config)` / `generateTailwindTheme(config)` exist for build-time Tailwind integration of a single brand.

## Dark mode

Each brand CSS defines light-mode semantic tokens on `:root` and dark-mode overrides under `[data-theme='dark'], .dark`. Toggling dark mode = adding/removing the `.dark` class or `data-theme="dark"` attribute on an ancestor (usually `<html>`). Components already carry their `dark:` variants; never write brand- or mode-specific component code.

## Pitfall: brand CSS alone is not a theme

Brand CSS files emit only the **primary scale + semantic tokens**. The other scales (`neutral`, `secondary`, `destructive`, …) get their defaults from the library's base stylesheet. If an app imports a brand CSS **without** `@mieweb/ui/styles.css` (or `init.css`), those scales resolve to nothing and classes like `dark:bg-neutral-900` render transparent. Always load the base stylesheet first.

## Creating a new brand

1. **Config** — add `src/brands/<name>.ts` exporting a `BrandConfig` (`name`, `displayName`, `colors`, `typography`, `borderRadius`, `boxShadow`). Only the `primary` `ColorScale` (50–950) and `light`/`dark` `SemanticColors` are required in `colors`; `secondary`/`neutral`/`destructive`/`success`/`warning`/`info` scales and `accent` are optional and fall back to library defaults. Follow an existing brand (e.g. `src/brands/waggleline.ts`) including its header comment documenting the brand palette.
2. **CSS** — generate and commit `src/brands/<name>.css` from the config: `generateBrandCSS(config)` produces the `:root` + dark-mode blocks. Keep the usage header comment the other brand CSS files carry. `pnpm build`'s `copy:brand-css` step copies it to `dist/brands/` automatically.
3. **Register** — in `src/brands/index.ts`: add the named export and an entry in the lazy `brands` map. Storybook keeps its own registry in `.storybook/preview.tsx`: add the brand to its `brands` map and to the brand toolbar `items` — unknown keys silently fall back to BlueHive, so skipping this makes step 6 impossible.
4. **Exports** — add a `"./brands/<name>.css"` entry to `package.json` `exports` (next to the existing brand CSS entries).
5. **Logos/assets** — only with brand-owner approval; they live under `src/brands/logos/`.
6. **Verify** — switch Storybook to the new brand and check primary actions, semantic states, and dark mode; run `pnpm typecheck && pnpm lint`.
