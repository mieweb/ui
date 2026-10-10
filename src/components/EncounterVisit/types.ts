import type { FieldResponse } from '@esheet/core';
import type { AssessmentItem, AssessmentOrder } from '../Assessment';
import type { ConditionConcern } from '../ProblemList';

/** Native eSheet answers, keyed by generated field id. */
export type EncounterResponses = Record<string, FieldResponse>;

export type EncounterSectionKind =
  | 'narrative'
  | 'observations'
  | 'vitals'
  | 'medications'
  | 'allergies'
  | 'assessment';

export interface EncounterCode {
  system: string;
  code: string;
  display?: string;
}

export interface EncounterObservationDefinition {
  id: string;
  label: string;
  type?: 'text' | 'number' | 'choice';
  unit?: string;
  code?: EncounterCode;
  options?: string[];
  required?: boolean;
}

export interface EncounterSectionDefinition {
  id: string;
  title: string;
  description?: string;
  kind: EncounterSectionKind;
  observations?: EncounterObservationDefinition[];
  /** Add a free narrative alongside an observations section's individual fields. */
  narrative?: boolean;
  /** Require at least one answer in this section. */
  required?: boolean;
}

/** Visit sections and their observation granularity; contains no patient identity. */
export interface EncounterVisitDefinition {
  id: string;
  title: string;
  sections: EncounterSectionDefinition[];
}

/** Explicit measurements only. Units: Celsius, cm, kg, mmHg, percent and /min. */
export interface EncounterVitalReading {
  id: string;
  recordedAt?: string;
  systolic?: number;
  diastolic?: number;
  pulse?: number;
  respiratoryRate?: number;
  temperature?: number;
  oxygenSaturation?: number;
  height?: number;
  weight?: number;
  pain?: number;
  position?: string;
  site?: string;
}

export type EncounterVitalNumericKey = Exclude<
  keyof EncounterVitalReading,
  'id' | 'recordedAt' | 'position' | 'site'
>;

/** Persist unfinished numeric input so Save and MCP see the same state as the editor. */
export interface EncounterVitalInputDraft {
  readingId: string;
  key: EncounterVitalNumericKey;
  text: string;
}

export interface EncounterVitalsValue {
  readings: EncounterVitalReading[];
  inputDrafts?: EncounterVitalInputDraft[];
}

/** The same concern, assessment and order records used by the Assessment component. */
export interface EncounterAssessmentValue {
  concerns: ConditionConcern[];
  items: AssessmentItem[];
  orders: AssessmentOrder[];
}

export interface EncounterObservationComponent {
  label: string;
  value: number;
  unit?: string;
  code?: EncounterCode;
}

export interface EncounterObservation {
  sectionId: string;
  fieldId: string;
  label: string;
  value: string | number;
  unit?: string;
  code?: EncounterCode;
  /** Stable reading identity shared by measurements taken together. */
  groupId?: string;
  recordedAt?: string;
  position?: string;
  site?: string;
  /** Blood pressure keeps systolic and diastolic together, including partial pairs. */
  components?: EncounterObservationComponent[];
}

export interface EncounterValidationIssue {
  sectionId: string;
  fieldId: string;
  code:
    | 'required'
    | 'invalid-number'
    | 'invalid-choice'
    | 'invalid-response'
    | 'invalid-json'
    | 'invalid-value'
    | 'incomplete-blood-pressure';
  message: string;
  readingId?: string;
  /** Property within a structured custom response. */
  path?: string;
}

export interface EncounterVisitSnapshot {
  definition: EncounterVisitDefinition;
  responses: EncounterResponses;
  observations: EncounterObservation[];
  note: string;
  errors: EncounterValidationIssue[];
}
