import { prescriptionDetailFields } from '../policy';
import { isJsonObject } from '../validate';
export interface JsonSchema {
  type?:
    | 'object'
    | 'array'
    | 'string'
    | 'number'
    | 'integer'
    | 'boolean'
    | 'null';
  properties?: Record<string, JsonSchema>;
  required?: string[];
  additionalProperties?: boolean | JsonSchema;
  items?: JsonSchema;
  enum?: unknown[];
  oneOf?: JsonSchema[];
  anyOf?: JsonSchema[];
  minLength?: number;
  minimum?: number;
  pattern?: string;
  $ref?: string;
  description?: string;
}
const str: JsonSchema = { type: 'string' };
const id: JsonSchema = { type: 'string', minLength: 1 };
const bool: JsonSchema = { type: 'boolean' };
const integer: JsonSchema = { type: 'integer', minimum: 0 };
const nullable = (schema: JsonSchema): JsonSchema => ({
  anyOf: [schema, { type: 'null' }],
});
const list = (items: JsonSchema): JsonSchema => ({ type: 'array', items });
const en = (...values: string[]): JsonSchema => ({
  type: 'string',
  enum: values,
});
const obj = (
  properties: Record<string, JsonSchema>,
  required = Object.keys(properties),
  strict = false
): JsonSchema => ({
  type: 'object',
  properties,
  required,
  additionalProperties: !strict,
});
const ref = (name: string): JsonSchema => ({
  $ref: `#/components/schemas/${name}`,
});
const fact = (value: JsonSchema): JsonSchema => ({
  oneOf: [
    obj({ state: en('known'), value, observedAt: id, sourceId: id }),
    obj({ state: en('unknown', 'not-applicable'), reason: id }),
  ],
});
const details = Object.fromEntries(
  prescriptionDetailFields.map((key) => [
    key,
    key === 'prn'
      ? bool
      : key === 'code'
        ? ref('DrugCoding')
        : key === 'substitution'
          ? en('0', '1')
          : str,
  ])
);
export const prescribingSchemas: Record<string, JsonSchema> = {
  DrugCoding: obj(
    { system: id, code: id, display: str, version: str },
    ['system', 'code'],
    true
  ),
  PrescriptionDetails: obj(details, [], true),
  PrescriptionDraft: obj(
    {
      id,
      contentRevision: id,
      patientId: id,
      encounterId: id,
      prescriberId: id,
      pharmacyId: id,
      intent: en('prescribe', 'history', 'administration'),
      display: { type: 'string', pattern: '\\S' },
      code: ref('DrugCoding'),
      prescription: ref('PrescriptionDetails'),
    },
    ['patientId', 'prescriberId', 'intent', 'display', 'prescription'],
    true
  ),
  RevisionRef: obj({ id, revision: id }, undefined, true),
  EvaluationSubject: {
    oneOf: [
      obj(
        { kind: en('saved'), prescription: ref('RevisionRef') },
        undefined,
        true
      ),
      obj(
        {
          kind: en('preview'),
          draft: ref('PrescriptionDraft'),
          clientDraftRevision: id,
        },
        undefined,
        true
      ),
    ],
  },
  EvaluationRequest: obj(
    {
      subject: ref('EvaluationSubject'),
      services: list(
        en(
          'validation',
          'interactions',
          'pregnancy',
          'dosing',
          'formulary',
          'benefit'
        )
      ),
      relatedPrescriptions: list(ref('RevisionRef')),
      pdmpQueryId: id,
      priorAuthorizationId: id,
    },
    ['subject', 'services'],
    true
  ),
  WorkflowContextRequest: obj(
    { pdmpQueryId: nullable(id), priorAuthorizationId: nullable(id) },
    undefined,
    true
  ),
  DecisionRequest: obj(
    {
      findingId: id,
      action: en('acknowledgement', 'override'),
      reasonCode: id,
      comment: str,
      mitigation: str,
    },
    ['findingId', 'action', 'reasonCode'],
    true
  ),
  PdmpQueryRequest: obj(
    {
      patientId: id,
      prescriberId: id,
      encounterId: id,
      jurisdictions: list(id),
      purposeCode: id,
      attestation: bool,
    },
    ['patientId', 'prescriberId', 'jurisdictions', 'purposeCode'],
    true
  ),
  PdmpReviewRequest: obj(
    { reviewedReportRevision: id, purposeCode: id, comment: str },
    ['reviewedReportRevision', 'purposeCode'],
    true
  ),
  PaCreateRequest: obj(
    {
      prescription: ref('RevisionRef'),
      evaluationId: id,
      benefitInquiryId: id,
      benefitType: en('pharmacy', 'medical'),
      reasonCode: id,
      payerRouteReference: id,
    },
    ['prescription', 'evaluationId', 'benefitType', 'reasonCode'],
    true
  ),
  Answer: obj(
    { linkId: id, value: { anyOf: [str, bool, { type: 'number' }] } },
    undefined,
    true
  ),
  AnswersRequest: obj(
    {
      questionnaireId: id,
      questionnaireVersion: id,
      answers: list(ref('Answer')),
      documentReferences: list(id),
    },
    ['questionnaireId', 'questionnaireVersion', 'answers'],
    true
  ),
  SubmissionRequest: obj(
    {
      caseRevision: id,
      questionnaireVersion: id,
      submissionKind: en('initial', 'additional-information', 'appeal'),
    },
    undefined,
    true
  ),
  PaCancellationRequest: obj(
    { caseRevision: id, reasonCode: id },
    undefined,
    true
  ),
  ReviewSelection: obj(
    {
      prescription: ref('RevisionRef'),
      evaluationId: id,
      readyToSign: { type: 'boolean', enum: [true] },
    },
    undefined,
    true
  ),
  ReviewRequest: obj(
    { patientId: id, selections: list(ref('ReviewSelection')) },
    undefined,
    true
  ),
  SigningRequest: obj({ reviewId: id, reviewRevision: id }, undefined, true),
  CompletionRequest: obj(
    { sessionRevision: id, completionReference: id },
    undefined,
    true
  ),
  TransmissionRequest: obj(
    {
      prescription: ref('RevisionRef'),
      evaluationId: id,
      signedArtifactId: id,
      pharmacyId: id,
      transactionType: en('NewRx'),
    },
    undefined,
    true
  ),
  ReconciliationRequest: obj({ operationRevision: id }, undefined, true),
  RetryRequest: obj(
    { operationRevision: id, evaluationId: id, reasonCode: id },
    undefined,
    true
  ),
  CancellationRequest: obj(
    { signedArtifactId: id, transmissionId: id, reasonCode: id, revision: id },
    ['reasonCode', 'revision'],
    true
  ),
  ReplacementRequest: obj(
    {
      original: ref('RevisionRef'),
      reasonCode: id,
      draft: ref('PrescriptionDraft'),
    },
    undefined,
    true
  ),
  Evidence: obj(
    {
      providerId: id,
      datasetVersion: id,
      ruleId: str,
      referenceUrl: str,
      referenceSection: str,
      observedAt: str,
      retrievedAt: id,
      synthetic: bool,
    },
    ['providerId', 'datasetVersion', 'retrievedAt', 'synthetic']
  ),
  Issue: obj(
    {
      code: id,
      ruleId: id,
      ruleSource: id,
      fieldPath: str,
      message: str,
      severity: en('warning', 'error'),
      blocks: list(en('review', 'sign', 'transmit')),
      remediation: id,
    },
    [
      'code',
      'ruleId',
      'ruleSource',
      'message',
      'severity',
      'blocks',
      'remediation',
    ]
  ),
  Validation: obj({
    orderId: str,
    orderRevision: str,
    contextRevision: str,
    policyVersion: str,
    evaluatedAt: str,
    dataState: en('incomplete', 'invalid', 'complete', 'unknown'),
    checks: obj({
      review: en('pass', 'fail', 'unknown'),
      transmit: en('pass', 'fail', 'unknown'),
    }),
    issues: list(ref('Issue')),
  }),
  Finding: obj({
    id,
    category: id,
    code: id,
    summary: str,
    rationale: str,
    severity: en('info', 'warning', 'critical'),
    implicatedPrescriptionIds: list(id),
    implicatedMedicationIds: list(id),
    factPaths: list(str),
    evidence: list(ref('Evidence')),
    suggestedActions: list(obj({ code: id, label: str })),
    disposition: obj({
      blocks: list(en('review', 'sign', 'transmit')),
      resolution: en('none', 'acknowledgement', 'override', 'cannot-override'),
      allowedReasonCodes: list(id),
    }),
  }),
  CheckResult: obj({
    status: en(
      'pending',
      'complete',
      'partial',
      'unavailable',
      'not-applicable',
      'not-requested'
    ),
    outcome: en('findings', 'no-findings-within-coverage', 'unknown'),
    data: {},
    findings: list(ref('Finding')),
    missingInputs: list(str),
    coverage: obj({
      domains: list(str),
      evaluatedSubjects: list(str),
      excludedSubjects: list(str),
      datasetVersion: nullable(str),
    }),
    evidence: list(ref('Evidence')),
    checkedAt: nullable(str),
    expiresAt: nullable(str),
    error: nullable(obj({ code: id, retryable: bool })),
  }),
  PrescriptionRecord: obj(
    {
      id,
      patientId: id,
      prescriberId: id,
      pharmacyId: str,
      intent: en('prescribe', 'history', 'administration'),
      display: str,
      prescription: ref('PrescriptionDetails'),
      contentRevision: id,
      recordVersion: id,
      lifecycle: en('draft', 'reviewed', 'signed', 'transmitted', 'cancelled'),
      createdAt: id,
      updatedAt: id,
      latestEvaluationId: nullable(id),
      reviewId: nullable(id),
      signedArtifactId: nullable(id),
      latestTransmissionId: nullable(id),
      replacesPrescriptionId: nullable(id),
    },
    [
      'id',
      'patientId',
      'prescriberId',
      'intent',
      'display',
      'prescription',
      'contentRevision',
      'recordVersion',
      'lifecycle',
      'createdAt',
      'updatedAt',
      'latestEvaluationId',
      'reviewId',
      'signedArtifactId',
      'latestTransmissionId',
      'replacesPrescriptionId',
    ]
  ),
  DecisionRecord: obj({
    id,
    revision: id,
    evaluationId: id,
    findingId: id,
    action: en('acknowledgement', 'override'),
    reasonCode: id,
    actorId: id,
    createdAt: id,
    inputFingerprint: id,
  }),
  Gate: obj({
    state: en('pass', 'fail', 'unknown'),
    reasons: list(
      obj({ domain: id, code: id, message: str }, ['domain', 'code', 'message'])
    ),
  }),
  EvaluationRecord: obj({
    id,
    revision: id,
    subject: ref('EvaluationSubject'),
    relatedPrescriptions: list(ref('RevisionRef')),
    patientContextRevision: id,
    prescriberContextRevision: id,
    pharmacyRevision: str,
    policyVersion: id,
    knowledgeVersions: { type: 'object', additionalProperties: str },
    inputFingerprint: id,
    workflowFingerprint: id,
    createdAt: id,
    projectedAt: id,
    expiresAt: nullable(str),
    validity: en('current', 'stale', 'expired'),
    validityReasons: list(str),
    state: en('running', 'complete', 'partial'),
    validation: ref('Validation'),
    checks: { type: 'object', additionalProperties: ref('CheckResult') },
    pdmpQueryId: nullable(id),
    priorAuthorizationId: nullable(id),
    decisions: list(ref('DecisionRecord')),
    gates: obj({
      review: ref('Gate'),
      sign: ref('Gate'),
      transmit: ref('Gate'),
    }),
    reviewId: nullable(id),
    signingSessionId: nullable(id),
    signedArtifactId: nullable(id),
    pollAfterMs: integer,
  }),
  PdmpQueryRecord: obj({
    id,
    revision: id,
    patientId: id,
    prescriberId: id,
    requestedJurisdictions: list(id),
    purposeCode: id,
    state: en('queued', 'complete', 'partial', 'unavailable'),
    match: en('matched', 'ambiguous', 'no-match'),
    jurisdictions: list(
      obj({
        jurisdiction: id,
        status: en('pending', 'complete', 'unavailable'),
      })
    ),
    reportRevision: nullable(id),
    reportGeneratedAt: nullable(str),
    queriedAt: id,
    expiresAt: id,
    entries: list(
      obj(
        {
          id,
          productId: id,
          dispenseDate: id,
          quantity: str,
          unit: str,
          jurisdiction: id,
        },
        ['id', 'productId', 'dispenseDate', 'quantity', 'unit', 'jurisdiction']
      )
    ),
    reviewId: nullable(id),
    pollAfterMs: integer,
  }),
  PdmpReviewRecord: obj({
    id,
    revision: id,
    queryId: id,
    reportRevision: id,
    actorId: id,
    reviewedAt: id,
    purposeCode: id,
  }),
  QuestionnaireRecord: obj({
    id,
    version: id,
    items: list(
      obj(
        {
          linkId: id,
          text: str,
          type: en('boolean', 'string', 'integer', 'decimal', 'choice', 'date'),
          required: bool,
          choices: list(str),
          enableWhen: list(
            obj({
              linkId: id,
              equals: { anyOf: [str, bool, { type: 'number' }] },
            })
          ),
        },
        ['linkId', 'text', 'type', 'required']
      )
    ),
  }),
  PriorAuthorizationCase: obj(
    {
      id,
      revision: id,
      patientId: id,
      prescription: ref('RevisionRef'),
      evaluationId: id,
      planId: id,
      benefitType: en('pharmacy', 'medical'),
      route: en('script-epa', 'davinci-pas', 'manual', 'simulation'),
      scope: obj(
        {
          productId: id,
          quantity: str,
          quantityUnit: str,
          coverageRevision: id,
        },
        ['productId', 'quantity', 'quantityUnit', 'coverageRevision']
      ),
      createdAt: id,
      state: en(
        'draft',
        'questionnaire-needed',
        'ready-to-submit',
        'submitted',
        'pending',
        'approved',
        'denied',
        'more-information-needed',
        'expired',
        'revoked',
        'cancelled'
      ),
      questionnaire: obj({ id, version: id }),
      answers: list(ref('Answer')),
      documentReferences: list(str),
      answerIssues: list(obj({ fieldPath: str, message: str })),
      submissionIds: list(id),
      decision: nullable(
        obj({
          authorizationReference: nullable(str),
          effectiveFrom: nullable(str),
          effectiveTo: nullable(str),
          approvedQuantity: nullable(str),
          reasons: list(str),
          actions: list(str),
        })
      ),
      cancellation: obj(
        {
          state: en('requested', 'acknowledged', 'rejected', 'unknown'),
          reasonCode: id,
          requestedAt: id,
          providerReference: str,
        },
        ['state', 'reasonCode', 'requestedAt']
      ),
      expiresAt: nullable(str),
      pollAfterMs: integer,
    },
    [
      'id',
      'revision',
      'patientId',
      'prescription',
      'evaluationId',
      'planId',
      'benefitType',
      'route',
      'scope',
      'createdAt',
      'state',
      'questionnaire',
      'answers',
      'documentReferences',
      'answerIssues',
      'submissionIds',
      'decision',
      'expiresAt',
      'pollAfterMs',
    ]
  ),
  SubmissionRecord: obj({
    id,
    revision: id,
    caseId: id,
    questionnaireId: id,
    questionnaireVersion: id,
    submissionKind: en('initial', 'additional-information', 'appeal'),
    state: en('queued', 'sent', 'acknowledged', 'failed'),
    outcome: nullable(str),
    pollAfterMs: integer,
  }),
  ReviewRecord: obj({
    id,
    revision: id,
    patientId: id,
    actorId: id,
    selections: list(ref('ReviewSelection')),
    reviewedAt: id,
    inputFingerprints: list(id),
  }),
  SigningSession: obj({
    id,
    revision: id,
    reviewId: id,
    actorId: id,
    mode: en('ordinary', 'epcs'),
    state: en(
      'challenge-pending',
      'completed',
      'declined',
      'expired',
      'invalidated'
    ),
    expiresAt: id,
    action: en('simulated-challenge', 'provider-handoff'),
    artifacts: list(
      obj({ prescription: ref('RevisionRef'), signedArtifactId: id })
    ),
    pollAfterMs: integer,
  }),
  SignedArtifact: obj({
    id,
    prescription: ref('RevisionRef'),
    snapshot: ref('PrescriptionDraft'),
    inputFingerprint: id,
    prescriberId: id,
    reviewId: id,
    signedAt: id,
    mode: en('ordinary', 'epcs'),
    simulated: bool,
  }),
  TransmissionRecord: obj({
    id,
    revision: id,
    prescription: ref('RevisionRef'),
    evaluationId: id,
    signedArtifactId: id,
    pharmacyId: id,
    transactionType: en('NewRx'),
    correlationId: id,
    state: en(
      'queued',
      'submitted',
      'acknowledged',
      'rejected',
      'failed',
      'unknown-outcome'
    ),
    createdAt: id,
    updatedAt: id,
    attemptCount: integer,
    attempts: list(
      obj({
        sequence: integer,
        correlationId: id,
        submittedAt: nullable(str),
        outcome: str,
      })
    ),
    receipt: nullable(obj({ id, receivedAt: id, message: str })),
    error: nullable(obj({ code: id, message: str, retryable: bool })),
    reconciliation: obj({
      status: en('idle', 'queued', 'running', 'complete', 'unavailable'),
      checkedAt: nullable(str),
      outcome: nullable(
        en('acknowledged', 'rejected', 'known-not-transmitted', 'still-unknown')
      ),
    }),
    supersedesOperationId: nullable(id),
    pollAfterMs: integer,
  }),
  CancellationRecord: obj({
    id,
    revision: id,
    prescription: ref('RevisionRef'),
    signedArtifactId: nullable(id),
    transmissionId: nullable(id),
    reasonCode: id,
    state: en('requested', 'queued', 'acknowledged', 'rejected', 'unknown'),
    createdAt: id,
    correlationId: id,
    pollAfterMs: integer,
  }),
  EventRecord: obj({
    id,
    at: id,
    actorId: id,
    type: id,
    outcome: str,
    prescriptionId: nullable(id),
    references: list(id),
  }),
  Capabilities: obj({
    mode: en('simulation', 'live'),
    services: {
      type: 'object',
      additionalProperties: en('supported', 'unsupported'),
    },
    profiles: list(obj({ id, version: id })),
    transactionTypes: list(id),
    maxBatchSize: integer,
    pollAfterMs: integer,
    maxPollingMs: integer,
  }),
  Policy: obj({
    schemaVersion: en('1'),
    id,
    version: id,
    requiredFields: list(str),
    supportedCodingSystems: list(id),
    supportedDoseUnits: list(id),
    supportedQuantityUnits: list(id),
    requirePatient: bool,
    requirePrescriber: bool,
    requirePharmacy: bool,
    requireClassification: bool,
    requireResolvedProduct: bool,
    maxContextAgeMs: { type: 'number', minimum: 1 },
    allowCompound: bool,
    scheduleRefillLimits: { type: 'object', additionalProperties: integer },
    requiredChecks: obj({
      review: list(str),
      sign: list(str),
      transmit: list(str),
    }),
    pdmp: obj({
      requiredForSchedules: list(str),
      jurisdictions: list(str),
      maxAgeMs: { type: 'number', minimum: 1 },
    }),
    priorAuthorization: obj({ holdTransmit: bool }),
    holdNonCoveredBenefit: bool,
    holdReplacementUntilCancellation: bool,
  }),
  PatientContextSnapshot: obj({
    patientId: id,
    revision: id,
    capturedAt: id,
    demographics: fact(obj({ name: str, address: str, birthDate: str })),
    medicationHistory: fact(
      list(
        obj(
          {
            id,
            productId: str,
            coding: list(ref('DrugCoding')),
            status: id,
            use: en('actual', 'reported', 'proposed'),
            sourceRevision: id,
            effectiveStart: str,
            effectiveEnd: str,
            dose: str,
            doseUnit: str,
          },
          ['id', 'status', 'use', 'sourceRevision']
        )
      )
    ),
    allergies: fact(
      list(
        obj(
          {
            id,
            productId: str,
            verification: id,
            reaction: str,
            severity: str,
          },
          ['id', 'verification', 'reaction', 'severity']
        )
      )
    ),
    pregnancy: fact(en('pregnant', 'not-pregnant', 'unknown')),
    lactation: fact(bool),
    pregnancyIntent: fact(bool),
    measurements: list(ref('Observation')),
    renal: fact(
      obj({
        metric: en('CrCl', 'eGFR'),
        method: id,
        value: str,
        unit: id,
        dialysis: bool,
      })
    ),
    hepatic: fact(str),
    coverage: fact(
      obj({ planId: id, memberId: id, active: bool, revision: id })
    ),
    completeness: obj({ medicationsReviewed: bool, allergiesReviewed: bool }),
  }),
  Fact: {
    oneOf: [
      obj({ state: en('known'), value: {}, observedAt: id, sourceId: id }),
      obj({ state: en('unknown', 'not-applicable'), reason: id }),
    ],
  },
  Observation: obj({
    code: id,
    system: id,
    value: str,
    unit: str,
    unitCode: id,
    unitSystem: id,
    effectiveAt: id,
    sourceId: id,
    method: str,
    status: id,
  }),
  DrugProduct: obj({
    id,
    display: str,
    coding: list(ref('DrugCoding')),
    conceptSpecificity: en('product', 'ingredient', 'compound'),
    ingredientIds: list(id),
    strength: str,
    doseForm: str,
    quantityUnits: list(id),
    controlledSchedule: fact(en('non-controlled', 'II', 'III', 'IV', 'V')),
    evidence: list(ref('Evidence')),
  }),
  PharmacyRecord: obj({
    id,
    name: str,
    address: str,
    directoryId: id,
    revision: id,
    newRx: fact(bool),
    cancelRx: fact(bool),
    epcs: fact(bool),
    refreshedAt: id,
  }),
  Problem: obj(
    {
      type: id,
      title: str,
      status: integer,
      detail: str,
      instance: str,
      code: id,
      requestId: id,
      retryable: bool,
    },
    [
      'type',
      'title',
      'status',
      'detail',
      'instance',
      'code',
      'requestId',
      'retryable',
    ]
  ),
};
const page = (name: string) =>
  obj({ items: list(ref(name)), nextCursor: nullable(str) });
export interface RouteContract {
  method: 'GET' | 'POST' | 'PUT';
  path: string;
  request?: string;
  response: JsonSchema;
  precondition?: boolean;
}
const route = (
  method: RouteContract['method'],
  path: string,
  response: string,
  request?: string,
  precondition = false
): RouteContract => ({
  method,
  path,
  response: ref(response),
  request,
  precondition,
});
export const prescribingRoutes: RouteContract[] = [
  route('GET', '/capabilities', 'Capabilities'),
  route('GET', '/policies/{policyId}', 'Policy'),
  route('GET', '/patients/{patientId}/context', 'PatientContextSnapshot'),
  { method: 'GET', path: '/drugs', response: page('DrugProduct') },
  route('GET', '/drugs/{productId}', 'DrugProduct'),
  { method: 'GET', path: '/pharmacies', response: page('PharmacyRecord') },
  {
    method: 'GET',
    path: '/prescriptions',
    response: page('PrescriptionRecord'),
  },
  route('POST', '/prescriptions', 'PrescriptionRecord', 'PrescriptionDraft'),
  route('GET', '/prescriptions/{id}', 'PrescriptionRecord'),
  route(
    'PUT',
    '/prescriptions/{id}',
    'PrescriptionRecord',
    'PrescriptionDraft',
    true
  ),
  route('POST', '/evaluations', 'EvaluationRecord', 'EvaluationRequest'),
  route('GET', '/evaluations/{id}', 'EvaluationRecord'),
  route(
    'PUT',
    '/evaluations/{id}/workflow-context',
    'EvaluationRecord',
    'WorkflowContextRequest',
    true
  ),
  route(
    'POST',
    '/evaluations/{id}/decisions',
    'DecisionRecord',
    'DecisionRequest',
    true
  ),
  route('POST', '/pdmp-queries', 'PdmpQueryRecord', 'PdmpQueryRequest'),
  route('GET', '/pdmp-queries/{id}', 'PdmpQueryRecord'),
  route(
    'POST',
    '/pdmp-queries/{id}/reviews',
    'PdmpReviewRecord',
    'PdmpReviewRequest',
    true
  ),
  route(
    'POST',
    '/prior-authorizations',
    'PriorAuthorizationCase',
    'PaCreateRequest'
  ),
  route('GET', '/prior-authorizations/{id}', 'PriorAuthorizationCase'),
  route(
    'GET',
    '/prior-authorizations/{id}/questionnaire',
    'QuestionnaireRecord'
  ),
  route(
    'PUT',
    '/prior-authorizations/{id}/answers',
    'PriorAuthorizationCase',
    'AnswersRequest',
    true
  ),
  route(
    'POST',
    '/prior-authorizations/{id}/submissions',
    'SubmissionRecord',
    'SubmissionRequest'
  ),
  route(
    'GET',
    '/prior-authorizations/{id}/submissions/{submissionId}',
    'SubmissionRecord'
  ),
  route(
    'POST',
    '/prior-authorizations/{id}/cancellations',
    'PriorAuthorizationCase',
    'PaCancellationRequest'
  ),
  route('POST', '/reviews', 'ReviewRecord', 'ReviewRequest'),
  route('POST', '/signing-sessions', 'SigningSession', 'SigningRequest'),
  route(
    'POST',
    '/signing-sessions/{id}/completions',
    'SigningSession',
    'CompletionRequest'
  ),
  route('GET', '/signing-sessions/{id}', 'SigningSession'),
  route('GET', '/signed-artifacts/{id}', 'SignedArtifact'),
  route('POST', '/transmissions', 'TransmissionRecord', 'TransmissionRequest'),
  route('GET', '/transmissions/{id}', 'TransmissionRecord'),
  route(
    'POST',
    '/transmissions/{id}/reconciliations',
    'TransmissionRecord',
    'ReconciliationRequest'
  ),
  route(
    'POST',
    '/transmissions/{id}/retries',
    'TransmissionRecord',
    'RetryRequest'
  ),
  route(
    'POST',
    '/prescriptions/{id}/cancellations',
    'CancellationRecord',
    'CancellationRequest'
  ),
  route('GET', '/cancellations/{id}', 'CancellationRecord'),
  route(
    'POST',
    '/prescriptions/{id}/replacements',
    'PrescriptionRecord',
    'ReplacementRequest'
  ),
  {
    method: 'GET',
    path: '/prescriptions/{id}/events',
    response: page('EventRecord'),
  },
];
export interface SchemaIssue {
  fieldPath: string;
  message: string;
}
/** Small JSON-schema subset shared with the generated OpenAPI contract; no runtime peers. */
export function validateSchema(
  value: unknown,
  schema: JsonSchema,
  path = '$'
): SchemaIssue[] {
  if (schema.$ref) {
    const resolved = prescribingSchemas[schema.$ref.split('/').pop()!];
    return resolved
      ? validateSchema(value, resolved, path)
      : [{ fieldPath: path, message: 'Unknown schema reference.' }];
  }
  if (schema.oneOf || schema.anyOf) {
    const variants = schema.oneOf ?? schema.anyOf!;
    const passing = variants.filter(
      (s) => validateSchema(value, s, path).length === 0
    );
    return (schema.oneOf ? passing.length === 1 : passing.length > 0)
      ? []
      : [
          {
            fieldPath: path,
            message: 'Value does not match an allowed shape.',
          },
        ];
  }
  const errors: SchemaIssue[] = [];
  if (schema.enum && !schema.enum.includes(value))
    errors.push({ fieldPath: path, message: 'Unsupported value.' });
  if (schema.type) {
    const valid =
      schema.type === 'null'
        ? value === null
        : schema.type === 'array'
          ? Array.isArray(value)
          : schema.type === 'object'
            ? isJsonObject(value)
            : schema.type === 'integer'
              ? typeof value === 'number' && Number.isSafeInteger(value)
              : typeof value === schema.type;
    if (!valid)
      return [{ fieldPath: path, message: `Expected ${schema.type}.` }];
  }
  if (
    typeof value === 'number' &&
    (!Number.isFinite(value) ||
      (schema.minimum !== undefined && value < schema.minimum))
  )
    errors.push({
      fieldPath: path,
      message: 'Number is outside the allowed range.',
    });
  if (
    typeof value === 'string' &&
    ((schema.minLength !== undefined && value.length < schema.minLength) ||
      (schema.pattern && !new RegExp(schema.pattern).test(value)))
  )
    errors.push({ fieldPath: path, message: 'String is missing or invalid.' });
  if (Array.isArray(value) && schema.items)
    value.forEach((v, i) =>
      errors.push(...validateSchema(v, schema.items!, `${path}[${i}]`))
    );
  if (isJsonObject(value)) {
    for (const key of schema.required ?? [])
      if (!(key in value))
        errors.push({
          fieldPath: `${path}.${key}`,
          message: 'Required field is missing.',
        });
    for (const [key, v] of Object.entries(value)) {
      const child = schema.properties?.[key];
      if (child) errors.push(...validateSchema(v, child, `${path}.${key}`));
      else if (schema.additionalProperties === false)
        errors.push({ fieldPath: `${path}.${key}`, message: 'Unknown field.' });
      else if (isJsonObject(schema.additionalProperties))
        errors.push(
          ...validateSchema(
            v,
            schema.additionalProperties as JsonSchema,
            `${path}.${key}`
          )
        );
    }
  }
  return errors;
}
export function matchRoute(
  method: string,
  path: string
): RouteContract | undefined {
  const pathname = path.split('?')[0].replace(/\/$/, '') || '/';
  return prescribingRoutes.find(
    (r) =>
      r.method === method &&
      new RegExp(`^${r.path.replace(/\{[^}]+\}/g, '[^/]+')}$`).test(pathname)
  );
}
export function validateRequest(
  method: string,
  path: string,
  body: unknown
): SchemaIssue[] {
  const matched = matchRoute(method, path);
  if (!matched)
    return [{ fieldPath: 'path', message: 'Unsupported endpoint.' }];
  return matched.request
    ? validateSchema(body, ref(matched.request))
    : body === undefined
      ? []
      : [{ fieldPath: 'body', message: 'GET request has no body.' }];
}
export function validateResponse(
  method: string,
  path: string,
  body: unknown
): SchemaIssue[] {
  const matched = matchRoute(method, path);
  if (!matched)
    return [{ fieldPath: 'path', message: 'Unsupported endpoint.' }];
  return validateSchema(
    body,
    obj({
      meta: obj({
        apiVersion: en('1'),
        requestId: id,
        generatedAt: id,
        mode: en('simulation', 'live'),
      }),
      data: matched.response,
    })
  );
}
