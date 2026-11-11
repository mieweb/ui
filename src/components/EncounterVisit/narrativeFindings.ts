import type { FieldResponse } from '@esheet/core';
import {
  applyNarrativeFinding,
  getNarrativeFindings,
  hasNarrativeFindingText,
  validNarrativeFindings,
  type NarrativeAttributeNames,
} from '../../esheet-fields/narrativeFindings';
import type { EncounterNarrativeFinding } from './types';

/** Published encounter response attribute namespace (kept for compatibility). */
export const ENCOUNTER_NARRATIVE_ATTRIBUTES: NarrativeAttributeNames = {
  html: 'encounterNarrativeHtml',
  text: 'encounterNarrativeText',
  findings: 'encounterNarrativeFindings',
  findingsText: 'encounterNarrativeFindingsText',
};

/** Whitelist configured or persisted selection provenance, never arbitrary attributes. */
export function validEncounterNarrativeFindings(
  value: unknown
): EncounterNarrativeFinding[] {
  return validNarrativeFindings(value);
}

/** Match complete inserted lines, never a phrase inside unrelated free prose. */
export const hasEncounterNarrativeFindingText = hasNarrativeFindingText;

/** Codes represent explicit picks and are invalidated by external plain-answer edits. */
export function getEncounterNarrativeFindings(
  response?: FieldResponse
): EncounterNarrativeFinding[] {
  return getNarrativeFindings(response, ENCOUNTER_NARRATIVE_ATTRIBUTES);
}

/**
 * The plain-response equivalent of an explicit quick-pick action, also used by
 * MCP. Valid existing rich formatting is retained without needing a DOM.
 */
export function applyEncounterNarrativeFinding(
  response: FieldResponse | undefined,
  finding: EncounterNarrativeFinding
): FieldResponse {
  return applyNarrativeFinding(
    response,
    finding,
    ENCOUNTER_NARRATIVE_ATTRIBUTES
  );
}
