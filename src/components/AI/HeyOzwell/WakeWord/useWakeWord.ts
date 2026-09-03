/**
 * useWakeWord — a headless React hook around the on-device wake-word detector.
 *
 * Phase 1 (this file): DETECTION only. It loads the tiny wake models + the mel/embedding/VAD front-end
 * (from `<assetBase>/wakeword/*`, defaulting to the hosted assets in `DEFAULT_ASSET_BASE` — override via
 * the `assetBase` prop, `window.__ozwellAssets`, or `localStorage['ozwellAssetBase']`; see MODEL-HOSTING.md)
 * and fires `onWake(name)` when it hears "hey ozwell" / "ozwell i'm done". All in-browser; audio stays local.
 *
 * Phase 2 (later): the WHO speaker gate (TitaNet) so only the enrolled doctor's voice triggers it.
 *
 * The detector itself is the framework-agnostic `HeyBuddy` class vendored under ./lib (vanilla JS).
 * Needs `onnxruntime-web` (pnpm add) and the VAD model at /wakeword/silero-vad.onnx.
 */
import * as React from 'react';
import { registerModelServiceWorker } from '../../modelCache';
import { getModelBytes } from './lib/opfs.js';

export interface UseWakeWordOpts {
  /** Fired with the phrase name ("hey-ozwell" | "ozwell-i'm-done") on a detection. */
  onWake?: (name: string) => void;
  /** Fired with the CAPTURED audio of a wake utterance (the phrase the model just heard) + which phrase.
   *  Use for phrase-validated enrollment: the wake firing IS the proof it was actually the phrase. */
  onUtterance?: (name: string, samples: Float32Array) => void;
  /** Per-phrase fire thresholds (0..1). Default 0.8 (hey-ozwell) / 0.5 (ozwell I'm done). Updates apply
   *  live (read per-frame). */
  thresholds?: Record<string, number>;
  /** VAD gate (0..1): `positive` = speech-detect, `negative` = silence. Defaults 0.05 / 0.03. Live. */
  vadThresholds?: { positive?: number; negative?: number };
  /** Set false to not start listening. */
  enabled?: boolean;
  /** ROOT base URL the wake model files are served from (`/wakeword/*` is appended). Defaults to the hosted
   *  assets (`DEFAULT_ASSET_BASE`). Same shape as the string `window.__ozwellAssets` /
   *  `localStorage['ozwellAssetBase']` override — see AI/MODEL-HOSTING.md. */
  assetBase?: string;
  /** Auto-register the model-cache service worker (opt-out). Default true. Set false in a host that doesn't
   *  serve `/ozwell-model-sw.js` (avoids repeated registration failures) — models still load, just uncached. */
  registerServiceWorker?: boolean;
}

export interface WakeWordState {
  ready: boolean;
  error: string | null;
  /** VAD speech probability, 0..1 (is someone talking). */
  speech: number;
  /** Live per-phrase wake probability, 0..1. */
  probs: Record<string, number>;
}

export interface WakeWordControls {
  /** The detector's mic stream (so a host can add a 2nd consumer — never a 2nd getUserMedia). */
  getStream: () => MediaStream | null;
  /** The frozen fire-frame embedding from the last wake — the WHAT-gate input (capture at enroll, check at verify). */
  getLastEmbedding: () => Float32Array | null;
  /** The peak fire confidence (probability) of the last wake — frozen at the fire, so not stale. */
  getLastProb: () => number;
  /** Approx spoken duration (seconds) of the last wake phrase, from its detection run — used to trim the
   *  phrase off the recorded audio without needing a pause before it. 0 if unknown. */
  getLastWakeDuration: () => number;
  /** Store / check / clear a phrase's enrolled phrase-print templates (the WHAT gate). */
  setVoiceprint: (name: string, vectors: Float32Array[]) => void;
  hasVoiceprint: (name: string) => boolean;
  clearVoiceprint: (name: string) => void;
  /** Raw cosine of an embedding to a phrase's templates (max over templates); null if not enrolled. */
  phraseCosine: (name: string, vec: Float32Array | null) => number | null;
}

// Default host for the wake model files. The binaries were moved off the repo (see AI/MODEL-HOSTING.md)
// so a fresh clone fetches them from here with no config. Override via the `assetBase` prop,
// window.__ozwellAssets, or localStorage['ozwellAssetBase'] (e.g. to point at a local copy).
const DEFAULT_ASSET_BASE =
  'https://huggingface.co/jlocala/ozwell-voice-assets/resolve/main';
const DEFAULT_ASSET = `${DEFAULT_ASSET_BASE}/wakeword`;
const PHRASES = ['hey-ozwell', "ozwell-i'm-done"];

// Resolve where to fetch model files from. Order: explicit prop → global `window.__ozwellAssets`
// (a base URL string, or { base, wakeword }) → `DEFAULT_ASSET` (the hosted HuggingFace base above). The
// default fetches the ~6 MB of models from the hosted repo so a fresh clone runs with no config; override
// the prop/global to point elsewhere (a local copy or a mieweb-owned host).
type AssetGlobal =
  | string
  | { base?: string; wakeword?: string; svRuntime?: string };
// Storybook runs stories in an iframe; a console-set window.__ozwellAssets often lands on the parent
// frame, so check current → parent → top (all same-origin).
function readAssetGlobal(): AssetGlobal | undefined {
  if (typeof window === 'undefined') return undefined; // SSR / Node — no window
  const get = (w?: Window | null): AssetGlobal | undefined => {
    try {
      return (w as unknown as { __ozwellAssets?: AssetGlobal })?.__ozwellAssets;
    } catch {
      return undefined;
    }
  };
  return get(window) || get(window.parent) || get(window.top);
}
function resolveAssetBase(override?: string): string {
  const strip = (s: string) => s.replace(/\/$/, '');
  // The `assetBase` prop is a ROOT base (same shape as the string `window.__ozwellAssets`), so append
  // `/wakeword` like the global form does — otherwise passing a "…/resolve/main" base 404s on the models.
  if (override) return `${strip(override)}/wakeword`;
  const g = readAssetGlobal();
  if (typeof g === 'string') return `${strip(g)}/wakeword`;
  if (g?.wakeword) return strip(g.wakeword);
  if (g?.base) return `${strip(g.base)}/wakeword`;
  // localStorage fallback — shared across Storybook frames, survives reload (the reliable path).
  try {
    const ls = localStorage.getItem('ozwellAssetBase');
    if (ls) return `${strip(ls)}/wakeword`;
  } catch {
    /* ignore */
  }
  return DEFAULT_ASSET;
}

// --- Pre-warm: fetch the wake model FILES into OPFS WITHOUT opening the mic, so the detector loads
// instantly on the first enable and the UI can show a load ring on reload while the mic stays off. ---
const WAKE_MODEL_FILES = [
  'hey-ozwell.onnx',
  "ozwell-i'm-done.onnx",
  'silero-vad.onnx',
  'speech-embedding.onnx',
  'mel-spectrogram.onnx',
];

export interface WakeWarmState {
  /** A pre-fetch is in flight. */ active: boolean;
  /** Fraction of model files cached, 0..1. */ progress: number;
  /** All files cached. */ done: boolean;
}
let wakeWarm: WakeWarmState = { active: false, progress: 0, done: false };
const warmListeners = new Set<() => void>();
function setWakeWarm(patch: Partial<WakeWarmState>): void {
  wakeWarm = { ...wakeWarm, ...patch };
  warmListeners.forEach((l) => l());
}
/** Current wake-model pre-fetch state (for a load ring). */
export function getWakeWarm(): WakeWarmState {
  return wakeWarm;
}
/** Subscribe to pre-fetch changes; pair with getWakeWarm in React.useSyncExternalStore. */
export function subscribeWakeWarm(cb: () => void): () => void {
  warmListeners.add(cb);
  return () => {
    warmListeners.delete(cb);
  };
}

let warmPromise: Promise<void> | null = null;
let warmedBase: string | null = null;
/** Pre-fetch the wake model files into OPFS (no mic, no detector). Memoized PER resolved base, so a host
 *  that later repoints model hosting re-prefetches the new base instead of reusing the first pre-warm. */
export function warmWakeModels(assetBase?: string): Promise<void> {
  const base = resolveAssetBase(assetBase);
  if (warmPromise && warmedBase === base) return warmPromise;
  warmedBase = base;
  setWakeWarm({ active: true, progress: 0, done: false });
  warmPromise = (async () => {
    let done = 0;
    await Promise.all(
      WAKE_MODEL_FILES.map(async (f) => {
        try {
          await getModelBytes(`${base}/${f}`);
        } catch (e) {
          console.warn('[wake] pre-warm failed for', f, e);
        }
        done += 1;
        setWakeWarm({ progress: done / WAKE_MODEL_FILES.length });
      })
    );
  })();
  void warmPromise.then(
    () => setWakeWarm({ active: false, progress: 1, done: true }),
    () => setWakeWarm({ active: false })
  );
  return warmPromise;
}

// Load the SAME onnxruntime-web build the working demo uses (1.19.0), as a global `ort`.
// The detector's onnx.js prefers a global `ort` over the bundled package — matching the demo's
// pinned version fixes the slow/choppy inference and behavior diffs the newer npm version caused.
const ORT_URL =
  'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.19.0/dist/ort.min.js';
let ortPromise: Promise<void> | null = null;
function ensureOrt(): Promise<void> {
  if (typeof (window as unknown as { ort?: unknown }).ort !== 'undefined')
    return Promise.resolve();
  if (ortPromise) return ortPromise; // dedupe: concurrent useWakeWord mounts share one <script> load
  ortPromise = new Promise<void>((resolve) => {
    const s = document.createElement('script');
    s.src = ORT_URL;
    s.onload = () => resolve();
    // Best-effort: if the CDN is blocked (CSP/offline), don't hard-fail — lib/onnx.js falls back to the
    // bundled onnxruntime-web ESM when `window.ort` is undefined.
    s.onerror = () => {
      console.warn(
        '[wake] onnxruntime-web CDN load failed; using the bundled ESM fallback'
      );
      ortPromise = null; // allow a retry on a later mount
      resolve();
    };
    document.head.appendChild(s);
  });
  return ortPromise;
}

export function useWakeWord(
  opts: UseWakeWordOpts = {}
): WakeWordState & WakeWordControls {
  const {
    onWake,
    onUtterance,
    thresholds,
    vadThresholds,
    enabled = true,
    assetBase,
    registerServiceWorker = true,
  } = opts;
  const [state, setState] = React.useState<WakeWordState>({
    ready: false,
    error: null,
    speech: 0,
    probs: {},
  });
  // keep the latest callbacks without re-running the effect
  const onWakeRef = React.useRef(onWake);
  onWakeRef.current = onWake;
  const onUtteranceRef = React.useRef(onUtterance);
  onUtteranceRef.current = onUtterance;
  const lastFiredRef = React.useRef<string | null>(null);
  // holds the detector so the host can reach its mic stream (one stream, many consumers — see composition)
  const hbRef = React.useRef<HeyBuddyInstance | null>(null);

  React.useEffect(() => {
    // Disabled: report not-ready so consumers re-init on the next enable. Critical now that we tear the
    // mic down on disable — a host analyser keyed on `ready` (e.g. the volume pulse) must see ready flip
    // false→true again to re-attach to the FRESH stream, not stay bound to the torn-down one. (Returns the
    // same state object when already reset, so React bails out — no needless render.)
    if (!enabled) {
      setState((s) =>
        s.ready || s.error || s.speech
          ? { ready: false, error: null, speech: 0, probs: {} }
          : s
      );
      return;
    }
    if (registerServiceWorker) registerModelServiceWorker(); // caches sherpa runtime + wasm; opt out if the host doesn't serve the SW
    let cancelled = false;

    (async () => {
      try {
        // NOTE: do NOT open a mic stream here. The detector (audio.js) opens its OWN getUserMedia;
        // opening a second one made the detector's stream come back near-silent (two concurrent mic
        // streams + echo-cancellation/AGC conflict). The detector's getUserMedia also triggers the
        // permission prompt on first run, so this isn't needed.

        // load the demo's exact onnxruntime (1.19.0) as a global BEFORE the detector imports onnx.js
        await ensureOrt();
        if (cancelled) return;

        // vendored vanilla-JS detector — dynamic import avoids TS typing the .js module
        const { HeyBuddy } = (await import('./lib/hey-buddy.js')) as {
          HeyBuddy: new (o: unknown) => HeyBuddyInstance;
        };
        if (cancelled) return;

        const ASSET = resolveAssetBase(assetBase);
        const hb = new HeyBuddy({
          modelPath: [
            `${ASSET}/hey-ozwell.onnx`,
            `${ASSET}/ozwell-i'm-done.onnx`,
          ],
          vadModelPath: `${ASSET}/silero-vad.onnx`,
          embeddingModelPath: `${ASSET}/speech-embedding.onnx`,
          spectrogramModelPath: `${ASSET}/mel-spectrogram.onnx`,
          // hey-ozwell 0.8 (product value): a short phrase that false-fires at ~0.55 on junk ("yeah bro"),
          // so 0.5 was too low — it let low-confidence misfires count as the phrase. done 0.5 (longer, safer).
          wakeWordThresholds: thresholds || {
            'hey-ozwell': 0.8,
            "ozwell-i'm-done": 0.5,
          },
          // The VAD reads low in this setup, so gate generously — the re-entrancy guard in HeyBuddy
          // keeps the wake model from overlap-crashing even if this lets it run most of the time.
          positiveVadThreshold: vadThresholds?.positive ?? 0.05,
          negativeVadThreshold: vadThresholds?.negative ?? 0.03,
        });
        hbRef.current = hb;

        hb.onProcessed((result: ProcessedResult) => {
          if (cancelled) return;
          const probs: Record<string, number> = {};
          for (const w of Object.keys(result.wakeWords || {}))
            probs[w] = result.wakeWords[w].probability || 0;
          setState((s) => ({
            ...s,
            ready: true,
            speech: result.speech?.probability || 0,
            probs,
          }));
        });

        for (const name of PHRASES)
          hb.onDetected(name, () => {
            lastFiredRef.current = name;
            onWakeRef.current?.(name);
          });
        // the captured utterance audio arrives just after a wake fires — pair it with the phrase that fired,
        // so a host can use "the model fired for phrase X" as proof the user actually said X.
        hb.onRecording((samples: Float32Array) => {
          if (lastFiredRef.current)
            onUtteranceRef.current?.(lastFiredRef.current, samples);
        });

        console.log('[wake] models ready');
        setState((s) => ({ ...s, ready: true }));

        // Mic watchdog (Copilot review): models-ready is NOT mic-ready — the detector's getUserMedia
        // happens async inside HeyBuddy, so a permission denial isn't caught by this try/catch and
        // `ready` above would otherwise report a listener that can't hear. If no mic stream (and no
        // processed audio) materializes within ~8s, surface an error instead of a silent dead octopus.
        const t0 = Date.now();
        const watchdog = window.setInterval(() => {
          if (cancelled) {
            window.clearInterval(watchdog);
            return;
          }
          if (hbRef.current?.batcher?.stream) {
            window.clearInterval(watchdog); // mic is live — all good
            return;
          }
          if (Date.now() - t0 > 8000) {
            window.clearInterval(watchdog);
            setState((s) =>
              s.error
                ? s
                : {
                    ...s,
                    error:
                      'Microphone unavailable — check the mic permission for this site.',
                  }
            );
          }
        }, 500);
      } catch (e) {
        if (!cancelled)
          setState((s) => ({
            ...s,
            error: e instanceof Error ? e.message : String(e),
          }));
      }
    })();

    // Teardown on disable/unmount: release the mic so `enabled: false` actually frees it (the gray
    // "off" state must mean the mic is off). HeyBuddy has no stop(), but its stream + AudioContext are
    // reachable via the batcher — stop the tracks (ends mic access / the OS recording indicator) and
    // close the context (tears down the audio graph). Re-enabling re-runs this effect → a fresh HeyBuddy
    // (re-getUserMedia, no re-prompt after the first grant). Mirrors the ozwellai-api landing-page toggle.
    return () => {
      cancelled = true;
      const hb = hbRef.current;
      hbRef.current = null;
      // Stop the mic + tear down the graph. If teardown lands WHILE HeyBuddy's getUserMedia is still
      // pending, batcher.stream isn't set yet — so poll briefly and release it once it appears, rather
      // than leaking a live mic stream (and the OS recording indicator) after disable/unmount.
      const release = () => {
        const b = hb?.batcher;
        if (!b?.stream) return false;
        try {
          b.stream.getTracks().forEach((t) => t.stop());
        } catch {
          /* ignore */
        }
        try {
          void b.audioContext?.close();
        } catch {
          /* ignore */
        }
        return true;
      };
      if (!release()) {
        let tries = 0;
        const iv = setInterval(() => {
          if (release() || ++tries > 50) clearInterval(iv);
        }, 100);
      }
    };
  }, [enabled, assetBase]); // eslint-disable-line react-hooks/exhaustive-deps

  // Push threshold changes to the LIVE detector. HeyBuddy reads `wakeWordThresholds` and the VAD reads its
  // speech/silence thresholds per-frame, so this takes effect immediately — no mic re-init. Re-applies when
  // the detector becomes ready (state.ready) so values set before load aren't lost.
  React.useEffect(() => {
    const hb = hbRef.current;
    if (!hb) return;
    if (thresholds) hb.wakeWordThresholds = { ...thresholds };
    if (vadThresholds && hb.vad) {
      if (vadThresholds.positive != null)
        hb.vad.speechVadThreshold = vadThresholds.positive;
      if (vadThresholds.negative != null)
        hb.vad.silenceVadThreshold = vadThresholds.negative;
    }
  }, [thresholds, vadThresholds, state.ready]);

  // getStream exposes the detector's mic stream so a host can add a second consumer (e.g. a
  // MediaRecorder for dictation) WITHOUT opening a second getUserMedia (which goes silent).
  // The voiceprint methods expose the WHAT gate (phrase-print over the wake model's own embedding).
  return {
    ...state,
    getStream: () => hbRef.current?.batcher?.stream ?? null,
    getLastEmbedding: () =>
      hbRef.current?.lastWakeEmbedding
        ? Float32Array.from(hbRef.current.lastWakeEmbedding)
        : null,
    getLastProb: () => hbRef.current?.lastWakeProb ?? 0,
    getLastWakeDuration: () => hbRef.current?.lastWakeDurationSec ?? 0,
    setVoiceprint: (name, vectors) =>
      hbRef.current?.setVoiceprint(name, vectors),
    hasVoiceprint: (name) => hbRef.current?.hasVoiceprint(name) ?? false,
    clearVoiceprint: (name) => hbRef.current?.clearVoiceprint(name),
    // Raw cosine to the enrolled templates (max over them) — matches the product's gate: real phrases land
    // ~0.85-0.94 and consistent, so a ~0.80 threshold passes them cleanly and rejects unrelated speech.
    // (The subtracted variant separates more on paper but scores real phrases erratically — worse in practice.)
    // NOTE: it CANNOT separate "ozwell X" variants — the fire-frame sits on the shared word; WHO + the wake
    // model own that. WHAT's real job here is rejecting the doctor's own non-phrase stray speech.
    phraseCosine: (name, vec) => {
      const hb = hbRef.current;
      if (!hb || !vec || !hb.hasVoiceprint(name)) return null;
      const set = hb.voiceprints[name];
      let qn = 0;
      for (let i = 0; i < vec.length; i++) qn += vec[i] * vec[i];
      qn = Math.sqrt(qn) + 1e-9;
      let best = -1;
      for (const t of set) {
        let d = 0,
          tn = 0;
        for (let i = 0; i < vec.length; i++) {
          d += vec[i] * t[i];
          tn += t[i] * t[i];
        }
        const c = d / (qn * (Math.sqrt(tn) + 1e-9));
        if (c > best) best = c;
      }
      return best;
    },
  };
}

// minimal shapes for the vendored detector
interface ProcessedResult {
  speech?: { probability?: number; active?: boolean };
  wakeWords: Record<string, { probability?: number; active?: boolean }>;
  recording?: boolean;
}
interface HeyBuddyInstance {
  onProcessed(cb: (r: ProcessedResult) => void): void;
  onDetected(name: string, cb: () => void): void;
  onRecording(cb: (samples: Float32Array) => void): void;
  batcher?: { stream?: MediaStream; audioContext?: { close(): Promise<void> } };
  wakeWordThresholds: Record<string, number>; // per-phrase fire gate (live)
  vad?: { speechVadThreshold: number; silenceVadThreshold: number }; // VAD speech/silence gate (live)
  lastWakeEmbedding: Float32Array | null; // frozen fire-frame embedding (the WHAT-gate input)
  lastWakeProb: number; // frozen peak fire confidence (the base level)
  lastWakeDurationSec: number; // approx spoken duration of the last wake phrase (detection run)
  voiceprints: Record<string, Float32Array[]>; // per-phrase enrolled phrase-print templates
  setVoiceprint(name: string, vectors: Float32Array[]): void;
  hasVoiceprint(name: string): boolean;
  clearVoiceprint(name: string): void;
  voiceprintSimilarity(name: string, liveVec: Float32Array): number; // common-mode-subtracted (−1..1)
}
