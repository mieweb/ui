// Ported from khawjaahmad/nemotron-diarization-web@0dc1980 (MIT, see ./LICENSE).

/** Slaney-scale mel filter bank, matching `librosa.filters.mel(..., norm="slaney")`. */

const F_SP = 200 / 3;
const MIN_LOG_HZ = 1000;
const MIN_LOG_MEL = MIN_LOG_HZ / F_SP;
const LOG_STEP = Math.log(6.4) / 27;

function hzToMel(hz: number): number {
  return hz >= MIN_LOG_HZ
    ? MIN_LOG_MEL + Math.log(hz / MIN_LOG_HZ) / LOG_STEP
    : hz / F_SP;
}

function melToHz(mel: number): number {
  return mel >= MIN_LOG_MEL
    ? MIN_LOG_HZ * Math.exp(LOG_STEP * (mel - MIN_LOG_MEL))
    : F_SP * mel;
}

export interface MelFilterBankOptions {
  samplingRate: number;
  nFft: number;
  numMelBins: number;
}

/**
 * Triangular filters as a dense `numMelBins x (nFft / 2 + 1)` row-major matrix, area-normalised
 * so that each filter integrates to one (Slaney normalisation).
 */
export function createMelFilterBank({
  samplingRate,
  nFft,
  numMelBins,
}: MelFilterBankOptions): Float32Array {
  const numBins = nFft / 2 + 1;
  const binFrequencies = Float64Array.from(
    { length: numBins },
    (_, bin) => (bin * samplingRate) / nFft
  );

  const minMel = hzToMel(0);
  const maxMel = hzToMel(samplingRate / 2);
  const melPoints = Float64Array.from({ length: numMelBins + 2 }, (_, point) =>
    melToHz(minMel + ((maxMel - minMel) * point) / (numMelBins + 1))
  );

  const filters = new Float32Array(numMelBins * numBins);
  for (let mel = 0; mel < numMelBins; mel++) {
    const [left, center, right] = [
      melPoints[mel],
      melPoints[mel + 1],
      melPoints[mel + 2],
    ];
    const normalisation = 2 / (right - left);
    for (let bin = 0; bin < numBins; bin++) {
      const frequency = binFrequencies[bin];
      const rising = (frequency - left) / (center - left);
      const falling = (right - frequency) / (right - center);
      filters[mel * numBins + bin] =
        Math.max(0, Math.min(rising, falling)) * normalisation;
    }
  }
  return filters;
}
