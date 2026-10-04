# Implementing the prescribing EHR API

`@mieweb/ui/prescribing` contains the pure shared validator and JSON contracts. `@mieweb/ui/prescribing/api` contains the HTTP client, runtime schemas, EHR API interface and readiness projection. The UI takes controlled records/results and callbacks. The consuming EHR owns persistence, authorization, clinical providers, signing and transmission.

The development service under `src/demo/prescribing` implements the same HTTP contract with invented patients/products. Its clinical findings and signing/transmission outcomes are **Simulation**. It makes no clinical, payer, PDMP or pharmacy network calls. An unresolved real-name draft such as Lasix receives missing-input/unknown results, never invented safety findings.

## Run and inspect

```bash
pnpm install
pnpm storybook
pnpm test:prescribing:node
pnpm exec vitest run src/prescribing src/demo/prescribing
pnpm typecheck
pnpm catalog:check
pnpm build
node scripts/generate-prescribing-openapi.mjs
```

The generated [OpenAPI 3.1.1 contract](https://github.com/mieweb/ui/blob/HEAD/docs/prescribing-api.openapi.yaml) is JSON-form YAML and contains all 37 operations. Source of truth is `src/prescribing/api/schemas.ts`; regenerate after changing a schema/operation, then commit the generated document with the code. The dedicated Node Vitest config excludes browser setup; ordinary Vitest runs the same pure tests in jsdom.

## Connect an EHR

```ts
import { validatePrescription } from '@mieweb/ui/prescribing';
import {
  createHttpClient,
  evaluationToReadiness,
  PrescribingApiError,
} from '@mieweb/ui/prescribing/api';

const api = createHttpClient({ baseUrl: '/api/prescribing/v1' });
// Keep this key with the pending operation until its outcome is known.
const created = await api.createPrescription(
  {
    patientId,
    prescriberId,
    intent: 'prescribe',
    display: 'Lasix',
    prescription: {},
  },
  { idempotencyKey: pendingDraftKey }
);
const rx = created.body.data;
const evaluated = await api.createEvaluation(
  {
    subject: {
      kind: 'saved',
      prescription: { id: rx.id, revision: rx.contentRevision },
    },
    services: [
      'validation',
      'interactions',
      'pregnancy',
      'dosing',
      'formulary',
      'benefit',
    ],
  },
  { idempotencyKey: pendingEvaluationKey, signal }
);
const readiness = evaluationToReadiness(
  evaluated.body.data,
  evaluated.body.meta.mode
);
// Pass readiness and completion callbacks into the controlled UI components.
```

Inject `fetch`, session headers or `credentials` when the host uses a different session transport. Every named method is typed; `request<T>` also supports the documented methods/paths and checks runtime schemas. Treat `PrescribingApiError.problem` as an operation failure and keep clinical findings in domain panels. Do not display success for a malformed response; the client rejects it.

Resolved product facts include catalog identity/coding/version, concept specificity, strength and dosage form. The demo profile requires that trusted metadata and rejects mismatched entered product/code/strength/form. Unavailable metadata and unsupported ingredient/compound paths remain unknown. The editor can consume authoritative metadata through the injected medication lookup; parsing a display label cannot establish product identity.

On the server, choose the active policy and load current context from trusted records, then call `validatePrescription(input, policy)`. Never accept the client's computed result, policy choice, role or signature flag as evidence. The client and server use the same validator implementation. The pure entry has no React, fetch, browser globals or simulator imports.

## Persistence and concurrency

A nonempty display name is the draft minimum. Optional prescription values, including malformed quantity/refill text, remain savable so another team member can complete them. Validation reports missing/invalid values separately. Canonical `prescription` fields drive the editor and are projected atomically into legacy display/Sig/code fields; never update a visible drug name while retaining an earlier eligible product.

`contentRevision` changes only for prescribing content edits. References in evaluation/review/artifacts use that revision. `recordVersion` changes for any returned representation change and determines the strong ETag (`"rx-0001:1"`). Read the latest ETag before PUT; do not use contentRevision as an If-Match value. Evaluation, PA, PDMP and signing resources have their own revisions.

Require `Idempotency-Key` for every POST/PUT. Scope it by session/tenant, actor, route and canonical body/precondition. Replay an identical committed request before rejecting stale preconditions; recover its original operation. Different content with the same key returns 409. Retain keys for the entire simulation session; a production implementation must define durable retention. Timeout/AbortSignal stops waiting and does not undo a committed mutation.

Return 400 for malformed JSON/body/action values or a missing required precondition; 401/403 for session/scope; 404 for unknown resources; 412 for an If-Match conflict; 409 for an invalid transition or key conflict; 422 for a blocked sign/send action; 429/503 for overall service availability. Use RFC 9457 `application/problem+json`. Domain-provider failure stays inside an evaluation check as partial/unavailable.

## Evaluate and reduce gates

Create an immutable clinical snapshot of the prescription, related same-patient prescriptions, patient/prescriber/pharmacy context, policy and knowledge-pack versions. `inputFingerprint` correlates that scope. It is not a cryptographic signature. Preview evaluations support feedback but cannot persist decisions, reviews, signatures or transmissions.

Each requested check reports status, outcome, evaluated/excluded subjects, missing inputs, source evidence and timestamps. A result with no findings only clears its declared covered subjects. Unsupported products/pairs, missing history, stale facts, unavailable providers and unknown outcomes remain unknown. Clinical services may find issues even when other prescription fields are missing. Refreshing an old observation's retrieval date does not refresh its effective date.

For each stage, a known required failure or unresolved blocking finding yields fail. Otherwise required pending/missing/partial/unavailable/not-requested/expired evidence yields unknown. Pass requires completed sufficient coverage and permitted resolutions of applicable findings. The client's requested-service list cannot omit a required check to obtain pass.

Review requires current saved content, completed pre-review domains and the permitted actor. Sign adds the named prescriber's current explicit ready selection. Transmit adds the matching immutable signed artifact, destination capability and pre-transmit domains/PDMP/PA rules. These are separate gates. Field completeness alone cannot produce Ready to send.

`POST /evaluations/{id}/decisions` records an allowed acknowledgement/override, its reason, actor and clinical scope; the finding remains visible. A decision does not repair missing data, unavailable services, invalid values, missing signatures or payer denial. A changed implicated draft/context invalidates its applicability.

Use `PUT /evaluations/{id}/workflow-context` to replace both PDMP and PA links (ID or null), with the current evaluation ETag. Verify scope/freshness server-side. Workflow changes recompute `workflowFingerprint`, projection revision and gates without rerunning an unchanged clinical snapshot. Clinical/context changes require a new evaluation.

Compute the earliest applicable expiry. The host refreshes at expiry/on focus/resume and rejects late/older projections. The readiness component suppresses elapsed passing results. `shouldAcceptEvaluation` checks clinical scope and monotonic projection revision; abort reads on patient/order switch. Poll reads at 500 ms with backoff capped at 5 seconds, stop at terminal/unmount, and after 30 seconds retain visible pending with manual refresh. These are configurable UI settings.

## Provider boundaries

| Domain              | Implement and return                                                                                                                  | Simulation scope                                                                                               |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Validation          | Same `validatePrescription` with server-owned facts/profile/time.                                                                     | Explicit demo profile, presence/format/date/refill/unit/context rules.                                         |
| Interactions        | Candidate plus exposures/proposed orders, reviewed medication/allergy history, versioned clinical evidence.                           | Invented ingredient pairs, duplicate therapy and allergy findings with declared covered/unsupported pairs.     |
| Pregnancy           | Dated pregnancy, lactation and reproductive intent, gestational age when needed, narrative label evidence.                            | Invented narrative precautions; unknown/stale facts remain partial. No letter category or pregnancy-safe flag. |
| Dosing              | Administered dose versus product strength/dispensing quantity, route, timing/PRN maximum, indication, age/measurements/renal method.  | Invented dose limits and explicitly supported units. Unknown regimen/unit/method does not yield an adjustment. |
| PDMP                | Explicit authorized query, jurisdiction results, identity match, report revision/freshness, separate permitted review.                | Fictional controlled-product rule and distinct empty/ambiguous/outage/stale/unreviewed outcomes.               |
| Formulary/benefit   | Separate plan formulary and member/pharmacy/product/quantity cost inquiry. Preserve limitations/source/time.                          | Plan-covered versus patient restriction, nonpreferred pharmacy, unknown cost and PA requirement.               |
| Prior authorization | Product/quantity/plan-scoped case, questionnaire/version, partial answers, submission/decision/validity and independent cancellation. | Approval/denial/more-info/expiry and configurable send hold.                                                   |
| Transmission        | `submitNewRx`, `lookupOutcome`, `submitCancelRx` with durable logical identity, attempts and receipts.                                | Scripted acknowledgements/rejection/known failure/uncertainty, response loss/retry/reconciliation/cancel.      |

`ClinicalKnowledgeProvider`, `CoverageProvider` and `TransmissionProvider` describe replaceable asynchronous boundaries. Provider snapshots contain the canonical draft/context, resolved products, explicit policy/version/time and related orders. The fake implementation uses a small versioned rule pack rather than a real knowledge engine. Production providers must preserve missing-information and source semantics when mapping their own result shapes.

## PDMP and prior authorization

PDMP is an explicit action, never a keystroke side effect. Fetching a report is not its review. Only a current matched report with sufficient required jurisdiction coverage and an eligible reviewer can satisfy the fictional fixture policy. No risk score grants or denies eligibility.

PA has its own lifecycle and cancellation; cancelling PA does not cancel a prescription. Save partial answers, but submission requires the current form/version, enabled required answers and permitted actor. `enableWhen` is a simple conjunction of typed comparisons, not executable JavaScript. Additional-information requests issue a new questionnaire version. Reject duplicate/unknown item IDs and stale form submissions. Approval is scoped to product/quantity/plan/effective period; it never becomes a patient-wide boolean.

A PA requirement, noncovered benefit or unknown estimate is displayed independently of clinical readiness. The configured policy decides whether transmission is held. A permitted proceed decision does not turn a denial into approval or an unknown price into zero.

## Review, simulated signing and sending

Review explicitly selects each saved order/evaluation as ready for signing, attributed to the named prescriber, for one patient. Staff may prepare drafts but cannot claim that prescriber's review. Create a signing session bound to that review. The simulation controller supplies an opaque invented adapter completion reference; the completion endpoint verifies actor, bound revisions, outcome and expiry. Client `signed: true` is invalid.

A completed session exposes per-prescription artifacts recoverable through GET. Each artifact preserves its immutable content snapshot, revision, prescriber, review, timestamp and simulation marker. Changes to signed prescribing content require cancellation/replacement; ordinary draft PUT returns `SIGNED_CONTENT_IMMUTABLE`.

One logical NewRx operation owns attempts and correlation IDs. Acknowledgement means the configured receipt, not dispensing. A lost HTTP response is recovered by replaying the same key. An unknown delivery outcome reserves that identity and requires reconciliation; a GET never sends, retries or reconciles. `POST /transmissions/{id}/reconciliations` uses the existing correlation and creates no attempt. Only proven unsuccessful retryable delivery permits the retry endpoint with a new attempt under the same operation.

CancelRx request, local cancellation, pharmacy acknowledgement, rejection and uncertainty remain distinct. Replacement preserves the original artifact and cancellation relationship; policy controls sending while cancellation is unresolved. NewRx/CancelRx are the initial capabilities. Renewal/change/fill/inbound workflows are explicitly unsupported extensions.

## Junior developer verification checklist

1. Run every fixture through runtime schemas and the pure validator in Node and browser environments.
2. Prove bare-name and invalid-text drafts save, reopen and round-trip without loss, including zero refills/substitution/therapy dates.
3. Prove context/product changes invalidate evaluation/decision/signing eligibility and late provider results never overwrite a newer projection.
4. Exercise required-service omission, unavailable/partial/expired results, blocking findings and permitted/forbidden decisions.
5. Exercise PDMP explicit query/review, ambiguity/outage/empty/stale results, PA scope/form versions/hold-versus-no-hold.
6. Exercise signing decline/expiry/actor/revision checks, response loss, key conflicts, known retry, unknown reconciliation, cancellation and replacement.
7. Check every success/error HTTP body against the same schemas as the client/OpenAPI, including readable Location and strong ETag behavior.
8. Run the interactive story through the real typed HTTP client, then reset scenarios and confirm there are no retained jobs/records or unauthorized mutation controls.

## Standards and production responsibilities

The [implementation plan](https://github.com/mieweb/ui/blob/HEAD/prescribe-plan.md#applicable-standards-and-implementation-references) records the applicable primary references and version scope. Consult [OpenAPI 3.1.1](https://spec.openapis.org/oas/v3.1.1.html), [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html) and [RFC 9457](https://www.rfc-editor.org/info/rfc9457/) for the application transport. For production e-prescribing use [CMS adopted standards](https://www.cms.gov/medicare/regulations-guidance/electronic-prescribing/adopted-standard-and-transactions), licensed [NCPDP specifications](https://standards.ncpdp.org/Access-to-Standards.aspx), and the integration's [Surescripts guides](https://docs.surescripts.com/eprescribing/guide). Optional mappings use [FHIR R4 MedicationRequest](https://hl7.org/fhir/R4/medicationrequest.html), [DetectedIssue](https://hl7.org/fhir/R4/detectedissue.html), [CDS Hooks](https://cds-hooks.hl7.org/), and [Da Vinci PAS scope](https://hl7.org/fhir/us/davinci-pas/en/usecases.html); this API is not a claim of conformance to those profiles.

The EHR must separately implement durable authorization/audit, real signing credentials and verification, network certification/transport, maintained clinical content, PDMP jurisdiction access and payer/PA connections. The UI simulation provides no DEA certification, real clinical guidance or pharmacy transmission. References for controlled content/signing, pregnancy labeling, drug terminology/units and jurisdiction-specific PDMP are retained in the plan rather than encoded as speculative production requirements.
