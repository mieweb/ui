/**
 * useSpeakerVerify — headless hook around the on-device speaker-verification gate (the "is this the
 * enrolled doctor?" check). Wraps the vendored TitaNet runtime (speaker-verify.js → window.SpeakerVerify),
 * which runs entirely in the browser via a sherpa-onnx WASM build.
 *
 * A SEPARATE primitive from the wake word: this verifies WHO is speaking (text-independent speaker match),
 * graded as a z-score against a cohort of other voices so the threshold holds across rooms. Enrollment +
 * verification share one data contract — the per-phrase voiceprint centroid, persisted in localStorage.
 *
 * Assets (~50 MB) live in .storybook/public/sv-runtime/ (the sherpa WASM/data + the 500-voice cohort).
 */
import * as React from 'react';

export interface VerifyResult {
  score: number;            // raw cosine to the enrolled centroid (max over conditions)
  znorm: number | null;     // z-score vs the cohort (channel-invariant); null if cohort absent
  pass: boolean;
  enrolled: boolean;
}

export interface SpeakerVerifyHandle {
  ready: boolean;
  error: string | null;
  /** Build/append a voiceprint for a phrase from recorded utterances (Float32 samples + their sample rate). */
  enroll: (phrase: string, utterances: { samples: Float32Array; sampleRate: number }[], opts?: { append?: boolean }) => { n: number; conditions: number } | null;
  /** Verify a live utterance against the enrolled voiceprint for a phrase. */
  verify: (phrase: string, samples: Float32Array, sampleRate: number) => VerifyResult | null;
  conditionCount: (phrase: string) => number;
  clear: () => void;
  /** Tune the WHO gate live (read at verify-time): `cosine` threshold, `znorm` (AS-norm) threshold, and
   *  `useAsnorm` = gate on the z-score vs the raw cosine. */
  setGates: (g: { cosine?: number; znorm?: number; useAsnorm?: boolean }) => void;
}

interface SVApi {
  ready: () => Promise<unknown>;
  enroll: (phrase: string, u: { samples: Float32Array; sampleRate: number }[], opts?: { append?: boolean }) => { n: number; conditions: number };
  verify: (phrase: string, s: Float32Array, sr: number) => VerifyResult;
  conditionCount: (phrase: string) => number;
  clearEnrollment: () => void;
  threshold: number;        // raw-cosine gate (default 0.45)
  znormThreshold: number;   // z-score (AS-norm) gate (default 1.5)
  useAsnorm: boolean;       // gate on z-score instead of raw cosine
}

export function useSpeakerVerify(): SpeakerVerifyHandle {
  const [ready, setReady] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const svRef = React.useRef<SVApi | null>(null);

  React.useEffect(() => {
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
  }, []);

  return {
    ready,
    error,
    enroll: (phrase, utterances, opts) => svRef.current?.enroll(phrase, utterances, opts) ?? null,
    verify: (phrase, samples, sampleRate) => svRef.current?.verify(phrase, samples, sampleRate) ?? null,
    conditionCount: (phrase) => svRef.current?.conditionCount(phrase) ?? 0,
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
