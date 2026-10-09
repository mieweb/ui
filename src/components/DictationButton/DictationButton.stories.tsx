import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { DictationButton, type DictationButtonProps } from './DictationButton';
import type { DictationTranscribe } from './useDictation';
import { Textarea } from '../Textarea';
import { ChatComposer } from '../ChatComposer';
import { RecordButton } from '../RecordButton';

const mockTranscribe: DictationTranscribe = (audio, signal) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(
      () =>
        resolve(
          `Mock transcript of a ${(audio.size / 1024).toFixed(1)} KB recording.`
        ),
      1200
    );
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(Object.assign(new Error('Aborted'), { name: 'AbortError' }));
    });
  });

const failingTranscribe: DictationTranscribe = () =>
  Promise.reject(new Error('Transcription service unavailable'));

const appendText = (prev: string, text: string) =>
  prev ? `${prev} ${text}` : text;

function Composer(props: Omit<DictationButtonProps, 'onText'>) {
  const [text, setText] = React.useState('');
  const [lastError, setLastError] = React.useState('');
  return (
    <div className="flex w-[480px] max-w-full flex-col gap-2">
      <div className="flex items-end gap-2">
        <Textarea
          aria-label="Message"
          placeholder="Click the mic, speak, click again. Esc cancels."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-24 flex-1"
        />
        <DictationButton
          {...props}
          onText={(t) => setText((prev) => appendText(prev, t))}
          onError={(e) => setLastError(`${e.name}: ${e.message}`)}
        />
      </div>
      {lastError && (
        <p className="text-destructive text-xs">Last error: {lastError}</p>
      )}
    </div>
  );
}

function ChatComposerWithDictation() {
  const [value, setValue] = React.useState('');
  const [sent, setSent] = React.useState<string[]>([]);
  return (
    <div className="flex w-[560px] max-w-full flex-col gap-3">
      <ul aria-label="Sent messages" className="space-y-1 text-sm">
        {sent.map((m, i) => (
          <li key={i} className="bg-muted rounded-lg px-3 py-2">
            {m}
          </li>
        ))}
      </ul>
      <ChatComposer
        value={value}
        onValueChange={setValue}
        onSend={({ content }) => setSent((s) => [...s, content])}
        placeholder="Dictate with the left mic, record with the right one"
        leadingSlot={
          <DictationButton
            variant="minimal"
            transcribe={mockTranscribe}
            onText={(t) => setValue((prev) => appendText(prev, t))}
          />
        }
        micSlot={
          <RecordButton
            variant="minimal"
            size="sm"
            onRecordingComplete={() => {}}
          />
        }
      />
    </div>
  );
}

const meta: Meta<typeof DictationButton> = {
  id: 'media-dictationbutton',
  title: 'Modules/Media/DictationButton',
  component: DictationButton,
  parameters: {
    layout: 'centered',
    controls: {
      include: [
        'disabled',
        'size',
        'variant',
        'showDuration',
        'showStatus',
        'maxDurationSeconds',
      ],
    },
    docs: {
      description: {
        component: `### What it's for

**Speech to editable text for one speaker.** \`DictationButton\` records the microphone, transcribes the take, and calls \`onText(text)\` with the trimmed result. It **never sends anything**: the host decides where the text goes (usually appended to a composer value) and the user reviews it before sending. Transcription defaults to **on-device Whisper**, so audio stays in the browser; pass \`transcribe(audio, signal)\` to use a server instead. The visuals are a controlled \`RecordButton\` (idle → recording → processing → error). Also exported: the headless \`useDictation\` hook (\`status\`, \`error\`, \`elapsedMs\`, \`start\`, \`stop\`, \`cancel\`) for custom UIs, plus \`DictationTranscribe\`, \`DictationStatus\` and \`defaultDictationLabels\`.

### Use it when

- A chat composer or text field needs **voice typing** that the user reviews and edits before sending.
- The product already has a record-and-send mic and dictation must live **next to it**, not replace it — put \`DictationButton\` in \`ChatComposer\`'s \`leadingSlot\` and keep the existing \`RecordButton\` in \`micSlot\` (see *In Chat Composer*).
- Audio must stay on the device by default, with an opt-in server provider chosen by the host.

### Don't use it when

- The host wants the **audio itself** (voice message, upload, server pipeline) — \`RecordButton\` hands over the \`Blob\`.
- The user should **listen back, pause, or delete** the take first — \`AudioRecorder\`.
- You need a **speaker-labelled transcript** of a visit or meeting — \`VisitScribe\` (Voice). Dictation assumes a single speaker.
- You need hands-free start/stop by voice — \`HandsFreeChat\` (Voice) wires the "Hey Ozwell" wake word.

### Example

\`\`\`tsx
const [value, setValue] = useState('');

<ChatComposer
  value={value}
  onValueChange={setValue}
  onSend={({ content }) => send(content)}
  leadingSlot={
    <DictationButton
      variant="minimal"
      disabled={isStreaming}
      onText={(text) => setValue((prev) => (prev ? \`\${prev} \${text}\` : text))}
      // Omit for on-device Whisper. With a server, honour the signal so Escape/unmount cancels the request.
      transcribe={serverMode ? (audio, signal) => postAudio(audio, signal) : undefined}
      onError={reportError}
    />
  }
  micSlot={<RecordButton variant="minimal" size="sm" onRecordingComplete={upload} />}
/>
\`\`\`

The host owns the composer value and the send; the button owns the microphone and the take.

### Limitations

- **Batch, not streaming.** Text arrives after Stop; there is no live interim text yet.
- **First on-device take is slow.** The default provider lazy-loads the shared Whisper worker (turbo, ~1.3 GB, cached after the first download). Hosts can force the small English model with \`localStorage.ozwellConfig = '{"whisper":"base.en"}'\` (or \`window.__ozwell = { whisper: 'base.en' }\`) — this setting is shared with the other Voice components.
- **English only on device.** The shared Whisper worker pins \`language: 'english'\`, so the default provider transcribes English. For other languages pass a \`transcribe\` provider.
- **Limits.** Auto-stops after \`maxDurationSeconds\` (default 300; \`0\` disables). Empty or blank takes call nothing. \`Escape\` while recording, \`disabled\` turning on (including during the permission prompt or transcription), or unmount discards the take and aborts \`transcribe\` via its \`AbortSignal\`. The on-device worker cannot stop a decode already running; its result is dropped.
- **Browsers.** Needs a secure context and microphone permission. A denied prompt shows the \`micBlocked\` label; other failures show the generic \`error\` label and pass the real \`Error\` to \`onError\`. Recording format is the browser default (\`audio/webm\`, Safari \`audio/mp4\`). Embedded browsers without real microphone access (e.g. VS Code's integrated browser) produce undecodable takes — test in Chrome, Safari or Firefox.
- **Accessibility.** One \`<button>\` whose \`aria-label\` follows the state (\`start\` / \`stop\` / \`transcribing\` / error text) with \`aria-pressed\` while recording. A single \`role="status"\` region announces listening / transcribing / error; it is visually hidden unless \`showStatus\`.
- **i18n.** Every string comes from \`labels\` (English defaults in \`defaultDictationLabels\`); \`m:ss\` uses \`formatDuration\`. RTL: symmetric \`inline-flex\` with \`gap-2\`. Speech language: see *English only on device*.
- **DOM.** Standard button attributes (\`id\`, \`aria-describedby\`, \`data-*\`, handlers) go to the \`<button>\`; \`className\` goes to the wrapper. \`onKeyDown\` runs first and can \`preventDefault()\` to skip the Escape cancel.
- **Theming.** Inherits \`RecordButton\` tokens and variants. Entry \`@mieweb/ui\`.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'alternative to',
          target: 'media-recordbutton',
          why: 'RecordButton hands the host the audio Blob; DictationButton keeps the audio and hands back editable text. It renders a controlled RecordButton for its visuals.',
        },
        {
          type: 'composes with',
          target: 'chat-chatcomposer',
          why: 'Goes in leadingSlot next to an existing micSlot RecordButton; onText appends to the controlled composer value and the user still presses Send.',
        },
      ],
    },
  },
  tags: ['autodocs', 'scope:general-purpose', 'maturity:experimental'],
  argTypes: {
    onText: {
      description:
        'Called with the final, trimmed transcript. Not called for empty takes, blank results, or after cancel.',
      table: { disable: true },
    },
    transcribe: {
      description:
        'Provider `(audio, signal) => Promise<string>`. Omit for on-device Whisper. Honour `signal` to support cancel.',
      table: { disable: true },
    },
    onError: {
      description: 'Receives the underlying error (permission, provider, …).',
      table: { disable: true },
    },
    maxDurationSeconds: {
      description: 'Auto-stop after this many seconds. `0` disables.',
    },
    disabled: {
      description: 'Disables the button. Turning it on mid-take discards it.',
    },
    size: { description: 'Button size, as `RecordButton`.' },
    variant: { description: 'Button variant, as `RecordButton`.' },
    showDuration: { description: 'Show `m:ss` while recording.' },
    showStatus: {
      description:
        'Show the listening / transcribing / error caption. Always announced to screen readers.',
    },
    labels: {
      description: 'Override any user-facing string (i18n).',
      table: { disable: true },
    },
  },
  args: {
    disabled: false,
    size: 'sm',
    variant: 'ghost',
    showDuration: true,
    showStatus: true,
    maxDurationSeconds: 300,
  },
  render: (args) => <Composer {...args} />,
};

export default meta;
type Story = StoryObj<typeof DictationButton>;

/** Real on-device Whisper. The first take downloads the model, so expect a long first "Transcribing…". */
export const OnDevice: Story = {};

/** Fake provider that answers in ~1 s. Use it to check the UI states without loading a model. */
export const MockProvider: Story = {
  args: { transcribe: mockTranscribe },
};

/** Provider that always fails, to check the error state and recovery. */
export const ProviderError: Story = {
  args: { transcribe: failingTranscribe },
};

/** Auto-stops after 5 seconds. */
export const ShortLimit: Story = {
  args: { transcribe: mockTranscribe, maxDurationSeconds: 5 },
};

/**
 * Dictation next to the existing record mic. `DictationButton` sits in `leadingSlot` so it stays visible while
 * the composer has text; the original `RecordButton` stays in `micSlot` unchanged. Dictated text is appended to
 * the draft and is only sent when the user presses Send.
 */
export const InChatComposer: Story = {
  render: () => <ChatComposerWithDictation />,
  parameters: { controls: { disable: true } },
};

/** Every string comes from `labels`. */
export const Localized: Story = {
  args: {
    transcribe: mockTranscribe,
    labels: {
      start: 'Iniciar dictado',
      stop: 'Detener dictado',
      listening: 'Escuchando…',
      transcribing: 'Transcribiendo…',
      error: 'El dictado falló. Inténtalo de nuevo.',
      micBlocked: 'El acceso al micrófono está bloqueado.',
    },
  },
};
