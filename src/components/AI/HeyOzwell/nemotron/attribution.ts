/** Turns Nemotron's per-frame lane probabilities into named spans and a diarized `Transcript`. */
import type {
  Transcript,
  TranscriptSegment as TranscriptSegmentMs,
  TranscriptWord,
} from '../../../TranscriptView/transcript';
import type { TranscriptSegment } from '../../diarize';
import { UTTERANCE_GAP_SECONDS } from '../TranscriptPlayer/model';

export interface SpeakerSpan {
  speaker: string;
  /** Stable lane or cluster id, when several can share one `speaker` name. */
  id?: string;
  /** Seconds. */
  start: number;
  /** Seconds. */
  end: number;
}

/** Row-major `numFrames x numSpeakers` lane probabilities, as returned by `runNemotron`. */
export interface LaneFrames {
  probabilities: Float32Array;
  numSpeakers: number;
  frameDurationSeconds: number;
}

const ACTIVE = 0.5;

/** Per-frame lane probabilities → one span per run above `threshold`. Unnamed lanes are "Speaker N" by arrival. */
export function spansFromFrames(
  probabilities: Float32Array,
  numSpeakers: number,
  frameDurationSeconds: number,
  {
    threshold = ACTIVE,
    minSeconds = 0,
    names,
  }: { threshold?: number; minSeconds?: number; names?: readonly string[] } = {}
): SpeakerSpan[] {
  const numFrames = probabilities.length / numSpeakers;
  const spans: SpeakerSpan[] = [];
  for (let speaker = 0; speaker < numSpeakers; speaker++) {
    let start = -1;
    for (let frame = 0; frame <= numFrames; frame++) {
      const active =
        frame < numFrames &&
        probabilities[frame * numSpeakers + speaker] > threshold;
      if (active && start < 0) start = frame;
      if (active || start < 0) continue;
      spans.push({
        speaker: names?.[speaker] ?? `Speaker ${speaker + 1}`,
        id: `lane-${speaker}`,
        start: start * frameDurationSeconds,
        end: frame * frameDurationSeconds,
      });
      start = -1;
    }
  }
  return spans
    .filter((span) => span.end - span.start >= minSeconds)
    .sort((a, b) => a.start - b.start);
}

/** Display name per lane: the first lanes take the enrolled names, the rest "Speaker N" by first activity. */
export function laneNames(
  { probabilities, numSpeakers }: LaneFrames,
  enrolled: readonly string[]
): string[] {
  const numFrames = probabilities.length / numSpeakers;
  const firstActive = (lane: number) => {
    for (let frame = 0; frame < numFrames; frame++)
      if (probabilities[frame * numSpeakers + lane] > ACTIVE) return frame;
    return Infinity;
  };
  const unnamed = Array.from({ length: numSpeakers }, (_, lane) => lane)
    .slice(enrolled.length)
    .map((lane) => ({ lane, first: firstActive(lane) }))
    .sort((a, b) => a.first - b.first || a.lane - b.lane);

  const names = [...enrolled.slice(0, numSpeakers)];
  unnamed.forEach(({ lane }, i) => (names[lane] = `Speaker ${i + 1}`));
  return names;
}

/** Mean probability of each lane over the frames a word spans. */
function laneMeans(
  { probabilities, numSpeakers, frameDurationSeconds }: LaneFrames,
  word: TranscriptSegment
): Float32Array {
  const means = new Float32Array(numSpeakers);
  const numFrames = probabilities.length / numSpeakers;
  if (numFrames === 0) return means;
  const from = Math.min(
    numFrames - 1,
    Math.max(0, Math.floor(word.start / frameDurationSeconds))
  );
  const to = Math.min(
    numFrames,
    Math.max(from + 1, Math.ceil(word.end / frameDurationSeconds))
  );
  for (let frame = from; frame < to; frame++)
    for (let lane = 0; lane < numSpeakers; lane++)
      means[lane] += probabilities[frame * numSpeakers + lane];
  for (let lane = 0; lane < numSpeakers; lane++) means[lane] /= to - from;
  return means;
}

/**
 * Builds a `Transcript` from Whisper words and Nemotron lanes. Each lane is a speaker (`lane-N`).
 * Every word goes to its most active lane; consecutive words on the same lane form a segment,
 * split at pauses longer than the player's utterance gap and wherever the set of other lanes heard
 * (`overlapSpeakerIds`) changes. Words no lane claims still go to the most active lane.
 * `speakerActivity` is the raw lane activity, so overlap and wordless speech ("mm-hm") stay visible.
 */
export function transcriptFromFrames(
  words: readonly TranscriptSegment[],
  frames: LaneFrames,
  names: readonly string[],
  durationSeconds: number
): Transcript {
  const ms = (seconds: number) => Math.round(seconds * 1000);
  const ids = names.map((_, lane) => `lane-${lane}`);
  const segments: TranscriptSegmentMs[] = [];
  for (const word of words) {
    const means = laneMeans(frames, word);
    let lane = 0;
    for (let l = 1; l < means.length; l++) if (means[l] > means[lane]) lane = l;
    const speakerId = ids[lane] ?? `lane-${lane}`;
    const others: string[] = [];
    means.forEach((mean, l) => {
      if (l !== lane && mean > ACTIVE) others.push(ids[l] ?? `lane-${l}`);
    });
    const spoken: TranscriptWord = {
      text: word.text.trim(),
      startMs: ms(word.start),
      endMs: ms(word.end),
      speakerId,
    };

    const last = segments[segments.length - 1];
    const lastOthers = last?.overlapSpeakerIds ?? [];
    if (
      last &&
      last.speakerId === speakerId &&
      spoken.startMs - last.endMs <= UTTERANCE_GAP_SECONDS * 1000 &&
      lastOthers.length === others.length &&
      others.every((id) => lastOthers.includes(id))
    ) {
      last.endMs = spoken.endMs;
      last.text = `${last.text} ${spoken.text}`;
      last.words.push(spoken);
      continue;
    }
    segments.push({
      text: spoken.text,
      startMs: spoken.startMs,
      endMs: spoken.endMs,
      speakerId,
      words: [spoken],
      ...(others.length ? { overlapSpeakerIds: others } : {}),
    });
  }

  const speakerActivity = spansFromFrames(
    frames.probabilities,
    frames.numSpeakers,
    frames.frameDurationSeconds,
    { names: ids }
  ).map((span) => ({
    speakerId: span.speaker,
    startMs: ms(span.start),
    endMs: ms(span.end),
  }));
  const heard = new Set([
    ...segments.map((s) => s.speakerId),
    ...speakerActivity.map((a) => a.speakerId),
  ]);
  return {
    durationMs: ms(durationSeconds),
    speakers: names
      .map((name, lane) => ({ id: ids[lane], name }))
      .filter((s) => heard.has(s.id)),
    segments,
    words: segments.flatMap((s) => s.words),
    speakerActivity,
  };
}
