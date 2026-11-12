'use client';

import { forwardRef } from 'react';
import {
  DocumentMdyEditor,
  type DocumentMdyEditorHandle,
  type DocumentMdyEditorProps,
} from '../RichTextEsheet/DocumentMdyEditor';

export type EncounterMdyEditorProps = Omit<DocumentMdyEditorProps, 'label'>;

export type EncounterMdyEditorHandle = DocumentMdyEditorHandle;

/** The shared MDY document editor with the encounter's wording (mieweb/ui#758). */
export const EncounterMdyEditor = forwardRef<
  EncounterMdyEditorHandle,
  EncounterMdyEditorProps
>(function EncounterMdyEditor(props, ref) {
  return <DocumentMdyEditor ref={ref} {...props} label="Encounter narrative" />;
});
