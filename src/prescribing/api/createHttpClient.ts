import type {
  ApiEnvelope,
  ApiProblem,
  ApiResponse,
  Capabilities,
  EvaluationRecord,
  JsonValue,
  PatientContextSnapshot,
  PrescribingApi,
  PrescriptionRecord,
  RequestOptions,
} from './contracts';
import type { PrescriptionReadiness, PrescriptionIssue } from '../types';
import type { PrescriptionPolicy } from '../policy';
import {
  validateRequest,
  validateResponse,
  validateSchema,
  prescribingSchemas,
} from './schemas';
export class PrescribingApiError extends Error {
  constructor(
    public readonly problem: ApiProblem,
    public readonly responseHeaders: Record<string, string> = {}
  ) {
    super(problem.detail);
    this.name = 'PrescribingApiError';
  }
}
export interface HttpClientOptions {
  baseUrl?: string;
  fetch?: typeof globalThis.fetch;
  headers?: Record<string, string>;
  credentials?: 'omit' | 'same-origin' | 'include';
}
/** Typed same-origin client. Mutations require caller-owned recoverable keys; no automatic mutation retries. */
export function createHttpClient(
  options: HttpClientOptions = {}
): PrescribingApi {
  const transport = options.fetch ?? globalThis.fetch;
  const base = (options.baseUrl ?? '/api/prescribing/v1').replace(/\/$/, '');
  const request = async <T = JsonValue>(
    method: 'GET' | 'POST' | 'PUT',
    path: string,
    body?: unknown,
    requestOptions: RequestOptions = {}
  ): Promise<ApiResponse<T>> => {
    const issues = validateRequest(method, path, body);
    if (issues.length)
      throw new PrescribingApiError({
        type: 'about:blank',
        title: 'Invalid request',
        status: 400,
        detail: issues.map((i) => `${i.fieldPath}: ${i.message}`).join('; '),
        instance: path,
        code: 'SCHEMA_INVALID',
        requestId: 'client',
        retryable: false,
        issues,
      });
    if (method !== 'GET' && !requestOptions.idempotencyKey)
      throw new Error('Idempotency-Key is required for prescribing mutations.');
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...options.headers,
      ...requestOptions.headers,
    };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (requestOptions.idempotencyKey)
      headers['Idempotency-Key'] = requestOptions.idempotencyKey;
    if (requestOptions.ifMatch) headers['If-Match'] = requestOptions.ifMatch;
    const response = await transport(`${base}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: requestOptions.signal,
      credentials: options.credentials ?? 'same-origin',
    });
    const responseHeaders = Object.fromEntries(response.headers.entries());
    const responseBody: unknown = await response.json();
    if (!response.ok) {
      const errors = validateSchema(responseBody, prescribingSchemas.Problem);
      if (errors.length)
        throw new Error('EHR returned a malformed problem response.');
      throw new PrescribingApiError(
        responseBody as ApiProblem,
        responseHeaders
      );
    }
    const errors = validateResponse(method, path, responseBody);
    if (errors.length)
      throw new Error(
        `EHR response does not match its contract: ${errors.map((i) => `${i.fieldPath}: ${i.message}`).join('; ')}`
      );
    return {
      status: response.status,
      headers: responseHeaders,
      body: responseBody as ApiEnvelope<T>,
    };
  };
  const segment = (value: string) => encodeURIComponent(value);
  return {
    request,
    searchDrugs: (q, cursor, o) =>
      request(
        'GET',
        `/drugs?q=${segment(q)}${cursor ? `&cursor=${segment(cursor)}` : ''}`,
        undefined,
        o
      ),
    getDrug: (id, o) => request('GET', `/drugs/${segment(id)}`, undefined, o),
    searchPharmacies: (q, cursor, o) =>
      request(
        'GET',
        `/pharmacies?q=${segment(q)}${cursor ? `&cursor=${segment(cursor)}` : ''}`,
        undefined,
        o
      ),
    listPrescriptions: (patientId, o) =>
      request(
        'GET',
        `/prescriptions?patientId=${segment(patientId)}`,
        undefined,
        o
      ),
    updateWorkflowContext: (id, b, o) =>
      request('PUT', `/evaluations/${segment(id)}/workflow-context`, b, o),
    createDecision: (id, b, o) =>
      request('POST', `/evaluations/${segment(id)}/decisions`, b, o),
    createPdmpQuery: (b, o) => request('POST', '/pdmp-queries', b, o),
    getPdmpQuery: (id, o) =>
      request('GET', `/pdmp-queries/${segment(id)}`, undefined, o),
    reviewPdmpQuery: (id, b, o) =>
      request('POST', `/pdmp-queries/${segment(id)}/reviews`, b, o),
    createPriorAuthorization: (b, o) =>
      request('POST', '/prior-authorizations', b, o),
    getPriorAuthorization: (id, o) =>
      request('GET', `/prior-authorizations/${segment(id)}`, undefined, o),
    getQuestionnaire: (id, o) =>
      request(
        'GET',
        `/prior-authorizations/${segment(id)}/questionnaire`,
        undefined,
        o
      ),
    saveAnswers: (id, b, o) =>
      request('PUT', `/prior-authorizations/${segment(id)}/answers`, b, o),
    submitPriorAuthorization: (id, b, o) =>
      request('POST', `/prior-authorizations/${segment(id)}/submissions`, b, o),
    getSubmission: (caseId, id, o) =>
      request(
        'GET',
        `/prior-authorizations/${segment(caseId)}/submissions/${segment(id)}`,
        undefined,
        o
      ),
    cancelPriorAuthorization: (id, b, o) =>
      request(
        'POST',
        `/prior-authorizations/${segment(id)}/cancellations`,
        b,
        o
      ),
    createReview: (b, o) => request('POST', '/reviews', b, o),
    createSigningSession: (b, o) => request('POST', '/signing-sessions', b, o),
    completeSigningSession: (id, b, o) =>
      request('POST', `/signing-sessions/${segment(id)}/completions`, b, o),
    getSigningSession: (id, o) =>
      request('GET', `/signing-sessions/${segment(id)}`, undefined, o),
    getSignedArtifact: (id, o) =>
      request('GET', `/signed-artifacts/${segment(id)}`, undefined, o),
    createTransmission: (b, o) => request('POST', '/transmissions', b, o),
    getTransmission: (id, o) =>
      request('GET', `/transmissions/${segment(id)}`, undefined, o),
    reconcileTransmission: (id, b, o) =>
      request('POST', `/transmissions/${segment(id)}/reconciliations`, b, o),
    retryTransmission: (id, b, o) =>
      request('POST', `/transmissions/${segment(id)}/retries`, b, o),
    getCancellation: (id, o) =>
      request('GET', `/cancellations/${segment(id)}`, undefined, o),
    cancelPrescription: (id, b, o) =>
      request('POST', `/prescriptions/${segment(id)}/cancellations`, b, o),
    replacePrescription: (id, b, o) =>
      request('POST', `/prescriptions/${segment(id)}/replacements`, b, o),
    getEvents: (id, o) =>
      request('GET', `/prescriptions/${segment(id)}/events`, undefined, o),
    getCapabilities: (o) =>
      request<Capabilities>('GET', '/capabilities', undefined, o),
    getPolicy: (id, o) =>
      request<PrescriptionPolicy>(
        'GET',
        `/policies/${encodeURIComponent(id)}`,
        undefined,
        o
      ),
    getPatientContext: (id, o) =>
      request<PatientContextSnapshot>(
        'GET',
        `/patients/${encodeURIComponent(id)}/context`,
        undefined,
        o
      ),
    createPrescription: (draft, o) =>
      request<PrescriptionRecord>('POST', '/prescriptions', draft, o),
    getPrescription: (id, o) =>
      request<PrescriptionRecord>(
        'GET',
        `/prescriptions/${encodeURIComponent(id)}`,
        undefined,
        o
      ),
    updatePrescription: (id, draft, o) =>
      request<PrescriptionRecord>(
        'PUT',
        `/prescriptions/${encodeURIComponent(id)}`,
        draft,
        o
      ),
    createEvaluation: (body, o) =>
      request<EvaluationRecord>('POST', '/evaluations', body, o),
    getEvaluation: (id, o) =>
      request<EvaluationRecord>(
        'GET',
        `/evaluations/${encodeURIComponent(id)}`,
        undefined,
        o
      ),
  };
}
/** Projection retains all domains; passing field validation cannot substitute for workflow gates. */
export function evaluationToReadiness(
  evaluation: EvaluationRecord,
  mode: 'simulation' | 'live',
  status?: Pick<PrescriptionReadiness, 'signing' | 'delivery'>
): PrescriptionReadiness {
  const issues: PrescriptionIssue[] = [];
  for (const [stage, gate] of Object.entries(evaluation.gates))
    for (const reason of gate.reasons) {
      const existing = issues.find(
        (i) =>
          i.code === reason.code &&
          i.fieldPath === reason.fieldPath &&
          i.message === reason.message
      );
      if (existing) {
        if (!existing.blocks.includes(stage as 'review' | 'sign' | 'transmit'))
          existing.blocks.push(stage as 'review' | 'sign' | 'transmit');
        continue;
      }
      const clinical = ['interactions', 'pregnancy', 'dosing'].includes(
        reason.domain
      );
      issues.push({
        code: reason.code,
        ruleId:
          reason.findingId ??
          reason.checkId ??
          `${reason.domain}.${reason.code}`,
        ruleSource: clinical
          ? 'clinical-provider'
          : reason.domain === 'pdmp'
            ? 'pdmp-provider'
            : ['formulary', 'benefit', 'prior-authorization'].includes(
                  reason.domain
                )
              ? 'payer'
              : 'organization',
        fieldPath: reason.fieldPath,
        message: reason.message,
        severity: gate.state === 'fail' ? 'error' : 'warning',
        blocks: [stage as 'review' | 'sign' | 'transmit'],
        remediation:
          reason.remediation ??
          (clinical
            ? 'clinical-review'
            : reason.domain === 'pdmp'
              ? 'pdmp'
              : reason.domain === 'prior-authorization'
                ? 'prior-authorization'
                : ['benefit', 'formulary'].includes(reason.domain)
                  ? 'coverage'
                  : 'system'),
      });
    }
  return {
    validation: evaluation.validation,
    source: mode === 'simulation' ? 'simulated-server' : 'server-confirmed',
    workflow: {
      evaluationId: evaluation.id,
      evaluationRevision: evaluation.revision,
      inputFingerprint: evaluation.inputFingerprint,
      workflowFingerprint: evaluation.workflowFingerprint,
      projectedAt: evaluation.projectedAt,
      expiresAt: evaluation.expiresAt,
      validity: evaluation.validity,
      gates: {
        review: evaluation.gates.review.state,
        sign: evaluation.gates.sign.state,
        transmit: evaluation.gates.transmit.state,
      },
      issues,
    },
    signing:
      status?.signing ??
      (evaluation.signedArtifactId ? 'signed' : 'not-signed'),
    delivery: status?.delivery ?? 'not-sent',
  };
}
export interface PollOptions {
  signal?: AbortSignal;
  initialDelayMs?: number;
  maxDelayMs?: number;
  timeoutMs?: number;
  now?: () => number;
  sleep?: (ms: number, signal?: AbortSignal) => Promise<void>;
}
/** Reads only. Timeout leaves the last pending record available for manual refresh. */
export async function pollOperation<T>(
  read: (signal?: AbortSignal) => Promise<T>,
  isTerminal: (value: T) => boolean,
  options: PollOptions = {}
): Promise<{ value: T; timedOut: boolean }> {
  const now = options.now ?? Date.now;
  const start = now();
  let delay = options.initialDelayMs ?? 500;
  const sleep =
    options.sleep ??
    ((ms: number, signal?: AbortSignal) =>
      new Promise<void>((resolve, reject) => {
        if (signal?.aborted) {
          reject(
            signal.reason ??
              new globalThis.DOMException('Aborted', 'AbortError')
          );
          return;
        }
        const abort = () => {
          clearTimeout(timer);
          reject(
            signal?.reason ??
              new globalThis.DOMException('Aborted', 'AbortError')
          );
        };
        const timer = setTimeout(() => {
          signal?.removeEventListener('abort', abort);
          resolve();
        }, ms);
        signal?.addEventListener('abort', abort, { once: true });
      }));
  let value = await read(options.signal);
  while (!isTerminal(value)) {
    if (now() - start >= (options.timeoutMs ?? 30000))
      return { value, timedOut: true };
    await sleep(
      Math.min(delay, (options.timeoutMs ?? 30000) - (now() - start)),
      options.signal
    );
    value = await read(options.signal);
    delay = Math.min(delay * 1.5, options.maxDelayMs ?? 5000);
  }
  return { value, timedOut: false };
}
/** Prevent late reads from rolling a current clinical scope or newer workflow revision backward. */
export function shouldAcceptEvaluation(
  incoming: EvaluationRecord,
  current: EvaluationRecord | null,
  expectedInputFingerprint: string,
  expectedEvaluationId?: string
): boolean {
  if (
    incoming.inputFingerprint !== expectedInputFingerprint ||
    (expectedEvaluationId !== undefined && incoming.id !== expectedEvaluationId)
  )
    return false;
  if (!current) return true;
  if (current.id !== incoming.id) return expectedEvaluationId === incoming.id;
  if (!/^\d+$/.test(incoming.revision) || !/^\d+$/.test(current.revision))
    return false;
  const next = incoming.revision.replace(/^0+(?=\d)/, '');
  const previous = current.revision.replace(/^0+(?=\d)/, '');
  return (
    next.length > previous.length ||
    (next.length === previous.length && next >= previous)
  );
}
