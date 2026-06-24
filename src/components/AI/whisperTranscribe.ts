/**
 * On-device Whisper transcription (Transformers.js from CDN, no install).
 * Shared by the AIChat voice story and the hands-free composition.
 *
 * transcribeBlob(blob) — decode a recorded audio blob, downmix + resample to 16 kHz, run Whisper
 * fully in the browser, return the text. Audio never leaves the page (PHI-safe).
 */
type Whisper = (input: Float32Array, opts: unknown) => Promise<{ text?: string }>;
let pipePromise: Promise<Whisper> | null = null;
let isMultilingual = false;

function loadWhisper(): Promise<Whisper> {
  if (pipePromise) return pipePromise;
  pipePromise = (async () => {
    const mod = (await import(
      /* @vite-ignore */ 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3'
    )) as {
      pipeline: (task: string, model: string, opts?: unknown) => Promise<Whisper>;
      env: { allowLocalModels: boolean; backends: { onnx: { wasm: { numThreads: number } } } };
    };
    mod.env.allowLocalModels = false;
    mod.env.backends.onnx.wasm.numThreads = 1;
    try { await navigator.storage?.persist?.(); } catch { /* best-effort */ }
    // turbo (best accuracy) on WebGPU; falls back to base.en q8 when WebGPU is unavailable.
    try {
      const pipe = await mod.pipeline('automatic-speech-recognition', 'onnx-community/whisper-large-v3-turbo', {
        device: 'webgpu',
        dtype: { encoder_model: 'fp16', decoder_model_merged: 'q4' },
      });
      isMultilingual = true;
      return pipe;
    } catch {
      try { return await mod.pipeline('automatic-speech-recognition', 'Xenova/whisper-base.en', { device: 'webgpu', dtype: 'q8' }); }
      catch { return await mod.pipeline('automatic-speech-recognition', 'Xenova/whisper-base.en', { dtype: 'q8' }); }
    }
  })();
  return pipePromise;
}

export function isWhisperLoaded(): boolean {
  return pipePromise !== null;
}

export async function transcribeBlob(blob: Blob): Promise<string> {
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
    mono[i] = src[i0] + (src[i1] - src[i0]) * (t - i0);
  }
  void ctx.close();
  const pipe = await loadWhisper();
  const out = await pipe(mono, isMultilingual
    ? { chunk_length_s: 30, language: 'english', task: 'transcribe' }
    : { chunk_length_s: 30 });
  return (out?.text ?? '').trim();
}

/** Peel a trailing "ozwell i'm done"-style stop phrase off the end of a transcript. */
export function stripStopPhrase(text: string): string {
  const tail = /(?:\b(?:oz\s*well|as\s*well|oswald|oswell)\b\s*,?\s*i(?:['’]?m|\s+am)\s+done\b|\bi(?:['’]?m|\s+am)\s+done\b|\bthank(?:s|\s+you)\b|\bbye\b)[\s.,!?-]*$/i;
  let prev: string | null = null;
  let t = text;
  while (t !== prev && t) { prev = t; t = t.replace(tail, '').replace(/[\s.,!?-]+$/, ''); }
  return t.trim();
}
