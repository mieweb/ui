import { describe, expect, it, vi } from 'vitest';
import {
  createHttpClient,
  pollOperation,
  PrescribingApiError,
  shouldAcceptEvaluation,
  evaluationToReadiness,
} from './createHttpClient';
import {
  prescribingSchemas,
  prescribingRoutes,
  validateRequest,
  validateResponse,
  validateSchema,
} from './schemas';
import type { EvaluationRecord, PrescriptionRecord } from './contracts';
import { completeValidationFixture } from '../fixtures';
import { validatePrescription } from '../validate';
import { demoPrescriptionPolicy } from '../policy';
const envelope = <T>(data: T) => ({
  meta: {
    apiVersion: '1',
    requestId: 'test',
    generatedAt: completeValidationFixture.evaluatedAt,
    mode: 'simulation',
  },
  data,
});
const record: PrescriptionRecord = {
  ...completeValidationFixture.draft,
  id: 'rx-1',
  contentRevision: '1',
  recordVersion: '1',
  lifecycle: 'draft',
  createdAt: completeValidationFixture.evaluatedAt,
  updatedAt: completeValidationFixture.evaluatedAt,
  latestEvaluationId: null,
  reviewId: null,
  signedArtifactId: null,
  latestTransmissionId: null,
  replacesPrescriptionId: null,
};
const evaluation: EvaluationRecord = {
  id: 'ev-1',
  revision: '2',
  subject: { kind: 'saved', prescription: { id: 'rx-1', revision: '1' } },
  relatedPrescriptions: [],
  patientContextRevision: '1',
  prescriberContextRevision: '1',
  pharmacyRevision: '1',
  policyVersion: '1',
  knowledgeVersions: {},
  inputFingerprint: 'scope',
  workflowFingerprint: 'workflow',
  createdAt: completeValidationFixture.evaluatedAt,
  projectedAt: completeValidationFixture.evaluatedAt,
  expiresAt: null,
  validity: 'current',
  validityReasons: [],
  state: 'partial',
  validation: validatePrescription(
    completeValidationFixture,
    demoPrescriptionPolicy
  ),
  checks: {},
  pdmpQueryId: null,
  priorAuthorizationId: null,
  decisions: [],
  gates: {
    review: {
      state: 'fail',
      reasons: [
        {
          domain: 'interactions',
          code: 'BLOCKING_INTERACTION',
          message: 'Synthetic interaction needs review.',
          findingId: 'finding-1',
        },
      ],
    },
    sign: { state: 'unknown', reasons: [] },
    transmit: {
      state: 'unknown',
      reasons: [
        {
          domain: 'dosing',
          code: 'UNAVAILABLE',
          message: 'Required dosing unavailable.',
        },
      ],
    },
  },
  reviewId: null,
  signingSessionId: null,
  signedArtifactId: null,
  pollAfterMs: 500,
};
describe('API contracts and client', () => {
  it('validates every registered schema reference and operation request/response shape', () => {
    const names = new Set(Object.keys(prescribingSchemas));
    const walk = (value: unknown) => {
      if (value && typeof value === 'object')
        for (const [key, child] of Object.entries(value)) {
          if (key === '$ref')
            expect(names.has(String(child).split('/').pop()!)).toBe(true);
          else walk(child);
        }
    };
    walk(prescribingSchemas);
    walk(prescribingRoutes);
    expect(prescribingRoutes).toHaveLength(37);
    expect(
      validateResponse('POST', '/prescriptions', envelope(record))
    ).toEqual([]);
    expect(
      validateResponse('GET', '/evaluations/ev-1', envelope(evaluation))
    ).toEqual([]);
  });
  it('keeps invalid draft text savable but rejects spoofed workflow and action fields', () => {
    expect(
      validateRequest('POST', '/prescriptions', {
        ...completeValidationFixture.draft,
        prescription: { quantity: 'bad', refills: '-1' },
      })
    ).toEqual([]);
    expect(
      validateRequest('POST', '/prescriptions', {
        ...completeValidationFixture.draft,
        signed: true,
      }).length
    ).toBeGreaterThan(0);
    expect(
      validateRequest('POST', '/transmissions', {
        transactionType: 'RxRenewal',
      }).length
    ).toBeGreaterThan(0);
    expect(
      validateSchema(
        { state: 'known', value: null, observedAt: 'now', sourceId: 'x' },
        prescribingSchemas.PharmacyRecord.properties!.newRx
      ).length
    ).toBeGreaterThan(0);
  });
  it('injects recoverable keys/revisions/session transport and validates response', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(
      new Response(JSON.stringify(envelope(record)), {
        status: 201,
        headers: { ETag: '"rx-1:1"' },
      })
    );
    const api = createHttpClient({
      fetch,
      baseUrl: 'https://ehr.example/api/prescribing/v1',
    });
    const result = await api.createPrescription(
      completeValidationFixture.draft,
      { idempotencyKey: 'save-1' }
    );
    expect(result.body.data.id).toBe('rx-1');
    expect(fetch.mock.calls[0][1]?.credentials).toBe('same-origin');
    expect(fetch.mock.calls[0][1]?.headers).toMatchObject({
      'Idempotency-Key': 'save-1',
    });
    await expect(
      api.createPrescription(completeValidationFixture.draft, {})
    ).rejects.toThrow('Idempotency-Key');
    fetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify(envelope({ ...record, contentRevision: null })),
        { status: 200 }
      )
    );
    await expect(api.getPrescription('rx-1')).rejects.toThrow('contract');
  });
  it('returns structured server problems and makes no mutation retry', async () => {
    const problem = {
      type: 'about:blank',
      title: 'Conflict',
      status: 412,
      detail: 'Draft was changed.',
      instance: '/prescriptions/rx-1',
      code: 'REVISION_CONFLICT',
      requestId: 'request-1',
      retryable: false,
      currentRevision: '2',
    };
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValue(
        new Response(JSON.stringify(problem), { status: 412 })
      );
    const api = createHttpClient({ fetch });
    await expect(
      api.updatePrescription('rx-1', completeValidationFixture.draft, {
        idempotencyKey: 'save',
        ifMatch: '"rx-1:1"',
      })
    ).rejects.toBeInstanceOf(PrescribingApiError);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it('does not promote field completion over blocking or unknown clinical gates', () => {
    const readiness = evaluationToReadiness(evaluation, 'simulation');
    expect(readiness.validation.dataState).toBe('complete');
    expect(readiness.workflow?.gates.review).toBe('fail');
    expect(readiness.workflow?.gates.transmit).toBe('unknown');
    expect(readiness.workflow?.issues.map((i) => i.code)).toEqual([
      'BLOCKING_INTERACTION',
      'UNAVAILABLE',
    ]);
    expect(readiness.source).toBe('simulated-server');
  });
  it('ignores wrong-scope and older projections', () => {
    expect(
      shouldAcceptEvaluation(
        { ...evaluation, revision: '1' },
        evaluation,
        'scope'
      )
    ).toBe(false);
    expect(shouldAcceptEvaluation(evaluation, null, 'other-scope')).toBe(false);
    expect(
      shouldAcceptEvaluation(
        { ...evaluation, revision: '3' },
        evaluation,
        'scope'
      )
    ).toBe(true);
  });
  it('polls only reads with controlled time then stops at terminal or visible timeout', async () => {
    let now = 0;
    let reads = 0;
    const result = await pollOperation(
      async () => ++reads,
      (v) => v === 3,
      {
        now: () => now,
        sleep: async (ms) => {
          now += ms;
        },
      }
    );
    expect(result).toEqual({ value: 3, timedOut: false });
    expect(reads).toBe(3);
    const pending = await pollOperation(
      async () => 'pending',
      () => false,
      {
        timeoutMs: 1000,
        now: () => now,
        sleep: async (ms) => {
          now += ms;
        },
      }
    );
    expect(pending).toEqual({ value: 'pending', timedOut: true });
  });
});
