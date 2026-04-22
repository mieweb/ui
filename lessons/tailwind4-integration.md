# Integrating @mieweb/ui with Tailwind CSS 4

> Lessons learned from integrating `@mieweb/ui` into a Tailwind CSS 4 project. These apply to **any** Tailwind 4 consumer, regardless of framework (Meteor, Next.js, Vite, etc.).

---

## Lesson 1: Tailwind CSS 4 Tree-Shaking Will Hide Your Components

**Problem:** After installing `@mieweb/ui` and using its React components, you get black borders, missing backgrounds, broken layouts. Utility classes exist in the component source but Tailwind doesn't generate them.

**Root Cause:** Tailwind 4 uses automatic content detection and, by default, only scans files it discovers itself — it does **not** scan `node_modules/`. The `tailwind.config.cjs` `content` array is still supported, but it is not what Tailwind 4's CSS-first engine relies on to find classes in library code. To reliably include utilities from packages in `node_modules`, you must explicitly point Tailwind at them.

**Fix:** Add an `@source` directive in your CSS entry point:

```css
@source "../node_modules/@mieweb/ui/dist";
```

This tells Tailwind 4 to scan the library's compiled output for class names. Without this line, **every external component library will appear broken.**

---

## Lesson 2: PostCSS Config — Use the Tailwind 4 Plugin, Not the Tailwind 3 One

**Problem:** If you configure `postcss.config.cjs` with `tailwindcss` (the old plugin), nothing works. Tailwind 4 requires its own PostCSS plugin.

**Fix:**

```js
// postcss.config.cjs
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
};
```

**NOT** `tailwindcss: {}` — that's the Tailwind 3 plugin and will silently fail or produce wrong output.

---

## Lesson 3: Brand Imports — Prefer the Barrel for Dynamic Loading

**Problem:** Confusion when importing individual brand configs like `import { bluehiveBrand } from '@mieweb/ui/brands/bluehive'`. While `@mieweb/ui` does export `./brands/*` subpaths in `package.json` (so TypeScript and bundlers can resolve them), the real pitfall is mixing up CSS brand files (`.css`) with JavaScript brand configs (`.ts`), or importing named exports that don't match what each submodule actually exports.

**Fix:** Use the barrel import with the lazy loader pattern for dynamic brand switching:

```typescript
import { generateBrandCSS, brands } from '@mieweb/ui/brands';

// Lazy-load a brand config by key
const config = await brands['bluehive']();
const css = generateBrandCSS(config);
```

The `brands` object returns `() => Promise<BrandConfig>` for each brand — this also gives you code splitting for free.

---

## Lesson 4: Dark Mode — The Biggest Gotcha (CSS Variable Fallbacks)

**This one cost hours of debugging. Read carefully.**

**Problem:** You set up dark mode, the `dark:` utility classes exist (verified 299 rules generated), the toggle sets `data-theme="dark"` and `.dark` class on `<html>`, but the sidebar stays white and dark mode barely works. Only the `<body>` gets dark (from mie-ui's own internal CSS).

**Red Herring:** You might think `@custom-variant dark` is broken. It's not. The Tailwind dark variant IS generating rules correctly.

**Actual Root Cause:** Your `@theme inline` block maps Tailwind color tokens to `@mieweb/ui` CSS variables:

```css
--color-neutral-900: var(--mieweb-neutral-900);
```

If you are consuming **only** a brand CSS file (e.g., `bluehive.css`) or `generateBrandCSS()` output **without** importing the library's base stylesheet (`@mieweb/ui/styles.css` or `@mieweb/ui/init.css`), those brand files only define `--mieweb-primary-*` and semantic tokens. They do **NOT** define `--mieweb-neutral-*`, `--mieweb-secondary-*`, etc. In that scenario, those `var()` calls resolve to **nothing** (transparent), so `dark:bg-neutral-900` renders as transparent.

> **Note:** If you import `@mieweb/ui/styles.css` or `@mieweb/ui/init.css`, the library ships default values for all scales and this issue does not occur.

**Fix:** Add CSS fallback values using Tailwind's standard palette to EVERY `var()` reference in `@theme inline`:

```css
--color-neutral-900: var(--mieweb-neutral-900, #171717);
```

The fallback (`#171717`) ensures colors work even when the brand CSS doesn't define that scale. If a brand DOES define `--mieweb-neutral-900`, the brand value wins. You need fallbacks for ALL six color scales: neutral, secondary, destructive, success, warning, info.

**Fallback palette values (Tailwind defaults):**

| Scale | 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950 |
|-------|-----|------|------|------|------|------|------|------|------|------|------|
| neutral | #fafafa | #f5f5f5 | #e5e5e5 | #d4d4d4 | #a3a3a3 | #737373 | #525252 | #404040 | #262626 | #171717 | #0a0a0a |
| secondary (Indigo) | #eef2ff | #e0e7ff | #c7d2fe | #a5b4fc | #818cf8 | #6366f1 | #4f46e5 | #4338ca | #3730a3 | #312e81 | #1e1b4b |
| destructive | #fef2f2 | #fee2e2 | #fecaca | #fca5a5 | #f87171 | #ef4444 | #dc2626 | #b91c1c | #991b1b | #7f1d1d | #450a0a |
| success | #f0fdf4 | #dcfce7 | #bbf7d0 | #86efac | #4ade80 | #22c55e | #16a34a | #15803d | #166534 | #14532d | #052e16 |
| warning | #fffbeb | #fef3c7 | #fde68a | #fcd34d | #fbbf24 | #f59e0b | #d97706 | #b45309 | #92400e | #78350f | #451a03 |
| info | #f0f9ff | #e0f2fe | #bae6fd | #7dd3fc | #38bdf8 | #0ea5e9 | #0284c7 | #0369a1 | #075985 | #0c4a6e | #082f49 |

---

## Lesson 5: Dark Mode Variant — Use @custom-variant, Not Just tailwind.config darkMode

**Problem:** Tailwind 4's CSS-first config doesn't always respect `tailwind.config.cjs`'s `darkMode` setting the way Tailwind 3 did.

**Fix:** Define the dark variant explicitly in CSS **and** set both the class and data attribute on toggle:

```css
@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));
```

```typescript
function applyTheme(t: 'light' | 'dark') {
  const root = document.documentElement;
  root.classList.toggle('dark', t === 'dark');       // for Tailwind config compat
  root.setAttribute('data-theme', t);                // for @custom-variant
}
```

Setting both `.dark` class AND `data-theme` attribute ensures compatibility whether dark mode is matched via the Tailwind config or the `@custom-variant` directive.

---

## Complete CSS Setup (Copy-Paste Reference)

This is the full `styles.css` a consumer needs. Every line is here for a reason:

```css
/* 1. Import brand CSS in a layer so it can be overridden */
@import '@mieweb/ui/brands/bluehive.css' layer(theme);

/* 2. Import Tailwind */
@import 'tailwindcss';

/* 3. Tell Tailwind 4 to scan @mieweb/ui's dist output for class names */
@source "../node_modules/@mieweb/ui/dist";

/* 4. Define dark mode variant for Tailwind 4 */
@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));

/* 5. Map @mieweb/ui CSS variables to Tailwind color tokens WITH fallbacks */
@theme {
  /* Primary — no fallbacks needed, brand CSS always defines these */
  --color-primary: var(--mieweb-primary-500);
  --color-primary-50: var(--mieweb-primary-50);
  --color-primary-100: var(--mieweb-primary-100);
  --color-primary-200: var(--mieweb-primary-200);
  --color-primary-300: var(--mieweb-primary-300);
  --color-primary-400: var(--mieweb-primary-400);
  --color-primary-500: var(--mieweb-primary-500);
  --color-primary-600: var(--mieweb-primary-600);
  --color-primary-700: var(--mieweb-primary-700);
  --color-primary-800: var(--mieweb-primary-800);
  --color-primary-900: var(--mieweb-primary-900);
  --color-primary-950: var(--mieweb-primary-950);
  --color-primary-foreground: var(--mieweb-primary-foreground, #ffffff);

  /* Secondary — MUST have fallbacks (Indigo defaults match library baseline) */
  --color-secondary: var(--mieweb-secondary-500, #6366f1);
  --color-secondary-50: var(--mieweb-secondary-50, #eef2ff);
  --color-secondary-100: var(--mieweb-secondary-100, #e0e7ff);
  --color-secondary-200: var(--mieweb-secondary-200, #c7d2fe);
  --color-secondary-300: var(--mieweb-secondary-300, #a5b4fc);
  --color-secondary-400: var(--mieweb-secondary-400, #818cf8);
  --color-secondary-500: var(--mieweb-secondary-500, #6366f1);
  --color-secondary-600: var(--mieweb-secondary-600, #4f46e5);
  --color-secondary-700: var(--mieweb-secondary-700, #4338ca);
  --color-secondary-800: var(--mieweb-secondary-800, #3730a3);
  --color-secondary-900: var(--mieweb-secondary-900, #312e81);
  --color-secondary-950: var(--mieweb-secondary-950, #1e1b4b);
  --color-secondary-foreground: var(--mieweb-secondary-foreground, #ffffff);

  /* Neutral — MUST have fallbacks */
  --color-neutral: var(--mieweb-neutral-500, #737373);
  --color-neutral-50: var(--mieweb-neutral-50, #fafafa);
  --color-neutral-100: var(--mieweb-neutral-100, #f5f5f5);
  --color-neutral-200: var(--mieweb-neutral-200, #e5e5e5);
  --color-neutral-300: var(--mieweb-neutral-300, #d4d4d4);
  --color-neutral-400: var(--mieweb-neutral-400, #a3a3a3);
  --color-neutral-500: var(--mieweb-neutral-500, #737373);
  --color-neutral-600: var(--mieweb-neutral-600, #525252);
  --color-neutral-700: var(--mieweb-neutral-700, #404040);
  --color-neutral-800: var(--mieweb-neutral-800, #262626);
  --color-neutral-900: var(--mieweb-neutral-900, #171717);
  --color-neutral-950: var(--mieweb-neutral-950, #0a0a0a);

  /* Destructive — MUST have fallbacks */
  --color-destructive: var(--mieweb-destructive, #ef4444);
  --color-destructive-50: var(--mieweb-destructive-50, #fef2f2);
  --color-destructive-100: var(--mieweb-destructive-100, #fee2e2);
  --color-destructive-200: var(--mieweb-destructive-200, #fecaca);
  --color-destructive-300: var(--mieweb-destructive-300, #fca5a5);
  --color-destructive-400: var(--mieweb-destructive-400, #f87171);
  --color-destructive-500: var(--mieweb-destructive-500, #ef4444);
  --color-destructive-600: var(--mieweb-destructive-600, #dc2626);
  --color-destructive-700: var(--mieweb-destructive-700, #b91c1c);
  --color-destructive-800: var(--mieweb-destructive-800, #991b1b);
  --color-destructive-900: var(--mieweb-destructive-900, #7f1d1d);
  --color-destructive-950: var(--mieweb-destructive-950, #450a0a);
  --color-destructive-foreground: var(--mieweb-destructive-foreground, #ffffff);

  /* Success — MUST have fallbacks */
  --color-success: var(--mieweb-success, #22c55e);
  --color-success-50: var(--mieweb-success-50, #f0fdf4);
  --color-success-100: var(--mieweb-success-100, #dcfce7);
  --color-success-200: var(--mieweb-success-200, #bbf7d0);
  --color-success-300: var(--mieweb-success-300, #86efac);
  --color-success-400: var(--mieweb-success-400, #4ade80);
  --color-success-500: var(--mieweb-success-500, #22c55e);
  --color-success-600: var(--mieweb-success-600, #16a34a);
  --color-success-700: var(--mieweb-success-700, #15803d);
  --color-success-800: var(--mieweb-success-800, #166534);
  --color-success-900: var(--mieweb-success-900, #14532d);
  --color-success-950: var(--mieweb-success-950, #052e16);
  --color-success-foreground: var(--mieweb-success-foreground, #ffffff);

  /* Warning — MUST have fallbacks */
  --color-warning: var(--mieweb-warning, #f59e0b);
  --color-warning-50: var(--mieweb-warning-50, #fffbeb);
  --color-warning-100: var(--mieweb-warning-100, #fef3c7);
  --color-warning-200: var(--mieweb-warning-200, #fde68a);
  --color-warning-300: var(--mieweb-warning-300, #fcd34d);
  --color-warning-400: var(--mieweb-warning-400, #fbbf24);
  --color-warning-500: var(--mieweb-warning-500, #f59e0b);
  --color-warning-600: var(--mieweb-warning-600, #d97706);
  --color-warning-700: var(--mieweb-warning-700, #b45309);
  --color-warning-800: var(--mieweb-warning-800, #92400e);
  --color-warning-900: var(--mieweb-warning-900, #78350f);
  --color-warning-950: var(--mieweb-warning-950, #451a03);
  --color-warning-foreground: var(--mieweb-warning-foreground, #ffffff);

  /* Info — MUST have fallbacks */
  --color-info: var(--mieweb-info, #0ea5e9);
  --color-info-50: var(--mieweb-info-50, #f0f9ff);
  --color-info-100: var(--mieweb-info-100, #e0f2fe);
  --color-info-200: var(--mieweb-info-200, #bae6fd);
  --color-info-300: var(--mieweb-info-300, #7dd3fc);
  --color-info-400: var(--mieweb-info-400, #38bdf8);
  --color-info-500: var(--mieweb-info-500, #0ea5e9);
  --color-info-600: var(--mieweb-info-600, #0284c7);
  --color-info-700: var(--mieweb-info-700, #0369a1);
  --color-info-800: var(--mieweb-info-800, #075985);
  --color-info-900: var(--mieweb-info-900, #0c4a6e);
  --color-info-950: var(--mieweb-info-950, #082f49);
  --color-info-foreground: var(--mieweb-info-foreground, #ffffff);

  /* Semantic tokens — with fallbacks */
  --color-border: var(--mieweb-border, #e5e7eb);
  --color-input: var(--mieweb-input, #e5e7eb);
  --color-ring: var(--mieweb-ring, #27aae1);
  --color-background: var(--mieweb-background, #ffffff);
  --color-foreground: var(--mieweb-foreground, #171717);
  --color-card: var(--mieweb-card, #ffffff);
  --color-card-foreground: var(--mieweb-card-foreground, #171717);
  --color-muted: var(--mieweb-muted, #f5f5f5);
  --color-muted-foreground: var(--mieweb-muted-foreground, #737373);

  --color-chart-1: var(--mieweb-chart-1);
  --color-chart-2: var(--mieweb-chart-2);
  --color-chart-3: var(--mieweb-chart-3);
  --color-chart-4: var(--mieweb-chart-4);
  --color-chart-5: var(--mieweb-chart-5);
}

body {
  @apply bg-neutral-50 text-neutral-800 dark:bg-neutral-900 dark:text-neutral-100;
}
```

---

## PostCSS Config

```js
// postcss.config.cjs
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
};
```

---

## Tailwind Config (safety net for Tailwind 3 compat)

```js
// tailwind.config.cjs
const { miewebUIPreset } = require('@mieweb/ui/tailwind-preset');

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [miewebUIPreset],
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './src/**/*.{js,ts,jsx,tsx,html}',
    './node_modules/@mieweb/ui/dist/**/*.js',
  ],
  theme: { extend: {} },
  plugins: [],
};
```

> The `content` array is partially redundant in Tailwind 4 (which uses automatic content detection), but keeping it doesn't hurt and provides a safety net.

---

## Quick Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Black/missing borders on @mieweb/ui components | Tailwind tree-shaking | Add `@source` directive |
| Dark mode toggle does nothing | Missing `@custom-variant dark` | Add it to styles.css |
| Dark mode toggles but sidebar stays light | Missing neutral color fallbacks | Add fallback values to `@theme inline` |
| Brand switch has no effect | Wrong import path | Use barrel: `from '@mieweb/ui/brands'` |
| TypeScript errors on brand imports | Subpath resolution | Use barrel import, not individual subpaths |
| PostCSS does nothing | Wrong plugin | Use `@tailwindcss/postcss`, not `tailwindcss` |
| `var()` resolves to transparent | No CSS variable defined | Add fallback value: `var(--token, #hex)` |

---

## Verification Checklist

- [ ] `@source` directive present in styles.css
- [ ] `@custom-variant dark` defined in styles.css
- [ ] ALL `var()` in `@theme inline` have fallback values (except primary, which brands always define)
- [ ] PostCSS uses `@tailwindcss/postcss` not `tailwindcss`
- [ ] Theme toggle sets both `.dark` class AND `data-theme` attribute
- [ ] All UI elements use `@mieweb/ui` imports (no raw HTML elements)
- [ ] Brand switching works (test at least 2 brands)
- [ ] Dark mode works with non-default brand active
