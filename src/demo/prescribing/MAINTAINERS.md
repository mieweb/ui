# Prescribing simulator maintainer notes

The public contract lives in `src/prescribing/api`; the shared pure validator
lives in `src/prescribing`. This directory is a source-only demonstration EHR
implementation. Do not export its fixture data or host through package entries.

`createFakeEhrService` implements the typed API. Its generic request handler owns
the records and transitions; named methods use the same HTTP client/router.
`router` checks success envelopes and Problem Details against the public runtime
schemas. `createFakeFetch` refuses other origins/namespaces and preserves the
request clone before JSON is consumed, so exchange inspection includes bodies,
query strings, revision headers and idempotency keys. A real EHR can implement
the same endpoints with maintained providers and its session transport.

Each service creates its own cloned store, session, clock, scheduler and IDs.
Tests use an explicit UTC starting timestamp and advance time. GET reads never
run a job or change a resource revision. `runPendingJobs` drains operational jobs
and leaves `expiry:` jobs for an explicit time advance. Reset drops records,
idempotency history and jobs; dispose stops jobs. Injected ID/clock implementations
remain owned by their caller. New date handling uses Luxon with an explicit zone.

Content revisions bind evaluation/review/artifact references; record versions
bind mutable prescription ETags. Evaluation inputs are immutable snapshots.
Projection revisions change for changed response contents, including a provider
result arriving while other providers remain pending. An unchanged gate read
does not consume a revision. Clinical changes stale the old snapshot; refreshed
workflow links can restore an expired PDMP/PA prerequisite while clinical facts
remain current. Fingerprints are sorted correlation strings, not signatures.

Mutation schema, identity/scope, idempotency recovery, preconditions and action
gates precede the store mutation. Foreign workflow links are checked before
allocating the evaluation. Reused keys return the committed result; changed
requests conflict. Response loss occurs after committing a transmission, so
recovery must reuse its key. Unknown delivery reserves the logical operation;
reconciliation adds no send attempt. Only a known retryable failure can add an
attempt to that operation. Cancellation requests and responses retain the
original artifact, transmission and replacement history.

Provider rules apply only to invented products and explicitly covered pairs or
regimens. Evidence uses `urn:mieweb:simulation` references and `synthetic: true`.
Unsupported routes, units, products, observations, history and provider outages
remain partial/unknown. Observation time determines freshness; retrieving an old
fact does not renew it. Never add real-drug safety or dosing guesses to fixtures.
All schedules, PDMP requirements, questionnaire decisions and prices here are
fictional demonstration choices.

The Storybook host creates services in an effect without mutation-on-mount, so
Strict Mode cleanup/reset is safe. It passes components controlled values and
callbacks through the real typed API client. Selecting a product and pharmacy
is explicit. Save draft is permissive. Unsaved visible changes suppress review,
sign and send of the previous saved content. Reads merge only the live selected
resource/scope and a current-or-newer projection revision. Generation tokens and
AbortSignals reject work after reset/unmount. The mounted demo clock advances
every 500 ms; pending reads stop after 30 seconds with manual refresh available.

Prescription issues use a collapsed floating summary capped at 20% of the dynamic
viewport height, including its header. Expanded issues scroll within that panel.
The host hides its panel while the editor is open; the editor keeps a compact panel
above its scrolling body. Medication, pharmacy, and detail fields also show their
scoped issues inline with accessible descriptions. Keep both presentations on the
same current validation/workflow scope and preserve permissive draft saving.

Run `pnpm exec vitest run src/demo/prescribing` for service, all declared HTTP
routes, scenario/variant, questionnaire and real-client UI coverage. Root visual
tests exercise the rendered editor, PDMP, PA, failure/recovery and theme/mobile
flows. Add a named scenario/variant and its expected behavior before adding a
scripted provider outcome. Keep production integration responsibilities in
`docs/prescribing-api.md` and standards references in `prescribe-plan.md`.
