# Recommended Changes to @mieweb/ui

> Actionable improvements for the `@mieweb/ui` library, derived from real-world integration pain points discovered during the timehuddle Meteor→React migration. These changes would make `@mieweb/ui` work reliably for **any** Tailwind CSS 4 consumer — not just projects that developed alongside the library.

---

## Summary

| Priority | Change | Impact |
|----------|--------|--------|
| **P0** | Add CSS fallbacks to all `var()` in `base.css` `@theme` | Dark mode & non-primary colors work out-of-the-box |
| **P0** | Extend `generateBrandCSS()` to emit all 7 color scales | Brand switching covers neutral/secondary/destructive/success/warning/info |
| **P1** | Ship a `setup.css` with `@source` + `@custom-variant` | Consumers don't need to reverse-engineer the correct CSS setup |
| **P1** | Consolidate duplicate dark-mode blocks | Single source of truth for dark mode tokens |
| **P2** | Add optional full scales to `BrandConfig` type | Brands can customize every color, not just primary |
| **P2** | Deprecate safelist for Tailwind 4 users | `@source` directive replaces the 200+ safelist entries |
| **P3** | Ship a quick-start `init.css` | One `@import` gives consumers a working baseline |

---

## P0: Critical — Broken for New Consumers

### 1. Add CSS Fallback Values to `base.css` `@theme`

**File:** `src/styles/base.css`

**Problem:** The `@theme` block maps `--color-*` tokens to `--mieweb-*` CSS variables without fallbacks:

```css
/* Current — breaks when brand CSS doesn't define these */
--color-neutral-900: var(--mieweb-neutral-900);
```

This issue occurs specifically when a consumer imports **only** a brand CSS file (e.g., `bluehive.css`) or uses `generateBrandCSS()` output **without** importing the library's base stylesheet (`@mieweb/ui/styles.css` or `@mieweb/ui/init.css`). In that scenario, brand CSS files only emit the **primary** scale + semantic tokens, so other scales resolve to nothing (transparent). The library's `base.css` does define default values for all scales, but consumers who set up their own CSS entry point may not include it.

**Fix:** Add Tailwind-default hex fallbacks to every `var()` for non-primary scales:

```css
/* Fixed — works with or without brand CSS */
--color-neutral-900: var(--mieweb-neutral-900, #171717);
```

**Scope:** All entries for neutral, secondary, destructive, success, warning, info scales. Primary can remain without fallbacks since every brand always defines it.

**Fallback values:** Use the standard Tailwind CSS palette:

| Scale | Reference Palette |
|-------|------------------|
| neutral | Tailwind `neutral` (gray) |
| secondary | Tailwind `indigo` |
| destructive | Tailwind `red` |
| success | Tailwind `green` |
| warning | Tailwind `amber` |
| info | Tailwind `sky` |

See [tailwind4-integration.md](tailwind4-integration.md) for the complete hex value table.

---

### 2. Extend `generateBrandCSS()` to Emit All 7 Color Scales

**File:** `src/brands/types.ts`

**Problem:** `generateBrandCSS()` currently only emits:
- `:root` block with `--mieweb-primary-{50..950}` (from `config.colors.primary`)
- Semantic tokens (background, foreground, border, card, muted, etc.)
- Dark mode semantic overrides

It does **NOT** emit `--mieweb-neutral-*`, `--mieweb-secondary-*`, `--mieweb-destructive-*`, `--mieweb-success-*`, `--mieweb-warning-*`, or `--mieweb-info-*` scales. So when a consumer's `@theme` block references `var(--mieweb-neutral-900)`, it resolves to transparent.

**Fix:** Update `generateBrandCSS()` to iterate over ALL color scales in the brand config and emit variables for each:

```typescript
function generateBrandCSS(config: BrandConfig): string {
  let css = ':root {\n';

  // Emit all color scales (primary, secondary, neutral, etc.)
  for (const [scaleName, scale] of Object.entries(config.colors)) {
    if (typeof scale === 'object' && '500' in scale) {
      for (const [step, hex] of Object.entries(scale)) {
        css += `  --mieweb-${scaleName}-${step}: ${hex};\n`;
      }
    }
  }

  // Emit semantic tokens...
  // (existing logic for background, foreground, border, etc.)

  css += '}\n';
  return css;
}
```

This is **backwards compatible** — existing brand configs that only define `primary` will only emit primary variables. Brands that add secondary/neutral/etc. get those emitted automatically.

---

## P1: Important — Developer Experience

### 3. Ship a `setup.css` Snippet

**Proposal:** Export a documented CSS file that consumers can import to get the critical Tailwind 4 directives:

```css
/* Add to your CSS entry point */
@source "../node_modules/@mieweb/ui/dist";
@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));
```

**Why:** Every consumer MUST add these two lines to their CSS. Currently they have to discover this through trial and error. These cannot be shipped as an importable CSS file because `@source` uses a relative path that must resolve from the consumer's project root, not from inside `node_modules`. Document the snippet prominently in the README so consumers can copy-paste it.

> See `src/styles/setup.css` for a reference snippet with full explanatory comments.

---

### 4. Consolidate Duplicate Dark-Mode Blocks

**File:** `src/styles/base.css` and brand CSS files

**Problem:** Dark mode CSS variables are currently defined in three separate places:
1. `@theme` block in `base.css` (via `[data-theme='dark']`)
2. `.dark` class selector in `base.css`
3. Brand-specific dark mode blocks in each brand CSS file

These can drift out of sync. The `base.css` file defines neutral/secondary scales in the dark block, but the brand CSS files define different semantic overrides.

**Fix:** Consolidate to a single dark-mode source. Recommended approach:

```css
/* One combined selector */
[data-theme='dark'],
.dark {
  /* ALL dark mode overrides here */
  --mieweb-background: #171717;
  --mieweb-foreground: #fafafa;
  /* ... */
}
```

Brand CSS files should ONLY override brand-specific values (like `--mieweb-primary-*` dark adjustments), not re-declare the full semantic token set.

---

## P2: Nice-to-Have — Completeness

### 5. Add Optional Full Scales to `BrandConfig` Type

**File:** `src/brands/types.ts`

**Current `BrandColors` type:**

```typescript
interface BrandColors {
  primary: ColorScale;
  light: SemanticColors;
  dark: SemanticColors;
}
```

**Proposed:**

```typescript
interface BrandColors {
  primary: ColorScale;
  secondary?: ColorScale;
  neutral?: ColorScale;
  destructive?: ColorScale;
  success?: ColorScale;
  warning?: ColorScale;
  info?: ColorScale;
  light: SemanticColors;
  dark: SemanticColors;
}
```

This lets brands optionally customize any color scale. Combined with change #2 (`generateBrandCSS()` emitting all scales), a brand config like:

```typescript
const myBrand: BrandConfig = {
  colors: {
    primary: { 50: '#...', /* ... */ 950: '#...' },
    neutral: { 50: '#...', /* ... */ 950: '#...' }, // Optional override
    light: { /* semantic */ },
    dark: { /* semantic */ },
  },
  // ...
};
```

...would automatically emit both `--mieweb-primary-*` AND `--mieweb-neutral-*` variables in the generated CSS.

---

### 6. Deprecate Safelist for Tailwind 4 Users

**File:** `src/tailwind-preset.ts`

**Problem:** `miewebUIPreset` contains 200+ safelist entries:

```typescript
safelist: [
  'bg-primary', 'bg-primary-50', 'bg-primary-100', /* ... 200+ more */
]
```

In Tailwind 4, the `@source` directive handles class discovery from `node_modules`. The safelist is a Tailwind 3 workaround that:
- Bloats the CSS output (generates classes whether they're used or not)
- Creates a maintenance burden (new classes need manual addition)
- Trains consumers to rely on it instead of setting up `@source`

**Recommendation:**
1. Add a comment noting the safelist is for Tailwind 3 compatibility only
2. Document `@source` as the preferred approach in the README
3. Consider shipping separate presets: `miewebUIPreset` (with safelist, Tailwind 3) and `miewebUIPresetV4` (without safelist, Tailwind 4)

---

## P3: Future Enhancement

### 7. Ship a Quick-Start `init.css`

**Concept:** A single CSS file a consumer can import to get a complete working baseline:

```css
/* Consumer's styles.css */
@import '@mieweb/ui/init.css';  /* One import = everything works */

/* Their own styles below */
```

The `init.css` would include:
- Default brand CSS (bluehive)
- `@source` directive
- `@custom-variant dark`
- `@theme inline` with all color mappings and fallbacks
- Base body styles

This eliminates the "100+ lines of CSS config" setup burden. Advanced consumers can still do manual setup for full control.

**Trade-off:** The `@source` relative path may not resolve correctly inside an npm package. This may need to be a documented snippet rather than an importable file, depending on how Tailwind 4 resolves `@source` paths.

---

## Implementation Approach

These changes are designed to be **backwards compatible**. Existing consumers won't break because:

1. **Fallback values** — Adding `var(--token, #hex)` only affects cases where the variable is currently undefined (transparent). Defined variables still win.
2. **Optional `BrandConfig` fields** — New fields are optional; existing configs remain valid.
3. **`generateBrandCSS()` changes** — Only emit new variables when the config contains new scales. Existing configs produce the same output.
4. **Safelist deprecation** — The safelist stays; it's just documented as optional for Tailwind 4 users.

### Suggested Issue/PR Breakdown

1. **PR: CSS fallbacks + generateBrandCSS scales** (P0 — changes #1 and #2 together)
2. **PR: Dark mode consolidation** (P1 — change #4)
3. **PR: BrandConfig type expansion** (P2 — change #5)
4. **PR: Documentation update** — README setup guide, `@source` instructions, Tailwind 4 migration notes (P1 — changes #3 and #6)
5. **Issue: Investigate `init.css` feasibility** (P3 — change #7)
