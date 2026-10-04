'use client';

import { validatePrescription } from '../../prescribing/validate';

import * as React from 'react';
import { DateTime } from 'luxon';
import { Button } from '../../components/Button';
import {
  MedicationEditor,
  type MedicationLookupProps,
} from '../../components/MedicationList/MedicationEditor';
import type { Medication } from '../../components/MedicationList/MedicationList';
import {
  PrescriptionIssueSummary,
  getPrescriptionIssues,
  isPrescriptionReadinessCurrent,
} from '../../components/PrescriptionReadiness';
import {
  demoPrescriptionPolicy,
  prescriptionDetailFields,
} from '../../prescribing/policy';
import type {
  PrescriptionDraft,
  PrescriptionIssue,
} from '../../prescribing/types';
import type {
  EvaluationRecord,
  PdmpQueryRecord,
  PrescribingApi,
  PrescriptionRecord,
  PharmacyRecord,
  PriorAuthorizationCase,
  QuestionnaireAnswer,
  QuestionnaireRecord,
  ReviewRecord,
  SigningSession,
  TransmissionRecord,
  CancellationRecord,
} from '../../prescribing/api/contracts';
import {
  createHttpClient,
  evaluationToReadiness,
  shouldAcceptEvaluation,
} from '../../prescribing/api/createHttpClient';
import { createFakeEhrService } from './createFakeEhrService';
import type { FakeEhrService } from './createFakeEhrService';
import { createFakeFetch } from './createFakeFetch';
import { getScenario, prescribingScenarios } from './scenarios';
import { clone, canonical } from './scheduler';
import { SyntheticMedicationLookup } from './SyntheticMedicationLookup';

export interface FakeEhrStoryHostProps {
  initialScenario?: string;
  initialVariant?: string;
  /** Manual mode makes UI tests deterministic; stories advance the fake clock. */
  automaticClock?: boolean;
}
interface Bundle {
  service: FakeEhrService;
  client: PrescribingApi;
  generation: number;
}
interface Workflow {
  prescription: PrescriptionRecord | null;
  evaluation: EvaluationRecord | null;
  pdmp: PdmpQueryRecord | null;
  pa: PriorAuthorizationCase | null;
  questionnaire: QuestionnaireRecord | null;
  review: ReviewRecord | null;
  signing: SigningSession | null;
  transmission: TransmissionRecord | null;
  cancellation: CancellationRecord | null;
}
const EMPTY: Workflow = {
  prescription: null,
  evaluation: null,
  pdmp: null,
  pa: null,
  questionnaire: null,
  review: null,
  signing: null,
  transmission: null,
  cancellation: null,
};
const etag = (id: string, revision: string) => `"${id}:${revision}"`;
const fieldClass =
  'border-border bg-background text-foreground w-full rounded border p-2 text-sm focus-visible:ring-2 focus-visible:ring-ring';

/** Application-owned demo host. Components only receive values and callbacks. */
export function FakeEhrStoryHost({
  initialScenario = 'lasix-draft',
  initialVariant,
  automaticClock = true,
}: FakeEhrStoryHostProps) {
  const [scenarioId, setScenarioId] = React.useState(initialScenario);
  const [variant, setVariant] = React.useState(initialVariant ?? '');
  const [resetVersion, setResetVersion] = React.useState(0);
  const [bundle, setBundle] = React.useState<Bundle | null>(null);
  const [draft, setDraft] = React.useState<PrescriptionDraft | null>(null);
  const [workflow, setWorkflow] = React.useState<Workflow>(EMPTY);
  const [now, setNow] = React.useState('2026-10-03T12:00:00.000Z');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const [editorOpen, setEditorOpen] = React.useState(false);
  const [focusField, setFocusField] = React.useState<string>();
  const [readySelected, setReadySelected] = React.useState(false);
  const [answers, setAnswers] = React.useState<QuestionnaireAnswer[]>([]);
  const [reasonCode, setReasonCode] = React.useState('simulation-review');
  const [comment, setComment] = React.useState('');
  const [records, setRecords] = React.useState<
    Array<{
      method: string;
      path: string;
      status: number | null;
      requestHeaders: Record<string, string>;
      responseHeaders: Record<string, string>;
      request: unknown;
      response: unknown;
    }>
  >([]);
  const [pollTimedOut, setPollTimedOut] = React.useState(false);
  const [pharmacies, setPharmacies] = React.useState<PharmacyRecord[]>([]);
  const pharmacyRef = React.useRef<HTMLSelectElement | null>(null);
  const fieldId = React.useId();
  const generation = React.useRef(0);
  const keySequence = React.useRef(0);
  const sendKey = React.useRef<string | null>(null);
  const stateRef = React.useRef(workflow);
  stateRef.current = workflow;
  const readAbort = React.useRef<AbortController | null>(null);
  const pollElapsed = React.useRef(0);
  const selectedScenario = getScenario(scenarioId, variant || undefined);
  const key = () => ({ idempotencyKey: `story-${++keySequence.current}` });

  React.useEffect(() => {
    const currentGeneration = ++generation.current;
    const service = createFakeEhrService({
      scenarioId,
      variant: variant || undefined,
    });
    const abort = new AbortController();
    readAbort.current = abort;
    const client = createHttpClient({
      fetch: createFakeFetch(service, {
        onRequest(request, response) {
          const method = request.method;
          const url = new URL(request.url);
          const path = `${url.pathname}${url.search}`;
          const requestHeaders = Object.fromEntries(request.headers.entries());
          const responseHeaders = response
            ? Object.fromEntries(response.headers.entries())
            : {};
          // Clones permit the UI to inspect the complete serialized exchange.
          void Promise.all([
            method === 'GET' ? Promise.resolve(null) : request.json(),
            response ? response.json() : Promise.resolve(null),
          ]).then(([requestBody, responseBody]) => {
            if (generation.current === currentGeneration)
              setRecords((previous) => [
                ...previous.slice(-99),
                {
                  method,
                  path,
                  status: response?.status ?? null,
                  requestHeaders,
                  responseHeaders,
                  request: requestBody,
                  response: responseBody,
                },
              ]);
          });
        },
      }),
    });
    setBundle({ service, client, generation: currentGeneration });
    setDraft(service.controller.draft());
    setWorkflow(EMPTY);
    setReadySelected(false);
    setAnswers([]);
    setRecords([]);
    setError('');
    setEditorOpen(false);
    setBusy(false);
    setNow(service.clock.now());
    sendKey.current = null;
    keySequence.current = 0;
    pollElapsed.current = 0;
    setPollTimedOut(false);
    setPharmacies([]);
    void client
      .searchPharmacies('Synthetic', undefined, { signal: abort.signal })
      .then((result) => {
        if (generation.current === currentGeneration)
          setPharmacies(result.body.data.items);
      })
      .catch((failure: unknown) => {
        if (generation.current === currentGeneration && !abort.signal.aborted)
          setError(
            failure instanceof Error
              ? failure.message
              : 'Pharmacy directory unavailable'
          );
      });
    return () => {
      generation.current += 1;
      abort.abort();
      service.controller.dispose();
    };
  }, [scenarioId, variant, resetVersion]);

  const active = (target: Bundle) => generation.current === target.generation;
  const refresh = React.useCallback(
    async function refresh(
      target: Bundle = bundle!,
      current = stateRef.current
    ) {
      if (!target || generation.current !== target.generation) return;
      const signal = readAbort.current?.signal;
      const [
        prescription,
        evaluation,
        pdmp,
        pa,
        signing,
        transmission,
        cancellation,
      ] = await Promise.all([
        current.prescription
          ? target.client
              .getPrescription(current.prescription.id, { signal })
              .then((result) => result.body.data)
          : null,
        current.evaluation
          ? target.client
              .getEvaluation(current.evaluation.id, { signal })
              .then((result) => result.body.data)
          : null,
        current.pdmp
          ? target.client
              .getPdmpQuery(current.pdmp.id, { signal })
              .then((result) => result.body.data)
          : null,
        current.pa
          ? target.client
              .getPriorAuthorization(current.pa.id, { signal })
              .then((result) => result.body.data)
          : null,
        current.signing
          ? target.client
              .getSigningSession(current.signing.id, { signal })
              .then((result) => result.body.data)
          : null,
        current.transmission
          ? target.client
              .getTransmission(current.transmission.id, { signal })
              .then((result) => result.body.data)
          : null,
        current.cancellation
          ? target.client
              .getCancellation(current.cancellation.id, { signal })
              .then((result) => result.body.data)
          : null,
      ]);
      const form =
        pa && current.questionnaire?.version !== pa.questionnaire.version
          ? (await target.client.getQuestionnaire(pa.id, { signal })).body.data
          : current.questionnaire;
      if (generation.current !== target.generation) return;
      setWorkflow((previous) => ({
        ...previous,
        prescription: acceptRecord(
          previous.prescription,
          prescription,
          'recordVersion'
        ),
        pdmp: acceptRecord(previous.pdmp, pdmp),
        pa: acceptRecord(previous.pa, pa),
        questionnaire:
          pa &&
          previous.pa?.id === pa.id &&
          Number(pa.revision) >= Number(previous.pa.revision)
            ? form
            : previous.questionnaire,
        signing: acceptRecord(previous.signing, signing),
        transmission: acceptRecord(previous.transmission, transmission),
        cancellation: acceptRecord(previous.cancellation, cancellation),
        evaluation:
          evaluation &&
          previous.evaluation &&
          shouldAcceptEvaluation(
            evaluation,
            previous.evaluation,
            previous.evaluation.inputFingerprint,
            previous.evaluation.id
          )
            ? evaluation
            : previous.evaluation,
      }));
      setNow(target.service.clock.now());
    },
    [bundle]
  );
  React.useEffect(() => {
    if (!bundle || !automaticClock) return;
    let pending = false;
    const timer = setInterval(() => {
      bundle.service.controller.advanceTime(500);
      setNow(bundle.service.clock.now());
      const current = stateRef.current;
      const nonterminal =
        current.evaluation?.state === 'running' ||
        current.pdmp?.state === 'queued' ||
        ['submitted', 'pending'].includes(current.pa?.state ?? '') ||
        current.signing?.state === 'challenge-pending' ||
        ['queued', 'submitted'].includes(current.transmission?.state ?? '') ||
        ['queued', 'running'].includes(
          current.transmission?.reconciliation.status ?? ''
        ) ||
        ['queued', 'requested'].includes(current.cancellation?.state ?? '');
      if (!nonterminal || pending || pollElapsed.current >= 30000) {
        if (nonterminal && pollElapsed.current >= 30000) setPollTimedOut(true);
        return;
      }
      pollElapsed.current += 500;
      pending = true;
      void refresh(bundle, current)
        .catch((failure: unknown) => {
          if (active(bundle))
            setError(
              failure instanceof Error
                ? failure.message
                : 'Status refresh failed'
            );
        })
        .finally(() => {
          pending = false;
        });
    }, 500);
    return () => clearInterval(timer);
  }, [bundle, automaticClock, refresh]);

  async function run(
    action: (target: Bundle) => Promise<void>,
    throwOnFailure = false
  ) {
    if (!bundle || busy) return;
    const target = bundle;
    setBusy(true);
    setError('');
    pollElapsed.current = 0;
    setPollTimedOut(false);
    try {
      await action(target);
    } catch (failure) {
      if (active(target))
        setError(
          failure instanceof Error
            ? failure.message
            : 'Simulation action failed'
        );
      if (throwOnFailure) throw failure;
    } finally {
      if (active(target)) setBusy(false);
    }
  }
  async function save(target: Bundle, incoming = draft!) {
    const current = stateRef.current.prescription;
    const result = current
      ? await target.client.updatePrescription(current.id, clone(incoming), {
          ...key(),
          ifMatch: etag(current.id, current.recordVersion),
        })
      : await target.client.createPrescription(clone(incoming), key());
    if (!active(target)) return;
    setWorkflow((previous) => ({
      ...EMPTY,
      prescription: result.body.data,
      cancellation: previous.cancellation,
    }));
    setDraft(incoming);
    setEditorOpen(false);
    setReadySelected(false);
    sendKey.current = null;
  }
  async function check(target: Bundle) {
    const current = stateRef.current.prescription;
    if (!current) throw new Error('Save a draft first');
    const result = await target.client.createEvaluation(
      {
        subject: {
          kind: 'saved',
          prescription: { id: current.id, revision: current.contentRevision },
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
      { ...key(), signal: readAbort.current?.signal }
    );
    if (!active(target)) return;
    const updated = (await target.client.getPrescription(current.id)).body.data;
    if (active(target))
      setWorkflow((previous) => ({
        ...previous,
        prescription: updated,
        evaluation: result.body.data,
        review: null,
        signing: null,
      }));
  }
  async function link(
    target: Bundle,
    pdmpId: string | null,
    paId: string | null
  ) {
    const current = (
      await target.client.getEvaluation(stateRef.current.evaluation!.id)
    ).body.data;
    const linked = (
      await target.client.updateWorkflowContext(
        current.id,
        { pdmpQueryId: pdmpId, priorAuthorizationId: paId },
        { ...key(), ifMatch: etag(current.id, current.revision) }
      )
    ).body.data;
    if (active(target))
      setWorkflow((previous) => ({ ...previous, evaluation: linked }));
  }
  function complete(issue?: PrescriptionIssue) {
    if (draftReadOnly) return;
    setFocusField(issue?.fieldPath);
    setEditorOpen(true);
  }
  const editableScope = (value: PrescriptionDraft) => ({
    display: value.display,
    code: value.code,
    prescription: value.prescription,
    patientId: value.patientId,
    prescriberId: value.prescriberId,
    pharmacyId: value.pharmacyId,
  });
  const draftChanged =
    !!draft &&
    !!workflow.prescription &&
    canonical(editableScope(draft)) !==
      canonical(editableScope(workflow.prescription));
  const readiness =
    workflow.evaluation && !draftChanged
      ? evaluationToReadiness(workflow.evaluation, 'simulation', {
          signing:
            workflow.signing?.state === 'completed' ? 'signed' : 'not-signed',
          delivery:
            workflow.transmission?.state === 'acknowledged'
              ? 'sent'
              : workflow.transmission?.state === 'queued' ||
                  workflow.transmission?.state === 'submitted'
                ? 'sending'
                : workflow.transmission?.state === 'rejected' ||
                    workflow.transmission?.state === 'failed'
                  ? 'failed'
                  : workflow.transmission?.state === 'unknown-outcome'
                    ? 'unknown'
                    : 'not-sent',
        })
      : bundle && draft
        ? {
            validation: validateLocal(bundle, draft, workflow.prescription),
            source: 'client-preview' as const,
            workflow: null,
            signing: 'not-signed' as const,
            delivery: 'not-sent' as const,
          }
        : undefined;
  const Lookup = React.useMemo(
    () =>
      function Lookup(props: MedicationLookupProps) {
        return bundle ? (
          <SyntheticMedicationLookup
            {...props}
            client={bundle.client}
            now={() => bundle.service.clock.now()}
          />
        ) : null;
      },
    [bundle]
  );
  const readOnly = selectedScenario.readOnly === true;
  const prescription = workflow.prescription;
  const draftReadOnly = readOnly || !!prescription?.signedArtifactId;
  const medication: Medication | undefined = draft
    ? {
        ...draft.prescription,
        id: prescription?.id ?? 'unsaved',
        name: draft.display,
        status: 'unreconciled',
        prescribingIntent: 'prescribe',
      }
    : undefined;
  const validationConfig =
    bundle && draft
      ? {
          input: bundle.service.controller.validationInput({
            ...draft,
            id: prescription?.id ?? 'unsaved',
            contentRevision: prescription?.contentRevision ?? 'draft',
          }),
          policy: {
            ...demoPrescriptionPolicy,
            priorAuthorization: {
              holdTransmit: selectedScenario.paHold ?? false,
            },
          },
        }
      : undefined;
  const readinessScope = {
    readiness,
    medicationName: draft?.display,
    expectedOrderId: prescription?.id ?? 'unsaved',
    expectedOrderRevision: prescription?.contentRevision ?? 'draft',
    expectedContextRevision: validationConfig?.input.context.revision,
    expectedPolicyVersion: validationConfig?.policy.version,
    now,
  };
  const fieldIssues = getPrescriptionIssues(readinessScope);
  const medicationIssues = fieldIssues.filter((issue) =>
    [
      'name',
      'display',
      'productId',
      'code',
      'context.product',
      'context.controlledSchedule',
    ].includes(issue.fieldPath?.replace(/^(draft|prescription)\./, '') ?? '')
  );
  const pharmacyIssues = fieldIssues.filter(
    (issue) => issue.remediation === 'pharmacy'
  );
  const inlineIssues = (issues: PrescriptionIssue[], id: string) =>
    issues.length > 0 && (
      <ul id={id} className="mt-1 space-y-1 text-xs">
        {issues.map((issue) => (
          <li
            key={`${issue.code}:${issue.fieldPath ?? ''}`}
            className={
              issue.severity === 'error'
                ? 'text-danger-600'
                : 'text-muted-foreground'
            }
          >
            {issue.message}
          </li>
        ))}
      </ul>
    );
  const evaluationCurrent = Boolean(
    workflow.evaluation?.subject.kind === 'saved' &&
    readiness?.workflow &&
    prescription &&
    !draftChanged &&
    workflow.evaluation.subject.prescription.id === prescription.id &&
    workflow.evaluation.subject.prescription.revision ===
      prescription.contentRevision &&
    isPrescriptionReadinessCurrent({
      readiness,
      now,
      expectedOrderId: prescription.id,
      expectedOrderRevision: prescription.contentRevision,
      expectedContextRevision: validationConfig?.input.context.revision,
      expectedPolicyVersion: validationConfig?.policy.version,
    })
  );
  React.useEffect(() => {
    setReadySelected(false);
  }, [draft, evaluationCurrent]);

  return (
    <div
      className="text-foreground mx-auto max-w-5xl space-y-5 p-4 pb-[calc(20dvh+2rem)]"
      data-slot="prescribing-simulation"
    >
      <header className="border-border bg-background rounded-lg border p-4">
        <h2 className="text-lg font-semibold">
          Prescribing workflow · Simulation
        </h2>
        <p className="text-muted-foreground text-sm">
          Synthetic patients, products and evidence. Simulated signing and
          pharmacy acknowledgement only.
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="min-w-0 flex-1 text-sm">
            Scenario
            <select
              className={fieldClass}
              aria-label="Scenario"
              value={scenarioId}
              onChange={(event) => {
                setScenarioId(event.target.value);
                setVariant('');
              }}
            >
              {prescribingScenarios.map((scenario) => (
                <option key={scenario.id} value={scenario.id}>
                  {scenario.label}
                </option>
              ))}
            </select>
          </label>
          {selectedScenario.variants && (
            <label className="text-sm">
              Variant
              <select
                className={fieldClass}
                aria-label="Variant"
                value={variant || selectedScenario.variants[0]}
                onChange={(event) => setVariant(event.target.value)}
              >
                {selectedScenario.variants.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
          )}
          <Button
            variant="outline"
            onClick={() => setResetVersion((value) => value + 1)}
          >
            Reset simulation
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              if (bundle) {
                bundle.service.controller.runPendingJobs();
                void run((target) => refresh(target));
              }
            }}
          >
            Advance pending jobs
          </Button>
        </div>
        <p className="mt-2 text-sm">{selectedScenario.description}</p>
        <p className="text-muted-foreground text-xs">
          Simulation clock:{' '}
          {DateTime.fromISO(now, { zone: 'UTC' }).toFormat(
            "yyyy-MM-dd HH:mm:ss 'UTC'"
          )}
        </p>
      </header>
      {error && (
        <p
          role="alert"
          className="border-danger-300 bg-danger-50 text-danger-700 rounded border p-3"
        >
          {error}{' '}
          {scenarioId === 'send-response-lost' &&
            'Use Recover send response to reuse the original request key.'}
        </p>
      )}
      <section
        className="border-border space-y-3 rounded-lg border p-4"
        aria-label="Prescription draft"
      >
        <h3 className="font-semibold">Prescription draft</h3>
        <div>
          <label className="block text-sm">
            Medication name
            <input
              className={`${fieldClass} aria-invalid:border-danger-500`}
              aria-invalid={
                medicationIssues.some((issue) => issue.severity === 'error') ||
                undefined
              }
              aria-describedby={
                medicationIssues.length
                  ? `${fieldId}-medication-issues`
                  : undefined
              }
              value={draft?.display ?? ''}
              disabled={busy || readOnly || !!prescription?.signedArtifactId}
              onChange={(event) => {
                if (draft)
                  setDraft({
                    ...draft,
                    display: event.target.value,
                    code: undefined,
                    prescription: { name: event.target.value },
                  });
              }}
            />
          </label>
          {inlineIssues(medicationIssues, `${fieldId}-medication-issues`)}
        </div>
        <div>
          <label className="block text-sm">
            Pharmacy
            <select
              ref={pharmacyRef}
              className={`${fieldClass} aria-invalid:border-danger-500`}
              aria-label="Pharmacy"
              aria-invalid={
                pharmacyIssues.some((issue) => issue.severity === 'error') ||
                undefined
              }
              aria-describedby={
                pharmacyIssues.length ? `${fieldId}-pharmacy-issues` : undefined
              }
              value={draft?.pharmacyId ?? ''}
              disabled={busy || readOnly || !!prescription?.signedArtifactId}
              onChange={(event) => {
                if (draft)
                  setDraft({
                    ...draft,
                    pharmacyId: event.target.value || undefined,
                  });
              }}
            >
              <option value="">Select a synthetic pharmacy</option>
              {pharmacies.map((pharmacy) => (
                <option key={pharmacy.id} value={pharmacy.id}>
                  {pharmacy.name}
                </option>
              ))}
            </select>
          </label>
          {inlineIssues(pharmacyIssues, `${fieldId}-pharmacy-issues`)}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={
              !bundle || busy || readOnly || !!prescription?.signedArtifactId
            }
            onClick={() => void run((target) => save(target))}
          >
            Save draft
          </Button>
          <Button
            variant="outline"
            disabled={
              !prescription ||
              busy ||
              readOnly ||
              !!prescription.signedArtifactId
            }
            onClick={() => complete()}
          >
            Edit prescription
          </Button>
          <Button
            variant="outline"
            disabled={
              !bundle || busy || readOnly || !!prescription?.signedArtifactId
            }
            onClick={() => {
              if (!bundle) return;
              const completeService = createFakeEhrService({
                scenarioId: 'complete-demo',
              });
              setDraft(completeService.controller.draft());
              completeService.controller.dispose();
            }}
          >
            Use complete synthetic details
          </Button>
          <Button
            variant="outline"
            disabled={!prescription || draftChanged || busy || readOnly}
            onClick={() => void run(check)}
          >
            Check readiness
          </Button>
        </div>
        {prescription && (
          <p className="text-muted-foreground text-xs">
            Order {prescription.id} · content revision{' '}
            {prescription.contentRevision} · record version{' '}
            {prescription.recordVersion} · {prescription.lifecycle}
          </p>
        )}
        {readiness && !editorOpen && (
          <PrescriptionIssueSummary
            {...readinessScope}
            presentation="floating"
            onCompletePrescription={complete}
            onIssueAction={(issue) => {
              if (issue.remediation === 'pharmacy')
                pharmacyRef.current?.focus();
              else if (issue.remediation === 'edit-prescription')
                complete(issue);
            }}
            readOnly={draftReadOnly}
          />
        )}
      </section>
      <section
        className="border-border space-y-3 rounded-lg border p-4"
        aria-label="Clinical checks and coverage"
      >
        <h3 className="font-semibold">
          Clinical checks, formulary and patient benefit · Simulation
        </h3>
        <p className="text-muted-foreground text-sm">
          Validation, interactions, pregnancy precautions, dosing, formulary and
          patient benefit retain separate outcomes.
        </p>
        <label className="text-sm">
          Finding decision reason
          <select
            className={fieldClass}
            value={reasonCode}
            onChange={(event) => setReasonCode(event.target.value)}
          >
            <option value="simulation-review">Simulation review</option>
            <option value="clinical-judgment">Clinical judgment</option>
            <option value="benefits-outweigh-risk">
              Benefits outweigh risk
            </option>
            <option value="reviewed">Reviewed</option>
          </select>
        </label>
        <label className="block text-sm">
          Decision comment
          <input
            className={fieldClass}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
          />
        </label>
        {workflow.evaluation ? (
          <div className="space-y-3">
            {Object.entries(workflow.evaluation.checks).map(
              ([domain, result]) =>
                result && (
                  <article
                    key={domain}
                    className="border-border rounded border p-3"
                  >
                    <h4 className="font-medium">
                      {domain}: {result.status} · {result.outcome}
                    </h4>
                    {result.missingInputs.length > 0 && (
                      <p className="text-sm">
                        Missing or unsupported:{' '}
                        {result.missingInputs.join(', ')}
                      </p>
                    )}
                    {result.findings.map((finding) => (
                      <div key={finding.id} className="mt-2 text-sm">
                        <p>{finding.summary}</p>
                        <p className="text-muted-foreground">
                          {finding.rationale}
                        </p>
                        {workflow.evaluation!.decisions.some(
                          (decision) => decision.findingId === finding.id
                        ) ? (
                          <p>Decision recorded; finding retained.</p>
                        ) : ['override', 'acknowledgement'].includes(
                            finding.disposition.resolution
                          ) ? (
                          <Button
                            size="sm"
                            disabled={busy || draftChanged || readOnly}
                            onClick={() =>
                              void run(async (target) => {
                                const current = (
                                  await target.client.getEvaluation(
                                    workflow.evaluation!.id
                                  )
                                ).body.data;
                                await target.client.createDecision(
                                  current.id,
                                  {
                                    findingId: finding.id,
                                    action: finding.disposition.resolution as
                                      | 'override'
                                      | 'acknowledgement',
                                    reasonCode:
                                      finding.disposition.allowedReasonCodes.includes(
                                        reasonCode
                                      )
                                        ? reasonCode
                                        : finding.disposition
                                            .allowedReasonCodes[0],
                                    comment,
                                  },
                                  {
                                    ...key(),
                                    ifMatch: etag(current.id, current.revision),
                                  }
                                );
                                await refresh(target);
                              })
                            }
                          >
                            {finding.disposition.resolution === 'override'
                              ? 'Override synthetic finding'
                              : 'Acknowledge synthetic finding'}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={draftReadOnly}
                            onClick={() =>
                              complete({
                                code: finding.code,
                                ruleId: finding.code,
                                ruleSource: 'clinical-provider',
                                fieldPath: finding.factPaths[0],
                                message: finding.summary,
                                severity: 'error',
                                blocks: finding.disposition.blocks,
                                remediation: 'edit-prescription',
                              })
                            }
                          >
                            Correct prescription
                          </Button>
                        )}
                      </div>
                    ))}
                    <details>
                      <summary className="cursor-pointer text-sm">
                        Inspect {domain} result
                      </summary>
                      <pre className="overflow-x-auto text-xs break-all whitespace-pre-wrap">
                        {JSON.stringify(result, null, 2)}
                      </pre>
                    </details>
                  </article>
                )
            )}
          </div>
        ) : (
          <p className="text-sm">
            Save a draft and check readiness to run these services.
          </p>
        )}
      </section>
      <section
        className="border-border space-y-3 rounded-lg border p-4"
        aria-label="PDMP query and review"
      >
        <h3 className="font-semibold">
          PDMP query and explicit review · Simulation
        </h3>
        <Button
          disabled={
            !prescription ||
            !workflow.evaluation ||
            draftChanged ||
            busy ||
            readOnly
          }
          onClick={() =>
            void run(async (target) => {
              const result = (
                await target.client.createPdmpQuery(
                  {
                    patientId: prescription!.patientId,
                    prescriberId: prescription!.prescriberId,
                    jurisdictions:
                      selectedScenario.pdmp === 'partial'
                        ? ['SIM', 'SIM-NEIGHBOR']
                        : ['SIM'],
                    purposeCode: 'treatment',
                    attestation: true,
                  },
                  key()
                )
              ).body.data;
              if (active(target))
                setWorkflow((previous) => ({ ...previous, pdmp: result }));
              await link(target, result.id, stateRef.current.pa?.id ?? null);
            })
          }
        >
          Query synthetic PDMP
        </Button>
        {workflow.pdmp && (
          <>
            <p role="status">
              PDMP: {workflow.pdmp.state} · identity {workflow.pdmp.match} ·{' '}
              {workflow.pdmp.entries.length} entries ·{' '}
              {workflow.pdmp.reviewId ? 'reviewed' : 'not reviewed'}
            </p>
            <Button
              variant="outline"
              disabled={
                busy ||
                readOnly ||
                workflow.pdmp.state !== 'complete' ||
                workflow.pdmp.match !== 'matched' ||
                !!workflow.pdmp.reviewId
              }
              onClick={() =>
                void run(async (target) => {
                  const current = (
                    await target.client.getPdmpQuery(workflow.pdmp!.id)
                  ).body.data;
                  await target.client.reviewPdmpQuery(
                    current.id,
                    {
                      reviewedReportRevision: current.reportRevision!,
                      purposeCode: 'treatment',
                    },
                    { ...key(), ifMatch: etag(current.id, current.revision) }
                  );
                  await refresh(target);
                })
              }
            >
              Record PDMP review
            </Button>
          </>
        )}
      </section>
      <section
        className="border-border space-y-3 rounded-lg border p-4"
        aria-label="Prior authorization"
      >
        <h3 className="font-semibold">Prior authorization · Simulation</h3>
        <Button
          disabled={
            !prescription ||
            !workflow.evaluation ||
            draftChanged ||
            busy ||
            readOnly
          }
          onClick={() =>
            void run(async (target) => {
              const result = (
                await target.client.createPriorAuthorization(
                  {
                    prescription: {
                      id: prescription!.id,
                      revision: prescription!.contentRevision,
                    },
                    evaluationId: workflow.evaluation!.id,
                    benefitType: 'pharmacy',
                    reasonCode: 'synthetic-benefit-requirement',
                  },
                  key()
                )
              ).body.data;
              const form = (await target.client.getQuestionnaire(result.id))
                .body.data;
              if (active(target)) {
                setWorkflow((previous) => ({
                  ...previous,
                  pa: result,
                  questionnaire: form,
                }));
                setAnswers([]);
              }
              await link(target, stateRef.current.pdmp?.id ?? null, result.id);
            })
          }
        >
          Start synthetic PA
        </Button>
        {workflow.pa && (
          <>
            <p role="status">
              PA: {workflow.pa.state} · revision {workflow.pa.revision} · form
              version {workflow.pa.questionnaire.version}
            </p>
            {workflow.questionnaire?.items.map((item) => {
              const enabled =
                item.enableWhen?.every(
                  (condition) =>
                    answers.find((answer) => answer.linkId === condition.linkId)
                      ?.value === condition.equals
                ) ?? true;
              if (!enabled) return null;
              const answer = answers.find(
                (answer) => answer.linkId === item.linkId
              );
              return (
                <label key={item.linkId} className="block text-sm">
                  {item.text}
                  {item.required ? ' (required for submission)' : ''}
                  {item.type === 'boolean' ? (
                    <select
                      className={fieldClass}
                      disabled={
                        busy ||
                        readOnly ||
                        ![
                          'questionnaire-needed',
                          'ready-to-submit',
                          'more-information-needed',
                        ].includes(workflow.pa!.state)
                      }
                      aria-label={item.text}
                      value={answer === undefined ? '' : String(answer.value)}
                      onChange={(event) =>
                        setAnswers((previous) => [
                          ...previous.filter(
                            (entry) => entry.linkId !== item.linkId
                          ),
                          ...(event.target.value
                            ? [
                                {
                                  linkId: item.linkId,
                                  value: event.target.value === 'true',
                                },
                              ]
                            : []),
                        ])
                      }
                    >
                      <option value="">Unanswered</option>
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  ) : item.type === 'choice' ? (
                    <select
                      className={fieldClass}
                      aria-label={item.text}
                      value={answer ? String(answer.value) : ''}
                      disabled={
                        busy ||
                        readOnly ||
                        ![
                          'questionnaire-needed',
                          'ready-to-submit',
                          'more-information-needed',
                        ].includes(workflow.pa!.state)
                      }
                      onChange={(event) =>
                        setAnswers((previous) => [
                          ...previous.filter(
                            (entry) => entry.linkId !== item.linkId
                          ),
                          ...(event.target.value
                            ? [
                                {
                                  linkId: item.linkId,
                                  value: event.target.value,
                                },
                              ]
                            : []),
                        ])
                      }
                    >
                      <option value="">Unanswered</option>
                      {item.choices?.map((choice) => (
                        <option key={choice} value={choice}>
                          {choice}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      className={fieldClass}
                      aria-label={item.text}
                      type={
                        item.type === 'integer' || item.type === 'decimal'
                          ? 'number'
                          : item.type === 'date'
                            ? 'date'
                            : 'text'
                      }
                      step={
                        item.type === 'integer'
                          ? '1'
                          : item.type === 'decimal'
                            ? 'any'
                            : undefined
                      }
                      disabled={
                        busy ||
                        readOnly ||
                        ![
                          'questionnaire-needed',
                          'ready-to-submit',
                          'more-information-needed',
                        ].includes(workflow.pa!.state)
                      }
                      value={answer ? String(answer.value) : ''}
                      onChange={(event) =>
                        setAnswers((previous) => [
                          ...previous.filter(
                            (entry) => entry.linkId !== item.linkId
                          ),
                          ...(event.target.value
                            ? [
                                {
                                  linkId: item.linkId,
                                  value:
                                    item.type === 'integer' ||
                                    item.type === 'decimal'
                                      ? Number(event.target.value)
                                      : event.target.value,
                                },
                              ]
                            : []),
                        ])
                      }
                    />
                  )}
                </label>
              );
            })}
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={busy || draftChanged || readOnly}
                onClick={() =>
                  void run(async (target) => {
                    const current = (
                      await target.client.getPriorAuthorization(workflow.pa!.id)
                    ).body.data;
                    const saved = (
                      await target.client.saveAnswers(
                        current.id,
                        {
                          questionnaireId: current.questionnaire.id,
                          questionnaireVersion: current.questionnaire.version,
                          answers,
                        },
                        {
                          ...key(),
                          ifMatch: etag(current.id, current.revision),
                        }
                      )
                    ).body.data;
                    if (active(target))
                      setWorkflow((previous) => ({ ...previous, pa: saved }));
                  })
                }
              >
                Save PA answers
              </Button>
              <Button
                disabled={
                  busy || readOnly || workflow.pa.state !== 'ready-to-submit'
                }
                onClick={() =>
                  void run(async (target) => {
                    const current = (
                      await target.client.getPriorAuthorization(workflow.pa!.id)
                    ).body.data;
                    await target.client.submitPriorAuthorization(
                      current.id,
                      {
                        caseRevision: current.revision,
                        questionnaireVersion: current.questionnaire.version,
                        submissionKind:
                          current.questionnaire.version === '1'
                            ? 'initial'
                            : 'additional-information',
                      },
                      key()
                    );
                    await refresh(target);
                  })
                }
              >
                Submit synthetic PA
              </Button>
              <Button
                variant="outline"
                disabled={busy || readOnly || workflow.pa.state === 'cancelled'}
                onClick={() =>
                  void run(async (target) => {
                    const current = (
                      await target.client.getPriorAuthorization(workflow.pa!.id)
                    ).body.data;
                    await target.client.cancelPriorAuthorization(
                      current.id,
                      {
                        caseRevision: current.revision,
                        reasonCode: 'simulation-cancel',
                      },
                      key()
                    );
                    await refresh(target);
                  })
                }
              >
                Cancel PA case
              </Button>
            </div>
            {workflow.pa.answerIssues.map((issue) => (
              <p key={issue.fieldPath} className="text-sm">
                {issue.fieldPath}: {issue.message}
              </p>
            ))}
            {workflow.pa.decision && (
              <p className="text-sm">
                Decision:{' '}
                {workflow.pa.decision.reasons.join('; ') ||
                  workflow.pa.decision.authorizationReference}
              </p>
            )}
          </>
        )}
      </section>
      <section
        className="border-border space-y-3 rounded-lg border p-4"
        aria-label="Review signing and transmission"
      >
        <h3 className="font-semibold">
          Review, simulated signing and transmission
        </h3>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={readySelected}
            disabled={
              busy ||
              readOnly ||
              !evaluationCurrent ||
              !workflow.evaluation ||
              workflow.evaluation.gates.review.state !== 'pass'
            }
            onChange={(event) => setReadySelected(event.target.checked)}
          />
          I reviewed this prescription and select it as ready to sign
        </label>
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={!readySelected || !evaluationCurrent || busy || readOnly}
            onClick={() =>
              void run(async (target) => {
                const current = stateRef.current.prescription!;
                const review = (
                  await target.client.createReview(
                    {
                      patientId: current.patientId,
                      selections: [
                        {
                          prescription: {
                            id: current.id,
                            revision: current.contentRevision,
                          },
                          evaluationId: stateRef.current.evaluation!.id,
                          readyToSign: true,
                        },
                      ],
                    },
                    key()
                  )
                ).body.data;
                if (active(target))
                  setWorkflow((previous) => ({ ...previous, review }));
                await refresh(target);
              })
            }
          >
            Review and select ready to sign
          </Button>
          <Button
            disabled={
              !evaluationCurrent ||
              !workflow.review ||
              workflow.evaluation?.gates.sign.state !== 'pass' ||
              busy ||
              readOnly ||
              workflow.signing?.state === 'completed'
            }
            onClick={() =>
              void run(async (target) => {
                const review = stateRef.current.review!;
                const signing = (
                  await target.client.createSigningSession(
                    { reviewId: review.id, reviewRevision: review.revision },
                    key()
                  )
                ).body.data;
                if (active(target))
                  setWorkflow((previous) => ({ ...previous, signing }));
                if (selectedScenario.signing === 'expired')
                  target.service.controller.advanceTime(300000);
                const completionReference =
                  target.service.controller.completeSimulatedChallenge(
                    signing.id
                  );
                const completed = (
                  await target.client.completeSigningSession(
                    signing.id,
                    { sessionRevision: signing.revision, completionReference },
                    key()
                  )
                ).body.data;
                if (active(target))
                  setWorkflow((previous) => ({
                    ...previous,
                    signing: completed,
                  }));
                await refresh(target, {
                  ...stateRef.current,
                  signing: completed,
                });
              })
            }
          >
            Simulate signing
          </Button>
          <Button
            variant="outline"
            disabled={
              !evaluationCurrent ||
              !workflow.signing?.artifacts.length ||
              workflow.evaluation?.gates.transmit.state !== 'pass' ||
              busy ||
              readOnly ||
              !!workflow.transmission
            }
            onClick={() =>
              void run(async (target) => {
                const current = stateRef.current;
                sendKey.current ??= key().idempotencyKey;
                const transmission = (
                  await target.client.createTransmission(
                    {
                      prescription: {
                        id: current.prescription!.id,
                        revision: current.prescription!.contentRevision,
                      },
                      evaluationId: current.evaluation!.id,
                      signedArtifactId:
                        current.signing!.artifacts[0].signedArtifactId,
                      pharmacyId: current.prescription!.pharmacyId!,
                      transactionType: 'NewRx',
                    },
                    { idempotencyKey: sendKey.current }
                  )
                ).body.data;
                if (active(target))
                  setWorkflow((previous) => ({ ...previous, transmission }));
              })
            }
          >
            Simulate send
          </Button>
          {sendKey.current && !workflow.transmission && (
            <Button
              variant="outline"
              disabled={busy}
              onClick={() =>
                void run(async (target) => {
                  const current = stateRef.current;
                  const transmission = (
                    await target.client.createTransmission(
                      {
                        prescription: {
                          id: current.prescription!.id,
                          revision: current.prescription!.contentRevision,
                        },
                        evaluationId: current.evaluation!.id,
                        signedArtifactId:
                          current.signing!.artifacts[0].signedArtifactId,
                        pharmacyId: current.prescription!.pharmacyId!,
                        transactionType: 'NewRx',
                      },
                      { idempotencyKey: sendKey.current! }
                    )
                  ).body.data;
                  if (active(target))
                    setWorkflow((previous) => ({ ...previous, transmission }));
                })
              }
            >
              Recover send response
            </Button>
          )}
          <Button
            variant="outline"
            disabled={busy || !prescription}
            onClick={() => void run((target) => refresh(target))}
          >
            Refresh status
          </Button>
        </div>
        {workflow.evaluation && (
          <p className="text-sm">
            Gates: review {workflow.evaluation.gates.review.state} · sign{' '}
            {workflow.evaluation.gates.sign.state} · transmit{' '}
            {workflow.evaluation.gates.transmit.state} ·{' '}
            {workflow.evaluation.validity}
          </p>
        )}
        {workflow.signing && (
          <p role="status">Simulated signing: {workflow.signing.state}</p>
        )}
        {workflow.transmission && (
          <>
            <p role="status">
              Simulated transmission: {workflow.transmission.state} ·{' '}
              {workflow.transmission.attemptCount} attempt(s)
            </p>
            {workflow.transmission.receipt && (
              <p className="text-sm">{workflow.transmission.receipt.message}</p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={
                  busy ||
                  workflow.transmission.state !== 'unknown-outcome' ||
                  workflow.transmission.reconciliation.status === 'queued'
                }
                onClick={() =>
                  void run(async (target) => {
                    const current = (
                      await target.client.getTransmission(
                        workflow.transmission!.id
                      )
                    ).body.data;
                    await target.client.reconcileTransmission(
                      current.id,
                      { operationRevision: current.revision },
                      key()
                    );
                    await refresh(target);
                  })
                }
              >
                Reconcile unknown send
              </Button>
              <Button
                disabled={
                  busy ||
                  workflow.transmission.state !== 'failed' ||
                  !workflow.transmission.error?.retryable
                }
                onClick={() =>
                  void run(async (target) => {
                    const current = (
                      await target.client.getTransmission(
                        workflow.transmission!.id
                      )
                    ).body.data;
                    await target.client.retryTransmission(
                      current.id,
                      {
                        operationRevision: current.revision,
                        evaluationId: stateRef.current.evaluation!.id,
                        reasonCode: 'known-failure',
                      },
                      key()
                    );
                    await refresh(target);
                  })
                }
              >
                Retry known failed send
              </Button>
            </div>
          </>
        )}
        {pollTimedOut && (
          <p role="status">
            Polling paused after 30 seconds. The operation remains pending; use
            Refresh status.
          </p>
        )}
        {prescription?.signedArtifactId && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={busy || !!workflow.cancellation}
              onClick={() =>
                void run(async (target) => {
                  const cancellation = (
                    await target.client.cancelPrescription(
                      prescription.id,
                      {
                        revision: prescription.contentRevision,
                        reasonCode: 'correction',
                        signedArtifactId: prescription.signedArtifactId!,
                        ...(prescription.latestTransmissionId
                          ? {
                              transmissionId: prescription.latestTransmissionId,
                            }
                          : {}),
                      },
                      key()
                    )
                  ).body.data;
                  if (active(target))
                    setWorkflow((previous) => ({ ...previous, cancellation }));
                })
              }
            >
              Request simulated cancellation
            </Button>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() =>
                void run(async (target) => {
                  const newDraft = clone(target.service.controller.draft());
                  const replacement = (
                    await target.client.replacePrescription(
                      prescription.id,
                      {
                        original: {
                          id: prescription.id,
                          revision: prescription.contentRevision,
                        },
                        reasonCode: 'correction',
                        draft: newDraft,
                      },
                      key()
                    )
                  ).body.data;
                  if (active(target)) {
                    setWorkflow((previous) => ({
                      ...EMPTY,
                      prescription: replacement,
                      cancellation: previous.cancellation,
                    }));
                    setDraft(newDraft);
                    setReadySelected(false);
                    sendKey.current = null;
                  }
                })
              }
            >
              Draft replacement
            </Button>
          </div>
        )}
        {workflow.cancellation && (
          <p role="status">
            Original cancellation: {workflow.cancellation.state}
          </p>
        )}
      </section>
      <details className="border-border rounded border p-4">
        <summary className="cursor-pointer font-medium">
          Demo-only context controls and exchange records
        </summary>
        <p className="text-muted-foreground text-sm">
          These controls change fixture facts and invalidate affected
          evaluations.
        </p>
        <div className="my-2 flex flex-wrap gap-2">
          {[
            'record-pregnancy-observation',
            'record-weight',
            'record-renal',
            'confirm-medication-history',
            'change-coverage',
            'expire-pdmp-report',
            'revoke-pa',
          ].map((eventId) => (
            <Button
              key={eventId}
              size="sm"
              variant="outline"
              onClick={() => {
                if (bundle) {
                  bundle.service.controller.applyContextEvent(eventId);
                  void run((target) => refresh(target));
                }
              }}
            >
              {eventId}
            </Button>
          ))}
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              if (bundle) {
                bundle.service.controller.advanceTime(86400000);
                void run((target) => refresh(target));
              }
            }}
          >
            Advance 24 hours
          </Button>
        </div>
        <pre className="max-h-96 overflow-auto text-xs break-all whitespace-pre-wrap">
          {JSON.stringify(records, null, 2)}
        </pre>
      </details>
      {bundle && draft && medication && (
        <MedicationEditor
          open={editorOpen}
          medication={medication}
          codeLookup={{
            component: Lookup,
            indexUrl: '/api/prescribing/v1/drugs',
          }}
          readOnly={draftReadOnly}
          prescribing={validationConfig}
          readiness={readiness}
          prescriptionNow={now}
          initialIssueField={focusField}
          onClose={() => setEditorOpen(false)}
          onIssueAction={(issue) => {
            if (issue.remediation === 'pharmacy') {
              setEditorOpen(false);
              pharmacyRef.current?.focus();
            }
          }}
          onSave={async (changed) => {
            const details: PrescriptionDraft['prescription'] = {};
            for (const field of prescriptionDetailFields) {
              if (changed[field] !== undefined)
                Object.assign(details, { [field]: changed[field] });
            }
            const updated: PrescriptionDraft = {
              ...draft,
              display: changed.name,
              ...(changed.code ? { code: changed.code } : { code: undefined }),
              prescription: details,
            };
            await run((target) => save(target, updated), true);
          }}
        />
      )}
    </div>
  );
}

function validateLocal(
  bundle: Bundle,
  draft: PrescriptionDraft,
  record: PrescriptionRecord | null
) {
  const input = bundle.service.controller.validationInput({
    ...draft,
    id: record?.id ?? 'unsaved',
    contentRevision: record?.contentRevision ?? 'draft',
  });
  // Validation uses the same pure implementation on both sides of this demo.
  return validatePrescription(input, demoPrescriptionPolicy);
}

function acceptRecord<
  T extends { id: string; revision?: string; recordVersion?: string },
>(
  current: T | null,
  incoming: T | null,
  version: 'revision' | 'recordVersion' = 'revision'
): T | null {
  if (
    !incoming ||
    !current ||
    incoming.id !== current.id ||
    Number(incoming[version]) < Number(current[version])
  )
    return current;
  return incoming;
}
