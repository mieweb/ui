'use client';

/**
 * The capture ribbon docked onto an editor surface: renders the ribbon above
 * `children`, the hidden file inputs, and the status line, and funnels every
 * capture through the host's `insertFiles`. Extracted from
 * RichMediaCaptureEditor so TextAreaRichKerebron's `mediaCapture` opt-in
 * shares the exact behavior (mieweb/ui#734, epic mieweb/ui#728).
 */
import * as React from 'react';
import type { InsertFilesResult } from '../RichEditor';
import { useMessages } from '../../utils/messages';
import { CaptureRibbon } from './CaptureRibbon';
import { useFileCaptures } from './useFileCaptures';
import type { CaptureAction, ScanDocument } from './captureCore';

/** Capture configuration shared by every surface that docks the ribbon. */
export interface MediaCaptureOptions {
  /**
   * Native document camera. Omit to auto-detect a Capacitor/Cordova plugin;
   * pass `null` to disable. Scan document is hidden when none is available.
   */
  scanDocument?: ScanDocument | null;
  /** Additional host captures appended after the built-ins. */
  extraCaptures?: CaptureAction[];
}

export interface CaptureDockProps extends MediaCaptureOptions {
  /**
   * A locked editor must not accept captures: insertFiles dispatches straight
   * into the document, bypassing ProseMirror's `editable` flag. Hiding the
   * ribbon prevents starting one; the guard in `insert` drops any capture
   * that finishes after the editor locks mid-flight.
   */
  locked?: boolean;
  /**
   * The surface's `RichEditorHandle.insertFiles`. May return `undefined`
   * while the editor is still mounting — the capture is dropped silently.
   */
  insertFiles: (files: File[]) => Promise<InsertFilesResult> | undefined;
  /** The editor surface the ribbon docks onto. */
  children: React.ReactNode;
}

export function CaptureDock({
  locked = false,
  insertFiles,
  scanDocument,
  extraCaptures = [],
  children,
}: CaptureDockProps) {
  const m = useMessages();
  const [status, setStatus] = React.useState('');
  const lockedRef = React.useRef(locked);
  lockedRef.current = locked;

  const insert = async (files: File[], message: string) => {
    if (!files.length || lockedRef.current) return;
    const result = await insertFiles(files);
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
      {children}
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
}
