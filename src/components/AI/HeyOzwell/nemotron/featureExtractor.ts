// Ported from khawjaahmad/nemotron-diarization-web@0dc1980 (MIT, see ./LICENSE).
import { Fft } from './fft';
import { createMelFilterBank } from './mel';
import { type Matrix, createMatrix } from './tensor';

/** Guard added before the log, matching `LOG_ZERO_GUARD_VALUE` in the reference implementation. */
const LOG_ZERO_GUARD_VALUE = 2 ** -24;

export interface FeatureExtractorConfig {
  featureSize: number;
  samplingRate: number;
  hopLength: number;
  nFft: number;
  winLength: number;
  preemphasis: number;
}

export const DEFAULT_FEATURE_CONFIG: FeatureExtractorConfig = {
  featureSize: 128,
  samplingRate: 16000,
  hopLength: 160,
  nFft: 512,
  winLength: 400,
  preemphasis: 0.97,
};

/** Symmetric Hann window (`torch.hann_window(periodic=False)`), zero-padded and centred in `nFft`. */
function createWindow(winLength: number, nFft: number): Float32Array {
  const window = new Float32Array(nFft);
  const offset = (nFft - winLength) >> 1;
  for (let i = 0; i < winLength; i++) {
    window[offset + i] =
      0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (winLength - 1));
  }
  return window;
}

/**
 * Port of `NemotronAsrStreamingFeatureExtractor`: pre-emphasis, STFT and a log-mel spectrogram at
 * one frame per 10 ms. No normalisation is applied, as the model expects raw log-mel features.
 */
export class FeatureExtractor {
  private readonly fft: Fft;
  private readonly window: Float32Array;
  private readonly melFilters: Float32Array;
  private readonly numFrequencyBins: number;
  private readonly frameBuffer: Float32Array;
  private readonly powerBuffer: Float32Array;

  constructor(
    readonly config: FeatureExtractorConfig = DEFAULT_FEATURE_CONFIG
  ) {
    const { nFft, winLength, featureSize, samplingRate } = config;
    this.fft = new Fft(nFft);
    this.window = createWindow(winLength, nFft);
    this.melFilters = createMelFilterBank({
      samplingRate,
      nFft,
      numMelBins: featureSize,
    });
    this.numFrequencyBins = nFft / 2 + 1;
    this.frameBuffer = new Float32Array(nFft);
    this.powerBuffer = new Float32Array(this.numFrequencyBins);
  }

  /**
   * Number of frames the extractor emits for `numSamples` samples. Centred windows are padded by
   * `nFft / 2` on both sides; the trailing frame whose window reaches past the signal is dropped.
   */
  numFrames(numSamples: number, centered: boolean): number {
    const { nFft, hopLength } = this.config;
    const padded = centered ? numSamples + 2 * (nFft >> 1) : numSamples;
    return Math.max(
      0,
      Math.floor((padded - nFft) / hopLength) + (centered ? 0 : 1)
    );
  }

  /**
   * Log-mel spectrogram of `waveform` as a `numFrames x featureSize` matrix.
   *
   * Use `centered` for a standalone recording and for the first chunk of a streaming session; later
   * chunks must use uncentred windows so that their frames reproduce those of a single full pass.
   */
  extract(waveform: Float32Array, centered: boolean): Matrix {
    const { nFft, hopLength, featureSize, preemphasis } = this.config;
    const numFrames = this.numFrames(waveform.length, centered);
    const features = createMatrix(numFrames, featureSize);
    if (numFrames === 0) return features;

    const padding = centered ? nFft >> 1 : 0;
    const signal = this.preemphasise(waveform, padding, preemphasis);

    for (let frame = 0; frame < numFrames; frame++) {
      const start = frame * hopLength;
      for (let i = 0; i < nFft; i++)
        this.frameBuffer[i] = signal[start + i] * this.window[i];
      this.fft.powerSpectrum(this.frameBuffer, this.powerBuffer);
      this.projectToMel(features.data, frame * featureSize);
    }
    return features;
  }

  private preemphasise(
    waveform: Float32Array,
    padding: number,
    coefficient: number
  ): Float32Array {
    const signal = new Float32Array(waveform.length + 2 * padding);
    signal[padding] = waveform[0];
    for (let i = 1; i < waveform.length; i++) {
      signal[padding + i] = waveform[i] - coefficient * waveform[i - 1];
    }
    return signal;
  }

  private projectToMel(target: Float32Array, offset: number): void {
    const { numFrequencyBins, melFilters, powerBuffer } = this;
    for (let mel = 0; mel < this.config.featureSize; mel++) {
      const filterOffset = mel * numFrequencyBins;
      let energy = 0;
      for (let bin = 0; bin < numFrequencyBins; bin++) {
        energy += powerBuffer[bin] * melFilters[filterOffset + bin];
      }
      target[offset + mel] = Math.log(energy + LOG_ZERO_GUARD_VALUE);
    }
  }
}
