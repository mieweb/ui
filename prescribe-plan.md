# Prescribe plan

Status: complete and verified on branch codex/prescribe-plan. All six phases are implemented. Component plan reviewed October 2, 2026; simulated EHR API, implementation, and final verification completed October 3, 2026. The user authorized publishing this branch and opening a pull request for online review on October 3, 2026.

Implementation tracking: complete a checklist item only after implementing and verifying it, then append the implementation commit SHA to that item. Record implementation commits and their validation in the progress log below. Commit code changes first and commit the corresponding plan update separately so the plan can refer to an existing commit. Git history records both code and progress commits.

## Implementation progress

### Review follow-up: floating and field-level alerts

- [ ] Remove the floating editor panel when no outstanding issues remain, restore it for new issues, and retain successful workflow status inline in the demo.

- [x] Keep prescription alerts available in a collapsed floating panel that expands within 20% of the viewport height. (`2785ae47`)
- [x] Show scoped, accessible alerts beside medication, pharmacy, and prescription detail inputs as users scroll through the editor. (`2785ae47`)
- [x] Verify expansion, collapse, scrolling, issue focus, mobile/RTL layout, and accessibility; update the review demo and PR. (`2785ae47`)

- `2785ae47` — Collapsed floating status/count summary with an independently scrolling issue list capped at `20dvh`; dialog placement outside its scrolling body; scoped inline alerts and input associations for medication lookup, prescription details, substitution/PRN, and pharmacy. The demo hides its page panel while the editor is open and reserves space for its floating panel at the end of the page. Legacy inline summary defaults and translation objects remain compatible. Verified all 1,365 repository tests, full TypeScript/ESLint/Prettier/catalog checks, complete library and static Storybook builds, public ESM/CommonJS/declaration checks, and 18 fresh browser cases with four matching visual baselines and no Axe WCAG 2A/AA/2.1AA violations. Browser cases measure the height cap and persistent summary during scrolling on desktop and mobile RTL/dark views. The updated review demo runs on port 6008 because ports 6006/6007 belong to another checkout. Included in [PR #538](https://github.com/mieweb/ui/pull/538).

- Baseline: the complete UI, shared validator, EHR API, simulator, and standards plan is tracked before implementation begins.
- Completed: phases 1–6 below. Every checklist item links to the local implementation or verification commit. The working branch is ready for review.
- `4c21528d` — Shared JSON draft/context/readiness contracts, deterministic validator and explicit demo policy, pure/API public entries, typed HTTP client, 37-route runtime schema registry and generated OpenAPI. Verified 24 tests in Node and 24 tests in jsdom, isolated TypeScript compilation, affected ESLint/Prettier, and targeted ESM/CommonJS builds/imports. Full declaration/build integration and simulator execution remain outstanding.
- `d4a799fb` — Added trusted resolved-product consistency (identity/code/version/strength/form), explicit unknown ingredient/compound paths, human-readable validation messages, scoped context references, complete typed service methods/provider payloads, and junior EHR adapter guide. Verified 25 pure/API tests in both Node and jsdom, isolated TypeScript compilation, scoped ESLint/Prettier, regenerated all 37 OpenAPI operations and targeted ESM/CommonJS builds. The simulator will supply server-owned product metadata; production clinical/network adapters remain outside scope.
- `ddf5d3d7` — Lossless optional drafts and canonical adapters; shared readiness/issue UI; verified catalog metadata and explicit prescription editor controls; permissive saving/focus restoration; Assessment linked/unlinked/collapsed alerts; stable grid identity/filter/completion; opt-in medication/reconciliation/eSheet integration and consumer composition docs. Verified 43 focused tests, scoped ESLint, catalog check, and six real-browser completion/accessibility cases. Visual test files will be committed separately after the API simulation browser suite is finalized; full declaration/build integration remains pending.

- `5307f961` — Catalog dispensing-unit consistency, explicit date/timestamp validation, selected-evaluation identity and per-resource revision checks, preserved historical delivery receipts, and aggregate/list/grid expiry refresh with timer cleanup. Added built ESM/CommonJS parity and actual Node-only declaration-consumer smoke checks. Verified 27 pure/API tests in Node and jsdom, 49 focused UI tests, whole-repository TypeScript/ESLint, and built public imports/declarations. Final whole-repository test/build and simulation/browser gates remain outstanding.

- `fe306294` — Preserved optional catalog coding-system versions through injected lookup, editor draft/save, and trusted product previews. Verified all 13 affected medication/order-editor tests plus affected ESLint/Prettier.

- `cea078ed` — Complete deterministic fake EHR service, per-instance store/scheduler/providers, all 37 HTTP routes, all 24 scenarios and variants, eight requested service domains, scoped PDMP/PA, review/signing/transmission/reconciliation/cancellation state machines, real typed-client Storybook host, trace/reset controls, and simulator maintenance guide. Verified all 82 focused simulator tests and the full repository suite: 104 files / 1,354 tests passed. Whole-repository TypeScript/lint/format, final library build, static Storybook and browser checks follow against the frozen source.

- `75c3ae10` — Final verification assets: real-browser completion/editor/read-only/theme/mobile/RTL and typed-client workflow tests, four inspected pixel baselines, corrected test fixture typing, and Node-only ESM/CommonJS declaration consumers. Final checks passed: 104 Vitest files / 1,354 tests; 102 Node tests; seven focused real-client host retests; TypeScript, ESLint, Prettier, catalog and whitespace checks; complete library JS/declaration/CSS build; isolated public runtime/declaration checks; regenerated OpenAPI (37 operations / 52 schemas, clean diff); static Storybook build/catalog manifest; 16 fresh Playwright cases with all four snapshots matching and no Axe WCAG 2A/AA/2.1AA violations. An earlier concurrent build/check run timed out six tests under resource contention; the frozen sequential rerun passed without global timeout changes. All six phases are complete, with no outstanding implementation items. No pushes or remote changes were performed.

Allow clinicians and staff to record an unfinished medication order immediately, show what prevents it from being prescribed or sent to a pharmacy, and provide a direct way to complete it wherever that order appears. A name such as “Lasix” is enough to save an order draft. Completing prescription details, obtaining the prescriber's signature, and transmitting the prescription are separate steps.

The starting workflow is [Assessment Interactive](https://ui.mieweb.org/?path=/story/encounter-orders-assessment--interactive). Implementation covers the UI component library, a shared TypeScript validation layer usable in client and server, and a fake EHR service/API for development and Storybook. The same validation functions and rules run in both environments. The fake service simulates transmission, clinical checks, PDMP, coverage, and prior authorization. A production EHR implements the declared API using its real data and providers; real EPCS credentials, clinical knowledge sources, payer/PDMP connections, and Surescripts transport remain outside this repository's implementation.

Implementation navigation: [UI and shared validation](#shared-typescript-validation-layer), [EHR API contract](#ehr-api-contract-and-simulator), [simulation scenarios](#scenario-matrix-and-expected-behavior), [developer steps and tests](#junior-developer-implementation-order-and-tests), and [standards references](#applicable-standards-and-implementation-references).

## Intended workflow

1. Enter “Lasix” using the existing free-text or coded add path. Save it immediately with its order ID and concern link. Do not force a prescription dialog during entry.
2. Show an always-visible warning beside the medication row: **Needs prescription details**. Its expanded summary lists the actual missing details, such as product/strength, form, dose, route, directions, quantity, or pharmacy, according to the applicable policy.
3. Choose the existing **Edit** button or **Complete prescription** from the warning. Both open the same full medication editor for the same order. The completion action focuses the first issue the user can resolve.
4. The current user or another authorized team member can fill in some or all details and choose **Save draft**. Unresolved issues remain visible. The host persists the changes and refreshes every view of that order.
5. Once the supplied validation context supports the required checks, show **Details complete** or, when the host confirms current preflight, **Ready for prescriber review**. Review/sign actions are callbacks into the consuming application.
6. Display **Ready to send** and transport states only from current host-confirmed eligibility and status. The component library renders these states and exposes callbacks; it does not sign or send prescriptions. An editor save never marks a prescription signed or sent.

Example row copy:

> Lasix · Needs prescription details
>
> Strength, form, route, directions, and quantity are missing.
>
> Edit · Complete prescription

The actual issue list comes from validation; this example is illustrative. Do not infer clinical dose, route, strength, quantity, or instructions from the medication name.

## Existing components and gaps

| Component or contract | Current behavior | Planned change |
| --- | --- | --- |
| [AssessmentOrder](src/components/Assessment/Assessment.tsx#L63) | Stores display/detail/code and general order information. No structured prescription payload. | Add optional prescription details; retain existing lightweight drafts and callbacks. |
| [OrderEditor adapters](src/components/OrderEditor/OrderEditor.tsx#L126) | Reconstruct details from labels/sig. Saving folds the medication back into display, detail, indication, notes, and code, dropping quantity, refills, explicit strength/form, and other details. | Make prescription round trips lossless before adding readiness claims. |
| [Medication](src/components/MedicationList/MedicationList.tsx#L61) | Already has many optional prescription fields. Its status describes medication reconciliation. | Extract a shared prescription-detail contract without changing reconciliation status or making fields mandatory for saving. |
| [MedicationEditor](src/components/MedicationList/MedicationEditor.tsx#L325) | Saves any nonempty name. Route/frequency/PRN are regex-derived; quantity unit follows dose form. | Preserve permissive saving; add explicit controls, issue messages, and completion navigation. |
| [Assessment editing](src/components/Assessment/Assessment.tsx#L274) | onEditOrderStart can hand editing to the full OrderEditor. Linked and unlinked rows share rendering. | Reuse this handoff for Edit and Complete prescription; render a shared readiness indicator on both kinds of rows. |
| [MedicationReconciliation](src/components/MedicationList/MedicationReconciliation.tsx) and [eSheet field](src/esheet-fields/MedicationListField.tsx) | Capture presenting medications and intake history as well as details. | Enable prescribing alerts only for rows explicitly intended for a prescription. |
| [HistoryOrder](src/components/HealthSurveillance/history.ts#L16) and [OrderRow](src/components/HealthSurveillance/orderRows.ts#L28) | Have a coding key, dates, and operational status, but no unique prescription instance identity or readiness projection. | Add optional instance identity and host-provided prescription summaries before exposing cleanup actions. |
| [Order grids](src/components/HealthSurveillance/OrdersGrid.tsx) | Support order placement, requisitions, and cancellation. Exported through [@mieweb/ui/datavis](src/datavis.ts#L8). | Add an independent readiness column/filter and completion action. Requisition creation retains its existing meaning. |

The catalog currently calls the grids story-only; update that description to match the datavis export during implementation. Current editor field mappings are a starting point, not proof that a complete NewRx message or EPCS application exists.

## Readiness and workflow states

Keep four dimensions independent: prescription data completeness, signing eligibility, transmission eligibility, and delivery state. Existing order lifecycle status and medication reconciliation status keep their current meanings.

| Visible state | Meaning | Action |
| --- | --- | --- |
| Needs prescription details | Required data is missing. Draft remains usable. | Complete prescription / Edit |
| Prescription needs correction | Data exists but fails a rule, such as an invalid quantity or unsupported product identifier. | Edit the affected field |
| Readiness not checked | Authoritative context is unavailable, stale, or validation failed to run. | Check readiness; show any known local issues |
| Prescribing blocked | Patient, prescriber, destination, jurisdiction, or system conditions prevent the next action. | Route to the relevant chart, provider, pharmacy, or administrative task |
| Details complete | Required draft fields pass the shared validator, but authoritative review/send eligibility has not been confirmed. | Review details or request a host check |
| Ready for prescriber review | Current preflight passes; review/signature is still required. | Review and sign |
| Ready to send | Required authorization/signature applies to the current revision and transmission preconditions pass. | Send, if the host provides that action |
| Sending / Sent / Send failed | Host-reported transport outcome. | Show receipt or resolve the reported failure |

When several issues coexist, show the most actionable summary and make the entire issue list available. A “details complete” result alone cannot produce “Ready to send.” Missing validation context cannot silently produce a green readiness badge.

Cancelled, discontinued, historical, or already transmitted orders retain their historical status and are excluded from active completion counts. A previously sent record is not reinterpreted as an unfinished draft when policy changes; a new prescribing action gets its own current evaluation.

## Validation policy

Use one shared TypeScript implementation with a versioned policy contract across views and execution environments. The client runs it for immediate feedback. A TypeScript server can import the same function and rerun it against the current prescription and trusted patient, prescriber, pharmacy, and policy context. Supplying that context and enforcing the result remain responsibilities of the consuming application.

DEA EPCS applies to controlled substances and includes security and signing requirements in addition to prescription content. The federal controlled-prescription content baseline includes patient name/address, drug name/strength/form, quantity, directions, practitioner name/address/DEA registration, and the date and signature. See [21 CFR 1306.05](https://www.ecfr.gov/current/title-21/section-1306.05).

The following matrix is a proposed product validation framework. Route, structured dose, product coding, days supply, and other fields must be classified against the actual transaction profile and clinical context; they are not all unconditional federal EPCS fields.

| Area | Proposed checks before the relevant prescribing action | Remediation |
| --- | --- | --- |
| Drug identity | Resolve the intended product; verify supported identifier and coding system, strength, and dosage form. A generic ingredient selection may still need product detail. Support explicit compound/nonstandard pathways where the host profile permits them. | Medication search and product fields |
| Directions | Capture intelligible patient directions and applicable dose/unit, route, frequency, and PRN information. Preserve complex/tapered directions; a failed regex parse is not proof of an invalid prescription. | Explicit fields and directions editor |
| Dispensing | For ordinary outpatient prescriptions, validate positive quantity and an appropriate dispensing unit. Apply profile-specific exceptions, such as supported LTPAC open orders, explicitly. Refills must be an explicit nonnegative integer when required; zero is a valid value. Validate days supply when required or supplied. | Dispensing section |
| Dates | Keep therapy start/effective date distinct from written/signing date. For controlled prescriptions the signed date comes from the signing workflow. Apply applicable date and future-fill rules. | Editor for effective dates; host signing service for signed date |
| Patient | Validate required demographics and patient identity against chart context and the message profile. | Open patient details |
| Prescriber | Validate required identity, identifiers, license/registration, authority, location, and network enrollment for the intended action. | Select eligible prescriber or resolve enrollment |
| Pharmacy | Resolve a valid destination and its capability for the intended transaction, including controlled prescriptions where relevant. | Select/change pharmacy |
| Transaction | Validate represented prescription fields, supported codes/units, lengths, and conditional rules using the supplied transaction profile. Full message serialization/XML validation remains a host integration concern. | Field issues or integration task |
| Controlled substance | Use authoritative drug scheduling plus applicable jurisdiction rules; validate schedule-specific refills and other required details. Unknown classification remains unresolved. | Product resolution, prescription correction, or policy task |
| EPCS authorization and signing | Evaluate supplied host facts about practitioner access, identity proofing, application capability, review, and signing; unresolved facts remain unknown. The library does not authenticate or sign. | Host review/signing callback |

Schedule II prescriptions cannot be refilled under [21 CFR 1306.12](https://www.ecfr.gov/current/title-21/section-1306.12). Schedule III/IV federal refill limits are governed by [21 CFR 1306.22](https://www.ecfr.gov/current/title-21/section-1306.22). Represent applicable limits in the shared policy consumed by both runtimes, including stricter jurisdictional rules supplied by the host.

Surescripts publishes network-specific guidance alongside NCPDP specifications. Determine mandatory, conditional, and supported fields from the integration's adopted guides and certification scope. The existing editor's labels cannot establish the production checklist. See the [Surescripts e-prescribing documentation](https://docs.surescripts.com/eprescribing/home).

The public technical guide is marked as early-adopter documentation. Its controlled-substance rules include sender/receiver service capability, drug NDC and schedule, and signing indication; its medication guidance supports free-text directions and describes days supply as optional. Use these as inputs to profile review, preserving compound and other conditional paths. Confirm the deployed requirements before treating them as production policy. See [General Requirements](https://docs.surescripts.com/eprescribing/guide/general-requirements), [Medication Elements](https://docs.surescripts.com/eprescribing/guide/medication-elements), and the [Companion Guide](https://docs.surescripts.com/eprescribing/guide). Its [NewRx guidance](https://docs.surescripts.com/eprescribing/guide/newrx) also describes conditional LTPAC open-order quantity handling.

## Shared TypeScript validation layer

Create a framework-independent module under src/prescribing with shared prescription types, policy types, rules, normalization, and validatePrescription(input, policy). Put canonical types here so the validator never imports MedicationEditor, Assessment, or another React component, even indirectly.

Publish it through a dedicated **@mieweb/ui/prescribing** entry, backed by src/prescribing.ts. Register that entry in tsup.entries.mjs and package.json exports so the existing declaration build includes it. Provide ESM, CommonJS, and declarations matching the package's current conventions. The import graph must be free of React, DOM APIs, browser globals, and server-only libraries; a server can use it without loading the UI bundle.

The validator has these constraints:

- Pure, synchronous, deterministic functions with explicit input. No fetching, database access, authentication, signing, storage, timers, or environment detection. Pass the evaluation date/time and any freshness information explicitly.
- JSON-compatible input, policy, context facts, and results. Use one normalization path for strings, decimal quantities, units, zero refills, and dates, with stable issue codes, field paths, and ordering. Do not mutate the draft or silently replace entered values.
- Validate input shape at runtime as well as exposing TypeScript types. Malformed serialized values produce structured issues rather than bypassing checks through a cast.
- Versioned profiles specify required/conditional fields, supported codes/units, transaction type, and schedule/jurisdiction limits. Use shared rule implementations selected by profile; avoid separate client and server rule lists. Any extension rule is a shared TypeScript function imported by both consumers, not a function serialized in policy JSON.
- Keep policy configuration small and typed rather than building a generic rules engine. An unsupported policy version or malformed policy/context produces an explicit configuration/unavailable issue and cannot yield passing readiness checks.
- Accept resolved context facts rather than performing external checks. Missing classification, prescriber authority, pharmacy capability, or other required context yields an unknown check with a resolvable issue. Known field errors remain visible alongside unknown checks.
- Compute validation results independently of execution location. A component may label a result as a local preview; a host may label a result as server-confirmed after rebuilding trusted context. That provenance belongs in the integration/display envelope, not in the pure rule logic.

Both consumers use the same public API:

```ts
import { validatePrescription } from '@mieweb/ui/prescribing';

// Client: evaluate the current draft and supplied context for UI feedback.
const preview = validatePrescription(clientInput, policy);

// Server consumer: evaluate fresh input and trusted context with the same rules.
const checked = validatePrescription(serverInput, policy);
```

For identical input and policy, both calls return the same result. A server must construct its own context and choose its policy; accepting a client-computed result, signature flag, or client-selected policy would not constitute a fresh validation. The fake EHR API below demonstrates this boundary using server-owned fixture context and the same validator.

## Shared data and component contracts

Add a shared PrescriptionDetails type containing the existing optional medication prescription fields plus any needed dose/unit and PRN fields. Preserve the current flat Medication API through type composition. Add AssessmentOrder.prescription as an optional structured payload. Patient, prescriber, and pharmacy context belong to host references or separate context props rather than being copied into every display row.

For an order with structured prescription data, that payload is the canonical prescribing record. Keep overlapping display/detail/code/indication/notes fields synchronized as projections in the same save. Route medication inline edits through the full editor by default; any host retaining inline edits must atomically update or invalidate the affected prescription fields, coding, and readiness. A changed visible drug or Sig must never leave an earlier structured value eligible for transmission. Legacy orders without the payload continue through the existing draft path.

Use explicit prescribing intent or a host adapter to distinguish a prescription draft from medication history, an administration order, a surveillance suggestion, or an ordinary service order. The same medication can appear in several workflows without every appearance becoming a prescription task.

Proposed validation and display result shapes, to finalize during implementation:

```ts
type PrescriptionIssue = {
  code: string;
  ruleId: string;
  ruleSource: 'product' | 'network' | 'federal' | 'jurisdiction' |
    'organization' | 'clinical-provider' | 'payer' | 'pdmp-provider';
  fieldPath?: string;
  message: string;
  severity: 'warning' | 'error';
  blocks: Array<'review' | 'sign' | 'transmit'>;
  remediation: 'edit-prescription' | 'patient' | 'prescriber' |
    'pharmacy' | 'clinical-review' | 'pdmp' | 'coverage' |
    'prior-authorization' | 'sign' | 'system';
};

type PrescriptionValidationResult = {
  orderId: string;
  orderRevision: string;
  contextRevision: string;
  policyVersion: string;
  evaluatedAt: string; // Echo the explicit evaluation time in the input.
  dataState: 'incomplete' | 'invalid' | 'complete' | 'unknown';
  checks: {
    review: 'pass' | 'fail' | 'unknown';
    transmit: 'pass' | 'fail' | 'unknown';
  };
  issues: PrescriptionIssue[];
};

// Component integration envelope; workflow evidence is supplied by the host.
type PrescriptionReadiness = {
  validation: PrescriptionValidationResult;
  source: 'client-preview' | 'simulated-server' | 'server-confirmed';
  workflow: {
    evaluationId: string;
    evaluationRevision: string; // Revision of the mutable gate projection.
    inputFingerprint: string;
    workflowFingerprint: string;
    projectedAt: string;
    expiresAt: string | null;
    validity: 'current' | 'stale' | 'expired';
    gates: {
      review: 'pass' | 'fail' | 'unknown';
      sign: 'pass' | 'fail' | 'unknown';
      transmit: 'pass' | 'fail' | 'unknown';
    };
    issues: PrescriptionIssue[]; // Includes unresolved external-domain reasons.
  } | null;
  signing: 'not-signed' | 'signed' | 'unknown';
  delivery: 'not-sent' | 'sending' | 'sent' | 'failed' | 'unknown';
};
```

Passing a check always applies to a particular revision, context, and policy. The pure validator checks supplied facts; it cannot verify the origin of those facts or create a signature. The component validates that the display envelope corresponds to the current order/context and uses server-confirmed status for authoritative readiness labels. Simulated results carry a distinct source and a persistent Simulation label. Signing evidence and delivery receipts remain host-owned records; displaying their status does not generate or modify them.

Suggested UI API additions:

- PrescriptionReadinessBadge for compact row status and PrescriptionIssueSummary for reasons and actions. Both take the shared result and localizable labels.
- An optional readinessByOrderId map and onCompletePrescription callback on order views. The callback carries stable order identity and, when available, issue code/field path. Existing Edit callbacks remain supported.
- Optional prescribing context and issue/navigation props on OrderEditor and MedicationEditor. Host-level issues can render beside the editor and route outside it.
- The same validatePrescription function imported by the editor, row previews, and TypeScript server consumers. Provide an optional host result for updated trusted context without introducing a second validator.

Keep these additions optional. Existing consumers without prescribing context continue to render and save their current data. A prescribing consumer with missing readiness data displays “Readiness not checked.”

## Completing a prescription

Extend the current MedicationEditor rather than creating a second medication form. Put a completion summary at the top, group issues by section, and let the user jump from an issue to its field. Show inline messages through aria-describedby and aria-invalid where applicable.

Add explicit controls for route, frequency, dose/unit, and dispensing unit when the policy requires them. Preserve entered complex Sig text. Separate product strength from administered dose. Treat label/Sig parsers as suggestions requiring confirmation or verified catalog metadata; parsing cannot satisfy a requirement for authoritative data by itself.

On drug/product changes, clear or require reconfirmation of dependent code, strength, form, units, and instructions. Plain-name changes must not retain a stale code. Sig edits must not silently overwrite manually confirmed structured values. Present contradictions for correction. Persist substitution defaults deliberately; the current visual default must match the stored draft.

Keep Save draft enabled under the existing minimum requirement of a nonempty name, including when other supplied fields are invalid. Show “Saved as draft; prescription still needs details” after persistence succeeds. Cancellation discards editor changes. Saving a draft never runs EPCS authentication or transmits an order.

Preserve order ID, concern links, existing non-prescription metadata, and all explicit prescription details on save/reopen. Legacy display/detail parsing can populate suggestions, but must not overwrite structured values. Treat old startDate data as therapy dates until the host establishes its meaning; do not silently turn it into a legal written date.

## Visibility across the system

| Surface | Readiness presentation and completion path |
| --- | --- |
| Assessment linked and unlinked rows | Shared always-visible indicator beside medication content. Existing Edit and Complete prescription open the full editor. |
| Assessment with plan collapsed | Keep an active incomplete-prescription count visible; activating it reveals the affected orders. |
| EncounterOrdersGrid and ChartOrdersGrid | Independent Prescription readiness column/filter, summary count, and action for the exact order instance. Preserve ordinary operational status. |
| MedicationList and MedicationReconciliation | Opt-in alerts for prescribing-intent rows. Reuse Correct/full editor where appropriate. Reconciliation-only and patient-reported medications retain their normal presentation. |
| eSheet medication field | Pass prescribing context explicitly where a host uses it for orders; preserve the existing medications JSON shape. Ordinary intake gets no prescription-completion warning. |
| Generic OrderList and OrderSidebar | Hosts compose the badge/summary through renderOrder and children/actions. Add a generic slot only if composition proves insufficient. |
| Patient/chart summaries and host work queues | Host supplies counts and stable order links to active incomplete prescriptions, with concern/encounter and assignee context. Reuse the same readiness result. |
| Review and send screens | List every selected order's unresolved issues. Offer completion/navigation, and gate the requested action using current authoritative results. |

“Anywhere” means that every host surface displaying an active prescription order can consume the shared result for the same identity. The library cannot discover prescriptions hidden in a backend. Hosts must supply the projection, subscribe/refetch after changes, and connect completion callbacks to the order record.

HistoryOrder.key and OrderRow.orderKey identify a coded service or drug, not an order instance. Add an optional orderId before enabling completion from grids, and propagate it through row building and DataVis serialization. Do not use the coding key to edit one of several identical prescriptions. Rows without resolvable identity may display an aggregate alert but must not offer an ambiguous edit action.

Warnings remain visible on mobile, keyboard focus, and read-only screens. Provide icon plus text, keyboard-accessible issue disclosure, an accessible action name including the medication, and focus return to the originating row. Use polite live announcements for meaningful save/readiness changes. Read-only users see issues and the responsible role or navigation route without mutation controls.

## Host integration boundary

The library delivers prescription types, the shared TypeScript validator, issue presentation, editor/navigation behavior, and props/callbacks. The development simulator supplies in-memory drafts, permission fixtures, workflow records, and fake API responses behind those contracts. Production EHR applications implement real persistence, permissions, external-provider adapters, signing, transport, audit storage, and certification.

Document only the interfaces needed by those consumers:

- Saves and completion actions carry the stable order ID and revision; changed controlled props refresh the validation display and invalidate stale results.
- Client previews and server-confirmed results share the validator's output contract. A server consumer reruns the same validator with its own trusted inputs before enforcing an action.
- Review/sign/send and external remediation are optional callbacks. The UI can render host-reported success, failure, or unknown status without initiating those services itself.

DEA permits staff preparation before practitioner review. Application audit/certification is a separate requirement. See the [DEA EPCS FAQ](https://www.deadiversion.usdoj.gov/faq/epcs-faq.html). For EPCS, computed preflight readiness does not replace the practitioner's explicit indication that each prescription is ready for signing. The host signing screen displays the required prescription information and signing notice; two-factor signing belongs to the identified practitioner. A single signing invocation covers only one patient, and the practitioner must individually review and indicate each selected controlled prescription ready. See [21 CFR 1311.120](https://www.ecfr.gov/current/title-21/section-1311.120) and [21 CFR 1311.140](https://www.ecfr.gov/current/title-21/section-1311.140).

After DEA-required data changes following designation as ready to sign, require a new practitioner review and indication of readiness. After a controlled prescription is digitally signed, changes to required Part 1306 information require cancellation of the signed prescription under [21 CFR 1311.120(b)(10) and (19)](https://www.ecfr.gov/current/title-21/chapter-II/part-1311/subpart-C/section-1311.120). Preserve the signed record and use the host's replacement/cancellation workflow, including CancelRx handling when it was transmitted; do not edit a signed artifact in place. Administrative updates follow the applicable policy and do not automatically cancel a signed prescription.

## Implementation sequence

### Phase 1 Preserve prescription drafts

- [x] Define shared optional PrescriptionDetails and prescribing-intent contracts, and add AssessmentOrder.prescription. (`ddf5d3d7`)
- [x] Make orderToMedication and medicationToOrder preserve all structured details and existing order metadata. Keep legacy parsing subordinate to explicit values. (`ddf5d3d7`)
- [x] Define canonical prescription fields and atomic legacy projections; route or synchronize inline edits so displayed and evaluated data agree. (`ddf5d3d7`)
- [x] Resolve drug-change invalidation, stored substitution defaults, and therapy/written date separation. (`ddf5d3d7`)
- [x] Add meaningful round-trip and legacy compatibility tests; update the OrderEditor data-loss documentation when fixed. (`ddf5d3d7`)

Deliverable: a Lasix draft can be edited, saved, reopened, and handed to another user without losing prescription details.

### Phase 2 Build the shared TypeScript validator

- [x] Add src/prescribing/types.ts, policy.ts, validate.ts, and index.ts with one deterministic validatePrescription implementation and typed versioned profiles. (`4c21528d`, `d4a799fb`)
- [x] Define JSON-compatible draft/context/policy inputs and structured issues/results, including unknown context and invalid configuration behavior. (`4c21528d`, `d4a799fb`)
- [x] Register src/prescribing.ts in tsup.entries.mjs and package.json exports for @mieweb/ui/prescribing; use the existing ESM/CommonJS/declaration build. (`4c21528d`, `d4a799fb`)
- [x] Test field presence/format, explicit zero refills, profile conditions, fixed-time date boundaries, input immutability, and stable issue ordering. (`4c21528d`, `d4a799fb`)
- [x] Verify identical fixtures in browser and Node, JSON round trips, and built imports without React or DOM dependencies. (`5307f961`)

Deliverable: UI and TypeScript server consumers can import and run the same rules through one public API.

### Phase 3 Show readiness in Assessment and the editor

- [x] Have editor and row previews consume the shared validator directly; add an adapter for host-confirmed results and optional workflow status. (`ddf5d3d7`)
- [x] Add shared badge/summary components and labels; export UI components through the main entry without introducing new peers. (`ddf5d3d7`)
- [x] Wire linked/unlinked Assessment rows, collapsed-plan counts, and the existing full-editor handoff. (`ddf5d3d7`)
- [x] Add explicit field controls and issue-to-field focus. Preserve Save draft independently of sign/send validation. (`ddf5d3d7`)
- [x] Add Storybook examples for bare Lasix, partially completed, invalid, unknown, blocked, details complete, and read-only orders; simulate optional host workflow states. (`ddf5d3d7`)

Deliverable: a complete, reviewable UI workflow consuming the shared TypeScript validation layer.

### Phase 4 Propagate readiness and document consumer contracts

- [x] Add stable instance identity and readiness projections to history/grid adapters without changing surveillance due/prerequisite rules. (`ddf5d3d7`)
- [x] Extend orderRows.ts, ordersGridShared.tsx, and OrdersGrid.tsx for readiness filtering and completion callbacks; retain the datavis entry boundary. (`ddf5d3d7`)
- [x] Add opt-in prescribing integration to medication lists/reconciliation and eSheet; keep intake defaults unchanged. (`ddf5d3d7`)
- [x] Document generic list/sidebar composition and host chart-summary/work-queue adapters. (`ddf5d3d7`)
- [x] Update EncounterOrders.mdx and medication/editor docs with the shared contracts, correct exports, and client/server import examples. (`ddf5d3d7`)
- [x] Verify optional props, legacy data, package declarations, and dependency isolation across supported entry points. (`5307f961`, `fe306294`, `75c3ae10`)

Deliverable: the same prescription revision has consistent alerts and completion actions across supported UI views, with a documented validator that server applications can reuse.

### Phase 5 Implement the fake EHR service and API

- [x] Implement the API contracts, per-instance store, fixture providers, and HTTP adapter described below; have validation call the shared pure validator. (`4c21528d`, `d4a799fb`, `cea078ed`)
- [x] Add deterministic evaluation, PDMP, formulary/benefit, prior authorization, simulated signing, transmission, and cancellation state machines. (`cea078ed`)
- [x] Add runtime request/response schemas, OpenAPI documentation, revision checks, action gates, idempotency, and typed failure responses. (`4c21528d`, `cea078ed`)
- [x] Add per-story reset, scenario selection, injectable clock/IDs, and lifecycle cleanup; isolate fake code from the published validator entry. (`cea078ed`)

Deliverable: a fake EHR implementing the same interface the production EHR will replace, with no real external transmissions.

### Phase 6 Verify complete UI and API simulations

- [x] Connect a Storybook host through the typed API client; demonstrate all eight requested services and the fixture scenarios below. (`cea078ed`, `75c3ae10`)
- [x] Test late responses, partial/unavailable services, override expiry, revision conflicts, PDMP review, PA decisions, and simulated signing. (`5307f961`, `cea078ed`, `75c3ae10`)
- [x] Test duplicate-send prevention, response loss, operation polling, cancellation, and reset using controlled time. (`cea078ed`, `75c3ae10`)
- [x] Publish consumer documentation and the OpenAPI contract; identify production adapter responsibilities and applicable standards. (`d4a799fb`, `5307f961`, `cea078ed`)

Deliverable: an inspectable end-to-end prescribing simulation that a junior developer can extend by implementing the defined methods and fixtures.

## Acceptance and verification

| Scenario | Required outcome |
| --- | --- |
| Bare free-text Lasix | Saves immediately; active prescription row shows completion alert; Edit opens the full editor. |
| Coded drug with strength/form but missing directions/quantity | Remains an unfinished draft. A code selection alone does not imply readiness. |
| Partial or invalid detail saved | Saving succeeds under the draft minimum; relevant missing/invalid issues remain. |
| Completed prescription reopened | Explicit dose/route/quantity/refills/DAW/dates and concern link survive the full adapter round trip. |
| Drug name/product or Sig changes | Stale derived/coded values are cleared or reconfirmed; eligibility is recomputed for the new revision. |
| Inline medication edit | Full editor handoff or atomic synchronization/invalidation prevents the previous structured drug or Sig from remaining eligible; displayed and evaluated data match. |
| Zero refills | Treated as supplied and valid where allowed; blank and zero remain distinct. |
| Patient, prescriber, or pharmacy missing/ineligible | Issue names the external blocker and navigates to the appropriate resolution. |
| Policy/context unavailable or stale | Unknown state; no authoritative sign/send eligibility. |
| Updated order supplied through controlled props | Every view displays the new draft and reruns shared validation; no real multi-user backend is required for the component test. |
| Same drug ordered twice | Completion edits only the selected order instance; code keys cannot cross-target edits. |
| Historical/intake medication, lab, or service order | No accidental active-prescription warning. |
| Read-only, collapsed plan, mobile, keyboard | Warning/count remains discoverable; no unauthorized mutation; correct dialog focus and focus return. |
| Controlled-substance context and workflow status | Shared rules report required/missing facts; the fake service supplies simulated review/signing evidence, and components remain consumers of that status. |
| Mixed validation results in a list | Issues and completion actions resolve to the correct order; components cannot present a passing batch result when individual checks fail or remain unknown. |
| Fake send failure or unknown outcome | The API exposes the operation and reconciliation outcome. Response-loss recovery reuses the original idempotency key; a known retryable failure uses the explicit retry endpoint under the same logical operation. |
| Identical input in browser and Node | Same shared implementation returns identical results, including issue codes/order and policy version. |
| JSON serialization and repeated evaluation | Inputs/results round-trip without semantic changes; evaluation is deterministic and leaves input untouched. |
| Unsupported policy or malformed context | Explicit configuration/unavailable issue; no accidental passing readiness. |
| Built prescribing subpath import | ESM/CommonJS and declarations work without importing React, DOM, browser globals, or server-specific libraries. |

Verification covers the pure validator, component adapters, and fake EHR service/API. Run focused Vitest coverage, typecheck/lint for affected code, browser/Node validator parity, built-entry import/declaration checks, API contract tests, Storybook interaction/accessibility checks, and catalog checks when documentation/exports change. Use synthetic fixtures; a live signing/transmission service remains outside this deliverable.

Implementation is tracked in the local commits and verified checklist above. All six phases are implemented and verified locally, including the shared validator, API contracts, healthcare completion UI, deterministic fake EHR, package builds, and static Storybook/browser workflows. The production integrations described below remain consuming-EHR responsibilities.

## Policy and component decisions

- Define the initial versioned prescribing profiles and distinguish mandatory/conditional fields from completion guidance; include supported coding systems, units, schedule rules, and product/compound exceptions.
- Agree the serializable context facts consumers supply, including an explicit representation for unknown values, revision/freshness metadata, and policy version.
- Finalize field paths, issue codes, localization labels, and callback payloads for editor and external remediation actions.
- Inventory supported component surfaces and document composition examples for consuming applications.
- Document how consumers configure a deployed transaction/jurisdiction profile and map external issues, without requiring this repository to implement those integrations.

The component library and shared TypeScript validator can be developed and verified with explicit fixture profiles and context. Selecting production policies, signing providers, and transport integrations remains a consuming-application decision.

## EHR API contract and simulator

The following is the proposed application API that a production EHR would implement. Its JSON shapes are our UI integration contract, not NCPDP messages or a claim of FHIR conformance. Implement the same contract with an in-memory fake EHR so developers can exercise prescription completion and all requested services without connecting to real patients, pharmacies, payers, PDMPs, or signing credentials.

The eight service areas are transmission, validation, drug interactions, pregnancy precautions, drug dosing, PDMP, formulary/benefits, and prior authorization. Validation runs the shared TypeScript validator. Clinical services use replaceable knowledge-provider interfaces with explicitly synthetic content in the simulator. Signing is included as a supporting simulated workflow because transmission needs a reviewed prescription and applicable signing evidence.

### Package and file layout

Keep the API contract reusable and the fake implementation out of the normal UI/validator bundles:

```text
src/prescribing/
  types.ts                      Shared canonical draft and context types
  policy.ts                     Versioned field and workflow policy
  validate.ts                   Pure prescription validation
  index.ts                      Pure exports only
  api/contracts.ts              JSON request/response types and service interface
  api/schemas.ts                Runtime request/response shape checks
  api/createHttpClient.ts       Fetch-based client with injected transport
  api/index.ts                  API exports, no React or simulator imports
src/prescribing.ts              @mieweb/ui/prescribing
src/prescribing-api.ts          @mieweb/ui/prescribing/api
src/demo/prescribing/
  createFakeEhrService.ts        Async service factory
  store.ts                      Per-instance records and atomic mutations
  providers.ts                  Fake clinical, PDMP, and benefit adapters
  router.ts                     Request -> service method -> Response
  createFakeFetch.ts            Injectable fetch-compatible transport
  scheduler.ts                  Controllable clock and scheduled transitions
  scenarios.ts                  Named deterministic simulation scenarios
  fixtures/                     Synthetic patients, products, rules, plans, reports
  FakeEhrStoryHost.tsx           API client wiring and controlled component props
  fakeEhrService.test.ts         State-machine and shared-validator tests
  fakeHttpContract.test.ts       Route/body/header/schema contract tests
  prescribingWorkflow.test.tsx   UI interactions through the API client
docs/prescribing-api.openapi.yaml
vitest.prescribing-node.config.ts   Node tests without browser setup
scripts/prescribing-demo-server.ts  Optional localhost HTTP wrapper
```

These are new files to create during implementation. Register both public entries in tsup.entries.mjs and package.json exports. The API client may use standard fetch/AbortSignal interfaces; the pure prescribing entry must not import that client. Fake implementation and fixtures stay demo/test-only, with no export from the published main or prescribing entries. If a runnable Node demo is added, it wraps the same Request/Response router and binds to localhost; do not maintain a second set of route logic.

The repository currently uses local-state Storybook simulations and fetch mocks in tests; it has no MSW setup. Start with an injected fake fetch rather than adding a service worker dependency. Keep real CodeLookup/static asset requests on their existing transport.

### HTTP conventions and common records

Use a configurable base URL, default **/api/prescribing/v1**. Every path below is relative to it. Document the API with [OpenAPI 3.1.1](https://spec.openapis.org/oas/v3.1.1.html), chosen as the implementation baseline rather than a claim about the latest specification. Use runtime schemas at the boundary; do not cast untrusted JSON directly to TypeScript types. Additive optional fields stay within v1; breaking changes require a new major path/schema version.

Success responses use this envelope:

```ts
type ApiEnvelope<T> = {
  meta: {
    apiVersion: '1';
    requestId: string;
    generatedAt: string; // ISO timestamp supplied by the service clock.
    mode: 'simulation' | 'live';
  };
  data: T;
};

type RevisionRef = { id: string; revision: string };
type Page<T> = { items: T[]; nextCursor: string | null };
type Evidence = {
  providerId: string;
  datasetVersion: string;
  ruleId?: string;
  referenceUrl?: string;
  referenceSection?: string;
  observedAt?: string;
  retrievedAt: string;
  synthetic: boolean;
};

type Fact<T> =
  | { state: 'known'; value: T; observedAt: string; sourceId: string }
  | { state: 'unknown'; reason: string }
  | { state: 'not-applicable'; reason: string };

type CheckResult<T> = {
  status: 'pending' | 'complete' | 'partial' | 'unavailable' |
    'not-applicable' | 'not-requested';
  outcome: 'findings' | 'no-findings-within-coverage' | 'unknown';
  data: T | null;
  findings: EvaluationFinding[];
  missingInputs: string[];
  coverage: {
    domains: string[];
    evaluatedSubjects: string[]; // Product, pair, or regimen IDs actually checked.
    excludedSubjects: string[];
    datasetVersion: string | null;
  };
  evidence: Evidence[];
  checkedAt: string | null;
  expiresAt: string | null;
  error: { code: string; retryable: boolean } | null;
};

type ClinicalFinding = {
  id: string;
  category: 'interaction' | 'duplicate-therapy' | 'allergy' |
    'pregnancy' | 'lactation' | 'reproductive-potential' | 'dosing';
  code: string;
  summary: string;
  rationale: string;
  severity: 'info' | 'warning' | 'critical';
  implicatedPrescriptionIds: string[];
  implicatedMedicationIds: string[];
  factPaths: string[];
  evidence: Evidence[];
  suggestedActions: Array<{ code: string; label: string }>;
  disposition: {
    blocks: Array<'review' | 'sign' | 'transmit'>;
    resolution: 'none' | 'acknowledgement' | 'override' | 'cannot-override';
    allowedReasonCodes: string[];
  };
};

type WorkflowFinding = Omit<ClinicalFinding, 'category'> & {
  category: 'formulary' | 'benefit' | 'pdmp' | 'prior-authorization';
};
type EvaluationFinding = ClinicalFinding | WorkflowFinding;
```

Severity describes the finding; workflow policy determines blocking and allowed resolution. A finding stays in the record after acknowledgement/override. Its decision is a separate event tied to the evaluation snapshot. Empty findings mean only that no issue was found within the declared completed coverage. Partial, unavailable, unsupported, and unknown responses must never display as an all-clear result.

Required transport behavior:

| Situation | Response |
| --- | --- |
| Successful read or validation with missing prescription fields | 200 with data/issues; missing fields are an ordinary validation result. |
| Created draft, decision, or PA case | 201 with Location and the created record. |
| Evaluation/query/send/cancel accepted as an asynchronous operation | 202 with Location, operation ID, current state, and suggested poll interval. |
| Malformed JSON, unknown enum, or incompatible schema | 400 with field paths; do not silently discard unknown action values. |
| No identity / role not allowed | 401 / 403. Actors come from the service session, not a claimed actorId in request JSON. |
| Resource or requested revision cannot be found | 404; never fall back to a different patient/order. |
| If-Match revision no longer current | 412 with currentRevision; missing required revision precondition returns 400 in this contract. |
| Invalid state transition or idempotency key reused with a different request | 409 with a stable error code. |
| Well-formed sign/send request blocked by policy or unresolved checks | 422 with gate reasons and issue/check IDs. |
| Rate limit / entire service unavailable | 429 / 503 with retry guidance. A single provider outage inside an evaluation is a partial/unavailable check, not the loss of the entire evaluation. |

Use strong ETags on mutable records and If-Match on updates. Use HTTP semantics from [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html). Send error bodies as application/problem+json following [RFC 9457](https://www.rfc-editor.org/info/rfc9457/), with standard type/title/status/detail/instance fields plus code, requestId, retryable, currentRevision, and issues extensions as applicable. Clinical warnings belong in domain results, not HTTP error objects.

For every POST and PUT mutation, require **Idempotency-Key** as a convention of this API, including draft and questionnaire saves. Scope it by session/tenant, actor, and route; compare a canonical validated request including body, target revision, and If-Match when present. Same key plus same request returns the original resource/result without another mutation; same key plus a changed request returns 409. Retain the pending request/key in the client until its outcome is known. Store entries for the entire simulator session. A production retention policy must be documented by the EHR. Aborting a request or losing its response does not prove the mutation was undone.

RevisionRef.revision always means prescription **contentRevision**. PrescriptionRecord separately has **recordVersion**, which changes whenever its returned representation changes and determines its ETag. Draft content edits increment both; attaching evaluation/review/artifact/transport IDs or changing workflow state increments recordVersion only. Workflow activity must not immediately invalidate the content it just reviewed or signed. Context, evaluation, PA, query, and session resources use their own resource revisions/ETags. The core validator's orderRevision echoes contentRevision.

The HTTP client defaults to the host's same-origin session transport; credentials/header behavior is injected by the consuming EHR. The fake service uses a configured session with actorId, role staff/prescriber/read-only, allowedActions, and allowedPatientIds. Staff may save assigned-prescriber drafts and perform allowed preparation, but cannot impersonate that prescriber to review/sign. Reject wrong-patient resource access and actor spoofing before returning records.

Implement pollAfterMs in every asynchronous response. The demo client starts at 500 ms, backs off to at most 5,000 ms, stops at a terminal state/unmount/patient switch, and after 30 seconds leaves a visible pending state with manual refresh. These are configurable UI defaults. A GET/poll must not itself advance a job or create another submission.

### Discovery and context endpoints

| Method and path | Request | Response data |
| --- | --- | --- |
| GET /capabilities | None. | Available service domains; profile IDs/versions; supported transaction types; maximum batch size; simulated/live mode; service support status; polling/freshness policy. |
| GET /policies/{policyId} | Optional version query. | Shared PrescriptionPolicy plus workflow required-check lists, override policy, PDMP requirement/exemption rules, and PA holding policy. Server chooses the active policy; client selection cannot weaken it. |
| GET /patients/{patientId}/context | Optional encounterId. | PatientContextSnapshot defined below, with revision and ETag. |
| GET /drugs?q=...&cursor=... | Query length at least two characters; page limit 20 in demo. | Page of DrugProduct records. Free text remains allowed independently of search results. |
| GET /drugs/{productId} | Product identity. | Product metadata, terminology version, ingredients, strength/form, schedule fact, and evidence. |
| GET /pharmacies?q=...&cursor=... | Search text and page cursor. | Page of pharmacy records: ID, name/address, directory ID, NewRx/CancelRx/EPCS capability facts and refreshedAt. |

Define PatientContextSnapshot with patientId, encounterId, revision, capturedAt, birthDate/age precision, demographics required by the profile, medication exposures, allergies, pregnancy/lactation facts, measurements/labs, renal/hepatic facts, coverage, and context completeness. Each clinical fact carries its source and time through Fact or an observation record. PrescriberContext is supplied from the fixture session and includes identity, permission facts, registration/network facts, and revision; the client cannot assign itself a prescribing role.

Medication exposures include stable ID, drug/product coding, status, effective period, actual/reported/proposed use, dose details when known, and source revision. Include OTC/supplements and other proposed orders in the fixture context. A missing or unreviewed list differs from a confirmed empty list. Allergy records preserve verification, reaction, severity, and affirmative no-known-allergies information; absence of records does not imply an allergy check passed.

Observation records include code/system, decimal-string value, display unit, unit code/system, effectiveAt, sourceId, method, and status. Keep pregnancy status explicit: pregnant, not-pregnant, or unknown, with observation date and optional gestational age. Lactation and pregnancy intent are separate facts. Do not infer these from administrative sex/gender. Renal facts retain metric type, equation/method, indexed/absolute units, date, and dialysis status; the service cannot interchange CrCl and eGFR or guess a missing method.

DrugProduct contains id, display, coding array with system/code/version, concept specificity, ingredient IDs, strength/form, quantity-unit choices, and controlledSchedule as Fact. An unresolved “Lasix” draft is still unresolved until a product is explicitly selected. In simulations, use the coding system urn:mieweb:simulation-drug and invented products for clinical findings; do not assign fabricated RxNorm/NDC identifiers or clinical claims to real medicines.

### Draft persistence and evaluation endpoints

| Method and path | Request | Response data |
| --- | --- | --- |
| GET /prescriptions?patientId=...&encounterId=...&cursor=... | Patient identity and optional encounter/filter. | Page of PrescriptionRecord records. |
| POST /prescriptions | patientId, optional encounterId, prescriberId, optional pharmacyId, intent, display/code, and shared PrescriptionDetails. Nonempty display is the draft minimum. | New PrescriptionRecord; revision 1 and ETag. Incomplete/invalid clinical content remains savable. |
| GET /prescriptions/{id} | Stable order identity. | PrescriptionRecord and ETag. |
| PUT /prescriptions/{id} | Complete editable draft representation; If-Match required. ID/patient identity are fixed; workflow-owned fields are rejected. | Updated record/revision and invalidated evaluations/decisions as appropriate. |
| POST /evaluations | EvaluationRequest below; Idempotency-Key required. | EvaluationRecord with shared validation and requested service checks; 202 while checks run. |
| GET /evaluations/{id} | Evaluation identity. | Current EvaluationRecord; polls do not trigger new checks. |
| PUT /evaluations/{id}/workflow-context | pdmpQueryId and priorAuthorizationId, each an ID or null; If-Match and Idempotency-Key required. | Current saved evaluation with updated workflow links/gates. Allows PDMP/PA created after initial evaluation to be attached without rerunning unchanged clinical checks. |
| POST /evaluations/{id}/decisions | findingId, action acknowledgement/override, reasonCode, optional comment and mitigation. Evaluation revision precondition required. | DecisionRecord attributed to the session actor and bound to the finding/context/order/policy versions. |

PrescriptionRecord contains id, patientId, encounterId, prescriberId, pharmacyId, contentRevision, recordVersion, intent, display/code, shared prescription details, lifecycle, createdAt/updatedAt, latestEvaluationId, reviewId, signedArtifactId, latestTransmissionId, and replacesPrescriptionId. The editable fields are the draft/reference fields, not lifecycle or receipt IDs. Reuse the canonical draft model and adapters rather than maintaining a second divergent set of prescription fields. Keep malformed quantity/refill text representable in drafts so Save draft still works; the evaluator reports invalid values. Ordinary PUT changes to signed prescribing content return 409 SIGNED_CONTENT_IMMUTABLE and require the replacement path.

EvaluationRequest is one of:

```ts
type EvaluationSubject =
  | { kind: 'saved'; prescription: RevisionRef }
  | { kind: 'preview'; draft: PrescriptionDraft; clientDraftRevision: string };

type EvaluationRequest = {
  subject: EvaluationSubject;
  services: Array<'validation' | 'interactions' | 'pregnancy' |
    'dosing' | 'formulary' | 'benefit'>;
  relatedPrescriptions?: RevisionRef[]; // Proposed same-patient co-prescriptions.
  pdmpQueryId?: string;                // Explicitly requested PDMP query.
  priorAuthorizationId?: string;
};
```

PrescriptionDraft is the shared optional-field draft model, including patient/prescriber/pharmacy references; its prescription details have the same shape used by the components. The fake server loads context/policy from its store and never trusts client-computed results or context. For saved subjects it checks the exact revision. Preview results can drive UI feedback but cannot create reviews, signatures, transmissions, or durable overrides. Incomplete drafts still run any clinical check that has enough information; do not stop all interactions just because quantity is missing.

EvaluationRecord contains id, revision, subject, relatedPrescriptions, patientContextRevision, prescriberContextRevision, pharmacyRevision, policyVersion, knowledgeVersions, inputFingerprint, workflowFingerprint, createdAt, projectedAt, expiresAt, validity current/stale/expired with validityReasons, state running/complete/partial, validation, checks by requested domain, linked PDMP/PA summaries, decisions, and gates. Revision changes for every returned projection update. Gates contain review/sign/transmit as pass/fail/unknown plus reasons with domain/check/finding IDs. The scope includes other proposed same-patient orders so drug pairs in a new batch are evaluated together; changes to those revisions invalidate the associated evaluation.

Build immutable inputFingerprint from canonical serialization of the ordered subject/related content references, patient/prescriber/pharmacy clinical-context revisions, and policy/knowledge versions. Provider results from this evaluation remain tied to that snapshot. Build mutable workflowFingerprint from the evaluation projection revision, finding-decision references, PDMP query/report/review revisions, benefit inquiry references, PA case/scope/decision revisions, and attached review/session/artifact references. Use sorted keys/references in the simulator; plain canonical scope strings are sufficient for correlation and are not cryptographic signatures. Attaching or updating a PDMP/PA/review/signing record changes the workflow fingerprint and projection revision, not the immutable clinical fingerprint. Changed patient facts, coverage-plan context, prescription content, or clinical policy still requires a new clinical evaluation.

The workflow-context operation replaces both link fields, with null explicitly clearing a link. It accepts saved evaluations whose clinical snapshot still matches current content/context/policy and whose required clinical facts/checks remain fresh. An expired PDMP/PA link may be replaced to restore workflow eligibility; expired clinical evidence requires a new evaluation. Resolve records from the server store. Check same patient, eligible prescriber/reviewer, purpose/jurisdiction and report freshness for PDMP, and matching product/quantity/plan/effective scope for PA; a mismatched record is rejected rather than treated as approval. Pending records may be linked but cannot satisfy a required completed check. Preview evaluations cannot attach durable workflow records. Record link changes as events and recompute gates atomically. Initial IDs in EvaluationRequest use these same checks. The happy path attaches newly created query/case IDs before expecting their outcomes to affect gates.

Gate reduction is explicit and stage-specific: a failed required check or unresolved finding whose blocks contains that stage yields fail. Otherwise any required pending, not-requested, missing, expired, partial, or unavailable check, or any outcome unknown, yields unknown. A complete check passes its required domain only when coverage is sufficient and its outcome is no-findings-within-coverage or all findings blocking that stage have applicable permitted resolutions. Not-applicable requires a validated policy/fact-based reason. Nonblocking findings remain visible. A client's services list cannot omit a required check to obtain eligibility. Stale/expired evaluations never expose a passing action gate, even if their historical checks passed.

Define gate prerequisites separately. Review needs current saved content, completed required pre-review checks, resolved applicable findings, and a permitted reviewing actor; it needs no existing review or signature. Sign adds the named prescriber's current per-prescription review/ready selection and applicable pre-sign requirements; it does not require a signature already to exist. Transmit adds a completed valid signing artifact, eligible destination, applicable pre-transmit checks, and any PDMP/PA holding requirements. Configure required checks by stage explicitly in policy rather than treating these gates as synonyms.

When PDMP review, PA decision, review creation, signing completion, or expiry changes a workflow fact, increment and recompute the affected evaluation gate projection. Preserve its immutable clinical snapshot and findings. A changed clinical/context/policy input marks the old evaluation stale and requires a new one; an approved PA or completed signature updates gates without rerunning an unchanged clinical check. GET returns the current projection. A signature artifact is invalid for a different contentRevision even if all other checks pass.

Implement evaluationToReadiness in the API adapter. It retains the shared validation result, maps all unresolved clinical/PDMP/coverage/PA reasons to the summary, and copies the reduced workflow gates, both fingerprints, revision, projectedAt, expiresAt, and validity into PrescriptionReadiness.workflow. The row/editor must use those workflow gates for Ready for review/send, never validation.checks alone. If workflow is absent, stale, or expired, show field completeness plus unknown workflow eligibility. Accept a response only for the current clinical scope and a projection revision at least as new as the one displayed; a late response must not roll back a newer decision/signing result. Preserve domain findings for their separate panels and label simulation from meta.mode. Test field-complete prescriptions with a blocking interaction and with an unavailable required provider.

Compute expiresAt as the earliest expiry of evidence required by the projected gates, including fact freshness, provider results, PDMP review/report, scoped PA and signing-session validity while the challenge is pending; null requires policy-confirmed absence of time-limited prerequisites. A completed artifact uses its own applicable validity rules; expiry of the already completed challenge alone does not erase it. Retain per-domain times for remediation. The fake host schedules a projection update at expiry using its injected clock. Production hosts refresh at expiry and on focus/resume; readiness components also suppress an elapsed passing result using their UI clock. This display timing stays outside the pure validator. Test expiry without editing an order or receiving another API response.

When a decision resolves an overridable finding, recompute gates without rerunning providers. Increment the evaluation's decision revision and retain findings. Only an allowed role/reason may override; cannot-override returns 422. WorkflowFinding provides stable finding IDs for coverage/benefit/PA concerns too, so a permitted proceed decision uses the same endpoint and is bound to the matching scope. Such a decision records policy-permitted acknowledgement/exception; it does not change payer coverage or PA approval. An override cannot repair missing data, a failed format rule, an unavailable required service, or an actual missing signature. Editing implicated facts invalidates the decision's applicability.

### Clinical checks and provider contracts

Use three provider methods under the async EHR service: checkInteractions(snapshot), checkPregnancy(snapshot), and checkDosing(snapshot). Each returns CheckResult with domain data below. They run through /evaluations; the UI need not call three unrelated endpoints. Provider interfaces accept immutable draft/context snapshots, policy, knowledge-pack version, and an AbortSignal. Their synthetic rule evaluation is deterministic for the same snapshot and time; the surrounding fake service adds latency and outages.

| Service | Required inputs and domain result | Simulator behavior |
| --- | --- | --- |
| Drug interactions | Candidate ingredients/product, active/relevant recent exposures, concurrent proposed orders, routes/doses when needed, and medication/allergy-list completeness. Findings include implicated records, interaction type, mechanism/rationale, review actions, severity, and versioned evidence. | Match invented ingredient-pair rules symmetrically, deduplicate stable findings, include duplicate-therapy and optional allergy scenarios, and report unsupported pairs or missing history as partial. A known finding can coexist with unknown coverage. |
| Pregnancy precautions | Product, dated pregnancy status, gestational age when required, lactation, reproductive intent, and available label/knowledge evidence. Result data separates pregnancy, lactation, and reproductive-potential assessment with narrative risk/clinical considerations. | Match invented product rules; unknown/stale status yields missing-input findings. A confirmed applicable precaution yields an explicit review requirement. Do not generate A/B/C/D/X categories or a binary pregnancy-safe field. |
| Drug dosing | Product/strength/concentration, actual dose/unit, route, timing/frequency/PRN maximum, indication, age, weight/height when required, renal metric/method and hepatic facts when required, and relevant concurrent exposure. Result data contains supported regimen interpretation, computed per-dose/daily amount when possible, range/unit, adjustments/review suggestions, and missing inputs. | A small synthetic rule pack checks invented limits and explicit conversions. Unsupported complex Sig, taper, PRN without a maximum, incompatible units, stale weight, missing indication, or wrong renal metric remains partial/unknown. No inferred real-drug dose recommendations. |

For a junior implementation, start with fixture rules rather than a medical rules engine. Give every rule an ID/version, supported product/ingredient codes and explicitly covered pairs/regimens, requiredFactPaths, maxFactAge/effective-period requirements, fake threshold or scripted finding, and evidence.synthetic true. Include declared covered nonfinding cases; absence of a matching rule for an unsupported product/pair is unknown coverage, not no-findings. Example: an invented SimDrug A has a demonstration maximum of 10 mg per administration; a 12 mg candidate triggers DEMO_DOSE_HIGH. These numbers apply only to the invented fixture. A weight-dependent SimDrug B requires a recent kg weight, and a renal scenario requires a named CrCl metric. Missing those facts produces missingInputs, not a guessed calculation. Freshness uses each fact's observed/effective time, not snapshot capturedAt or retrieval time. Refreshing an old observation cannot make it new. Keep rule parameters in fixtures so tests can verify outcomes directly.

Production providers need maintained clinical knowledge and product-specific labeling, not regex name matching. [RxNorm](https://www.nlm.nih.gov/research/umls/rxnorm/overview.html) supplies normalized drug identities; [NLM discontinued RxNav interaction features](https://www.lhncbc.nlm.nih.gov/RxNav/information/FAQs.html) in 2024. The simulator does not depend on that discontinued service.

Pregnancy narratives should follow the concepts in [FDA PLLR labeling resources](https://www.fda.gov/drugs/labeling-information-drug-products/pregnancy-and-lactation-labeling-resources). Preserve label identity/version/section and retrieval/effective dates; [DailyMed describes its submitted in-use labeling and limitations](https://dailymed.nlm.nih.gov/dailymed/about-dailymed.cfm). A source link is evidence attribution, not a guarantee that a fabricated fixture is a real clinical rule.

Use [UCUM](https://ucum.org/ucum) unit codes where applicable, with explicit supported conversions. Dispensing units and product concentration need their own profile mappings. Product strength, administered dose, and total dispense quantity are distinct. Renal metric selection matters for real dosing; see [NIDDK drug-dosing guidance](https://www.niddk.nih.gov/research-funding/research-programs/kidney-clinical-research-epidemiology/laboratory/ckd-drug-dosing-providers). Do not treat every renal measurement as interchangeable.

### PDMP query and review endpoints

| Method and path | Request | Response data |
| --- | --- | --- |
| POST /pdmp-queries | patientId, prescriberId, encounterId if available, jurisdictions, purposeCode, and explicit query attestation where the configured policy requires it. | QueryRecord; 202 for the simulated query. Validate session permissions and permitted jurisdictions before creating it. |
| GET /pdmp-queries/{id} | Query identity. | QueryRecord with per-jurisdiction status, match status, synthetic report or retrieval link, and freshness. |
| POST /pdmp-queries/{id}/reviews | reviewedReportRevision, purposeCode, optional comment, and If-Match. | PDMPReviewRecord with actor/time/report scope; fetching or displaying the report does not create this record. |

QueryRecord contains id/revision, patientId, prescriberId, requestedJurisdictions, purpose, state queued/complete/partial/unavailable, match matched/ambiguous/no-match, per-jurisdiction statuses, reportRevision, reportGeneratedAt, queriedAt, expiresAt, and entries. Each synthetic entry includes dispensing identity, product, dispense date, quantity/units, days supply where known, and source jurisdiction. Use no patient-risk score to grant or deny prescribing. An empty matched report, an unmatched identity, an ambiguous identity, an outage, an unreviewed report, and a reviewed report are separate outcomes.

PDMP policy is configurable by jurisdiction, role, product schedule, purpose, timing, and documented exemption facts. The demo has a fictional rule requiring current reviewed PDMP information for its controlled-product scenario; that is a fixture policy, not a statement that every state or prescription has the same legal requirement. Do not query PDMP automatically on each medication keystroke. Run only on the explicit permitted workflow action, then link its query/review to evaluation gates. Revalidate identity, report revision, reviewer eligibility, and freshness at sign/send transitions.

Production adapters depend on the relevant state/integration provider. See [ASTP/ONC PDMP integration information](https://healthit.gov/pharmacy-pdmp/) and [Indiana INSPECT](https://www.in.gov/pla/inspect/) as one concrete jurisdiction example. [CDC PDMP guidance](https://www.cdc.gov/overdose-prevention/hcp/clinical-guidance/prescription-drug-monitoring-programs.html) advises using reports with other clinical information rather than replacing judgment with generated scores.

### Formulary and patient benefit services

The /evaluations formulary and benefit domains call separate checkFormulary and checkBenefit providers. Query inputs include patient/coverage-plan revision, product and code specificity, quantity/unit, days supply when required by the profile, pharmacy, prescriber, indication when required, and evaluation time. Do not show a plan-wide formulary row as a patient-specific price.

FormularyResult contains planId, formularyVersion, productId, coverage covered/not-covered/conditional/unknown, tier, restrictions, quantityLimit, stepTherapy, priorAuthorization yes/no/unknown, alternatives, and evidence. Restrictions are typed records with code, message, and applicable product/quantity/indication scope. Alternatives contain product identity and coverage information; they are suggestions and cannot automatically change the draft.

BenefitResult contains inquiryId, coverage/member reference, pharmacyId, product/quantity/day-supply scope, coverage status, patientCostEstimate { amount: decimal string, currency }, estimateAsOf, estimateDisclaimer, restrictions, priorAuthorization, alternatives, and payerResponseId. Missing cost is unknown, not zero. Record source and expiry. Simulate supported/unsupported plans, inactive coverage, conflicting plan and patient-specific results, preferred versus nonpreferred pharmacies, covered/noncovered products, and unavailable responses.

Coverage and benefit outcomes do not establish clinical appropriateness or successful dispensing. PA required, noncovered, and unknown benefit status do not universally prohibit transmission. The fixture policy explicitly chooses whether to hold sending for each condition. The UI should show the reason, allow a permitted alternative/PA action, and retain the decision if the policy permits proceeding.

Production adapters distinguish NCPDP Formulary & Benefit from patient-specific RTPB. See [CMS adopted standards and transaction scope](https://www.cms.gov/medicare/regulations-guidance/electronic-prescribing/adopted-standard-and-transactions) and [Surescripts patient benefit guidance](https://docs.surescripts.com/rtpb-providers/guide). Estimates remain estimates.

### Prior authorization endpoints and lifecycle

| Method and path | Request | Response data |
| --- | --- | --- |
| POST /prior-authorizations | saved prescription revision, evaluation/benefit inquiry reference, benefitType pharmacy/medical, reasonCode, and optional payer route reference. | PriorAuthorizationCase in draft/questionnaire-needed; reject unsupported routes with an explicit domain reason. |
| GET /prior-authorizations/{id} | Case identity. | Current case, scope, state, latest decision, and next action. |
| GET /prior-authorizations/{id}/questionnaire | Case identity. | Versioned QuestionnaireRecord with typed items and required/conditional rules. |
| PUT /prior-authorizations/{id}/answers | questionnaireId/version, answer array, document references, and If-Match. | Saved answers and field issues. Partial answers may be saved. |
| POST /prior-authorizations/{id}/submissions | case revision, questionnaire version, and submissionKind initial/additional-information/appeal. | Submission operation; 202 after required answers and authorization are checked. |
| GET /prior-authorizations/{id}/submissions/{submissionId} | Submission identity scoped to its case. | SubmissionRecord with queued/sent/acknowledged/failed state, sent answer/form references, outcome, and case reference. This is the creation response's Location. |
| POST /prior-authorizations/{id}/cancellations | case revision and reasonCode. | Case with cancellation details; 200 for local cancellation or 202 with Location pointing to GET /prior-authorizations/{id} while provider cancellation runs. Cancelling PA does not cancel the prescription. |

PriorAuthorizationCase contains id/revision, patientId, prescription reference, payer/plan, benefitType, route script-epa/davinci-pas/manual/simulation, scoped product/quantity/day-supply/indication, createdAt, state, questionnaire reference, submission IDs, decision, and expiresAt. Decision includes authorizationReference, covered scope, effective period, approved limits, denial reasons, and appeal/documentation actions where available. An approval is neither a patient-wide boolean nor permanent permission for changed products or benefits.

Case states are draft -> questionnaire-needed -> ready-to-submit -> submitted -> pending -> approved/denied/additional-information-needed. Additional information returns to the question/answer workflow with a new questionnaire version. Approved cases may later be expired or revoked by a provider event. Denied cases may accept a configured appeal submission; unsupported appeal returns an explicit next action rather than inventing a workflow. Cancelled is terminal for that case. Answers/decisions remain in history.

Keep cancellation as a separate case field with id, requestedAt, reasonCode, status requested/acknowledged/rejected/unknown, and provider reference. Only confirmed cancellation changes the case state to cancelled; a request, rejection, or uncertain response leaves its prior decision/history visible. Polling the case recovers this operation. A queued local submission may be stopped immediately; an already sent submission follows the configured provider outcome. Replaying the cancellation key returns the same request.

QuestionnaireRecord contains id/version and items with stable linkId, text, type boolean/choice/string/integer/decimal/date, required flag, choices, and optional enableWhen referencing a previous item's value. Define one simple conjunction behavior in v1; do not implement arbitrary executable questionnaire logic. AnswerRecord carries linkId plus a value matching the item type. Save accepts partial answers; submit validates all applicable required items. DocumentReference in the simulator is only { id, filename, contentType, synthetic: true }; it need not upload real files. Errors identify linkId for focus/navigation.

Bind each submission to the exact case/form/answer revisions. Repeated submit with one key returns one submission. Editing a submitted question set requires the next permitted workflow step, not silent resubmission. Product, payer, plan, or scoped prescription changes invalidate applicability and require explicit recheck or a new case. PA can occur before or after NewRx; sending while pending follows the selected holding policy, not an assumed universal prohibition. See [Surescripts pharmacy ePA flow](https://docs.surescripts.com/electronic-prior-auth/guide/electronic-prior-authorization-message-flow).

For pharmacy-benefit drugs, the production route is normally the contracted NCPDP SCRIPT ePA implementation. Medical-benefit medication/service authorization can use the applicable Da Vinci workflow. [Da Vinci PAS scope](https://hl7.org/fhir/us/davinci-pas/en/usecases.html) distinguishes these; do not claim that every drug PA is PAS or that this JSON case API implements either standard on the wire.

### Review, simulated signing, transmission, and cancellation

| Method and path | Request | Response data |
| --- | --- | --- |
| POST /reviews | One patientId and selections: Array<{ prescription: RevisionRef; evaluationId: string; readyToSign: true }>. Each selection associates one order with its evaluation explicitly. | ReviewRecord attributed to the session prescriber, with immutable input references and gate result. Preview evaluations are rejected. |
| POST /signing-sessions | reviewId and current review revision. | SigningSession with determined ordinary/EPCS mode, bound snapshot IDs, expiry, and action kind simulated-challenge/provider-handoff. The server determines mode from product/context. |
| POST /signing-sessions/{id}/completions | session revision and opaque completion reference from the selected adapter. | Completion operation/current session; simulator checks fixture approval outcome, actor, expiry, and bound revisions. Never accept signed: true from a client. |
| GET /signing-sessions/{id} | Session identity. | Current session including terminal outcome and a per-prescription signedArtifact reference. Completion returns 202 with this Location while pending, or 200 when already completed. |
| GET /signed-artifacts/{id} | Artifact identity and permitted patient/actor scope. | Immutable SignedArtifact; used to recover the exact artifact after a lost signing response. |
| POST /transmissions | prescription revision, evaluationId, signedArtifactId, pharmacyId, and transactionType NewRx; Idempotency-Key required. | TransmissionRecord; 202 with queued state and Location. |
| GET /transmissions/{id} | Operation identity. | Current state, timestamps, correlation/message ID, receipt, domain rejection, and retry/reconciliation action. |
| POST /transmissions/{id}/reconciliations | current operation revision and Idempotency-Key. | TransmissionRecord with a queued reconciliation; 202 with Location pointing to GET /transmissions/{id}. Only queries the existing operation's outcome; creates no NewRx or transport attempt. |
| POST /transmissions/{id}/retries | current operation revision, current evaluationId, reasonCode, and Idempotency-Key. | Same logical operation queued with a new attempt entry, only for a known retryable failure after gates pass. Unknown outcomes and nonretryable rejections return 409/422. |
| POST /prescriptions/{id}/cancellations | original artifact/operation reference, reasonCode, current revision, and Idempotency-Key. | CancellationRecord; local cancellation for an unsent artifact or queued simulated CancelRx for a transmitted one. |
| GET /cancellations/{id} | Cancellation identity. | Requested/queued/acknowledged/rejected/unknown outcome and links to the original. |
| POST /prescriptions/{id}/replacements | original reference, reasonCode, and new draft. | New draft ID linked by replacesPrescriptionId. Preserve the original and expose any outstanding cancellation requirement. |
| GET /prescriptions/{id}/events?cursor=... | Stable prescription identity. | Page of event IDs/time/actor/type/outcome/reference IDs for fixture audit/history views. |

ReviewRecord contains id/revision, patientId, prescriber/session actor, individually selected order/evaluation references, applicable decisions, context/policy versions, reviewedAt, and immutable snapshot reference. Each controlled prescription must be explicitly selected by the identified prescribing practitioner; one simulated signing invocation covers only one patient. Label buttons **Simulate signing** and **Simulate send**, and show mode simulation persistently. Do not request real OTPs or credentials. Real provider handoff/proof verification is an EHR adapter responsibility.

SigningSession states are challenge-pending -> completed/declined/expired/invalidated. Successful simulation creates SignedArtifact with ID, prescription revision, immutable content snapshot/fingerprint, prescriber, review reference, signedAt, mode, and simulated true. A hash/fingerprint here detects changed fixture data; it is not a DEA-compliant digital signature. Changes to signed prescribing content use cancellation/replacement, retaining the original artifact. Non-signature administrative updates must be explicitly separated by the production profile.

TransmissionRecord contains id/revision, prescription/signedArtifact/evaluation references, pharmacy, transaction type, external correlation ID, state, createdAt/updatedAt, attemptCount, attempts, receipt, error, and supersedesOperationId where relevant. Attempts contain sequence, message/correlation identity, submittedAt, and outcome. States are queued -> submitted -> acknowledged, rejected, or failed; failed means a known unsuccessful transport attempt, while unknown-outcome means reconciliation is required. “Acknowledged” means the configured simulated destination/network receipt, not dispensing or medication taken. RxFill/dispense information is a separate event/capability if later added.

At send time the fake server independently checks actor, patient, current draft/context/policy revisions, required service freshness, finding decisions, PDMP review, applicable PA hold, signing artifact, and pharmacy capability. It reruns the pure validator with current fixture facts. Reject failures with 422 and stale versions with the declared conflict/precondition response, even if a client button is enabled. Server-owned operation identity makes one logical send unique; unknown-outcome operations reserve that identity until reconciled.

Retries distinguish a lost HTTP response from a known unsuccessful transmission. Replaying the same Idempotency-Key after response loss recovers the original operation. The retry endpoint creates a new attempt under the existing operation with incremented attempt count and distinct attempt correlation, preserving the original prescription/artifact. Never allocate a second NewRx merely because the UI timed out. Reconcile an unknown operation before enabling a retry or fresh transmission action.

Define a transmission provider with submitNewRx(snapshot, correlationId), lookupOutcome(correlationId), and submitCancelRx(originalReference, correlationId). Reconciliation uses lookupOutcome for the existing attempt and retains its source/time evidence. Add TransmissionRecord.reconciliation with status idle/queued/running/complete/unavailable, checkedAt, and outcome acknowledged/rejected/known-not-transmitted/still-unknown. Confirmed receipt maps to acknowledged/rejected; known-not-transmitted maps to a known failed attempt, allowing an eligible retry. Still-unknown or unavailable retains unknown-outcome and reserves the logical send identity. The scheduler completes one lookup; GET only reads it. The simulator supplies a scripted receipt or uncertainty and never makes an external call. A new reconciliation action may be requested after an unavailable/unknown lookup, with a new key; duplicate actions with the same key recover one lookup. Reject a competing new-key lookup while one is queued/running, or reconciliation of an already known terminal outcome, with 409.

Cancellation and replacement do not imply that a pharmacy has reversed dispensing. Local cancellation, CancelRx request, and pharmacy acknowledgement/rejection are distinct. Simulate cancellation rejected and unknown outcomes. If original cancellation is unresolved, show that state alongside the replacement and follow configured policy before sending it. Initial implementation covers NewRx and CancelRx; capabilities report renewal/change/fill/inbound workflows unsupported. Document them as future adapter extensions rather than silently pretending to handle RxRenewal or RxChange.

### Example requests and flow

All identifiers below are synthetic. The exact endpoint schemas above are the authoritative application contract; examples omit unrelated metadata for readability.

```http
POST /api/prescribing/v1/prescriptions
Content-Type: application/json
Idempotency-Key: demo-create-1

{
  "patientId": "sim-patient-1",
  "prescriberId": "sim-prescriber-1",
  "intent": "prescribe",
  "display": "Lasix",
  "prescription": {}
}
```

Return 201 with id rx-0001, contentRevision 1, recordVersion 1, and ETag "rx-0001:1". This draft is saved despite its missing fields. Update through PUT with the current record ETag to preserve the full details; an invented SimDrug A product can be selected for subsequent synthetic clinical scenarios. Do not attach fake clinical findings to Lasix itself.

```http
POST /api/prescribing/v1/evaluations
Content-Type: application/json
Idempotency-Key: demo-evaluation-1

{
  "subject": {
    "kind": "saved",
    "prescription": { "id": "rx-0001", "revision": "1" }
  },
  "services": ["validation", "interactions", "pregnancy", "dosing", "formulary", "benefit"]
}
```

Return 202, Location /api/prescribing/v1/evaluations/ev-0001, and an envelope containing the validation result immediately plus pending checks. The saved Lasix validation reports missing product/detail fields. GET the evaluation after scheduled jobs run; completed fixture providers may report unknown product, partial context, or explicit synthetic findings. Save corrected details to a new revision, then request a new evaluation rather than reusing ev-0001.

The happy path for a complete synthetic prescription is: save -> evaluate -> inspect/resolve permitted findings -> explicitly query/review PDMP if required -> complete PA only if the configured policy holds this action -> create review -> simulate signing -> request transmission -> poll to acknowledgement. A draft may be saved at any point. Changing product/dose/context after evaluation leads back to evaluation; changing signed prescribing content leads to cancellation/replacement.

The UI host passes an AbortSignal to reads/evaluations and ignores late responses whose request ID and subject/context fingerprint no longer match. Abort on order/patient switch and unmount. Aborting a submitted mutation only stops waiting; use resource/idempotency identity to reconcile committed work. Show validation, clinical findings, PDMP review, coverage, PA, and transmission as distinct sections so one passing domain cannot hide another unknown domain.

### Deterministic simulator implementation

Implement createFakeEhrService({ scenarioId, clock, nextId, scheduler, session }) with one cloned store per story/test. Store maps for patients, products, policies, prescriptions, evaluations, decisions, PDMP queries/reviews, PA cases/submissions, reviews, signing sessions/artifacts, transmissions, cancellations, events, and idempotency entries. Use sequential IDs and string revisions; no module-global records, Math.random, hidden real time, or permanent browser storage.

The fake service implements the typed PrescribingApi interface. createFakeFetch dispatches only this client's configured API namespace to the Request/Response router; unexpected routes reject rather than accidentally forwarding to a real EHR. The same handlers support direct service tests and an optional localhost server. Actor/session configuration is passed to the service instance, not inferred from claimed request fields.

Implement mutations in this order:

1. Validate body/header schema, resolve the session actor, and check resource/patient scope.
2. Normalize and look up the idempotency record. Recover an identical committed operation before rejecting a retry solely because its target has since changed; changed requests still conflict.
3. Compare revision preconditions and enforce the state transition/action gates atomically.
4. Mutate the store once, increment relevant revisions, append one event, and save the idempotency result.
5. Schedule declared future state transitions, then return the response. An injected response-loss fault occurs after the commit, preserving the operation for recovery.

Evaluation creation clones an immutable snapshot, calls validatePrescription with fixture policy/context, and schedules providers at explicit scenario delays. Provider completion attaches its result only to that evaluation snapshot; it cannot overwrite a newer evaluation. Final gate recomputation includes all required domains and result freshness. Clock-driven provider events may change context/coverage/PA state and invalidate related evaluations.

Provide a controller with reset(scenarioId), advanceTime(ms), runPendingJobs(), applyContextEvent(fixtureEventId), completeSimulatedChallenge(sessionId, outcome), dispose(), and snapshot() for tests/debugging. applyContextEvent supports fixture events such as record-pregnancy-observation, record-weight, confirm-medication-history, change-coverage, or expire-pdmp-report. It preserves existing drafts, changes relevant source/context revisions, and invalidates affected evaluations. Context-edit controls are clearly demo-only and are not endpoints in the production contract. completeSimulatedChallenge records an opaque adapter completion reference for the client completion endpoint; it cannot produce real signing evidence.

Scenario reset disposes prior timers, drops all stores/idempotency entries, and recreates the service/fixture session. Polling is read-only; only the scheduler/clock advances outcomes. Interactive stories can use a clock/scheduler wrapper that progresses with wall time; tests use a fixed start such as 2026-10-03T12:00:00Z and explicit advances. Dispose stops jobs and aborts waiting reads on unmount. React Strict Mode must not duplicate mutations: create/save/sign/send occur from explicit user actions, not mount effects.

Use named scenario outcomes instead of random failures. Include both failures before commit and response loss after commit. Scheduling events should have operation ID, dueAt, and deterministic order for equal timestamps. Default illustrative latencies can be 0 ms for validation, 100 ms interactions, 150 ms pregnancy/dosing, 250 ms benefits, 400 ms PDMP, 1,000 ms PA decision, and 500 ms transmission acknowledgement; these are simulator settings, not clinical/network performance claims.

Every fixture/provider/response is marked synthetic or mode simulation. The story header and result sections visibly state Simulation. Fixture evidence uses urn:mieweb:simulation references, not fabricated FDA citations. No real credentials, patients, clinical algorithms, external calls, or drug transmissions are required.

### Scenario matrix and expected behavior

| Scenario ID | Fixture setup | Expected API/UI outcome |
| --- | --- | --- |
| lasix-draft | Only display Lasix; no selected product/details. | Draft creation succeeds; shared validation reports missing fields; completion action opens the editor. |
| complete-demo | Invented product with complete fixture facts and no findings within synthetic coverage. | Details/checks pass; simulated review/sign/send reaches acknowledgement. |
| interaction-review | SimDrug A plus invented interacting exposure. | Stable interaction finding requires allowed review/override; decision leaves the finding visible. |
| interaction-history-missing | Known interacting exposure plus incomplete medication history. | Finding and partial coverage coexist; acknowledging the finding does not clear missing required coverage. |
| pregnancy-precaution | Invented product rule plus known applicable pregnancy/lactation fact. | Narrative precaution, dated evidence, and clinical-review action; no pregnancy letter grade. |
| pregnancy-unknown | Missing or stale pregnancy observation. | Partial/unknown check with request for updated facts; no automatic reassurance. |
| dose-high | SimDrug A candidate above its invented per-dose limit. | DEMO_DOSE_HIGH finding with dose/unit, fake range, and correction action. |
| dose-context-missing | Weight-dependent product with missing weight or renal rule with wrong metric. | Missing inputs; no inferred dose adjustment. |
| dose-unit-conversion | Fixture weight in a supported alternate unit or dose in incompatible units. | Explicit supported conversion passes deterministically; incompatible units remain unknown. |
| pdmp-required | Controlled fixture product with no current review. | Sign/send gate remains unresolved until explicit query and eligible report review. |
| pdmp-ambiguous-or-outage | Identity ambiguity, empty matched report, one-jurisdiction outage, or stale report variants. | Each variant retains its own state; none is conflated with completed review. |
| covered-versus-benefit | Covered plan formulary but patient-specific restricted/noncovered benefit, or nonpreferred pharmacy. | Both sources displayed with scope/time; patient-specific estimate remains distinguishable. |
| pa-approved | PA required; questionnaire complete; approval after delay. | Case progresses to approval with scoped validity; configured hold clears only for the matching draft/context. |
| pa-denied-more-info | Denial or additional-information event. | Reasons and permitted next step; new questionnaire version for additional information. |
| pa-pending-send-allowed | Same pending PA but fixture policy permits transmission. | Coverage/PA remains pending while simulated transmission can proceed. |
| provider-unavailable | Clinical, benefit, or PDMP provider unavailable. | Partial/unavailable domain, visible retry action, unknown required gate. |
| stale-edit-and-conflict | Two editors or a late evaluation response after a dose/context change. | If-Match conflict is explicit; stale result never overwrites current readiness. |
| override-invalidated | Save new dose or change implicated context after an override. | Prior decision remains historical and no longer resolves the new evaluation. |
| signing-declined-expired | Fixture prescriber denies or challenge expires. | No signed artifact; transmission request rejected. |
| send-rejected | Network/provider rejects a submitted operation. | Distinct rejection/correlation; no Sent/dispensed claim. |
| send-response-lost | Send commits but HTTP response is lost. | Replay same key returns original operation; one NewRx; reconciliation resolves unknown state. |
| send-unknown-reconciliation | Provider cannot initially determine delivery; scripted lookup returns a receipt, known-not-transmitted, or still-unknown. | Explicit reconciliation creates no send attempt. Only a proven failed delivery allows the retry endpoint; uncertainty remains visible and locked against duplicate NewRx. |
| cancellation-rejected | CancelRx rejected or uncertain, then replacement drafted. | Original/cancellation/replacement all visible; policy decides whether replacement transmission can proceed. |
| reset-readonly-permissions | Reset scenario, read-only actor, or unsupported service. | No leaked state/jobs; role/capability errors explicit; draft issues remain visible. |

### Junior developer implementation order and tests

1. Define request/response schemas, the PrescribingApi methods matching the endpoint table, and OpenAPI paths/examples. Run schemas against every fixture before UI work.
2. Implement capabilities/context/catalog and draft CRUD with a per-instance store, revision preconditions, and idempotency. Prove incomplete Lasix saves/reopens losslessly.
3. Implement evaluation snapshots and shared validation. Add the three synthetic clinical providers, then asynchronous completion/freshness and gate reduction.
4. Add PDMP explicit query/review and independent formulary/benefit results. Test missing, partial, unavailable, and scoped context.
5. Implement PA questionnaire/answer/submission state transitions and both hold/no-hold policies. Add scoped approval and new-questionnaire scenarios.
6. Implement review, simulated challenge/artifact, transmission operation, reconciliation, and cancellation/replacement. Preserve immutable signed snapshots.
7. Add the HTTP router and typed fetch client over the same methods, then connect FakeEhrStoryHost through that client. Add abort/late-result protection and scenario reset.
8. Add scenario stories, contract documentation, focused unit/HTTP/UI tests, and built-entry checks. An optional Node wrapper reuses the router after these tests pass.

Test that every route's success/error body matches its schema; client and fake server call the same validator with equivalent facts; unknown services cannot create passing required gates; and clinical findings do not depend on real drug-name guesses. Check deterministic IDs/order, JSON round trips, clock expiry boundaries, decision invalidation, questionnaire versions, and approved-case scope.

Use existing Vitest fake timers and injected fetch/Response patterns. Add a separate vitest.prescribing-node.config.ts with environment node, setupFiles: [], and an explicit include for the pure validator/API contract tests. The existing src/test/setup.ts accesses window and installs React/browser helpers, so changing only a test file's environment annotation is insufficient. Run these tests with vitest run --config vitest.prescribing-node.config.ts, alongside the ordinary jsdom component tests. Verify browser and Node fixtures return identical validation results and the built pure entry imports in Node without React or window. UI tests should use the real typed client against fake fetch, not bypass the API with ad hoc callback return values.

Exercise idempotent create/save/submit/send retries, different payload with reused key, revision conflicts, late provider responses, abort before versus after commit, response loss, polling without advancing time, and terminal-state polling cleanup. One patient per review/sign session, each order explicitly selected, no fake signature accepted on a different revision, and no silent batch-success result when an item failed. A batch transport helper may return per-order operation/results but never shares one signing invocation across patients.

Done means a junior developer can run the Storybook workflow from draft to simulated acknowledgement, force each named failure from the scenario controls, inspect complete request/response records, and reset without retained jobs or data. The production EHR can replace the API client base URL/service implementation without changing prescription rows or the shared validator.

## Applicable standards and implementation references

These references guide data/adapter boundaries. Our application DTOs and simulation settings are proposed engineering choices. A production adapter must pin the adopted profile/version, obtain required licensed specifications, and verify the relevant implementation/certification scope.

| Area | Reference and how to use it |
| --- | --- |
| API description and errors | [OpenAPI 3.1.1](https://spec.openapis.org/oas/v3.1.1.html), [HTTP semantics](https://www.rfc-editor.org/rfc/rfc9110.html), and [Problem Details](https://www.rfc-editor.org/info/rfc9457/). Describe JSON schemas/operations, ETag preconditions, asynchronous responses, and error objects. Our idempotency behavior is an explicit API convention. |
| e-prescribing standards and version scope | [CMS adopted standards/transactions](https://www.cms.gov/medicare/regulations-guidance/electronic-prescribing/adopted-standard-and-transactions) identifies SCRIPT 2023011 for the relevant Medicare Part D scope beginning January 1, 2028, and F&B 60/RTPB 13 beginning January 1, 2027. Configure versions rather than assuming every EHR uses the same profile today. |
| Full NCPDP specifications | [NCPDP standards access](https://standards.ncpdp.org/Access-to-Standards.aspx). Obtain the applicable licensed standards, schemas, guides, code lists, and implementation recommendations for production adapters; this plan does not reproduce them. |
| Surescripts network behavior | [E-prescribing guide](https://docs.surescripts.com/eprescribing/guide), [RTPB guide](https://docs.surescripts.com/rtpb-providers/guide), and [ePA guide](https://docs.surescripts.com/electronic-prior-auth/guide). Some public guides contain early-adopter or nonfinal material; confirm the contracted production version/certification rules. |
| Controlled-prescription content/signing | [21 CFR 1306.05](https://www.ecfr.gov/current/title-21/section-1306.05), [1311.120](https://www.ecfr.gov/current/title-21/chapter-II/part-1311/subpart-C/section-1311.120), and [1311.140](https://www.ecfr.gov/current/title-21/chapter-II/part-1311/subpart-C/section-1311.140). Use the content, review, signing, and immutable-record constraints already described; simulation provides no DEA compliance or real signature. |
| Medication data mapping | [FHIR R4 MedicationRequest](https://hl7.org/fhir/R4/medicationrequest.html), [Dosage](https://hl7.org/fhir/R4/dosage.html), [MedicationStatement](https://hl7.org/fhir/R4/medicationstatement.html), [AllergyIntolerance](https://hl7.org/fhir/R4/allergyintolerance.html), and [Observation](https://hl7.org/fhir/R4/observation.html). Useful optional mappings for orders, exposure, allergy verification, regimen, measurements, and missing facts; no FHIR server is required for the fake API. |
| Finding/error/provenance mapping | [FHIR R4 DetectedIssue](https://hl7.org/fhir/R4/detectedissue.html), [OperationOutcome](https://hl7.org/fhir/R4/operationoutcome.html), and [Provenance](https://hl7.org/fhir/R4/provenance.html). Distinguish clinical findings/mitigation from operation errors and source/revision evidence. |
| Clinical decision support integration | [CDS Hooks](https://cds-hooks.hl7.org/) supplies an optional workflow/card/feedback interface; [CQL](https://cql.hl7.org/03-developersguide.html) is a separate expression standard with missing-information semantics. Neither supplies a clinical knowledge base, and implementing a CDS Hooks server or CQL interpreter is not required here. |
| Drug identity and product codes | [RxNorm overview](https://www.nlm.nih.gov/research/umls/rxnorm/overview.html), [RxNav limitations](https://www.lhncbc.nlm.nih.gov/RxNav/information/FAQs.html), and [FDA NDC directory](https://www.fda.gov/drugs/drug-approvals-and-databases/national-drug-code-directory). Keep coding specificity/version and profile-specific formats; an NDC listing is not proof of approval and terminology is not a clinical safety engine. |
| Clinical units and pregnancy evidence | [UCUM](https://ucum.org/ucum), [FDA PLLR](https://www.fda.gov/drugs/labeling-information-drug-products/pregnancy-and-lactation-labeling-resources), [US Core pregnancy observation](https://hl7.org/fhir/us/core/StructureDefinition-us-core-observation-pregnancystatus.html), and [DailyMed source description](https://dailymed.nlm.nih.gov/dailymed/about-dailymed.cfm). Preserve units, dated facts, narrative precautions, and label provenance. |
| PDMP | [ASTP/ONC](https://healthit.gov/pharmacy-pdmp/), [Indiana INSPECT](https://www.in.gov/pla/inspect/), and [CDC guidance](https://www.cdc.gov/overdose-prevention/hcp/clinical-guidance/prescription-drug-monitoring-programs.html). Identify jurisdiction/provider requirements, report access and review, identity matching, and scope; there is no single nationwide API assumed by this contract. |
| Medical-benefit requirements/PA | [Da Vinci CRD](https://www.hl7.org/fhir/us/davinci-crd/en/index.html), [DTR](https://hl7.org/fhir/us/davinci-dtr/en/index.html), and [PAS scope](https://hl7.org/fhir/us/davinci-pas/en/usecases.html). Optional adapters for coverage requirements, documentation, and medical-benefit authorization; keep pharmacy-benefit SCRIPT ePA distinct. |

Public summaries cannot settle every production requirement. In particular, real interaction/pregnancy/dosing content needs maintained evidence and clinical review, PDMP rules depend on the jurisdiction, and payer/network details depend on the contract. The simulator can be implemented completely from the explicit synthetic scenarios and API behavior above while those production adapters are developed separately.
