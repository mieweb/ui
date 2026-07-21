/**
 * On-device Whisper transcription (Transformers.js from CDN, no install).
 * Shared by the AIChat voice story and the hands-free composition.
 *
 * Whisper runs in a dedicated Web Worker (see WORKER_SRC below) so its heavy download + model
 * instantiation + inference never runs on the main thread. That matters because the on-device WAKE
 * detector runs its ONNX inference on the main thread (single-threaded WASM); before this, loading the
 * ~1.3 GB turbo model starved the wake loop and "hey ozwell" wasn't detected until Whisper had loaded.
 * The worker relocates the compute only — same models, same output, same PHI-safe on-device path (audio
 * never leaves the page). The public API here is unchanged; callers don't know a worker exists.
 *
 * transcribeBlob(blob) — decode a recorded blob → 16 kHz mono → transcribe in the worker → text.
 * transcribeGate(samples) — a SECOND, fast (base.en) model used only for the hands-free "stop-confirm"
 * check. Independent of the dictation model so the heavy turbo stays the final-transcription path.
 */
import { registerModelServiceWorker } from './modelCache';
import { getOzwellConfig } from './ozwellChat';
import type { TranscriptSegment } from './diarize';

const HF_HOST = 'https://huggingface.co';
const HF_PATH = '{model}/resolve/{revision}/';
// turbo's weights are served from our Cloudflare R2 bucket, which sends a Content-Length header so
// transformers.js can stream it into the Cache API (HuggingFace Xet doesn't → re-downloads ~1.3GB each
// open). This is the DEFAULT; it's runtime-overridable (see whisperHost) so the hosting cutover is a
// pure-config swap, consistent with the wake/speaker assets and the transformers CDN. See MODEL-HOSTING.md.
const R2_HOST = 'https://pub-64db68afc2cb4e108ff06e7e583f09d1.r2.dev';

// Where the turbo Whisper weights load from. Defaults to R2_HOST, overridable at runtime so a consumer can
// repoint EVERY model to a mieweb-owned host with zero source edits — mirrors `window.__ozwellAssets`
// (wake/speaker) and `window.__ozwellTransformersUrl` (the ESM). Checks current → parent → top frame
// (Storybook iframe) → localStorage `ozwellConfig.whisperHost`. Trailing slash trimmed (the worker adds it).
function whisperHost(): string {
  if (typeof window === 'undefined') return R2_HOST;
  const fromWin = (w?: Window | null): string | undefined => {
    try {
      return (w as unknown as { __ozwellWhisperHost?: string })
        ?.__ozwellWhisperHost;
    } catch {
      return undefined;
    }
  };
  const win = fromWin(window) || fromWin(window.parent) || fromWin(window.top);
  if (win) return win.replace(/\/$/, '');
  try {
    const h = JSON.parse(
      localStorage.getItem('ozwellConfig') || '{}'
    ).whisperHost;
    if (h) return String(h).replace(/\/$/, '');
  } catch {
    /* ignore */
  }
  return R2_HOST;
}

const SMALL_MODELS: Record<string, string> = {
  tiny: 'Xenova/whisper-tiny.en',
  'tiny.en': 'Xenova/whisper-tiny.en',
  base: 'Xenova/whisper-base.en',
  'base.en': 'Xenova/whisper-base.en',
  small: 'Xenova/whisper-small.en',
  'small.en': 'Xenova/whisper-small.en',
};
const GATE_MODEL = 'Xenova/whisper-base.en'; // stop-confirm: fast + reliable on the single word "done"

// Optional model override, read from the same ozwellConfig used by the chat. Set
// `{ ..., whisper: 'base.en' }` to force the small (~75 MB) English model instead of the heavy turbo
// one — much faster to download and runs even when browser storage is tight/over-quota. Checks current →
// parent → top frame (Storybook iframe) and localStorage. Resolved HERE (main thread) and passed into the
// worker, which can't read window/localStorage.
function whisperPref(): string | null {
  if (typeof window === 'undefined') return null; // SSR / Node — no window/localStorage
  const fromWin = (w?: Window | null): string | undefined => {
    try {
      return (w as unknown as { __ozwell?: { whisper?: string } })?.__ozwell
        ?.whisper;
    } catch {
      return undefined;
    }
  };
  const win = fromWin(window) || fromWin(window.parent) || fromWin(window.top);
  if (win) return win;
  try {
    return (
      JSON.parse(localStorage.getItem('ozwellConfig') || '{}').whisper || null
    );
  } catch {
    return null;
  }
}

// Optional inference-device override for the small English models: set
// `window.__ozwell.whisperDevice = 'wasm'` (or `ozwellConfig.whisperDevice` in localStorage) to skip the
// WebGPU attempt. WebGPU on software/broken adapters (headless & automation browsers, some VMs) can
// "succeed" while computing garbage tokens — wasm is slower but always correct. Same window→parent→top→
// localStorage resolution as the model pref.
function whisperDevice(): string | null {
  if (typeof window === 'undefined') return null;
  const fromWin = (w?: Window | null): string | undefined => {
    try {
      return (w as unknown as { __ozwell?: { whisperDevice?: string } })
        ?.__ozwell?.whisperDevice;
    } catch {
      return undefined;
    }
  };
  const win = fromWin(window) || fromWin(window.parent) || fromWin(window.top);
  if (win) return win;
  try {
    return (
      JSON.parse(localStorage.getItem('ozwellConfig') || '{}').whisperDevice ||
      null
    );
  } catch {
    return null;
  }
}

// Pinned to an EXACT validated version (a floating `@3` lets jsDelivr serve newer 3.x that can break at
// runtime). Override the ESM URL for strict-CSP / offline / self-hosted setups via
// `window.__ozwellTransformersUrl` or `localStorage['ozwellTransformersUrl']`.
const DEFAULT_TRANSFORMERS_URL =
  'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1';
function transformersUrl(): string {
  try {
    const w = (window as unknown as { __ozwellTransformersUrl?: string })
      .__ozwellTransformersUrl;
    if (w) return w;
    const ls = localStorage.getItem('ozwellTransformersUrl');
    if (ls) return ls;
  } catch {
    /* ignore */
  }
  return DEFAULT_TRANSFORMERS_URL;
}

// --- dictation-model load progress, surfaced to the UI (the ~1.3GB turbo download is the slow one) ---
export interface WhisperLoadState {
  /** A load is in flight. */ active: boolean;
  /** Overall fraction 0..1 (averaged over the model's files). */ progress: number;
  /** The model is loaded. */ done: boolean;
}
let dictationLoad: WhisperLoadState = {
  active: false,
  progress: 0,
  done: false,
};
const loadListeners = new Set<() => void>();
function setDictationLoad(patch: Partial<WhisperLoadState>): void {
  dictationLoad = { ...dictationLoad, ...patch };
  loadListeners.forEach((l) => l());
}
/** Current dictation-model load state (for a progress indicator). */
export function getDictationLoad(): WhisperLoadState {
  return dictationLoad;
}
/** Subscribe to dictation-model load changes; returns an unsubscribe. Pair with getDictationLoad in
 *  React.useSyncExternalStore. */
export function subscribeDictationLoad(cb: () => void): () => void {
  loadListeners.add(cb);
  return () => {
    loadListeners.delete(cb);
  };
}

// ---------------------------------------------------------------------------------------------------------
// The Whisper worker. Inlined as a string + spawned from a Blob URL so it bundles cleanly in the tsup-built
// library (no reliance on the consumer's bundler handling worker URLs). It's a MODULE worker so it can
// `import()` transformers.js from the CDN. Config (URLs, model prefs) is passed in via the 'init' message
// because a worker can't read window/localStorage. Message protocol:
//   main→worker: {type:'init', cfg} · {type:'warm'} · {type:'warmGate'} · {type:'transcribe', id, want, samples}
//   worker→main: {type:'loadState', patch} · {type:'progress', frac} · {type:'result', id, text, chunks} · {type:'error', id, message}
// A model load mutates the SHARED env.remoteHost (turbo→whisperHost, english→HF), read per-file as
// transformers.js fetches — so every load is serialized through one chain to avoid mid-download clobber.
const WORKER_SRC = `
let cfg = null, modP = null, pipeP = null, gateP = null, isMulti = false;
let chain = Promise.resolve();
const serialize = (fn) => { const r = chain.then(fn, fn); chain = r.then(() => {}, () => {}); return r; };

function getMod() {
  if (modP) return modP;
  modP = (async () => {
    const mod = await import(cfg.transformersUrl);
    mod.env.allowLocalModels = false;
    // transformers.js's OWN cache STREAMS the model straight to the Cache API (how whisper-web caches this
    // 1.2GB turbo model). A hand-rolled SW that buffers the whole file chokes (QuotaExceeded).
    mod.env.useBrowserCache = true;
    mod.env.backends.onnx.wasm.numThreads = 1;
    try { if (navigator.storage && navigator.storage.persist) await navigator.storage.persist(); } catch (e) {}
    return mod;
  })();
  return modP;
}

function progressCb() {
  const frac = {};
  const report = () => {
    const v = Object.values(frac);
    self.postMessage({ type: 'progress', frac: v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0 });
  };
  return (p) => {
    if (!p || !p.file) return;
    if (p.status === 'initiate') { frac[p.file] = frac[p.file] || 0; report(); }
    else if (p.status === 'done') { frac[p.file] = 1; report(); }
    else if (p.status === 'progress' && typeof p.progress === 'number') { frac[p.file] = p.progress / 100; report(); }
  };
}

async function buildEnglish(modelId) {
  const mod = await getMod();
  mod.env.remoteHost = cfg.hfHost;
  mod.env.remotePathTemplate = cfg.hfPath;
  if ((cfg.whisperDevice || '').toLowerCase() !== 'wasm') {
    try {
      const pipe = await mod.pipeline('automatic-speech-recognition', modelId, { device: 'webgpu', dtype: 'q8', progress_callback: progressCb() });
      console.log('[whisper] ready (' + modelId + ' / WebGPU, worker)');
      return pipe;
    } catch (e) { /* fall through to wasm */ }
  }
  const pipe = await mod.pipeline('automatic-speech-recognition', modelId, { dtype: 'q8', progress_callback: progressCb() });
  console.log('[whisper] ready (' + modelId + ' / wasm, worker)');
  return pipe;
}

async function buildTurbo() {
  const mod = await getMod();
  mod.env.remoteHost = cfg.whisperHost;
  mod.env.remotePathTemplate = '{model}/';
  const pipe = await mod.pipeline('automatic-speech-recognition', 'whisper-turbo', {
    device: 'webgpu',
    dtype: { encoder_model: 'fp16', decoder_model_merged: 'q4' },
    progress_callback: progressCb(),
  });
  isMulti = true;
  console.log('[whisper] ready (turbo / worker)');
  return pipe;
}

function loadWhisper() {
  if (pipeP) return pipeP;
  self.postMessage({ type: 'loadState', patch: { active: true, progress: 0, done: false } });
  pipeP = (async () => {
    const pref = (cfg.whisperPref || '').toLowerCase();
    if (pref && pref !== 'turbo' && cfg.smallModels[pref]) {
      console.log('[whisper] loading ' + pref + ' (forced via ozwellConfig.whisper)…');
      return serialize(() => buildEnglish(cfg.smallModels[pref]));
    }
    console.log('[whisper] loading turbo…');
    try { return await serialize(() => buildTurbo()); }
    catch (e) {
      console.log('[whisper] turbo unavailable (' + (e && e.message ? e.message : e) + ') → base.en fallback');
      return serialize(() => buildEnglish(cfg.gateModel));
    }
  })();
  pipeP.then(
    () => self.postMessage({ type: 'loadState', patch: { active: false, progress: 1, done: true } }),
    () => { pipeP = null; self.postMessage({ type: 'loadState', patch: { active: false } }); }
  );
  return pipeP;
}

function loadGate() {
  if (gateP) return gateP;
  console.log('[whisper] loading stop-confirm gate (base.en)…');
  gateP = serialize(() => buildEnglish(cfg.gateModel));
  gateP.catch(() => { gateP = null; });
  return gateP;
}

self.onmessage = async (e) => {
  const m = e.data;
  if (!m) return;
  if (m.type === 'init') { cfg = m.cfg; return; }
  if (m.type === 'warm') { loadWhisper().catch(() => {}); return; }
  if (m.type === 'warmGate') { loadGate().catch(() => {}); return; }
  if (m.type === 'transcribe') {
    try {
      let pipe, opts;
      if (m.want === 'gate') { pipe = await loadGate(); opts = { chunk_length_s: 30 }; }
      else {
        pipe = await loadWhisper();
        if (m.want === 'segments' || m.want === 'words') opts = Object.assign({ chunk_length_s: 30, return_timestamps: m.want === 'words' ? 'word' : true }, isMulti ? { language: 'english', task: 'transcribe' } : {});
        else opts = isMulti ? { chunk_length_s: 30, language: 'english', task: 'transcribe' } : { chunk_length_s: 30 };
      }
      const out = await pipe(m.samples, opts);
      self.postMessage({ type: 'result', id: m.id, text: (out && out.text ? out.text : '').trim(), chunks: (out && out.chunks) || null });
    } catch (err) {
      self.postMessage({ type: 'error', id: m.id, message: err && err.message ? err.message : String(err) });
    }
  }
};
`;

type WorkerResult = {
  text: string;
  chunks: { timestamp: [number, number | null]; text?: string }[] | null;
};
let worker: Worker | null = null;
let reqId = 0;
const pending = new Map<
  number,
  { resolve: (r: WorkerResult) => void; reject: (e: Error) => void }
>();

function buildWorkerCfg() {
  return {
    transformersUrl: transformersUrl(),
    whisperHost: whisperHost(),
    whisperPref: whisperPref(),
    whisperDevice: whisperDevice(),
    hfHost: HF_HOST,
    hfPath: HF_PATH,
    smallModels: SMALL_MODELS,
    gateModel: GATE_MODEL,
  };
}

function getWorker(): Worker {
  if (worker) return worker;
  registerModelServiceWorker(); // main-thread SW registration (caches the wake/sherpa models)
  const url = URL.createObjectURL(
    new Blob([WORKER_SRC], { type: 'application/javascript' })
  );
  const w = new Worker(url, { type: 'module' });
  w.onmessage = (e: MessageEvent) => {
    const m = e.data;
    if (!m) return;
    if (m.type === 'loadState') {
      setDictationLoad(m.patch);
      return;
    }
    if (m.type === 'progress') {
      setDictationLoad({ progress: m.frac });
      return;
    }
    if (m.type === 'result') {
      const p = pending.get(m.id);
      if (p) {
        pending.delete(m.id);
        p.resolve({ text: m.text, chunks: m.chunks });
      }
      return;
    }
    if (m.type === 'error') {
      const p = pending.get(m.id);
      if (p) {
        pending.delete(m.id);
        p.reject(new Error(m.message));
      }
      return;
    }
  };
  w.onerror = (e) => {
    // A worker-level failure (e.g. the transformers.js import blocked by CSP) — fail any in-flight calls so
    // callers fall back instead of hanging, and reset the load indicator.
    const err = new Error(
      `whisper worker error: ${e.message || 'failed to load'}`
    );
    pending.forEach((p) => p.reject(err));
    pending.clear();
    setDictationLoad({ active: false });
  };
  w.postMessage({ type: 'init', cfg: buildWorkerCfg() });
  worker = w;
  return worker;
}

// Post a transcribe request to the worker; the 16 kHz mono samples are TRANSFERRED (zero-copy). Resolves
// with the worker's { text, chunks }.
function callWorker(
  want: 'text' | 'segments' | 'words' | 'gate',
  samples: Float32Array
): Promise<WorkerResult> {
  const w = getWorker();
  const id = ++reqId;
  return new Promise<WorkerResult>((resolve, reject) => {
    pending.set(id, { resolve, reject });
    w.postMessage({ type: 'transcribe', id, want, samples }, [samples.buffer]);
  });
}

/** True only once the dictation model has actually finished loading (not merely started, not rejected). */
export function isWhisperLoaded(): boolean {
  return getDictationLoad().done;
}

/** Start loading the dictation model NOW (in the worker) so the first dictation doesn't pay the load. */
export function warmWhisper(): void {
  getWorker().postMessage({ type: 'warm' });
}

/** Start loading the stop-confirm gate model (base.en) in the worker. Warm this BEFORE warmWhisper so the
 *  fast model isn't queued behind slow turbo. */
export function warmStopGate(): void {
  getWorker().postMessage({ type: 'warmGate' });
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

// Linear-resample mono audio to 16 kHz (what Whisper wants). Shared by the blob + raw-samples paths. Always
// returns a fresh, standalone Float32Array (safe to transfer to the worker).
function resampleTo16kMono(
  src: Float32Array,
  sampleRate: number
): Float32Array {
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

// Decode a recorded Blob → 16 kHz mono Float32 (what Whisper + TitaNet want). decodeAudioData needs the
// main thread (no AudioContext in workers), but it's cheap; the heavy inference is what moved off-thread.
// try/finally so a failed decode still closes the AudioContext (they'd otherwise leak across retries).
export async function decodeTo16kMono(blob: Blob): Promise<Float32Array> {
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;
  const ctx = new Ctx();
  try {
    const audio = await ctx.decodeAudioData(await blob.arrayBuffer());
    return resampleTo16kMono(downmixToMono(audio), audio.sampleRate);
  } finally {
    void ctx.close();
  }
}

/** Encode 16 kHz mono Float32 samples as a 16-bit PCM WAV blob, so a trimmed clip can flow back through the
 *  existing blob-based transcribe/diarize/server paths (which decode it). */
function encodeWav16kMono(samples: Float32Array): Blob {
  const sr = 16000;
  const buf = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buf);
  const str = (o: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i));
  };
  str(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  str(8, 'WAVE');
  str(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sr, true);
  view.setUint32(28, sr * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  str(36, 'data');
  view.setUint32(40, samples.length * 2, true);
  let o = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    o += 2;
  }
  return new Blob([buf], { type: 'audio/wav' });
}

/**
 * Trim the spoken "ozwell i'm done" off the END of a clip BEFORE it reaches ASR. Whisper mishears the phrase
 * differently every time ("all was well" / "I was long done" / …), so stripping the transcript text can
 * never catch them all — the reliable fix is to cut the audio so the phrase is never transcribed.
 *
 * `phraseHintSec` (from the wake detector's detection run) is an estimate of the phrase's length. When
 * given, the cut is anchored at `end - phraseHintSec` and snapped to the nearest pause within ~0.35 s — so
 * it works whether or not the speaker paused (the pause-independent case that pure energy can't handle).
 * Without a hint, it walks back from the end to the last natural pause (energy only). Capped so it never
 * removes too much. Returns a trimmed WAV blob (or the original on failure / nothing sensible to cut). Only
 * call on a PHRASE-triggered stop — not a manual button stop, where there's no phrase to remove.
 */
export async function trimTrailingStopPhrase(
  blob: Blob,
  phraseHintSec = 0
): Promise<Blob> {
  let samples: Float32Array;
  try {
    samples = await decodeTo16kMono(blob);
  } catch {
    return blob;
  }
  const SR = 16000;
  const n = samples.length;
  if (n < SR * 0.8) return blob; // too short to safely trim

  // Short-time energy (RMS) per 30 ms frame.
  const fr = Math.round(SR * 0.03);
  const nf = Math.ceil(n / fr);
  const e = new Float32Array(nf);
  let peak = 0;
  for (let f = 0; f < nf; f++) {
    const a = f * fr,
      b = Math.min(n, a + fr);
    let s = 0;
    for (let i = a; i < b; i++) s += samples[i] * samples[i];
    e[f] = Math.sqrt(s / (b - a));
    if (e[f] > peak) peak = e[f];
  }
  const sil = Math.max(0.008, peak * 0.15); // "silence" threshold, adaptive to the clip's level
  const minGap = Math.max(1, Math.round((0.15 * SR) / fr)); // a real pause = >= ~150 ms of silence
  const maxTrimFrames = Math.round((2.2 * SR) / fr); // never cut more than ~2.2 s
  const floor = Math.max(0, nf - maxTrimFrames);

  let cutFrame: number;
  if (phraseHintSec > 0.2) {
    // Detector-anchored: the phrase is the last ~phraseHintSec. Snap to the nearest quiet frame within a
    // window of that anchor (catches the pause/word-boundary before the phrase even when it's very brief);
    // if none is near, cut at the anchor itself. Pause-independent.
    const anchor = Math.max(0, nf - Math.round((phraseHintSec * SR) / fr));
    const win = Math.round((0.35 * SR) / fr);
    let best = -1,
      bestDist = Infinity;
    for (
      let f = Math.max(0, anchor - win);
      f <= Math.min(nf - 1, anchor + win);
      f++
    ) {
      if (e[f] < sil) {
        const dist = Math.abs(f - anchor);
        if (dist < bestDist) {
          bestDist = dist;
          best = f;
        }
      }
    }
    cutFrame = best >= 0 ? best : anchor;
  } else {
    // Energy-only fallback: walk back from the end to the last sustained pause.
    let k = nf - 1;
    while (k >= floor && e[k] < sil) k--; // skip any trailing quiet after "done"
    cutFrame = -1;
    while (k >= floor) {
      if (e[k] < sil) {
        let m = k;
        while (m >= floor && e[m] < sil) m--; // measure this silence run
        if (k - m >= minGap) {
          cutFrame = k + 1;
          break;
        } // sustained pause → the phrase starts after it
        k = m; // micro-pause inside the phrase → keep going back
      } else k--;
    }
    if (cutFrame < 0) cutFrame = Math.max(0, nf - Math.round((1.1 * SR) / fr)); // no pause → conservative fixed trim
  }
  cutFrame = Math.max(cutFrame, floor); // enforce the max-trim cap
  const cutSample = Math.min(n, cutFrame * fr);
  if (cutSample < SR * 0.2) return blob; // would leave almost nothing — bail (text-strip covers it)
  return encodeWav16kMono(samples.subarray(0, cutSample));
}

export async function transcribeBlob(
  blob: Blob,
  trimEndSeconds = 0
): Promise<string> {
  let samples = await decodeTo16kMono(blob);
  if (trimEndSeconds > 0) {
    const cut = Math.round(trimEndSeconds * 16000);
    if (samples.length > cut + 16000)
      samples = samples.slice(0, samples.length - cut); // keep >=1s (slice = standalone buffer)
  }
  const out = await callWorker('text', samples);
  return (out.text ?? '').trim();
}

/** Transcribe raw mono samples (any sample rate) → text. For the live dictation caption, where we re-run
 *  the growing utterance every couple seconds; the FINAL send still uses transcribeBlob. */
export async function transcribeSamples(
  samples: Float32Array,
  sampleRate: number
): Promise<string> {
  const out = await callWorker('text', resampleTo16kMono(samples, sampleRate));
  return (out.text ?? '').trim();
}

/** Map raw worker chunks (`{ timestamp: [s, e], text }`) to TranscriptSegments in seconds. */
function chunksToSegments(
  chunks: WorkerResult['chunks']
): TranscriptSegment[] {
  return (chunks ?? [])
    .map((c) => ({
      start: c.timestamp?.[0] ?? 0,
      end: c.timestamp?.[1] ?? c.timestamp?.[0] ?? 0,
      text: (c.text ?? '').trim(),
    }))
    .filter((s) => s.text);
}

/** Transcribe with timestamps → segments `[{ start, end, text }]`, for diarization (align speaker turns to
 *  text). Returns 16 kHz-relative seconds. See `useDiarization`. */
export async function transcribeSegments(
  blob: Blob
): Promise<TranscriptSegment[]> {
  const samples = await decodeTo16kMono(blob);
  const out = await callWorker('segments', samples);
  return chunksToSegments(out.chunks);
}

/** Transcribe with WORD-level timestamps → `[{ start, end, text }]` (seconds), one entry per word — the
 *  shape word-level editors (MediaEditor) need. Uses transformers.js `return_timestamps: 'word'`
 *  (cross-attention alignment). Some models/runtimes reject word-level alignment — callers should catch
 *  and fall back to `transcribeSegments`. */
export async function transcribeWords(
  blob: Blob
): Promise<TranscriptSegment[]> {
  const samples = await decodeTo16kMono(blob);
  const out = await callWorker('words', samples);
  return chunksToSegments(out.chunks);
}

// Server-ASR model id (override via localStorage ozwellConfig.serverWhisper); defaults to the
// OpenAI-compatible 'whisper-1'.
function serverAsrModel(): string {
  try {
    return (
      JSON.parse(localStorage.getItem('ozwellConfig') || '{}').serverWhisper ||
      'whisper-1'
    );
  } catch {
    return 'whisper-1';
  }
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
  if (cfg.apiKey && cfg.apiKey !== 'ollama')
    headers.Authorization = `Bearer ${cfg.apiKey}`;
  const res = await fetch(url, { method: 'POST', headers, body: form });
  if (!res.ok) {
    // statusText is often empty — include a short body snippet so the failure is actionable (the caller
    // still catches this and falls back to on-device transcription).
    const body = await res.text().catch(() => '');
    throw new Error(
      `Server ASR ${res.status}: ${res.statusText || body.slice(0, 200) || 'request failed'}`
    );
  }
  const data = await res.json();
  return (typeof data?.text === 'string' ? data.text : '').trim();
}

/** Stop-confirm gate: transcribe a short raw-sample window (e.g. the rolling recorder's last ~2s) with the
 *  FAST model and return the text. Used to verify a "ozwell i'm done" wake actually ended with "done"
 *  before committing the stop. Cheap — accuracy on the lone word "done" is all it needs. */
export async function transcribeGate(
  samples: Float32Array,
  sampleRate: number
): Promise<string> {
  const out = await callWorker('gate', resampleTo16kMono(samples, sampleRate));
  return (out.text ?? '').trim();
}

/** Peel a trailing "ozwell i'm done"-style stop phrase off the end of a transcript. Mirrors the
 *  standalone demo: handles Whisper's mishearings (Ozwell / As well / All('s/was) well / Also / Oswald /
 *  "I am done") including the bare word alone. Bare "as well" is NOT stripped (too common) unless joined
 *  to "i'm done". */
export function stripStopPhrase(text: string): string {
  // All whitespace quantifiers are BOUNDED ({0,4}/{1,4}) so backtracking through the optional groups
  // stays constant — ReDoS hardening (transcript words are never separated by more than a couple of
  // spaces, so behavior is unchanged). The trailing-junk trim below uses a linear char walk for the
  // same reason (see trimTrailingPunct — the actual CodeQL js/polynomial-redos finding).
  const tail =
    /(?:\b(?:oz\s{0,4}well|all(?:['’]?s|\s{1,4}was)?\s{0,4}well|as\s{0,4}well|also|oswald)\b[\s,]{0,6}i(?:['’]?m|\s{1,4}am)\s{1,4}done\b|\b(?:oz\s{0,4}well|all(?:['’]?s|\s{1,4}was)?\s{0,4}well|oswald)\b|\bi(?:['’]?m|\s{1,4}am)\s{1,4}done\b|\b(?:that\s{1,4}was\s{1,4}|was\s{1,4})?well\s{1,4}done\b|\bthat['’]?s?\s{1,4}(?:was\s{1,4})?all\b|\bthank(?:s|\s{1,4}you)(?:\s{1,4}for\s{1,4}watching)?\b|\bbye\b)[\s.,!?-]{0,24}$/i;
  let prev: string | null = null;
  let t = text;
  while (t !== prev && t) {
    prev = t;
    t = trimTrailingPunct(t.replace(tail, ''));
  }
  return t.trim();
}

/** Strip trailing whitespace/punctuation with a linear char walk. The regex form `/[\s.,!?-]+$/` restarts
 *  its scan at every position of a long trailing run (quadratic on adversarial input — the CodeQL
 *  js/polynomial-redos finding on stripStopPhrase). Testing one char at a time can't backtrack. */
function trimTrailingPunct(s: string): string {
  let end = s.length;
  while (end > 0 && /[\s.,!?-]/.test(s[end - 1])) end--;
  return end === s.length ? s : s.slice(0, end);
}

/** True if a transcript ENDS with a clear "done" stop ("…done" / "…I'm done" / "…all done" / "…well done"),
 *  tolerating trailing punctuation. Deliberately STRICTER than stripStopPhrase: the stop-confirm gate must
 *  NOT fire on a bare "ozwell" or a mid-sentence "done" — "we're almost done here" ends on "here", so no
 *  match. Favors precision: a missed real stop just means "say it again"; a false stop loses dictation. */
export function endsWithDone(text: string): boolean {
  // Whitespace bounded for the same polynomial-backtracking reason as stripStopPhrase's tail regex.
  return /\b(?:i(?:['’]?m|\s{1,4}am)\s{1,4}|all\s{1,4}|well\s{1,4})?done\b[\s.,!?-]{0,24}$/i.test(
    text
  );
}
