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
    const t0 = performance.now();
    const secs = () => ((performance.now() - t0) / 1000).toFixed(1);
    console.log('[whisper] loading…');
    // turbo (best accuracy) on WebGPU; falls back to base.en q8 when WebGPU is unavailable.
    try {
      const pipe = await mod.pipeline('automatic-speech-recognition', 'onnx-community/whisper-large-v3-turbo', {
        device: 'webgpu',
        dtype: { encoder_model: 'fp16', decoder_model_merged: 'q4' },
      });
      isMultilingual = true;
      console.log(`[whisper] ready (turbo / WebGPU, ${secs()}s)`);
      return pipe;
    } catch (e) {
      console.log(`[whisper] turbo/WebGPU unavailable (${e instanceof Error ? e.message : e}) → base.en fallback`);
      try {
        const pipe = await mod.pipeline('automatic-speech-recognition', 'Xenova/whisper-base.en', { device: 'webgpu', dtype: 'q8' });
        console.log(`[whisper] ready (base.en / WebGPU, ${secs()}s)`);
        return pipe;
      } catch {
        const pipe = await mod.pipeline('automatic-speech-recognition', 'Xenova/whisper-base.en', { dtype: 'q8' });
        console.log(`[whisper] ready (base.en / wasm, ${secs()}s)`);
        return pipe;
      }
    }
  })();
  return pipePromise;
}

export function isWhisperLoaded(): boolean {
  return pipePromise !== null;
}

/** Start loading the model NOW — e.g. on app open or during enrollment — so the first dictation
 *  doesn't pay the load. Safe to call repeatedly (loadWhisper is memoized; the load happens once). */
export function warmWhisper(): void {
  void loadWhisper();
}

// trimEndSeconds: drop this many seconds off the END of the audio before transcribing (so Whisper
// never hears the spoken stop phrase). Pair with stripStopPhrase as a text-level backstop.
export async function transcribeBlob(blob: Blob, trimEndSeconds = 0): Promise<string> {
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
  let samples: Float32Array = mono;
  if (trimEndSeconds > 0) {
    const cut = Math.round(trimEndSeconds * 16000);
    if (samples.length > cut + 16000) samples = samples.subarray(0, samples.length - cut); // keep >=1s
  }
  const pipe = await loadWhisper();
  const out = await pipe(samples, isMultilingual
    ? { chunk_length_s: 30, language: 'english', task: 'transcribe' }
    : { chunk_length_s: 30 });
  return (out?.text ?? '').trim();
}

/** Peel a trailing "ozwell i'm done"-style stop phrase off the end of a transcript. Mirrors the
 *  standalone demo: handles Whisper's mishearings (Ozwell / As well / Also / Oswald / "I am done")
 *  including the bare word alone. Bare "as well" is NOT stripped (too common) unless joined to "i'm done". */
export function stripStopPhrase(text: string): string {
  const tail = /(?:\b(?:oz\s*well|all['’]?s?\s*well|as\s*well|also|oswald)\b\s*,?\s*i(?:['’]?m|\s+am)\s+done\b|\b(?:oz\s*well|all['’]?s\s*well|also|oswald)\b|\bi(?:['’]?m|\s+am)\s+done\b|\b(?:that\s+was\s+|was\s+)?well\s+done\b|\bthat['’]?s?\s+(?:was\s+)?all\b|\bthank(?:s|\s+you)(?:\s+for\s+watching)?\b|\bbye\b)[\s.,!?-]*$/i;
  let prev: string | null = null;
  let t = text;
  while (t !== prev && t) { prev = t; t = t.replace(tail, '').replace(/[\s.,!?-]+$/, ''); }
  return t.trim();
}
