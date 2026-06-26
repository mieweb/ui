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
import { askOzwellStream, isOzwellConfigured, toOzwellMessages } from './ozwellChat';
import { registerModelServiceWorker } from './modelCache';

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
let isMultilingual = false; // turbo is multilingual (needs language/task); base.en is English-only
function loadWhisper() {
  if (pipePromise) return pipePromise;
  pipePromise = (async () => {
    const mod = (await import(
      /* @vite-ignore */ 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3'
    )) as {
      pipeline: (task: string, model: string, opts?: unknown) => Promise<never>;
      env: { allowLocalModels: boolean; useBrowserCache: boolean; backends: { onnx: { wasm: { numThreads: number } } } };
    };
    mod.env.allowLocalModels = false;
    mod.env.useBrowserCache = false; // SW is the single model cache; don't double-store the ~1GB model
    mod.env.backends.onnx.wasm.numThreads = 1; // plain page has no COOP/COEP headers
    // Ask the browser to KEEP our model cache. Without this the model may never be stored (if the
    // quota is tight) or get evicted, so it re-downloads on every reload. Best-effort; fine if false.
    try { await navigator.storage?.persist?.(); } catch { /* ignore */ }
    // DEFAULT: large-v3-turbo on WebGPU — best accuracy. fp16 encoder + q4 decoder is the fast WebGPU
    // recipe. It re-downloads each reload UNLESS the browser has the cache quota for it (a near-full disk
    // makes Chrome shrink that quota); on a healthy machine / real deploy it caches once and reloads fast.
    // FALLBACK: base.en q8 — tiny (~75MB), always fits the cache, English-only.
    try {
      // self-hosted LFS mirror so it can be cached (the onnx-community copy is on uncacheable HF Xet)
      const pipe = await mod.pipeline('automatic-speech-recognition', 'jlocala/whisper-large-v3-turbo-ozwell', {
        device: 'webgpu',
        dtype: { encoder_model: 'fp16', decoder_model_merged: 'q4' },
      });
      isMultilingual = true;
      return pipe;
    } catch (e) {
      console.warn('[voice] turbo unavailable (no WebGPU?) — falling back to base.en', e);
      try { return await mod.pipeline('automatic-speech-recognition', 'Xenova/whisper-base.en', { device: 'webgpu', dtype: 'q8' }); }
      catch { return await mod.pipeline('automatic-speech-recognition', 'Xenova/whisper-base.en', { dtype: 'q8' }); } // WASM fallback
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
  // turbo is multilingual → pin English; base.en is English-only → must NOT pass language/task.
  const out = await pipe(mono, isMultilingual
    ? { chunk_length_s: 30, language: 'english', task: 'transcribe' }
    : { chunk_length_s: 30 });
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
  const [generating, setGenerating] = React.useState(false);
  // latest messages, so `send` can pass the full conversation as history without re-creating the callback
  const messagesRef = React.useRef(messages);
  messagesRef.current = messages;

  // preload Whisper as soon as the story opens, so it's loading in the background while you read/talk
  // instead of waiting for the first mic tap — the first transcription is then fast.
  React.useEffect(() => { registerModelServiceWorker(); void loadWhisper(); }, []);

  const send = React.useCallback((text: string) => {
    const t = text.trim();
    if (!t) return;
    setMessages((m) => [...m, mkMsg('user', t)]);

    // No Ozwell key configured → keep the canned reply, so the demo still works keyless.
    // Configure with `window.__ozwell = { apiKey: '…' }` (or localStorage['ozwellConfig']).
    if (!isOzwellConfigured()) {
      window.setTimeout(
        () => setMessages((m) => [...m, mkMsg('assistant', `Heard: “${t}”. Wire me to the Ozwell backend and I'd answer.`)]),
        350,
      );
      return;
    }

    // Real Ozwell call — streamed token-by-token into one assistant message (multi-turn: pass history).
    const history = [...toOzwellMessages(messagesRef.current), { role: 'user' as const, content: t }];
    const id = `assistant-${++counter}`;
    setMessages((m) => [...m, { id, role: 'assistant', content: [{ type: 'text', text: '' }], timestamp: new Date(), status: 'streaming' }]);
    setGenerating(true);
    const patch = (txt: string, status: AIMessage['status']) =>
      setMessages((m) => m.map((msg) => (msg.id === id ? { ...msg, content: [{ type: 'text', text: txt }], status } : msg)));
    askOzwellStream(history, (_d, full) => patch(full, 'streaming'))
      .then((full) => patch(full || '(no response)', 'complete'))
      .catch((e) => patch(`⚠️ ${e instanceof Error ? e.message : String(e)}`, 'error'))
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
