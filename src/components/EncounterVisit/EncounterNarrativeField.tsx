import * as React from 'react';
import type { FieldComponentProps } from '@esheet/core';
import {
  EsheetNarrativeField,
  narrativeText,
  sanitizeNarrativeHtml,
} from '../../esheet-fields/EsheetNarrativeField';
import { ENCOUNTER_NARRATIVE_ATTRIBUTES } from './narrativeFindings';

/**
 * Keep visit formatting small: no links, media, styles, or imported document
 * chrome. Every block format the editor's block menu and markdown shortcuts
 * offer (headings 1–3, quote, lists) is allowed, so published formatting
 * survives reopening the field.
 */
export const sanitizeEncounterNarrativeHtml = sanitizeNarrativeHtml;

/** Extract readable narrative text without flattening paragraphs or list items together. */
export const encounterNarrativeText = narrativeText;

/**
 * The generic EsheetNarrativeField configured for encounter visits: the
 * published `encounterNarrative*` response attributes, findings sourced from
 * the section definition's `encounterFindings`, and the encounter CSS slot.
 */
export function EncounterNarrativeField(
  props: FieldComponentProps
): React.JSX.Element {
  return (
    <EsheetNarrativeField
      {...props}
      attributes={ENCOUNTER_NARRATIVE_ATTRIBUTES}
      findingsKey="encounterFindings"
      hideLabelKey="encounterHideLabel"
      slot="encounter-narrative"
    />
  );
}
