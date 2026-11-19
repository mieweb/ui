# Evals — Component selection / catalog

Primary agent: **MIE UI Design Agent** (owns selection via the
`mieweb-ui-catalog` skill and its selection guidance, marketing/landing
pages via the `mieweb-ui-templates` skill, and clinical components via the
`mieweb-ui-clinical` skill). See
[README.md](./README.md) for format and scoring.

### SEL-1 — Table or NITRO

- **Ask:** "Should I use `Table` or DataVis NITRO for a data grid?"
- **Expect:** Start with `DataVisNitroGrid` from `@mieweb/ui/datavis` for
  anything with sorting, filtering, paging, or export; `Table` only for static
  rows; AGGrid is deprecated — never in new code.
- **Agent:** MIE UI Design Agent
- **Source:** mieweb-ui.instructions.md — Rule 1

### SEL-2 — Two adjacent buttons

- **Ask:** "I have two buttons side by side. Do I need `ButtonGroup`?"
- **Expect:** Yes — always wrap two or more adjacent buttons in `ButtonGroup`;
  also wrap a single button with a long/unpredictable label (translated text,
  user data), using `orientation="auto"`.
- **Agent:** MIE UI Design Agent
- **Source:** mieweb-ui.instructions.md — Rule 2

### SEL-3 — Raw table replacement

- **Ask:** "What @mieweb/ui component replaces a raw `<table>`?"
- **Expect:** `Table` + `TableHeader`/`TableBody`/`TableRow`/`TableCell` for
  static data; `DataVisNitroGrid` once interactivity is needed; never
  hand-roll grid features.
- **Agent:** MIE UI Design Agent
- **Source:** mieweb-ui.instructions.md — Rules 1, 3

### SEL-4 — Raw button

- **Ask:** "Can I keep a raw `<button>` element, or do I need `Button`?"
- **Expect:** Every interactive element uses @mieweb/ui components — replace
  `<button>` with `Button` (and `<input>` with `Input`/`Checkbox`/`Radio`,
  etc.) for consistent theming, dark mode, and accessibility.
- **Agent:** MIE UI Design Agent
- **Source:** mieweb-ui.instructions.md — Rule 3

### SEL-5 — Modal internals

- **Ask:** "I'm building a Modal with a title, content, and footer. Divs, or
  something else?"
- **Expect:** Use composition slots — `ModalHeader`/`ModalBody`/`ModalFooter`,
  not bespoke divs; same pattern for `Card` and `Table` slots.
- **Agent:** MIE UI Design Agent
- **Source:** mieweb-ui.instructions.md — Rule 4

### SEL-6 — Badge span

- **Ask:** "Is `<span className=\"badge\">Active</span>` fine if it's styled
  correctly?"
- **Expect:** No — raw HTML that duplicates a component is a violation; use
  `Badge`. This applies to all badge/pill/tag spans.
- **Agent:** MIE UI Design Agent
- **Source:** lessons/adopting-mieweb-ui.md — Phase 1.3

### SEL-7 — Date inputs

- **Ask:** "What do I use for a date picker, and for a date range?"
- **Expect:** `DateInput` for a single date, `DateRangePicker` for a range;
  never raw `<input type="date">`.
- **Agent:** MIE UI Design Agent
- **Source:** lessons/adopting-mieweb-ui.md — Phase 1.3

### SEL-8 — Phone number input

- **Ask:** "I need a phone number field. Raw input with a mask, or a
  component?"
- **Expect:** `PhoneInput` — it handles formatting and validation.
- **Agent:** MIE UI Design Agent
- **Source:** lessons/adopting-mieweb-ui.md — Phase 1.3

### SEL-9 — ViewSet responsibilities

- **Ask:** "Does `ViewSet` fetch data, subscribe to changes, and navigate
  itself?"
- **Expect:** No — it's headless: receives `items`/`loading`/`error` as props,
  returns mutations through `on*` callbacks; never fetches, subscribes, or
  navigates. Pass `onOpen` + `getHref` for real anchors.
- **Agent:** MIE UI Design Agent
- **Source:** mieweb-ui.instructions.md — Rule 14; lessons/wiring-headless-modules.md

### SEL-10 — MediaFeed vs NewsWidget

- **Ask:** "Is `MediaFeed` a drop-in replacement for our standalone news
  widget?"
- **Expect:** No — `MediaFeed` takes items through props and accessor
  functions; the app owns RSS/Discourse adapters, loading, navigation, and
  engagement callbacks. Convert posts to `MediaFeedMedia` with accessors and
  use optional slots for custom rendering.
- **Agent:** MIE UI Design Agent
- **Source:** lessons/news-widget-migration.md

### SEL-11 — Collection component contract

- **Ask:** "I'm adding a component that renders a collection (list, board,
  calendar). What contract must it follow?"
- **Expect:** Headless module: `items`/`loading`/`error` in via props,
  mutations out via `on*` callbacks typed `void | Promise<void>`; no
  fetch/subscribe/navigate inside; generic via accessor props (`getId`,
  `getStatus`, …); strings overridable through `labels`.
- **Agent:** MIE UI Design Agent
- **Source:** mieweb-ui.instructions.md — Rule 14

### SEL-12 — ViewSet navigation

- **Ask:** "How do I wire navigation into `ViewSet` — just `onOpen`?"
- **Expect:** Pass both `onOpen` (client-side routing on left-click) and
  `getHref` (real anchors so middle-click/copy-link work); `onOpen` alone
  degrades links to buttons.
- **Agent:** MIE UI Views Agent (posed to the orchestrator — correct
  behavior is delegation via its views & layout routing row; the
  headless-wiring row that once pointed at the Install Agent moved to the
  SuperChat Agent in #609)
- **Source:** lessons/wiring-headless-modules.md; agent/agents/mieweb-ui-design.agent.md — routing table

### SEL-13 — Danger styling

- **Ask:** "I want a destructive-looking button — `className=\"bg-red-600\"`?"
- **Expect:** No — `variant="danger"`. Variants (`primary`, `secondary`,
  `ghost`, `outline`, `danger`, `link`) and sizes (`sm`, `md`, `lg`, `icon`)
  are props, never className hacks.
- **Agent:** MIE UI Design Agent
- **Source:** mieweb-ui.instructions.md — Rule 5

### SEL-14 — Imitating a variant

- **Ask:** "Can I restyle a component with className tweaks to look like
  another variant instead of using the prop?"
- **Expect:** No — if a component has a prop for it, use the prop; never
  imitate an existing variant via className.
- **Agent:** MIE UI Design Agent
- **Source:** mieweb-ui.instructions.md — Rule 5

### SEL-15 — Where to compare components

- **Ask:** "Where do I check which component to use when several look
  similar?"
- **Expect:** The Storybook family overview pages — every family has a
  comparison ("which one?") table; read it before choosing. (From an agent:
  the catalog skill's selection guidance mirrors these tables.)
- **Agent:** MIE UI Design Agent
- **Source:** lessons/adopting-mieweb-ui.md — Phase 1.3; agent/skills/mieweb-ui-catalog/selection-guidance.md

### SEL-16 — Badge vs CountBadge vs FreshnessBadge

- **Ask:** "I need a status pill in one place, a clickable count pill in
  another, and a pill whose colour depends on age in a third — which badge
  for each?"
- **Expect:** `Badge` for a state/category mapped to a `variant`;
  `CountBadge` when it's a clickable "Label N" pill that opens rows;
  `FreshnessBadge` when the colour depends on a date.
- **Agent:** MIE UI Design Agent
- **Source:** agent/skills/mieweb-ui-catalog/selection-guidance.md — Data display

### SEL-17 — Destructive confirmation

- **Ask:** "What do I use for a 'Delete this record?' confirmation — `Modal`?"
- **Expect:** `AlertDialog` for a single yes/no destructive confirm; `Modal`
  is for richer content.
- **Agent:** MIE UI Design Agent
- **Source:** agent/skills/mieweb-ui-catalog/selection-guidance.md

### SEL-18 — MessageComposer is retired

- **Ask:** "Should new chat UIs use `MessageComposer`?"
- **Expect:** No — `MessageComposer` was retired in 0.10.0, superseded by
  `ChatComposer` (see `MIGRATION.md#chat-composer`); `ChatComposer` is the
  standardized chat input for new work.
- **Agent:** MIE UI Design Agent
- **Source:** agent/skills/mieweb-ui-catalog/selection-guidance.md — Chat; MIGRATION.md

### SEL-19 — Text editing surfaces

- **Ask:** "Plain comment box vs rich notes field vs full document editor —
  which components?"
- **Expect:** `Textarea` when the value must be plain text; `TextAreaRich`
  for a textarea-like HTML surface (toolbar hidden until asked, auto-grow);
  `RichEditor` for a full document — Markdown, links/tables/code, or
  collaboration. `RichTextEditor` (HTML document with an always-on toolbar,
  variables, dictation) is deprecated — no new usages (mieweb/ui#692).
- **Agent:** MIE UI Design Agent
- **Source:** agent/skills/mieweb-ui-catalog/selection-guidance.md — Editors

### SEL-20 — Filter count strip

- **Ask:** "I want '1,204 of 8,911 records — 3 filters active · Clear all'
  above my grid. Build it from spans?"
- **Expect:** `FilterSummaryBar` above a host-filtered `DataVisNITRO`/`Table`;
  removable filter chips are `Badge` with `onRemove`, not a custom strip.
- **Agent:** MIE UI Design Agent
- **Source:** agent/skills/mieweb-ui-catalog/selection-guidance.md — Data display

### SEL-21 — Confirming AI-extracted values

- **Ask:** "A user must confirm AI-extracted values before they overwrite the
  record — form, dialog, or something else?"
- **Expect:** `ReconciliationPanel` (confidence-aware defaults,
  `onApply(accepted)`); a plain form when there's no existing record to
  compare; `AlertDialog` when it's a single yes/no.
- **Agent:** MIE UI Design Agent
- **Source:** agent/skills/mieweb-ui-catalog/selection-guidance.md — Chat

### SEL-22 — Unexported components

- **Ask:** "Can I import Speaker Scribe from `@mieweb/ui` today?"
- **Expect:** No — the catalog marks it "not exported yet"; it exists in
  Storybook but is not in the public API, so don't recommend or import it.
- **Agent:** MIE UI Design Agent
- **Source:** agent/skills/mieweb-ui-catalog/SKILL.md — inventory ("not exported yet" annotations)

### SEL-23 — Marketing landing page

- **Ask:** "We're building a marketing landing page for a new service line —
  what should I build it from?"
- **Expect:** `@mieweb/ui/templates` sections rendered by `LandingPage` from a
  plain-data `blocks` array; pick a `landingPresets` archetype (here
  `service-detail`) and check the page with `validateLandingPage` in a build
  step or test. Sections are experimental-maturity but shipped in production.
  Not hand-rolled divs, and not app-shell components.
- **Agent:** MIE UI Design Agent
- **Source:** agent/skills/mieweb-ui-templates/SKILL.md; src/catalog/Pages.mdx

### SEL-24 — Templates data-only trap

- **Ask:** "How do I pass my own icon component and an `onClick` handler to
  `FeatureGridSection`?"
- **Expect:** You don't — template sections take plain-data props only. Icons
  are string tokens resolved against a `TemplateIconRegistry` (the `icons`
  prop on `LandingPage` or the section); there are no event handlers — links
  are real anchors and `trackingId` renders as `data-track` for analytics. A
  genuinely interactive section is site-owned: build it with `SectionShell`
  and register it in `LandingPage`'s `custom` map.
- **Agent:** MIE UI Design Agent
- **Source:** agent/skills/mieweb-ui-templates/SKILL.md — the contract;
  src/templates/MAINTAINERS.md

### SEL-25 — Templates in Server Components

- **Ask:** "Can I render `HeroSection` and `LandingPage` inside a Next.js
  Server Component, and how do I get `next/image`?"
- **Expect:** Yes — the whole `/templates` entry is Server Component safe
  (no client hooks, CI-verified under `react-server`), with no extra peer
  deps. Pass `next/image`/`next/link` adapters via the `components` prop on
  `LandingPage` (or a section) — adapters are site code, never block data.
- **Agent:** MIE UI Design Agent
- **Source:** agent/skills/mieweb-ui-templates/SKILL.md;
  scripts/check-templates-rsc.mjs

### SEL-26 — Report section vs grid

- **Ask:** "I'm using `BenchmarkTableSection` but users now want to sort and
  filter the columns."
- **Expect:** Report template sections are static and server-safe by design —
  no sorting/filtering/export. That requirement makes it a grid:
  `DataVisNitroGrid` (Grids domain). Keep the report sections for the static
  narrative around it.
- **Agent:** MIE UI Grids Agent (via the Design Agent's redirect; report
  sections themselves are DataVis-domain)
- **Source:** agent/skills/mieweb-ui-templates/SKILL.md — troubleshooting;
  agent/skills/mieweb-ui-charts/SKILL.md

### SEL-27 — Chart vs encounter scope

- **Ask:** "I need to show the patient's problems on the visit note — do I use
  `ProblemList`?"
- **Expect:** Depends on scope: the chart owns problems as durable records;
  an encounter only references them. Chart-scope problem list →
  `ProblemList`; marking which chart problems this visit addressed
  (Addressed / Relevant Hx / Noted) → `PresentingProblems`. Writing a new or
  refined problem → `ConditionEditor`.
- **Agent:** MIE UI Design Agent
- **Source:** agent/skills/mieweb-ui-clinical/SKILL.md — "Which component?";
  src/catalog pages (Clinical lists)

### SEL-28 — Presentational list vs manager

- **Ask:** "`MedicationList` renders my meds but there's no edit dialog when I
  click a row action — is it broken?"
- **Expect:** Not broken — `MedicationList` is presentational: it emits
  `onAction` and you own the dialogs. If you want the built-in NCPDP
  `MedicationEditor`, dialogs and inline quick-add, use
  `MedicationReconciliation` (same split: `AllergyList` vs `AllergyManager`).
- **Agent:** MIE UI Design Agent
- **Source:** agent/skills/mieweb-ui-clinical/SKILL.md — inventory +
  troubleshooting

### SEL-29 — CodeLookup not exported

- **Ask:** "`import { CodeLookup } from '@mieweb/ui'` fails — where is it?"
- **Expect:** The `CodeLookup` component is deliberately not exported (it's a
  module-Worker component needing `@mieweb/codify` shards at `indexUrl`);
  apps bundle it themselves. The main entry ships `CodeLookupProvider`,
  `useCodeLookupConfig` and the types; clinical components take coded picks
  via `codeLookup` config, the ambient provider, or `addSearch`/
  `renderCodeSearch` slots.
- **Agent:** MIE UI Design Agent
- **Source:** agent/skills/mieweb-ui-clinical/SKILL.md — troubleshooting;
  src/index.ts

### SEL-30 — FHIR mapping out of scope

- **Ask:** "Which FHIR AllergyIntolerance fields map to the `Allergy` prop, and
  will the component warn on drug–allergy conflicts?"
- **Expect:** Both out of scope for the library: components define their own
  JSON shapes (not FHIR) and the consumer projects their backend model at the
  boundary, and there is no clinical decision support by design (no
  interaction/conflict/dose checks) — that's host-application logic. The
  agent should state the `Allergy` shape and decline to author the FHIR
  projection or clinical-correctness rules.
- **Agent:** MIE UI Design Agent
- **Source:** agent/skills/mieweb-ui-clinical/SKILL.md — scope section

### SEL-31 — Orders table entry point

- **Ask:** "I want a sortable orders grid for the chart — `Assessment` isn't a
  table. What do I import?"
- **Expect:** `ChartOrdersGrid` / `EncounterOrdersGrid` from
  `@mieweb/ui/datavis` (optional `@mieweb/datavis` peer) — NITRO-backed, so
  Grids domain. The pure row builders (`buildChartOrderRows`,
  `buildEncounterOrderRows`) are in the main entry.
- **Agent:** MIE UI Grids Agent (via the Design Agent's redirect)
- **Source:** agent/skills/mieweb-ui-clinical/SKILL.md — troubleshooting;
  agent/skills/mieweb-ui-datavis-api/SKILL.md
