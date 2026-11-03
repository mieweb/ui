# Evals — Install, CSS foundation, wiring

Primary agent: **MIE UI Install Agent**. See [README.md](./README.md) for
format and scoring.

### INS-1 — Required dependencies

- **Ask:** "What do I install to use @mieweb/ui in a React app?"
- **Expect:** `@mieweb/ui react react-dom`, plus dev deps `tailwindcss@4
@tailwindcss/postcss autoprefixer` for the Tailwind 4 path.
- **Agent:** MIE UI Install Agent
- **Source:** lessons/adopting-mieweb-ui.md — Phase 1.1

### INS-2 — Minimum CSS entry

- **Ask:** "What's the minimum CSS entry point, and does order matter?"
- **Expect:** Five pieces, in order: brand CSS import, `@import
'tailwindcss'`, `@source` for `node_modules/@mieweb/ui/dist`,
  `@custom-variant dark`, and `@theme` with color scales + fallbacks.
- **Agent:** MIE UI Install Agent
- **Source:** lessons/tailwind4-integration.md — Complete CSS Setup

### INS-3 — Quick start

- **Ask:** "Is there a one-import setup?"
- **Expect:** Yes — `@import '@mieweb/ui/init.css'` (Option A) gives
  everything; the manual five-piece entry (Option B) is for full control.
- **Agent:** MIE UI Install Agent
- **Source:** lessons/adopting-mieweb-ui.md — Phase 2.1

### INS-4 — PostCSS config

- **Ask:** "My CSS doesn't process — I have the `tailwindcss` plugin in
  `postcss.config.cjs`."
- **Expect:** That's the Tailwind 3 plugin; on TW4 use
  `{'@tailwindcss/postcss': {}, autoprefixer: {}}`. The old plugin silently
  fails or produces wrong output.
- **Agent:** MIE UI Install Agent
- **Source:** lessons/tailwind4-integration.md — Lesson 2

### INS-5 — Unstyled after install

- **Ask:** "Fresh install — components render but have black borders and no
  backgrounds."
- **Expect:** Tailwind 4 tree-shakes `node_modules` by default; add
  `@source "../node_modules/@mieweb/ui/dist"` to the CSS entry.
- **Agent:** MIE UI Install Agent
- **Source:** lessons/tailwind4-integration.md — Lesson 1

### INS-6 — @source vs safelist

- **Ask:** "`@source` or safelist — which do I use?"
- **Expect:** Depends on mode: TW4 → `@source`; TW3 → `miewebUIPreset` +
  `miewebUISafelist`. Never a safelist on TW4.
- **Agent:** MIE UI Install Agent
- **Source:** agent/skills/mieweb-ui-tailwind4/SKILL.md; lessons/migration-meteor-blaze-to-react.md — Lesson 4

### INS-7 — Verifying the setup

- **Ask:** "How do I verify the install actually works?"
- **Expect:** Render a probe (`className="bg-primary-500 text-white p-4"`),
  check the dark-mode toggle, check brand switching, and run
  `npx tsc --noEmit`.
- **Agent:** MIE UI Install Agent
- **Source:** lessons/adopting-mieweb-ui.md — Phases 2.1, 3.1

### INS-8 — Peer dependency model

- **Ask:** "`pnpm install` warns about unmet peers like `leaflet` and
  `three`. Do I need them all?"
- **Expect:** No — `react`/`react-dom` (≥18) are the required peers; heavy
  integrations are optional peers needed only for the entry points you use
  (e.g. maps → `leaflet`, globe → `three`/`react-globe.gl`, kerebron →
  `@kerebron/*`). The catalog skill lists which entry needs which peer.
- **Agent:** MIE UI Install Agent
- **Source:** agent/skills/mieweb-ui-tailwind4/SKILL.md — peer-dep model; agent/skills/mieweb-ui-catalog/SKILL.md — entry points

### INS-9 — React 19

- **Ask:** "Does @mieweb/ui work with React 19?"
- **Expect:** Yes — the peer range is `react >= 18`.
- **Agent:** MIE UI Install Agent
- **Source:** package.json — peerDependencies

### INS-10 — Meteor migration order

- **Ask:** "What order do I migrate a Meteor 2 Blaze app to Meteor 3 + React +
  @mieweb/ui?"
- **Expect:** Scaffold (`meteor create --typescript --react`) → npm deps →
  CSS entry + PostCSS + Tailwind config → verify Tailwind → `useTheme`/
  `useBrand` → layout shell → migrate features → verify dark mode, brand,
  TypeScript.
- **Agent:** MIE UI Install Agent
- **Source:** lessons/migration-meteor-blaze-to-react.md — Migration Order

### INS-11 — Preset-only usage

- **Ask:** "Can I use @mieweb/ui as just a Tailwind preset without the React
  components?"
- **Expect:** It's a React component library — `miewebUIPreset` is one export
  (the TW3 token path), not a standalone product; install the library for
  components.
- **Agent:** MIE UI Install Agent
- **Source:** lessons/adopting-mieweb-ui.md — Phase 1.1

### INS-12 — Raw-HTML audit

- **Ask:** "How do I find everything that needs replacing in my app?"
- **Expect:** Grep `src/` for `<button`, `<input`, `<select`, `<table`,
  `<textarea` (`--include='*.tsx' --include='*.jsx'`) and count violations per
  category against @mieweb/ui usage.
- **Agent:** MIE UI Install Agent
- **Source:** lessons/adopting-mieweb-ui.md — Phases 1.2, 1.4

### INS-13 — Phased replacement order

- **Ask:** "Replace everything at once, or in phases?"
- **Expect:** Phases, highest impact first: layout shell → buttons → form
  elements → cards & modals → tables → feedback → navigation → specialized.
  This verifies theming early.
- **Agent:** MIE UI Install Agent
- **Source:** lessons/adopting-mieweb-ui.md — Phase 2.4

### INS-14 — Installing from git source

- **Ask:** "`npm install github:mieweb/ui` fails on `link:` dependencies.
  How do I install?"
- **Expect:** Install the published `@mieweb/ui` package from the npm
  registry — source installs require the pnpm workspace + submodules and are
  not an npm-consumer path.
- **Agent:** MIE UI Install Agent
- **Source:** issue #489

### INS-15 — Package manager

- **Ask:** "npm or pnpm for working in the mieweb/ui repo itself?"
- **Expect:** pnpm — the repo is a pnpm workspace and the docs standardize on
  pnpm commands. (Consumers of the published package can use any manager.)
- **Agent:** MIE UI Install Agent
- **Source:** issue #500; README.md

### INS-16 — Grid entry point

- **Ask:** "Which entry point do I import a data grid from?"
- **Expect:** `DataVisNitroGrid` from `@mieweb/ui/datavis`; never
  `@mieweb/ui/ag-grid` (deprecated).
- **Agent:** MIE UI Install Agent
- **Source:** mieweb-ui.instructions.md — Rules 1, 12

### INS-17 — Wiring headless modules

- **Ask:** "How do I connect `ViewSet` (or SuperChat-style modules) to my app
  data?"
- **Expect:** Write an adapter in the app: fetch/subscribe there, pass
  `items`/`loading`/`error` down, implement `on*` callbacks (return the
  promise for built-in optimistic UI + revert), pass `onOpen` + `getHref`.
- **Agent:** MIE UI Install Agent
- **Source:** lessons/wiring-headless-modules.md

### INS-18 — Dark-mode plumbing

- **Ask:** "What plumbing does dark mode need after install?"
- **Expect:** `useTheme` wired so the toggle sets both the `.dark` class and
  `data-theme`, plus the `@custom-variant dark` in the CSS entry; without
  either half, `dark:` utilities don't fire.
- **Agent:** MIE UI Install Agent
- **Source:** lessons/tailwind4-integration.md — Lesson 5; lessons/adopting-mieweb-ui.md — Phase 2.3

### INS-19 — Brand loads but looks broken

- **Ask:** "I load only the brand CSS and most components look unstyled."
- **Expect:** Brand CSS is a delta (primary + semantic tokens), not a full
  foundation — the base stylesheet (`styles.css`/`init.css`) must load first.
- **Agent:** MIE UI Install Agent
- **Source:** agent/skills/mieweb-ui-brands/SKILL.md; lessons/recommended-changes.md — P0 Issue 2

### INS-20 — Common install traps

- **Ask:** "What are the usual reasons a fresh @mieweb/ui setup looks
  broken?"
- **Expect:** Missing `@source` (tree-shaken classes), missing
  `@custom-variant dark`, missing `var()` fallbacks (transparent renders),
  wrong PostCSS plugin (TW3 plugin on TW4), wrong brand import path, missing
  base stylesheet.
- **Agent:** MIE UI Install Agent
- **Source:** lessons/adopting-mieweb-ui.md — Common Traps; lessons/tailwind4-integration.md
