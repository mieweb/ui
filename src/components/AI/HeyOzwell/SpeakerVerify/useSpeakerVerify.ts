/**
 * useSpeakerVerify — headless hook around the on-device speaker-verification gate (the "is this the
 * enrolled doctor?" check). Wraps the vendored TitaNet runtime (speaker-verify.js → window.SpeakerVerify),
 * which runs entirely in the browser via a sherpa-onnx WASM build.
 *
 * A SEPARATE primitive from the wake word: this verifies WHO is speaking (text-independent speaker match),
 * graded as a z-score against a cohort of other voices so the threshold holds across rooms. Enrollment +
 * verification share one data contract — the per-phrase voiceprint centroid, persisted in IndexedDB (with a
 * one-time migration off the old localStorage location).
 *
 * Assets (~50 MB) live in .storybook/public/sv-runtime/ (the sherpa WASM/data + the 500-voice cohort).
 */
import * as React from 'react';

export interface VerifyResult {
  score: number;            // raw cosine to the enrolled centroid (max over voices × conditions)
  znorm: number | null;     // z-score vs the cohort (channel-invariant); null if cohort absent
  pass: boolean;
  enrolled: boolean;
}

/** An enrolled voice (the doctor, an assistant, or you under a condition), aggregated across phrases. */
export interface VoiceInfo {
  id: string;
  label: string;
  createdAt: number;        // ms epoch; 0 for migrated legacy enrollments
  conditions: number;       // how many condition-centroids this voice has
}

/** Best-matching enrolled voice for an utterance (from `identify`). */
export interface VoiceMatch {
  voiceId: string;
  label: string;
  score: number; // max cosine to that voice's centroids
}

/** Options for enrolling/appending a voice. */
export interface EnrollOpts {
  /** Append as another condition of the SAME voice (vs replace that voice's conditions). */
  append?: boolean;
  /** Which voice this enrollment belongs to (default "you"). Use a fresh id to add another person. */
  voiceId?: string;
  /** Human label for the voice (e.g., "You", "Dr. Smith", "My MA"). */
  label?: string;
}

export interface SpeakerVerifyHandle {
  ready: boolean;
  error: string | null;
  /** Build/append a voiceprint for a phrase from recorded utterances (Float32 samples + their sample rate). */
  enroll: (phrase: string, utterances: { samples: Float32Array; sampleRate: number }[], opts?: EnrollOpts) => { n: number; conditions: number; voiceId: string } | null;
  /** Verify a live utterance against the enrolled voiceprints (passes if ANY enrolled voice matches). */
  verify: (phrase: string, samples: Float32Array, sampleRate: number) => VerifyResult | null;
  conditionCount: (phrase: string) => number;
  /** TitaNet speaker embedding for a raw utterance — for diarization/clustering. Null if not ready. */
  embed: (samples: Float32Array, sampleRate: number) => Float32Array | null;
  /** Best-matching enrolled voice for an utterance (text-independent). Null if nothing enrolled/not ready. */
  identify: (samples: Float32Array, sampleRate: number) => VoiceMatch | null;
  /** List enrolled voices (aggregated across phrases). */
  listVoices: () => VoiceInfo[];
  /** Remove a voice across all phrases (revokes that person). */
  removeVoice: (voiceId: string) => void;
  /** Rename a voice across all phrases. */
  renameVoice: (voiceId: string, label: string) => void;
  /** Clear ALL enrolled voices. */
  clear: () => void;
  /** Tune the WHO gate live (read at verify-time): `cosine` threshold, `znorm` (AS-norm) threshold, and
   *  `useAsnorm` = gate on the z-score vs the raw cosine. */
  setGates: (g: { cosine?: number; znorm?: number; useAsnorm?: boolean }) => void;
}

interface SVApi {
  ready: () => Promise<unknown>;
  enroll: (phrase: string, u: { samples: Float32Array; sampleRate: number }[], opts?: EnrollOpts) => { n: number; conditions: number; voiceId: string };
  verify: (phrase: string, s: Float32Array, sr: number) => VerifyResult;
  conditionCount: (phrase: string) => number;
  embed: (samples: Float32Array, sampleRate: number) => Float32Array | null;
  identify: (samples: Float32Array, sampleRate: number) => VoiceMatch | null;
  listVoices: () => VoiceInfo[];
  removeVoice: (voiceId: string) => void;
  renameVoice: (voiceId: string, label: string) => void;
  clearEnrollment: () => void;
  threshold: number;        // raw-cosine gate (default 0.45)
  znormThreshold: number;   // z-score (AS-norm) gate (default 1.5)
  useAsnorm: boolean;       // gate on z-score instead of raw cosine
}

export interface UseSpeakerVerifyOpts {
  /** Set false to skip loading the ~50 MB sherpa/TitaNet runtime (e.g. when the doctor-only gate is off).
   *  Defaults to true so existing callers are unchanged. */
  enabled?: boolean;
}

export function useSpeakerVerify(opts: UseSpeakerVerifyOpts = {}): SpeakerVerifyHandle {
  const { enabled = true } = opts;
  const [ready, setReady] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const svRef = React.useRef<SVApi | null>(null);

  React.useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    (async () => {
      try {
        // running the vendored IIFE sets window.SpeakerVerify and kicks off loading the sherpa WASM
        await import('./lib/speaker-verify.js');
        const sv = (window as unknown as { SpeakerVerify?: SVApi }).SpeakerVerify;
        if (!sv) throw new Error('SpeakerVerify failed to initialize');
        await sv.ready();
        if (cancelled) return;
        svRef.current = sv;
        console.log('[speaker] TitaNet ready');
        setReady(true);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => { cancelled = true; };
  }, [enabled]);

  return {
    ready,
    error,
    enroll: (phrase, utterances, opts) => svRef.current?.enroll(phrase, utterances, opts) ?? null,
    verify: (phrase, samples, sampleRate) => svRef.current?.verify(phrase, samples, sampleRate) ?? null,
    conditionCount: (phrase) => svRef.current?.conditionCount(phrase) ?? 0,
    embed: (samples, sampleRate) => svRef.current?.embed(samples, sampleRate) ?? null,
    identify: (samples, sampleRate) => svRef.current?.identify(samples, sampleRate) ?? null,
    listVoices: () => svRef.current?.listVoices() ?? [],
    removeVoice: (voiceId) => svRef.current?.removeVoice(voiceId),
    renameVoice: (voiceId, label) => svRef.current?.renameVoice(voiceId, label),
    clear: () => svRef.current?.clearEnrollment(),
    setGates: (g) => {
      const sv = svRef.current;
      if (!sv) return;
      if (g.cosine != null) sv.threshold = g.cosine;
      if (g.znorm != null) sv.znormThreshold = g.znorm;
      if (g.useAsnorm != null) sv.useAsnorm = g.useAsnorm;
    },
  };
}
