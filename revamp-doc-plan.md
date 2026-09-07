# @mieweb/ui Documentation Revamp Plan

> Plan derived from the [component documentation audit](ComponentDocsAudit.md) (2026-09-05).
> Sections 1–5 of that file hold the evidence and grades this plan refers to as §1–§5.
> Tick boxes as work lands; re-score in the audit's grade table when a family is done.

## Catalog size: is 190 components too many?

The count is not the problem by itself; the **mix** and the **navigation** are.

**What the 190 actually are** (by Storybook `title` prefix, measured from story files):

| Tier                                       | Count | Nature                                                                                                |
| ------------------------------------------ | ----- | ----------------------------------------------------------------------------------------------------- |
| Foundations                                | 5     | Colors, Icons, Text, ThemeProvider, VisuallyHidden                                                    |
| Components/\*                              | ~125  | Design-system primitives and generic compositions                                                     |
| Healthcare/\*                              | 9     | Clinical domain compositions (ProblemList, MedicationList, CodeLookup, …)                             |
| Product/Feature Modules + Product/Provider | 56    | Application screens for one product line (Employer\*, Invoice\*, Provider\*, Service\*, Checkr, HRIS) |
| Deprecated                                 | 2     | AGGrid                                                                                                |

Roughly a third of the catalog is **application UI living in a shared library**. Those pages are
also where 90 % of the F grades sit, because they cannot honestly answer "why does this belong in
the library?" — they exist because one app needed them. Documenting them to an A standard would
mean inventing rationale; the better fix is structural.

**The 10 × 3 rule applied to the current Storybook sidebar.** Level 1 has 5 groups (fine). Level 2
already violates the rule badly: `Components/Forms & Inputs` has **48** children,
`Product/Feature Modules` 31, `Product/Provider` 25. There are also near-duplicate categories that
split the same concept three ways — `Overlays & Layering` (9) / `Overlays & Popups` (3) /
`Overlays` (1); `Layout & Structure` (14) / `Layout` (3); `Text & Data Display` (13) /
`Data Display` (4); `Status Indicators` / `Feedback` / `Loaders`. A reader cannot compare Modal,
Sheet and DockablePanel when they are filed in three different drawers.

**Assessment of the rule for this library.** ≤10 per list and ≤3 levels is achievable for 190
leaves (3 levels × 10 gives room for 1 000), but only if the Product tier is separated: 190 leaves
need ≥19 level-2 groups, which is impossible under a single `Components` node while keeping level 1
small. Practically:

- Treat **≤10** as a hard rule for the sidebar and for every "family map" table in docs, and as a
  soft rule (≤12) for prop tables.
- Treat **≤3 levels** as hard for navigation (`Tier / Family / Component`); component _variants_
  should be stories on the component page, not a fourth level.
- When a family exceeds 10, that is the signal to either split by user task (e.g. Forms → Text
  inputs / Choice inputs / Date & time / Composite forms) or to question whether some members are
  really the same component with a prop.

---

## Plan to bring the catalog to A

Definition of done per component: ≥2 in every rubric dimension, ≥16 total, no misleading
guidance, and every relationship link verified and reciprocal. Work is organised so that Phase 0
shrinks the surface area **before** anyone writes prose, and each later phase is a family (≤10
components) that can be a single PR with a single reviewer.

### Storybook as the enforcement mechanism

Storybook can carry the taxonomy and the catalog metadata, and can be made to _fail the build_ when
either drifts. Today it does neither: `title` is free text (hence the duplicate families in the catalog-size section above),
and the sort order in [.storybook/preview.tsx](.storybook/preview.tsx#L462-L486) still lists ghost
categories — `Inputs & Controls`, `Authentication & Permissions`, `Commerce & Payments`,
`Media & Device`, `Provider Directory`, `Directory`, `Search`, `Examples` — that no story uses. The
taxonomy has already been redesigned at least once and the stories never followed.

| Need                                    | Storybook feature                                                                                                                                                                                              | Notes                                                                                                                                                                    |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| One taxonomy nobody can bypass          | **Autotitle**: omit `title` and Storybook derives it from the file path under the `stories` glob (`{ directory, titlePrefix, files }` in `main.ts`).                                                           | Folder layout becomes the sidebar: `src/components/<Family>/<Component>/`. Requires a one-time folder move; after that a new family is a new folder, reviewed in the PR. |
| Stable identity through renames         | CSF `id` on the default export overrides the auto-generated story id; `?path=/docs/<id>--docs` keeps working after a title or folder change.                                                                   | Directly satisfies #421 "stable identifiers, not names alone". Adopt before the folder move so no existing link breaks.                                                  |
| Facets (scope, maturity, owner)         | **Tags** on `Meta` (`tags: ['autodocs', 'scope:general', 'maturity:stable']`). Storybook 8.4+ filters the sidebar by tag (`sidebar.filters` in `manager.ts`; built-in tag filter in the toolbar on 9/10).      | Tags are exported in `index.json`, so they are machine-readable without loading the story.                                                                               |
| Rich catalog fields                     | `parameters.catalog = { purpose, scope, maturity, owners, relationships: [{ type, target, why }], entry, peers }` on `Meta`.                                                                                   | Parameters are not in `index.json`; extract with `@storybook/csf-tools` (`loadCsf`) in a script. That script _is_ the #421 build-time inventory manifest.                |
| One comparison table per family         | A `Family.mdx` with `<Meta title="Components/Overlays" />` becomes the family's landing page; member pages link to it, it links to each member (`<Meta of={…}>` / `?path=` with stable ids).                   | Fixes "discoverable from both pages" at family granularity instead of N² pairwise links.                                                                                 |
| Status visible without opening the page | `sidebar.renderLabel` in `manager.ts` can append a badge from tags (Deprecated, Beta, Product-specific).                                                                                                       | Replaces the hand-written AGGrid banner with a generic mechanism that #421's lifecycle table needs anyway.                                                               |
| Order and depth                         | `parameters.options.storySort` with the tier order only; alphabetical within a family. Prune the ghost entries.                                                                                                | Combined with autotitle, depth is structurally capped at `Tier / Family / Component`.                                                                                    |
| Cross-repository participation (#421)   | **Storybook Composition** (`refs` in `main.ts`) mounts another repo's published Storybook in this sidebar.                                                                                                     | Lets a product team keep product-specific components in their own repo and still appear in one catalog — the preferred Phase 0 option for the Product tier.              |
| Regression guard                        | CI script over `index.json` + csf-tools: fail on missing `description.component`, unknown family, family > 10, missing `scope:`/`maturity:` tag, or a one-way `alternative to` / `composes with` relationship. | Cheap; runs against the same build the visual tests already use.                                                                                                         |

### Harmonisation with #421 (Catalog Model)

[mieweb/ui#421](https://github.com/mieweb/ui/issues/421) says durable rationale stays in the
owning repository and the catalog references it. For this repo that means **the Storybook page is
the record of truth and the catalog manifest is derived from it**, so the two efforts should share
one schema rather than run in parallel. Mapping:

| #421 Catalog Model field                                                                         | Where it lives in this repo                                                                                          | Audit rubric dimension |
| ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| Stable identifier                                                                                | CSF `id`                                                                                                             | —                      |
| Reuse scope: general-purpose / domain-specific / product-specific / application-local            | `tags: ['scope:…']` → drives the sidebar tier (`Components`, `Healthcare`, `Apps/<product>`)                         | Purpose (why here)     |
| Lifecycle: experimental / alpha / beta / stable / deprecated / retired                           | `tags: ['maturity:…']` → sidebar badge + page banner                                                                 | Limitations            |
| Purpose, selection guidance, limitations                                                         | `description.component` written to the six-heading template                                                          | P, S, L                |
| Relationships: `alternative to`, `composes with`, `supersedes`, `contains`, `uses`, `depends on` | `parameters.catalog.relationships[]` with a one-line `why`; rendered into the page and checked for reciprocity in CI | A, R                   |
| Composition examples                                                                             | Stories with story-level descriptions                                                                                | C                      |
| Documentation / demo links                                                                       | Storybook URL by stable id                                                                                           | R                      |
| Maintainers, lifecycle decisions                                                                 | `parameters.catalog.owners`; `MAINTAINERS.md` for internals                                                          | —                      |
| Package / artifact identity, entry point, peers                                                  | `parameters.catalog.entry` (`@mieweb/ui`, `/datavis`, `/esheet`, `/kerebron`, `/q`) and `peers`                      | Limitations            |
| Approved usage references                                                                        | Out of scope for this repo; supplied by consuming apps' build manifests (#421 evidence source 1)                     | —                      |

Two points from #421 change how the audit findings should be read:

- **Product and application are deployment contexts, not a measure of reusability.** #421 explicitly
  says a useful local component does not have to become a shared primitive. So the 56 Product pages
  are not a documentation failure to be fixed by prose; they are mis-scoped entries that need a
  `scope:product-specific` classification and, ideally, a home in the owning product's repository
  mounted via Composition. The A target applies to `scope:general-purpose` and `scope:domain-specific`.
- **Maturity is per artifact version, not inferred from npm tags or deprecation banners.** The
  AGGrid banner, the YChart "not exported" gap and the `SpeakerVerify` "DEV DIAGNOSTIC" label are all
  the same missing field. One `maturity:` tag replaces three ad-hoc conventions.

### Phase 0 — Organise and reduce (no documentation prose yet)

Goal: a catalog whose shape can be held in one head, whose taxonomy is enforced by the build, and
whose metadata is the seed of the #421 manifest.

- [x] **0.1 Adopt the metadata contract first.** Agree the `tags` vocabulary (`scope:*`, `maturity:*`),
      the `parameters.catalog` shape, and stable `id` naming (`<family>-<component>`) with the #421
      owners so this repo becomes #421's reference implementation rather than a second schema. Write it
      into CONTRIBUTING's autodocs section together with the six-heading description template
      (_What it's for · Use it when / Don't use it when · Related (one-line reason each) · Example ·
      Limitations · Install / entry point_).
      _Done:_ vocabulary and tiers live in [.storybook/taxonomy.json](.storybook/taxonomy.json);
      contract in [CONTRIBUTING → Stories & documentation](CONTRIBUTING.md#stories--documentation-autodocs-convention).
      **Related** and **Install / entry point** are rendered from `parameters.catalog` by
      [.storybook/CatalogDocsPage.tsx](.storybook/CatalogDocsPage.tsx), so prose carries five headings.
      Still to do with the #421 owners: confirm the manifest field names before the pilot ingests it.
- [x] **0.2 Classify every entry by reuse scope** (one PR, tags only, no prose). Expected split from the catalog-size section above:
      ~125 general-purpose, ~9 domain-specific, ~56 product-specific, plus YChart / Dashboard as
      `application-local` demos. This is the Product-tier decision from the previous draft, made with
      #421 vocabulary.
      _Result:_ 200 components — 130 general-purpose, 14 domain-specific, 52 product-specific,
      3 application-local (`YChart`, `Dashboard (Demo)`, `Dashboard Widgets (Demo)`); maturity is
      `stable` except `deprecated` (AGGrid ×2) and `experimental` (SpeakerVerify + the three demos).
- [x] **0.3 Choose the home for `scope:product-specific`**, in order of preference (record the decision here):
  - [ ] Move to the owning product's repository and mount its Storybook via Composition (`refs`).
        _Deferred:_ needs a BlueHive-side Storybook; nothing in this repo blocks it — the tier can be
        replaced by a `refs` entry once that exists.
  - [x] Keep here under an `Apps/<product>` tier with a rendered ownership banner and a B target.
        _Decision:_ the tier is named **`BlueHive`** at level 1 (all 52 product-specific entries belong
        to one product, and `Apps/BlueHive/<Family>/<Component>` would be a fourth level). The
        product-specific banner is rendered by the docs template from the `scope:` tag.
  - [ ] Retire entries no consumer imports — after the #421 build-time inventory confirms it.
- [x] **0.4 Enforce `Tier / Family / Component`, ≤10 per family.**
  - [x] Set stable `id`s on every `Meta` (before any move, so no link breaks). README and in-repo
        `?path=` links now use ids.
  - [x] ~~Switch to autotitle from folder layout~~ _Decision:_ **not** moving folders — `src/index.ts`,
        cross-component imports and tests all key off `src/components/<Name>`; a 190-folder move is a
        sweeping change with no documentation benefit. The same guarantee ("a title nobody can
        invent") comes from `catalog:check` validating every title against `taxonomy.json`.
        Final families — **Inputs:** Actions · Text inputs · Choice inputs · Date & time · Composite
        forms. **Components:** Data display · Grids · Feedback · Loading · Overlays · Navigation ·
        Layout. **Modules:** Dashboards · Media · Editors · Chat · SuperChat · Voice · Files.
        **Healthcare:** Clinical lists · Encounter & orders. **BlueHive:** Orders · Employers · Billing ·
        Providers · Services · Users & integrations · Operations. The 13 proposed `Components`
        families exceeded the ≤10 rule, hence the `Inputs` / `Components` / `Modules` split (all
        `scope:general-purpose`; the tag, not the tier, carries scope).
  - [x] Merge the duplicate categories in the catalog-size section above; delete the ghost entries in `storySort`.
        `storySort` is now a literal mirror of `taxonomy.json` (Storybook parses it statically) and
        `catalog:check` fails on drift.
- [x] **0.5 Add the CI guard** (table above) so the new shape cannot drift: missing description, unknown
      family, family > 10, missing scope/maturity, one-way relationship. Same script emits the #421
      manifest. _Done:_ [scripts/catalog-check.mjs](scripts/catalog-check.mjs) (`pnpm catalog:check`,
      wired into `ci.yml`); undocumented ids are grandfathered in `scripts/catalog-baseline.json`,
      which can only shrink; `build-storybook` writes `storybook-static/catalog-manifest.json`.
- [x] **0.6 Fix the public-API hygiene items from §3.**
  - [x] `RowActionToolbar`: add a story or remove from the barrel. _Story added (Inputs/Actions)._
  - [x] YChart: `maturity:` tag and "not exported" banner. _`scope:application-local` +
        `maturity:experimental`; the template renders the "Storybook demo only — not exported" banner._
  - [x] `Dashboard` folder cleanup (`.bak/.backup/.broken`).
  - [x] Add `CustomizableDashboard` and `SuperChat` to the MAINTAINERS table.
  - [x] Document the `kerebron` and `q` entries in CONTRIBUTING.
- [x] **0.7 Reconcile the four governing documents** (§1 conflicts).
  - [x] One Table policy sentence reused verbatim in CONTRIBUTING, agent rules, component-policy and
        the Table/NITRO pages (and the Grids Overview). Agent Rule 1 keeps its "propose NITRO first"
        protocol but now uses the same criterion for `Table`.
  - [x] One component anatomy (drop the SCSS variant or make CONTRIBUTING match). _SCSS dropped from
        component-policy; it links to CONTRIBUTING's anatomy._
  - [x] One PR rationale checklist. _component-policy Tier 3 step 6 now points at CONTRIBUTING's
        Component PR Rationale and Evidence._
  - [x] Component counts generated from `index.json`, not typed. _"126+" removed; both documents
        point at `catalog-manifest.json` / `pnpm catalog:check`._

Exit criteria:

- [x] `index.json` shows ≤10 items at every level and no duplicate families.
- [x] Every entry has `scope:` and `maturity:` tags and a stable `id`.
- [x] CI fails on a new undocumented or unclassified story.
- [x] The manifest script emits an inventory the #421 pilot can ingest.
- [x] Policy sentence identical in all four documents.

### Family checklist (Phases 1–6)

A family is checked off when every member has the six-heading description, the family landing
page exists and links both ways, every `alternative to` / `composes with` relationship is
reciprocal, and each member scores ≥16 (≥13 for `scope:product-specific`). Re-score in §2 when
ticking.

### Phase 1 — Policy-bearing families (unblocks agent rules)

- [x] **Grids** — DataVis NITRO, DataVisNitroGraph, Table, Pagination, AGGrid banner, Sparkline.
      _Why first:_ Rule 1; today the default grid page is a D.
      _Landing page:_ [src/catalog/Grids.mdx](src/catalog/Grids.mdx). AGGrid pages declare
      `superseded by` NITRO and the deprecation notice links by id; the Table Playground is labelled as
      the hand-off point to NITRO (§3 finding 2).
- [x] **Actions** — Button, ButtonGroup, CopyButton, QuickAction, RowActionToolbar, Toggle.
      _Why first:_ Rule 2 is invisible on the Button page.
      _Landing page:_ [src/catalog/Actions.mdx](src/catalog/Actions.mdx). Toggle ↔ Switch reciprocal
      link added (Switch otherwise untouched until Phase 2).
- [x] **Feedback** — Alert, AlertDialog, Toast, NotificationCenter, Spinner, Skeleton, LoadingPage,
      Progress, ErrorPage. _Why first:_ Rule 8; Toast a11y claim undocumented.
      _Split into two families to respect ≤10:_ **Feedback** (Alert, AlertDialog, Toast,
      NotificationCenter, ConnectionStatus, CollabStatus, ErrorPage — [Feedback.mdx](src/catalog/Feedback.mdx))
      and **Loading** (Spinner, Skeleton, Progress, LoadingPage — [Loading.mdx](src/catalog/Loading.mdx)).
      CollabStatus ↔ RichEditor reciprocal link added.
- [x] **Overlays** — Modal, Sheet, FloatingWindow, DockablePanel, Sidebar, Tooltip, GlossaryTooltip,
      SourceTip. _Why first:_ Rule 4 (Modal slots) and the most-asked "which overlay" question.
      _Landing page:_ [src/catalog/Overlays.mdx](src/catalog/Overlays.mdx); family also holds
      KeyboardShortcutsOverlay and CookieConsent (10). KeyboardShortcutsOverlay ↔ CommandPalette
      reciprocal link added. Source review surfaced three limitations now documented on every page
      that applies: no focus return on close, `Sheet` has no scroll lock, `FloatingWindow` has no
      focus trap or Escape handling.

Each family PR ships: one shared comparison table (linked from every member), reciprocal links,
and the template filled on each page.

### Phase 2 — Core inputs

- [x] **Text inputs** — Input, Textarea, Label, PhoneInput, PhoneInputGroup, WebsiteInput, Address,
      AddressForm. _Landing:_ [TextInputs.mdx](src/catalog/TextInputs.mdx) (Rule 11 phones/URLs).
- [x] **Choice inputs** — Checkbox, Radio, Switch, Select, Dropdown, Autocomplete, PillSelect,
      Slider, CountryDropdown, CountryCodeDropdown (CommandPalette moved to Navigation).
      _Landing:_ [ChoiceInputs.mdx](src/catalog/ChoiceInputs.mdx). Source review: Select is a
      `role="combobox"` + listbox (not native, no `name`); Dropdown is `role="menu"` with no arrow-key
      navigation; Switch/PillSelect do not submit with a form; Slider is not RTL-aware — all documented.
- [x] **Date & time** — DateInput, DateRangePicker, SchedulePicker, ScheduleCalendar, BusinessHours,
      BusinessHoursEditor. _Landing:_ [DateTime.mdx](src/catalog/DateTime.mdx) (Rule 11 dates).
      Flagged for maintainers: ScheduleCalendar reads `selectedDate` once; BusinessHoursEditor mutates
      `value` day objects in place.
- [x] **Composite forms** — AdditionalFields, CSVColumnMapper, PermissionsEditor, LanguageSelector,
      ESheet Builder/Renderer (Slider moved to Choice inputs). _Landing:_
      [CompositeForms.mdx](src/catalog/CompositeForms.mdx). Flagged: `@esheet/*` are devDependencies,
      not declared optional peers; ESheet CSS is not in the packages' `exports`.

Rule 11 (dates/phones/URLs) and the Select / Dropdown / Autocomplete confusion are resolved here.

### Phase 3 — Display, navigation and layout

- [ ] **Data display** — Card, Badge, CountBadge, ServiceBadge, FreshnessBadge, StripeBadge, Avatar,
      ClampedText, Text, Timeline.
- [ ] **Navigation** — Tabs, Breadcrumb, TableOfContents, SectionSpyNav, ReadingProgressBar,
      StepIndicator, OnboardingWizard.
- [ ] **Layout** — AppHeader, SiteHeader, SiteFooter, PageHeader, Accordion, Collapsible, ScrollArea,
      Separator, ProductVersion.
- [ ] **Dashboards** — DashboardWidget, CustomizableDashboard, QuickLinksCard, ReportDashboard
      (+ Dashboard demo labelled).

### Phase 4 — Media, editors, chat, files

- [ ] **Media** — AudioPlayer, MediaPlayer, MediaEditor, TranscriptView, AudioRecorder, RecordButton.
- [ ] **Editors** — RichEditor, RichTextEditor, Markdown, Textarea (cross-link), Q.
- [ ] **Chat** — AIChat, AIChat (Voice), AIMessage, MCPToolCall, OzwellChat, SuperChat ×3, Messaging
      module.
- [ ] **Voice** — HeyOzwell, HandsFreeChat, VisitScribe, VoiceSetup, VoiceManager, WakeWord,
      SpeakerVerify (dev-only banner).
- [ ] **Files** — DropzoneOverlay, FileManager, DocumentScanner.

Install / entry-point blocks (kerebron peers, `@mieweb/ui/datavis`, model hosting) land here.

### Phase 5 — Healthcare

- [ ] **Clinical lists** — ProblemList, PresentingProblems, ConditionEditor, MedicationList,
      AllergyList, CodeLookup.
- [ ] **Encounter & orders** — OrderEditor, Assessment, HealthSurveillance, CaseManagementHeader,
      PatientHeader, WebChartReportViewer.

Already the strongest tier; work is mostly reciprocal links and pulling README selection guidance
into stories.

### Phase 6 — Product-specific tier (per the Phase 0.3 decision)

If kept in the library, one PR per family adding the "application-owned responsibilities" block
and a family map (target B unless 0.3 says otherwise). If moved, the work per family is mounting
the product Storybook via Composition and confirming its entries carry the same `scope:` /
`maturity:` tags.

- [ ] **Orders** — OrderCard, OrderList, OrderConfirmationWizard, OrderLookupForm, OrderSidebar.
- [ ] **Employers & employees** — EmployerContactCard, EmployerList, EmployerPricingCard,
      EmployerServiceModal, EmployerView, EmployeeForm, EmployeeProfile.
- [ ] **Billing** — InvoiceList, InvoiceView, InvoicePaymentPage, PaymentMethod, PaymentHistoryTable,
      PendingClaimsTable, CreateInvoiceModal.
- [ ] **Providers** — ProviderCard, ProviderDetailHeader, ProviderOverview, ProviderSearchBar,
      ProviderSearchFilters, ProviderSelector, ProviderSettings, ProviderUsersTable, ClaimProviderForm.
- [ ] **Services** — ServiceAccordion, ServiceCard, ServiceGrid, ServicePicker, ServiceGeneralSettings,
      ServicePricingManager, ServiceShippingSettings, SetupServiceModal, RecurringServiceCard.
- [ ] **Users, auth & integrations** — AuthDialog, BookingDialog, HRISProviderSelector,
      CheckrIntegration, SSOConfigForm, InviteUserModal, EditUserRoleModal, AddContactModal,
      CreateReferralModal, RejectionModal.
- [ ] **Other** — InventoryManager, ReportDashboard, HelpSupportPanel, ResultsEntryForm,
      FilterSummaryBar, CookieConsent, ConnectionStatus, CollabStatus.

### Tracking

- [x] Re-audit after Phase 0 (structure only: counts, tags, ids, CI green). `pnpm catalog:check`:
      200 components / 4 docs pages / 7 family Overviews; every family ≤10; 96 ids remain in the
      description baseline (was 114 before Phase 1).
- [ ] Re-audit after Phase 1 — prose scoring of the 33 Phase 1 pages against the §2 rubric is still
      to be done by a second reviewer; the structural half (descriptions present, reciprocal links
      verified by CI, landing pages linked) is green.
- [x] Re-audit after Phase 2 — structural half green (`catalog:check` ok, 75 ids left in the baseline);
      prose scoring pending a second reviewer.
- [ ] Re-audit after Phase 3
- [ ] Re-audit after Phase 4
- [ ] Re-audit after Phase 5
- [ ] Re-audit after Phase 6

Re-audits use the same rubric, with scores recorded in §2 so the trend is auditable.

Once Phase 0 lands, the manifest script gives the counts for free (entries per family, missing
fields, one-way relationships) and the audit reduces to scoring prose quality. Phase 0 exit
criteria, the CI guard, and the per-family PR cadence are the three controls that keep the catalog
from sliding back.

**Continuation checkpoint:** all 186 gradable inventory entries are accounted for; the only flagged
re-check is `Accordion` (reviewer variance 8–11).
