/**
 * On-device Whisper transcription (Transformers.js from CDN, no install).
 * Shared by the AIChat voice story and the hands-free composition.
 *
 * transcribeBlob(blob) — decode a recorded audio blob, downmix + resample to 16 kHz, run Whisper
 * fully in the browser, return the text. Audio never leaves the page (PHI-safe).
 */
import { registerModelServiceWorker } from './modelCache';

type Whisper = (input: Float32Array, opts: unknown) => Promise<{ text?: string }>;
let pipePromise: Promise<Whisper> | null = null;
let isMultilingual = false;

// Optional model override, read from the same ozwellConfig used by the chat. Set
// `{ ..., whisper: 'base.en' }` to force the small (~75 MB) English model instead of the heavy turbo
// one — much faster to download and runs even when browser storage is tight/over-quota (the turbo
// model is hundreds of MB and stalls when it can't cache). Checks current → parent → top frame
// (Storybook iframe) and localStorage.
function whisperPref(): string | null {
  const fromWin = (w?: Window | null): string | undefined => {
    try { return (w as unknown as { __ozwell?: { whisper?: string } })?.__ozwell?.whisper; } catch { return undefined; }
  };
  const win = fromWin(window) || fromWin(window.parent) || fromWin(window.top);
  if (win) return win;
  try { return JSON.parse(localStorage.getItem('ozwellConfig') || '{}').whisper || null; } catch { return null; }
}

function loadWhisper(): Promise<Whisper> {
  if (pipePromise) return pipePromise;
  registerModelServiceWorker(); // ensure the model cache SW is registered before the big download
  pipePromise = (async () => {
    const mod = (await import(
      /* @vite-ignore */ 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3'
    )) as {
      pipeline: (task: string, model: string, opts?: unknown) => Promise<Whisper>;
      env: { allowLocalModels: boolean; useBrowserCache: boolean; backends: { onnx: { wasm: { numThreads: number } } } };
    };
    mod.env.allowLocalModels = false;
    // Use transformers.js's OWN cache — it STREAMS the model straight to the Cache API (how whisper-web
    // caches this same 1.2GB turbo model). A hand-rolled SW that buffers the whole file in memory chokes
    // on a file this large (QuotaExceeded); streaming + a size-header (LFS) host is the proven path.
    mod.env.useBrowserCache = true;
    mod.env.backends.onnx.wasm.numThreads = 1;
    try { await navigator.storage?.persist?.(); } catch { /* best-effort */ }
    const t0 = performance.now();
    const secs = () => ((performance.now() - t0) / 1000).toFixed(1);

    // Visible download progress, so the (1–2 min, one-time) turbo load isn't an opaque freeze. Logs each
    // model file at 25% steps; "(cached)" loads emit no progress events, so silence here = fast cache hit.
    const seen: Record<string, number> = {};
    const progress_callback = (p: { status?: string; file?: string; progress?: number }) => {
      if (!p.file) return;
      // HuggingFace omits content-length on its redirect, so big files emit no numeric `progress` — log
      // start + finish too, else the slow .onnx files download in apparent silence (looks frozen).
      if (p.status === 'initiate') console.log(`[whisper] fetching ${p.file}… (${secs()}s)`);
      else if (p.status === 'done') console.log(`[whisper] ✓ ${p.file} (${secs()}s)`);
      else if (p.status === 'progress' && typeof p.progress === 'number') {
        const step = Math.floor(p.progress / 25) * 25; // 0/25/50/75/100
        if (seen[p.file] !== step) { seen[p.file] = step; console.log(`[whisper] ${p.file}: ${step}% (${secs()}s)`); }
      }
    };

    // Small English-only models (load directly, skip the heavy turbo). q8 on WebGPU, WASM fallback.
    const loadEnglish = async (modelId: string): Promise<Whisper> => {
      try {
        const pipe = await mod.pipeline('automatic-speech-recognition', modelId, { device: 'webgpu', dtype: 'q8', progress_callback });
        console.log(`[whisper] ready (${modelId} / WebGPU, ${secs()}s)`);
        return pipe;
      } catch {
        const pipe = await mod.pipeline('automatic-speech-recognition', modelId, { dtype: 'q8', progress_callback });
        console.log(`[whisper] ready (${modelId} / wasm, ${secs()}s)`);
        return pipe;
      }
    };

    // Optional override: pick a lighter model than turbo via ozwellConfig.whisper.
    //   'small.en' — best speed/accuracy balance on a modest machine (RECOMMENDED if turbo is slow)
    //   'base.en'  — faster but hallucinates on unclear audio
    //   'tiny.en'  — fastest, lowest accuracy
    //   'turbo' or unset — the large multilingual turbo model (best accuracy, heaviest)
    const SMALL_MODELS: Record<string, string> = {
      tiny: 'Xenova/whisper-tiny.en', 'tiny.en': 'Xenova/whisper-tiny.en',
      base: 'Xenova/whisper-base.en', 'base.en': 'Xenova/whisper-base.en',
      small: 'Xenova/whisper-small.en', 'small.en': 'Xenova/whisper-small.en',
    };
    const pref = (whisperPref() || '').toLowerCase();
    if (pref && pref !== 'turbo' && SMALL_MODELS[pref]) {
      console.log(`[whisper] loading ${pref} (forced via ozwellConfig.whisper)…`);
      return loadEnglish(SMALL_MODELS[pref]);
    }

    console.log('[whisper] loading turbo…');
    // turbo (best accuracy) on WebGPU; falls back to base.en when turbo/WebGPU is unavailable.
    // Loaded from a self-hosted LFS mirror (real size headers) so transformers.js's streaming cache can
    // store it — the onnx-community copy is on HF Xet storage with no size header, which caches as 0 bytes.
    try {
      const pipe = await mod.pipeline('automatic-speech-recognition', 'jlocala/whisper-large-v3-turbo-ozwell', {
        device: 'webgpu',
        dtype: { encoder_model: 'fp16', decoder_model_merged: 'q4' },
        progress_callback,
      });
      isMultilingual = true;
      console.log(`[whisper] ready (turbo / WebGPU, ${secs()}s)`);
      return pipe;
    } catch (e) {
      console.log(`[whisper] turbo/WebGPU unavailable (${e instanceof Error ? e.message : e}) → base.en fallback`);
      return loadEnglish('Xenova/whisper-base.en');
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
  registerModelServiceWorker(); // cache the (large) model across app opens
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
