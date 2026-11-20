'use client';

/**
 * The capture ribbon docked onto an editor surface: renders the ribbon above
 * `children`, the hidden file inputs, and the status line, and funnels every
 * capture through the host's `insertFiles`. Extracted from
 * RichMediaCaptureEditor so TextAreaRichKerebron's `mediaCapture` opt-in
 * shares the exact behavior (mieweb/ui#734, epic mieweb/ui#728).
 */
import * as React from 'react';
import { createPortal } from 'react-dom';
import { Pencil } from 'lucide-react';
import type { InsertFilesResult } from '../RichEditor';
import { Tooltip } from '../Tooltip';
import { cn } from '../../utils/cn';
import { useMessages } from '../../utils/messages';
import { CaptureRibbon } from './CaptureRibbon';
import { useFileCaptures } from './useFileCaptures';
import { useAnnotateTarget } from './useAnnotateTarget';
import { AnnotateImageDialog } from './AnnotateImageDialog';
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
  /**
   * Called before a screen capture starts; resolve `false` to cancel. Lets
   * clinical hosts interpose a PHI notice — a shared screen can show other
   * patients' data — before the browser's picker opens (mieweb/ui#736).
   */
  confirmScreenCapture?: () => boolean | Promise<boolean>;
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
  /**
   * The surface's `RichEditorHandle.replaceImage`. When provided, document
   * images grow an annotate affordance on hover/selection that opens
   * {@link AnnotateImageDialog} and swaps in the flattened PNG
   * (mieweb/ui#735). Omit to keep the dock insert-only.
   */
  replaceImage?: (
    src: string,
    file: File,
    occurrence?: number
  ) => Promise<boolean> | undefined;
  /**
   * A *positioned* element inside the editor's own hover scope to mount the
   * annotate button into. Hosts whose layout reacts to :hover (e.g.
   * TextAreaRichKerebron's sliding block gutter) must pass this — as a DOM
   * sibling the button would un-hover the editor the moment the pointer
   * reaches it, collapsing the layout underneath the click. Defaults to the
   * dock's own wrapper.
   */
  annotateAnchorRef?: React.RefObject<HTMLElement | null>;
  /** The editor surface the ribbon docks onto. */
  children: React.ReactNode;
}

export function CaptureDock({
  locked = false,
  insertFiles,
  replaceImage,
  annotateAnchorRef,
  scanDocument,
  extraCaptures = [],
  confirmScreenCapture,
  children,
}: CaptureDockProps) {
  const m = useMessages();
  const [status, setStatus] = React.useState('');
  const lockedRef = React.useRef(locked);
  lockedRef.current = locked;

  const surfaceRef = React.useRef<HTMLDivElement>(null);
  const annotateEnabled = Boolean(replaceImage) && !locked;
  const target = useAnnotateTarget(surfaceRef, annotateEnabled);
  const [annotate, setAnnotate] = React.useState<{
    src: string;
    occurrence: number;
  } | null>(null);
  const [overlay, setOverlay] = React.useState<{
    mount: HTMLElement;
    top: number;
    left: number;
  } | null>(null);

  // Anchor the affordance to the image's top-right corner. Placement repeats
  // over a short settle window — hosts animate layout under the pointer
  // (TextAreaRichKerebron's sliding gutter) — then freezes: continuously
  // tracking a hover-driven transition would oscillate when the pointer
  // rests on the button.
  React.useLayoutEffect(() => {
    const mount = annotateAnchorRef?.current ?? surfaceRef.current;
    if (!target || !mount) {
      setOverlay(null);
      return;
    }
    const place = () => {
      if (!target.isConnected) {
        setOverlay(null);
        return;
      }
      const imgRect = target.getBoundingClientRect();
      const mountRect = mount.getBoundingClientRect();
      setOverlay({
        mount,
        top: imgRect.top - mountRect.top + 4,
        left: imgRect.right - mountRect.left - 32,
      });
    };
    place();
    const started = performance.now();
    let raf = requestAnimationFrame(function settle(now) {
      place();
      if (now - started < 350) raf = requestAnimationFrame(settle);
    });
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [target, annotateAnchorRef]);

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
    confirmScreenCapture,
  });

  const visible = [...captures, ...extraCaptures].filter(
    (c) => c.available !== false
  );

  return (
    <div>
      {!locked && <CaptureRibbon captures={visible} />}
      <div ref={surfaceRef} className="relative">
        {children}
        {annotateEnabled &&
          target &&
          overlay &&
          createPortal(
            // The positioned wrapper sits outside the Tooltip: its trigger
            // wrapper is itself `relative`, which would swallow the button's
            // absolute coordinates.
            <span
              className="absolute z-10"
              // rtl-ignore -- physical px computed from getBoundingClientRect
              style={{ top: overlay.top, left: overlay.left }}
            >
              <Tooltip content={m('Annotate image')} placement="top">
                <button
                  type="button"
                  data-slot="annotate-image-button"
                  aria-label={m('Annotate image')}
                  onClick={() => {
                    // The *raw* attribute, not `target.src`: the DOM property
                    // resolves relative upload URLs to absolute ones, which
                    // would never match the document node's stored attrs.src.
                    const src = target.getAttribute('src');
                    if (!src) return;
                    // Same-src duplicates (the same file attached twice gets
                    // identical data URLs) are told apart by document order.
                    const twins = Array.from(
                      surfaceRef.current?.querySelectorAll('img') ?? []
                    ).filter((i) => i.getAttribute('src') === src);
                    setAnnotate({
                      src,
                      occurrence: Math.max(0, twins.indexOf(target)),
                    });
                  }}
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-lg border shadow-sm',
                    'border-neutral-200 bg-white/90 text-neutral-700 hover:bg-white',
                    'dark:border-neutral-600 dark:bg-neutral-800/90 dark:text-neutral-200 dark:hover:bg-neutral-800',
                    'focus-visible:ring-primary-500 focus-visible:ring-2 focus-visible:outline-none'
                  )}
                >
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                </button>
              </Tooltip>
            </span>,
            overlay.mount
          )}
      </div>
      {inputs}
      {replaceImage && (
        <AnnotateImageDialog
          src={annotate?.src ?? null}
          onSave={async (file) => {
            // The host may have locked while the dialog was open; a locked
            // editor must not accept the swap. (A lock landing *during* the
            // replace upload is the same mid-flight race as captures —
            // tracked with mieweb/ui#743.)
            if (lockedRef.current) throw new Error('locked');
            const { src, occurrence } = annotate!;
            const ok = await replaceImage(src, file, occurrence);
            // `false` means validation/upload failed or the image left the
            // document mid-edit — keep the dialog open with its error.
            if (!ok) throw new Error('replace failed');
            setStatus(m('Image annotated'));
          }}
          onClose={() => setAnnotate(null)}
        />
      )}
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
