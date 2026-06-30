/**
 * On-device Whisper transcription (Transformers.js from CDN, no install).
 * Shared by the AIChat voice story and the hands-free composition.
 *
 * transcribeBlob(blob) — decode a recorded audio blob, downmix + resample to 16 kHz, run Whisper
 * fully in the browser, return the text. Audio never leaves the page (PHI-safe).
 *
 * transcribeGate(samples) — a SECOND, fast (base.en) model used only for the hands-free "stop-confirm"
 * check (does the recent audio actually end with "done"?). Independent of the dictation model so the
 * heavy turbo stays the final-transcription path. See HandsFreeChat's "pending stop + verify".
 */
import { registerModelServiceWorker } from './modelCache';
import { getOzwellConfig } from './ozwellChat';

type Whisper = (input: Float32Array, opts: unknown) => Promise<{ text?: string }>;
type Mod = {
  pipeline: (task: string, model: string, opts?: unknown) => Promise<Whisper>;
  env: {
    allowLocalModels: boolean;
    useBrowserCache: boolean;
    remoteHost: string;
    remotePathTemplate: string;
    backends: { onnx: { wasm: { numThreads: number } } };
  };
};

const HF_HOST = 'https://huggingface.co';
const HF_PATH = '{model}/resolve/{revision}/';
// turbo's weights are served from our Cloudflare R2 bucket, which sends a Content-Length header so
// transformers.js can stream it into the Cache API (HuggingFace Xet doesn't → re-downloads ~1.3GB each
// open). To repoint (e.g. a mieweb-owned bucket for the PR) change R2_HOST + the path. See MODEL-HOSTING.md.
const R2_HOST = 'https://pub-64db68afc2cb4e108ff06e7e583f09d1.r2.dev';

const SMALL_MODELS: Record<string, string> = {
  tiny: 'Xenova/whisper-tiny.en', 'tiny.en': 'Xenova/whisper-tiny.en',
  base: 'Xenova/whisper-base.en', 'base.en': 'Xenova/whisper-base.en',
  small: 'Xenova/whisper-small.en', 'small.en': 'Xenova/whisper-small.en',
};
const GATE_MODEL = 'Xenova/whisper-base.en'; // stop-confirm: fast + reliable on the single word "done"

let pipePromise: Promise<Whisper> | null = null; // dictation model (turbo, or override)
let gatePromise: Promise<Whisper> | null = null; // stop-confirm model (base.en), independent
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

// The transformers.js module, imported + configured once and shared by every model load.
let modPromise: Promise<Mod> | null = null;
function getTransformers(): Promise<Mod> {
  if (modPromise) return modPromise;
  registerModelServiceWorker(); // ensure the model cache SW is registered before the big download
  modPromise = (async () => {
    const mod = (await import(
      /* @vite-ignore */ 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3'
    )) as Mod;
    mod.env.allowLocalModels = false;
    // Use transformers.js's OWN cache — it STREAMS the model straight to the Cache API (how whisper-web
    // caches this same 1.2GB turbo model). A hand-rolled SW that buffers the whole file in memory chokes
    // on a file this large (QuotaExceeded); streaming + a size-header (LFS) host is the proven path.
    mod.env.useBrowserCache = true;
    mod.env.backends.onnx.wasm.numThreads = 1;
    try { await navigator.storage?.persist?.(); } catch { /* best-effort */ }
    return mod;
  })();
  return modPromise;
}

// A model load mutates the SHARED env.remoteHost (turbo→R2, english→HF) and transformers.js reads it
// per-file as it fetches. So a turbo load and a base.en gate load running CONCURRENTLY would clobber each
// other mid-download (turbo's later files would fetch from HF, or base.en from R2 → 404). Serialize every
// model load through one chain so their env mutations never overlap. (Warm the gate before turbo so the
// fast model isn't stuck behind a slow turbo download — see HandsFreeChat.)
let loadChain: Promise<unknown> = Promise.resolve();
function serialize<T>(fn: () => Promise<T>): Promise<T> {
  const run = loadChain.then(fn, fn);
  loadChain = run.then(() => undefined, () => undefined);
  return run;
}

// Visible download progress, so a cold load isn't an opaque freeze. Logs each file at 25% steps;
// "(cached)" loads emit no progress events, so silence = a fast cache hit.
// --- dictation-model load progress, surfaced to the UI (the ~1.3GB turbo download is the slow one) ---
export interface WhisperLoadState {
  /** A load is in flight. */ active: boolean;
  /** Overall fraction 0..1 (averaged over the model's files). */ progress: number;
  /** The model is loaded. */ done: boolean;
}
let dictationLoad: WhisperLoadState = { active: false, progress: 0, done: false };
const loadListeners = new Set<() => void>();
function setDictationLoad(patch: Partial<WhisperLoadState>): void {
  dictationLoad = { ...dictationLoad, ...patch };
  loadListeners.forEach((l) => l());
}
/** Current dictation-model load state (for a progress indicator). */
export function getDictationLoad(): WhisperLoadState { return dictationLoad; }
/** Subscribe to dictation-model load changes; returns an unsubscribe. Pair with getDictationLoad in
 *  React.useSyncExternalStore. */
export function subscribeDictationLoad(cb: () => void): () => void {
  loadListeners.add(cb);
  return () => { loadListeners.delete(cb); };
}

function progressLogger(label: string, onProgress?: (frac: number) => void) {
  const t0 = performance.now();
  const secs = () => ((performance.now() - t0) / 1000).toFixed(1);
  const seen: Record<string, number> = {};
  const frac: Record<string, number> = {}; // per-file fraction 0..1, averaged for the aggregate bar
  const report = () => {
    if (!onProgress) return;
    const vals = Object.values(frac);
    onProgress(vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0);
  };
  const cb = (p: { status?: string; file?: string; progress?: number }) => {
    if (!p.file) return;
    if (p.status === 'initiate') { console.log(`[whisper:${label}] fetching ${p.file}… (${secs()}s)`); frac[p.file] = frac[p.file] ?? 0; report(); }
    else if (p.status === 'done') { console.log(`[whisper:${label}] ✓ ${p.file} (${secs()}s)`); frac[p.file] = 1; report(); }
    else if (p.status === 'progress' && typeof p.progress === 'number') {
      const step = Math.floor(p.progress / 25) * 25; // 0/25/50/75/100
      if (seen[p.file] !== step) { seen[p.file] = step; console.log(`[whisper:${label}] ${p.file}: ${step}% (${secs()}s)`); }
      frac[p.file] = p.progress / 100; report();
    }
  };
  return { cb, secs };
}

// Small English model (load directly, skip the heavy turbo). q8 on WebGPU, WASM fallback. Always pins the
// host back to HuggingFace in case a turbo load left env pointed at R2.
async function buildEnglish(modelId: string, onProgress?: (frac: number) => void): Promise<Whisper> {
  const mod = await getTransformers();
  mod.env.remoteHost = HF_HOST;
  mod.env.remotePathTemplate = HF_PATH;
  const { cb, secs } = progressLogger(modelId, onProgress);
  try {
    const pipe = await mod.pipeline('automatic-speech-recognition', modelId, { device: 'webgpu', dtype: 'q8', progress_callback: cb });
    console.log(`[whisper] ready (${modelId} / WebGPU, ${secs()}s)`);
    return pipe;
  } catch {
    const pipe = await mod.pipeline('automatic-speech-recognition', modelId, { dtype: 'q8', progress_callback: cb });
    console.log(`[whisper] ready (${modelId} / wasm, ${secs()}s)`);
    return pipe;
  }
}

// turbo (best accuracy, multilingual) on WebGPU, weights from R2.
async function buildTurbo(onProgress?: (frac: number) => void): Promise<Whisper> {
  const mod = await getTransformers();
  const { cb, secs } = progressLogger('turbo', onProgress);
  mod.env.remoteHost = R2_HOST;
  mod.env.remotePathTemplate = '{model}/'; // files live at <R2_HOST>/whisper-turbo/<file>
  const pipe = await mod.pipeline('automatic-speech-recognition', 'whisper-turbo', {
    device: 'webgpu',
    dtype: { encoder_model: 'fp16', decoder_model_merged: 'q4' },
    progress_callback: cb,
  });
  isMultilingual = true;
  console.log(`[whisper] ready (turbo / R2, ${secs()}s)`);
  return pipe;
}

function loadWhisper(): Promise<Whisper> {
  if (pipePromise) return pipePromise;
  setDictationLoad({ active: true, progress: 0, done: false });
  const report = (frac: number) => setDictationLoad({ progress: frac });
  pipePromise = (async () => {
    // Optional override: pick a lighter model than turbo via ozwellConfig.whisper.
    //   'small.en' — best speed/accuracy balance on a modest machine (RECOMMENDED if turbo is slow)
    //   'base.en'/'tiny.en' — faster, lower accuracy · 'turbo'/unset — the large multilingual model
    const pref = (whisperPref() || '').toLowerCase();
    if (pref && pref !== 'turbo' && SMALL_MODELS[pref]) {
      console.log(`[whisper] loading ${pref} (forced via ozwellConfig.whisper)…`);
      return serialize(() => buildEnglish(SMALL_MODELS[pref], report));
    }
    console.log('[whisper] loading turbo…');
    try {
      return await serialize(() => buildTurbo(report));
    } catch (e) {
      console.log(`[whisper] turbo/R2 unavailable (${e instanceof Error ? e.message : e}) → base.en fallback`);
      return serialize(() => buildEnglish('Xenova/whisper-base.en', report));
    }
  })();
  void pipePromise.then(
    () => setDictationLoad({ active: false, progress: 1, done: true }),
    // Clear the memoized promise on failure so a later call can retry (don't cache a rejection forever).
    () => { pipePromise = null; setDictationLoad({ active: false }); },
  );
  return pipePromise;
}

// Independent fast model for the stop-confirm check (only needs to spot "done"). Separate from the
// dictation pipe so the heavy turbo stays the final-transcription path. base.en ≈ 75 MB.
function loadGate(): Promise<Whisper> {
  if (gatePromise) return gatePromise;
  console.log('[whisper] loading stop-confirm gate (base.en)…');
  gatePromise = serialize(() => buildEnglish(GATE_MODEL));
  // Clear on failure so a transient error (CSP/network) doesn't permanently break the stop-confirm gate.
  void gatePromise.catch(() => { gatePromise = null; });
  return gatePromise;
}

/** True only once the dictation model has actually finished loading (not merely started, not rejected). */
export function isWhisperLoaded(): boolean {
  return getDictationLoad().done;
}

/** Start loading the dictation model NOW so the first dictation doesn't pay the load. Memoized. */
export function warmWhisper(): void {
  void loadWhisper();
}

/** Start loading the stop-confirm gate model (base.en) NOW so the first "ozwell I'm done" confirm
 *  doesn't wait on it. Warm this BEFORE warmWhisper so the small model isn't queued behind slow turbo. */
export function warmStopGate(): void {
  void loadGate();
}

// Downmix all channels of a decoded buffer to mono (average), so stereo recordings don't lose half the
// signal. Single-channel buffers pass through.
function downmixToMono(audio: AudioBuffer): Float32Array {
  if (audio.numberOfChannels <= 1) return audio.getChannelData(0);
  const n = audio.length;
  const out = new Float32Array(n);
  for (let ch = 0; ch < audio.numberOfChannels; ch++) {
    const data = audio.getChannelData(ch);
    for (let i = 0; i < n; i++) out[i] += data[i];
  }
  for (let i = 0; i < n; i++) out[i] /= audio.numberOfChannels;
  return out;
}

// Linear-resample mono audio to 16 kHz (what Whisper wants). Shared by the blob + raw-samples paths.
function resampleTo16kMono(src: Float32Array, sampleRate: number): Float32Array {
  const ratio = 16000 / sampleRate;
  const n = Math.round(src.length * ratio);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / ratio;
    const i0 = Math.floor(t);
    const i1 = Math.min(i0 + 1, src.length - 1);
    out[i] = src[i0] + (src[i1] - src[i0]) * (t - i0);
  }
  return out;
}

// trimEndSeconds: drop this many seconds off the END of the audio before transcribing (so Whisper
// never hears the spoken stop phrase). Pair with stripStopPhrase as a text-level backstop.
export async function transcribeBlob(blob: Blob, trimEndSeconds = 0): Promise<string> {
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new Ctx();
  // try/finally so a decode/read failure (corrupt/unsupported blob) still closes the context — otherwise
  // a thrown decodeAudioData leaks the AudioContext, and they accumulate across retries.
  let samples: Float32Array;
  try {
    const audio = await ctx.decodeAudioData(await blob.arrayBuffer());
    samples = resampleTo16kMono(downmixToMono(audio), audio.sampleRate);
  } finally {
    void ctx.close();
  }
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

// Server-ASR model id (override via localStorage ozwellConfig.serverWhisper); defaults to the
// OpenAI-compatible 'whisper-1'.
function serverAsrModel(): string {
  try { return JSON.parse(localStorage.getItem('ozwellConfig') || '{}').serverWhisper || 'whisper-1'; } catch { return 'whisper-1'; }
}

/** Server-side transcription: POST the recorded audio to the OpenAI-compatible /v1/audio/transcriptions
 *  endpoint (same baseURL/apiKey as the chat). NOTE: audio LEAVES the browser — the on-device path
 *  (transcribeBlob) is the PHI-safe default; this is the experiment alternative. Throws on HTTP error so
 *  the caller can fall back to on-device. */
export async function transcribeServer(blob: Blob): Promise<string> {
  const cfg = getOzwellConfig();
  const form = new FormData();
  form.append('file', blob, 'audio.webm');
  form.append('model', serverAsrModel());
  const url = `${cfg.baseURL.replace(/\/$/, '')}/v1/audio/transcriptions`;
  const headers: Record<string, string> = {};
  if (cfg.apiKey && cfg.apiKey !== 'ollama') headers.Authorization = `Bearer ${cfg.apiKey}`;
  const res = await fetch(url, { method: 'POST', headers, body: form });
  if (!res.ok) throw new Error(`Server ASR ${res.status}: ${res.statusText}`);
  const data = await res.json();
  return (typeof data?.text === 'string' ? data.text : '').trim();
}

/** Stop-confirm gate: transcribe a short raw-sample window (e.g. the rolling recorder's last ~2s) with the
 *  FAST model and return the text. Used to verify a "ozwell i'm done" wake actually ended with "done"
 *  before committing the stop. Cheap — accuracy on the lone word "done" is all it needs. */
export async function transcribeGate(samples: Float32Array, sampleRate: number): Promise<string> {
  const pipe = await loadGate();
  const out = await pipe(resampleTo16kMono(samples, sampleRate), { chunk_length_s: 30 });
  return (out?.text ?? '').trim();
}

/** Peel a trailing "ozwell i'm done"-style stop phrase off the end of a transcript. Mirrors the
 *  standalone demo: handles Whisper's mishearings (Ozwell / As well / Also / Oswald / "I am done")
 *  including the bare word alone. Bare "as well" is NOT stripped (too common) unless joined to "i'm done". */
export function stripStopPhrase(text: string): string {
  const tail = /(?:\b(?:oz\s*well|all['’]?s?\s*well|as\s*well|also|oswald)\b\s*,?\s*i(?:['’]?m|\s+am)\s+done\b|\b(?:oz\s*well|all['’]?s\s*well|oswald)\b|\bi(?:['’]?m|\s+am)\s+done\b|\b(?:that\s+was\s+|was\s+)?well\s+done\b|\bthat['’]?s?\s+(?:was\s+)?all\b|\bthank(?:s|\s+you)(?:\s+for\s+watching)?\b|\bbye\b)[\s.,!?-]*$/i;
  let prev: string | null = null;
  let t = text;
  while (t !== prev && t) { prev = t; t = t.replace(tail, '').replace(/[\s.,!?-]+$/, ''); }
  return t.trim();
}

/** True if a transcript ENDS with a clear "done" stop ("…done" / "…I'm done" / "…all done" / "…well done"),
 *  tolerating trailing punctuation. Deliberately STRICTER than stripStopPhrase: the stop-confirm gate must
 *  NOT fire on a bare "ozwell" or a mid-sentence "done" — "we're almost done here" ends on "here", so no
 *  match. Favors precision: a missed real stop just means "say it again"; a false stop loses dictation. */
export function endsWithDone(text: string): boolean {
  return /\b(?:i(?:['’]?m|\s+am)\s+|all\s+|well\s+)?done\b[\s.,!?-]*$/i.test(text);
}
