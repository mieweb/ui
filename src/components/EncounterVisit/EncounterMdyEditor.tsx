'use client';

import { forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import type { CoreEditor } from '@kerebron/editor';
import { RichEditor, type RichEditorHandle } from '../RichEditor/RichEditor';
import {
  createMdyEditorKit,
  refreshMdyFieldProjections,
  type MdyFieldProjection,
} from '../RichEditor/mdyEditorKit';

export interface EncounterMdyEditorProps {
  /** MDY body only. The host retains and updates the YAML data separately. */
  body: string;
  fields?: MdyFieldProjection[];
  fieldIds?: string[];
  onChange: (body: string) => void;
  onFieldActivate: (id: string) => void;
  disabled?: boolean;
}

export type EncounterMdyEditorHandle = RichEditorHandle;

/** Free prose and headings, with form-backed MDY spans protected from typing. */
export const EncounterMdyEditor = forwardRef<
  EncounterMdyEditorHandle,
  EncounterMdyEditorProps
>(function EncounterMdyEditor(
  { body, fields = [], fieldIds, onChange, onFieldActivate, disabled = false },
  ref
) {
  // The kit mounts once, while the canonical data index and activation target
  // may change as the user switches the form or updates its responses.
  const live = useRef({
    fieldIds: new Set(fieldIds),
    onFieldActivate,
    disabled,
  });
  live.current = {
    fieldIds: new Set(fieldIds ?? fields.map((field) => field.id)),
    onFieldActivate,
    disabled,
  };
  const [editor, setEditor] = useState<CoreEditor | null>(null);
  const fieldsRef = useRef(fields);
  fieldsRef.current = fields;
  const [loadFailed, setLoadFailed] = useState(false);
  const editorKits = useMemo(
    () => [
      createMdyEditorKit({
        getFieldIds: () => live.current.fieldIds,
        getFieldLabel: (id) =>
          fieldsRef.current.find((field) => field.id === id)?.label,
        onFieldActivate: (id) => live.current.onFieldActivate(id),
        isDisabled: () => live.current.disabled,
      }),
    ],
    []
  );
  useEffect(() => {
    if (!editor) return;
    const refresh = () => refreshMdyFieldProjections(editor, fieldsRef.current);
    const loaded = () => refresh();
    editor.addEventListener('doc:loaded', loaded);
    refresh();
    return () => editor.removeEventListener('doc:loaded', loaded);
  }, [editor, fields]);

  return (
    <>
      {loadFailed && (
        <p role="alert">
          The narrative editor could not load. Your original document is
          preserved.
        </p>
      )}
      <RichEditor
        ref={ref}
        value={body}
        onChange={onChange}
        onError={() => setLoadFailed(true)}
        onReady={setEditor}
        disabled={disabled || loadFailed}
        aria-label="Encounter narrative"
        editorKits={editorKits}
        className="encounter-mdy-editor"
      />
    </>
  );
});

EncounterMdyEditor.displayName = 'EncounterMdyEditor';
