/**
 * Speaker diarization core — pure clustering + transcript attribution (mieweb/ui, Hey Ozwell).
 *
 * No models here: given per-segment speaker embeddings (from TitaNet) + a timestamped transcript (from
 * Whisper), group segments by speaker and label them. Everything is deterministic + framework-free so it's
 * unit-testable without the WASM/mic. See DIARIZATION.md for the full pipeline; `useDiarization` wires the
 * embedder + transcriber to these functions.
 */

/** A transcript chunk with timing (Whisper output). */
export interface TranscriptSegment {
  start: number; // seconds
  end: number; // seconds
  text: string;
}

/** A transcript chunk after diarization: which cluster + a human speaker label. */
export interface DiarizedSegment extends TranscriptSegment {
  cluster: number;
  speaker: string;
}

export interface ClusterOptions {
  /** Merge clusters while their cosine DISTANCE (1 − cosine) is ≤ this. Lower = more speakers. Default 0.5
   *  (i.e. merge when cosine similarity ≥ 0.5), tuned to TitaNet's same/different-speaker margins. */
  threshold?: number;
  /** Hard cap on speaker count — keep merging past `threshold` until at most this many clusters remain. */
  maxSpeakers?: number;
}

/** Cosine similarity of two vectors (computes norms, so inputs needn't be normalized). */
export function cosine(a: Float32Array, b: Float32Array): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom > 0 ? dot / denom : 0;
}

/** Mean of vectors, L2-normalized — a cluster's representative embedding. */
export function centroid(vectors: Float32Array[]): Float32Array {
  const dim = vectors[0]?.length ?? 0;
  const c = new Float32Array(dim);
  for (const v of vectors) for (let i = 0; i < dim; i++) c[i] += v[i];
  let norm = 0;
  for (let i = 0; i < dim; i++) {
    c[i] /= vectors.length;
    norm += c[i] * c[i];
  }
  norm = Math.sqrt(norm);
  if (norm > 0) for (let i = 0; i < dim; i++) c[i] /= norm;
  return c;
}

/**
 * Average-linkage agglomerative clustering over speaker embeddings, with auto speaker count via a cosine
 * threshold (+ optional hard `maxSpeakers` cap). Returns a cluster id (0-based, in first-appearance order)
 * per input embedding.
 */
export function clusterEmbeddings(embeddings: Float32Array[], opts: ClusterOptions = {}): number[] {
  const { threshold = 0.5, maxSpeakers = Infinity } = opts;
  const n = embeddings.length;
  if (n === 0) return [];
  if (n === 1) return [0];

  // pairwise cosine SIMILARITY (symmetric) between points
  const sim: number[][] = Array.from({ length: n }, () => new Array<number>(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const s = cosine(embeddings[i], embeddings[j]);
      sim[i][j] = s;
      sim[j][i] = s;
    }
  }

  // clusters as lists of point indices
  let clusters: number[][] = embeddings.map((_, i) => [i]);
  // average-linkage cosine DISTANCE between two clusters
  const clusterDist = (a: number[], b: number[]): number => {
    let sum = 0;
    for (const x of a) for (const y of b) sum += sim[x][y];
    return 1 - sum / (a.length * b.length);
  };

  for (;;) {
    if (clusters.length <= 1) break;
    // find the closest pair
    let bi = 0;
    let bj = 1;
    let best = Infinity;
    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        const d = clusterDist(clusters[i], clusters[j]);
        if (d < best) {
          best = d;
          bi = i;
          bj = j;
        }
      }
    }
    // merge while under threshold, or while still above the speaker cap
    if (best <= threshold || clusters.length > maxSpeakers) {
      clusters[bi] = clusters[bi].concat(clusters[bj]);
      clusters.splice(bj, 1);
    } else {
      break;
    }
  }

  // assign cluster ids in first-appearance order (stable, readable labels)
  const labelOf = new Array<number>(n).fill(-1);
  clusters
    .map((c) => ({ c, first: Math.min(...c) }))
    .sort((a, b) => a.first - b.first)
    .forEach(({ c }, id) => c.forEach((idx) => (labelOf[idx] = id)));
  return labelOf;
}

/**
 * Human labels per cluster id. `names[clusterId]` (from voiceprint anchoring / LLM / manual) wins;
 * otherwise a generic "Speaker N". Returns an array indexed by cluster id.
 */
export function labelClusters(clusters: number[], names: Record<number, string> = {}): string[] {
  const count = clusters.length ? Math.max(...clusters) + 1 : 0;
  const labels: string[] = [];
  for (let id = 0; id < count; id++) labels[id] = names[id] ?? `Speaker ${id + 1}`;
  return labels;
}

/** Attach cluster id + speaker label to each transcript segment. */
export function attributeSegments(
  segments: TranscriptSegment[],
  clusters: number[],
  labels: string[]
): DiarizedSegment[] {
  return segments.map((seg, i) => {
    const cluster = clusters[i] ?? 0;
    return { ...seg, cluster, speaker: labels[cluster] ?? `Speaker ${cluster + 1}` };
  });
}

/** Extract the first JSON object from an LLM reply (it may wrap it in prose / code fences). */
function parseJsonMap(reply: string): Record<string, string> {
  const match = reply.match(/\{[\s\S]*\}/);
  if (!match) return {};
  try {
    const obj = JSON.parse(match[0]) as Record<string, unknown>;
    const out: Record<string, string> = {};
    for (const k in obj) if (typeof obj[k] === 'string') out[k] = obj[k] as string;
    return out;
  } catch {
    return {};
  }
}

export interface RoleInferenceOptions {
  /** Candidate roles the model may assign. Default: a clinical-visit set. */
  roles?: string[];
  /** Which speaker labels to (re)infer — default the generic "Speaker N" ones, leaving enrolled names. */
  isGeneric?: (speaker: string) => boolean;
}

/**
 * Ask an LLM to infer the ROLE of each unknown speaker (patient / caregiver / clinician …) from what they
 * say, and relabel them. Enrolled/named speakers are left untouched. `ask` is injected (e.g. askOzwell) so
 * this stays pure + testable. Falls back to the input unchanged on any parse/LLM failure.
 */
export async function inferSpeakerRoles(
  segments: DiarizedSegment[],
  ask: (prompt: string) => Promise<string>,
  opts: RoleInferenceOptions = {}
): Promise<DiarizedSegment[]> {
  const roles = opts.roles ?? ['Patient', 'Clinician', 'Caregiver', 'Nurse', 'Unknown'];
  const isGeneric = opts.isGeneric ?? ((s) => /^Speaker \d+$/.test(s));
  const toLabel = [...new Set(segments.map((s) => s.speaker))].filter(isGeneric);
  if (!toLabel.length) return segments;

  const transcript = segments.map((s) => `${s.speaker}: ${s.text}`).join('\n');
  const prompt =
    `You are labeling speakers in a medical-visit transcript. For EACH of these speaker tags: ` +
    `${toLabel.join(', ')} — infer the most likely role from: ${roles.join(', ')}. ` +
    `Reply with ONLY a JSON object mapping each tag to a role, e.g. {"Speaker 2":"Patient"}. ` +
    `Do not relabel speakers that already have a name.\n\nTranscript:\n${transcript}`;

  let map: Record<string, string> = {};
  try {
    map = parseJsonMap(await ask(prompt));
  } catch {
    return segments;
  }
  return segments.map((s) => (isGeneric(s.speaker) && map[s.speaker] ? { ...s, speaker: map[s.speaker] } : s));
}

/** Collapse consecutive same-speaker segments into turns — nicer for a scribe note. */
export function mergeTurns(segments: DiarizedSegment[]): DiarizedSegment[] {
  const out: DiarizedSegment[] = [];
  for (const seg of segments) {
    const last = out[out.length - 1];
    if (last && last.cluster === seg.cluster) {
      last.end = seg.end;
      last.text = `${last.text} ${seg.text}`.trim();
    } else {
      out.push({ ...seg });
    }
  }
  return out;
}
