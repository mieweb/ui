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

/** Speakers active in each 10 ms frame, as indices into `speakers`. */
function toFrames(
  spans: SpeakerSpan[],
  speakers: string[],
  numFrames: number
): Set<number>[] {
  const frames = Array.from({ length: numFrames }, () => new Set<number>());
  for (const span of spans) {
    const index = speakers.indexOf(span.speaker);
    const from = Math.round(span.start / FRAME_SECONDS);
    const to = Math.min(numFrames, Math.round(span.end / FRAME_SECONDS));
    for (let frame = from; frame < to; frame++) frames[frame].add(index);
  }
  return frames;
}

function speakersOf(spans: SpeakerSpan[]): string[] {
  return [...new Set(spans.map((span) => span.speaker))];
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

/** Best one-to-one hypothesis → reference speaker mapping by co-occurring frames (exhaustive; ≤ 8 speakers). */
function bestMapping(overlap: number[][], numReference: number): number[] {
  let best: number[] = [];
  let bestScore = -1;
  const mapping: number[] = [];
  const used = new Array<boolean>(numReference).fill(false);

  const visit = (hyp: number, score: number) => {
    if (hyp === overlap.length) {
      if (score > bestScore) {
        bestScore = score;
        best = [...mapping];
      }
      return;
    }
    mapping[hyp] = -1;
    visit(hyp + 1, score);
    for (let ref = 0; ref < numReference; ref++) {
      if (used[ref]) continue;
      used[ref] = true;
      mapping[hyp] = ref;
      visit(hyp + 1, score + overlap[hyp][ref]);
      used[ref] = false;
    }
  };
  visit(0, 0);
  return best;
}

/** Both span sets on a shared 10 ms frame grid, with the best hypothesis → reference speaker mapping. */
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
  const mapping = bestMapping(overlap, refSpeakers.length);
  return { refSpeakers, hypSpeakers, numFrames, ref, hyp, mapping };
}

/** Frame-based diarization error rate (10 ms frames, no collar, overlap included). */
export function diarizationErrorRate(
  reference: SpeakerSpan[],
  hypothesis: SpeakerSpan[]
): DiarizationError {
  const { numFrames, ref, hyp, mapping } = align(reference, hypothesis);

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
 * Speaker-level identity check. A hypothesis speaker counts as named when its label is in `enrolled`;
 * reference labels must use the same names for enrolled people.
 */
export function identification(
  reference: SpeakerSpan[],
  hypothesis: SpeakerSpan[],
  enrolled: readonly string[]
): IdentificationResult {
  const { refSpeakers, hypSpeakers, mapping } = align(reference, hypothesis);
  const result: IdentificationResult = {
    correct: 0,
    falseAccept: 0,
    missed: 0,
  };
  hypSpeakers.forEach((name, h) => {
    const truth = mapping[h] >= 0 ? refSpeakers[mapping[h]] : undefined;
    if (enrolled.includes(name)) {
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
