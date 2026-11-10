/**
 * POC (quick & dirty): every capture source in one `+` menu on ChatComposer
 * (full labels), with a "Dock capture ribbon" toggle that pins them as
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
 *
 * The capture model, ribbon, recorder hook and file captures were promoted to
 * src/components/RichMediaCaptureEditor/ (mieweb/ui#733); this story is now a
 * consumer of that shared module.
 */
import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  AudioLines,
  Mic,
  MonitorPlay,
  Pin,
  PinOff,
  Square,
  SquareDashed,
} from 'lucide-react';
import {
  ChatComposer,
  type ChatComposerHandle,
  type ChatComposerMenuItem,
} from './ChatComposer';
import {
  CaptureRibbon,
  detectSupport,
  useFileCaptures,
  useMediaRecording,
  type CaptureAction,
  type ScanDocument,
} from '../RichMediaCaptureEditor';
import { cn } from '../../utils/cn';

const iconClass = 'h-4 w-4';

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
  const recognitionRef = React.useRef<SpeechRecognitionLike | null>(null);
  const [value, setValue] = React.useState('');
  const [docked, setDocked] = React.useState(defaultDocked);
  const [listening, setListening] = React.useState(false);
  const [status, setStatus] = React.useState('');
  const [support] = React.useState(detectSupport);

  const attach = (files: File[], message: string) => {
    if (!files.length) return;
    // addFiles reports rejections synchronously via onError, which then
    // replaces this optimistic message.
    setStatus(message);
    composerRef.current?.addFiles(files);
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

  const { captures: fileCaptures, inputs } = useFileCaptures({
    onFiles: attach,
    onStatus: setStatus,
    scanDocument,
  });

  /** Ends dictation and detaches handlers so no late result can touch the draft. */
  const stopVoiceToText = () => {
    const rec = recognitionRef.current;
    if (!rec) return;
    rec.onresult = null;
    rec.onend = null;
    rec.stop();
    recognitionRef.current = null;
    setListening(false);
  };

  const toggleVoiceToText = () => {
    if (listening) {
      stopVoiceToText();
      setStatus('Voice to text stopped');
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
      recognitionRef.current = null;
      setListening(false);
      setStatus('Voice to text stopped');
    };
    recognitionRef.current = rec;
    rec.start();
    setListening(true);
    setStatus('Listening — speech appears in the input live');
  };

  React.useEffect(
    () => () => {
      const rec = recognitionRef.current;
      if (!rec) return;
      rec.onresult = null;
      rec.onend = null;
      rec.stop();
    },
    []
  );

  const recordingIcon = (idle: React.ReactNode, recording: boolean) =>
    recording ? <Square className={iconClass} aria-hidden="true" /> : idle;

  const recordIconClass = cn(iconClass, 'text-red-600');

  const allCaptures: CaptureAction[] = [
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
    ...fileCaptures,
    ...extraCaptures,
  ];
  const captures = allCaptures.filter((c) => c.available !== false);

  const menuItems: ChatComposerMenuItem[] = [
    ...captures.map((c) => ({
      id: c.id,
      label: c.label,
      icon: c.icon,
      onSelect: c.run,
    })),
    {
      id: 'dock',
      label: docked ? 'Undock capture ribbon' : 'Dock capture ribbon',
      icon: docked ? (
        <PinOff className={iconClass} aria-hidden="true" />
      ) : (
        <Pin className={iconClass} aria-hidden="true" />
      ),
      onSelect: () => setDocked((d) => !d),
    },
  ];

  return (
    <div className="w-[min(720px,calc(100vw-2rem))]">
      {docked && (
        <CaptureRibbon
          captures={captures}
          onUndock={() => setDocked(false)}
          data-slot="chat-composer-capture-ribbon"
        />
      )}
      <ChatComposer
        ref={composerRef}
        value={value}
        onValueChange={(next) => {
          // A manual edit ends dictation so results can't overwrite it.
          if (recognitionRef.current) {
            stopVoiceToText();
            setStatus('Voice to text stopped (manual edit)');
          }
          setValue(next);
        }}
        onError={(message) => setStatus(message)}
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
          stopVoiceToText();
          setValue('');
          setStatus('Sent');
        }}
      />
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

**POC.** Every capture source in one \`+\` menu on [ChatComposer](?path=/docs/chat-chatcomposer--docs) (full labels), plus a **Dock capture ribbon** toggle that pins them to the top edge of the input as icon-only buttons with tooltips, grouped as \`Record: [Audio] [Screen]  Capture: [Image] [Screen] [File] [Document]\`. Undock from the pin at the ribbon's end.

### Use it when

- You are evaluating how a chat input should offer **several attachment sources at once** (recordings, screenshots, files, native document scans) and want them one click away while chatting.
- The host is a **Cordova or Capacitor** app as well as the web, and the set of captures should adapt to what each runtime supports.

### Don't use it when

- You only need the standard attach + voice input — use [ChatComposer](?path=/docs/chat-chatcomposer--docs) directly (its \`+\` menu already attaches files, \`micSlot\` takes a recorder or dictation button).
- You need **one document turned into fields** (ID, insurance card) with preview, validation and an extraction round-trip — use [DocumentScanner](?path=/docs/files-documentscanner--docs). It is a web flow (upload, mobile \`capture\` input, desktop webcam with edge detection) that sends to \`onScan\`. This POC's **Document** is different: it opens the **native iOS/Android document camera** through a plugin and just attaches the scanned pages to the message.
- You need production code — this is an experimental Storybook composition, not a library export.

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
| Any | Custom (empty slot) | host \`extraCaptures\` — any \`{ id, label, icon, run, group?, available? }\` | — | — |

### Voice to text vs. Record audio

- **Voice to text** — blue mic to the right of the input only (not in the menu or ribbon). Live speech recognition streamed into the draft (Web Speech API; native apps will need a speech plugin).
- **Record audio** — records a clip, showing a running timer beside the stop icon, and attaches it to the message.

### How it's built

Pure composition over \`ChatComposer\`'s public API — \`addMenuItems\`, \`micSlot\`, \`ref.addFiles\`. The capture model, ribbon, recorder hook and file captures now ship from the **RichMediaCaptureEditor** module (promoted in mieweb/ui#733); this story consumes that shared module and only adds the composer wiring, the dock toggle and voice to text.

### Limitations

- **Native adapters are unverified.** The Capacitor and Cordova document-scanner adapters follow each plugin's documented API but have not been run on a device; Storybook exercises Document only through a mock scanner.
- Voice to text uses the Web Speech API, which iOS/Android WebViews generally lack, so native apps need a speech plugin before the mic works there.
- Strings are hard-coded English (POC); a library version would take them as props.
- On narrow screens the ribbon scrolls horizontally rather than wrapping.`,
      },
    },
    catalog: {
      relationships: [
        {
          type: 'composes with',
          target: 'chat-chatcomposer',
          why: 'Built entirely on ChatComposer: captures go in addMenuItems, files are staged with ref.addFiles, and the voice-to-text mic sits in micSlot.',
        },
        {
          type: 'alternative to',
          target: 'files-documentscanner',
          why: 'DocumentScanner is the web flow for turning one document into fields (upload, mobile capture input, webcam, then onScan); this POC’s Document opens the native iOS/Android document camera via a Cordova/Capacitor plugin and only attaches the pages to a chat message.',
        },
        {
          type: 'uses',
          target: 'overlays-tooltip',
          why: 'Docked ribbon buttons are icon-only; Tooltip shows each capture’s name on hover and focus.',
        },
      ],
    },
  },
} satisfies Meta<typeof ComposerWithCaptureRibbon>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Everything lives under `+`; pick "Dock capture ribbon" to pin it. */
export const MenuOnly: Story = { args: { defaultDocked: false } };

/** Ribbon docked to the input. Document is hidden: no native scanner on the web. */
export const Docked: Story = { args: { defaultDocked: true } };

/**
 * Simulates a Cordova/Capacitor app with a native document scanner, plus an
 * empty host slot showing where a custom capture plugs in via `extraCaptures`.
 */
export const NativeWithDocument: Story = {
  args: {
    defaultDocked: true,
    scanDocument: mockScanDocument,
    extraCaptures: [
      {
        id: 'custom-slot',
        label: 'Custom capture (empty slot)',
        icon: (
          <SquareDashed
            className={cn(iconClass, 'text-neutral-400')}
            aria-hidden="true"
          />
        ),
        run: () => {},
      },
    ],
  },
};
