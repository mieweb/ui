/**
 * useWakeWord — a headless React hook around the on-device wake-word detector.
 *
 * Phase 1 (this file): DETECTION only. It loads the tiny wake models + the mel/embedding/VAD
 * front-end (all from `/wakeword/*`, served by Storybook's static dir) and fires `onWake(name)`
 * when it hears "hey ozwell" or "ozwell i'm done". Everything runs in the browser; audio stays local.
 *
 * Phase 2 (later): the WHO speaker gate (TitaNet) so only the enrolled doctor's voice triggers it.
 *
 * The detector itself is the framework-agnostic `HeyBuddy` class vendored under ./lib (vanilla JS).
 * Needs `onnxruntime-web` (pnpm add) and the VAD model at /wakeword/silero-vad.onnx.
 */
import * as React from 'react';

export interface UseWakeWordOpts {
  /** Fired with the phrase name ("hey-ozwell" | "ozwell-i'm-done") on a detection. */
  onWake?: (name: string) => void;
  /** Fired with the CAPTURED audio of a wake utterance (the phrase the model just heard) + which phrase.
   *  Use for phrase-validated enrollment: the wake firing IS the proof it was actually the phrase. */
  onUtterance?: (name: string, samples: Float32Array) => void;
  /** Per-phrase fire thresholds (0..1). Defaults to 0.5 each. */
  thresholds?: Record<string, number>;
  /** Set false to not start listening. */
  enabled?: boolean;
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
  /** Store / check / clear a phrase's enrolled phrase-print templates (the WHAT gate). */
  setVoiceprint: (name: string, vectors: Float32Array[]) => void;
  hasVoiceprint: (name: string) => boolean;
  clearVoiceprint: (name: string) => void;
  /** Raw cosine of an embedding to a phrase's templates (max over templates); null if not enrolled. */
  phraseCosine: (name: string, vec: Float32Array | null) => number | null;
}

const ASSET = '/wakeword';
const PHRASES = ['hey-ozwell', "ozwell-i'm-done"];

// Load the SAME onnxruntime-web build the working demo uses (1.19.0), as a global `ort`.
// The detector's onnx.js prefers a global `ort` over the bundled package — matching the demo's
// pinned version fixes the slow/choppy inference and behavior diffs the newer npm version caused.
const ORT_URL = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.19.0/dist/ort.min.js';
function ensureOrt(): Promise<void> {
  if (typeof (window as unknown as { ort?: unknown }).ort !== 'undefined') return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = ORT_URL;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('failed to load onnxruntime-web 1.19.0'));
    document.head.appendChild(s);
  });
}

export function useWakeWord(opts: UseWakeWordOpts = {}): WakeWordState & WakeWordControls {
  const { onWake, onUtterance, thresholds, enabled = true } = opts;
  const [state, setState] = React.useState<WakeWordState>({ ready: false, error: null, speech: 0, probs: {} });
  // keep the latest callbacks without re-running the effect
  const onWakeRef = React.useRef(onWake);
  onWakeRef.current = onWake;
  const onUtteranceRef = React.useRef(onUtterance);
  onUtteranceRef.current = onUtterance;
  const lastFiredRef = React.useRef<string | null>(null);
  // holds the detector so the host can reach its mic stream (one stream, many consumers — see composition)
  const hbRef = React.useRef<HeyBuddyInstance | null>(null);

  React.useEffect(() => {
    if (!enabled) return;
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
        const { HeyBuddy } = (await import('./lib/hey-buddy.js')) as { HeyBuddy: new (o: unknown) => HeyBuddyInstance };
        if (cancelled) return;

        const hb = new HeyBuddy({
          modelPath: [`${ASSET}/hey-ozwell.onnx`, `${ASSET}/ozwell-i'm-done.onnx`],
          vadModelPath: `${ASSET}/silero-vad.onnx`,
          embeddingModelPath: `${ASSET}/speech-embedding.onnx`,
          spectrogramModelPath: `${ASSET}/mel-spectrogram.onnx`,
          wakeWordThresholds: thresholds || { 'hey-ozwell': 0.5, "ozwell-i'm-done": 0.5 },
          // The VAD reads low in this setup, so gate generously — the re-entrancy guard in HeyBuddy
          // keeps the wake model from overlap-crashing even if this lets it run most of the time.
          positiveVadThreshold: 0.05,
          negativeVadThreshold: 0.03,
        });
        hbRef.current = hb;

        hb.onProcessed((result: ProcessedResult) => {
          if (cancelled) return;
          const probs: Record<string, number> = {};
          for (const w of Object.keys(result.wakeWords || {})) probs[w] = result.wakeWords[w].probability || 0;
          setState((s) => ({ ...s, ready: true, speech: result.speech?.probability || 0, probs }));
        });

        for (const name of PHRASES) hb.onDetected(name, () => { lastFiredRef.current = name; onWakeRef.current?.(name); });
        // the captured utterance audio arrives just after a wake fires — pair it with the phrase that fired,
        // so a host can use "the model fired for phrase X" as proof the user actually said X.
        hb.onRecording((samples: Float32Array) => { if (lastFiredRef.current) onUtteranceRef.current?.(lastFiredRef.current, samples); });

        setState((s) => ({ ...s, ready: true }));
      } catch (e) {
        if (!cancelled) setState((s) => ({ ...s, error: e instanceof Error ? e.message : String(e) }));
      }
    })();

    // NOTE: HeyBuddy has no stop() yet — the mic keeps running until page nav. Phase-2 TODO: add teardown.
    return () => { cancelled = true; };
  }, [enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  // getStream exposes the detector's mic stream so a host can add a second consumer (e.g. a
  // MediaRecorder for dictation) WITHOUT opening a second getUserMedia (which goes silent).
  // The voiceprint methods expose the WHAT gate (phrase-print over the wake model's own embedding).
  return {
    ...state,
    getStream: () => hbRef.current?.batcher?.stream ?? null,
    getLastEmbedding: () => (hbRef.current?.lastWakeEmbedding ? Float32Array.from(hbRef.current.lastWakeEmbedding) : null),
    setVoiceprint: (name, vectors) => hbRef.current?.setVoiceprint(name, vectors),
    hasVoiceprint: (name) => hbRef.current?.hasVoiceprint(name) ?? false,
    clearVoiceprint: (name) => hbRef.current?.clearVoiceprint(name),
    phraseCosine: (name, vec) => phraseCosine(hbRef.current, name, vec),
  };
}

// raw cosine of an embedding to a phrase's enrolled templates, max over templates (the WHAT score)
function phraseCosine(hb: HeyBuddyInstance | null, name: string, vec: Float32Array | null): number | null {
  const set = hb?.voiceprints?.[name];
  if (!set || !set.length || !vec) return null;
  let qn = 0; for (let i = 0; i < vec.length; i++) qn += vec[i] * vec[i]; qn = Math.sqrt(qn) + 1e-9;
  let best = -1;
  for (const t of set) {
    let d = 0, tn = 0;
    for (let i = 0; i < vec.length; i++) { d += vec[i] * t[i]; tn += t[i] * t[i]; }
    const c = d / (qn * (Math.sqrt(tn) + 1e-9));
    if (c > best) best = c;
  }
  return best;
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
  batcher?: { stream?: MediaStream };
  lastWakeEmbedding: Float32Array | null;        // frozen fire-frame embedding (the WHAT-gate input)
  voiceprints: Record<string, Float32Array[]>;   // per-phrase enrolled phrase-print templates
  setVoiceprint(name: string, vectors: Float32Array[]): void;
  hasVoiceprint(name: string): boolean;
  clearVoiceprint(name: string): void;
}
