/**
 * POC (quick & dirty): every capture source in one `+` menu on ChatComposer
 * (full labels), with a "Dock as caption ribbon" toggle that pins them as
 * icon-only buttons with tooltips, grouped:
 * `Record: [Audio] [Screen]  Capture: [Image] [Screen] [File] [Document] …`
 * attached to the top edge of the input.
 *
 * Captures are a list; each declares `available`, so the ribbon/menu only
 * shows what works on the current runtime (browser, Cordova, Capacitor):
 * - Record/Capture Screen need getDisplayMedia — absent in iOS/Android
 *   WebViews.
 * - Document is the native iOS/Android document camera, only when a
 *   Capacitor or Cordova document-scanner plugin is present (or the host
 *   passes `scanDocument`).
 * - Hosts append more via `extraCaptures`.
 *
 * Voice to text (live speech → input) is NOT a capture: it lives only on the
 * mic to the right of the input. Built on ChatComposer's public API
 * (addMenuItems, micSlot, ref.addFiles) — no library changes.
 */
import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  AudioLines,
  Camera,
  File as FileGlyph,
  Mic,
  MonitorPlay,
  MonitorUp,
  Pin,
  PinOff,
  ScanBarcode,
  ScanText,
  Square,
} from 'lucide-react';
import {
  ChatComposer,
  type ChatComposerHandle,
  type ChatComposerMenuItem,
} from './ChatComposer';
import { Tooltip } from '../Tooltip';
import { cn } from '../../utils/cn';

// ---------------------------------------------------------------------------
// Capture model
// ---------------------------------------------------------------------------

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

const groupLabels: Record<CaptureGroup, string> = {
  record: 'Record:',
  capture: 'Capture:',
};

/** Native document camera → scanned pages as Files. */
export type ScanDocument = () => Promise<File[]>;

const iconClass = 'h-4 w-4';

function formatElapsed(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
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

function base64ToFile(b64: string, name: string): File {
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
function detectNativeDocumentScanner(): ScanDocument | null {
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

function detectSupport() {
  const media =
    typeof navigator !== 'undefined' ? navigator.mediaDevices : undefined;
  const hasRecorder = typeof MediaRecorder !== 'undefined';
  return {
    audio: hasRecorder && !!media?.getUserMedia,
    screenRecording: hasRecorder && !!media?.getDisplayMedia,
    screenshot: !!media?.getDisplayMedia,
  };
}

async function captureScreenFrame(): Promise<File> {
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

// ---------------------------------------------------------------------------
// Shared recorder for Record audio + Record screen
// ---------------------------------------------------------------------------

function useMediaRecording({
  kind,
  getStream,
  onFile,
}: {
  kind: 'audio' | 'video';
  getStream: () => Promise<MediaStream>;
  onFile: (file: File) => void;
}) {
  const recorderRef = React.useRef<MediaRecorder | null>(null);
  const [startedAt, setStartedAt] = React.useState<number | null>(null);
  const [now, setNow] = React.useState(0);

  React.useEffect(() => {
    if (startedAt == null) return;
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [startedAt]);

  React.useEffect(
    () => () => {
      if (recorderRef.current?.state === 'recording')
        recorderRef.current.stop();
    },
    []
  );

  const toggle = async () => {
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.stop();
      return;
    }
    const stream = await getStream();
    const recorder = new MediaRecorder(stream);
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data);
    };
    recorder.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      const type = recorder.mimeType || `${kind}/webm`;
      const ext = type.includes('mp4')
        ? kind === 'audio'
          ? 'm4a'
          : 'mp4'
        : 'webm';
      const prefix = kind === 'audio' ? 'audio' : 'screen-recording';
      onFile(new File(chunks, `${prefix}-${Date.now()}.${ext}`, { type }));
      recorderRef.current = null;
      setStartedAt(null);
    };
    // The user can end a screen share from the browser's own UI.
    stream.getVideoTracks()[0]?.addEventListener('ended', () => {
      if (recorder.state === 'recording') recorder.stop();
    });
    recorder.start();
    recorderRef.current = recorder;
    setStartedAt(Date.now());
    setNow(Date.now());
  };

  return {
    recording: startedAt != null,
    elapsed: startedAt != null ? formatElapsed(now - startedAt) : '',
    toggle,
  };
}

// ---------------------------------------------------------------------------
// Live voice to text (mic right of the input — not a capture)
// ---------------------------------------------------------------------------

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  onresult:
    | ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void)
    | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function getSpeechRecognition(): (new () => SpeechRecognitionLike) | null {
  const w = window as unknown as Record<string, unknown>;
  return (
    ((w.SpeechRecognition ?? w.webkitSpeechRecognition) as
      | (new () => SpeechRecognitionLike)
      | undefined) ?? null
  );
}

// ---------------------------------------------------------------------------
// Ribbon
// ---------------------------------------------------------------------------

function CaptureRibbon({
  captures,
  onUndock,
}: {
  captures: CaptureAction[];
  onUndock: () => void;
}) {
  return (
    <div
      role="toolbar"
      aria-label="Record and capture"
      data-slot="chat-composer-capture-ribbon"
      className={cn(
        'mx-4 -mb-px flex items-center gap-1 overflow-x-auto rounded-t-xl border border-b-0 px-1.5 py-1',
        'border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800'
      )}
    >
      {(Object.keys(groupLabels) as CaptureGroup[]).map((group, index) => {
        const items = captures.filter((c) => (c.group ?? 'capture') === group);
        if (!items.length) return null;
        return (
          <div
            key={group}
            role="group"
            aria-label={groupLabels[group].replace(':', '')}
            className={cn(
              'flex shrink-0 items-center gap-0.5',
              index > 0 &&
                'ms-1 border-s border-neutral-200 ps-2 dark:border-neutral-700'
            )}
          >
            <span
              aria-hidden="true"
              className="pe-1 text-xs font-semibold text-neutral-500 dark:text-neutral-400"
            >
              {groupLabels[group]}
            </span>
            {items.map((c) => (
              <Tooltip key={c.id} content={c.label} placement="top">
                <button
                  type="button"
                  onClick={c.run}
                  aria-label={c.label}
                  aria-pressed={c.active}
                  className={cn(
                    'flex h-7 min-w-7 shrink-0 items-center justify-center gap-1 rounded-lg px-1.5 text-xs font-medium tabular-nums',
                    'focus-visible:ring-primary-500 focus-visible:ring-2 focus-visible:outline-none',
                    c.active
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                      : 'text-neutral-700 hover:bg-neutral-200 dark:text-neutral-300 dark:hover:bg-neutral-700'
                  )}
                >
                  {c.icon}
                  {c.badge && <span aria-hidden="true">{c.badge}</span>}
                </button>
              </Tooltip>
            ))}
          </div>
        );
      })}
      <button
        type="button"
        onClick={onUndock}
        aria-label="Undock capture ribbon"
        title="Undock capture ribbon"
        className="focus-visible:ring-primary-500 ms-auto shrink-0 rounded-lg p-1 text-neutral-500 hover:bg-neutral-200 focus-visible:ring-2 focus-visible:outline-none dark:hover:bg-neutral-700"
      >
        <PinOff className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Composer + captures
// ---------------------------------------------------------------------------

interface ComposerWithCaptureRibbonProps {
  defaultDocked?: boolean;
  /**
   * Native document camera. Omit to auto-detect a Capacitor/Cordova plugin;
   * pass `null` to disable. Document is hidden when none is available.
   */
  scanDocument?: ScanDocument | null;
  /** Additional host captures appended after the built-ins. */
  extraCaptures?: CaptureAction[];
}

function ComposerWithCaptureRibbon({
  defaultDocked = false,
  scanDocument,
  extraCaptures = [],
}: ComposerWithCaptureRibbonProps) {
  const composerRef = React.useRef<ChatComposerHandle>(null);
  const imageInputRef = React.useRef<HTMLInputElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const recognitionRef = React.useRef<SpeechRecognitionLike | null>(null);
  const [value, setValue] = React.useState('');
  const [docked, setDocked] = React.useState(defaultDocked);
  const [listening, setListening] = React.useState(false);
  const [status, setStatus] = React.useState('');
  const [support] = React.useState(detectSupport);
  const [documentScanner] = React.useState<ScanDocument | null>(() =>
    scanDocument === undefined ? detectNativeDocumentScanner() : scanDocument
  );

  const attach = (files: File[], message: string) => {
    if (!files.length) return;
    composerRef.current?.addFiles(files);
    setStatus(message);
  };

  const audio = useMediaRecording({
    kind: 'audio',
    getStream: () => navigator.mediaDevices.getUserMedia({ audio: true }),
    onFile: (f) => attach([f], 'Audio recording attached'),
  });
  const screen = useMediaRecording({
    kind: 'video',
    getStream: () =>
      navigator.mediaDevices.getDisplayMedia({ video: true, audio: true }),
    onFile: (f) => attach([f], 'Screen recording attached'),
  });

  const runSafely = (task: () => Promise<void>, failure: string) => () => {
    task().catch(() => setStatus(failure));
  };

  const stageFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    attach(Array.from(e.target.files ?? []), 'Attached');
    e.target.value = '';
  };

  const toggleVoiceToText = () => {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const Recognition = getSpeechRecognition();
    if (!Recognition) {
      setStatus('Voice to text is not supported here');
      return;
    }
    const base = value;
    const rec = new Recognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e) => {
      const text = Array.from(e.results, (r) => r[0].transcript).join('');
      setValue(base ? `${base} ${text}` : text);
    };
    rec.onend = () => {
      setListening(false);
      setStatus('Voice to text stopped');
    };
    recognitionRef.current = rec;
    rec.start();
    setListening(true);
    setStatus('Listening — speech appears in the input live');
  };

  React.useEffect(() => () => recognitionRef.current?.stop(), []);

  const recordingIcon = (idle: React.ReactNode, recording: boolean) =>
    recording ? <Square className={iconClass} aria-hidden="true" /> : idle;

  const recordIconClass = cn(iconClass, 'text-red-600');

  const captures: CaptureAction[] = [
    {
      id: 'record-audio',
      group: 'record',
      label: audio.recording
        ? `Stop audio recording (${audio.elapsed})`
        : 'Record audio',
      badge: audio.recording ? audio.elapsed : undefined,
      icon: recordingIcon(
        <AudioLines className={recordIconClass} aria-hidden="true" />,
        audio.recording
      ),
      run: runSafely(audio.toggle, 'Microphone access was blocked'),
      active: audio.recording,
      available: support.audio,
    },
    {
      id: 'record-screen',
      group: 'record',
      label: screen.recording
        ? `Stop screen recording (${screen.elapsed})`
        : 'Record screen',
      badge: screen.recording ? screen.elapsed : undefined,
      icon: recordingIcon(
        <MonitorPlay className={recordIconClass} aria-hidden="true" />,
        screen.recording
      ),
      run: runSafely(screen.toggle, 'Screen recording cancelled'),
      active: screen.recording,
      available: support.screenRecording,
    },
    {
      id: 'image',
      label: 'Capture image',
      icon: <Camera className={iconClass} aria-hidden="true" />,
      run: () => imageInputRef.current?.click(),
    },
    {
      id: 'screenshot',
      label: 'Capture screen',
      icon: <MonitorUp className={iconClass} aria-hidden="true" />,
      run: runSafely(async () => {
        attach([await captureScreenFrame()], 'Screenshot attached');
      }, 'Screen capture cancelled'),
      available: support.screenshot,
    },
    {
      id: 'file',
      label: 'Attach file',
      icon: <FileGlyph className={iconClass} aria-hidden="true" />,
      run: () => fileInputRef.current?.click(),
    },
    {
      id: 'document',
      label: 'Scan document',
      icon: <ScanText className={iconClass} aria-hidden="true" />,
      run: runSafely(async () => {
        const pages = (await documentScanner?.()) ?? [];
        attach(pages, `Scanned ${pages.length} page(s)`);
      }, 'Document scan cancelled'),
      available: documentScanner != null,
    },
    ...extraCaptures,
  ].filter((c) => c.available !== false);

  const menuItems: ChatComposerMenuItem[] = [
    ...captures.map((c) => ({
      id: c.id,
      label: c.label,
      icon: c.icon,
      onSelect: c.run,
    })),
    {
      id: 'dock',
      label: 'Dock as caption ribbon',
      icon: <Pin className={iconClass} aria-hidden="true" />,
      checked: docked,
      onSelect: () => setDocked((d) => !d),
    },
  ];

  return (
    <div className="w-[720px] max-w-full">
      {docked && (
        <CaptureRibbon captures={captures} onUndock={() => setDocked(false)} />
      )}
      <ChatComposer
        ref={composerRef}
        value={value}
        onValueChange={setValue}
        placeholder="Message Ozwell..."
        allowAttachments={false}
        addMenuItems={menuItems}
        micBehavior="always"
        micSlot={
          <button
            type="button"
            onClick={toggleVoiceToText}
            aria-label={listening ? 'Stop voice to text' : 'Voice to text'}
            aria-pressed={listening}
            title="Voice to text (live)"
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full',
              'focus-visible:ring-primary-500 focus-visible:ring-2 focus-visible:outline-none',
              listening
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 animate-pulse'
                : 'text-primary-600 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            )}
          >
            <Mic className={iconClass} aria-hidden="true" />
          </button>
        }
        onSend={() => {
          setValue('');
          setStatus('Sent');
        }}
      />
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
      <p
        role="status"
        aria-live="polite"
        className="mt-2 text-xs text-neutral-500"
      >
        {status}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stories
// ---------------------------------------------------------------------------

/** Stand-in for the native document camera so Storybook can show Document. */
const mockScanDocument: ScanDocument = async () => {
  const canvas = document.createElement('canvas');
  canvas.width = 850;
  canvas.height = 1100;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#111';
    ctx.font = '48px sans-serif';
    ctx.fillText('Scanned document', 60, 120);
  }
  const blob = await new Promise<Blob | null>((r) =>
    canvas.toBlob(r, 'image/jpeg')
  );
  return blob
    ? [new File([blob], `document-${Date.now()}.jpg`, { type: 'image/jpeg' })]
    : [];
};

const meta = {
  id: 'chat-chatcomposer-action-ribbon-poc',
  title: 'Modules/Chat/Composer Action Ribbon (POC)',
  component: ComposerWithCaptureRibbon,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:experimental'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `### What it's for

**POC.** Every capture source in one \`+\` menu on \`ChatComposer\` (full labels), plus a **Dock as caption ribbon** toggle that pins them to the top edge of the input as icon-only buttons with tooltips, grouped as \`Record: [Audio] [Screen]  Capture: [Image] [Screen] [File] [Document]\`. Undock from the pin at the ribbon's end.

### Captures are conditional

Each capture declares \`available\` and a \`group\` (\`record\` or \`capture\`); unavailable ones are hidden in both the menu and the ribbon. Target runtimes: browser, **Cordova**, **Capacitor**.

| Group | Item (menu label) | Needs | Browser | Cordova / Capacitor (iOS, Android) |
| --- | --- | --- | --- | --- |
| Record | Audio (Record audio) | \`MediaRecorder\` + \`getUserMedia\` | yes | yes (iOS 14.3+ WKWebView; add mic usage description) |
| Record | Screen (Record screen) | \`MediaRecorder\` + \`getDisplayMedia\` | desktop | hidden (WebViews lack it) |
| Capture | Image (Capture image) | \`<input type="file" accept="image/*">\` | yes | yes (native photo picker / camera sheet) |
| Capture | Screen (Capture screen) — still screenshot | \`getDisplayMedia\` | desktop | hidden |
| Capture | File (Attach file) | \`<input type="file">\` | yes | yes |
| Capture | Document (Scan document) | native document camera plugin | hidden | Capacitor \`capacitor-document-scanner\` or Cordova \`cordova-plugin-document-scanner\`, auto-detected; or pass \`scanDocument\` |
| Any | Others | host \`extraCaptures\` | — | — |

### Voice to text vs. Record audio

- **Voice to text** — blue mic to the right of the input only (not in the menu or ribbon). Live speech recognition streamed into the draft (Web Speech API; native apps will need a speech plugin).
- **Record audio** — records a clip, showing a running timer beside the stop icon, and attaches it to the message.

### How it's built

Pure composition over \`ChatComposer\`'s public API — \`addMenuItems\`, \`micSlot\`, \`ref.addFiles\` — plus the library \`Tooltip\`. Record audio and Record screen share one \`MediaRecorder\` hook. No library changes.`,
      },
    },
  },
} satisfies Meta<typeof ComposerWithCaptureRibbon>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Everything lives under `+`; pick "Dock as caption ribbon" to pin it. */
export const MenuOnly: Story = { args: { defaultDocked: false } };

/** Ribbon docked to the input. Document is hidden: no native scanner on the web. */
export const Docked: Story = { args: { defaultDocked: true } };

/**
 * Simulates a Cordova/Capacitor app with a native document scanner, plus a
 * host-supplied extra capture (Barcode) to show the list is open-ended.
 */
export const NativeWithDocument: Story = {
  args: {
    defaultDocked: true,
    scanDocument: mockScanDocument,
    extraCaptures: [
      {
        id: 'barcode',
        label: 'Scan barcode',
        icon: <ScanBarcode className={iconClass} aria-hidden="true" />,
        run: () => window.alert('Host barcode scanner would open here'),
      },
    ],
  },
};
