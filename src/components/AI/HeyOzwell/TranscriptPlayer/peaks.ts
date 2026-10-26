/** Waveform peaks: loudness per short time bucket, normalised to [0, 1]. */
import * as React from 'react';
import { decodeTo16kMono } from '../../whisperTranscribe';

export interface WaveformPeaks {
  data: Float32Array;
  perSecond: number;
}

/** 20 ms buckets: detailed enough at the narrowest zoom, ~1 MB for an hour. */
export const PEAKS_PER_SECOND = 50;

export function computePeaks(
  samples: ArrayLike<number>,
  sampleRate: number,
  perSecond = PEAKS_PER_SECOND
): WaveformPeaks {
  const bucket = Math.max(1, Math.floor(sampleRate / perSecond));
  const data = new Float32Array(Math.ceil(samples.length / bucket));
  let max = 0;
  for (let i = 0; i < samples.length; i++) {
    const v = Math.abs(samples[i]);
    const b = Math.floor(i / bucket);
    if (v > data[b]) data[b] = v;
    if (v > max) max = v;
  }
  if (max > 0) for (let i = 0; i < data.length; i++) data[i] /= max;
  return { data, perSecond: sampleRate / bucket };
}

/**
 * Uses `provided` peaks when the host has them (e.g. samples it already decoded); otherwise decodes
 * `src` once. Decoding holds the whole recording in memory, so hosts with long recordings should pass peaks.
 */
export function useWaveformPeaks(
  src: string | null | undefined,
  provided?: WaveformPeaks
): WaveformPeaks | null {
  const [decoded, setDecoded] = React.useState<WaveformPeaks | null>(null);

  React.useEffect(() => {
    setDecoded(null);
    if (provided || !src) return;
    const abort = new AbortController();
    fetch(src, { signal: abort.signal })
      .then((response) => response.blob())
      .then(decodeTo16kMono)
      .then((samples) => {
        if (!abort.signal.aborted) setDecoded(computePeaks(samples, 16000));
      })
      .catch(() => {
        /* no waveform; playback and lanes still work */
      });
    return () => abort.abort();
  }, [src, provided]);

  return provided ?? decoded;
}
