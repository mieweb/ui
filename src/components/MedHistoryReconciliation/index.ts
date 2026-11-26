export {
  MedHistoryReconciliation,
  type MedHistoryReconciliationProps,
  type MedHistoryAiProvider,
  type MedHistoryAiSuggestion,
} from './MedHistoryReconciliation';

export {
  scoreMedicationPair,
  canBeFillOf,
  fillBlocker,
  findDuplicateCandidates,
  findRepeatFillGroups,
  levenshtein,
  textSimilarity,
  normalizeMedicationName,
  parsePharmacyIdentifier,
  DEFAULT_DUPLICATE_THRESHOLD,
  DEFAULT_BRAND_GENERIC_CREDIT,
  DEFAULT_MATCH_WEIGHTS,
  MATCH_FIELDS,
  type MatchField,
  type MatchWeights,
  type MatchScore,
  type MatchScoringOptions,
  type MatchReasonCode,
  type FieldResult,
  type FieldOutcome,
  type FieldScorer,
  type DismissReason,
  type DuplicateCandidate,
  type FillBlocker,
} from './scoring';

export {
  buildChangeSet,
  fillFromRecord,
  type GroupPreset,
  type MedHistoryDecision,
} from './decisions';

export type {
  MedHistoryRecord,
  MedHistoryMedication,
  MedHistorySource,
  MedHistorySourceKind,
  MedHistoryChange,
  MedHistoryAddChange,
  MedHistoryFillChange,
  MedHistoryFill,
  MedHistoryChangeSet,
  ImportWarning,
  ImportWarningCode,
  PharmacyRef,
  PrescriberRef,
} from './types';
