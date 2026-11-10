'use client';

/**
 * RichEditor with a docked capture ribbon: Capture image, Capture screen
 * (still), Attach file, Scan document — every capture lands in the document
 * as an image/video node at the cursor, through `RichEditorHandle.insertFiles`
 * and the editor's `mediaUpload` pipeline. Promoted from the ChatComposer
 * Action Ribbon POC (mieweb/ui#733, epic mieweb/ui#728).
 *
 * Working name pending stakeholder sign-off — keep references localized to
 * this directory and the kerebron entry so a rename stays one small PR.
 */
import * as React from 'react';
import {
  RichEditor,
  type RichEditorHandle,
  type RichEditorProps,
} from '../RichEditor';
import { useMessages } from '../../utils/messages';
import { CaptureRibbon } from './CaptureRibbon';
import { useFileCaptures } from './useFileCaptures';
import type { CaptureAction, ScanDocument } from './captureCore';

export interface RichMediaCaptureEditorProps extends RichEditorProps {
  /**
   * Native document camera. Omit to auto-detect a Capacitor/Cordova plugin;
   * pass `null` to disable. Scan document is hidden when none is available.
   */
  scanDocument?: ScanDocument | null;
  /** Additional host captures appended after the built-ins. */
  extraCaptures?: CaptureAction[];
}

/**
 * Captures that cannot land as an image/video node are out of scope here:
 * the markdown schema has no audio node, and dictation into a ProseMirror
 * document is a different model (see mieweb/ui#728 for both).
 */
export const RichMediaCaptureEditor = React.forwardRef<
  RichEditorHandle,
  RichMediaCaptureEditorProps
>(function RichMediaCaptureEditor(
  { scanDocument, extraCaptures = [], ...editorProps },
  ref
) {
  const m = useMessages();
  const editorRef = React.useRef<RichEditorHandle>(null);
  const [status, setStatus] = React.useState('');
  // A locked editor must not accept captures: insertFiles dispatches straight
  // into the document, bypassing ProseMirror's `editable` flag. Hiding the
  // ribbon prevents starting one; the guard in `insert` drops any capture
  // that finishes after the editor locks mid-flight.
  const locked = Boolean(editorProps.disabled || editorProps.readOnly);
  const lockedRef = React.useRef(locked);
  lockedRef.current = locked;

  React.useImperativeHandle(
    ref,
    () => ({
      getContent: () => editorRef.current!.getContent(),
      focus: () => editorRef.current?.focus(),
      insertFiles: (files: File[]) => editorRef.current!.insertFiles!(files),
    }),
    []
  );

  const insert = async (files: File[], message: string) => {
    if (!files.length || lockedRef.current) return;
    const result = await editorRef.current?.insertFiles?.(files);
    if (!result) return;
    setStatus(
      result.skipped.length
        ? m('{count} file(s) could not be attached', {
            count: result.skipped.length,
          })
        : message
    );
  };

  const { captures, inputs } = useFileCaptures({
    onFiles: (files, message) => {
      void insert(files, message).catch(() =>
        setStatus(m('Attachment failed'))
      );
    },
    onStatus: setStatus,
    scanDocument,
  });

  const visible = [...captures, ...extraCaptures].filter(
    (c) => c.available !== false
  );

  return (
    <div>
      {!locked && <CaptureRibbon captures={visible} />}
      <RichEditor ref={editorRef} {...editorProps} />
      {inputs}
      <p
        role="status"
        aria-live="polite"
        className="mt-2 text-xs text-neutral-500 dark:text-neutral-400"
      >
        {status}
      </p>
    </div>
  );
});
