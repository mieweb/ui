/** Shared span format and metrics for comparing diarization pipelines on the same clip. */
import {
  spansFromFrames,
  type LaneFrames,
  type SpeakerSpan,
} from '../nemotron/attribution';

export { spansFromFrames, type SpeakerSpan };

export interface DiarizationSummary {
  speakers: number;
  speechSeconds: number;
  /** Time when two or more speakers are active. */
  overlapSeconds: number;
  /** Turns shorter than `shortTurnSeconds`. */
  shortTurns: number;
}

export interface DiarizationError {
  /** (missed + falseAlarm + confusion) / referenceSeconds; overlap counted per speaker. */
  der: number;
  missed: number;
  falseAlarm: number;
  confusion: number;
  referenceSeconds: number;
}

/** Speaker-level identity outcomes against reference labels that use the enrolled names. */
export interface IdentificationResult {
  /** Named, and the name matches the reference speaker it overlaps most. */
  correct: number;
  /** Named, but the reference speaker is someone else (a stranger or another enrolled person). */
  falseAccept: number;
  /** Left as "Speaker N" although the reference speaker is enrolled. */
  missed: number;
}

const FRAME_SECONDS = 0.01;

/** Who a span belongs to for scoring: its lane/cluster when known, so equal names stay distinct. */
const keyOf = (span: SpeakerSpan) => span.id ?? span.speaker;

/** Speakers active in each 10 ms frame, as indices into `speakers`. */
function toFrames(
  spans: SpeakerSpan[],
  speakers: string[],
  numFrames: number
): Set<number>[] {
  const frames = Array.from({ length: numFrames }, () => new Set<number>());
  for (const span of spans) {
    const index = speakers.indexOf(keyOf(span));
    const from = Math.round(span.start / FRAME_SECONDS);
    const to = Math.min(numFrames, Math.round(span.end / FRAME_SECONDS));
    for (let frame = from; frame < to; frame++) frames[frame].add(index);
  }
  return frames;
}

function speakersOf(spans: SpeakerSpan[]): string[] {
  return [...new Set(spans.map(keyOf))];
}

function frameCount(...groups: SpeakerSpan[][]): number {
  const end = Math.max(0, ...groups.flat().map((span) => span.end));
  return Math.round(end / FRAME_SECONDS);
}

export function summarize(
  spans: SpeakerSpan[],
  shortTurnSeconds = 1
): DiarizationSummary {
  const speakers = speakersOf(spans);
  const frames = toFrames(spans, speakers, frameCount(spans));
  return {
    speakers: speakers.length,
    speechSeconds: frames.filter((f) => f.size > 0).length * FRAME_SECONDS,
    overlapSeconds: frames.filter((f) => f.size > 1).length * FRAME_SECONDS,
    shortTurns: spans.filter((span) => span.end - span.start < shortTurnSeconds)
      .length,
  };
}

/**
 * Best one-to-one hypothesis → reference speaker mapping by co-occurring frames: the Hungarian
 * algorithm (O(n³)) on a square matrix padded with zeros. Pairs with no overlap map to -1.
 */
function bestMapping(overlap: number[][], numReference: number): number[] {
  const rows = overlap.length;
  const n = Math.max(rows, numReference);
  const cost = (i: number, j: number) =>
    i < rows && j < numReference ? -overlap[i][j] : 0;
  // 1-based potentials and matching; column 0 is the algorithm's sentinel.
  const u = new Array<number>(n + 1).fill(0);
  const v = new Array<number>(n + 1).fill(0);
  const rowOf = new Array<number>(n + 1).fill(0);
  const way = new Array<number>(n + 1).fill(0);
  for (let i = 1; i <= n; i++) {
    rowOf[0] = i;
    let col = 0;
    const minv = new Array<number>(n + 1).fill(Infinity);
    const used = new Array<boolean>(n + 1).fill(false);
    do {
      used[col] = true;
      const row = rowOf[col];
      let delta = Infinity;
      let next = 0;
      for (let j = 1; j <= n; j++) {
        if (used[j]) continue;
        const reduced = cost(row - 1, j - 1) - u[row] - v[j];
        if (reduced < minv[j]) {
          minv[j] = reduced;
          way[j] = col;
        }
        if (minv[j] < delta) {
          delta = minv[j];
          next = j;
        }
      }
      for (let j = 0; j <= n; j++) {
        if (used[j]) {
          u[rowOf[j]] += delta;
          v[j] -= delta;
        } else minv[j] -= delta;
      }
      col = next;
    } while (rowOf[col] !== 0);
    do {
      const prev = way[col];
      rowOf[col] = rowOf[prev];
      col = prev;
    } while (col !== 0);
  }

  const mapping = new Array<number>(rows).fill(-1);
  for (let j = 1; j <= n; j++) {
    const i = rowOf[j] - 1;
    if (i < rows && j - 1 < numReference && overlap[i][j - 1] > 0)
      mapping[i] = j - 1;
  }
  return mapping;
}

/** Both span sets on a shared 10 ms frame grid, with co-occurring frames per speaker pair. */
function align(reference: SpeakerSpan[], hypothesis: SpeakerSpan[]) {
  const refSpeakers = speakersOf(reference);
  const hypSpeakers = speakersOf(hypothesis);
  const numFrames = frameCount(reference, hypothesis);
  const ref = toFrames(reference, refSpeakers, numFrames);
  const hyp = toFrames(hypothesis, hypSpeakers, numFrames);

  const overlap = hypSpeakers.map(() =>
    new Array<number>(refSpeakers.length).fill(0)
  );
  for (let frame = 0; frame < numFrames; frame++)
    for (const h of hyp[frame]) for (const r of ref[frame]) overlap[h][r]++;
  return { refSpeakers, hypSpeakers, numFrames, ref, hyp, overlap };
}

/** Frame-based diarization error rate (10 ms frames, no collar, overlap included). */
export function diarizationErrorRate(
  reference: SpeakerSpan[],
  hypothesis: SpeakerSpan[]
): DiarizationError {
  const { refSpeakers, numFrames, ref, hyp, overlap } = align(
    reference,
    hypothesis
  );
  const mapping = bestMapping(overlap, refSpeakers.length);

  let missed = 0;
  let falseAlarm = 0;
  let confusion = 0;
  let referenceFrames = 0;
  for (let frame = 0; frame < numFrames; frame++) {
    const r = ref[frame].size;
    const h = hyp[frame].size;
    let correct = 0;
    for (const speaker of hyp[frame])
      if (ref[frame].has(mapping[speaker])) correct++;
    referenceFrames += r;
    missed += Math.max(0, r - h);
    falseAlarm += Math.max(0, h - r);
    confusion += Math.min(r, h) - correct;
  }

  const seconds = (frames: number) => frames * FRAME_SECONDS;
  return {
    der: referenceFrames
      ? (missed + falseAlarm + confusion) / referenceFrames
      : 0,
    missed: seconds(missed),
    falseAlarm: seconds(falseAlarm),
    confusion: seconds(confusion),
    referenceSeconds: seconds(referenceFrames),
  };
}

/**
 * Speaker-level identity check. Each hypothesis speaker (lane or cluster) is judged on its own
 * against the reference speaker it overlaps most, so fragments of one person are scored separately.
 * It counts as named when its label is in `enrolled`; reference labels must use the same names.
 */
export function identification(
  reference: SpeakerSpan[],
  hypothesis: SpeakerSpan[],
  enrolled: readonly string[]
): IdentificationResult {
  const { refSpeakers, hypSpeakers, overlap } = align(reference, hypothesis);
  const result: IdentificationResult = {
    correct: 0,
    falseAccept: 0,
    missed: 0,
  };
  hypSpeakers.forEach((key, h) => {
    const name = hypothesis.find((span) => keyOf(span) === key)?.speaker;
    let best = -1;
    overlap[h].forEach((frames, r) => {
      if (frames > 0 && (best < 0 || frames > overlap[h][best])) best = r;
    });
    const truth = best >= 0 ? refSpeakers[best] : undefined;
    if (name !== undefined && enrolled.includes(name)) {
      if (name === truth) result.correct++;
      else result.falseAccept++;
    } else if (truth !== undefined && enrolled.includes(truth)) {
      result.missed++;
    }
  });
  return result;
}

/** Longest stretch where `lane` is the only active lane: the cleanest audio to identify it from. */
export function longestSoloWindow(
  { probabilities, numSpeakers, frameDurationSeconds }: LaneFrames,
  lane: number,
  threshold = 0.5
): { start: number; end: number } | null {
  const numFrames = probabilities.length / numSpeakers;
  let best: { start: number; end: number } | null = null;
  let start = -1;
  for (let frame = 0; frame <= numFrames; frame++) {
    let solo = frame < numFrames;
    for (let l = 0; solo && l < numSpeakers; l++) {
      const active = probabilities[frame * numSpeakers + l] > threshold;
      solo = l === lane ? active : !active;
    }
    if (solo && start < 0) start = frame;
    if (solo || start < 0) continue;
    if (!best || frame - start > best.end - best.start)
      best = { start, end: frame };
    start = -1;
  }
  return (
    best && {
      start: best.start * frameDurationSeconds,
      end: best.end * frameDurationSeconds,
    }
  );
}
