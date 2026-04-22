# Migration Playbook: Meteor 2 + Blaze → Meteor 3 + React + @mieweb/ui

> Battle-tested guide for migrating a Meteor 2.x Blaze app to Meteor 3.x + React 19 + TypeScript + Tailwind CSS 4 + `@mieweb/ui`. Extracted from the timehuddle migration.

---

## Target Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Runtime | Meteor | 3.5-beta.4 |
| UI | React | 19.x |
| Language | TypeScript | 5.9.x |
| CSS | Tailwind CSS | 4.2.x |
| PostCSS | @tailwindcss/postcss | 0.x (Tailwind 4's plugin) |
| Components | @mieweb/ui | 0.2.x |
| Bundler | Rspack | (Meteor's built-in, via `rspack` package) |

---

## Critical Lessons Learned

> The Tailwind 4-specific lessons (1-5) are covered in detail in [tailwind4-integration.md](tailwind4-integration.md). This document summarizes them and adds Meteor-specific lessons.

### Tailwind 4 Lessons (see tailwind4-integration.md for full detail)

1. **Tree-shaking hides components** — Add `@source "../node_modules/@mieweb/ui/dist"` to your CSS
2. **Wrong PostCSS plugin** — Use `@tailwindcss/postcss`, not `tailwindcss`
3. **Brand imports** — Use barrel `from '@mieweb/ui/brands'`, not subpaths
4. **Dark mode CSS variable fallbacks** — Add hex fallbacks to ALL `var()` in `@theme inline` for non-primary scales
5. **Dark mode variant** — Use `@custom-variant dark` in CSS, set both `.dark` class and `data-theme` attribute

### Lesson 6: Meteor 3 Async API Changes

**Problem:** Meteor 3 makes many server-side APIs async that were sync in Meteor 2. `Meteor.userId()` inside a method, collection finds in methods, etc.

**Fix:** All Meteor methods must be `async`. Use `await` for:
- `Meteor.userId()` / `Meteor.user()`
- Collection operations: `find().fetchAsync()`, `insertAsync()`, `updateAsync()`, `removeAsync()`
- Any method calling another method

### Lesson 7: Use @mieweb/ui for ALL UI Elements

**Hard rule:** Never use raw `<button>`, `<input>`, `<select>`, `<table>`, or custom modal/card/badge markup. Always import from `@mieweb/ui`:

```typescript
import { Button, Input, Card, CardHeader, CardContent, Modal, Badge, Select, Table } from '@mieweb/ui';
```

This ensures consistent theming, dark mode support, and accessibility across the entire app.

---

## Architecture

### Project Structure

```
project/
├── client/
│   ├── main.tsx          # React root render
│   └── styles.css        # Tailwind 4 entry (THE critical file)
├── server/
│   └── main.ts           # Feature imports
├── imports/
│   ├── features/         # Self-contained feature modules
│   │   ├── auth/         # Login/registration API + methods
│   │   ├── audit/        # Audit logging
│   │   ├── clock/        # Time clock + timesheet
│   │   ├── dashboard/    # Dashboard page
│   │   ├── inbox/        # Notifications
│   │   ├── messages/     # Chat/messaging
│   │   ├── profile/      # User profile
│   │   ├── teams/        # Team management
│   │   └── tickets/      # Ticket/task system
│   ├── lib/              # Shared utilities
│   │   ├── constants.ts  # App-wide constants, storage keys
│   │   ├── useTheme.ts   # Theme hook (light/dark)
│   │   ├── useBrand.ts   # Brand theme hook
│   │   └── useMethod.ts  # Meteor method wrapper hook
│   ├── startup/
│   │   └── server.ts     # Collection indexes, publications setup
│   └── ui/               # Layout components
│       ├── AppLayout.tsx  # Root shell (sidebar + header + routing)
│       ├── Sidebar.tsx    # Collapsible sidebar navigation
│       ├── AppHeader.tsx  # Top bar
│       ├── router.ts     # Simple context-based router
│       └── ThemeToggle.tsx
├── tailwind.config.cjs
├── postcss.config.cjs
└── rspack.config.js
```

### Feature Module Pattern

Each feature is self-contained. To add or remove a feature:
1. Add/remove the `import` in `server/main.ts`
2. Add/remove the route entry in `AppLayout.tsx`
3. The feature folder contains everything: collection, methods, publications, React pages

```typescript
// server/main.ts
import '../imports/features/auth/api';
import '../imports/features/clock/api';
// Remove a line = feature fully disabled
```

---

## Key Hooks

### useTheme — Dark/Light Mode

```typescript
import { useEffect, useState } from 'react';
import { THEME_KEY } from './constants';

export type Theme = 'light' | 'dark';

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem(THEME_KEY) as Theme | null;
  if (stored) return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(t: Theme) {
  const root = document.documentElement;
  root.classList.toggle('dark', t === 'dark');
  root.setAttribute('data-theme', t);
  localStorage.setItem(THEME_KEY, t);
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  useEffect(() => { applyTheme(theme); }, [theme]);
  const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  return { theme, setTheme, toggle } as const;
}
```

### useBrand — Brand Theme Switching

```typescript
import { useCallback, useEffect, useState } from 'react';
import type { BrandConfig } from '@mieweb/ui';
import { generateBrandCSS, brands } from '@mieweb/ui/brands';
import { BRAND_KEY } from './constants';

export type BrandId = keyof typeof brands;

const STYLE_ID = 'mieweb-brand-override';
const DEFAULT_BRAND: BrandId = 'bluehive';

function applyBrandCSS(css: string) {
  let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement('style');
    el.id = STYLE_ID;
    document.head.appendChild(el);
  }
  el.textContent = css;
}

function getInitialBrand(): BrandId {
  if (typeof window === 'undefined') return DEFAULT_BRAND;
  const stored = localStorage.getItem(BRAND_KEY) as BrandId | null;
  return stored ?? DEFAULT_BRAND;
}

export function useBrand() {
  const [brand, setBrandState] = useState<BrandId>(getInitialBrand);

  useEffect(() => {
    if (brand === DEFAULT_BRAND) {
      const el = document.getElementById(STYLE_ID);
      if (el) el.textContent = '';
      return;
    }
    brands[brand]().then((config) => {
      applyBrandCSS(generateBrandCSS(config));
    });
  }, [brand]);

  const setBrand = useCallback((id: BrandId) => {
    setBrandState(id);
    localStorage.setItem(BRAND_KEY, id);
  }, []);

  return { brand, setBrand } as const;
}
```

---

## Migration Order

1. **Scaffold the project** — `meteor create --release 3.5-beta.4 project-name --typescript --react`
2. **Install npm deps** — `npm install @mieweb/ui react@19 tailwindcss@4 @tailwindcss/postcss autoprefixer`
3. **Create the three critical config files** — `styles.css`, `postcss.config.cjs`, `tailwind.config.cjs` (see [tailwind4-integration.md](tailwind4-integration.md) for exact contents)
4. **Verify Tailwind works** — create a test component with `className="bg-primary-500 text-white p-4"`
5. **Set up shared utilities** — constants.ts, useTheme.ts, useBrand.ts, useMethod.ts
6. **Build the layout shell** — AppLayout, Sidebar, AppHeader, router
7. **Migrate features one at a time** — auth first (it gates everything), then each feature module
8. **Verify dark mode** — toggle dark mode, check sidebar, cards, inputs all go dark
9. **Verify brand switching** — switch to a different brand, verify primary colors change, test dark mode with it
10. **Run `npx tsc --noEmit`** — fix any remaining TypeScript errors

---

## Meteor Packages Required

```
meteor-base@1.5.2
mongo@2.3.0-beta350.4
react-meteor-data
static-html@1.5.0
typescript@5.9.3
es5-shim@4.8.1
shell-server@0.7.0
fetch@0.1.6
ecmascript@0.17.0
reload@1.3.2
tracker@1.3.4
accounts-base@3.2.1-beta350.4
accounts-password@3.0.4
email@3.1.2
standard-minifier-css@1.10.1
standard-minifier-js@3.2.0
dynamic-import@0.7.4
underscore
rspack@1.0.0
server-render@0.4.3
```

---

## Common Traps

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Black/missing borders on @mieweb/ui components | Tailwind tree-shaking | Add `@source` directive |
| Dark mode toggle does nothing | Missing `@custom-variant dark` | Add it to styles.css |
| Dark mode toggles but sidebar stays light | Missing neutral color fallbacks | Add fallback values to `@theme inline` |
| Brand switch has no effect | Wrong import path | Use barrel: `from '@mieweb/ui/brands'` |
| TypeScript errors on brand imports | Subpath resolution | Use barrel import, not individual subpaths |
| PostCSS does nothing | Wrong plugin | Use `@tailwindcss/postcss`, not `tailwindcss` |
| Meteor methods throw "userId is not a function" | Meteor 3 async APIs | Make methods async, await all server APIs |
| Collection operations hang | Meteor 3 async | Use `fetchAsync()`, `insertAsync()`, `updateAsync()` |
| `var()` resolves to transparent | No CSS variable defined | Add fallback value: `var(--token, #hex)` |

---

## Verification Checklist

- [ ] `@source` directive present in styles.css
- [ ] `@custom-variant dark` defined in styles.css
- [ ] ALL `var()` in `@theme inline` have fallback values (except primary)
- [ ] PostCSS uses `@tailwindcss/postcss` not `tailwindcss`
- [ ] `useTheme` sets both `.dark` class AND `data-theme` attribute
- [ ] All UI elements use `@mieweb/ui` imports (no raw HTML elements)
- [ ] All Meteor methods are `async`
- [ ] All collection operations use `*Async()` variants
- [ ] Brand switching works (test at least 2 brands)
- [ ] Dark mode works with non-default brand active
- [ ] `npx tsc --noEmit` passes clean
