'use client';

/**
 * The four standard file captures — Capture image, Capture screen (still),
 * Attach file, Scan document — plus the hidden file inputs they drive.
 * Shared by RichMediaCaptureEditor and the ChatComposer Action Ribbon POC
 * story (mieweb/ui#733). Record audio/screen stay with the caller: they need
 * the recording hook and a destination that accepts audio/video clips.
 */
import * as React from 'react';
import { Camera, File as FileGlyph, MonitorUp, ScanText } from 'lucide-react';
import { useMessages } from '../../utils/messages';
import {
  captureScreenFrame,
  detectNativeDocumentScanner,
  detectSupport,
  type CaptureAction,
  type ScanDocument,
} from './captureCore';

const iconClass = 'h-4 w-4';

export interface FileCapturesOptions {
  /**
   * Receives each capture's files with a ready-to-announce status message
   * ("Attached", "Screenshot attached", "Scanned 2 page(s)").
   */
  onFiles: (files: File[], message: string) => void;
  /** Failure/cancellation announcements ("Screen capture cancelled", …). */
  onStatus: (message: string) => void;
  /**
   * Native document camera. Omit to auto-detect a Capacitor/Cordova plugin;
   * pass `null` to disable. Scan document is hidden when none is available.
   */
  scanDocument?: ScanDocument | null;
}

export function useFileCaptures({
  onFiles,
  onStatus,
  scanDocument,
}: FileCapturesOptions): {
  /** Unavailable entries keep `available: false`; filter before rendering. */
  captures: CaptureAction[];
  /** Hidden `<input type="file">` elements — render them once, anywhere. */
  inputs: React.ReactNode;
} {
  const m = useMessages();
  const imageInputRef = React.useRef<HTMLInputElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  // Capabilities are detected after hydration: reading `navigator` in the
  // initial render would make server and client markup disagree (the server
  // sees no getDisplayMedia, a desktop browser does).
  const [support, setSupport] = React.useState<
    ReturnType<typeof detectSupport>
  >({ audio: false, screenRecording: false, screenshot: false });
  const [documentScanner, setDocumentScanner] =
    React.useState<ScanDocument | null>(null);
  React.useEffect(() => {
    setSupport(detectSupport());
  }, []);
  React.useEffect(() => {
    setDocumentScanner(() =>
      scanDocument === undefined ? detectNativeDocumentScanner() : scanDocument
    );
  }, [scanDocument]);

  const runSafely = (task: () => Promise<void>, failure: string) => () => {
    task().catch(() => onStatus(failure));
  };

  const stageFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length) onFiles(files, m('Attached'));
    e.target.value = '';
  };

  const captures: CaptureAction[] = [
    {
      id: 'image',
      label: m('Capture image'),
      icon: <Camera className={iconClass} aria-hidden="true" />,
      run: () => imageInputRef.current?.click(),
    },
    {
      id: 'screenshot',
      label: m('Capture screen'),
      icon: <MonitorUp className={iconClass} aria-hidden="true" />,
      run: runSafely(async () => {
        onFiles([await captureScreenFrame()], m('Screenshot attached'));
      }, m('Screen capture cancelled')),
      available: support.screenshot,
    },
    {
      id: 'file',
      label: m('Attach file'),
      icon: <FileGlyph className={iconClass} aria-hidden="true" />,
      run: () => fileInputRef.current?.click(),
    },
    {
      id: 'document',
      label: m('Scan document'),
      icon: <ScanText className={iconClass} aria-hidden="true" />,
      run: runSafely(async () => {
        const pages = (await documentScanner?.()) ?? [];
        onFiles(pages, m('Scanned {count} page(s)', { count: pages.length }));
      }, m('Document scan cancelled')),
      available: documentScanner != null,
    },
  ];

  const inputs = (
    <>
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={stageFiles}
      />
      <input
        ref={fileInputRef}
        type="file"
        multiple
        hidden
        onChange={stageFiles}
      />
    </>
  );

  return { captures, inputs };
}
