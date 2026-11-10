/**
 * Capture model + runtime helpers shared by the RichMediaCaptureEditor and
 * the ChatComposer Action Ribbon POC story. Extracted from that POC
 * (mieweb/ui#733); pure functions and types only — React pieces live in
 * CaptureRibbon.tsx / useMediaRecording.ts / useFileCaptures.tsx.
 */
import type * as React from 'react';

export type CaptureGroup = 'record' | 'capture';

export interface CaptureAction {
  id: string;
  /** Menu text, ribbon tooltip and accessible name. */
  label: string;
  icon: React.ReactNode;
  run: () => void;
  /** Ribbon section. Default `capture`. */
  group?: CaptureGroup;
  /** Hidden when false (e.g. unsupported on this runtime). Default true. */
  available?: boolean;
  /** Recording in progress — renders red with a stop affordance. */
  active?: boolean;
  /** Short text shown beside the ribbon icon (e.g. elapsed time). */
  badge?: string;
}

/** Native document camera → scanned pages as Files. */
export type ScanDocument = () => Promise<File[]>;

export function formatElapsed(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** File extension for a MediaRecorder MIME type (Safari mp4, Firefox ogg, Chrome webm). */
export function fileExtension(mimeType: string): string {
  const [container] = mimeType.split(';');
  if (container === 'audio/mp4') return 'm4a';
  if (container === 'video/mp4') return 'mp4';
  if (container.endsWith('/ogg')) return 'ogg';
  return 'webm';
}

// ---------------------------------------------------------------------------
// Runtime detection (browser / Cordova / Capacitor)
// ---------------------------------------------------------------------------

type CapacitorDocumentScanner = {
  scanDocument: (opts: {
    responseType: 'base64';
  }) => Promise<{ scannedImages?: string[] }>;
};

type NativeWindow = {
  Capacitor?: {
    isNativePlatform?: () => boolean;
    Plugins?: { DocumentScanner?: CapacitorDocumentScanner };
  };
  cordova?: unknown;
  /** cordova-plugin-document-scanner */
  scan?: {
    scanDoc: (
      onSuccess: (base64: string) => void,
      onError: (err: unknown) => void,
      opts: { sourceType: number; returnBase64: boolean }
    ) => void;
  };
};

export function base64ToFile(b64: string, name: string): File {
  const [, meta = '', data = b64] =
    b64.match(/^data:([^;]+);base64,(.*)$/) ?? [];
  const bytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
  return new File([bytes], name, { type: meta || 'image/jpeg' });
}

/**
 * Adapters for the native document camera (VNDocumentCameraViewController on
 * iOS, ML Kit on Android). Capacitor: `capacitor-document-scanner`.
 * Cordova: `cordova-plugin-document-scanner`. Returns null on the plain web.
 */
export function detectNativeDocumentScanner(): ScanDocument | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as NativeWindow;
  const docName = (i: number) => `document-${Date.now()}-${i + 1}.jpg`;

  const capacitor = w.Capacitor?.isNativePlatform?.()
    ? w.Capacitor.Plugins?.DocumentScanner
    : undefined;
  if (capacitor) {
    return async () => {
      const { scannedImages = [] } = await capacitor.scanDocument({
        responseType: 'base64',
      });
      return scannedImages.map((img, i) => base64ToFile(img, docName(i)));
    };
  }

  const cordovaScan = w.cordova ? w.scan : undefined;
  if (cordovaScan) {
    return () =>
      new Promise((resolve, reject) =>
        cordovaScan.scanDoc(
          (img) => resolve([base64ToFile(img, docName(0))]),
          reject,
          { sourceType: 1, returnBase64: true }
        )
      );
  }
  return null;
}

/** What the current runtime can record/capture (getUserMedia, getDisplayMedia). */
export function detectSupport() {
  const media =
    typeof navigator !== 'undefined' ? navigator.mediaDevices : undefined;
  const hasRecorder = typeof MediaRecorder !== 'undefined';
  return {
    audio: hasRecorder && !!media?.getUserMedia,
    screenRecording: hasRecorder && !!media?.getDisplayMedia,
    screenshot: !!media?.getDisplayMedia,
  };
}

/** One still frame of a user-picked screen/window as a PNG File. */
export async function captureScreenFrame(): Promise<File> {
  const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
  try {
    const video = document.createElement('video');
    video.srcObject = stream;
    video.muted = true;
    await video.play();
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/png')
    );
    if (!blob) throw new Error('Capture failed');
    return new File([blob], `screenshot-${Date.now()}.png`, {
      type: 'image/png',
    });
  } finally {
    stream.getTracks().forEach((t) => t.stop());
  }
}
