# Adopting @mieweb/ui — Universal Guide

> Framework-agnostic playbook for bringing any project into compliance with `@mieweb/ui`. Covers audit, resolution, testing, and gap detection. Works for React, Next.js, Remix, Vite, Meteor, or any Tailwind CSS 4 project.

---

## Overview

`@mieweb/ui` (ui.mieweb.org) is a themeable, accessible React component library with 126+ components, brand theming, and dark mode. Adopting it means:

1. **All UI primitives** come from `@mieweb/ui` — no raw HTML elements
2. **Theming** uses the `@mieweb/ui` CSS variable system
3. **Dark mode** and **brand switching** work everywhere
4. **Accessibility** (ARIA) and **i18n** are inherited from the library

---

## Phase 1: Audit

### 1.1 Install Dependencies

```bash
npm install @mieweb/ui react react-dom
npm install -D tailwindcss@4 @tailwindcss/postcss autoprefixer
```

### 1.2 Element Audit — Find Raw HTML

Run these searches against your codebase to find raw HTML elements that must be replaced:

```bash
# Buttons
grep -rn '<button' --include='*.tsx' --include='*.jsx' src/

# Inputs
grep -rn '<input' --include='*.tsx' --include='*.jsx' src/

# Selects
grep -rn '<select' --include='*.tsx' --include='*.jsx' src/

# Tables
grep -rn '<table\|<thead\|<tbody\|<tr\|<td\|<th' --include='*.tsx' --include='*.jsx' src/

# Textareas
grep -rn '<textarea' --include='*.tsx' --include='*.jsx' src/

# Modals/dialogs
grep -rn 'modal\|dialog\|overlay' --include='*.tsx' --include='*.jsx' -i src/

# Cards (custom div-based cards)
grep -rn 'className=.*card' --include='*.tsx' --include='*.jsx' -i src/

# Badges/pills
grep -rn 'badge\|pill\|tag\b' --include='*.tsx' --include='*.jsx' -i src/

# Loading/spinners
grep -rn 'spinner\|loading\|skeleton' --include='*.tsx' --include='*.jsx' -i src/
```

### 1.3 Component Mapping

Replace raw elements using this mapping:

| Raw HTML / Custom Markup | `@mieweb/ui` Import |
|--------------------------|---------------------|
| `<button>` | `Button` |
| `<input>` | `Input` |
| `<input type="checkbox">` | `Checkbox` |
| `<input type="radio">` | `Radio` |
| `<textarea>` | `Textarea` |
| `<select>` | `Select` |
| `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<td>`, `<th>` | `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell` |
| Custom modal/dialog divs | `Modal`, `ModalHeader`, `ModalBody`, `ModalFooter` |
| Custom card containers | `Card`, `CardHeader`, `CardContent` |
| Badge/pill/tag spans | `Badge` |
| Avatar circles | `Avatar` |
| Loading spinners | `Spinner` |
| Skeleton loaders | `Skeleton` |
| Progress bars | `Progress` |
| Tabs | `Tabs` |
| Tooltips | `Tooltip` |
| Toasts/notifications | `Toast` |
| Breadcrumbs | `Breadcrumb` |
| Date pickers | `DateRangePicker`, `DateInput` |
| Phone inputs | `PhoneInput` |
| Sliders | `Slider` |
| Switches/toggles | `Switch` |
| Dropdowns | `Dropdown` |
| Pagination | `Pagination` |
| Chat / Messaging UI | `MessageBubble`, `MessageList`, `MessageComposer` (from `Messaging`) |
| Header / App bar | `AppHeader`, `PageHeader`, `SiteHeader` |
| Sidebar navigation | `Sidebar` |
| Footer | `SiteFooter` |
| Step indicators | `StepIndicator` |
| Command palettes | `CommandPalette` |
| File uploads | `DropzoneOverlay`, `FileManager` |

### 1.4 Generate an Audit Report

Count violations per category:

```bash
echo "=== @mieweb/ui Compliance Audit ==="
echo "Raw <button>:    $(grep -rn '<button' --include='*.tsx' --include='*.jsx' src/ | wc -l)"
echo "Raw <input>:     $(grep -rn '<input' --include='*.tsx' --include='*.jsx' src/ | wc -l)"
echo "Raw <select>:    $(grep -rn '<select' --include='*.tsx' --include='*.jsx' src/ | wc -l)"
echo "Raw <table>:     $(grep -rn '<table' --include='*.tsx' --include='*.jsx' src/ | wc -l)"
echo "Raw <textarea>:  $(grep -rn '<textarea' --include='*.tsx' --include='*.jsx' src/ | wc -l)"
echo "@mieweb/ui used: $(grep -rn '@mieweb/ui' --include='*.tsx' --include='*.jsx' src/ | wc -l)"
```

### 1.5 CSS Theme Audit

Check whether the project has proper Tailwind 4 + `@mieweb/ui` CSS setup:

| Requirement | Where to Check | How to Verify |
|-------------|----------------|---------------|
| `@source` directive | CSS entry point | `grep '@source.*@mieweb/ui' *.css` |
| `@custom-variant dark` | CSS entry point | `grep '@custom-variant dark' *.css` |
| `@theme` with fallbacks | CSS entry point | `grep 'var(--mieweb.*,' *.css` (comma = fallback present) |
| PostCSS plugin | `postcss.config.*` | Must use `@tailwindcss/postcss`, NOT `tailwindcss` |
| Dark mode toggle | App root / layout | Sets both `.dark` class AND `data-theme` attribute |
| Brand CSS loaded | App initialization | Imports from `@mieweb/ui/brands` or inline brand CSS |

---

## Phase 2: Resolution Plan

### 2.1 CSS Foundation (Do This First)

Set up the CSS entry point. You have two options:

**Option A — Quick Start (one import):**

```css
/* your-app/styles.css */
@import '@mieweb/ui/init.css';
/* Your custom styles below */
```

**Option B — Manual Setup (full control):**

```css
@import 'tailwindcss';
@source "../node_modules/@mieweb/ui/dist";
@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));

@theme {
  --color-primary: var(--mieweb-primary-500);
  --color-primary-50: var(--mieweb-primary-50);
  /* ... full theme block — see init.css for reference */
}
```

See [tailwind4-integration.md](tailwind4-integration.md) for complete CSS variable tables and fallback values.

### 2.2 PostCSS Configuration

```js
// postcss.config.cjs
module.exports = {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
};
```

### 2.3 Theme & Brand Hooks

Every project needs two hooks:

**`useTheme`** — Dark/light toggle that sets both `.dark` class and `data-theme` attribute:

```typescript
import { useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

function applyTheme(t: Theme) {
  document.documentElement.classList.toggle('dark', t === 'dark');
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('theme', t);
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'light';
    return (localStorage.getItem('theme') as Theme) ??
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  });
  useEffect(() => { applyTheme(theme); }, [theme]);
  const toggle = () => setTheme(t => t === 'dark' ? 'light' : 'dark');
  return { theme, setTheme, toggle } as const;
}
```

**`useBrand`** — Dynamic brand switching:

```typescript
import { useCallback, useEffect, useState } from 'react';
import { generateBrandCSS, brands } from '@mieweb/ui/brands';

export type BrandId = keyof typeof brands;

export function useBrand() {
  const [brand, setBrandState] = useState<BrandId>(() =>
    (typeof window !== 'undefined' ? localStorage.getItem('brand') : null) as BrandId ?? 'bluehive'
  );

  useEffect(() => {
    let el = document.getElementById('mieweb-brand') as HTMLStyleElement | null;
    if (!el) { el = document.createElement('style'); el.id = 'mieweb-brand'; document.head.appendChild(el); }
    if (brand === 'bluehive') { el.textContent = ''; return; }
    brands[brand]().then(config => { el!.textContent = generateBrandCSS(config); });
  }, [brand]);

  const setBrand = useCallback((id: BrandId) => {
    setBrandState(id);
    localStorage.setItem('brand', id);
  }, []);

  return { brand, setBrand } as const;
}
```

### 2.4 Component Replacement Order

Work through replacements in this order (highest impact first):

1. **Layout shell** — `AppHeader`, `Sidebar`, `SiteFooter` → establishes theme context
2. **Buttons** — Typically the most numerous raw element
3. **Form elements** — `Input`, `Select`, `Checkbox`, `Radio`, `Textarea`, `Switch`
4. **Cards & modals** — Structural containers that affect many child components
5. **Tables** — Data-heavy pages
6. **Feedback elements** — `Badge`, `Toast`, `Spinner`, `Progress`, `Skeleton`
7. **Navigation** — `Tabs`, `Breadcrumb`, `Pagination`
8. **Specialized** — `DateRangePicker`, `PhoneInput`, `CommandPalette`, etc.

### 2.5 Per-File Replacement Pattern

For each file with violations:

```typescript
// BEFORE
export function UserList() {
  return (
    <div className="card">
      <table>
        <thead><tr><th>Name</th></tr></thead>
        <tbody>{users.map(u => <tr key={u.id}><td>{u.name}</td></tr>)}</tbody>
      </table>
      <button onClick={loadMore}>Load More</button>
    </div>
  );
}

// AFTER
import { Card, CardContent, Table, TableHeader, TableBody, TableRow, TableCell, Button } from '@mieweb/ui';

export function UserList() {
  return (
    <Card>
      <CardContent>
        <Table>
          <TableHeader><TableRow><TableCell>Name</TableCell></TableRow></TableHeader>
          <TableBody>{users.map(u => <TableRow key={u.id}><TableCell>{u.name}</TableCell></TableRow>)}</TableBody>
        </Table>
        <Button onClick={loadMore}>Load More</Button>
      </CardContent>
    </Card>
  );
}
```

---

## Phase 3: Testing

### 3.1 Visual Smoke Test

After replacing components, verify these scenarios:

| Test | How | Pass Criteria |
|------|-----|---------------|
| Light mode render | Load the app (default) | All components visible, correct colors, no transparent gaps |
| Dark mode toggle | Click theme toggle | All surfaces invert. No white flashes, no transparent sections |
| Brand switch | Switch to each available brand | Primary color changes everywhere. Buttons, links, focus rings all update |
| Dark mode + non-default brand | Switch brand, then toggle dark | Dark mode works correctly with the non-default brand active |
| Responsive layout | Resize browser to mobile width | Components reflow correctly. Sidebar collapses. Tables scroll |
| Keyboard navigation | Tab through the page | Focus indicators visible on all interactive elements |
| Screen reader | Run VoiceOver / NVDA | ARIA labels announced for buttons, inputs, modals |

### 3.2 Dark Mode Regression Checklist

Dark mode is the most common failure point. Check each of these:

- [ ] Background transitions from white → dark on all surfaces
- [ ] Text transitions from dark → light for readability
- [ ] Card backgrounds are distinct from page background
- [ ] Input fields have visible borders in dark mode
- [ ] Dropdown menus / select popups have dark backgrounds
- [ ] Modal overlays and content are dark-themed
- [ ] Badge colors remain legible
- [ ] Chart/data visualization colors adjust (chart-1 through chart-5)
- [ ] Focus ring (`--mieweb-ring`) is visible against dark backgrounds
- [ ] Muted text (`--mieweb-muted-foreground`) is readable but de-emphasized

### 3.3 Brand Switching Test Matrix

| Brand | Primary renders? | Dark mode works? | Focus ring correct? | Semantic colors intact? |
|-------|-----------------|------------------|---------------------|------------------------|
| bluehive (default) | | | | |
| mieweb | | | | |
| ozwell | | | | |
| webchart | | | | |
| enterprise-health | | | | |

### 3.4 Gap Detection

After completing the audit and replacement, look for these gaps:

#### Components Not Yet in @mieweb/ui

If your project has UI patterns with no `@mieweb/ui` equivalent:

1. **Document the gap** — File, component name, description, screenshot
2. **Build it locally first** — Follow the component policy (see [component-policy.md](component-policy.md))
3. **Contribute upstream** — Once stable, submit to `@mieweb/ui`

```bash
# Find custom components that might be candidates for @mieweb/ui
grep -rn 'export.*function\|export.*const' --include='*.tsx' src/components/ \
  | grep -v '@mieweb/ui' \
  | grep -v 'test\|spec\|story'
```

#### Theme Gaps

CSS variables your project uses that `@mieweb/ui` doesn't define:

```bash
# Find custom CSS variables not in the --mieweb-* namespace
grep -rn 'var(--' --include='*.css' --include='*.scss' --include='*.tsx' src/ \
  | grep -v 'mieweb' \
  | grep -v 'tw-' \
  | sort -u
```

#### Accessibility Gaps

```bash
# Interactive elements without ARIA labels
grep -rn '<Button\|<Input\|<Select\|<Modal' --include='*.tsx' src/ \
  | grep -v 'aria-' \
  | grep -v 'label'
```

---

## Phase 4: Verification

### Final Compliance Checklist

Run this checklist before considering the migration complete:

#### CSS Setup
- [ ] `@source "../node_modules/@mieweb/ui/dist"` present in CSS entry
- [ ] `@custom-variant dark` defined in CSS entry
- [ ] All `var()` in `@theme` have fallback values (except primary)
- [ ] PostCSS uses `@tailwindcss/postcss`, not `tailwindcss`

#### Component Compliance
- [ ] Zero raw `<button>` elements (all replaced with `Button`)
- [ ] Zero raw `<input>` elements (all replaced with `Input`, `Checkbox`, `Radio`)
- [ ] Zero raw `<select>` elements (all replaced with `Select`)
- [ ] Zero raw `<table>` elements (all replaced with `Table`)
- [ ] Zero raw `<textarea>` elements (all replaced with `Textarea`)
- [ ] Zero custom modal/dialog markup (all replaced with `Modal`)

#### Theming
- [ ] `useTheme` sets both `.dark` class AND `data-theme` attribute
- [ ] Dark mode works on all pages
- [ ] Brand switching works (test at least 2 brands)
- [ ] Dark mode works with non-default brand active

#### Accessibility
- [ ] All interactive elements have ARIA labels
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Focus indicators visible on all controls
- [ ] Semantic HTML used where appropriate

#### Build
- [ ] `npx tsc --noEmit` passes clean
- [ ] No console errors on page load
- [ ] No console errors during dark mode toggle
- [ ] No console errors during brand switch

---

## Common Traps

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Black/missing borders on components | Tailwind 4 tree-shaking | Add `@source` directive |
| Dark mode toggle does nothing | Missing `@custom-variant dark` | Add to CSS entry |
| Dark mode toggles but surfaces stay light | CSS variable fallbacks missing | Add hex fallbacks to `@theme` |
| Brand switch has no effect | Wrong import path | Use barrel: `from '@mieweb/ui/brands'` |
| PostCSS does nothing | Wrong plugin | Use `@tailwindcss/postcss` |
| `var()` resolves to transparent | No CSS variable defined | Add fallback: `var(--token, #hex)` |
| TypeScript errors on imports | Subpath resolution | Use barrel imports, not individual subpaths |
| Components render but look wrong | Missing theme variables | Verify `@theme` block has all required scales |

---

## Quick Reference Links

- **Component Storybook:** [ui.mieweb.org](https://ui.mieweb.org)
- **Tailwind 4 setup details:** [tailwind4-integration.md](tailwind4-integration.md)
- **Component contribution policy:** [component-policy.md](component-policy.md)
- **Recommended library improvements:** [recommended-changes.md](recommended-changes.md)
