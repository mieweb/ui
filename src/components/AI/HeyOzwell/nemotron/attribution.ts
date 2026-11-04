/** Turns Nemotron's per-frame lane probabilities into a diarized `Transcript`. */
import type {
  Speaker,
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

/** Who spoke when, without words, so a host can attribute words from its own transcription. */
export interface SpeakerTimeline {
  durationMs: number;
  /** Speakers heard, as `lane-N` ids with their display names. */
  speakers: Speaker[];
  speakerActivity: SpeakerActivity[];
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

/** The lane that talks most (summed active probability), or null when nobody is heard. */
export function dominantLane({
  probabilities,
  numSpeakers,
}: LaneFrames): number | null {
  const totals = new Float32Array(numSpeakers);
  for (let i = 0; i < probabilities.length; i++)
    if (probabilities[i] > ACTIVE) totals[i % numSpeakers] += probabilities[i];
  let best = 0;
  for (let lane = 1; lane < numSpeakers; lane++)
    if (totals[lane] > totals[best]) best = lane;
  return totals[best] > 0 ? best : null;
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

/** The speaker of one word and the other speakers heard with it. */
interface Attribution {
  speakerId: string;
  others: string[];
}

/**
 * Groups attributed words into segments: consecutive words of one speaker form a segment, split at
 * pauses longer than the player's utterance gap and wherever the other speakers heard change.
 */
function buildTranscript(
  words: readonly TranscriptSegment[],
  attribute: (word: TranscriptSegment) => Attribution,
  { durationMs, speakers, speakerActivity }: SpeakerTimeline
): Transcript {
  const segments: TranscriptSegmentMs[] = [];
  for (const word of words) {
    const { speakerId, others } = attribute(word);
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

  const heard = new Set([
    ...segments.map((s) => s.speakerId),
    ...speakerActivity.map((a) => a.speakerId),
  ]);
  return {
    durationMs,
    speakers: speakers.filter((s) => heard.has(s.id)),
    segments,
    words: segments.flatMap((s) => s.words),
    speakerActivity,
  };
}

const laneSpeakers = (names: readonly string[]): Speaker[] =>
  names.map((name, lane) => ({ id: `lane-${lane}`, name }));

/** The lanes heard, with their names, and the raw lane activity (overlap and wordless "mm-hm" included). */
export function timelineFromFrames(
  frames: LaneFrames,
  names: readonly string[],
  durationSeconds: number
): SpeakerTimeline {
  const speakerActivity = laneActivity(frames);
  const heard = new Set(speakerActivity.map((a) => a.speakerId));
  return {
    durationMs: ms(durationSeconds),
    speakers: laneSpeakers(names).filter((s) => heard.has(s.id)),
    speakerActivity,
  };
}

/**
 * Builds a `Transcript` from Whisper words and Nemotron lanes. Each lane is a speaker (`lane-N`).
 * Every word goes to its most active lane (by mean probability). Another lane overlaps a word when
 * both are active in at least one of its frames. Words no lane claims still go to the most active lane.
 */
export function transcriptFromFrames(
  words: readonly TranscriptSegment[],
  frames: LaneFrames,
  names: readonly string[],
  durationSeconds: number
): Transcript {
  const id = (lane: number) => `lane-${lane}`;
  return buildTranscript(
    words,
    (word) => {
      const range = wordFrameRange(frames, word);
      const means = laneMeans(frames, range);
      let lane = 0;
      for (let l = 1; l < means.length; l++)
        if (means[l] > means[lane]) lane = l;
      return {
        speakerId: id(lane),
        others: overlappingLanes(frames, range, lane).map(id),
      };
    },
    // Every named lane: a word can land on a lane with no activity of its own.
    {
      ...timelineFromFrames(frames, names, durationSeconds),
      speakers: laneSpeakers(names),
    }
  );
}

/**
 * Builds a `Transcript` from a host's own word timestamps (seconds from the start of the recording,
 * e.g. from a server transcription) and a `SpeakerTimeline`. Every word goes to the speaker active for
 * most of it, else the nearest one in time; other speakers active together with it are its overlap.
 * Pure (no browser APIs).
 */
export function transcriptFromActivity(
  words: readonly TranscriptSegment[],
  timeline: SpeakerTimeline
): Transcript {
  const spans = timeline.speakerActivity;
  const fallback = timeline.speakers[0]?.id ?? 'lane-0';

  return buildTranscript(
    words,
    (word) => {
      const from = ms(word.start);
      const to = Math.max(ms(word.end), from + 1);
      const heard = spans.filter((s) => s.startMs < to && s.endMs > from);
      if (heard.length === 0) {
        const gap = (s: SpeakerActivity) =>
          Math.max(s.startMs - to, from - s.endMs);
        const nearest = spans.reduce<SpeakerActivity | undefined>(
          (best, s) => (!best || gap(s) < gap(best) ? s : best),
          undefined
        );
        return { speakerId: nearest?.speakerId ?? fallback, others: [] };
      }

      const within = (s: SpeakerActivity): [number, number] => [
        Math.max(from, s.startMs),
        Math.min(to, s.endMs),
      ];
      const totals = new Map<string, number>();
      for (const s of heard) {
        const [start, end] = within(s);
        totals.set(s.speakerId, (totals.get(s.speakerId) ?? 0) + end - start);
      }
      // Ties go to the speaker listed first (lower lanes, which hold the enrolled voices).
      const rank = (id: string) => {
        const i = timeline.speakers.findIndex((s) => s.id === id);
        return i < 0 ? Infinity : i;
      };
      let speakerId = heard[0].speakerId;
      for (const [id, total] of totals) {
        const best = totals.get(speakerId) ?? 0;
        if (total > best || (total === best && rank(id) < rank(speakerId)))
          speakerId = id;
      }

      const mine = heard.filter((s) => s.speakerId === speakerId);
      const together = (s: SpeakerActivity) => {
        const [start, end] = within(s);
        return mine.some(
          (m) => Math.min(end, m.endMs) > Math.max(start, m.startMs)
        );
      };
      const others = [
        ...new Set(
          heard
            .filter((s) => s.speakerId !== speakerId && together(s))
            .map((s) => s.speakerId)
        ),
      ];
      return { speakerId, others };
    },
    timeline
  );
}
