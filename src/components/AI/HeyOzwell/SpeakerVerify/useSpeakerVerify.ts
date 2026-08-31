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
  score: number; // raw cosine to the enrolled centroid (max over voices × conditions)
  znorm: number | null; // z-score vs the cohort (channel-invariant); null if cohort absent
  pass: boolean;
  enrolled: boolean;
}

/** An enrolled voice (the doctor, an assistant, or you under a condition), aggregated across phrases. */
export interface VoiceInfo {
  id: string;
  label: string;
  createdAt: number; // ms epoch; 0 for migrated legacy enrollments
  conditions: number; // how many condition-centroids this voice has
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
  enroll: (
    phrase: string,
    utterances: { samples: Float32Array; sampleRate: number }[],
    opts?: EnrollOpts
  ) => { n: number; conditions: number; voiceId: string } | null;
  /** Verify a live utterance against the enrolled voiceprints (passes if ANY enrolled voice matches). */
  verify: (
    phrase: string,
    samples: Float32Array,
    sampleRate: number
  ) => VerifyResult | null;
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
  setGates: (g: {
    cosine?: number;
    znorm?: number;
    useAsnorm?: boolean;
  }) => void;
}

interface SVApi {
  ready: () => Promise<unknown>;
  loadNamespace: (namespace?: string) => Promise<void>;
  enroll: (
    phrase: string,
    u: { samples: Float32Array; sampleRate: number }[],
    opts?: EnrollOpts,
    namespace?: string
  ) => { n: number; conditions: number; voiceId: string };
  verify: (
    phrase: string,
    s: Float32Array,
    sr: number,
    namespace?: string
  ) => VerifyResult;
  conditionCount: (phrase: string, namespace?: string) => number;
  embed: (samples: Float32Array, sampleRate: number) => Float32Array | null;
  identify: (
    samples: Float32Array,
    sampleRate: number,
    namespace?: string
  ) => VoiceMatch | null;
  listVoices: (namespace?: string) => VoiceInfo[];
  removeVoice: (voiceId: string, namespace?: string) => void;
  renameVoice: (voiceId: string, label: string, namespace?: string) => void;
  clearEnrollment: (namespace?: string) => void;
  threshold: number;
  znormThreshold: number;
  useAsnorm: boolean;
}

export interface UseSpeakerVerifyOpts {
  /** Set false to skip loading the ~50 MB sherpa/TitaNet runtime (e.g. when the doctor-only gate is off).
   *  Defaults to true so existing callers are unchanged. */
  enabled?: boolean;
  /** Isolates persisted enrollment from other users of the same browser profile. */
  voiceprintNamespace?: string;
}

export function useSpeakerVerify(
  opts: UseSpeakerVerifyOpts = {}
): SpeakerVerifyHandle {
  const { enabled = true, voiceprintNamespace } = opts;
  const [ready, setReady] = React.useState(false);
  const [loadedNamespace, setLoadedNamespace] = React.useState<
    string | undefined
  >();
  const [error, setError] = React.useState<string | null>(null);
  const svRef = React.useRef<SVApi | null>(null);

  React.useEffect(() => {
    if (!enabled) return;
    setReady(false);
    setError(null);
    svRef.current = null;
    let cancelled = false;
    (async () => {
      try {
        // running the vendored IIFE sets window.SpeakerVerify and kicks off loading the sherpa WASM
        await import('./lib/speaker-verify.js');
        const sv = (window as unknown as { SpeakerVerify?: SVApi })
          .SpeakerVerify;
        if (!sv) throw new Error('SpeakerVerify failed to initialize');
        await sv.ready();
        await sv.loadNamespace(voiceprintNamespace);
        if (cancelled) return;
        svRef.current = sv;
        setLoadedNamespace(voiceprintNamespace);
        console.log('[speaker] TitaNet ready');
        setReady(true);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled, voiceprintNamespace]);

  const scopedApi =
    enabled && ready && loadedNamespace === voiceprintNamespace
      ? svRef.current
      : null;

  return {
    ready: scopedApi !== null,
    error,
    enroll: (phrase, utterances, opts) =>
      scopedApi?.enroll(phrase, utterances, opts, voiceprintNamespace) ?? null,
    verify: (phrase, samples, sampleRate) =>
      scopedApi?.verify(phrase, samples, sampleRate, voiceprintNamespace) ??
      null,
    conditionCount: (phrase) =>
      scopedApi?.conditionCount(phrase, voiceprintNamespace) ?? 0,
    embed: (samples, sampleRate) =>
      scopedApi?.embed(samples, sampleRate) ?? null,
    identify: (samples, sampleRate) =>
      scopedApi?.identify(samples, sampleRate, voiceprintNamespace) ?? null,
    listVoices: () => scopedApi?.listVoices(voiceprintNamespace) ?? [],
    removeVoice: (voiceId) =>
      scopedApi?.removeVoice(voiceId, voiceprintNamespace),
    renameVoice: (voiceId, label) =>
      scopedApi?.renameVoice(voiceId, label, voiceprintNamespace),
    clear: () => scopedApi?.clearEnrollment(voiceprintNamespace),
    setGates: (g) => {
      const sv = scopedApi;
      if (!sv) return;
      if (g.cosine != null) sv.threshold = g.cosine;
      if (g.znorm != null) sv.znormThreshold = g.znorm;
      if (g.useAsnorm != null) sv.useAsnorm = g.useAsnorm;
    },
  };
}
