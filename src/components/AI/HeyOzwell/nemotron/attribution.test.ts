import { describe, expect, it } from 'vitest';
import {
  laneNames,
  spansFromFrames,
  transcriptFromFrames,
} from './attribution';

/** Builds `numFrames x 3` frames of 0.1 s where `active(frame)` lists the lit lanes. */
function frames(numFrames: number, active: (frame: number) => number[]) {
  const numSpeakers = 3;
  const probabilities = new Float32Array(numFrames * numSpeakers);
  for (let f = 0; f < numFrames; f++)
    for (const lane of active(f)) probabilities[f * numSpeakers + lane] = 0.9;
  return { probabilities, numSpeakers, frameDurationSeconds: 0.1 };
}

// Lane 0 talks 0–1 s, lane 1 talks 1–2 s, both talk 2–3 s.
const conversation = frames(30, (f) => (f < 10 ? [0] : f < 20 ? [1] : [0, 1]));

describe('laneNames', () => {
  it('names enrolled lanes first and numbers the rest by first activity', () => {
    const late = frames(20, (f) => (f < 10 ? [2] : [1]));
    expect(laneNames(late, [])).toEqual([
      'Speaker 3',
      'Speaker 2',
      'Speaker 1',
    ]);
    expect(laneNames(conversation, ['Dr. Smith'])).toEqual([
      'Dr. Smith',
      'Speaker 1',
      'Speaker 2',
    ]);
  });
});

describe('spansFromFrames', () => {
  it('uses lane names when given', () => {
    const spans = spansFromFrames(
      conversation.probabilities,
      conversation.numSpeakers,
      conversation.frameDurationSeconds,
      { names: ['Dr. Smith', 'Speaker 1', 'Speaker 2'] }
    );
    expect(spans.map((s) => s.speaker)).toEqual([
      'Dr. Smith',
      'Speaker 1',
      'Dr. Smith',
    ]);
  });
});

describe('transcriptFromFrames', () => {
  const names = ['Dr. Smith', 'Mom', 'Speaker 1'];
  const word = (text: string, start: number, end: number) => ({
    text,
    start,
    end,
  });

  it('groups words into segments per lane and splits where overlap starts', () => {
    const transcript = transcriptFromFrames(
      [
        word(' how', 0.1, 0.4),
        word(' are', 0.5, 0.8),
        word(' fine', 1.2, 1.5),
        word(' both', 2.2, 2.6),
      ],
      conversation,
      names,
      3
    );
    expect(transcript.segments).toMatchObject([
      { text: 'how are', speakerId: 'lane-0', startMs: 100, endMs: 800 },
      { text: 'fine', speakerId: 'lane-1' },
      { text: 'both', speakerId: 'lane-0', overlapSpeakerIds: ['lane-1'] },
    ]);
    expect(transcript.segments?.[0].overlapSpeakerIds).toBeUndefined();
    expect(transcript.words.map((w) => w.speakerId)).toEqual([
      'lane-0',
      'lane-0',
      'lane-1',
      'lane-0',
    ]);
    // Only lanes that were heard become speakers.
    expect(transcript.speakers).toEqual([
      { id: 'lane-0', name: 'Dr. Smith' },
      { id: 'lane-1', name: 'Mom' },
    ]);
    expect(transcript.speakerActivity).toEqual([
      { speakerId: 'lane-0', startMs: 0, endMs: 1000 },
      { speakerId: 'lane-1', startMs: 1000, endMs: 3000 },
      { speakerId: 'lane-0', startMs: 2000, endMs: 3000 },
    ]);
    expect(transcript.durationMs).toBe(3000);
  });

  it('gives words no lane claims to the most active lane and survives empty input', () => {
    const silent = frames(10, () => []);
    expect(
      transcriptFromFrames([word('hm', 0, 0.3)], silent, names, 1).segments
    ).toMatchObject([{ text: 'hm', speakerId: 'lane-0' }]);
    expect(
      transcriptFromFrames(
        [word('hm', 0, 0.3)],
        frames(0, () => []),
        names,
        0
      ).segments
    ).toMatchObject([{ speakerId: 'lane-0' }]);
    expect(transcriptFromFrames([], conversation, names, 3).segments).toEqual(
      []
    );
  });

  it('splits at long pauses and wherever the other speakers heard change', () => {
    // Lane 0 talks for 10 s; lane 1 joins at 1–2 s, lane 2 at 3–4 s.
    const lanes = frames(100, (f) => [
      0,
      ...(f >= 10 && f < 20 ? [1] : []),
      ...(f >= 30 && f < 40 ? [2] : []),
    ]);
    const transcript = transcriptFromFrames(
      [
        word('a', 0.1, 0.3),
        word('b', 0.5, 0.8),
        word('c', 1.2, 1.5),
        word('d', 1.6, 1.9),
        word('e', 3.2, 3.5),
        word('f', 5.0, 5.3),
        word('g', 7.0, 7.3),
      ],
      lanes,
      names,
      10
    );
    expect(
      transcript.segments?.map((s) => [s.text, s.overlapSpeakerIds])
    ).toEqual([
      ['a b', undefined],
      ['c d', ['lane-1']],
      ['e', ['lane-2']],
      ['f', undefined],
      ['g', undefined],
    ]);
  });
});
