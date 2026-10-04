import type {
  ActionStage,
  ControlledSchedule,
  DrugCoding,
  Fact,
  GateState,
  PrescriptionDraft,
  PrescriptionIssue,
  PrescriptionValidationContext,
  PrescriptionValidationResult,
} from '../types';
import type { PrescriptionPolicy, PrescriptionService } from '../policy';
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };
export interface ApiEnvelope<T> {
  meta: {
    apiVersion: '1';
    requestId: string;
    generatedAt: string;
    mode: 'simulation' | 'live';
  };
  data: T;
}
export interface RevisionRef {
  id: string;
  /** Prescription contentRevision, never its recordVersion. */ revision: string;
}
export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}
export interface Evidence {
  providerId: string;
  datasetVersion: string;
  ruleId?: string;
  referenceUrl?: string;
  referenceSection?: string;
  observedAt?: string;
  retrievedAt: string;
  synthetic: boolean;
}
export interface ClinicalFinding {
  id: string;
  category:
    | 'interaction'
    | 'duplicate-therapy'
    | 'allergy'
    | 'pregnancy'
    | 'lactation'
    | 'reproductive-potential'
    | 'dosing'
    | 'formulary'
    | 'benefit'
    | 'pdmp'
    | 'prior-authorization';
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
    blocks: ActionStage[];
    resolution: 'none' | 'acknowledgement' | 'override' | 'cannot-override';
    allowedReasonCodes: string[];
  };
}
export type EvaluationFinding = ClinicalFinding;
export type WorkflowFinding = ClinicalFinding & {
  category: 'formulary' | 'benefit' | 'pdmp' | 'prior-authorization';
};
export interface CheckResult<T = JsonValue> {
  status:
    | 'pending'
    | 'complete'
    | 'partial'
    | 'unavailable'
    | 'not-applicable'
    | 'not-requested';
  outcome: 'findings' | 'no-findings-within-coverage' | 'unknown';
  data: T | null;
  findings: EvaluationFinding[];
  missingInputs: string[];
  coverage: {
    domains: string[];
    evaluatedSubjects: string[];
    excludedSubjects: string[];
    datasetVersion: string | null;
  };
  evidence: Evidence[];
  checkedAt: string | null;
  expiresAt: string | null;
  error: { code: string; retryable: boolean } | null;
}
export interface DrugProduct {
  id: string;
  display: string;
  coding: DrugCoding[];
  conceptSpecificity: 'product' | 'ingredient' | 'compound';
  ingredientIds: string[];
  strength: string;
  doseForm: string;
  quantityUnits: string[];
  controlledSchedule: Fact<ControlledSchedule>;
  evidence: Evidence[];
}
export interface PharmacyRecord {
  id: string;
  name: string;
  address: string;
  directoryId: string;
  revision: string;
  newRx: Fact<boolean>;
  cancelRx: Fact<boolean>;
  epcs: Fact<boolean>;
  refreshedAt: string;
}
export interface MedicationExposure {
  id: string;
  productId?: string;
  coding?: DrugCoding[];
  status: string;
  use: 'actual' | 'reported' | 'proposed';
  sourceRevision: string;
  effectiveStart?: string;
  effectiveEnd?: string;
  dose?: string;
  doseUnit?: string;
}
export interface ObservationRecord {
  code: string;
  system: string;
  value: string;
  unit: string;
  unitCode: string;
  unitSystem: string;
  effectiveAt: string;
  sourceId: string;
  method: string;
  status: string;
}
export interface PatientContextSnapshot {
  patientId: string;
  encounterId?: string;
  revision: string;
  capturedAt: string;
  demographics: Fact<{ name: string; address: string; birthDate: string }>;
  medicationHistory: Fact<MedicationExposure[]>;
  allergies: Fact<
    Array<{
      id: string;
      productId?: string;
      verification: string;
      reaction: string;
      severity: string;
    }>
  >;
  pregnancy: Fact<'pregnant' | 'not-pregnant' | 'unknown'>;
  gestationalAgeWeeks?: Fact<string>;
  lactation: Fact<boolean>;
  pregnancyIntent: Fact<boolean>;
  measurements: ObservationRecord[];
  renal: Fact<{
    metric: 'CrCl' | 'eGFR';
    method: string;
    value: string;
    unit: string;
    dialysis: boolean;
  }>;
  hepatic: Fact<string>;
  coverage: Fact<{
    planId: string;
    memberId: string;
    active: boolean;
    revision: string;
  }>;
  completeness: { medicationsReviewed: boolean; allergiesReviewed: boolean };
}
export interface PrescriberContext {
  id: string;
  revision: string;
  identity: PrescriptionValidationContext['prescriber'];
  role: 'staff' | 'prescriber' | 'read-only';
}
export interface PrescriptionRecord extends PrescriptionDraft {
  id: string;
  contentRevision: string;
  recordVersion: string;
  lifecycle: 'draft' | 'reviewed' | 'signed' | 'transmitted' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  latestEvaluationId: string | null;
  reviewId: string | null;
  signedArtifactId: string | null;
  latestTransmissionId: string | null;
  replacesPrescriptionId: string | null;
}
export type EvaluationSubject =
  | { kind: 'saved'; prescription: RevisionRef }
  | { kind: 'preview'; draft: PrescriptionDraft; clientDraftRevision: string };
export interface EvaluationRequest {
  subject: EvaluationSubject;
  services: PrescriptionService[];
  relatedPrescriptions?: RevisionRef[];
  pdmpQueryId?: string;
  priorAuthorizationId?: string;
}
export interface DecisionRecord {
  id: string;
  revision: string;
  evaluationId: string;
  findingId: string;
  action: 'acknowledgement' | 'override';
  reasonCode: string;
  comment?: string;
  mitigation?: string;
  actorId: string;
  createdAt: string;
  inputFingerprint: string;
}
export interface GateReason {
  domain: string;
  code: string;
  message: string;
  checkId?: string;
  findingId?: string;
  fieldPath?: string;
  remediation?: PrescriptionIssue['remediation'];
}
export interface EvaluationRecord {
  id: string;
  /** Monotonic nonnegative decimal string within this evaluation resource. */
  revision: string;
  subject: EvaluationSubject;
  relatedPrescriptions: RevisionRef[];
  patientContextRevision: string;
  prescriberContextRevision: string;
  pharmacyRevision: string;
  policyVersion: string;
  knowledgeVersions: Record<string, string>;
  inputFingerprint: string;
  workflowFingerprint: string;
  createdAt: string;
  projectedAt: string;
  expiresAt: string | null;
  validity: 'current' | 'stale' | 'expired';
  validityReasons: string[];
  state: 'running' | 'complete' | 'partial';
  validation: PrescriptionValidationResult;
  checks: Partial<Record<PrescriptionService, CheckResult>>;
  pdmpQueryId: string | null;
  priorAuthorizationId: string | null;
  decisions: DecisionRecord[];
  gates: Record<ActionStage, { state: GateState; reasons: GateReason[] }>;
  reviewId: string | null;
  signingSessionId: string | null;
  signedArtifactId: string | null;
  pollAfterMs: number;
}
export interface PdmpQueryRequest {
  patientId: string;
  prescriberId: string;
  encounterId?: string;
  jurisdictions: string[];
  purposeCode: string;
  attestation?: boolean;
}
export interface PdmpQueryRecord {
  id: string;
  revision: string;
  patientId: string;
  prescriberId: string;
  requestedJurisdictions: string[];
  purposeCode: string;
  state: 'queued' | 'complete' | 'partial' | 'unavailable';
  match: 'matched' | 'ambiguous' | 'no-match';
  jurisdictions: Array<{
    jurisdiction: string;
    status: 'pending' | 'complete' | 'unavailable';
  }>;
  reportRevision: string | null;
  reportGeneratedAt: string | null;
  queriedAt: string;
  expiresAt: string;
  entries: Array<{
    id: string;
    productId: string;
    dispenseDate: string;
    quantity: string;
    unit: string;
    daysSupply?: string;
    jurisdiction: string;
  }>;
  reviewId: string | null;
  pollAfterMs: number;
}
export interface PdmpReviewRecord {
  id: string;
  revision: string;
  queryId: string;
  reportRevision: string;
  actorId: string;
  reviewedAt: string;
  purposeCode: string;
  comment?: string;
}
export interface QuestionnaireItem {
  linkId: string;
  text: string;
  type: 'boolean' | 'string' | 'integer' | 'decimal' | 'choice' | 'date';
  required: boolean;
  choices?: string[];
  enableWhen?: Array<{ linkId: string; equals: string | boolean | number }>;
}
export interface QuestionnaireRecord {
  id: string;
  version: string;
  items: QuestionnaireItem[];
}
export interface QuestionnaireAnswer {
  linkId: string;
  value: string | boolean | number;
}
export type PriorAuthorizationState =
  | 'draft'
  | 'questionnaire-needed'
  | 'ready-to-submit'
  | 'submitted'
  | 'pending'
  | 'approved'
  | 'denied'
  | 'more-information-needed'
  | 'expired'
  | 'revoked'
  | 'cancelled';
export interface PriorAuthorizationCase {
  id: string;
  revision: string;
  patientId: string;
  prescription: RevisionRef;
  evaluationId: string;
  planId: string;
  benefitType: 'pharmacy' | 'medical';
  route: 'script-epa' | 'davinci-pas' | 'manual' | 'simulation';
  scope: {
    productId: string;
    quantity: string;
    quantityUnit: string;
    daysSupply?: string;
    indication?: string;
    coverageRevision: string;
  };
  createdAt: string;
  state: PriorAuthorizationState;
  questionnaire: { id: string; version: string };
  answers: QuestionnaireAnswer[];
  documentReferences: string[];
  answerIssues: Array<{ fieldPath: string; message: string }>;
  submissionIds: string[];
  decision: {
    authorizationReference: string | null;
    effectiveFrom: string | null;
    effectiveTo: string | null;
    approvedQuantity: string | null;
    reasons: string[];
    actions: string[];
  } | null;
  expiresAt: string | null;
  pollAfterMs: number;
  cancellation?: {
    state: 'requested' | 'acknowledged' | 'rejected' | 'unknown';
    reasonCode: string;
    requestedAt: string;
    providerReference?: string;
  };
}
export interface SubmissionRecord {
  id: string;
  revision: string;
  caseId: string;
  questionnaireId: string;
  questionnaireVersion: string;
  submissionKind: 'initial' | 'additional-information' | 'appeal';
  state: 'queued' | 'sent' | 'acknowledged' | 'failed';
  outcome: string | null;
  pollAfterMs: number;
}
export interface ReviewRecord {
  id: string;
  revision: string;
  patientId: string;
  actorId: string;
  selections: Array<{
    prescription: RevisionRef;
    evaluationId: string;
    readyToSign: true;
  }>;
  reviewedAt: string;
  inputFingerprints: string[];
}
export interface SigningSession {
  id: string;
  revision: string;
  reviewId: string;
  actorId: string;
  mode: 'ordinary' | 'epcs';
  state:
    | 'challenge-pending'
    | 'completed'
    | 'declined'
    | 'expired'
    | 'invalidated';
  expiresAt: string;
  action: 'simulated-challenge' | 'provider-handoff';
  artifacts: Array<{ prescription: RevisionRef; signedArtifactId: string }>;
  pollAfterMs: number;
}
export interface SignedArtifact {
  id: string;
  prescription: RevisionRef;
  snapshot: PrescriptionDraft;
  inputFingerprint: string;
  prescriberId: string;
  reviewId: string;
  signedAt: string;
  mode: 'ordinary' | 'epcs';
  simulated: boolean;
}
export interface TransmissionAttempt {
  sequence: number;
  correlationId: string;
  submittedAt: string | null;
  outcome: string;
}
export interface TransmissionRecord {
  id: string;
  revision: string;
  prescription: RevisionRef;
  evaluationId: string;
  signedArtifactId: string;
  pharmacyId: string;
  transactionType: 'NewRx';
  correlationId: string;
  state:
    | 'queued'
    | 'submitted'
    | 'acknowledged'
    | 'rejected'
    | 'failed'
    | 'unknown-outcome';
  createdAt: string;
  updatedAt: string;
  attemptCount: number;
  attempts: TransmissionAttempt[];
  receipt: { id: string; receivedAt: string; message: string } | null;
  error: { code: string; message: string; retryable: boolean } | null;
  reconciliation: {
    status: 'idle' | 'queued' | 'running' | 'complete' | 'unavailable';
    checkedAt: string | null;
    outcome:
      | 'acknowledged'
      | 'rejected'
      | 'known-not-transmitted'
      | 'still-unknown'
      | null;
  };
  supersedesOperationId: string | null;
  pollAfterMs: number;
}
export interface CancellationRecord {
  id: string;
  revision: string;
  prescription: RevisionRef;
  signedArtifactId: string | null;
  transmissionId: string | null;
  reasonCode: string;
  state: 'requested' | 'queued' | 'acknowledged' | 'rejected' | 'unknown';
  createdAt: string;
  correlationId: string;
  pollAfterMs: number;
}
export interface EventRecord {
  id: string;
  at: string;
  actorId: string;
  type: string;
  outcome: string;
  prescriptionId: string | null;
  references: string[];
}
export interface Capabilities {
  mode: 'simulation' | 'live';
  services: Record<string, 'supported' | 'unsupported'>;
  profiles: Array<{ id: string; version: string }>;
  transactionTypes: string[];
  maxBatchSize: number;
  pollAfterMs: number;
  maxPollingMs: number;
}
export interface ApiProblem {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  code: string;
  requestId: string;
  retryable: boolean;
  currentRevision?: string;
  issues?: Array<{ fieldPath?: string; message: string }>;
}
export interface RequestOptions {
  signal?: AbortSignal;
  idempotencyKey?: string;
  ifMatch?: string;
  headers?: Record<string, string>;
}
export interface ApiResponse<T> {
  status: number;
  headers: Record<string, string>;
  body: ApiEnvelope<T>;
}
/** Transport seam shared by the EHR implementation and injectable HTTP client. */
export interface PrescribingApi {
  request<T = JsonValue>(
    method: 'GET' | 'POST' | 'PUT',
    path: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<ApiResponse<T>>;
  getCapabilities(options?: RequestOptions): Promise<ApiResponse<Capabilities>>;
  getPolicy(
    id: string,
    options?: RequestOptions
  ): Promise<ApiResponse<PrescriptionPolicy>>;
  getPatientContext(
    id: string,
    options?: RequestOptions
  ): Promise<ApiResponse<PatientContextSnapshot>>;
  createPrescription(
    draft: PrescriptionDraft,
    options: RequestOptions
  ): Promise<ApiResponse<PrescriptionRecord>>;
  getPrescription(
    id: string,
    options?: RequestOptions
  ): Promise<ApiResponse<PrescriptionRecord>>;
  updatePrescription(
    id: string,
    draft: PrescriptionDraft,
    options: RequestOptions
  ): Promise<ApiResponse<PrescriptionRecord>>;
  createEvaluation(
    request: EvaluationRequest,
    options: RequestOptions
  ): Promise<ApiResponse<EvaluationRecord>>;
  getEvaluation(
    id: string,
    options?: RequestOptions
  ): Promise<ApiResponse<EvaluationRecord>>;
  searchDrugs(
    query: string,
    cursor?: string,
    options?: RequestOptions
  ): Promise<ApiResponse<Page<DrugProduct>>>;
  getDrug(
    id: string,
    options?: RequestOptions
  ): Promise<ApiResponse<DrugProduct>>;
  searchPharmacies(
    query: string,
    cursor?: string,
    options?: RequestOptions
  ): Promise<ApiResponse<Page<PharmacyRecord>>>;
  listPrescriptions(
    patientId: string,
    options?: RequestOptions
  ): Promise<ApiResponse<Page<PrescriptionRecord>>>;
  updateWorkflowContext(
    id: string,
    links: { pdmpQueryId: string | null; priorAuthorizationId: string | null },
    options: RequestOptions
  ): Promise<ApiResponse<EvaluationRecord>>;
  createDecision(
    id: string,
    request: DecisionRequest,
    options: RequestOptions
  ): Promise<ApiResponse<DecisionRecord>>;
  createPdmpQuery(
    request: PdmpQueryRequest,
    options: RequestOptions
  ): Promise<ApiResponse<PdmpQueryRecord>>;
  getPdmpQuery(
    id: string,
    options?: RequestOptions
  ): Promise<ApiResponse<PdmpQueryRecord>>;
  reviewPdmpQuery(
    id: string,
    request: PdmpReviewRequest,
    options: RequestOptions
  ): Promise<ApiResponse<PdmpReviewRecord>>;
  createPriorAuthorization(
    request: PaCreateRequest,
    options: RequestOptions
  ): Promise<ApiResponse<PriorAuthorizationCase>>;
  getPriorAuthorization(
    id: string,
    options?: RequestOptions
  ): Promise<ApiResponse<PriorAuthorizationCase>>;
  getQuestionnaire(
    id: string,
    options?: RequestOptions
  ): Promise<ApiResponse<QuestionnaireRecord>>;
  saveAnswers(
    id: string,
    request: AnswersRequest,
    options: RequestOptions
  ): Promise<ApiResponse<PriorAuthorizationCase>>;
  submitPriorAuthorization(
    id: string,
    request: SubmissionRequest,
    options: RequestOptions
  ): Promise<ApiResponse<SubmissionRecord>>;
  getSubmission(
    caseId: string,
    id: string,
    options?: RequestOptions
  ): Promise<ApiResponse<SubmissionRecord>>;
  cancelPriorAuthorization(
    id: string,
    request: { caseRevision: string; reasonCode: string },
    options: RequestOptions
  ): Promise<ApiResponse<PriorAuthorizationCase>>;
  createReview(
    request: ReviewRequest,
    options: RequestOptions
  ): Promise<ApiResponse<ReviewRecord>>;
  createSigningSession(
    request: { reviewId: string; reviewRevision: string },
    options: RequestOptions
  ): Promise<ApiResponse<SigningSession>>;
  completeSigningSession(
    id: string,
    request: { sessionRevision: string; completionReference: string },
    options: RequestOptions
  ): Promise<ApiResponse<SigningSession>>;
  getSigningSession(
    id: string,
    options?: RequestOptions
  ): Promise<ApiResponse<SigningSession>>;
  getSignedArtifact(
    id: string,
    options?: RequestOptions
  ): Promise<ApiResponse<SignedArtifact>>;
  createTransmission(
    request: TransmissionRequest,
    options: RequestOptions
  ): Promise<ApiResponse<TransmissionRecord>>;
  getTransmission(
    id: string,
    options?: RequestOptions
  ): Promise<ApiResponse<TransmissionRecord>>;
  reconcileTransmission(
    id: string,
    request: { operationRevision: string },
    options: RequestOptions
  ): Promise<ApiResponse<TransmissionRecord>>;
  retryTransmission(
    id: string,
    request: {
      operationRevision: string;
      evaluationId: string;
      reasonCode: string;
    },
    options: RequestOptions
  ): Promise<ApiResponse<TransmissionRecord>>;
  getCancellation(
    id: string,
    options?: RequestOptions
  ): Promise<ApiResponse<CancellationRecord>>;
  cancelPrescription(
    id: string,
    request: {
      revision: string;
      reasonCode: string;
      signedArtifactId?: string;
      transmissionId?: string;
    },
    options: RequestOptions
  ): Promise<ApiResponse<CancellationRecord>>;
  replacePrescription(
    id: string,
    request: {
      original: RevisionRef;
      reasonCode: string;
      draft: PrescriptionDraft;
    },
    options: RequestOptions
  ): Promise<ApiResponse<PrescriptionRecord>>;
  getEvents(
    id: string,
    options?: RequestOptions
  ): Promise<ApiResponse<Page<EventRecord>>>;
}
export interface DecisionRequest {
  findingId: string;
  action: 'acknowledgement' | 'override';
  reasonCode: string;
  comment?: string;
  mitigation?: string;
}
export interface PdmpReviewRequest {
  reviewedReportRevision: string;
  purposeCode: string;
  comment?: string;
}
export interface PaCreateRequest {
  prescription: RevisionRef;
  evaluationId: string;
  benefitInquiryId?: string;
  benefitType: 'pharmacy' | 'medical';
  reasonCode: string;
  payerRouteReference?: string;
}
export interface AnswersRequest {
  questionnaireId: string;
  questionnaireVersion: string;
  answers: QuestionnaireAnswer[];
  documentReferences?: string[];
}
export interface SubmissionRequest {
  caseRevision: string;
  questionnaireVersion: string;
  submissionKind: 'initial' | 'additional-information' | 'appeal';
}
export interface ReviewRequest {
  patientId: string;
  selections: ReviewRecord['selections'];
}
export interface TransmissionRequest {
  prescription: RevisionRef;
  evaluationId: string;
  signedArtifactId: string;
  pharmacyId: string;
  transactionType: 'NewRx';
}
/** Domain payloads remain separate from check coverage/freshness and workflow eligibility. */
export interface InteractionResult {
  evaluatedPairs: string[];
  historyReviewed: boolean;
  synthetic?: boolean;
}
export interface PregnancyResult {
  pregnancy: Fact<'pregnant' | 'not-pregnant' | 'unknown'>;
  lactation: Fact<boolean>;
  reproductivePotential: Fact<'planning' | 'not-planning' | 'unknown'>;
  narrative: string;
  synthetic?: boolean;
}
export interface DosingResult {
  perDoseAmount: { value: string; unit: string } | null;
  dailyAmount: { value: string; unit: string } | null;
  weightKg: string | null;
  demonstrationRange: { maxPerDose: string; unit: string } | null;
  synthetic?: boolean;
}
export interface CoverageRestriction {
  code: string;
  message: string;
  productId?: string;
  quantity?: string;
  indication?: string;
}
export interface CoverageAlternative {
  productId: string;
  display: string;
  coverage: 'covered' | 'not-covered' | 'conditional' | 'unknown';
}
export interface FormularyResult {
  planId: string;
  formularyVersion: string;
  productId: string;
  coverage: 'covered' | 'not-covered' | 'conditional' | 'unknown';
  tier: string | null;
  restrictions: CoverageRestriction[];
  quantityLimit: { value: string; unit: string } | null;
  stepTherapy: string | null;
  priorAuthorization: 'yes' | 'no' | 'unknown';
  alternatives: CoverageAlternative[];
  evidence: Evidence[];
  synthetic?: boolean;
}
export interface BenefitResult {
  inquiryId: string;
  planId: string;
  memberId: string;
  pharmacyId: string | null;
  productId: string;
  quantity: string | null;
  daysSupply: string | null;
  coverage: 'covered' | 'not-covered' | 'conditional' | 'unknown';
  patientCostEstimate: { amount: string; currency: string } | null;
  estimateAsOf: string;
  estimateDisclaimer: string;
  restrictions: CoverageRestriction[];
  priorAuthorization: 'yes' | 'no' | 'unknown';
  alternatives: CoverageAlternative[];
  payerResponseId: string;
  synthetic?: boolean;
}
export interface ClinicalProviderSnapshot {
  draft: PrescriptionDraft;
  context: PatientContextSnapshot;
  product: DrugProduct | null;
  related: Array<{ draft: PrescriptionDraft; product: DrugProduct | null }>;
  policy: PrescriptionPolicy;
  knowledgeVersion: string;
  evaluatedAt: string;
}
export interface ClinicalKnowledgeProvider {
  checkInteractions(
    snapshot: Readonly<ClinicalProviderSnapshot>,
    signal?: AbortSignal
  ): Promise<CheckResult<InteractionResult>>;
  checkPregnancy(
    snapshot: Readonly<ClinicalProviderSnapshot>,
    signal?: AbortSignal
  ): Promise<CheckResult<PregnancyResult>>;
  checkDosing(
    snapshot: Readonly<ClinicalProviderSnapshot>,
    signal?: AbortSignal
  ): Promise<CheckResult<DosingResult>>;
}
export interface CoverageProvider {
  checkFormulary(
    snapshot: Readonly<ClinicalProviderSnapshot>,
    signal?: AbortSignal
  ): Promise<CheckResult<FormularyResult>>;
  checkBenefit(
    snapshot: Readonly<ClinicalProviderSnapshot>,
    signal?: AbortSignal
  ): Promise<CheckResult<BenefitResult>>;
}
export interface TransmissionProvider {
  submitNewRx(
    snapshot: Readonly<SignedArtifact>,
    correlationId: string,
    signal?: AbortSignal
  ): Promise<{
    outcome: 'acknowledged' | 'rejected' | 'failed' | 'unknown';
    receiptId?: string;
  }>;
  lookupOutcome(
    correlationId: string,
    signal?: AbortSignal
  ): Promise<{
    outcome:
      | 'acknowledged'
      | 'rejected'
      | 'known-not-transmitted'
      | 'still-unknown';
    checkedAt: string;
  }>;
  submitCancelRx(
    original: { signedArtifactId: string; transmissionId: string | null },
    correlationId: string,
    signal?: AbortSignal
  ): Promise<{ outcome: 'acknowledged' | 'rejected' | 'unknown' }>;
}
