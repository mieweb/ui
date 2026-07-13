/**
 * useDiarization — on-device "who spoke when" for a recorded visit (mieweb/ui, Hey Ozwell).
 *
 * Batch pipeline over assets we already ship (no new WASM build): Whisper timestamps → TitaNet per-segment
 * embeddings → JS clustering → anchor clusters to enrolled voiceprints → attributed transcript. Enrolled
 * people (doctor, care-team) get their real name; unknown speakers get "Speaker N". See DIARIZATION.md.
 *
 * NOTE: the core clustering/attribution (`diarize.ts`) is unit-tested; this hook wires it to the WASM
 * embedder + Whisper, which needs in-browser verification on real multi-speaker audio.
 */
import * as React from 'react';
import { useSpeakerVerify } from './SpeakerVerify/useSpeakerVerify';
import { transcribeSegments, decodeTo16kMono, warmWhisper } from '../whisperTranscribe';
import { askOzwell, isOzwellConfigured } from '../ozwellChat';
import {
  clusterEmbeddings,
  labelClusters,
  attributeSegments,
  mergeTurns,
  inferSpeakerRoles,
  type DiarizedSegment,
} from '../diarize';

const SR = 16000; // decodeTo16kMono / transcribeSegments work in 16 kHz seconds

export interface UseDiarizationOptions {
  /** Cluster merge cutoff (cosine distance). Higher → fewer speakers (merges more). Default 0.65. */
  threshold?: number;
  /** Hard cap on detected speakers — forces merging down to at most this many. Unset = auto. */
  maxSpeakers?: number;
  /** Minimum segment length (seconds) to trust for a speaker embedding — shorter segments are attributed
   *  to a neighbor instead of forming their own (noisy) cluster. Raising this cuts phantom speakers from
   *  brief interjections. Default 1.0. */
  minSegmentSeconds?: number;
  /** Min cosine to name a cluster from an enrolled voice (else it stays "Speaker N"). Default 0.45. */
  identifyThreshold?: number;
  /** Collapse consecutive same-speaker segments into turns. Default true. */
  merge?: boolean;
  /** After anchoring, ask Ozwell to infer roles (Patient / Caregiver / …) for the still-generic speakers.
   *  Requires the chat backend to be configured; best-effort (keeps "Speaker N" on failure). Default false. */
  inferRoles?: boolean;
  /** Load the ~50 MB speaker runtime + warm Whisper. Set false to keep it dormant until it's needed
   *  (e.g. a host feature that's off). Default true. */
  enabled?: boolean;
}

export interface UseDiarizationResult {
  /** TitaNet runtime is loaded (diarization can run). */
  ready: boolean;
  /** A diarization pass is in flight. */
  busy: boolean;
  error: string | null;
  /** Last result (also returned by `diarize`). */
  result: DiarizedSegment[] | null;
  /** Diarize a recorded visit Blob → attributed transcript. */
  diarize: (blob: Blob) => Promise<DiarizedSegment[]>;
}

/** Slice the [start,end] second window out of 16 kHz samples (clamped). */
function windowFor(samples: Float32Array, start: number, end: number): Float32Array {
  const a = Math.max(0, Math.floor(start * SR));
  const b = Math.min(samples.length, Math.ceil(end * SR));
  return b > a ? samples.subarray(a, b) : samples.subarray(0, 0);
}

export function useDiarization(options: UseDiarizationOptions = {}): UseDiarizationResult {
  const { threshold = 0.65, maxSpeakers, identifyThreshold = 0.45, merge = true, inferRoles = false, enabled = true, minSegmentSeconds = 1.0 } = options;
  const sv = useSpeakerVerify({ enabled }); // loads the TitaNet runtime (only when enabled)
  const svRef = React.useRef(sv);
  svRef.current = sv;

  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<DiarizedSegment[] | null>(null);

  // Warm Whisper up front so the first diarize() isn't gated on the ~1.3 GB download (only when enabled,
  // so a dormant instance doesn't pull the model early).
  React.useEffect(() => {
    if (enabled) warmWhisper();
  }, [enabled]);

  const diarize = React.useCallback(
    async (blob: Blob): Promise<DiarizedSegment[]> => {
      setBusy(true);
      setError(null);
      try {
        const svh = svRef.current;
        // 1. transcript segments (Whisper timestamps) + the raw 16k samples to embed windows from
        const [segments, samples] = await Promise.all([transcribeSegments(blob), decodeTo16kMono(blob)]);
        if (!segments.length) {
          setResult([]);
          return [];
        }

        // 2. embed each segment's audio window (TitaNet). Segments whose embedding fails (too short / not
        //    ready) are dropped from clustering but kept in output attributed to the nearest kept cluster.
        const windows = segments.map((s) => windowFor(samples, s.start, s.end));
        const embedded: { idx: number; emb: Float32Array }[] = [];
        for (let i = 0; i < segments.length; i++) {
          const emb = windows[i].length >= SR * minSegmentSeconds ? svh.embed(windows[i], SR) : null;
          if (emb) embedded.push({ idx: i, emb });
        }
        if (!embedded.length) throw new Error('no embeddable segments (runtime not ready?)');

        // 3. cluster the embedded segments
        const clusterOf = clusterEmbeddings(embedded.map((e) => e.emb), { threshold, maxSpeakers });
        // map: original segment index → cluster id (nearest kept segment for dropped ones)
        const segCluster = new Array<number>(segments.length).fill(-1);
        embedded.forEach((e, k) => (segCluster[e.idx] = clusterOf[k]));
        for (let i = 0; i < segments.length; i++) {
          if (segCluster[i] !== -1) continue;
          // borrow the previous (or next) embedded segment's cluster for continuity
          let j = i - 1;
          while (j >= 0 && segCluster[j] === -1) j--;
          if (j < 0) { j = i + 1; while (j < segments.length && segCluster[j] === -1) j++; }
          segCluster[i] = j >= 0 && j < segments.length && segCluster[j] !== -1 ? segCluster[j] : 0;
        }

        // 4. anchor each cluster to an enrolled voice (identify the longest segment in the cluster)
        // reduce, not Math.max(0, ...clusterOf): spreading a large array throws RangeError on long visits
        const clusterCount = clusterOf.reduce((m, x) => (x > m ? x : m), 0) + 1;
        const names: Record<number, string> = {};
        for (let c = 0; c < clusterCount; c++) {
          // longest embedded segment in this cluster = the most reliable to identify
          let repIdx = -1;
          let repLen = -1;
          embedded.forEach((e, k) => {
            if (clusterOf[k] !== c) return;
            const len = windows[e.idx].length;
            if (len > repLen) { repLen = len; repIdx = e.idx; }
          });
          if (repIdx < 0) continue;
          const match = svh.identify(windows[repIdx], SR);
          if (match && match.score >= identifyThreshold) names[c] = match.label;
        }

        // 5. attribute → (optionally) LLM role inference for unknowns → (optionally) merge turns
        const labels = labelClusters(segCluster, names);
        let out = attributeSegments(segments, segCluster, labels);
        if (inferRoles && isOzwellConfigured()) {
          try {
            out = await inferSpeakerRoles(out, (p) => askOzwell(p));
          } catch {
            /* keep the generic "Speaker N" labels on any LLM failure */
          }
        }
        if (merge) out = mergeTurns(out);
        setResult(out);
        return out;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
        throw e;
      } finally {
        setBusy(false);
      }
    },
    [threshold, maxSpeakers, identifyThreshold, merge, inferRoles, minSegmentSeconds]
  );

  return { ready: sv.ready, busy, error, result, diarize };
}
