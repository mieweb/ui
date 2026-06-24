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
 * Transformers.js is loaded from a CDN at runtime, so there's no extra
 * dependency to install. If your Storybook blocks the CDN import, run
 * `pnpm add @huggingface/transformers` and swap the dynamic import for a static one.
 */
import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { AIChat } from './AIChat';
import type { AIMessage } from './types';

const meta: Meta<typeof AIChat> = {
  title: 'Product/Feature Modules/AI/AIChat (Voice)',
  component: AIChat,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The real **AIChat** with **on-device** talk-to-text. Tap the mic, speak, and Whisper ' +
          'transcribes in the browser (no audio leaves the page). Built by wiring `onRecordingComplete` ' +
          'to a browser Whisper model — the shipped component is unchanged.',
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof AIChat>;

// --- on-device transcription: Transformers.js (Whisper) loaded from CDN, no install ---
let pipePromise: Promise<(input: Float32Array, opts: unknown) => Promise<{ text?: string }>> | null = null;
function loadWhisper() {
  if (pipePromise) return pipePromise;
  pipePromise = (async () => {
    const mod = (await import(
      /* @vite-ignore */ 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3'
    )) as {
      pipeline: (task: string, model: string, opts?: unknown) => Promise<never>;
      env: { allowLocalModels: boolean; backends: { onnx: { wasm: { numThreads: number } } } };
    };
    mod.env.allowLocalModels = false;
    mod.env.backends.onnx.wasm.numThreads = 1; // plain page has no COOP/COEP headers
    const MODEL = 'Xenova/whisper-small.en'; // light & fast; swap for large-v3-turbo on WebGPU
    try {
      return await mod.pipeline('automatic-speech-recognition', MODEL, { device: 'webgpu' });
    } catch {
      return await mod.pipeline('automatic-speech-recognition', MODEL); // WASM fallback
    }
  })();
  return pipePromise;
}

async function transcribeBlob(blob: Blob): Promise<string> {
  // The mic gives a compressed blob (webm/opus). Decode it, downmix to mono, resample to 16 kHz.
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new Ctx();
  const audio = await ctx.decodeAudioData(await blob.arrayBuffer());
  const src = audio.getChannelData(0);
  const ratio = 16000 / audio.sampleRate;
  const n = Math.round(src.length * ratio);
  const mono = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / ratio;
    const i0 = Math.floor(t);
    const i1 = Math.min(i0 + 1, src.length - 1);
    mono[i] = src[i0] + (src[i1] - src[i0]) * (t - i0); // linear resample
  }
  void ctx.close();
  const pipe = await loadWhisper();
  // whisper-small.en is English-only — it rejects `language`/`task` (those are multilingual-only).
  const out = await pipe(mono, { chunk_length_s: 30 });
  return (out?.text ?? '').trim();
}

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

  const send = React.useCallback((text: string) => {
    const t = text.trim();
    if (!t) return;
    setMessages((m) => [...m, mkMsg('user', t)]);
    // Stand-in for the host's onSendMessage -> real Ozwell backend.
    window.setTimeout(
      () => setMessages((m) => [...m, mkMsg('assistant', `Heard: “${t}”. Wire me to the Ozwell backend and I'd answer.`)]),
      350,
    );
  }, []);

  return (
    <div style={{ height: '100vh' }}>
      <AIChat
        messages={messages}
        height="100%"
        talkToText
        title="Ozwell Assistant"
        inputPlaceholder={transcribing ? 'Transcribing on-device…' : 'Speak or type…'}
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
