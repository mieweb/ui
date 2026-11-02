import { describe, expect, it } from 'vitest';
import { FeatureExtractor } from './featureExtractor';
import { Fft } from './fft';
import { createMelFilterBank } from './mel';

describe('Fft', () => {
  it('matches a naive DFT power spectrum', () => {
    const size = 16;
    const signal = Float32Array.from({ length: size }, (_, i) =>
      Math.sin(i * 0.7)
    );
    const out = new Float32Array(size / 2 + 1);
    new Fft(size).powerSpectrum(signal, out);

    for (let bin = 0; bin <= size / 2; bin++) {
      let re = 0;
      let im = 0;
      for (let n = 0; n < size; n++) {
        re += signal[n] * Math.cos((2 * Math.PI * bin * n) / size);
        im -= signal[n] * Math.sin((2 * Math.PI * bin * n) / size);
      }
      expect(out[bin]).toBeCloseTo(re * re + im * im, 3);
    }
  });

  it('rejects sizes that are not a power of two', () => {
    expect(() => new Fft(12)).toThrow();
  });
});

describe('createMelFilterBank', () => {
  it('builds one non-negative filter per mel bin', () => {
    const filters = createMelFilterBank({
      samplingRate: 16000,
      nFft: 512,
      numMelBins: 128,
    });
    expect(filters.length).toBe(128 * 257);
    expect(filters.every((v) => v >= 0)).toBe(true);
  });
});

describe('FeatureExtractor', () => {
  const extractor = new FeatureExtractor();

  it('emits one frame per 10 ms hop', () => {
    expect(extractor.numFrames(16000, true)).toBe(100);
    expect(extractor.numFrames(512, false)).toBe(1);
    expect(extractor.numFrames(0, false)).toBe(0);
  });

  it('returns a frames x 128 log-mel matrix', () => {
    const features = extractor.extract(new Float32Array(16000), true);
    expect(features.rows).toBe(100);
    expect(features.cols).toBe(128);
    expect(features.data.every(Number.isFinite)).toBe(true);
  });
});
