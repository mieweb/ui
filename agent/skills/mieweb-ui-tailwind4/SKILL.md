---
name: mieweb-ui-tailwind4
description: Installing and wiring @mieweb/ui in a consumer app — Tailwind 4 `@source` setup vs the Tailwind 3 preset, PostCSS config, dark-mode variant and CSS-variable fallbacks, peer dependencies per entry point, and connecting headless modules to a data layer. USE WHEN setting up @mieweb/ui, components render unstyled/broken, dark mode or brand CSS misbehaves after install, peer-dep errors appear, or a ViewSet/SuperChat-style module needs wiring to app data.
---

# Installing @mieweb/ui (Tailwind 4 era)

Sourced from `lessons/tailwind4-integration.md`, `lessons/adopting-mieweb-ui.md`, and `lessons/wiring-headless-modules.md` in the mieweb/ui repo. Token tables live in the `mieweb-ui-tokens` skill; brand procedures in `mieweb-ui-brands`; entry points and their peer deps in `mieweb-ui-catalog`.

## Install

```bash
npm install @mieweb/ui react react-dom
npm install -D tailwindcss@4 @tailwindcss/postcss autoprefixer
```

`react` / `react-dom` (>=18) are the only **required** peers. Every other peer is **optional** and only needed when you import the entry that uses it (`/maps` → leaflet, `/globe` → react-globe.gl + three, `/kerebron` → @kerebron/\*, `/motion` → motion, `/q` → @mieweb/q, …) — see the catalog skill's entry-point table. A peer-dep warning for an entry you never import is noise, not a problem. Under pnpm's strict node_modules there is no hoisting: required peers must be in the app's own `package.json`; diagnose resolution with `pnpm why <pkg>`.

## Tailwind 4 vs Tailwind 3 — pick the right mechanism

| Consumer | Mechanism |
| --- | --- |
| Tailwind 4 (CSS-first) | `@source "../node_modules/@mieweb/ui/dist";` in the CSS entry — TW4 does **not** scan `node_modules` on its own |
| Tailwind 3 (config-first) | `presets: [miewebUIPreset]` from `@mieweb/ui/tailwind-preset` + the exported `miewebUISafelist` + `node_modules/@mieweb/ui/dist/**/*.js` in `content` |

Without `@source` (TW4) or content/safelist coverage (TW3), the library's utility classes are tree-shaken away: **black borders, missing backgrounds, broken layout** on every component.

## CSS entry — quick start vs manual

**Option A (one import):**

```css
@import '@mieweb/ui/init.css';
```

**Option B (manual, full control)** — every line matters, in this order:

```css
/* 1. Base stylesheet THEN brand (both plain/unlayered — see brands skill) */
@import '@mieweb/ui/styles.css';
@import '@mieweb/ui/brands/bluehive.css';

/* 2. Tailwind */
@import 'tailwindcss';

/* 3. Scan the library output for class names */
@source "../node_modules/@mieweb/ui/dist";

/* 4. Dark variant (TW4 doesn't reliably honor tailwind.config darkMode) */
@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));

/* 5. Map Tailwind color tokens to @mieweb/ui variables — WITH fallbacks */
@theme {
  --color-primary-500: var(--mieweb-primary-500);
  --color-neutral-900: var(--mieweb-neutral-900, #171717);
  /* … full block with fallback hex values: see init.css in the package */
}
```

Primary needs no fallbacks (every brand defines it). **All other scales must carry hex fallbacks** — if the base stylesheet is missing, `var()` resolves to nothing and `dark:bg-neutral-900` renders transparent. This is the single most time-expensive gotcha.

## PostCSS

```js
// postcss.config.cjs
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {}, // Tailwind 4 plugin
    autoprefixer: {},
  },
};
```

`tailwindcss: {}` is the Tailwind **3** plugin — with Tailwind 4 installed it silently fails or produces wrong output.

## Dark mode toggle — set both hooks

```ts
function applyTheme(t: 'light' | 'dark') {
  document.documentElement.classList.toggle('dark', t === 'dark');
  document.documentElement.setAttribute('data-theme', t); // for @custom-variant
}
```

Setting only one of `.dark` / `data-theme` is why "dark mode toggles but half the page stays light". Brand switching at runtime uses the `brands` barrel loader — see the `mieweb-ui-brands` skill.

## Wiring headless modules (ViewSet, SuperChatInbox, …)

Modules never fetch, subscribe, navigate, or write — you supply a small adapter:

1. **Fetch with your stack** (Meteor `useSubscribe`/`useTracker`, TanStack `useQuery`, …) and pass `items` / `loading` / `error` straight through.
2. **Describe records once** via `accessors` (`getId`, `getTitle`, `getStatus`, …) — defined at module scope or memoized; they sit in `useMemo` deps.
3. **Return the promise from `on*` callbacks** (`onMove={(id, s) => update(id, s)}`). The view shows pending state and reverts on rejection. TanStack: `mutateAsync`, not `mutate`; Meteor: `Meteor.callAsync`, don't catch-and-swallow.
4. **Pass both `onOpen` and `getHref`** — `getHref` makes rows real anchors (⌘-click, copy link); `onOpen` intercepts plain clicks for client routing.

Filters/selection/pagination state is yours (usually the URL); `ViewSet` owns only which view is showing. The `table` slot takes a DataVis NITRO grid — `ViewSet` has no table of its own.

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Black/missing borders, unstyled components | TW4 tree-shaking | Add the `@source` directive |
| Dark mode toggle does nothing | Missing `@custom-variant dark` | Add it to the CSS entry |
| Dark toggles but surfaces stay light | Missing `var()` fallbacks / missing base stylesheet | Hex fallbacks in `@theme`; import `styles.css` or `init.css` |
| Brand switch has no effect | Wrong import path | Barrel: `from '@mieweb/ui/brands'` |
| Brand CSS loads but doesn't apply (TW4) | Brand import wrapped in `layer(theme)` | Keep base + brand imports plain/unlayered (brands skill) |
| PostCSS does nothing | TW3 plugin configured | `@tailwindcss/postcss`, not `tailwindcss` |
| `var()` renders transparent | Variable undefined | Fallback: `var(--token, #hex)` |
| Peer-dep install errors | Required vs optional confusion | Only react/react-dom are required; match optional peers to imported entries |
| Module shows failed action as success | `on*` promise swallowed | Return the real promise (`mutateAsync` / `callAsync`) |
| Views regroup on every render | Unstable `accessors` | Module scope or `useMemo` |

## Verification checklist

- [ ] `@source` (TW4) or preset + safelist + content (TW3) in place
- [ ] `@custom-variant dark` defined; toggle sets `.dark` **and** `data-theme`
- [ ] All non-primary `var()` mappings carry hex fallbacks (or `init.css` is used)
- [ ] PostCSS uses `@tailwindcss/postcss`
- [ ] Base stylesheet imported before brand CSS, both unlayered
- [ ] Dark mode works with a non-default brand active
- [ ] `npx tsc --noEmit` clean; no console errors on theme/brand switch
