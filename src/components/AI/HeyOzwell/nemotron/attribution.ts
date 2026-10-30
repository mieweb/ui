/** Turns Nemotron's per-frame lane probabilities into a diarized `Transcript`. */
import type {
  SpeakerActivity,
  Transcript,
  TranscriptSegment as TranscriptSegmentMs,
  TranscriptWord,
} from '../../../TranscriptView/transcript';
import type { TranscriptSegment } from '../../diarize';
import { UTTERANCE_GAP_SECONDS } from '../TranscriptPlayer/model';

/** Row-major `numFrames x numSpeakers` lane probabilities, as returned by `runNemotron`. */
export interface LaneFrames {
  probabilities: Float32Array;
  numSpeakers: number;
  frameDurationSeconds: number;
}

const ACTIVE = 0.5;
const ms = (seconds: number) => Math.round(seconds * 1000);

/** One stretch per run of frames where a lane (`lane-N`) is active, in time order. */
function laneActivity({
  probabilities,
  numSpeakers,
  frameDurationSeconds,
}: LaneFrames): SpeakerActivity[] {
  const numFrames = probabilities.length / numSpeakers;
  const activity: SpeakerActivity[] = [];
  for (let lane = 0; lane < numSpeakers; lane++) {
    let start = -1;
    for (let frame = 0; frame <= numFrames; frame++) {
      const active =
        frame < numFrames && probabilities[frame * numSpeakers + lane] > ACTIVE;
      if (active && start < 0) start = frame;
      if (active || start < 0) continue;
      activity.push({
        speakerId: `lane-${lane}`,
        startMs: ms(start * frameDurationSeconds),
        endMs: ms(frame * frameDurationSeconds),
      });
      start = -1;
    }
  }
  return activity.sort((a, b) => a.startMs - b.startMs);
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

/** The `[from, to)` frames a word spans; at least one frame when there are any. */
function wordFrameRange(
  { probabilities, numSpeakers, frameDurationSeconds }: LaneFrames,
  word: TranscriptSegment
): [number, number] {
  const numFrames = probabilities.length / numSpeakers;
  if (numFrames === 0) return [0, 0];
  const from = Math.min(
    numFrames - 1,
    Math.max(0, Math.floor(word.start / frameDurationSeconds))
  );
  const to = Math.min(
    numFrames,
    Math.max(from + 1, Math.ceil(word.end / frameDurationSeconds))
  );
  return [from, to];
}

/** Mean probability of each lane over `[from, to)`. */
function laneMeans(
  { probabilities, numSpeakers }: LaneFrames,
  [from, to]: [number, number]
): Float32Array {
  const means = new Float32Array(numSpeakers);
  if (to <= from) return means;
  for (let frame = from; frame < to; frame++)
    for (let lane = 0; lane < numSpeakers; lane++)
      means[lane] += probabilities[frame * numSpeakers + lane];
  for (let lane = 0; lane < numSpeakers; lane++) means[lane] /= to - from;
  return means;
}

/**
 * Lanes active in a frame of `[from, to)` where `primary` is also active. Frame by frame, so a
 * short interjection inside a long word still counts even though it barely moves that lane's mean.
 */
function overlappingLanes(
  { probabilities, numSpeakers }: LaneFrames,
  [from, to]: [number, number],
  primary: number
): number[] {
  const lanes: number[] = [];
  for (let lane = 0; lane < numSpeakers; lane++) {
    if (lane === primary) continue;
    for (let frame = from; frame < to; frame++) {
      const row = frame * numSpeakers;
      if (
        probabilities[row + primary] > ACTIVE &&
        probabilities[row + lane] > ACTIVE
      ) {
        lanes.push(lane);
        break;
      }
    }
  }
  return lanes;
}

/**
 * Builds a `Transcript` from Whisper words and Nemotron lanes. Each lane is a speaker (`lane-N`).
 * Every word goes to its most active lane (by mean probability); consecutive words on the same lane
 * form a segment, split at pauses longer than the player's utterance gap and wherever the set of
 * other lanes heard (`overlapSpeakerIds`) changes. Another lane overlaps a word when both are active
 * in at least one of its frames. Words no lane claims still go to the most active lane.
 * `speakerActivity` is the raw lane activity, so overlap and wordless speech ("mm-hm") stay visible.
 */
export function transcriptFromFrames(
  words: readonly TranscriptSegment[],
  frames: LaneFrames,
  names: readonly string[],
  durationSeconds: number
): Transcript {
  const ids = names.map((_, lane) => `lane-${lane}`);
  const segments: TranscriptSegmentMs[] = [];
  for (const word of words) {
    const range = wordFrameRange(frames, word);
    const means = laneMeans(frames, range);
    let lane = 0;
    for (let l = 1; l < means.length; l++) if (means[l] > means[lane]) lane = l;
    const speakerId = ids[lane] ?? `lane-${lane}`;
    const others = overlappingLanes(frames, range, lane).map(
      (l) => ids[l] ?? `lane-${l}`
    );
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

  const speakerActivity = laneActivity(frames);
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
