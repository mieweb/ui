import { describe, expect, it } from 'vitest';
import {
  diarizationErrorRate,
  identification,
  longestSoloWindow,
  spansFromFrames,
  summarize,
  type SpeakerSpan,
} from './compare';

describe('identification', () => {
  const truth: SpeakerSpan[] = [
    { speaker: 'Dr. Smith', start: 0, end: 2 },
    { speaker: 'Stranger', start: 2, end: 4 },
    { speaker: 'Nurse', start: 4, end: 6 },
  ];
  const enrolled = ['Dr. Smith', 'Nurse'];

  it('counts correct names, false accepts and missed enrolled people', () => {
    const hypothesis: SpeakerSpan[] = [
      { speaker: 'Dr. Smith', start: 0, end: 2 },
      { speaker: 'Nurse', start: 2, end: 4 },
      { speaker: 'Speaker 1', start: 4, end: 6 },
    ];
    expect(identification(truth, hypothesis, enrolled)).toEqual({
      correct: 1,
      falseAccept: 1,
      missed: 1,
    });
  });

  it('does not count unnamed strangers', () => {
    const hypothesis: SpeakerSpan[] = [
      { speaker: 'Speaker 1', start: 2, end: 4 },
    ];
    expect(identification(truth, hypothesis, enrolled)).toEqual({
      correct: 0,
      falseAccept: 0,
      missed: 0,
    });
  });
});

describe('longestSoloWindow', () => {
  // Lane 0 alone 0–0.2 s, with lane 1 0.2–0.4 s, alone again 0.4–0.7 s.
  const lanes = [[0], [0], [0, 1], [0, 1], [0], [0], [0]];
  const probabilities = new Float32Array(lanes.length * 2);
  lanes.forEach((active, f) =>
    active.forEach((l) => (probabilities[f * 2 + l] = 0.9))
  );
  const frames = { probabilities, numSpeakers: 2, frameDurationSeconds: 0.1 };

  it('returns the longest stretch where only that lane is active', () => {
    const solo = longestSoloWindow(frames, 0);
    expect(solo?.start).toBeCloseTo(0.4);
    expect(solo?.end).toBeCloseTo(0.7);
    expect(longestSoloWindow(frames, 1)).toBeNull();
  });
});

const reference: SpeakerSpan[] = [
  { speaker: 'A', start: 0, end: 2 },
  { speaker: 'B', start: 1, end: 3 },
];

describe('spansFromFrames', () => {
  it('turns each run above the threshold into a span, overlap included', () => {
    // 4 frames x 2 speakers at 0.5 s per frame.
    const probabilities = Float32Array.from([
      0.9, 0.1, 0.9, 0.8, 0.2, 0.8, 0.1, 0.1,
    ]);
    expect(spansFromFrames(probabilities, 2, 0.5)).toEqual([
      { speaker: 'Speaker 1', start: 0, end: 1 },
      { speaker: 'Speaker 2', start: 0.5, end: 1.5 },
    ]);
  });

  it('drops spans shorter than minSeconds', () => {
    const probabilities = Float32Array.from([0.9, 0.1, 0.1]);
    expect(
      spansFromFrames(probabilities, 1, 0.01, { minSeconds: 0.05 })
    ).toEqual([]);
  });
});

describe('summarize', () => {
  it('counts speakers, speech, overlap and short turns', () => {
    const summary = summarize([
      ...reference,
      { speaker: 'A', start: 4, end: 4.5 },
    ]);
    expect(summary.speakers).toBe(2);
    expect(summary.speechSeconds).toBeCloseTo(3.5);
    expect(summary.overlapSeconds).toBeCloseTo(1);
    expect(summary.shortTurns).toBe(1);
  });
});

describe('diarizationErrorRate', () => {
  it('is zero for an identical result', () => {
    expect(diarizationErrorRate(reference, reference).der).toBe(0);
  });

  it('ignores label names (best mapping)', () => {
    const renamed = reference.map((span) => ({
      ...span,
      speaker: span.speaker === 'A' ? 'Speaker 2' : 'Speaker 1',
    }));
    expect(diarizationErrorRate(reference, renamed).der).toBe(0);
  });

  it('counts missed overlap when only one speaker is detected', () => {
    const single: SpeakerSpan[] = [{ speaker: 'X', start: 0, end: 3 }];
    const result = diarizationErrorRate(reference, single);
    // Reference has 4 s of speaker time; the overlap second is missed, and 1 s of B is confused.
    expect(result.referenceSeconds).toBeCloseTo(4);
    expect(result.missed).toBeCloseTo(1);
    expect(result.confusion).toBeCloseTo(1);
    expect(result.falseAlarm).toBeCloseTo(0);
    expect(result.der).toBeCloseTo(0.5);
  });

  it('counts false alarms for speech outside the reference', () => {
    const result = diarizationErrorRate(reference, [
      ...reference,
      { speaker: 'A', start: 3, end: 4 },
    ]);
    expect(result.falseAlarm).toBeCloseTo(1);
    expect(result.der).toBeCloseTo(0.25);
  });
});
