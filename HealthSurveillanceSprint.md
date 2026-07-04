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
- [ ] occupational.tsv: OPM GS-1811, USCG CG-719K, MSHA/NIOSH CWHSP, NRC Part 26, DOE HRP, USCIS I-693
- [ ] build-index DOMAINS: OPM, USCG, MSHA, NIOSH, NRC, DOE, USCIS codetypes
- [ ] programs.json entries with verified order codes
- [ ] aliases: 1811, b-read, hrp, civil surgeon, mariner
- [ ] Rebuild shards + browser verify

## Phase 3 — eCQMs: quality domain
- [ ] Curated quality.tsv (CMS measures: 122, 125, 130, 117, 147, 153, …)
- [ ] programs.json quality entries with age/sex/periodicity criteria
- [ ] Engine: quality families keyed by measure id; component color + noun
- [ ] QualityMeasures story
- [ ] Rebuild shards + browser verify

## Phase 4 — PatientHistory + due engine
- [ ] history.ts: PatientHistory types (orders w/ status, observations, procedures, conditions, allergies, age, sex)
- [ ] evaluate.ts: evaluateDue(history, programs) → due/overdue/pending/satisfied/not-applicable
- [ ] Vitest unit tests for evaluation logic

## Phase 5 — HealthSurveillance component
- [ ] Due list + Done list rendered from evaluateDue
- [ ] Multi-select order picklist (checkboxes → "Add N orders", onOrderMany)
- [ ] dueForOrder helper for ordering prompts/alerts
- [ ] Assessment interop: picks carry program concern linkage

## Phase 6 — chart demo story
- [ ] Sample patient history (55 F factory worker; noise + lead programs; CMS125/130 due)
- [ ] Story panels: Due/Done list, Medications, Allergies, Conditions, Lab results
- [ ] Assessment variant with program-as-concern + due orders

## Phase 7 — docs, tests, CI
- [ ] READMEs: programs.json format, history schema, evaluate semantics
- [ ] Unit tests: findByCodes, familyKey domains
- [ ] Lint/build green, commit

## Progress log
- 2026-07-04: Sprint file created; starting Phase 1.
- 2026-07-04: Phase 1 done — programs.json (kind/periodicity metadata) replaces
  order-sets.json; worker fallback + programsUrl override; 'programs' worker
  message for the due engine; verified lead drill resolves 5 orders.
