# Evals — Component selection / catalog

Primary agent: **MIE UI Design Agent** (owns selection via the
`mieweb-ui-catalog` skill and its selection guidance). See
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
- **Agent:** MIE UI Design Agent
- **Source:** lessons/wiring-headless-modules.md

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
  `RichTextEditor` for an HTML document with an always-on toolbar, variables,
  or dictation; `RichEditor` when you need Markdown, links/tables/code, or
  collaboration.
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
