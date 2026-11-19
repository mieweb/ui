---
name: mieweb-ui-clinical
description: Clinical components of @mieweb/ui — PatientHeader, ProblemList/PresentingProblems/ConditionEditor, MedicationList/MedicationReconciliation, AllergyList/AllergyManager, Assessment, OrderEditor, HealthSurveillance, ResultsEntryForm, EncounterVisit, CodeLookup wiring. UI-only guidance — component selection, the components' own JSON data shapes (not FHIR), chart-vs-encounter scope, controlled-component contract, entry points and constraints. USE WHEN selecting or wiring a clinical list, header, assessment, order, or surveillance component, asking what shape its data props take, or debugging CodeLookup/eSheet/orders-grid integration.
---

# @mieweb/ui clinical components

Sourced from the catalog pages (Clinical lists, Encounter & orders), component
sources and their exported types in `src/components/`, and `src/index.ts` /
`src/esheet.ts` entry files.

## Scope: UI only — never invent clinical semantics

This skill covers **component selection and the shapes the props demand**.
Explicitly out of scope — do not advise on these, say so and defer to the
consumer's own clinical/EHR owners:

- **FHIR mappings.** The components define their **own JSON types**
  (`ConditionConcern`, `Medication`, `Allergy`, `AssessmentOrder`,
  `PatientHistory`) — they are not FHIR resources. Apps project their backend
  model (FHIR or otherwise) to these shapes at the boundary.
- **Coding-system semantics.** Code fields are structurally
  `{ system, code, display? }` (RxNorm/FDB/NDC for drugs, ICD/SNOMED for
  conditions) — document the structure, never pick or validate codes.
- **Clinical decision support.** There is none by design: no drug
  interactions, drug–allergy conflicts, duplicate therapy, dose ranges, or
  code-validity checks. If the user expects CDS, that is host-application
  logic.
- **No backend calls.** Data in via props, intents out via callbacks; the
  host owns ids, dates, ordering and persistence. The lists are controlled;
  the managers can also run uncontrolled (`default*` + `onChange`); the
  drafting components (`ResultsEntryForm`, `EncounterVisit`, the editors)
  own their draft state and seed from `initialData`/`initialResponses`/
  `initialMdy` — `ResultsEntryForm` seeds on mount and `EncounterVisit`
  reloads only when `definition.id` changes, so remount/change the id when
  switching records to avoid stale drafts.

> **Which component?** Ask *whose list is it, and what scope?* The **chart**
> owns problems, medications and allergies as durable records; an
> **encounter** only references them. Chart problems → **ProblemList**; this
> visit's relevance → **PresentingProblems**; writing a problem →
> **ConditionEditor**. Medications → **MedicationList** (presentational) or
> **MedicationReconciliation** (batteries included — owns the NCPDP editor,
> dialogs, quick-add). Allergies → **AllergyList** / **AllergyManager** (same
> split; tri-state no-known-allergies). Page banner → **PatientHeader**
> (patient) or **CaseManagementHeader** (case). Today's conclusions + orders
> per problem → **Assessment**; one order in full → **OrderEditor** (morphs by
> type). What's *due* from OSHA/DOT/quality programs → **HealthSurveillance**.
> Pass/fail test results entry → **ResultsEntryForm**. A whole visit document
> → **EncounterVisit** (experimental, `/esheet`). Sortable/filterable orders
> table → **ChartOrdersGrid**/**EncounterOrdersGrid** (`/datavis` entry).

## Inventory

All from the **main entry** (`@mieweb/ui`), no extra peers, unless noted.

| Component | Key props | Notes |
| --- | --- | --- |
| `PatientHeader` | `patient: PatientData` (name, mrn, dob, age, sex, status, flags, photo), `allergies?`, `medications?`, `comments?`, `sticky?`, `showAllergyBanner?`, `onAddItem?`, `onEditPatient?` | Demographics banner with flag ribbon, built-in ⋮ menu modals |
| `CaseManagementHeader` | `caseInfo`, `patient: CasePatient`, `details?: CaseDetailItem[]`, `editingUsers?`, `labels?`, `onAddCaseNote?`, `actions?`/`alert?` slots | Case banner; one of the few with an i18n `labels` object |
| `ProblemList` | `concerns: ConditionConcern[]`, `onAction?`, `onAddProblem?`, `addSearch?`, `onReorder?`, `readOnly?` | Chart-scope; actions: open/observe/refine/revise/resolve/relate/remove |
| `PresentingProblems` | `presenting` entries tagging chart concerns **Addressed / Relevant Hx / Noted**; `scope` | Encounter-scope reference to chart concerns |
| `ConditionEditor` | `mode: 'add'\|'refine'\|'revise'\|'relate'\|'observe'`, `open` + `onOpenChange` (required — dialog), `concern?` (omit for add), `renderCodeSearch?` | Capture-first; `onSave?(ConditionAssertionDraft)` for add/refine/revise; `onRelate?` / `onAddObservation?` for relate/observe |
| `MedicationList` | `medications: Medication[]`, `onStatusChange?`, `onAction?`, `quickAddOptions?`, `addSearch?`, `readOnly?` | Presentational — you own dialogs |
| `MedicationReconciliation` | `medications`/`defaultMedications` + `onChange` (controlled/uncontrolled), `codeLookup?`, `requireCode?`, `inlineAddSearch?` | Owns the NCPDP `MedicationEditor` + dialogs |
| `AllergyList` | `allergies: Allergy[]`, `noKnownAllergies?` (tri-state: `undefined` = not asked), `onNoKnownAllergiesChange?`, `onAction?`, `addSearch?` | Grouped by category with severity badges |
| `AllergyManager` | `allergies`/`defaultAllergies` + `onChange`, `noKnownAllergies?`, `codeLookup?`, `requireCode?`, `inlineAddSearch?` | Batteries-included counterpart |
| `Assessment` | `concerns`, `items`, `orders: AssessmentOrder[]`, `onAddOrder?`, `onLinkOrder?`, `onEditOrder*?`, `onReorder*?` | A&P: orders nest under problems via `concernId` (durable IndicationLink); drag to re-link |
| `OrderEditor` | `open` (required), `order?: AssessmentOrder` (edit mode — follows `order.type`), `defaultType?: 'medication'\|'lab'\|'imaging'\|'procedure'\|'referral'` (add mode), `codeLookup?: config\|false`, `onClose` + `onSave` (required) | Morphs per type: medication → NCPDP editor; others → typed editors |
| `HealthSurveillance` | `history: PatientHistory`, `programs` (programs.json), `enrolledKeys?`, `onOrder?`, `onOrderMany?`, `now?` | Overdue/due/pending/done from `evaluateDue(history, programs)`; multi-select order picklist |
| `ResultsEntryForm` | `serviceName?`, `initialData?: Partial<ResultsEntryData>` (result passed/failed, dates, files, recommendations), `onSubmit`, `labels?` | Pass/fail results entry (BlueHive operations) |
| `WebChartReportViewer` | `reports`, `currentReport`, `reportResult`, `dateRange`, `onReportSelect`, `onRefreshReport` | Canned backend reports; renders by result shape |
| `EncounterVisit` | `definition`, `initialResponses?`/`initialMdy?`, `codeLookup?`, `onChange?`, `onSubmit?`, `onToolsReady?`, `mediaCapture?` | **Experimental**, `/esheet` entry — needs `@esheet/*` peers |
| `MedicationListField`, `AllergyListField`, `registerMieEsheetFields` | eSheet form-field adapters; answers stored as `{ medications }` / `{ allergies, noKnownAllergies }` JSON | `/esheet` entry |
| `ChartOrdersGrid`, `EncounterOrdersGrid` | NITRO-backed orders tables | **`/datavis` entry** — `@mieweb/datavis` is **bundled** into it (git submodule, not a published peer: no separate install); pure row builders (`buildChartOrderRows`, `buildEncounterOrderRows`) are in main |

**Not exported:** the `CodeLookup` **component** itself — it is a module-Worker
component apps import from their own bundler. The main entry ships only
`CodeLookupProvider`, `useCodeLookupConfig` and the types; components take
coded picks through `codeLookup` config, `addSearch`/`renderCodeSearch` slots,
or the ambient provider.

## Data shapes (the components' own types, verbatim from source)

- `ConditionConcern` — `concernId` (durable identity orders/encounters
  reference), `clinicalStatus: 'active'|'recurrence'|'relapse'|'inactive'|'remission'|'resolved'`,
  `assertions: ConditionAssertion[]` (ordered oldest→newest; last non-refuted
  is current), `observations?`, `relationships?`, `source?`.
- `ConditionAssertion` — `id`, `date`, `text` (required), `coding?:
  ConditionCoding[]` (`{ system, code, display?, primary?, mappedFrom? }`),
  `verificationStatus: 'unconfirmed'|'provisional'|'differential'|'confirmed'|'refuted'|'entered-in-error'`,
  `changeType?`, `supersedes?`, `severity?`, `onset?`, `uncertainty?`, `note?`.
- `Medication` — `id`, `name`, `status: 'unreconciled'|'taking'|'taking-noncompliant'|'not-taking'|'unknown'`,
  `sig?`, `code?: { system, code, display? }`, `strength?`, `doseForm?`,
  `quantity?`, `route?`, `frequency?`, `prn?`, `refills?`,
  `substitution?: '0'|'1'`, `startDate?`/`endDate?` (ISO), `indication?`.
- `Allergy` — `id`, `allergen`, `type?: 'drug'|'food'|'environmental'|'other'`,
  `kind?: 'allergy'|'intolerance'`, `reaction?`,
  `severity?: 'mild'|'moderate'|'severe'`, `onsetDate?`, `inactive?`, `code?`.
- `AssessmentOrder` — `orderId`, `type: OrderType`, `display`, `concernId?`
  (links to the problem), `code?: { fullid, codetype, fullcode }`,
  `priority?: 'routine'|'urgent'|'stat'`, `timing?`, `indication?`,
  `bodySite?` (imaging/procedure), `referTo?` (referral).
- `PatientHistory` (HealthSurveillance) — `age`, `sex: 'M'|'F'`,
  `orders: HistoryOrder[]` (`key` = `CODETYPE|FULLCODE`,
  `status: 'completed'|'pending'`, `date`), plus optional `observations`
  (LOINC results), `procedures`, `immunizations` (CVX), `conditions`,
  `allergies`, `medications`.

The data models above are JSON-serializable. Exceptions live at the prop
layer, not in the models: `ResultsEntryData.files` is `File[]` (uploads —
persist them separately, don't JSON-stringify), `HealthSurveillance.now` is a
`Date`, and besides the search slots (`addSearch`, `renderCodeSearch`,
`renderOrderSearch`) both headers take React-node `actions`/`alert` slots.

## Constraints & honest limitations

- **CodeLookup runtime**: needs a module Worker, `fetch`, ideally OPFS, and
  pre-built `@mieweb/codify` shards (14–81 MB) at `indexUrl`. Everything else
  makes no fetch/Worker use.
- **i18n is limited**: `CaseManagementHeader` (`labels`), `ResultsEntryForm`
  (`labels`) and parts of `WebChartReportViewer` externalize strings. Inside
  `EncounterVisit`, the `messages` prop (`EncounterVisitMessages`) translates
  built-in labels of the clinical children (Assessment etc. read it via an
  internal messages context). **Standalone** Assessment, OrderEditor,
  HealthSurveillance and PatientHeader fall back to English constants — the
  messages provider is not exported from the main entry — so flag this when a
  consumer needs translation outside `EncounterVisit`.
- **RTL does not mirror**: these components use physical `ml-*`/`pl-*`/
  `right-*` classes (unlike `/templates`). Known shared limitation.
- **A11y pattern**: each list is a `Card` of `<section aria-label>` groups;
  reorders and status changes announce via an `aria-live` region
  (`useLiveAnnouncement`); drag-reorder has an Alt+↑/↓ keyboard equivalent;
  row actions are hover-revealed on fine pointers, always visible on touch.
- **Maturity**: everything above is stable except `EncounterVisit`
  (experimental).

## Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| "Cannot import `CodeLookup` from `@mieweb/ui`" | It isn't exported (module Worker). Import it from your app bundle per the Clinical lists docs; wire components via `CodeLookupProvider` / `codeLookup` config / `addSearch` slots. |
| Want sortable/filterable orders table | `ChartOrdersGrid` / `EncounterOrdersGrid` from `@mieweb/ui/datavis` (`@mieweb/datavis` is bundled in — no separate install) — see the **mieweb-ui-datavis-api** skill. The `Assessment` card is not a grid. |
| `EncounterVisit` import/peer errors | It's on the `/esheet` entry and experimental — needs `@esheet/*` peers (and `@kerebron/*` for RichTextEsheet). See the **mieweb-ui-datavis-api** skill's eSheet section. |
| Expecting interaction/allergy/dose warnings | No CDS by design — host-application logic, not the component library. |
| "No known allergies" won't render | `noKnownAllergies` is tri-state: `undefined` means *not asked yet* (renders "not recorded"); pass `true` explicitly after confirmation. |
| List vs Manager confusion | `MedicationList`/`AllergyList` are presentational (you own dialogs); `MedicationReconciliation`/`AllergyManager` own editors, dialogs and inline add. Start with the manager unless you need custom dialogs. |
| "Which FHIR resource maps to this prop?" | Out of scope for the component library — shapes are the components' own JSON; the consumer projects their backend model at the boundary. |

Storybook: ids follow `clinical-lists-*` (ProblemList, MedicationList,
AllergyList, ConditionEditor) and `encounter-orders-*` (Assessment,
OrderEditor, HealthSurveillance, PatientHeader), e.g.
https://ui.mieweb.org/?path=/docs/clinical-lists-problemlist--docs. Catalog
pages: Clinical lists, Encounter & orders.
