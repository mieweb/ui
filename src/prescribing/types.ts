/** JSON-only prescribing contracts. Drafts deliberately allow incomplete and invalid text. */
export type PrescribingIntent = 'prescribe' | 'history' | 'administration';
export type GateState = 'pass' | 'fail' | 'unknown';
export type ActionStage = 'review' | 'sign' | 'transmit';
export interface DrugCoding {
  system: string;
  code: string;
  display?: string;
  version?: string;
}
export interface PrescriptionDetails {
  name?: string;
  sig?: string;
  code?: DrugCoding;
  productId?: string;
  strength?: string;
  doseForm?: string;
  dose?: string;
  doseUnit?: string;
  quantity?: string;
  quantityUnit?: string;
  daysSupply?: string;
  route?: string;
  frequency?: string;
  prn?: boolean;
  prnReason?: string;
  maxDailyDose?: string;
  refills?: string;
  substitution?: '0' | '1';
  startDate?: string;
  endDate?: string;
  writtenDate?: string;
  /** Display text for the condition/concern being treated; free text remains savable. */
  indication?: string;
  /** Selected condition coding, independent of the medication's drug code. */
  indicationCode?: DrugCoding;
  /** Durable chart concern identity; the EHR resolves and authorizes this link. */
  concernId?: string;
  pharmacyNotes?: string;
  pharmacyId?: string;
}
export interface PrescriptionDraft {
  id?: string;
  contentRevision?: string;
  patientId: string;
  encounterId?: string;
  prescriberId: string;
  pharmacyId?: string;
  intent: PrescribingIntent;
  display: string;
  code?: DrugCoding;
  prescription: PrescriptionDetails;
}
export type Fact<T> =
  | { state: 'known'; value: T; observedAt: string; sourceId: string }
  | { state: 'unknown'; reason: string }
  | { state: 'not-applicable'; reason: string };
export type ControlledSchedule = 'non-controlled' | 'II' | 'III' | 'IV' | 'V';
export interface PrescriptionValidationContext {
  revision: string;
  patient?: Fact<{
    id: string;
    name: string;
    address: string;
    birthDate?: string;
  }>;
  prescriber?: Fact<{
    id: string;
    name: string;
    address: string;
    authorized: boolean;
    networkEnrolled: boolean;
    deaRegistration?: string;
    epcsAuthorized?: boolean;
  }>;
  pharmacy?: Fact<{ id: string; newRx: boolean; epcs: boolean }>;
  controlledSchedule?: Fact<ControlledSchedule>;
  product?: Fact<{
    id: string;
    coding: DrugCoding[];
    conceptSpecificity: 'product' | 'ingredient' | 'compound';
    strength: string;
    doseForm: string;
    quantityUnits: string[];
  }>;
}
export interface PrescriptionValidationInput {
  draft: PrescriptionDraft;
  orderId: string;
  orderRevision: string;
  context: PrescriptionValidationContext;
  evaluatedAt: string;
}
export interface PrescriptionIssue {
  code: string;
  ruleId: string;
  ruleSource:
    | 'product'
    | 'network'
    | 'federal'
    | 'jurisdiction'
    | 'organization'
    | 'clinical-provider'
    | 'payer'
    | 'pdmp-provider';
  fieldPath?: string;
  message: string;
  severity: 'warning' | 'error';
  blocks: ActionStage[];
  remediation:
    | 'edit-prescription'
    | 'patient'
    | 'prescriber'
    | 'pharmacy'
    | 'clinical-review'
    | 'pdmp'
    | 'coverage'
    | 'prior-authorization'
    | 'sign'
    | 'system';
}
export interface PrescriptionValidationResult {
  orderId: string;
  orderRevision: string;
  contextRevision: string;
  policyVersion: string;
  evaluatedAt: string;
  dataState: 'incomplete' | 'invalid' | 'complete' | 'unknown';
  checks: { review: GateState; transmit: GateState };
  issues: PrescriptionIssue[];
}
export interface PrescriptionReadiness {
  validation: PrescriptionValidationResult;
  source: 'client-preview' | 'simulated-server' | 'server-confirmed';
  workflow: {
    evaluationId: string;
    evaluationRevision: string;
    inputFingerprint: string;
    workflowFingerprint: string;
    projectedAt: string;
    expiresAt: string | null;
    validity: 'current' | 'stale' | 'expired';
    gates: Record<ActionStage, GateState>;
    issues: PrescriptionIssue[];
  } | null;
  signing: 'not-signed' | 'signed' | 'unknown';
  delivery: 'not-sent' | 'sending' | 'sent' | 'failed' | 'unknown';
}
/** Editor/row host input. Construct fresh trusted context on the server. */
export interface PrescribingConfiguration {
  references?: { patientId: string; prescriberId: string; pharmacyId?: string };
  input: Omit<PrescriptionValidationInput, 'draft'>;
  policy: import('./policy').PrescriptionPolicy;
}
