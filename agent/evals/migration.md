# Evals — Migration / compliance (incl. icon compliance)

Primary agent: **MIE UI Migration Agent**. See [README.md](./README.md) for
format and scoring. MIG-1 through MIG-5 are the icon-compliance cases
(#587 requires them here).

### MIG-1 — Foreign icon libraries

- **Ask:** "Can I add Font Awesome / Material Icons / Heroicons for a few
  missing icons?"
- **Expect:** No — every icon comes from `lucide-react`: the `*Icon` aliases
  re-exported from `@mieweb/ui` (188 icons) or direct `lucide-react` imports.
  `@fortawesome/*` is ESLint-blocked; mixed sets break consistency.
- **Agent:** MIE UI Migration Agent
- **Source:** mieweb-ui.instructions.md — Rule 17; agent/skills/mieweb-ui-icons/SKILL.md

### MIG-2 — Icon-only control labeling

- **Ask:** "Audit finding: icon-only buttons using lucide icons. What's
  required?"
- **Expect:** `aria-label` on every icon-only control; decorative icons get
  `aria-hidden="true"`.
- **Agent:** MIE UI Migration Agent
- **Source:** agent/skills/mieweb-ui-icons/SKILL.md — Conventions; Rules 2, 9

### MIG-3 — Root-barrel icon shadows

- **Ask:** "I imported `CloseIcon`/`RefreshIcon`/`SendIcon`/`SparklesIcon`
  from `@mieweb/ui` and `size={16}` doesn't work."
- **Expect:** Those root-barrel names are shadowed by custom AI components,
  not Lucide re-exports — Lucide props don't apply. Import the Lucide
  originals (`X`, `RefreshCw`, `Send`, `Sparkles`) from `lucide-react`.
- **Agent:** MIE UI Migration Agent
- **Source:** agent/skills/mieweb-ui-icons/SKILL.md — Root-barrel overrides (⚠)

### MIG-4 — Hand-rolled SVG

- **Ask:** "The icon I need isn't in the alias list. Hand-roll the SVG?"
- **Expect:** No — the full lucide-react set (1000+ icons) is available by
  direct import; never hand-roll `<svg>` icons.
- **Agent:** MIE UI Migration Agent
- **Source:** mieweb-ui.instructions.md — Rule 17

### MIG-5 — Icon sizing

- **Ask:** "What size do inline icons get?"
- **Expect:** `h-4 w-4` (16px) default; `h-5 w-5` for emphasis; `h-3.5 w-3.5`
  in dense UI; Lucide's `size={16}` is equivalent. Dynamic icon props are
  typed `LucideIcon` (re-exported from `@mieweb/ui`).
- **Agent:** MIE UI Migration Agent
- **Source:** agent/skills/mieweb-ui-icons/SKILL.md — Conventions; Rule 17

### MIG-6 — AGGrid in the app

- **Ask:** "We still use AGGrid. Keep it?"
- **Expect:** No — AGGrid is deprecated and deprecations are law; migrate to
  `DataVisNitroGrid` from `@mieweb/ui/datavis`; never `@mieweb/ui/ag-grid` in
  new code.
- **Agent:** MIE UI Migration Agent
- **Source:** mieweb-ui.instructions.md — Rules 1, 13

### MIG-7 — Hand-rolled grid features

- **Ask:** "Can I add sorting/paging on a plain `Table` myself?"
- **Expect:** No — grid features start with DataVis NITRO; never hand-roll
  them on a plain table or bring a third-party grid.
- **Agent:** MIE UI Migration Agent
- **Source:** mieweb-ui.instructions.md — Rule 1

### MIG-8 — Patterns, not just imports

- **Ask:** "We import @mieweb/ui everywhere. Are we compliant?"
- **Expect:** Not necessarily — compliance is patterns, not imports: badge
  spans, card divs, modal divs, raw buttons, and inline SVGs are violations
  even in files that import @mieweb/ui.
- **Agent:** MIE UI Migration Agent
- **Source:** agent/agents/mieweb-ui-migration.agent.md — prime directive; lessons/adopting-mieweb-ui.md — Phase 1.3

### MIG-9 — Raw HTML hard rule

- **Ask:** "Can a migrated app keep a few raw `<button>`s in low-traffic
  pages?"
- **Expect:** No — never raw HTML for UI; `Button`, `Input`, `Card`, `Modal`,
  `Badge`, `Select`, `Table` etc. everywhere, for consistent theming, dark
  mode, and accessibility.
- **Agent:** MIE UI Migration Agent
- **Source:** lessons/migration-meteor-blaze-to-react.md — Lesson 7; Rule 3

### MIG-10 — Dynamic attribute greps

- **Ask:** "I grepped `type=\"date\"` and found nothing. Am I clean?"
- **Expect:** No — also grep dynamic forms: `type={cond ? 'date' : 'text'}`
  and other `type={…}` expressions evade literal greps.
- **Agent:** MIE UI Migration Agent
- **Source:** agent/agents/mieweb-ui-migration.agent.md — audit workflow

### MIG-11 — Meteor 3 async APIs

- **Ask:** "After the Meteor 3 upgrade, `Meteor.userId()` throws in a
  method."
- **Expect:** Meteor 3 server APIs are async — make methods async, `await
Meteor.userId()`/`Meteor.user()`, and use `*Async()` collection variants
  (`fetchAsync`, `insertAsync`, `updateAsync`, `removeAsync`).
- **Agent:** MIE UI Migration Agent
- **Source:** lessons/migration-meteor-blaze-to-react.md — Lesson 6

### MIG-12 — Completion checklist

- **Ask:** "How do I verify the migration is done?"
- **Expect:** Final compliance checklist: CSS foundation correct **for the
  app's mode** (TW4: `@source` + `@custom-variant` + fallbacks; TW3: preset +
  safelist + content glob; precompiled: `styles.css` imported), zero raw HTML,
  theming works (dark mode + brands), accessibility (ARIA, keyboard), clean
  build (`npx tsc --noEmit`, no console errors).
- **Agent:** MIE UI Migration Agent
- **Source:** lessons/adopting-mieweb-ui.md — Phase 4; agent/skills/mieweb-ui-tailwind4/SKILL.md — supported modes

### MIG-13 — @source vs safelist in audits

- **Ask:** "The audited app uses a Tailwind 3 safelist on Tailwind 4. Flag
  it?"
- **Expect:** Yes — on TW4 the supported mechanism is `@source`; a safelist
  there is a migration leftover that bloats CSS.
- **Agent:** MIE UI Migration Agent
- **Source:** lessons/recommended-changes.md — P2 Issue 6; lessons/tailwind4-integration.md — Lesson 1

### MIG-14 — Mode-aware CSS prescriptions

- **Ask:** "The audited app ships precompiled CSS and no Tailwind. Do we
  prescribe `@source`?"
- **Expect:** No — the CSS-foundation check is mode-aware (TW4 / TW3 preset /
  precompiled); never prescribe Tailwind tooling to a precompiled app.
- **Agent:** MIE UI Migration Agent
- **Source:** agent/agents/mieweb-ui-migration.agent.md; agent/skills/mieweb-ui-tailwind4/SKILL.md — supported modes

### MIG-15 — Optimistic mutations in adapters

- **Ask:** "Migrating to `ViewSet` — add my own optimistic state for
  mutations?"
- **Expect:** No — return the promise from `on*` callbacks; the view shows
  the pending position and reverts on rejection. Optimistic UI + recovery
  come free.
- **Agent:** MIE UI Migration Agent
- **Source:** lessons/wiring-headless-modules.md — The shape

### MIG-16 — Common migration traps

- **Ask:** "What traps should a migration audit check first?"
- **Expect:** Tailwind tree-shaking (`@source`), missing `@custom-variant
dark`, missing var fallbacks (transparent renders), wrong PostCSS plugin,
  wrong brand import path, Meteor sync→async, raw HTML patterns, subpath
  instead of barrel brand imports.
- **Agent:** MIE UI Migration Agent
- **Source:** lessons/adopting-mieweb-ui.md — Common Traps; lessons/migration-meteor-blaze-to-react.md — Common Traps

### MIG-17 — Verifying component APIs

- **Ask:** "The catalog lists `Modal`. Can I infer its props from the catalog
  entry?"
- **Expect:** No — the catalog is inventory, not an API reference. Verify
  props in the Storybook docs or the public types before prescribing usage.
- **Agent:** MIE UI Migration Agent
- **Source:** agent/agents/mieweb-ui-migration.agent.md — Rule 4

### MIG-18 — Behavior-preserving replacements

- **Ask:** "Replacing `window.confirm` with `AlertDialog` changes blocking
  behavior. Just do it?"
- **Expect:** Replacements must be behavior-preserving by default; a
  blocking→async change is flagged as a judgment call for the app team, not
  silently applied.
- **Agent:** MIE UI Migration Agent
- **Source:** agent/agents/mieweb-ui-migration.agent.md — Rule 5

### MIG-19 — Nothing in the catalog fits

- **Ask:** "No component covers this need. Write a custom one?"
- **Expect:** Follow Rule 15: check composition of existing components first,
  then propose a gap with a tier recommendation (contribution vs app-local);
  don't silently fork or restyle an existing component.
- **Agent:** MIE UI Migration Agent
- **Source:** mieweb-ui.instructions.md — Rule 15; agent/agents/mieweb-ui-migration.agent.md — gap detection

### MIG-20 — Destructive confirms

- **Ask:** "The app confirms deletes with `window.confirm`. What's the
  target?"
- **Expect:** `AlertDialog` (destructive yes/no), noting the sync→async
  behavior change as a judgment call (see MIG-18).
- **Agent:** MIE UI Migration Agent
- **Source:** agent/skills/mieweb-ui-catalog/selection-guidance.md; agent/agents/mieweb-ui-migration.agent.md

### MIG-21 — Audit mechanics

- **Ask:** "What does a full compliance audit actually grep for?"
- **Expect:** Raw elements (`<button`, `<input`, `<select`, `<table`,
  `<textarea`, incl. dynamic `type={…}`), pattern duplicates (badge spans,
  card divs, modal divs, inline `<svg>`), foreign icon imports, then the
  mode-aware CSS foundation check — reported as a prioritized plan, not a
  dump.
- **Agent:** MIE UI Migration Agent
- **Source:** agent/agents/mieweb-ui-migration.agent.md — audit workflow; lessons/adopting-mieweb-ui.md — Phases 1.2–1.4
