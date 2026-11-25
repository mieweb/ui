import * as React from 'react';
import type { FieldComponentProps } from '@esheet/core';
import {
  EsheetNarrativeField,
  narrativeText,
  sanitizeNarrativeHtml,
} from '../../esheet-fields/EsheetNarrativeField';
import { ENCOUNTER_NARRATIVE_ATTRIBUTES } from './narrativeFindings';
import { EncounterMediaCaptureContext } from './mediaCapture';

/**
 * An XSS barrier, not a formatting policy: everything the standard editor
 * toolbar emits (marks, links, headings, lists, tables, alignment, highlight)
 * survives the publish round trip byte-for-byte, while scripts, event
 * handlers, unsafe URLs, host classes and imported document chrome are
 * stripped. Media stays out unless the host opts in.
 */
export const sanitizeEncounterNarrativeHtml = sanitizeNarrativeHtml;

/** Extract readable narrative text without flattening paragraphs or list items together. */
export const encounterNarrativeText = narrativeText;

/**
 * The generic EsheetNarrativeField configured for encounter visits: the
 * published `encounterNarrative*` response attributes, findings sourced from
 * the section definition's `encounterFindings`, and the encounter CSS slot.
 * Media capture arrives through {@link EncounterMediaCaptureContext} — the
 * field is registered globally with eSheet, so EncounterVisit cannot hand it
 * props (mieweb/ui#736).
 */
export function EncounterNarrativeField(
  props: FieldComponentProps
): React.JSX.Element {
  const media = React.useContext(EncounterMediaCaptureContext);
  return (
    <EsheetNarrativeField
      {...props}
      attributes={ENCOUNTER_NARRATIVE_ATTRIBUTES}
      findingsKey="encounterFindings"
      hideLabelKey="encounterHideLabel"
      slot="encounter-narrative"
      mediaCapture={media?.capture}
      mediaUpload={media?.mediaUpload}
    />
  );
}
