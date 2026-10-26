/** Pure data shaping for TranscriptPlayer: speakers, utterances, talk time and the zoomable view. */
import type { Transcript } from '../../../TranscriptView/transcript';
import { isSilenceType } from '../../../TranscriptView/transcript';

export interface PlayerSpeaker {
  id: string;
  name: string;
  color: string;
}

/** A playable interval, in seconds. */
export interface TimeRange {
  start: number;
  end: number;
}

export interface LaneSegment extends TimeRange {
  id: string;
  speakerId: string;
}

export interface Utterance extends TimeRange {
  id: string;
  speakerId: string;
  text: string;
  /** Other speakers talking at the same time. */
  overlapSpeakerIds?: string[];
}

/** The visible slice of the timeline, in seconds. */
export interface TimelineView {
  start: number;
  span: number;
}

/** Readable on light and dark backgrounds; repeats after eight speakers. */
const SPEAKER_COLORS = [
  '#dc2626',
  '#a3b818',
  '#16a34a',
  '#2563eb',
  '#9333ea',
  '#ea580c',
  '#0891b2',
  '#db2777',
];

export const UNKNOWN_SPEAKER_ID = '';
/** Words further apart than this start a new utterance when the transcript has no segments. */
export const UTTERANCE_GAP_SECONDS = 1.5;
/** Narrowest zoom, so a lane bar is never wider than the screen for a word. */
export const MIN_VIEW_SECONDS = 10;
/** Initial window for long recordings; shorter ones fit entirely. */
const DEFAULT_VIEW_SECONDS = 300;

const seconds = (ms: number) => ms / 1000;
/** Seconds from a host-supplied millisecond value; missing or invalid values count as 0. */
export const finiteSeconds = (ms: number | undefined) =>
  Number.isFinite(ms) ? (ms as number) / 1000 : 0;

/** Utterances from transcript segments, or from words grouped by speaker when there are none. */
export function toUtterances(transcript: Transcript): Utterance[] {
  // The Transcript contract does not require order; everything downstream reads by start time.
  if (transcript.segments?.length)
    return transcript.segments
      .map((s, i) => ({
        id: `u${i}`,
        speakerId: s.speakerId ?? UNKNOWN_SPEAKER_ID,
        start: seconds(s.startMs),
        end: seconds(s.endMs),
        text: s.text.trim(),
        ...(s.overlapSpeakerIds?.length
          ? { overlapSpeakerIds: s.overlapSpeakerIds }
          : {}),
      }))
      .sort((a, b) => a.start - b.start);

  const out: Utterance[] = [];
  const words = [...transcript.words].sort((a, b) => a.startMs - b.startMs);
  for (const word of words) {
    if (isSilenceType(word.wordType)) continue;
    const speakerId = word.speakerId ?? UNKNOWN_SPEAKER_ID;
    const last = out[out.length - 1];
    if (
      last &&
      last.speakerId === speakerId &&
      seconds(word.startMs) - last.end <= UTTERANCE_GAP_SECONDS
    ) {
      last.end = Math.max(last.end, seconds(word.endMs));
      last.text = `${last.text} ${word.text}`.trim();
    } else {
      out.push({
        id: `u${out.length}`,
        speakerId,
        start: seconds(word.startMs),
        end: seconds(word.endMs),
        text: word.text.trim(),
      });
    }
  }
  return out;
}

/** Lane segments from raw diarization activity, falling back to utterances. */
export function toLaneSegments(
  transcript: Transcript,
  utterances: readonly Utterance[]
): LaneSegment[] {
  const source = transcript.speakerActivity?.length
    ? transcript.speakerActivity.map((a) => ({
        speakerId: a.speakerId || UNKNOWN_SPEAKER_ID,
        start: seconds(a.startMs),
        end: seconds(a.endMs),
      }))
    : utterances;
  return source
    .filter((s) => s.end > s.start)
    .map((s, i) => ({
      id: `s${i}`,
      speakerId: s.speakerId,
      start: s.start,
      end: s.end,
    }))
    .sort((a, b) => a.start - b.start);
}

/** Every speaker that appears anywhere, in roster order, then first appearance; each gets a stable colour. */
export function toSpeakers(
  transcript: Transcript,
  ids: Iterable<string>,
  speakerLabels: Record<string, string> | undefined,
  unknownName: string
): PlayerSpeaker[] {
  const order = [
    ...new Set([...(transcript.speakers ?? []).map((s) => s.id), ...ids]),
  ];
  return order.map((id, i) => ({
    id,
    name:
      speakerLabels?.[id] ??
      transcript.speakers?.find((s) => s.id === id)?.name ??
      (id === UNKNOWN_SPEAKER_ID ? unknownName : id),
    color: SPEAKER_COLORS[i % SPEAKER_COLORS.length],
  }));
}

/** Talk time per speaker, merging that speaker's own overlapping intervals. */
export function talkTime(
  segments: readonly LaneSegment[]
): Map<string, number> {
  const bySpeaker = new Map<string, TimeRange[]>();
  for (const s of segments) {
    const list = bySpeaker.get(s.speakerId) ?? [];
    list.push(s);
    bySpeaker.set(s.speakerId, list);
  }
  const totals = new Map<string, number>();
  for (const [id, list] of bySpeaker) {
    list.sort((a, b) => a.start - b.start);
    let total = 0;
    let end = -Infinity;
    for (const { start, end: stop } of list) {
      if (stop <= end) continue;
      total += stop - Math.max(start, end);
      end = stop;
    }
    totals.set(id, total);
  }
  return totals;
}

/** True when two different speakers are active at the same time anywhere. */
export function hasOverlap(segments: readonly LaneSegment[]): boolean {
  let latest: LaneSegment | null = null;
  for (const s of segments) {
    if (latest && s.start < latest.end && s.speakerId !== latest.speakerId)
      return true;
    if (!latest || s.end > latest.end) latest = s;
  }
  return false;
}

/** The utterance under `time`, from utterances sorted by start; with overlap, the one that started last. */
export function activeUtteranceAt(
  utterances: readonly Utterance[],
  time: number
): Utterance | null {
  let found: Utterance | null = null;
  for (const u of utterances) {
    if (u.start > time) break;
    if (time < u.end) found = u;
  }
  return found;
}

export function filterUtterances(
  utterances: readonly Utterance[],
  hidden: ReadonlySet<string>,
  query: string
): Utterance[] {
  const needle = query.trim().toLowerCase();
  return utterances.filter(
    (u) =>
      !hidden.has(u.speakerId) &&
      (!needle || u.text.toLowerCase().includes(needle))
  );
}

export function clampView(view: TimelineView, duration: number): TimelineView {
  const span = Math.min(
    Math.max(view.span, Math.min(MIN_VIEW_SECONDS, duration)),
    duration
  );
  const start = Math.min(Math.max(0, view.start), Math.max(0, duration - span));
  return { start, span };
}

export function initialView(duration: number): TimelineView {
  return clampView({ start: 0, span: DEFAULT_VIEW_SECONDS }, duration);
}

/** Zooms by `factor` (< 1 zooms in) keeping `anchor` at the same place on screen. */
export function zoomView(
  view: TimelineView,
  factor: number,
  anchor: number,
  duration: number
): TimelineView {
  const span = view.span * factor;
  const ratio = view.span > 0 ? (anchor - view.start) / view.span : 0;
  return clampView({ start: anchor - ratio * span, span }, duration);
}

/** Keeps `time` on screen, paging forward when it runs off the right edge. */
export function followView(
  view: TimelineView,
  time: number,
  duration: number
): TimelineView {
  if (time >= view.start && time <= view.start + view.span * 0.95) return view;
  return clampView(
    { start: time - view.span * 0.05, span: view.span },
    duration
  );
}

const TICK_STEPS = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600, 900, 1800, 3600];

/** Evenly spaced, round tick times inside the view. */
export function ticksFor(view: TimelineView, maxTicks = 8): number[] {
  const step =
    TICK_STEPS.find((s) => view.span / s <= maxTicks) ??
    TICK_STEPS[TICK_STEPS.length - 1];
  const ticks: number[] = [];
  for (
    let t = Math.ceil(view.start / step) * step;
    t <= view.start + view.span;
    t += step
  )
    ticks.push(t);
  return ticks;
}

/** `m:ss`, or `h:mm:ss` from an hour. */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

/** A length: `4.2s` under a minute, otherwise a clock. */
export function formatSpan(totalSeconds: number): string {
  return totalSeconds < 60
    ? `${Math.max(0, totalSeconds).toFixed(1)}s`
    : formatClock(totalSeconds);
}
