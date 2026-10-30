import { describe, expect, it } from 'vitest';
import type { Transcript } from '../../TranscriptView/transcript';
import { applySpeakerEdits } from './speakerEdits';

const word = (text: string, startMs: number, speakerId: string) => ({
  text,
  startMs,
  endMs: startMs + 300,
  speakerId,
});

const transcript: Transcript = {
  durationMs: 6000,
  speakers: [
    { id: 'lane-0', name: 'Dr. Smith' },
    { id: 'lane-1', name: 'Speaker 1' },
    { id: 'lane-2', name: 'Speaker 2' },
  ],
  segments: [
    {
      text: 'hello',
      startMs: 0,
      endMs: 300,
      speakerId: 'lane-0',
      words: [word('hello', 0, 'lane-0')],
    },
    {
      text: 'hi',
      startMs: 1000,
      endMs: 1300,
      speakerId: 'lane-1',
      overlapSpeakerIds: ['lane-2'],
      words: [word('hi', 1000, 'lane-1')],
    },
    {
      text: 'yes',
      startMs: 2000,
      endMs: 2300,
      speakerId: 'lane-2',
      words: [word('yes', 2000, 'lane-2')],
    },
  ],
  words: [],
  speakerActivity: [
    { speakerId: 'lane-1', startMs: 1000, endMs: 1300 },
    { speakerId: 'lane-2', startMs: 1100, endMs: 2300 },
  ],
};

describe('applySpeakerEdits', () => {
  it('returns the same speakers and lines when nothing is edited', () => {
    const edited = applySpeakerEdits(transcript, {}, {});
    expect(edited.speakers).toEqual(transcript.speakers);
    expect(edited.segments).toEqual(transcript.segments);
    expect(edited.words.map((w) => w.text)).toEqual(['hello', 'hi', 'yes']);
  });

  it('renames, and merges speakers given the same name everywhere', () => {
    const edited = applySpeakerEdits(
      transcript,
      { 'lane-1': 'Mom', 'lane-2': ' Mom ' },
      {}
    );
    expect(edited.speakers).toEqual([
      { id: 'lane-0', name: 'Dr. Smith' },
      { id: 'lane-1', name: 'Mom' },
    ]);
    expect(edited.segments?.map((s) => s.speakerId)).toEqual([
      'lane-0',
      'lane-1',
      'lane-1',
    ]);
    // Overlap with yourself is not overlap.
    expect(edited.segments?.[1].overlapSpeakerIds).toBeUndefined();
    expect(edited.speakerActivity?.map((a) => a.speakerId)).toEqual([
      'lane-1',
      'lane-1',
    ]);
  });

  it('moves a line and its words to another speaker', () => {
    const edited = applySpeakerEdits(transcript, {}, { 2: 'lane-0' });
    expect(edited.segments?.[2]).toMatchObject({
      speakerId: 'lane-0',
      words: [{ text: 'yes', speakerId: 'lane-0' }],
    });
    expect(edited.speakerActivity).toEqual(transcript.speakerActivity);
  });
});
