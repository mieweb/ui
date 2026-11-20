import { describe, expect, it } from 'vitest';
import type { Transcript } from '../../../TranscriptView/transcript';
import {
  activeUtteranceAt,
  clampView,
  filterUtterances,
  followView,
  formatClock,
  formatSpan,
  hasOverlap,
  initialView,
  talkTime,
  ticksFor,
  toLaneSegments,
  toSpeakers,
  toUtterances,
  zoomView,
  type LaneSegment,
} from './model';
import { computePeaks } from './peaks';

const transcript: Transcript = {
  durationMs: 10000,
  speakers: [{ id: 'a', name: 'Dr. Smith' }],
  words: [],
  segments: [
    { text: 'Hello there', startMs: 0, endMs: 2000, speakerId: 'a', words: [] },
    {
      text: ' Hi ',
      startMs: 1500,
      endMs: 3000,
      speakerId: 'b',
      words: [],
      overlapSpeakerIds: ['a'],
    },
    { text: 'Okay', startMs: 4000, endMs: 5000, words: [] },
  ],
};

const seg = (speakerId: string, start: number, end: number): LaneSegment => ({
  id: `${speakerId}${start}`,
  speakerId,
  start,
  end,
});

describe('toUtterances', () => {
  it('maps segments to seconds, keeps overlap, and marks missing speakers as unknown', () => {
    expect(toUtterances(transcript)).toEqual([
      { id: 'u0', speakerId: 'a', start: 0, end: 2, text: 'Hello there' },
      {
        id: 'u1',
        speakerId: 'b',
        start: 1.5,
        end: 3,
        text: 'Hi',
        overlapSpeakerIds: ['a'],
      },
      { id: 'u2', speakerId: '', start: 4, end: 5, text: 'Okay' },
    ]);
  });

  it('groups words by speaker and pause when there are no segments, skipping silence', () => {
    const utterances = toUtterances({
      durationMs: 10000,
      words: [
        { text: 'one', startMs: 0, endMs: 400, speakerId: 'a' },
        { text: '', startMs: 400, endMs: 600, wordType: 'silence' },
        { text: 'two', startMs: 600, endMs: 900, speakerId: 'a' },
        { text: 'three', startMs: 1000, endMs: 1300, speakerId: 'b' },
        { text: 'four', startMs: 5000, endMs: 5300, speakerId: 'b' },
      ],
    });
    expect(utterances.map((u) => [u.speakerId, u.text])).toEqual([
      ['a', 'one two'],
      ['b', 'three'],
      ['b', 'four'],
    ]);
  });
});

describe('toLaneSegments and toSpeakers', () => {
  it('prefers raw activity, keeps overlap, and drops empty intervals', () => {
    const lanes = toLaneSegments(
      {
        ...transcript,
        speakerActivity: [
          { speakerId: 'b', startMs: 1500, endMs: 3000 },
          { speakerId: 'a', startMs: 0, endMs: 2000 },
          { speakerId: 'a', startMs: 6000, endMs: 6000 },
        ],
      },
      []
    );
    expect(lanes.map((s) => [s.speakerId, s.start, s.end])).toEqual([
      ['a', 0, 2],
      ['b', 1.5, 3],
    ]);
  });

  it('falls back to utterances and names unknown speakers', () => {
    expect(
      toLaneSegments(
        { ...transcript, speakerActivity: [] },
        toUtterances(transcript)
      )
    ).toHaveLength(3);
    const lanes = toLaneSegments(transcript, toUtterances(transcript));
    const speakers = toSpeakers(
      transcript,
      lanes.map((s) => s.speakerId),
      { b: 'Patient' },
      'Unknown speaker'
    );
    expect(speakers.map((s) => s.name)).toEqual([
      'Dr. Smith',
      'Patient',
      'Unknown speaker',
    ]);
    expect(new Set(speakers.map((s) => s.color)).size).toBe(3);
  });
});

describe('talk time and overlap', () => {
  it('merges a speaker’s own overlapping intervals but counts cross-talk for each speaker', () => {
    const segments = [seg('a', 0, 4), seg('a', 2, 6), seg('b', 3, 5)];
    expect(Object.fromEntries(talkTime(segments))).toEqual({ a: 6, b: 2 });
    expect(hasOverlap(segments)).toBe(true);
    expect(hasOverlap([seg('a', 0, 2), seg('a', 1, 3), seg('b', 3, 4)])).toBe(
      false
    );
  });

  it('picks the utterance that started last when lines overlap', () => {
    const utterances = toUtterances(transcript);
    expect(activeUtteranceAt(utterances, 1.7)?.id).toBe('u1');
    expect(activeUtteranceAt(utterances, 3.5)).toBeNull();
  });

  it('orders unsorted segments by start so the active line is still found', () => {
    const utterances = toUtterances({
      durationMs: 12000,
      words: [],
      segments: [
        { text: 'later', startMs: 10000, endMs: 12000, words: [] },
        { text: 'earlier', startMs: 2000, endMs: 4000, words: [] },
      ],
    });
    expect(utterances.map((u) => u.text)).toEqual(['earlier', 'later']);
    expect(activeUtteranceAt(utterances, 2.5)?.text).toBe('earlier');
  });

  it('filters by hidden speakers and case-insensitive search', () => {
    const utterances = toUtterances(transcript);
    expect(
      filterUtterances(utterances, new Set(['b']), 'O').map((u) => u.id)
    ).toEqual(['u0', 'u2']);
  });
});

describe('timeline view', () => {
  it('shows short recordings whole and long ones as a 5-minute window', () => {
    expect(initialView(42)).toEqual({ start: 0, span: 42 });
    expect(initialView(3600)).toEqual({ start: 0, span: 300 });
  });

  it('clamps to the recording and to the narrowest zoom', () => {
    expect(clampView({ start: -5, span: 2 }, 600)).toEqual({
      start: 0,
      span: 10,
    });
    expect(clampView({ start: 590, span: 60 }, 600)).toEqual({
      start: 540,
      span: 60,
    });
    expect(clampView({ start: 0, span: 50 }, 0)).toEqual({ start: 0, span: 0 });
  });

  it('zooms around the anchor', () => {
    expect(zoomView({ start: 100, span: 200 }, 0.5, 150, 3600)).toEqual({
      start: 125,
      span: 100,
    });
  });

  it('pages forward only when the playhead leaves the window', () => {
    const view = { start: 0, span: 100 };
    expect(followView(view, 50, 1000)).toBe(view);
    expect(followView(view, 120, 1000)).toEqual({ start: 115, span: 100 });
  });

  it('places round ticks inside the window', () => {
    expect(ticksFor({ start: 0, span: 600 })).toEqual([
      0, 120, 240, 360, 480, 600,
    ]);
  });

  it('formats clocks and spans', () => {
    expect(formatClock(65)).toBe('1:05');
    expect(formatClock(3725)).toBe('1:02:05');
    expect(formatSpan(1.84)).toBe('1.8s');
    expect(formatSpan(108)).toBe('1:48');
  });
});

describe('computePeaks', () => {
  it('takes the loudest sample per bucket, normalised', () => {
    const { data, perSecond } = computePeaks([0, -2, 1, 4, 0, 1], 6, 3);
    expect(perSecond).toBe(3);
    expect(Array.from(data)).toEqual([0.5, 1, 0.25]);
  });
});
