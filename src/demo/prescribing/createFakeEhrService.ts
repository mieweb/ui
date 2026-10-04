import { DateTime } from 'luxon';
import { demoPrescriptionPolicy } from '../../prescribing/policy';
import type { PrescriptionService } from '../../prescribing/policy';
import { validatePrescription } from '../../prescribing/validate';
import type {
  ActionStage,
  PrescriptionDraft,
  PrescriptionValidationInput,
} from '../../prescribing/types';
import type {
  ApiProblem,
  ApiResponse,
  Capabilities,
  CancellationRecord,
  DecisionRecord,
  EvaluationRecord,
  EvaluationRequest,
  GateReason,
  JsonValue,
  PatientContextSnapshot,
  PdmpQueryRecord,
  PdmpQueryRequest,
  PdmpReviewRecord,
  PrescriptionRecord,
  PrescribingApi,
  PriorAuthorizationCase,
  QuestionnaireAnswer,
  QuestionnaireRecord,
  RequestOptions,
  ReviewRecord,
  SignedArtifact,
  SigningSession,
  SubmissionRecord,
  TransmissionRecord,
} from '../../prescribing/api/contracts';
import {
  KNOWLEDGE_VERSION,
  known,
  makeContext,
  makePharmacies,
  makeProducts,
  syntheticRules,
} from './fixtures';
import type { FixtureContext, FixtureProduct } from './fixtures';
import { emptyCheck, syntheticProviders } from './providers';
import type { ProviderSnapshot } from './providers';
import { getScenario } from './scenarios';
import type { SimulationScenario } from './scenarios';
import {
  canonical,
  clone,
  createSequentialIds,
  createSimulationClock,
  createSimulationScheduler,
  isoMillis,
  millisISO,
} from './scheduler';
import type { SimulationClock, SimulationScheduler } from './scheduler';
import { createStore } from './store';
import type { SimulationSession, SimulationStore } from './store';
import { validateRequest } from '../../prescribing/api/schemas';
import { createHttpClient } from '../../prescribing/api/createHttpClient';
import { createFakeFetch } from './createFakeFetch';

const SERVICES: PrescriptionService[] = [
  'validation',
  'interactions',
  'pregnancy',
  'dosing',
  'formulary',
  'benefit',
];
const DELAYS = {
  interactions: 100,
  pregnancy: 150,
  dosing: 150,
  formulary: 250,
  benefit: 250,
};
const BASE_URL = '/api/prescribing/v1';
const increment = (revision: string) => String(Number(revision) + 1);
const etag = (id: string, revision: string) => `"${id}:${revision}"`;

/** Thrown domain failures are serialized by the same router in stories and HTTP tests. */
export class SimulationApiError extends Error {
  constructor(public readonly problem: ApiProblem) {
    super(problem.detail);
    this.name = 'SimulationApiError';
  }
}

export interface FakeEhrServiceOptions {
  scenarioId?: string;
  variant?: string;
  baseUrl?: string;
  clock?: SimulationClock;
  scheduler?: SimulationScheduler;
  nextId?: (prefix: string) => string;
  session?: SimulationSession;
}
export interface FakeEhrController {
  reset(scenarioId?: string, variant?: string): void;
  advanceTime(ms: number): void;
  runPendingJobs(): void;
  applyContextEvent(eventId: string): void;
  completeSimulatedChallenge(
    sessionId: string,
    outcome?: 'approved' | 'declined'
  ): string;
  dispose(): void;
  snapshot(): {
    scenario: SimulationScenario;
    session: SimulationSession;
    now: string;
    jobs: ReturnType<SimulationScheduler['snapshot']>;
    records: Record<string, unknown[]>;
  };
  draft(): PrescriptionDraft;
  validationInput(draft: PrescriptionDraft): PrescriptionValidationInput;
}
export interface FakeEhrService extends PrescribingApi {
  controller: FakeEhrController;
  baseUrl: string;
  clock: SimulationClock;
}

export function createFakeEhrService(
  options: FakeEhrServiceOptions = {}
): FakeEhrService {
  let scenario = getScenario(options.scenarioId, options.variant);
  let clock = options.clock ?? createSimulationClock();
  let scheduler = options.scheduler ?? createSimulationScheduler(clock);
  let nextId = options.nextId ?? createSequentialIds();
  let store: SimulationStore;
  let disposed = false;
  let lossInjected = false;
  let beforeCommitInjected = false;
  let session: SimulationSession;
  let projectedRepresentations = new Map<string, string>();
  const baseUrl = options.baseUrl ?? BASE_URL;

  const resetStore = () => {
    store = createStore();
    projectedRepresentations = new Map();
    lossInjected = false;
    beforeCommitInjected = false;
    disposed = false;
    session = clone(
      options.session ?? {
        id: 'sim-session-1',
        actorId: 'sim-prescriber-1',
        role: scenario.readOnly ? 'read-only' : 'prescriber',
        allowedActions: ['*'],
        allowedPatientIds: ['sim-patient-1'],
      }
    );
    const context = makeContext(scenario, clock.now());
    store.patients.set(context.patientId, context);
    for (const product of makeProducts(clock.now()))
      store.products.set(product.id, product);
    for (const pharmacy of makePharmacies(clock.now()))
      store.pharmacies.set(pharmacy.id, pharmacy);
    const policy = clone(demoPrescriptionPolicy);
    policy.priorAuthorization.holdTransmit = scenario.paHold ?? false;
    store.policies.set(policy.id, policy);
  };
  resetStore();
  const policy = () => store.policies.get(demoPrescriptionPolicy.id)!;
  const fail = (
    status: number,
    code: string,
    detail: string,
    extra: Partial<ApiProblem> = {}
  ): never => {
    throw new SimulationApiError({
      type: `urn:mieweb:prescribing:problem:${code}`,
      title: code.replaceAll('_', ' '),
      status,
      detail,
      instance: baseUrl,
      code,
      requestId: nextId('request'),
      retryable: status === 503 || status === 429,
      ...extra,
    });
  };
  const authorize = (
    patientId?: string,
    action?: string,
    prescriberOnly = false
  ) => {
    if (!session.actorId)
      fail(401, 'SESSION_REQUIRED', 'A session identity is required');
    if (patientId && !session.allowedPatientIds.includes(patientId))
      fail(
        403,
        'PATIENT_ACCESS_DENIED',
        'Patient is outside this session scope'
      );
    if (
      action &&
      (session.role === 'read-only' ||
        (!session.allowedActions.includes('*') &&
          !session.allowedActions.includes(action)))
    )
      fail(
        403,
        'ACTION_NOT_ALLOWED',
        'This session may not perform that action'
      );
    if (prescriberOnly && session.role !== 'prescriber')
      fail(
        403,
        'PRESCRIBER_REQUIRED',
        'The named prescriber must perform review/signing'
      );
  };
  function resource<T>(map: Map<string, T>, id: string): T {
    const record = map.get(id);
    if (!record) fail(404, 'RESOURCE_NOT_FOUND', `No resource ${id}`);
    return record!;
  }
  const patient = (id: string) => {
    authorize(id);
    return resource(store.patients, id);
  };
  const rx = (id: string) => {
    const record = resource(store.prescriptions, id);
    authorize(record.patientId);
    return record;
  };
  const evaluation = (id: string) => {
    const record = resource(store.evaluations, id);
    authorize(
      record.subject.kind === 'saved'
        ? rx(record.subject.prescription.id).patientId
        : record.subject.draft.patientId
    );
    return record;
  };
  const precondition = (
    id: string,
    revision: string,
    requestOptions: RequestOptions
  ) => {
    if (!requestOptions.ifMatch)
      fail(400, 'IF_MATCH_REQUIRED', 'If-Match is required');
    if (requestOptions.ifMatch !== etag(id, revision))
      fail(412, 'REVISION_CONFLICT', 'The current representation changed', {
        currentRevision: revision,
      });
  };
  const expectContent = (reference: { id: string; revision: string }) => {
    const record = rx(reference.id);
    if (record.contentRevision !== reference.revision)
      fail(
        409,
        'CONTENT_REVISION_CONFLICT',
        'Prescription content is no longer current',
        { currentRevision: record.contentRevision }
      );
    return record;
  };
  function response<T>(
    status: number,
    data: T,
    id?: string,
    revision?: string,
    location?: string
  ): ApiResponse<T> {
    return {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...(id && revision ? { ETag: etag(id, revision) } : {}),
        ...(location ? { Location: `${baseUrl}${location}` } : {}),
      },
      body: {
        meta: {
          apiVersion: '1',
          requestId: nextId('request'),
          generatedAt: clock.now(),
          mode: 'simulation',
        },
        data: clone(data),
      },
    };
  }
  const event = (
    type: string,
    prescriptionId: string | null,
    references: string[] = [],
    outcome = 'complete'
  ) => {
    const id = nextId('event');
    store.events.set(id, {
      id,
      at: clock.now(),
      actorId: session.actorId,
      type,
      outcome,
      prescriptionId,
      references,
    });
  };
  const bumpRx = (record: PrescriptionRecord) => {
    record.recordVersion = increment(record.recordVersion);
    record.updatedAt = clock.now();
  };
  function validationInput(
    draft: PrescriptionDraft
  ): PrescriptionValidationInput {
    const context = patient(draft.patientId);
    const product = draft.prescription.productId
      ? store.products.get(draft.prescription.productId)
      : undefined;
    const pharmacy = draft.pharmacyId
      ? store.pharmacies.get(draft.pharmacyId)
      : undefined;
    return {
      draft: clone(draft),
      orderId: draft.id ?? 'preview',
      orderRevision: draft.contentRevision ?? 'preview',
      evaluatedAt: clock.now(),
      context: {
        revision: context.revision,
        patient: known(
          { id: context.patientId, ...context.demographics },
          context.capturedAt
        ),
        prescriber:
          draft.prescriberId === 'sim-prescriber-1'
            ? known(
                {
                  id: 'sim-prescriber-1',
                  name: 'Synthetic Prescriber',
                  address: '3 Simulation Way, Testville, IN 00000',
                  authorized: true,
                  networkEnrolled: true,
                  deaRegistration: 'SIMULATION-ONLY',
                  epcsAuthorized: true,
                },
                context.capturedAt
              )
            : { state: 'unknown', reason: 'Prescriber fixture not resolved' },
        pharmacy: pharmacy
          ? known(
              {
                id: pharmacy.id,
                newRx:
                  pharmacy.capabilities.NewRx.state === 'known' &&
                  pharmacy.capabilities.NewRx.value,
                epcs:
                  pharmacy.capabilities.epcs.state === 'known' &&
                  pharmacy.capabilities.epcs.value,
              },
              pharmacy.refreshedAt
            )
          : { state: 'unknown', reason: 'Pharmacy not selected' },
        product: product
          ? known(
              {
                id: product.id,
                coding: product.coding,
                conceptSpecificity: product.specificity,
                strength: product.strength,
                doseForm: product.form,
                quantityUnits: product.quantityUnits,
              },
              context.capturedAt
            )
          : { state: 'unknown', reason: 'Product metadata unresolved' },
        controlledSchedule: product?.controlledSchedule ?? {
          state: 'unknown',
          reason: 'Product classification is unresolved',
        },
      },
    };
  }
  function getDraft(): PrescriptionDraft {
    const product = scenario.product
      ? store.products.get(scenario.product)!
      : null;
    return {
      patientId: 'sim-patient-1',
      encounterId: 'sim-encounter-1',
      prescriberId: 'sim-prescriber-1',
      ...(product
        ? {
            pharmacyId:
              scenario.coverage === 'nonpreferred'
                ? 'sim-pharmacy-2'
                : 'sim-pharmacy-1',
            code: product.coding[0],
          }
        : {}),
      intent: 'prescribe',
      display: product?.display ?? 'Lasix',
      prescription: product
        ? {
            name: product.display,
            productId: product.id,
            code: product.coding[0],
            strength: product.strength,
            doseForm: product.form,
            dose: scenario.dose === 'high' ? '12' : '5',
            doseUnit: scenario.dose === 'incompatible-unit' ? 'mL' : 'mg',
            sig: 'Take the demonstration dose by mouth daily',
            route: 'oral',
            frequency: 'daily',
            quantity: '30',
            quantityUnit: 'tablet',
            daysSupply: '30',
            refills: '0',
            substitution: '0',
            indication: 'Synthetic demonstration indication',
          }
        : {},
    };
  }
  const contextResponse = (
    context: FixtureContext
  ): PatientContextSnapshot => ({
    patientId: context.patientId,
    encounterId: context.encounterId,
    revision: context.revision,
    capturedAt: context.capturedAt,
    demographics: known(context.demographics, context.capturedAt),
    medicationHistory:
      context.medicationHistoryReviewed.state === 'known'
        ? known(
            context.medicationExposures.map((exposure) => ({
              id: exposure.id,
              productId: exposure.productId,
              status: exposure.status,
              use: exposure.use,
              sourceRevision: exposure.sourceRevision,
              effectiveStart: exposure.effectiveAt,
            })),
            context.medicationHistoryReviewed.observedAt
          )
        : context.medicationHistoryReviewed,
    allergies:
      context.allergyHistoryReviewed.state === 'known'
        ? known(context.allergies, context.allergyHistoryReviewed.observedAt)
        : context.allergyHistoryReviewed,
    pregnancy: context.pregnancy,
    lactation: context.lactation,
    pregnancyIntent:
      context.reproductiveIntent.state === 'known'
        ? known(
            context.reproductiveIntent.value === 'planning',
            context.reproductiveIntent.observedAt
          )
        : context.reproductiveIntent,
    measurements: Object.entries(context.measurements).flatMap(([key, fact]) =>
      fact.state === 'known'
        ? [
            {
              code: key,
              system: 'urn:mieweb:simulation-observation',
              value: fact.value.value,
              unit: fact.value.unit,
              unitCode: fact.value.unit,
              unitSystem: 'http://unitsofmeasure.org',
              effectiveAt: fact.observedAt,
              sourceId: fact.sourceId,
              method: 'method' in fact.value ? fact.value.method : 'synthetic',
              status: 'final',
            },
          ]
        : []
    ),
    renal: context.renal,
    hepatic: context.hepatic,
    coverage:
      context.coverage.active.state === 'known'
        ? known(
            {
              planId: context.coverage.planId,
              memberId: context.coverage.memberId,
              active: context.coverage.active.value,
              revision: context.coverage.revision,
            },
            context.coverage.active.observedAt
          )
        : context.coverage.active,
    completeness: {
      medicationsReviewed: context.completeness.medicationHistory,
      allergiesReviewed: context.completeness.allergyHistory,
    },
  });
  function clinicalFingerprint(
    draft: PrescriptionDraft,
    related: EvaluationRecord['relatedPrescriptions']
  ) {
    return canonical({
      draft: {
        id: draft.id ?? 'preview',
        revision: draft.contentRevision ?? canonical(draft),
      },
      related: [...related]
        .sort((a, b) => a.id.localeCompare(b.id))
        .map((reference) => ({
          id: reference.id,
          revision: rx(reference.id).contentRevision,
        })),
      patient: patient(draft.patientId).revision,
      prescriber: '1',
      pharmacy: draft.pharmacyId
        ? (store.pharmacies.get(draft.pharmacyId)?.revision ?? 'unknown')
        : 'unknown',
      policy: policy().version,
      knowledge: KNOWLEDGE_VERSION,
    });
  }
  function currentDraft(record: EvaluationRecord): PrescriptionDraft {
    return record.subject.kind === 'saved'
      ? rx(record.subject.prescription.id)
      : record.subject.draft;
  }
  function invalidate(patientId: string, prescriptionId?: string) {
    for (const record of store.evaluations.values()) {
      const snapshot = store.evaluationInputs.get(record.id)!;
      if (
        snapshot.input.draft.patientId === patientId &&
        (!prescriptionId ||
          snapshot.input.draft.id === prescriptionId ||
          record.relatedPrescriptions.some(
            (reference) => reference.id === prescriptionId
          ))
      ) {
        record.validity = 'stale';
        record.validityReasons = [
          'Clinical input changed; create a new evaluation',
        ];
        project(record);
      }
    }
    for (const pending of store.signingSessions.values()) {
      if (
        pending.state === 'challenge-pending' &&
        resource(store.reviews, pending.reviewId).selections.some(
          (selection) =>
            rx(selection.prescription.id).patientId === patientId &&
            (!prescriptionId || selection.prescription.id === prescriptionId)
        )
      ) {
        pending.state = 'invalidated';
        pending.revision = increment(pending.revision);
      }
    }
  }
  function clinicalExpiry(record: EvaluationRecord): number[] {
    const input = store.evaluationInputs.get(record.id)!;
    const required = new Set(Object.values(input.policy.requiredChecks).flat());
    return [
      ...Object.entries(record.checks).flatMap(([domain, check]) =>
        required.has(domain as PrescriptionService) && check?.expiresAt
          ? [isoMillis(check.expiresAt)]
          : []
      ),
      ...[
        input.snapshot.context.pregnancy,
        input.snapshot.context.lactation,
        input.snapshot.context.reproductiveIntent,
        input.snapshot.context.medicationHistoryReviewed,
        input.snapshot.context.allergyHistoryReviewed,
      ].flatMap((fact) =>
        fact.state === 'known'
          ? [isoMillis(fact.observedAt) + syntheticRules.maxFactAgeMs]
          : []
      ),
    ];
  }
  function project(record: EvaluationRecord) {
    const previousRepresentation = projectedRepresentations.get(record.id);
    const draft = currentDraft(record);
    const input = store.evaluationInputs.get(record.id)!;
    const requested = Object.values(record.checks);
    if (
      record.validity === 'current' &&
      clinicalFingerprint(draft, record.relatedPrescriptions) !==
        record.inputFingerprint
    ) {
      record.validity = 'stale';
      record.validityReasons = ['Clinical snapshot no longer matches'];
    }
    const expiryTimes = clinicalExpiry(record);
    const query = record.pdmpQueryId
      ? store.pdmpQueries.get(record.pdmpQueryId)
      : null;
    if (query) expiryTimes.push(isoMillis(query.expiresAt));
    const pa = record.priorAuthorizationId
      ? store.priorAuthorizations.get(record.priorAuthorizationId)
      : null;
    if (pa?.expiresAt) expiryTimes.push(isoMillis(pa.expiresAt));
    const signing = record.signingSessionId
      ? store.signingSessions.get(record.signingSessionId)
      : null;
    if (signing?.state === 'challenge-pending')
      expiryTimes.push(isoMillis(signing.expiresAt));
    record.expiresAt = expiryTimes.length
      ? millisISO(Math.min(...expiryTimes))
      : null;
    if (record.validity !== 'stale') {
      record.validity =
        record.expiresAt &&
        isoMillis(record.expiresAt) <= isoMillis(clock.now())
          ? 'expired'
          : 'current';
      record.validityReasons =
        record.validity === 'expired'
          ? ['Required evidence expired; refresh the indicated domain']
          : [];
    }
    record.state = requested.some((check) => check?.status === 'pending')
      ? 'running'
      : requested.some(
            (check) =>
              check &&
              ['partial', 'unavailable', 'not-requested'].includes(check.status)
          )
        ? 'partial'
        : 'complete';
    for (const stage of ['review', 'sign', 'transmit'] as ActionStage[]) {
      const reasons: GateReason[] = [];
      let failed = false;
      const reason = (
        domain: string,
        code: string,
        message: string,
        extras: Partial<GateReason> = {},
        isFailure = false
      ) => {
        reasons.push({ domain, code, message, ...extras });
        failed ||= isFailure;
      };
      if (record.subject.kind !== 'saved')
        reason('snapshot', 'PREVIEW_ONLY', 'Save the draft before this action');
      if (record.validity !== 'current')
        reason(
          'snapshot',
          'EVALUATION_NOT_CURRENT',
          record.validityReasons.join('; ')
        );
      if (
        draft.intent !== 'prescribe' ||
        (draft.id && rx(draft.id).lifecycle === 'cancelled')
      )
        reason(
          'snapshot',
          'INACTIVE_PRESCRIPTION',
          'This is not an active prescription',
          {},
          true
        );
      if (
        session.role !== 'prescriber' ||
        session.actorId !== draft.prescriberId
      )
        reason(
          'prescriber',
          'PRESCRIBER_REVIEW_REQUIRED',
          'The named prescriber must perform this action',
          { remediation: 'prescriber' },
          true
        );
      for (const domain of input.policy.requiredChecks[stage]) {
        if (domain === 'validation') {
          for (const issue of record.validation.issues.filter((issue) =>
            issue.blocks.includes(stage)
          ))
            reason(
              'validation',
              issue.code,
              issue.message,
              { fieldPath: issue.fieldPath, remediation: issue.remediation },
              record.validation.dataState === 'invalid' ||
                record.validation.dataState === 'incomplete'
            );
          if (
            record.validation.checks[
              stage === 'transmit' ? 'transmit' : 'review'
            ] !== 'pass' &&
            !record.validation.issues.some((issue) =>
              issue.blocks.includes(stage)
            )
          )
            reason(
              'validation',
              'VALIDATION_UNKNOWN',
              'Shared validation has unresolved facts'
            );
          continue;
        }
        const check = record.checks[domain];
        if (
          !check ||
          ['pending', 'not-requested', 'partial', 'unavailable'].includes(
            check.status
          ) ||
          check.outcome === 'unknown' ||
          (check.expiresAt &&
            isoMillis(check.expiresAt) <= isoMillis(clock.now()))
        )
          reason(
            domain,
            'CHECK_INCOMPLETE',
            `${domain} check is incomplete or stale`,
            { checkId: domain, remediation: 'clinical-review' }
          );
        for (const item of check?.findings ?? []) {
          if (!item.disposition.blocks.includes(stage)) continue;
          const resolved = record.decisions.some(
            (decision) =>
              decision.findingId === item.id &&
              decision.inputFingerprint === record.inputFingerprint &&
              decision.action === item.disposition.resolution
          );
          if (!resolved)
            reason(
              domain,
              item.code,
              item.summary,
              { findingId: item.id, remediation: 'clinical-review' },
              true
            );
        }
      }
      const schedule = input.snapshot.product?.controlledSchedule;
      const pdmpRequired =
        schedule?.state === 'known' &&
        input.policy.pdmp.requiredForSchedules.includes(schedule.value);
      if (stage !== 'review' && pdmpRequired) {
        const review = query?.reviewId
          ? store.pdmpReviews.get(query.reviewId)
          : null;
        if (
          !query ||
          query.state !== 'complete' ||
          query.match !== 'matched' ||
          !review ||
          review.reportRevision !== query.reportRevision ||
          isoMillis(query.expiresAt) <= isoMillis(clock.now())
        )
          reason(
            'pdmp',
            'PDMP_REVIEW_REQUIRED',
            'A current matched complete PDMP report needs explicit review',
            { remediation: 'pdmp' }
          );
      }
      if (stage === 'sign' && !record.reviewId)
        reason(
          'review',
          'REVIEW_REQUIRED',
          'Individually select this current prescription as ready to sign',
          { remediation: 'sign' }
        );
      if (stage === 'transmit') {
        if (
          !record.signedArtifactId ||
          !store.artifacts.has(record.signedArtifactId)
        )
          reason(
            'signing',
            'SIGNATURE_REQUIRED',
            'A current simulated signing artifact is required',
            { remediation: 'sign' }
          );
        const benefitData = record.checks.benefit?.data as {
          priorAuthorization?: string;
          coverage?: string;
        } | null;
        if (
          input.policy.priorAuthorization.holdTransmit &&
          benefitData?.priorAuthorization === 'yes' &&
          (!pa ||
            pa.state !== 'approved' ||
            (pa.expiresAt && isoMillis(pa.expiresAt) <= isoMillis(clock.now())))
        )
          reason(
            'prior-authorization',
            'PA_HOLD',
            'A matching current PA approval is required by this fixture policy',
            { remediation: 'prior-authorization' }
          );
        if (
          input.policy.holdNonCoveredBenefit &&
          benefitData?.coverage === 'not-covered'
        )
          reason(
            'benefit',
            'COVERAGE_HOLD',
            'This fixture policy requires coverage resolution',
            { remediation: 'coverage' },
            true
          );
        if (draft.id) {
          const originalId = rx(draft.id).replacesPrescriptionId;
          if (
            originalId &&
            input.policy.holdReplacementUntilCancellation &&
            rx(originalId).lifecycle !== 'cancelled'
          )
            reason(
              'cancellation',
              'ORIGINAL_CANCELLATION_REQUIRED',
              'Original cancellation has not been acknowledged',
              { remediation: 'system' }
            );
        }
      }
      record.gates[stage] = {
        state: failed ? 'fail' : reasons.length ? 'unknown' : 'pass',
        reasons,
      };
    }
    const workflowScope = {
      decisions: record.decisions.map((decision) => decision.id),
      pdmp: query
        ? { id: query.id, revision: query.revision, reviewId: query.reviewId }
        : null,
      pa: pa ? { id: pa.id, revision: pa.revision, state: pa.state } : null,
      review: record.reviewId,
      signing: signing ? { id: signing.id, revision: signing.revision } : null,
      artifact: record.signedArtifactId,
    };
    const oldWorkflow = record.workflowFingerprint
      ? (JSON.parse(record.workflowFingerprint) as Record<string, unknown>)
      : {};
    delete oldWorkflow.projection;
    const {
      revision: _revision,
      projectedAt: _projectedAt,
      workflowFingerprint: _workflowFingerprint,
      ...representation
    } = record;
    void _revision;
    void _projectedAt;
    void _workflowFingerprint;
    const nextRepresentation = canonical(representation);
    if (
      previousRepresentation !== nextRepresentation ||
      canonical(oldWorkflow) !== canonical(workflowScope) ||
      record.revision === '0'
    ) {
      record.revision = increment(record.revision);
      record.projectedAt = clock.now();
      record.workflowFingerprint = canonical({
        ...workflowScope,
        projection: record.revision,
      });
      projectedRepresentations.set(record.id, nextRepresentation);
    }
  }
  function projectAll() {
    for (const record of store.evaluations.values()) project(record);
  }
  function requireGate(record: EvaluationRecord, stage: ActionStage) {
    project(record);
    if (record.gates[stage].state !== 'pass')
      fail(
        422,
        'ACTION_GATE_BLOCKED',
        `The ${stage} gate has unresolved checks`,
        {
          issues: record.gates[stage].reasons.map((reason) => ({
            fieldPath: reason.fieldPath,
            message: reason.message,
          })),
        }
      );
  }
  const page = <T>(items: T[], cursor: string | null, limit = 20) => {
    const start = cursor === null ? 0 : Number(cursor);
    if (!Number.isInteger(start) || start < 0)
      fail(400, 'INVALID_CURSOR', 'Cursor must identify an existing page');
    return {
      items: items.slice(start, start + limit),
      nextCursor: start + limit < items.length ? String(start + limit) : null,
    };
  };
  function read(path: string): ApiResponse<unknown> {
    const url = new URL(path, 'https://simulation.invalid');
    const segments = url.pathname.split('/').filter(Boolean);
    const [domain, id, child, childId] = segments;
    if (domain === 'capabilities' && !id) {
      const capabilities: Capabilities = {
        mode: 'simulation',
        services: Object.fromEntries(
          [...SERVICES, 'pdmp', 'prior-authorization', 'transmission'].map(
            (service) => [
              service,
              scenario.unsupportedService && service === 'interactions'
                ? 'unsupported'
                : 'supported',
            ]
          )
        ),
        profiles: [{ id: policy().id, version: policy().version }],
        transactionTypes: ['NewRx', 'CancelRx'],
        maxBatchSize: 20,
        pollAfterMs: 500,
        maxPollingMs: 30000,
      };
      return response(200, capabilities);
    }
    if (domain === 'policies' && id && !child)
      return response(200, resource(store.policies, id));
    if (domain === 'patients' && id && child === 'context') {
      const context = patient(id);
      return response(200, contextResponse(context), id, context.revision);
    }
    if (domain === 'drugs') {
      const productDto = (product: FixtureProduct) => ({
        ...product,
        conceptSpecificity: product.specificity,
        doseForm: product.form,
      });
      if (id) return response(200, productDto(resource(store.products, id)));
      const query = url.searchParams.get('q') ?? '';
      if (query.trim().length < 2)
        fail(400, 'QUERY_TOO_SHORT', 'Use at least two characters');
      return response(
        200,
        page(
          [...store.products.values()]
            .filter((product) =>
              product.display.toLowerCase().includes(query.toLowerCase())
            )
            .map(productDto),
          url.searchParams.get('cursor')
        )
      );
    }
    if (domain === 'pharmacies' && !id) {
      const query = url.searchParams.get('q') ?? '';
      return response(
        200,
        page(
          [...store.pharmacies.values()]
            .filter((pharmacy) =>
              pharmacy.name.toLowerCase().includes(query.toLowerCase())
            )
            .map((pharmacy) => ({
              ...pharmacy,
              newRx: pharmacy.capabilities.NewRx,
              cancelRx: pharmacy.capabilities.CancelRx,
              epcs: pharmacy.capabilities.epcs,
            })),
          url.searchParams.get('cursor')
        )
      );
    }
    if (domain === 'prescriptions') {
      if (!id) {
        const patientId = url.searchParams.get('patientId');
        if (!patientId) fail(400, 'PATIENT_ID_REQUIRED', 'Supply patientId');
        patient(patientId!);
        return response(
          200,
          page(
            [...store.prescriptions.values()].filter(
              (record) =>
                record.patientId === patientId &&
                (!url.searchParams.has('encounterId') ||
                  record.encounterId === url.searchParams.get('encounterId'))
            ),
            url.searchParams.get('cursor')
          )
        );
      }
      const record = rx(id);
      if (child === 'events')
        return response(
          200,
          page(
            [...store.events.values()].filter(
              (entry) => entry.prescriptionId === id
            ),
            url.searchParams.get('cursor')
          )
        );
      if (!child) return response(200, record, record.id, record.recordVersion);
    }
    if (domain === 'evaluations' && id && !child) {
      const record = evaluation(id);
      return response(200, record, id, record.revision);
    }
    if (domain === 'pdmp-queries' && id && !child) {
      const record = resource(store.pdmpQueries, id);
      authorize(record.patientId);
      return response(200, record, id, record.revision);
    }
    if (domain === 'prior-authorizations' && id) {
      const record = resource(store.priorAuthorizations, id);
      authorize(record.patientId);
      if (!child) return response(200, record, id, record.revision);
      if (child === 'questionnaire')
        return response(
          200,
          resource(
            store.questionnaires,
            `${record.questionnaire.id}:${record.questionnaire.version}`
          )
        );
      if (child === 'submissions' && childId) {
        const submission = resource(store.submissions, childId);
        if (submission.caseId !== id)
          fail(404, 'RESOURCE_NOT_FOUND', 'Submission is outside this case');
        return response(200, submission, childId, submission.revision);
      }
    }
    if (domain === 'signing-sessions' && id && !child) {
      const record = resource(store.signingSessions, id);
      authorize(resource(store.reviews, record.reviewId).patientId);
      return response(200, record, id, record.revision);
    }
    if (domain === 'signed-artifacts' && id && !child) {
      const record = resource(store.artifacts, id);
      authorize(rx(record.prescription.id).patientId);
      return response(200, record);
    }
    if (domain === 'transmissions' && id && !child) {
      const record = resource(store.transmissions, id);
      authorize(rx(record.prescription.id).patientId);
      return response(200, record, id, record.revision);
    }
    if (domain === 'cancellations' && id && !child) {
      const record = resource(store.cancellations, id);
      authorize(rx(record.prescription.id).patientId);
      return response(200, record, id, record.revision);
    }
    return fail(404, 'ROUTE_NOT_FOUND', `No GET route ${path}`);
  }

  // Mutation handlers below run synchronously between preconditions and commit.
  // Provider jobs are scheduled afterward; GET never calls these handlers.
  function createDraft(
    draft: PrescriptionDraft,
    replacesPrescriptionId: string | null = null
  ): PrescriptionRecord {
    patient(draft.patientId);
    if (!draft.display.trim())
      fail(400, 'DISPLAY_REQUIRED', 'A nonempty display is the draft minimum');
    const id = nextId('rx');
    const record: PrescriptionRecord = {
      ...clone(draft),
      id,
      contentRevision: '1',
      recordVersion: '1',
      lifecycle: 'draft',
      createdAt: clock.now(),
      updatedAt: clock.now(),
      latestEvaluationId: null,
      reviewId: null,
      signedArtifactId: null,
      latestTransmissionId: null,
      replacesPrescriptionId,
    };
    store.prescriptions.set(id, record);
    event('prescription.created', id);
    return record;
  }
  function verifyWorkflowLinks(
    record: EvaluationRecord,
    pdmpQueryId: string | null,
    priorAuthorizationId: string | null
  ) {
    if (record.subject.kind !== 'saved')
      fail(
        409,
        'PREVIEW_ONLY',
        'Preview evaluations cannot attach durable workflow records'
      );
    const draft = expectContent(
      (
        record.subject as Extract<
          EvaluationRecord['subject'],
          { kind: 'saved' }
        >
      ).prescription
    );
    if (
      record.validity === 'stale' ||
      clinicalFingerprint(draft, record.relatedPrescriptions) !==
        record.inputFingerprint ||
      clinicalExpiry(record).some((expiry) => expiry <= isoMillis(clock.now()))
    )
      fail(
        409,
        'STALE_EVALUATION',
        'Create a current fresh clinical evaluation'
      );
    verifyWorkflowScope(draft, pdmpQueryId, priorAuthorizationId);
  }
  function verifyWorkflowScope(
    draft: PrescriptionDraft,
    pdmpQueryId: string | null,
    priorAuthorizationId: string | null
  ) {
    if (pdmpQueryId) {
      const query = resource(store.pdmpQueries, pdmpQueryId);
      authorize(query.patientId);
      if (
        query.patientId !== draft.patientId ||
        query.prescriberId !== draft.prescriberId ||
        query.purposeCode !== 'treatment' ||
        !policy().pdmp.jurisdictions.every((jurisdiction) =>
          query.requestedJurisdictions.includes(jurisdiction)
        )
      )
        fail(
          422,
          'PDMP_SCOPE_MISMATCH',
          'PDMP query does not match this patient, prescriber, purpose and jurisdiction'
        );
    }
    if (priorAuthorizationId) {
      const pa = resource(store.priorAuthorizations, priorAuthorizationId);
      authorize(pa.patientId);
      if (
        pa.patientId !== draft.patientId ||
        pa.scope.productId !== draft.prescription.productId ||
        pa.scope.quantity !== draft.prescription.quantity ||
        pa.scope.quantityUnit !== draft.prescription.quantityUnit ||
        pa.scope.daysSupply !== draft.prescription.daysSupply ||
        pa.scope.indication !== draft.prescription.indication ||
        pa.planId !== patient(draft.patientId).coverage.planId ||
        pa.scope.coverageRevision !== patient(draft.patientId).coverage.revision
      )
        fail(
          422,
          'PA_SCOPE_MISMATCH',
          'Authorization applies to different product, dispensing, indication or coverage'
        );
    }
  }
  function questionnaire(record: PriorAuthorizationCase): QuestionnaireRecord {
    return resource(
      store.questionnaires,
      `${record.questionnaire.id}:${record.questionnaire.version}`
    );
  }
  function answerIssues(
    record: PriorAuthorizationCase,
    answers: QuestionnaireAnswer[]
  ) {
    const issues: Array<{ fieldPath: string; message: string }> = [];
    const form = questionnaire(record);
    const seen = new Set<string>();
    for (const answer of answers) {
      if (seen.has(answer.linkId))
        issues.push({ fieldPath: answer.linkId, message: 'Duplicate answer' });
      seen.add(answer.linkId);
      const item = form.items.find((item) => item.linkId === answer.linkId);
      if (!item) {
        issues.push({
          fieldPath: answer.linkId,
          message: 'Unknown questionnaire item',
        });
        continue;
      }
      const valid =
        item.type === 'boolean'
          ? typeof answer.value === 'boolean'
          : item.type === 'integer'
            ? typeof answer.value === 'number' && Number.isInteger(answer.value)
            : item.type === 'decimal'
              ? typeof answer.value === 'number' &&
                Number.isFinite(answer.value)
              : typeof answer.value === 'string' &&
                (item.type !== 'choice' ||
                  item.choices?.includes(answer.value)) &&
                (item.type !== 'date' ||
                  (/^\d{4}-\d{2}-\d{2}$/.test(answer.value) &&
                    DateTime.fromISO(answer.value, { zone: 'UTC' }).isValid));
      if (!valid)
        issues.push({
          fieldPath: item.linkId,
          message: 'Answer must match the item type/choices',
        });
    }
    for (const item of form.items) {
      const enabled =
        item.enableWhen?.every(
          (condition) =>
            answers.find((answer) => answer.linkId === condition.linkId)
              ?.value === condition.equals
        ) ?? true;
      if (
        item.required &&
        enabled &&
        !answers.some(
          (answer) => answer.linkId === item.linkId && answer.value !== ''
        )
      )
        issues.push({
          fieldPath: item.linkId,
          message: 'Required answer is missing',
        });
    }
    return issues;
  }
  function scheduleTransmission(record: TransmissionRecord, retry = false) {
    scheduler.schedule(`${record.id}:submit`, 100, () => {
      record.state = 'submitted';
      record.revision = increment(record.revision);
      record.updatedAt = clock.now();
      record.attempts[record.attempts.length - 1].submittedAt = clock.now();
      record.attempts[record.attempts.length - 1].outcome = 'submitted';
      event('transmission.submitted', record.prescription.id, [record.id]);
    });
    scheduler.schedule(`${record.id}:outcome`, 500, () => {
      record.state = retry
        ? 'acknowledged'
        : scenario.transmission === 'rejected'
          ? 'rejected'
          : scenario.transmission === 'unknown'
            ? 'unknown-outcome'
            : 'acknowledged';
      record.revision = increment(record.revision);
      record.updatedAt = clock.now();
      record.attempts[record.attempts.length - 1].outcome = record.state;
      if (record.state === 'acknowledged') {
        record.receipt = {
          id: nextId('sim-receipt'),
          receivedAt: clock.now(),
          message: 'Simulated destination acknowledgement; not dispensing',
        };
        const prescription = rx(record.prescription.id);
        prescription.lifecycle = 'transmitted';
        bumpRx(prescription);
      }
      if (record.state === 'rejected')
        record.error = {
          code: 'SIM_DESTINATION_REJECTED',
          message: 'Synthetic destination rejected this transmission',
          retryable: false,
        };
      event(
        'transmission.outcome',
        record.prescription.id,
        [record.id],
        record.state
      );
      projectAll();
    });
  }
  function mutate(
    method: 'POST' | 'PUT',
    path: string,
    body: Record<string, unknown>,
    requestOptions: RequestOptions
  ): ApiResponse<unknown> {
    const [domain, id, child] = path.split('?')[0].split('/').filter(Boolean);
    if (domain === 'prescriptions' && method === 'POST' && !id) {
      const draft = body as unknown as PrescriptionDraft;
      if (draft.id || draft.contentRevision)
        fail(
          400,
          'SERVER_OWNED_ID',
          'New draft identity/revision is server-owned'
        );
      const record = createDraft(draft);
      return response(
        201,
        record,
        record.id,
        record.recordVersion,
        `/prescriptions/${record.id}`
      );
    }
    if (domain === 'prescriptions' && method === 'PUT' && id && !child) {
      const record = rx(id);
      precondition(id, record.recordVersion, requestOptions);
      const draft = body as unknown as PrescriptionDraft;
      if (
        draft.patientId !== record.patientId ||
        (draft.id && draft.id !== record.id)
      )
        fail(
          400,
          'FIXED_IDENTITY',
          'Prescription/patient identity cannot be changed'
        );
      if (record.signedArtifactId || record.lifecycle === 'cancelled')
        fail(
          409,
          'SIGNED_CONTENT_IMMUTABLE',
          'Use the cancellation/replacement workflow for signed or cancelled content'
        );
      const fixed = {
        id: record.id,
        createdAt: record.createdAt,
        replacesPrescriptionId: record.replacesPrescriptionId,
      };
      Object.assign(record, clone(draft), fixed, {
        contentRevision: increment(record.contentRevision),
        lifecycle: 'draft',
        reviewId: null,
        signedArtifactId: null,
        latestEvaluationId: null,
      });
      bumpRx(record);
      invalidate(record.patientId, id);
      event('prescription.updated', id);
      return response(200, record, id, record.recordVersion);
    }
    if (domain === 'evaluations' && method === 'POST' && !id) {
      const input = body as unknown as EvaluationRequest;
      const draft =
        input.subject.kind === 'saved'
          ? expectContent(input.subject.prescription)
          : clone(input.subject.draft);
      patient(draft.patientId);
      const related = (input.relatedPrescriptions ?? []).map((reference) => {
        const other = expectContent(reference);
        if (other.patientId !== draft.patientId || other.id === draft.id)
          fail(
            422,
            'RELATED_PATIENT_MISMATCH',
            'Related prescriptions must be distinct same-patient orders'
          );
        return {
          draft: clone(other),
          product:
            store.products.get(other.prescription.productId ?? '') ?? null,
        };
      });
      if (
        scenario.unsupportedService &&
        input.services.includes('interactions')
      )
        fail(
          422,
          'SERVICE_UNSUPPORTED',
          'This fixture capability does not support interactions'
        );
      if (input.pdmpQueryId || input.priorAuthorizationId)
        verifyWorkflowScope(
          draft,
          input.pdmpQueryId ?? null,
          input.priorAuthorizationId ?? null
        );
      const evaluationId = nextId('ev');
      const validation = validationInput(draft);
      const snapshot: ProviderSnapshot = {
        draft: clone(draft),
        context: clone(patient(draft.patientId)),
        product: clone(
          store.products.get(draft.prescription.productId ?? '') ?? null
        ),
        related,
        scenario: clone(scenario),
        now: clock.now(),
      };
      const record: EvaluationRecord = {
        id: evaluationId,
        revision: '0',
        subject: clone(input.subject),
        relatedPrescriptions: clone(input.relatedPrescriptions ?? []),
        patientContextRevision: snapshot.context.revision,
        prescriberContextRevision: '1',
        pharmacyRevision: draft.pharmacyId
          ? (store.pharmacies.get(draft.pharmacyId)?.revision ?? 'unknown')
          : 'unknown',
        policyVersion: policy().version,
        knowledgeVersions: Object.fromEntries(
          SERVICES.map((domain) => [domain, KNOWLEDGE_VERSION])
        ),
        inputFingerprint: clinicalFingerprint(
          draft,
          input.relatedPrescriptions ?? []
        ),
        workflowFingerprint: '',
        createdAt: clock.now(),
        projectedAt: clock.now(),
        expiresAt: null,
        validity: 'current',
        validityReasons: [],
        state: 'running',
        validation: validatePrescription(validation, policy()),
        checks: {},
        pdmpQueryId: input.pdmpQueryId ?? null,
        priorAuthorizationId: input.priorAuthorizationId ?? null,
        decisions: [],
        gates: {
          review: { state: 'unknown', reasons: [] },
          sign: { state: 'unknown', reasons: [] },
          transmit: { state: 'unknown', reasons: [] },
        },
        reviewId: null,
        signingSessionId: null,
        signedArtifactId: null,
        pollAfterMs: 500,
      };
      store.evaluationInputs.set(evaluationId, {
        input: clone(validation),
        snapshot,
        policy: clone(policy()),
      });
      // A required but omitted service remains explicit rather than disappearing from gates.
      for (const domain of SERVICES.filter((domain) => domain !== 'validation'))
        record.checks[domain] = emptyCheck(
          domain,
          input.services.includes(domain) ? 'pending' : 'not-requested'
        ) as import('../../prescribing/api/contracts').CheckResult;
      store.evaluations.set(evaluationId, record);
      if (input.subject.kind === 'saved') {
        const prescription = rx(input.subject.prescription.id);
        prescription.latestEvaluationId = evaluationId;
        bumpRx(prescription);
      }
      project(record);
      for (const domain of input.services.filter(
        (domain): domain is keyof typeof syntheticProviders =>
          domain !== 'validation'
      )) {
        scheduler.schedule(`${evaluationId}:${domain}`, DELAYS[domain], () => {
          // Provider uses its original immutable inputs, never the newly edited draft.
          record.checks[domain] = syntheticProviders[domain]({
            ...snapshot,
            now: clock.now(),
          }) as import('../../prescribing/api/contracts').CheckResult;
          project(record);
        });
      }
      scheduler.schedule(
        `expiry:${evaluationId}`,
        syntheticRules.maxFactAgeMs,
        () => project(record)
      );
      event('evaluation.created', draft.id ?? null, [evaluationId]);
      return response(
        record.state === 'running' ? 202 : 200,
        record,
        evaluationId,
        record.revision,
        `/evaluations/${evaluationId}`
      );
    }
    if (
      domain === 'evaluations' &&
      id &&
      method === 'PUT' &&
      child === 'workflow-context'
    ) {
      const record = evaluation(id);
      precondition(id, record.revision, requestOptions);
      verifyWorkflowLinks(
        record,
        body.pdmpQueryId as string | null,
        body.priorAuthorizationId as string | null
      );
      record.pdmpQueryId = body.pdmpQueryId as string | null;
      record.priorAuthorizationId = body.priorAuthorizationId as string | null;
      project(record);
      event('evaluation.workflow-linked', currentDraft(record).id ?? null, [
        record.id,
      ]);
      return response(200, record, id, record.revision);
    }
    if (
      domain === 'evaluations' &&
      id &&
      method === 'POST' &&
      child === 'decisions'
    ) {
      const record = evaluation(id);
      precondition(id, record.revision, requestOptions);
      if (record.subject.kind === 'preview' || record.validity !== 'current')
        fail(
          409,
          'DECISION_SNAPSHOT_INVALID',
          'Only a current saved evaluation may record a durable decision'
        );
      authorize(currentDraft(record).patientId, 'decisions', true);
      const item =
        Object.values(record.checks)
          .flatMap((check) => check?.findings ?? [])
          .find((item) => item.id === body.findingId) ??
        fail(404, 'FINDING_NOT_FOUND', 'Finding is not in this evaluation');
      if (
        item.disposition.resolution !== body.action ||
        !item.disposition.allowedReasonCodes.includes(body.reasonCode as string)
      )
        fail(
          422,
          'DECISION_NOT_PERMITTED',
          'This finding cannot be resolved by that action/reason'
        );
      const decision: DecisionRecord = {
        id: nextId('decision'),
        revision: '1',
        evaluationId: id,
        findingId: item.id,
        action: body.action as DecisionRecord['action'],
        reasonCode: body.reasonCode as string,
        ...(typeof body.comment === 'string' ? { comment: body.comment } : {}),
        ...(typeof body.mitigation === 'string'
          ? { mitigation: body.mitigation }
          : {}),
        actorId: session.actorId,
        createdAt: clock.now(),
        inputFingerprint: record.inputFingerprint,
      };
      store.decisions.set(decision.id, decision);
      record.decisions.push(decision);
      project(record);
      event('finding.decision', currentDraft(record).id ?? null, [decision.id]);
      return response(
        201,
        decision,
        decision.id,
        decision.revision,
        `/evaluations/${id}`
      );
    }
    if (domain === 'pdmp-queries' && method === 'POST' && !id) {
      const input = body as unknown as PdmpQueryRequest;
      patient(input.patientId);
      authorize(input.patientId, 'pdmp-queries', true);
      if (
        input.prescriberId !== session.actorId ||
        input.purposeCode !== 'treatment' ||
        !input.attestation ||
        !input.jurisdictions.length ||
        input.jurisdictions.some(
          (jurisdiction) => !['SIM', 'SIM-NEIGHBOR'].includes(jurisdiction)
        )
      )
        fail(
          422,
          'PDMP_REQUEST_NOT_PERMITTED',
          'Confirm permitted prescriber, purpose, jurisdictions and query attestation'
        );
      const queryId = nextId('pdmp');
      const record: PdmpQueryRecord = {
        id: queryId,
        revision: '1',
        patientId: input.patientId,
        prescriberId: input.prescriberId,
        requestedJurisdictions: [...input.jurisdictions],
        purposeCode: input.purposeCode,
        state: 'queued',
        match: 'matched',
        jurisdictions: input.jurisdictions.map((jurisdiction) => ({
          jurisdiction,
          status: 'pending',
        })),
        reportRevision: null,
        reportGeneratedAt: null,
        queriedAt: clock.now(),
        expiresAt: millisISO(isoMillis(clock.now()) + policy().pdmp.maxAgeMs),
        entries: [],
        reviewId: null,
        pollAfterMs: 500,
      };
      store.pdmpQueries.set(queryId, record);
      scheduler.schedule(`${queryId}:report`, 400, () => {
        const mode =
          scenario.unavailable === 'pdmp' ? 'unavailable' : scenario.pdmp;
        record.state =
          mode === 'partial'
            ? 'partial'
            : mode === 'unavailable'
              ? 'unavailable'
              : 'complete';
        record.match = mode === 'ambiguous' ? 'ambiguous' : 'matched';
        record.jurisdictions = record.requestedJurisdictions.map(
          (jurisdiction, index) => ({
            jurisdiction,
            status:
              record.state === 'unavailable' ||
              (record.state === 'partial' &&
                index === record.requestedJurisdictions.length - 1)
                ? 'unavailable'
                : 'complete',
          })
        );
        record.reportRevision = record.state === 'unavailable' ? null : '1';
        record.reportGeneratedAt =
          record.state === 'unavailable' ? null : clock.now();
        record.revision = increment(record.revision);
        if (mode !== 'empty' && record.state !== 'unavailable')
          record.entries = [
            {
              id: 'sim-dispense-1',
              productId: 'sim-controlled',
              dispenseDate: '2026-09-30',
              quantity: '10',
              unit: 'tablet',
              daysSupply: '10',
              jurisdiction: 'SIM',
            },
          ];
        if (mode === 'stale') record.expiresAt = clock.now();
        projectAll();
        event('pdmp.report', null, [queryId], record.state);
      });
      scheduler.schedule(
        `expiry:${queryId}`,
        policy().pdmp.maxAgeMs,
        projectAll
      );
      return response(
        202,
        record,
        queryId,
        record.revision,
        `/pdmp-queries/${queryId}`
      );
    }
    if (
      domain === 'pdmp-queries' &&
      method === 'POST' &&
      id &&
      child === 'reviews'
    ) {
      const query = resource(store.pdmpQueries, id);
      authorize(query.patientId, 'pdmp-reviews', true);
      precondition(id, query.revision, requestOptions);
      if (
        query.prescriberId !== session.actorId ||
        query.state !== 'complete' ||
        query.match !== 'matched' ||
        query.reportRevision !== body.reviewedReportRevision ||
        query.purposeCode !== body.purposeCode ||
        isoMillis(query.expiresAt) <= isoMillis(clock.now())
      )
        fail(
          422,
          'PDMP_REPORT_NOT_REVIEWABLE',
          'Only the current complete matched report may be reviewed'
        );
      const record: PdmpReviewRecord = {
        id: nextId('pdmp-review'),
        revision: '1',
        queryId: id,
        reportRevision: query.reportRevision!,
        actorId: session.actorId,
        reviewedAt: clock.now(),
        purposeCode: body.purposeCode as string,
        ...(typeof body.comment === 'string' ? { comment: body.comment } : {}),
      };
      store.pdmpReviews.set(record.id, record);
      query.reviewId = record.id;
      query.revision = increment(query.revision);
      projectAll();
      event('pdmp.reviewed', null, [id, record.id]);
      return response(
        201,
        record,
        record.id,
        record.revision,
        `/pdmp-queries/${id}`
      );
    }
    if (domain === 'prior-authorizations' && method === 'POST' && !id) {
      const draft = expectContent(
        body.prescription as { id: string; revision: string }
      );
      const evaluationRecord = evaluation(body.evaluationId as string);
      if (body.benefitType !== 'pharmacy')
        fail(
          422,
          'PA_ROUTE_UNSUPPORTED',
          'This fixture supports only synthetic pharmacy authorization'
        );
      if (
        evaluationRecord.subject.kind !== 'saved' ||
        evaluationRecord.subject.prescription.id !== draft.id ||
        evaluationRecord.subject.prescription.revision !==
          draft.contentRevision ||
        evaluationRecord.validity !== 'current'
      )
        fail(
          422,
          'PA_EVALUATION_MISMATCH',
          'PA requires a current matching saved evaluation'
        );
      const coverage = patient(draft.patientId).coverage;
      const benefit = evaluationRecord.checks.benefit?.data as {
        inquiryId?: string;
      } | null;
      if (body.benefitInquiryId && body.benefitInquiryId !== benefit?.inquiryId)
        fail(
          422,
          'BENEFIT_SCOPE_MISMATCH',
          'Benefit inquiry is outside this evaluation'
        );
      if (
        !draft.prescription.productId ||
        !draft.prescription.quantity ||
        !draft.prescription.quantityUnit
      )
        fail(
          422,
          'PA_SCOPE_INCOMPLETE',
          'Complete product and dispensing scope before creating PA'
        );
      const caseId = nextId('pa');
      const formId = nextId('questionnaire');
      const form: QuestionnaireRecord = {
        id: formId,
        version: '1',
        items: [
          {
            linkId: 'indication',
            text: 'Synthetic indication for this request',
            type: 'string',
            required: true,
          },
          {
            linkId: 'tried-alternative',
            text: 'Was the invented alternative tried?',
            type: 'boolean',
            required: true,
          },
          {
            linkId: 'alternative-reason',
            text: 'Explain the invented alternative result',
            type: 'string',
            required: true,
            enableWhen: [{ linkId: 'tried-alternative', equals: true }],
          },
          {
            linkId: 'visit-date',
            text: 'Synthetic visit date',
            type: 'date',
            required: false,
          },
          {
            linkId: 'severity',
            text: 'Synthetic severity',
            type: 'choice',
            choices: ['mild', 'severe'],
            required: false,
          },
          {
            linkId: 'days',
            text: 'Synthetic number of days',
            type: 'integer',
            required: false,
          },
          {
            linkId: 'measurement',
            text: 'Synthetic decimal measurement',
            type: 'decimal',
            required: false,
          },
          {
            linkId: 'severe-alternative-note',
            text: 'Explain the severe invented alternative result',
            type: 'string',
            required: true,
            enableWhen: [
              { linkId: 'tried-alternative', equals: true },
              { linkId: 'severity', equals: 'severe' },
            ],
          },
        ],
      };
      const record: PriorAuthorizationCase = {
        id: caseId,
        revision: '1',
        patientId: draft.patientId,
        prescription: { id: draft.id, revision: draft.contentRevision },
        evaluationId: evaluationRecord.id,
        planId: coverage.planId,
        benefitType: 'pharmacy',
        route: 'simulation',
        scope: {
          productId: draft.prescription.productId!,
          quantity: draft.prescription.quantity!,
          quantityUnit: draft.prescription.quantityUnit!,
          ...(draft.prescription.daysSupply
            ? { daysSupply: draft.prescription.daysSupply }
            : {}),
          ...(draft.prescription.indication
            ? { indication: draft.prescription.indication }
            : {}),
          coverageRevision: coverage.revision,
        },
        createdAt: clock.now(),
        state: 'questionnaire-needed',
        questionnaire: { id: formId, version: '1' },
        answers: [],
        documentReferences: [],
        answerIssues: [],
        submissionIds: [],
        decision: null,
        expiresAt: null,
        pollAfterMs: 500,
      };
      store.questionnaires.set(`${formId}:1`, form);
      store.priorAuthorizations.set(caseId, record);
      event('pa.created', draft.id, [caseId]);
      return response(
        201,
        record,
        caseId,
        record.revision,
        `/prior-authorizations/${caseId}`
      );
    }
    if (domain === 'prior-authorizations' && id) {
      const record = resource(store.priorAuthorizations, id);
      authorize(record.patientId);
      if (method === 'PUT' && child === 'answers') {
        precondition(id, record.revision, requestOptions);
        if (
          ![
            'draft',
            'questionnaire-needed',
            'ready-to-submit',
            'more-information-needed',
          ].includes(record.state)
        )
          fail(
            409,
            'PA_ANSWERS_IMMUTABLE',
            'Answers cannot be edited in this case state'
          );
        if (
          body.questionnaireId !== record.questionnaire.id ||
          body.questionnaireVersion !== record.questionnaire.version
        )
          fail(
            409,
            'QUESTIONNAIRE_VERSION_CONFLICT',
            'Use the current questionnaire version'
          );
        const answers = clone(body.answers as QuestionnaireAnswer[]);
        const issues = answerIssues(record, answers);
        record.answers = answers;
        record.documentReferences = clone(
          (body.documentReferences ?? []) as string[]
        );
        record.answerIssues = issues;
        record.state = issues.length
          ? 'questionnaire-needed'
          : 'ready-to-submit';
        record.revision = increment(record.revision);
        projectAll();
        event('pa.answers.saved', record.prescription.id, [id]);
        return response(200, record, id, record.revision);
      }
      if (method === 'POST' && child === 'submissions') {
        if (
          body.caseRevision !== record.revision ||
          body.questionnaireVersion !== record.questionnaire.version
        )
          fail(409, 'PA_REVISION_CONFLICT', 'Use current case/form revisions');
        if (body.submissionKind === 'appeal')
          fail(
            422,
            'APPEAL_UNSUPPORTED',
            'This fixture route does not support appeals; use the documented manual next step'
          );
        if (record.state !== 'ready-to-submit')
          fail(
            409,
            'PA_NOT_READY',
            'Complete the applicable questionnaire first'
          );
        const issues = answerIssues(record, record.answers);
        if (issues.length)
          fail(422, 'PA_REQUIRED_ANSWERS', 'Required answers are missing', {
            issues,
          });
        const isAdditional = record.questionnaire.version !== '1';
        if ((body.submissionKind === 'additional-information') !== isAdditional)
          fail(
            409,
            'PA_SUBMISSION_KIND',
            'Submission kind does not match the questionnaire workflow'
          );
        const currentDraftRecord = rx(record.prescription.id);
        if (
          currentDraftRecord.prescription.productId !==
            record.scope.productId ||
          currentDraftRecord.prescription.quantity !== record.scope.quantity ||
          patient(record.patientId).coverage.revision !==
            record.scope.coverageRevision
        )
          fail(
            422,
            'PA_SCOPE_MISMATCH',
            'Prescription or plan changed; create a current authorization case'
          );
        const submission: SubmissionRecord = {
          id: nextId('pa-submission'),
          revision: '1',
          caseId: id,
          questionnaireId: record.questionnaire.id,
          questionnaireVersion: record.questionnaire.version,
          submissionKind:
            body.submissionKind as SubmissionRecord['submissionKind'],
          state: 'queued',
          outcome: null,
          pollAfterMs: 500,
        };
        store.submissions.set(submission.id, submission);
        record.submissionIds.push(submission.id);
        record.state = 'submitted';
        record.revision = increment(record.revision);
        projectAll();
        scheduler.schedule(`${submission.id}:sent`, 100, () => {
          if (record.state === 'cancelled') return;
          submission.state = 'sent';
          submission.revision = increment(submission.revision);
          record.state = 'pending';
          record.revision = increment(record.revision);
          projectAll();
        });
        scheduler.schedule(`${submission.id}:decision`, 1000, () => {
          if (record.state === 'cancelled') return;
          submission.state = 'acknowledged';
          submission.revision = increment(submission.revision);
          if (scenario.pa === 'pending') {
            submission.outcome = 'pending';
            return;
          }
          const outcome =
            scenario.pa === 'denied'
              ? 'denied'
              : scenario.pa === 'more-info' && !isAdditional
                ? 'more-information-needed'
                : 'approved';
          record.state = outcome;
          submission.outcome = outcome;
          record.decision = {
            authorizationReference:
              outcome === 'approved' ? nextId('sim-authorization') : null,
            effectiveFrom: outcome === 'approved' ? clock.now() : null,
            effectiveTo:
              outcome === 'approved'
                ? millisISO(isoMillis(clock.now()) + 7 * 86400000)
                : null,
            approvedQuantity:
              outcome === 'approved' ? record.scope.quantity : null,
            reasons:
              outcome === 'denied'
                ? ['Invented payer denial reason']
                : outcome === 'more-information-needed'
                  ? ['Additional invented documentation needed']
                  : [],
            actions:
              outcome === 'denied'
                ? ['manual-review']
                : outcome === 'more-information-needed'
                  ? ['complete-new-questionnaire']
                  : [],
          };
          if (outcome === 'more-information-needed') {
            const oldForm = questionnaire(record);
            const version = increment(oldForm.version);
            const newForm: QuestionnaireRecord = {
              ...clone(oldForm),
              version,
              items: [
                ...clone(oldForm.items),
                {
                  linkId: 'additional-note',
                  text: 'Additional synthetic documentation',
                  type: 'string',
                  required: true,
                },
              ],
            };
            record.questionnaire.version = version;
            store.questionnaires.set(`${newForm.id}:${version}`, newForm);
            record.answerIssues = answerIssues(record, record.answers);
          }
          record.expiresAt = record.decision.effectiveTo;
          record.revision = increment(record.revision);
          projectAll();
          event(
            'pa.decision',
            record.prescription.id,
            [record.id, submission.id],
            outcome
          );
          if (record.expiresAt)
            scheduler.schedule(
              `expiry:${record.id}`,
              isoMillis(record.expiresAt) - isoMillis(clock.now()),
              () => {
                if (record.state === 'approved') {
                  record.state = 'expired';
                  record.revision = increment(record.revision);
                  projectAll();
                }
              }
            );
        });
        event('pa.submitted', record.prescription.id, [
          record.id,
          submission.id,
        ]);
        return response(
          202,
          submission,
          submission.id,
          submission.revision,
          `/prior-authorizations/${id}/submissions/${submission.id}`
        );
      }
      if (method === 'POST' && child === 'cancellations') {
        if (body.caseRevision !== record.revision)
          fail(409, 'PA_REVISION_CONFLICT', 'Use the current PA revision');
        if (
          record.state === 'cancelled' ||
          record.cancellation?.state === 'requested'
        )
          fail(
            409,
            'PA_CANCELLATION_STATE',
            'The case is cancelled or cancellation is pending'
          );
        const cancellationId = nextId('pa-cancellation');
        const local = record.submissionIds.every(
          (submissionId) =>
            resource(store.submissions, submissionId).state === 'queued'
        );
        record.cancellation = {
          requestedAt: clock.now(),
          reasonCode: body.reasonCode as string,
          state: local ? 'acknowledged' : 'requested',
        };
        record.revision = increment(record.revision);
        if (local) record.state = 'cancelled';
        else
          scheduler.schedule(`${cancellationId}:outcome`, 500, () => {
            const state =
              scenario.cancellation === 'rejected'
                ? 'rejected'
                : scenario.cancellation === 'unknown'
                  ? 'unknown'
                  : 'acknowledged';
            record.cancellation!.state = state;
            record.cancellation!.providerReference = `urn:mieweb:simulation:${cancellationId}`;
            if (state === 'acknowledged') record.state = 'cancelled';
            record.revision = increment(record.revision);
            projectAll();
          });
        projectAll();
        event('pa.cancellation', record.prescription.id, [
          record.id,
          cancellationId,
        ]);
        return response(
          local ? 200 : 202,
          record,
          id,
          record.revision,
          `/prior-authorizations/${id}`
        );
      }
    }
    if (domain === 'reviews' && method === 'POST' && !id) {
      const patientId = body.patientId as string;
      authorize(patientId, 'reviews', true);
      patient(patientId);
      const selections = body.selections as ReviewRecord['selections'];
      if (
        !selections.length ||
        selections.length > 20 ||
        new Set(selections.map((selection) => selection.prescription.id))
          .size !== selections.length
      )
        fail(
          400,
          'INVALID_REVIEW_SELECTIONS',
          'Select 1–20 distinct prescriptions individually'
        );
      const records = selections.map((selection) => {
        const draft = expectContent(selection.prescription);
        const checked = evaluation(selection.evaluationId);
        if (
          draft.patientId !== patientId ||
          draft.prescriberId !== session.actorId ||
          checked.subject.kind !== 'saved' ||
          checked.subject.prescription.id !== draft.id ||
          checked.subject.prescription.revision !== draft.contentRevision
        )
          fail(
            422,
            'REVIEW_SCOPE_MISMATCH',
            'All selections must match one patient, named prescriber and current saved evaluation'
          );
        requireGate(checked, 'review');
        return { draft, checked };
      });
      const record: ReviewRecord = {
        id: nextId('review'),
        revision: '1',
        patientId,
        actorId: session.actorId,
        selections: clone(selections),
        reviewedAt: clock.now(),
        inputFingerprints: records.map(
          ({ checked }) => checked.inputFingerprint
        ),
      };
      store.reviews.set(record.id, record);
      for (const { draft, checked } of records) {
        draft.reviewId = record.id;
        draft.lifecycle = 'reviewed';
        bumpRx(draft);
        checked.reviewId = record.id;
        project(checked);
        event('prescription.reviewed', draft.id, [record.id]);
      }
      return response(201, record, record.id, record.revision, '/reviews');
    }
    if (domain === 'signing-sessions' && method === 'POST' && !id) {
      const review = resource(store.reviews, body.reviewId as string);
      authorize(review.patientId, 'signing-sessions', true);
      if (
        review.actorId !== session.actorId ||
        review.revision !== body.reviewRevision
      )
        fail(
          409,
          'REVIEW_REVISION_CONFLICT',
          'Use the current named prescriber review'
        );
      for (const selection of review.selections) {
        expectContent(selection.prescription);
        const checked = evaluation(selection.evaluationId);
        if (checked.reviewId !== review.id)
          fail(
            409,
            'REVIEW_INVALIDATED',
            'Review is no longer the current selection'
          );
        requireGate(checked, 'sign');
      }
      const controlled = review.selections.some((selection) => {
        const product = store.products.get(
          rx(selection.prescription.id).prescription.productId ?? ''
        );
        return (
          product?.controlledSchedule.state === 'known' &&
          product.controlledSchedule.value !== 'non-controlled'
        );
      });
      const record: SigningSession = {
        id: nextId('signing'),
        revision: '1',
        reviewId: review.id,
        actorId: session.actorId,
        mode: controlled ? 'epcs' : 'ordinary',
        state: 'challenge-pending',
        expiresAt: millisISO(isoMillis(clock.now()) + 300000),
        action: 'simulated-challenge',
        artifacts: [],
        pollAfterMs: 500,
      };
      store.signingSessions.set(record.id, record);
      for (const selection of review.selections) {
        const checked = evaluation(selection.evaluationId);
        checked.signingSessionId = record.id;
        project(checked);
      }
      scheduler.schedule(`expiry:${record.id}`, 300000, () => {
        if (record.state === 'challenge-pending') {
          record.state = 'expired';
          record.revision = increment(record.revision);
          projectAll();
        }
      });
      return response(
        201,
        record,
        record.id,
        record.revision,
        `/signing-sessions/${record.id}`
      );
    }
    if (
      domain === 'signing-sessions' &&
      method === 'POST' &&
      id &&
      child === 'completions'
    ) {
      const record = resource(store.signingSessions, id);
      const review = resource(store.reviews, record.reviewId);
      authorize(review.patientId, 'signing-sessions', true);
      if (record.actorId !== session.actorId)
        fail(
          403,
          'SIGNING_ACTOR_MISMATCH',
          'Only the named signing actor can complete this session'
        );
      if (record.revision !== body.sessionRevision)
        fail(
          409,
          'SIGNING_REVISION_CONFLICT',
          'Use the current signing session'
        );
      if (
        record.state !== 'challenge-pending' ||
        isoMillis(record.expiresAt) <= isoMillis(clock.now())
      )
        fail(
          409,
          'SIGNING_SESSION_INACTIVE',
          'Challenge is no longer pending/current'
        );
      const outcome =
        store.challengeOutcomes.get(body.completionReference as string) ??
        fail(422, 'COMPLETION_NOT_VERIFIED', 'No adapter completion found');
      if (outcome.sessionId !== id || outcome.actorId !== session.actorId)
        fail(
          422,
          'COMPLETION_NOT_VERIFIED',
          'No matching opaque simulation adapter completion was found'
        );
      const selections = review.selections.map((selection) => {
        const draft = expectContent(selection.prescription);
        const checked = evaluation(selection.evaluationId);
        requireGate(checked, 'sign');
        return { draft, checked };
      });
      if (outcome.outcome === 'declined') {
        record.state = 'declined';
        record.revision = increment(record.revision);
        projectAll();
        return response(
          200,
          record,
          id,
          record.revision,
          `/signing-sessions/${id}`
        );
      }
      for (const { draft, checked } of selections) {
        const artifact: SignedArtifact = {
          id: nextId('artifact'),
          prescription: { id: draft.id, revision: draft.contentRevision },
          snapshot: editableDraft(draft),
          inputFingerprint: checked.inputFingerprint,
          prescriberId: session.actorId,
          reviewId: review.id,
          signedAt: clock.now(),
          mode: record.mode,
          simulated: true,
        };
        artifact.snapshot.prescription.writtenDate = clock.now().slice(0, 10);
        store.artifacts.set(artifact.id, artifact);
        record.artifacts.push({
          prescription: artifact.prescription,
          signedArtifactId: artifact.id,
        });
        draft.signedArtifactId = artifact.id;
        draft.lifecycle = 'signed';
        bumpRx(draft);
        checked.signedArtifactId = artifact.id;
        event('prescription.simulated-signed', draft.id, [
          artifact.id,
          record.id,
        ]);
      }
      record.state = 'completed';
      record.revision = increment(record.revision);
      projectAll();
      return response(
        200,
        record,
        id,
        record.revision,
        `/signing-sessions/${id}`
      );
    }
    if (domain === 'transmissions' && method === 'POST' && !id) {
      const draft = expectContent(
        body.prescription as { id: string; revision: string }
      );
      const checked = evaluation(body.evaluationId as string);
      const artifact = resource(
        store.artifacts,
        body.signedArtifactId as string
      );
      if (
        artifact.prescription.id !== draft.id ||
        artifact.prescription.revision !== draft.contentRevision ||
        artifact.id !== draft.signedArtifactId ||
        checked.subject.kind !== 'saved' ||
        checked.subject.prescription.id !== draft.id ||
        body.pharmacyId !== draft.pharmacyId ||
        checked.signedArtifactId !== artifact.id
      )
        fail(
          422,
          'TRANSMISSION_SCOPE_MISMATCH',
          'Prescription, signature, evaluation and pharmacy must match'
        );
      const independent = validatePrescription(
        validationInput(draft),
        policy()
      );
      if (independent.checks.transmit !== 'pass')
        fail(
          422,
          'SERVER_VALIDATION_BLOCKED',
          'Current server-owned validation does not pass',
          {
            issues: independent.issues.map((issue) => ({
              fieldPath: issue.fieldPath,
              message: issue.message,
            })),
          }
        );
      requireGate(checked, 'transmit');
      if (
        [...store.transmissions.values()].some(
          (operation) =>
            operation.prescription.id === draft.id &&
            operation.prescription.revision === draft.contentRevision
        )
      )
        fail(
          409,
          'LOGICAL_SEND_EXISTS',
          'Recover, reconcile or retry the existing NewRx operation'
        );
      const operationId = nextId('tx');
      const correlationId = nextId('sim-correlation');
      const record: TransmissionRecord = {
        id: operationId,
        revision: '1',
        prescription: { id: draft.id, revision: draft.contentRevision },
        evaluationId: checked.id,
        signedArtifactId: artifact.id,
        pharmacyId: body.pharmacyId as string,
        transactionType: 'NewRx',
        correlationId,
        state: 'queued',
        createdAt: clock.now(),
        updatedAt: clock.now(),
        attemptCount: 1,
        attempts: [
          { sequence: 1, correlationId, submittedAt: null, outcome: 'queued' },
        ],
        receipt: null,
        error: null,
        reconciliation: { status: 'idle', checkedAt: null, outcome: null },
        supersedesOperationId: null,
        pollAfterMs: 500,
      };
      store.transmissions.set(operationId, record);
      draft.latestTransmissionId = operationId;
      bumpRx(draft);
      scheduleTransmission(record);
      event('transmission.queued', draft.id, [operationId]);
      return response(
        202,
        record,
        operationId,
        record.revision,
        `/transmissions/${operationId}`
      );
    }
    if (domain === 'transmissions' && method === 'POST' && id) {
      const record = resource(store.transmissions, id);
      const draft = rx(record.prescription.id);
      if (record.revision !== body.operationRevision)
        fail(
          409,
          'OPERATION_REVISION_CONFLICT',
          'Use current transmission revision'
        );
      if (child === 'reconciliations') {
        if (
          record.state !== 'unknown-outcome' ||
          ['queued', 'running'].includes(record.reconciliation.status)
        )
          fail(
            409,
            'RECONCILIATION_NOT_PERMITTED',
            'Only one lookup of an unknown outcome may be active'
          );
        record.reconciliation.status = 'queued';
        record.revision = increment(record.revision);
        scheduler.schedule(`${record.id}:reconcile`, 400, () => {
          const outcome = scenario.reconciliation ?? 'still-unknown';
          record.reconciliation.status =
            outcome === 'unavailable' ? 'unavailable' : 'complete';
          record.reconciliation.checkedAt = clock.now();
          record.reconciliation.outcome =
            outcome === 'unavailable' ? null : outcome;
          if (outcome === 'acknowledged') {
            record.state = 'acknowledged';
            record.receipt = {
              id: nextId('sim-reconciled-receipt'),
              receivedAt: clock.now(),
              message:
                'Synthetic lookup confirmed acknowledgement; not dispensing',
            };
            draft.lifecycle = 'transmitted';
            bumpRx(draft);
          } else if (outcome === 'known-not-transmitted') {
            record.state = 'failed';
            record.error = {
              code: 'SIM_KNOWN_NOT_TRANSMITTED',
              message: 'Lookup proved the attempt was not transmitted',
              retryable: true,
            };
          }
          record.revision = increment(record.revision);
          record.updatedAt = clock.now();
          record.attempts[record.attempts.length - 1].outcome = record.state;
          event('transmission.reconciled', draft.id, [id], outcome);
        });
        return response(
          202,
          record,
          id,
          record.revision,
          `/transmissions/${id}`
        );
      }
      if (child === 'retries') {
        if (record.state !== 'failed' || !record.error?.retryable)
          fail(
            409,
            'RETRY_NOT_PERMITTED',
            'Reconcile unknown delivery; retry only a known retryable failure'
          );
        const checked = evaluation(body.evaluationId as string);
        expectContent(record.prescription);
        if (
          checked.subject.kind !== 'saved' ||
          checked.subject.prescription.id !== draft.id ||
          checked.signedArtifactId !== record.signedArtifactId
        )
          fail(
            422,
            'RETRY_SCOPE_MISMATCH',
            'Retry requires a current matching evaluation/artifact'
          );
        requireGate(checked, 'transmit');
        record.state = 'queued';
        record.error = null;
        record.attemptCount += 1;
        record.correlationId = nextId('sim-correlation');
        record.attempts.push({
          sequence: record.attemptCount,
          correlationId: record.correlationId,
          submittedAt: null,
          outcome: 'queued',
        });
        record.revision = increment(record.revision);
        record.updatedAt = clock.now();
        record.evaluationId = checked.id;
        record.reconciliation = {
          status: 'idle',
          checkedAt: null,
          outcome: null,
        };
        scheduleTransmission(record, true);
        event('transmission.retry', draft.id, [id]);
        return response(
          202,
          record,
          id,
          record.revision,
          `/transmissions/${id}`
        );
      }
    }
    if (
      domain === 'prescriptions' &&
      method === 'POST' &&
      id &&
      child === 'cancellations'
    ) {
      const draft = rx(id);
      if (body.revision !== draft.contentRevision)
        fail(
          409,
          'CONTENT_REVISION_CONFLICT',
          'Use current prescription content'
        );
      if (
        (body.signedArtifactId &&
          body.signedArtifactId !== draft.signedArtifactId) ||
        (body.transmissionId &&
          body.transmissionId !== draft.latestTransmissionId)
      )
        fail(
          422,
          'CANCELLATION_SCOPE_MISMATCH',
          'Cancellation references must match the original'
        );
      if (
        [...store.cancellations.values()].some(
          (cancel) =>
            cancel.prescription.id === id &&
            ['queued', 'requested'].includes(cancel.state)
        ) ||
        draft.lifecycle === 'cancelled'
      )
        fail(
          409,
          'CANCELLATION_ALREADY_REQUESTED',
          'Recover the existing cancellation'
        );
      const transmission = draft.latestTransmissionId
        ? store.transmissions.get(draft.latestTransmissionId)
        : null;
      const local = !transmission;
      const record: CancellationRecord = {
        id: nextId('cancel'),
        revision: '1',
        prescription: { id, revision: draft.contentRevision },
        signedArtifactId: draft.signedArtifactId,
        transmissionId: draft.latestTransmissionId,
        reasonCode: body.reasonCode as string,
        state: local ? 'acknowledged' : 'queued',
        createdAt: clock.now(),
        correlationId: nextId('sim-cancel-correlation'),
        pollAfterMs: 500,
      };
      store.cancellations.set(record.id, record);
      if (local) {
        draft.lifecycle = 'cancelled';
        bumpRx(draft);
      } else
        scheduler.schedule(`${record.id}:outcome`, 500, () => {
          record.state = scenario.cancellation ?? 'acknowledged';
          record.revision = increment(record.revision);
          if (record.state === 'acknowledged') {
            draft.lifecycle = 'cancelled';
            bumpRx(draft);
          }
          event('cancellation.outcome', id, [record.id], record.state);
          projectAll();
        });
      projectAll();
      event('cancellation.requested', id, [record.id]);
      return response(
        local ? 201 : 202,
        record,
        record.id,
        record.revision,
        `/cancellations/${record.id}`
      );
    }
    if (
      domain === 'prescriptions' &&
      method === 'POST' &&
      id &&
      child === 'replacements'
    ) {
      const original = expectContent(
        body.original as { id: string; revision: string }
      );
      if (original.id !== id)
        fail(
          422,
          'REPLACEMENT_SCOPE_MISMATCH',
          'Path and original identity differ'
        );
      const draft = body.draft as PrescriptionDraft;
      if (draft.patientId !== original.patientId)
        fail(
          422,
          'REPLACEMENT_PATIENT_MISMATCH',
          'Replacement must retain patient identity'
        );
      const record = createDraft(draft, id);
      event('prescription.replaced', id, [record.id]);
      return response(
        201,
        record,
        record.id,
        record.recordVersion,
        `/prescriptions/${record.id}`
      );
    }
    return fail(404, 'ROUTE_NOT_FOUND', `No ${method} route ${path}`);
  }
  async function request<T = JsonValue>(
    method: 'GET' | 'POST' | 'PUT',
    path: string,
    body?: unknown,
    requestOptions: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    if (disposed) throw new Error('Simulation is disposed');
    if (requestOptions.signal?.aborted)
      throw new globalThis.DOMException('Request aborted', 'AbortError');
    authorize();
    if (!path.startsWith('/') || path.startsWith('//'))
      fail(400, 'INVALID_PATH', 'Use a relative API path');
    const schemaIssues = validateRequest(method, path, body);
    if (schemaIssues.length)
      fail(400, 'INVALID_REQUEST', 'Request does not match the API schema', {
        issues: schemaIssues,
      });
    if (method === 'GET') return read(path) as ApiResponse<T>;
    if (!body || typeof body !== 'object' || Array.isArray(body))
      fail(400, 'INVALID_BODY', 'A JSON object body is required');
    const input = body as Record<string, unknown>;
    if (
      'actorId' in input ||
      'signed' in input ||
      'validation' in input ||
      'context' in input
    )
      fail(
        400,
        'SERVER_OWNED_FIELD',
        'Actor, context and workflow facts are server-owned'
      );
    authorize(
      typeof input.patientId === 'string' ? input.patientId : undefined,
      path.split('/')[1]
    );
    if (!requestOptions.idempotencyKey?.trim())
      fail(
        400,
        'IDEMPOTENCY_KEY_REQUIRED',
        'Idempotency-Key is required for mutations'
      );
    const key = `${session.id}:${session.actorId}:${method}:${path}:${requestOptions.idempotencyKey}`;
    const fingerprint = canonical({
      body,
      ifMatch: requestOptions.ifMatch ?? null,
    });
    const prior = store.idempotency.get(key);
    if (prior) {
      if (prior.fingerprint !== fingerprint)
        fail(
          409,
          'IDEMPOTENCY_CONFLICT',
          'This key was used for a different request'
        );
      return clone(prior.response) as ApiResponse<T>;
    }
    if (scenario.failureBeforeCommit && !beforeCommitInjected) {
      beforeCommitInjected = true;
      fail(
        503,
        'SIM_SERVICE_UNAVAILABLE',
        'Injected failure before commit; the same key may be retried'
      );
    }
    const result = mutate(method, path, input, requestOptions);
    store.idempotency.set(key, { fingerprint, response: clone(result) });
    if (
      path === '/transmissions' &&
      scenario.transmission === 'response-lost' &&
      !lossInjected
    ) {
      lossInjected = true;
      throw new TypeError('Injected response loss after committed send');
    }
    return result as ApiResponse<T>;
  }
  const controller: FakeEhrController = {
    reset(scenarioId = scenario.id, variant) {
      scheduler.clear();
      scenario = getScenario(scenarioId, variant);
      if (!options.clock) clock = createSimulationClock();
      if (!options.scheduler) scheduler = createSimulationScheduler(clock);
      if (!options.nextId) nextId = createSequentialIds();
      resetStore();
    },
    advanceTime(ms) {
      if (disposed) return;
      clock.advance(ms);
      scheduler.runDue();
      projectAll();
    },
    runPendingJobs() {
      while (!disposed) {
        const pending = scheduler
          .snapshot()
          .filter((job) => !job.operationId.startsWith('expiry:'));
        if (!pending.length) return;
        clock.advance(
          Math.max(
            0,
            Math.min(...pending.map((job) => isoMillis(job.dueAt))) -
              isoMillis(clock.now())
          )
        );
        scheduler.runDue();
      }
    },
    applyContextEvent(eventId) {
      const context = patient('sim-patient-1');
      if (eventId === 'record-pregnancy-observation')
        context.pregnancy = known('not-pregnant', clock.now());
      else if (eventId === 'record-weight')
        context.measurements.weight = known(
          { value: '70', unit: 'kg', method: 'synthetic-measurement' },
          clock.now()
        );
      else if (eventId === 'record-renal')
        context.renal = known(
          {
            metric: 'CrCl',
            value: '90',
            unit: 'mL/min',
            method: 'synthetic-method',
            dialysis: false,
          },
          clock.now()
        );
      else if (eventId === 'confirm-medication-history') {
        context.medicationHistoryReviewed = known(true, clock.now());
        context.completeness.medicationHistory = true;
      } else if (eventId === 'change-coverage') {
        context.coverage.revision = increment(context.coverage.revision);
        context.coverage.planId = 'sim-unsupported-plan';
      } else if (eventId === 'expire-pdmp-report') {
        for (const query of store.pdmpQueries.values()) {
          query.expiresAt = clock.now();
          query.revision = increment(query.revision);
        }
        projectAll();
        return;
      } else if (eventId === 'revoke-pa') {
        for (const pa of store.priorAuthorizations.values()) {
          if (pa.state === 'approved') {
            pa.state = 'revoked';
            pa.revision = increment(pa.revision);
          }
        }
        projectAll();
        return;
      } else
        fail(400, 'UNKNOWN_CONTEXT_EVENT', 'Unknown simulation context event');
      context.revision = increment(context.revision);
      context.capturedAt = clock.now();
      invalidate(context.patientId);
      event('simulation.context.changed', null, [eventId]);
    },
    completeSimulatedChallenge(
      sessionId,
      outcome = scenario.signing === 'declined' ? 'declined' : 'approved'
    ) {
      const signing = resource(store.signingSessions, sessionId);
      authorize(
        resource(store.reviews, signing.reviewId).patientId,
        'signing-sessions',
        true
      );
      if (signing.actorId !== session.actorId)
        fail(
          403,
          'SIGNING_ACTOR_MISMATCH',
          'Only the session prescriber can complete this challenge'
        );
      const reference = nextId('sim-adapter-receipt');
      store.challengeOutcomes.set(reference, {
        sessionId,
        outcome,
        actorId: session.actorId,
      });
      return reference;
    },
    dispose() {
      disposed = true;
      scheduler.clear();
    },
    snapshot: () => ({
      scenario: clone(scenario),
      session: clone(session),
      now: clock.now(),
      jobs: scheduler.snapshot(),
      records: Object.fromEntries(
        Object.entries(store)
          .filter(([, value]) => value instanceof Map)
          .map(([name, value]) => [name, clone([...value.values()])])
      ),
    }),
    draft: getDraft,
    validationInput,
  };
  return {
    ...createHttpClient({
      baseUrl,
      fetch: createFakeFetch({ request, baseUrl }),
    }),
    request,
    controller,
    baseUrl,
    get clock() {
      return clock;
    },
  };
}

function editableDraft(record: PrescriptionRecord): PrescriptionDraft {
  const {
    id,
    contentRevision,
    patientId,
    encounterId,
    prescriberId,
    pharmacyId,
    intent,
    display,
    code,
    prescription,
  } = record;
  return clone({
    id,
    contentRevision,
    patientId,
    encounterId,
    prescriberId,
    pharmacyId,
    intent,
    display,
    code,
    prescription,
  });
}
