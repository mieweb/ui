'use client';

/**
 * Opt-in media capture for EncounterVisit (mieweb/ui#736, epic mieweb/ui#728),
 * delegating to RichTextEsheet's shared document capture hook (mieweb/ui#758)
 * with the clinical PHI wording.
 *
 * Narrative fields are registered globally with eSheet, so EncounterVisit
 * cannot hand them props — the configured capture options travel through
 * {@link EncounterMediaCaptureContext} instead. The RichEdit surface gets the
 * same options as plain props (see EncounterMdyEditor).
 */
import * as React from 'react';
import {
  useDocumentMediaCapture,
  type DocumentMediaCapture,
  type DocumentMediaCaptureOptions,
} from '../RichTextEsheet/mediaCapture';

export type EncounterMediaCaptureOptions = DocumentMediaCaptureOptions;

/** What the visit's editing surfaces consume, ready to pass through. */
export type EncounterMediaCapture = DocumentMediaCapture;

export const EncounterMediaCaptureContext =
  React.createContext<EncounterMediaCapture | null>(null);

/**
 * Builds the surface-ready capture config from the host's options, wiring the
 * screen-capture PHI confirmation in front of every capture surface — a
 * shared screen can show other patients' data, so the notice is not optional.
 */
export function useEncounterMediaCapture(
  options: EncounterMediaCaptureOptions | undefined
): { value: EncounterMediaCapture | null; dialog: React.ReactNode } {
  return useDocumentMediaCapture(
    options,
    'Screen captures can include other patients’ information. Before continuing, make sure the screen you share shows only this patient’s data.'
  );
}
