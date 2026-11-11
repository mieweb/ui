# Evals — Styling, tokens, brands, dark mode

Primary agent: **MIE UI Styling Agent**. See [README.md](./README.md) for
format and scoring. (Pure foundation/setup breakage lives in
[install.md](./install.md); contrast questions live in [a11y.md](./a11y.md).)

### STY-1 — Hardcoded colors

- **Ask:** "Can I use `bg-blue-500` or `text-[#1a73e8]` in my component?"
- **Expect:** Never hardcode colors — use semantic tokens (`bg-primary-600`,
  `text-muted-foreground`, `border-border`) so multi-brand theming works.
- **Agent:** MIE UI Styling Agent
- **Source:** mieweb-ui.instructions.md — Rule 6

### STY-2 — Chart colors

- **Ask:** "What colors do I use for a custom chart?"
- **Expect:** The chart tokens `var(--mieweb-chart-1)` through
  `var(--mieweb-chart-5)` — they re-theme per brand and adjust in dark mode.
- **Agent:** MIE UI Styling Agent
- **Source:** mieweb-ui.instructions.md — Rule 6; agent/skills/mieweb-ui-tokens/SKILL.md

### STY-3 — Dark sidebar stays white

- **Ask:** "Dark mode toggles and `dark:` rules generate, but the sidebar
  stays white. Why?"
- **Expect:** Check whether the active brand defines the resolved variable —
  brands emit only the scales they supply (some, like CCME, include a full
  neutral scale). If the variable is genuinely undefined, `var()` without a
  fallback resolves transparent: add hex fallbacks in `@theme`
  (`var(--mieweb-neutral-900, #171717)`) or load the base stylesheet.
- **Agent:** MIE UI Styling Agent
- **Source:** lessons/tailwind4-integration.md — Lesson 4; src/brands/ccme.css; src/brands/types.ts — `generateBrandCSS`

### STY-4 — dark: utilities not applying

- **Ask:** "My toggle sets a `.dark` class but `dark:` utilities don't apply
  in Tailwind 4."
- **Expect:** Define `@custom-variant dark` in the CSS entry and make the
  toggle set a hook the active variant actually matches — an attribute-only
  variant ignores a class-only toggle. Setting both `.dark` and
  `data-theme="dark"` is the compatibility-safe recommendation.
- **Agent:** MIE UI Styling Agent
- **Source:** lessons/tailwind4-integration.md — Lesson 5; agent/skills/mieweb-ui-tailwind4/SKILL.md — Dark mode toggle

### STY-5 — Brand import path

- **Ask:** "Is `import { bluehiveBrand } from '@mieweb/ui/brands/bluehive'`
  the right way to load a brand?"
- **Expect:** Use the barrel: `import { generateBrandCSS, brands } from
'@mieweb/ui/brands'` then `const config = await brands['bluehive']()` —
  code-splits and avoids CSS-vs-JS subpath confusion.
- **Agent:** MIE UI Styling Agent
- **Source:** lessons/tailwind4-integration.md — Lesson 3

### STY-6 — Brand without base stylesheet

- **Ask:** "My brand CSS is applied but `neutral-900` (and other scales) don't
  work. Why?"
- **Expect:** `generateBrandCSS()` emits every scale the brand **supplies**
  (primary + any optional scales) — scales the brand omits must come from the
  base stylesheet. Load `@mieweb/ui/styles.css` (or the init.css setup) first,
  then check whether the brand actually defines the missing scale.
- **Agent:** MIE UI Styling Agent
- **Source:** src/brands/types.ts — `generateBrandCSS`; agent/skills/mieweb-ui-brands/SKILL.md

### STY-7 — Layering brand CSS

- **Ask:** "Should I import the brand CSS with `layer(theme)` to keep things
  tidy?"
- **Expect:** No — keep both the base stylesheet and brand CSS plain
  (unlayered), in that order. Layering only the brand lets unlayered base
  declarations beat it and the brand silently won't apply.
- **Agent:** MIE UI Styling Agent
- **Source:** agent/skills/mieweb-ui-brands/SKILL.md — Applying a brand

### STY-8 — Global element overrides

- **Ask:** "Can I add a global `button { … }` rule to tweak all buttons?"
- **Expect:** No — theme through the brand system; no global resets or
  element-selector overrides. Styles stay component-scoped.
- **Agent:** MIE UI Styling Agent
- **Source:** mieweb-ui.instructions.md — Rule 7

### STY-9 — Dark mode verification

- **Ask:** "I toggled dark mode. What do I check to call it working?"
- **Expect:** Backgrounds invert on all surfaces, text flips dark→light,
  cards distinct from page, input borders visible, dropdowns/modals dark,
  badges legible, chart tokens adjust, focus ring visible, muted text
  readable.
- **Agent:** MIE UI Styling Agent
- **Source:** lessons/adopting-mieweb-ui.md — Phase 3.2

### STY-10 — Fallback palette

- **Ask:** "What fallback hex values do the six non-primary scales use?"
- **Expect:** Tailwind defaults — neutral (gray), secondary (indigo),
  destructive (red), success (green), warning (amber), info (sky), e.g.
  neutral `#fafafa`–`#0a0a0a`.
- **Agent:** MIE UI Styling Agent
- **Source:** lessons/tailwind4-integration.md — Fallback palette values

### STY-11 — Theme/brand hooks

- **Ask:** "Do I need `useTheme` and `useBrand`, or is CSS enough?"
- **Expect:** Depends on what's dynamic: a static brand stylesheet import
  needs no `useBrand` (that hook is for runtime brand switching), and dark
  mode needs any toggle that sets a hook the active variant matches —
  `useTheme` is the provided convenience, not a requirement. CSS alone is a
  supported setup when nothing switches at runtime.
- **Agent:** MIE UI Styling Agent
- **Source:** agent/skills/mieweb-ui-brands/SKILL.md — static vs runtime; agent/skills/mieweb-ui-tailwind4/SKILL.md — Dark mode toggle

### STY-12 — CSS theme audit

- **Ask:** "Before I claim dark mode works in our Tailwind 4 + PostCSS app,
  what should I audit in the CSS setup?"
- **Expect:** `@source` present, `@custom-variant dark` defined, every
  `var()` in `@theme` has a fallback (except primary), `@tailwindcss/postcss`
  plugin in use, toggle sets a hook the active dark variant matches.
- **Agent:** MIE UI Styling Agent
- **Source:** lessons/adopting-mieweb-ui.md — Phase 1.5; agent/skills/mieweb-ui-tailwind4/SKILL.md — Dark mode toggle

### STY-13 — Theme transition stomps utilities

- **Ask:** "After adding brand CSS, my `transition-transform` animations
  stopped working — everything transitions colors instead."
- **Expect:** The brand CSS's unlayered `*` transition shorthand resets
  `transition-property` on every element and beats Tailwind's layered
  `transition-*` utilities (open #460/#682) — even though it lists only color
  properties. Fix by layering: move the transition rule into `@layer base`
  (or remove/narrow it) so component transitions win; keep brand token
  declarations unlayered.
- **Agent:** MIE UI Styling Agent
- **Source:** issues #460, #682 (open); src/brands/bluehive.css — Smooth Theme Transitions; agent/skills/mieweb-ui-tailwind4/SKILL.md — troubleshooting

### STY-14 — TW3 preset token gaps

- **Ask:** "I'm on Tailwind 3 with `miewebUIPreset` and `info`/chart classes
  emit nothing."
- **Expect:** Verify the TW3 trio (preset + `miewebUISafelist` +
  `node_modules` content glob), then inspect the **resolved published
  preset** in the app's `node_modules` (the dist CJS is compiled from
  `tailwind-preset.ts` and includes `info` + `chart`). Published consumers
  are unaffected by #628 — that drift is the repo's hand-maintained
  `src/tailwind-preset.cjs`, an in-repo/Storybook concern only.
- **Agent:** MIE UI Styling Agent
- **Source:** agent/skills/mieweb-ui-tailwind4/SKILL.md — TW3 row; issue #628 (open, in-repo scope)

### STY-15 — TW3 safelist

- **Ask:** "On Tailwind 3, classes used only inside @mieweb/ui components get
  purged. What's the supported fix?"
- **Expect:** Add `miewebUISafelist` to the TW3 config (the TW3 counterpart
  of TW4's `@source`); don't hand-maintain a custom safelist.
- **Agent:** MIE UI Styling Agent
- **Source:** agent/skills/mieweb-ui-tokens/SKILL.md; agent/skills/mieweb-ui-tailwind4/SKILL.md

### STY-16 — Three CSS foundation modes

- **Ask:** "We can't adopt Tailwind. Can we still use @mieweb/ui styling?"
- **Expect:** Yes — three supported modes: TW4 (`@source`), TW3
  (`miewebUIPreset` + safelist), or precompiled (`import
'@mieweb/ui/styles.css'` + brand CSS; `init.css` is Tailwind input, not a
  precompiled option). For precompiled apps, never prescribe Tailwind
  tooling; tokens still work via CSS variables.
- **Agent:** MIE UI Styling Agent
- **Source:** agent/skills/mieweb-ui-tailwind4/SKILL.md — supported modes; src/styles/init.css usage header

### STY-17 — Enter animations do nothing

- **Ask:** "`animate-in` / `slide-in-from-*` classes are on the element but
  nothing animates."
- **Expect:** Those are `tailwindcss-animate` plugin utilities — no
  foundation setup (`@source`, preset, or base stylesheet) can emit them if
  the plugin isn't configured (#469). Identify the unsupported utility names,
  then switch to an animation the library actually emits, the motion layer,
  or explicitly configure a compatible animation plugin.
- **Agent:** MIE UI Styling Agent
- **Source:** issue #469 (open)

### STY-18 — content array in TW4

- **Ask:** "Do I still need the `content` array in `tailwind.config` on
  Tailwind 4?"
- **Expect:** It's largely redundant (TW4 auto-detects content) but harmless;
  the `@source` directive in CSS is what reliably picks up classes from
  `node_modules`.
- **Agent:** MIE UI Styling Agent
- **Source:** lessons/tailwind4-integration.md — Tailwind Config

### STY-19 — Runtime brand switching

- **Ask:** "How do I switch brands at runtime without a rebuild?"
- **Expect:** `useBrand` + the brands barrel: dynamically import the brand
  config (`await brands[name]()`), generate CSS with `generateBrandCSS`, and
  inject it; the base stylesheet stays loaded underneath.
- **Agent:** MIE UI Styling Agent
- **Source:** lessons/adopting-mieweb-ui.md — Phase 2.3; agent/skills/mieweb-ui-brands/SKILL.md

### STY-20 — Safelist on TW4

- **Ask:** "Should I port my Tailwind 3 safelist entries to the Tailwind 4
  config?"
- **Expect:** No — on TW4 use `@source`; safelist is the TW3 workaround and
  on TW4 it just bloats CSS and adds maintenance burden.
- **Agent:** MIE UI Styling Agent
- **Source:** lessons/migration-meteor-blaze-to-react.md — Lesson 4

### STY-21 — Dark mode signals

- **Ask:** "Is setting `data-theme="dark"` alone enough for dark mode?"
- **Expect:** It depends on the active `@custom-variant dark`: `init.css` and
  the manual attribute-based variant both accept `data-theme="dark"` alone,
  so a single-hook toggle is a supported setup. Grade by whether the toggle
  matches the configured selector; setting both `.dark` and `data-theme` is
  the compatibility-safe recommendation for new code, not a requirement.
- **Agent:** MIE UI Styling Agent
- **Source:** agent/skills/mieweb-ui-tailwind4/SKILL.md — Dark mode toggle
