import type { PrescriptionPolicy } from '../../prescribing/policy';
import type { PrescriptionValidationInput } from '../../prescribing/types';
import type {
  ApiResponse,
  CancellationRecord,
  DecisionRecord,
  EvaluationRecord,
  EventRecord,
  PdmpQueryRecord,
  PdmpReviewRecord,
  PrescriptionRecord,
  PriorAuthorizationCase,
  QuestionnaireRecord,
  ReviewRecord,
  SignedArtifact,
  SigningSession,
  SubmissionRecord,
  TransmissionRecord,
} from '../../prescribing/api/contracts';
import type {
  FixtureContext,
  FixturePharmacy,
  FixtureProduct,
} from './fixtures';
import type { ProviderSnapshot } from './providers';

export interface SimulationSession {
  id: string;
  actorId: string;
  role: 'staff' | 'prescriber' | 'read-only';
  allowedActions: string[];
  allowedPatientIds: string[];
}
export interface StoredEvaluationInput {
  input: PrescriptionValidationInput;
  snapshot: ProviderSnapshot;
  policy: PrescriptionPolicy;
}
export interface SimulationStore {
  patients: Map<string, FixtureContext>;
  products: Map<string, FixtureProduct>;
  pharmacies: Map<string, FixturePharmacy>;
  policies: Map<string, PrescriptionPolicy>;
  prescriptions: Map<string, PrescriptionRecord>;
  evaluations: Map<string, EvaluationRecord>;
  evaluationInputs: Map<string, StoredEvaluationInput>;
  decisions: Map<string, DecisionRecord>;
  pdmpQueries: Map<string, PdmpQueryRecord>;
  pdmpReviews: Map<string, PdmpReviewRecord>;
  priorAuthorizations: Map<string, PriorAuthorizationCase>;
  questionnaires: Map<string, QuestionnaireRecord>;
  submissions: Map<string, SubmissionRecord>;
  reviews: Map<string, ReviewRecord>;
  signingSessions: Map<string, SigningSession>;
  challengeOutcomes: Map<
    string,
    { sessionId: string; outcome: 'approved' | 'declined'; actorId: string }
  >;
  artifacts: Map<string, SignedArtifact>;
  transmissions: Map<string, TransmissionRecord>;
  cancellations: Map<string, CancellationRecord>;
  events: Map<string, EventRecord>;
  idempotency: Map<
    string,
    { fingerprint: string; response: ApiResponse<unknown> }
  >;
}

export function createStore(): SimulationStore {
  return {
    patients: new Map(),
    products: new Map(),
    pharmacies: new Map(),
    policies: new Map(),
    prescriptions: new Map(),
    evaluations: new Map(),
    evaluationInputs: new Map(),
    decisions: new Map(),
    pdmpQueries: new Map(),
    pdmpReviews: new Map(),
    priorAuthorizations: new Map(),
    questionnaires: new Map(),
    submissions: new Map(),
    reviews: new Map(),
    signingSessions: new Map(),
    challengeOutcomes: new Map(),
    artifacts: new Map(),
    transmissions: new Map(),
    cancellations: new Map(),
    events: new Map(),
    idempotency: new Map(),
  };
}
