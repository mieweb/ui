import { describe, expect, it } from 'vitest';
import { SpeakerCache, type StreamingConfig } from './speakerCache';
import { wrapMatrix } from './tensor';

const config: StreamingConfig = {
  fifo_length: 4,
  speaker_cache_length: 12,
  speaker_cache_update_period: 2,
  speaker_cache_silence_frames_per_speaker: 1,
  prediction_score_threshold: 0.25,
  latest_frames_score_boost: 0.05,
  min_positive_scores_rate: 0.5,
  strong_boost_rate: 0.75,
  weak_boost_rate: 1.5,
  num_speakers: 3,
  subsampling_factor: 1,
};
const HIDDEN = 2;
const voice = (...rows: number[][]) =>
  wrapMatrix(Float32Array.from(rows.flat()), HIDDEN);

describe('SpeakerCache voiceprints', () => {
  it('seeds voices in lane order and extracts the dominant one back', () => {
    const cache = new SpeakerCache(config, HIDDEN);
    expect(cache.framesPerSpeaker).toBe(3);
    cache.seed([voice([1, 1], [2, 2]), voice([3, 3])]);

    expect(Array.from(cache.getCachedEmbeds().data)).toEqual([
      1, 1, 2, 2, 3, 3,
    ]);
    // Lane 0 holds two frames, so it dominates.
    expect(Array.from(cache.voiceprint()?.data ?? [])).toEqual([1, 1, 2, 2]);
  });

  it('is a no-op without voices and has no voiceprint when empty', () => {
    const cache = new SpeakerCache(config, HIDDEN);
    cache.seed([]);
    expect(cache.getCachedEmbeds().rows).toBe(0);
    expect(cache.voiceprint()).toBeNull();
  });

  it('rejects voiceprints that cannot fit this model', () => {
    const cache = () => new SpeakerCache(config, HIDDEN);
    expect(() =>
      cache().seed([voice([1, 1]), voice([2, 2]), voice([3, 3])])
    ).toThrow(/At most 2 voices/);
    expect(() => cache().seed([voice([1, 1], [1, 1], [1, 1], [1, 1])])).toThrow(
      /re-enroll/
    );
    expect(() =>
      cache().seed([wrapMatrix(new Float32Array(3), HIDDEN)])
    ).toThrow(/re-enroll/);
  });
});
