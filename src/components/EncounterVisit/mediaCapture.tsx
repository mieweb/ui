'use client';

/**
 * Opt-in media capture for EncounterVisit (mieweb/ui#736, epic mieweb/ui#728).
 *
 * Narrative fields are registered globally with eSheet, so EncounterVisit
 * cannot hand them props — the configured capture options travel through
 * {@link EncounterMediaCaptureContext} instead. The RichEdit surface gets the
 * same options as plain props (see EncounterMdyEditor).
 *
 * `uploadHandler` is mandatory by type: narratives must carry uploaded URLs,
 * never embedded base64 bytes — the relaxed narrative sanitizer strips
 * `data:` images, so a capture without a handler would be destroyed on save.
 */
import * as React from 'react';
import type { MediaUploadOptions } from '../RichEditor';
import type { MediaCaptureOptions } from '../RichMediaCaptureEditor';
import { AlertDialog } from '../AlertDialog';
import { useEncounterMessages } from './messages';

export interface EncounterMediaCaptureOptions extends MediaCaptureOptions {
  /**
   * Uploads each captured/pasted file and returns the URL to reference in
   * the narrative. Mandatory: without it captures would embed as base64
   * `data:` URLs, which clinical narratives must never carry.
   */
  uploadHandler: (file: File) => Promise<string>;
  /** Further upload tuning (size limits, allowed MIME types). */
  mediaUpload?: Omit<MediaUploadOptions, 'uploadHandler'>;
}

/** What the visit's editing surfaces consume, ready to pass through. */
export interface EncounterMediaCapture {
  mediaUpload: MediaUploadOptions;
  capture: MediaCaptureOptions;
}

export const EncounterMediaCaptureContext =
  React.createContext<EncounterMediaCapture | null>(null);

/**
 * Builds the surface-ready capture config from the host's options, wiring the
 * screen-capture PHI confirmation in front of every capture surface. Returns
 * the dialog element for the caller to render — a shared screen can show
 * other patients' data, so the notice is not optional; a host-supplied
 * `confirmScreenCapture` runs instead only because it is then the host's
 * notice to show.
 */
export function useEncounterMediaCapture(
  options: EncounterMediaCaptureOptions | undefined
): { value: EncounterMediaCapture | null; dialog: React.ReactNode } {
  const m = useEncounterMessages();
  const [phiOpen, setPhiOpen] = React.useState(false);
  const resolveRef = React.useRef<((confirmed: boolean) => void) | null>(null);

  const settle = React.useCallback((confirmed: boolean) => {
    resolveRef.current?.(confirmed);
    resolveRef.current = null;
    setPhiOpen(false);
  }, []);
  // Never leave a caller awaiting a dialog that no longer exists.
  React.useEffect(() => () => resolveRef.current?.(false), []);

  const confirmPhi = React.useCallback(() => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current?.(false);
      resolveRef.current = resolve;
      setPhiOpen(true);
    });
  }, []);

  const value = React.useMemo<EncounterMediaCapture | null>(() => {
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
        confirmScreenCapture: options.confirmScreenCapture ?? confirmPhi,
      },
    };
  }, [options, confirmPhi]);

  const dialog = value ? (
    <AlertDialog
      open={phiOpen}
      onOpenChange={(open) => {
        if (!open) settle(false);
      }}
      variant="warning"
      title={m('Capture this screen?')}
      description={m(
        'Screen captures can include other patients’ information. Before continuing, make sure the screen you share shows only this patient’s data.'
      )}
      actionLabel={m('Capture screen')}
      cancelLabel={m('Cancel')}
      onAction={() => settle(true)}
      onCancel={() => settle(false)}
    />
  ) : null;

  return { value, dialog };
}
