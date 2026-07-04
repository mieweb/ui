# Health Surveillance Sprint

Tracking the multi-phase build of health surveillance: programs metadata,
new regulated verticals, eCQMs, patient history + due engine, and the
HealthSurveillance component. Repos: mieweb/ui (branch `clinical-components`,
PR #299) and mieweb/codify (`packages/codify`, branch `main`).

## Phase 1 — programs.json metadata model
- [x] programs.json supersedes order-sets.json (orders + kind + periodicityMonths + age/sex)
- [x] build-index.mjs copies programs.json to each locale output
- [x] Worker loads programs.json (falls back to order-sets.json), returns program metadata with drill results
- [x] CodeLookup `programsUrl` prop — developer/employer metadata override
- [x] Verify: MedicalSurveillance story drill unchanged

## Phase 2 — new regulated verticals
- [x] occupational.tsv: OPM GS-1811, USCG CG-719K, MSHA/NIOSH CWHSP, NRC Part 26, DOE HRP, USCIS I-693 (+ DoDI 6130.03)
- [x] build-index DOMAINS: OPM, USCG, MSHA, NIOSH, NRC, DOE, USCIS, DOD codetypes
- [x] programs.json entries with verified order codes
- [x] aliases: cwhsp, hrp, i693, mariner (1811 matches via label token)
- [x] Rebuild shards + browser verify

## Phase 3 — eCQMs: quality domain
- [x] Curated quality.tsv (CMS measures: 122, 124, 125, 130, 117, 147, 127, 153)
- [x] programs.json quality entries with age/sex/periodicity criteria
- [x] Engine: quality families keyed by measure id; component color + noun
- [x] QualityMeasures story
- [x] Rebuild shards + browser verify

## Phase 4 — PatientHistory + due engine
- [x] history.ts: PatientHistory types (orders w/ status, observations, procedures, conditions, allergies, age, sex)
- [x] evaluate.ts: evaluateDue(history, programs) → due/overdue/pending/satisfied/not-applicable
- [x] Vitest unit tests for evaluation logic (12 passing)

## Phase 5 — HealthSurveillance component
- [x] Due list + Done list rendered from evaluateDue
- [x] Multi-select order picklist (checkboxes → "Add N orders", onOrderMany)
- [x] dueForOrder helper for ordering prompts/alerts
- [x] Assessment interop: SurveillanceOrderPick carries programKey/programLabel for concernId linking

## Phase 6 — chart demo story
- [x] Sample patient history (55 F factory worker; noise + lead + BBP programs; CMS measures)
- [x] Story panels: Due/Done list, Medications, Allergies, Conditions, Lab results (ChartDemo)
- [ ] Assessment variant with program-as-concern + due orders (follow-up: compose Assessment + HealthSurveillance in one story)

## Phase 7 — docs, tests, CI
- [x] CodeLookup README: programs.json format, programsUrl override, health-surveillance umbrella
- [x] history/evaluate semantics documented inline + story autodocs
- [x] Unit tests: familyKey/familyTerm/normalize (engine), due engine — 21 passing
- [x] Lint + typecheck green, committed on clinical-components

## Progress log
- 2026-07-04: Sprint file created; starting Phase 1.
- 2026-07-04: Phase 1 done — programs.json (kind/periodicity metadata) replaces
  order-sets.json; worker fallback + programsUrl override; 'programs' worker
  message for the due engine; verified lead drill resolves 5 orders.
- 2026-07-04: Phase 2 done — 8 new verticals (29 programs total); GS-1811
  drill resolves vision/audiometry/EKG/lipid/drug screen; hrp, i693, cwhsp,
  mariner aliases verified in browser.
- 2026-07-04: Phase 3 done — quality domain (eCQM codetype, 8 CMS measures)
  with age/sex/periodicity metadata; CMS130 drill resolves colonoscopy + FIT.
- 2026-07-04: Phase 4 done — PatientHistory types + pure due engine
  (evaluateProgram/evaluateDue/dueForOrder) with enrollment semantics for
  occupational vs quality; 12 unit tests passing.
- 2026-07-04: Phases 5+6 done — HealthSurveillance component (due/done lists,
  multi-select order picklist) + DueList/ChartDemo stories; browser-verified:
  overdue lead & A1c, "Add 4 orders" batch linked to the lead program.
  Note: an old shared browser tab had environmental /codify/* request
  blocking — fresh tab works; not a product issue.
- 2026-07-04: Phase 7 done — README section, engine + due-engine tests (21
  passing), lint/typecheck green. Follow-ups: Assessment+HealthSurveillance
  composite story; dueForOrder badges inside the Assessment add-order flow;
  allergy domain extract.
- 2026-07-04: Post-sprint: Assessment "Add concern" wording; concerns rank
  first in auto (preferDomains tiers + viaFuzzy guard); ICD-10 boosted over
  SNOMED (boostCodetypes); billableOnly leaf-ICD-10 filter + story.
- 2026-07-04: Structured program orders — { alt } one-of groups (colonoscopy
  OR FIT, mutually exclusive checkboxes) and { key, after } dependencies
  (RMO fitness-for-duty determination blocked until panel results complete;
  supports multiple determinations per panel/SEG). Due-list picklist renders
  dependency lanes with disabled "after …" entries; 26 tests green.
