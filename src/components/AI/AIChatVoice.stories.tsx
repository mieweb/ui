/**
 * AIChat + on-device voice (Ozwell dictation).
 *
 * This is the REAL `AIChat` component — its existing `talkToText` mic and
 * `onRecordingComplete(blob)` seam wired to a browser-resident Whisper model.
 * The mic records, Whisper transcribes ENTIRELY in the browser (audio never
 * leaves the page — PHI-safe), and the text is sent as a message.
 *
 * Nothing in the shipped component changes; this is an additive story that
 * demonstrates how a host app would plug on-device transcription into the seam
 * AIChat already exposes. (The "assistant" reply here is a stand-in for the real
 * Ozwell backend — the point is the voice → text → message loop.)
 *
 * Transcription is handled by the shared `whisperTranscribe.ts` (on-device Whisper via
 * Transformers.js) — the same module HandsFreeChat / the Hey Ozwell demo use.
 */
import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { AIChat } from './AIChat';
import type { AIMessage } from './types';
import {
  askOzwellStream,
  isOzwellConfigured,
  toOzwellMessages,
} from './ozwellChat';
import { transcribeBlob, warmWhisper } from './whisperTranscribe';

const meta: Meta<typeof AIChat> = {
  id: 'chat-aichat-voice',
  title: 'Modules/Chat/AIChat (Voice)',
  component: AIChat,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `### What it's for

**A reference wiring — not a separate component — of \`AIChat\`'s \`talkToText\` mic to on-device Whisper transcription and a streamed Ozwell reply.** The story mounts the shipped \`AIChat\` with \`talkToText\`, and in \`onRecordingComplete(blob)\` calls \`transcribeBlob(blob)\` from \`@mieweb/ui\`'s \`whisperTranscribe\` helpers (Transformers.js in a Web Worker; audio never leaves the page), then auto-sends the text via \`onSendMessage\`. Replies come from \`askOzwellStream(history, onToken)\` when \`isOzwellConfigured()\` is true (an OpenAI-compatible \`/v1/chat/completions\` endpoint configured at runtime), streamed token-by-token into one assistant message (\`status: 'streaming'\` → \`'complete'\`); with no key configured a canned "Heard: …" reply is used so the demo never needs a secret. \`warmWhisper()\` preloads the model on mount. Exports involved: \`AIChat\`, \`transcribeBlob\`, \`warmWhisper\`, \`askOzwellStream\`, \`isOzwellConfigured\`, \`toOzwellMessages\`.

### Use it when

- You are adding **push-to-talk dictation** to an existing \`AIChat\` and want the copy-paste shape for the mic → transcript → send loop, including the "Transcribing on-device…" placeholder swap.
- The transcript must stay on the device (PHI) and the host can afford the Whisper download (see Limitations).

### Don't use it when

- You want **hands-free** operation with wake words, speaker verification or diarization — \`HandsFreeChat\` / \`HeyOzwell\` (Modules › Voice) own that state machine; this story is tap-to-record only.
- Dictation should go to a **server** ASR endpoint — call \`transcribeServer\` instead of \`transcribeBlob\` (see the Voice family's \`transcription="server"\` option).
- You are not using \`AIChat\` at all: \`RecordButton\` + \`transcribeBlob\` work with any composer.

### Example

\`\`\`tsx
const [messages, setMessages] = useState<AIMessage[]>([]);
const [transcribing, setTranscribing] = useState(false);
useEffect(() => { warmWhisper(); }, []);

<AIChat
  messages={messages}
  talkToText
  inputPlaceholder={transcribing ? t('chat.transcribing') : t('chat.speakOrType')}
  onSendMessage={(text) => sendToBackend(text, setMessages)} // your transport; base URL + key live in host config
  onRecordingComplete={async (blob) => {
    setTranscribing(true);
    try {
      const text = await transcribeBlob(blob);
      if (text) sendToBackend(text, setMessages);
    } finally {
      setTranscribing(false);
    }
  }}
/>
\`\`\`

### Limitations

- **Model download.** \`transcribeBlob\` loads Whisper turbo (~1.3 GB, WebGPU with a WASM fallback; \`whisper: 'base.en'\` in \`ozwellConfig\` selects the ~75 MB English model) from a config-driven host (\`window.__ozwellWhisperHost\`, default a Cloudflare R2 bucket) and Transformers.js itself from a CDN (\`window.__ozwellTransformersUrl\`). Strict CSP hosts need \`worker-src blob:\` plus those origins. First load is minutes; later loads come from the Cache API.
- **Backend config is runtime-only and browser-visible.** \`isOzwellConfigured()\` reads \`localStorage.ozwellConfig\` / \`window.__ozwell\` (\`{ apiKey, baseURL, model, system, temperature }\`); a Bearer key held in the browser is readable by anyone with the page — proxy it server-side for anything public. Never put a key in source.
- **Accessibility as implemented:** identical to \`AIChat\` — no live region for the streamed reply or the "Transcribing on-device…" placeholder; the mic is \`RecordButton\` (see Media › RecordButton). Transcription errors go to \`console.error\` only.
- Requires a secure context, microphone permission, \`MediaRecorder\`, Web Workers and (ideally) WebGPU. The transcript is auto-sent; there is no review step in this wiring.
- i18n / RTL / theming: inherits \`AIChat\`'s English defaults and physical alignment; the title here is hard-coded "Ozwell Assistant". Entry \`@mieweb/ui\` (\`onnxruntime-web\` is a runtime dependency of the voice helpers).`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'alternative to',
          target: 'voice-hands-free-chat',
          why: 'AIChat (Voice) is tap-to-record dictation on the plain AIChat; HandsFreeChat adds wake words, speaker verification and diarization.',
        },
        {
          type: 'uses',
          target: 'chat-aichat',
          why: 'The story renders the unmodified AIChat and only wires its talkToText callbacks.',
        },
        {
          type: 'uses',
          target: 'media-recordbutton',
          why: 'The mic in the composer is the RecordButton that AIChat mounts for talkToText.',
        },
      ],
    },
  },
};
export default meta;
type Story = StoryObj<typeof AIChat>;

// On-device transcription uses the shared whisperTranscribe module — single source of truth for the model
// host + caching behaviour (this story previously inlined its own copy). See ./whisperTranscribe.ts.

let counter = 0;
const mkMsg = (role: AIMessage['role'], text: string): AIMessage => ({
  id: `${role}-${++counter}`,
  role,
  content: [{ type: 'text', text }],
  timestamp: new Date(),
  status: 'complete',
});

function VoiceAIChat() {
  const [messages, setMessages] = React.useState<AIMessage[]>([]);
  const [transcribing, setTranscribing] = React.useState(false);
  const [generating, setGenerating] = React.useState(false);
  // latest messages, so `send` can pass the full conversation as history without re-creating the callback
  const messagesRef = React.useRef(messages);
  messagesRef.current = messages;

  // preload Whisper as soon as the story opens, so it's loading in the background while you read/talk
  // instead of waiting for the first mic tap — the first transcription is then fast.
  React.useEffect(() => {
    warmWhisper();
  }, []);

  const send = React.useCallback((text: string) => {
    const t = text.trim();
    if (!t) return;
    setMessages((m) => [...m, mkMsg('user', t)]);

    // No Ozwell key configured → keep the canned reply, so the demo still works keyless.
    // Configure with `window.__ozwell = { apiKey: '…' }` (or localStorage['ozwellConfig']).
    if (!isOzwellConfigured()) {
      window.setTimeout(
        () =>
          setMessages((m) => [
            ...m,
            mkMsg(
              'assistant',
              `Heard: “${t}”. Wire me to the Ozwell backend and I'd answer.`
            ),
          ]),
        350
      );
      return;
    }

    // Real Ozwell call — streamed token-by-token into one assistant message (multi-turn: pass history).
    const history = [
      ...toOzwellMessages(messagesRef.current),
      { role: 'user' as const, content: t },
    ];
    const id = `assistant-${++counter}`;
    setMessages((m) => [
      ...m,
      {
        id,
        role: 'assistant',
        content: [{ type: 'text', text: '' }],
        timestamp: new Date(),
        status: 'streaming',
      },
    ]);
    setGenerating(true);
    const patch = (txt: string, status: AIMessage['status']) =>
      setMessages((m) =>
        m.map((msg) =>
          msg.id === id
            ? { ...msg, content: [{ type: 'text', text: txt }], status }
            : msg
        )
      );
    askOzwellStream(history, (_d, full) => patch(full, 'streaming'))
      .then((full) => patch(full || '(no response)', 'complete'))
      .catch((e) =>
        patch(`⚠️ ${e instanceof Error ? e.message : String(e)}`, 'error')
      )
      .finally(() => setGenerating(false));
  }, []);

  return (
    <div style={{ height: '100vh' }}>
      <AIChat
        messages={messages}
        height="100%"
        talkToText
        isGenerating={generating}
        title="Ozwell Assistant"
        inputPlaceholder={
          transcribing ? 'Transcribing on-device…' : 'Speak or type…'
        }
        onSendMessage={send}
        onRecordingComplete={async (blob) => {
          setTranscribing(true);
          try {
            const text = await transcribeBlob(blob);
            if (text) send(text); // auto-send; change to set the composer value if you prefer review-first
          } catch (e) {
            console.error('[voice] on-device transcription failed', e);
          } finally {
            setTranscribing(false);
          }
        }}
      />
    </div>
  );
}

/** The real AIChat with the mic wired to a browser-resident Whisper. Tap mic → speak → it transcribes on-device → sends. */
export const OnDeviceVoice: Story = {
  render: () => <VoiceAIChat />,
};
