'use client';

/**
 * Opt-in media capture for RichTextEsheet's RichEdit mode (mieweb/ui#758),
 * generalized from EncounterVisit's opt-in (mieweb/ui#736) — EncounterVisit's
 * `useEncounterMediaCapture` now delegates here with its clinical PHI wording.
 *
 * `uploadHandler` is mandatory by type: documents must carry uploaded URLs,
 * never embedded base64 bytes — the relaxed narrative sanitizer strips
 * `data:` images, so a capture without a handler would be destroyed on save.
 */
import * as React from 'react';
import type { MediaUploadOptions } from '../RichEditor';
import type { MediaCaptureOptions } from '../RichMediaCaptureEditor';
import { AlertDialog } from '../AlertDialog';
import { useMessages } from '../../utils/messages';

export interface DocumentMediaCaptureOptions extends MediaCaptureOptions {
  /**
   * Uploads each captured/pasted file and returns the URL to reference in
   * the document. Mandatory: without it captures would embed as base64
   * `data:` URLs, which the narrative sanitizer strips on save.
   */
  uploadHandler: (file: File) => Promise<string>;
  /** Further upload tuning (size limits, allowed MIME types). */
  mediaUpload?: Omit<MediaUploadOptions, 'uploadHandler'>;
}

/** What the document's editing surfaces consume, ready to pass through. */
export interface DocumentMediaCapture {
  mediaUpload: MediaUploadOptions;
  capture: MediaCaptureOptions;
}

/**
 * Builds the surface-ready capture config from the host's options, wiring a
 * screen-capture confirmation in front of every capture surface. Returns the
 * dialog element for the caller to render — a shared screen can show content
 * that does not belong in the document, so the notice is not optional; a
 * host-supplied `confirmScreenCapture` runs instead only because it is then
 * the host's notice to show.
 */
export function useDocumentMediaCapture(
  options: DocumentMediaCaptureOptions | undefined,
  confirmDescription = 'Screen captures can include sensitive information from other windows. Before continuing, make sure the screen you share shows only what belongs in this document.'
): { value: DocumentMediaCapture | null; dialog: React.ReactNode } {
  const m = useMessages();
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const resolveRef = React.useRef<((confirmed: boolean) => void) | null>(null);

  const settle = React.useCallback((confirmed: boolean) => {
    resolveRef.current?.(confirmed);
    resolveRef.current = null;
    setConfirmOpen(false);
  }, []);
  // Never leave a caller awaiting a dialog that no longer exists.
  React.useEffect(() => () => resolveRef.current?.(false), []);

  const confirmCapture = React.useCallback(() => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current?.(false);
      resolveRef.current = resolve;
      setConfirmOpen(true);
    });
  }, []);

  const value = React.useMemo<DocumentMediaCapture | null>(() => {
    // The type makes uploadHandler mandatory, but an untyped host can still
    // omit it — RichEdit would then embed captures as base64 data: URLs.
    // Refuse the opt-in at runtime, as the narrative fields do.
    if (typeof options?.uploadHandler !== 'function') return null;
    return {
      mediaUpload: {
        ...options.mediaUpload,
        uploadHandler: options.uploadHandler,
      },
      capture: {
        scanDocument: options.scanDocument,
        extraCaptures: options.extraCaptures,
        confirmScreenCapture: options.confirmScreenCapture ?? confirmCapture,
      },
    };
  }, [options, confirmCapture]);

  const dialog = value ? (
    <AlertDialog
      open={confirmOpen}
      onOpenChange={(open) => {
        if (!open) settle(false);
      }}
      variant="warning"
      title={m('Capture this screen?')}
      description={m(confirmDescription)}
      actionLabel={m('Capture screen')}
      cancelLabel={m('Cancel')}
      onAction={() => settle(true)}
      onCancel={() => settle(false)}
    />
  ) : null;

  return { value, dialog };
}
