'use client';

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { CoreEditor } from '@kerebron/editor';
import { RichEditor, type RichEditorHandle } from '../RichEditor/RichEditor';
import { useEncounterMessages } from './messages';
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
  const m = useEncounterMessages();
  const [editor, setEditor] = useState<CoreEditor | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const richEditor = useRef<RichEditorHandle>(null);
  const status = useRef({ editor, loadFailed, body });
  status.current = { editor, loadFailed, body };
  // The kit mounts once, while the canonical data index and activation target
  // may change as the user switches the form or updates its responses.
  const live = useRef({
    fieldIds: new Set(fieldIds),
    onFieldActivate,
    disabled: disabled || loadFailed || editor === null,
  });
  live.current = {
    fieldIds: new Set(fieldIds ?? fields.map((field) => field.id)),
    onFieldActivate,
    disabled: disabled || loadFailed || editor === null,
  };
  const fieldsRef = useRef(fields);
  fieldsRef.current = fields;
  useImperativeHandle(
    ref,
    () => ({
      getContent: async () => {
        // Until setup succeeds, editing is disabled and the host's exact body
        // is the only draft. An initial grammar/document-load failure can
        // therefore leave RichEdit without trying to serialize a failed load.
        // Once ready, retain read failures so unpublished prose is never lost.
        if (status.current.loadFailed && !status.current.editor)
          return status.current.body;
        return richEditor.current
          ? richEditor.current.getContent()
          : status.current.body;
      },
      focus: () => {
        if (!status.current.loadFailed) richEditor.current?.focus();
      },
    }),
    []
  );
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
          {m(
            'The narrative editor could not load. Your original document is preserved.'
          )}
        </p>
      )}
      <RichEditor
        ref={richEditor}
        value={body}
        onChange={onChange}
        onError={() => {
          status.current.loadFailed = true;
          setLoadFailed(true);
        }}
        onReady={(next) => {
          status.current.editor = next;
          setEditor(next);
        }}
        disabled={disabled || loadFailed || editor === null}
        aria-label={m('Encounter narrative')}
        editorKits={editorKits}
        className="encounter-mdy-editor"
      />
    </>
  );
});

EncounterMdyEditor.displayName = 'EncounterMdyEditor';
