/**
 * Shared Storybook helpers for generating sample audio.
 *
 * Produces a synthetic WAV blob URL via the Web Audio API so audio examples
 * work locally without network access or CORS issues. This module is
 * intentionally NOT a `*.stories.*` file, so Storybook does not load it as a
 * story entry. Imported by the AudioPlayer and AIMessage story files.
 */

/**
 * Creates a synthetic audio blob URL using the Web Audio API.
 * Generates a short, pleasant tone that plays locally without CORS issues.
 */
export function createSampleAudioUrl(durationSec = 5, frequency = 440): string {
  const audioContext = new (
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext
  )();
  const sampleRate = audioContext.sampleRate;
  const numSamples = Math.floor(sampleRate * durationSec);

  // Create stereo buffer
  const buffer = audioContext.createBuffer(2, numSamples, sampleRate);

  // Generate a pleasant tone with envelope
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      // Apply envelope (fade in/out)
      const envelope =
        Math.min(t * 4, 1) * Math.min((durationSec - t) * 4, 1) * 0.3;
      // Generate tone with harmonics
      const fundamental = Math.sin(2 * Math.PI * frequency * t);
      const harmonic1 = Math.sin(2 * Math.PI * frequency * 2 * t) * 0.5;
      const harmonic2 = Math.sin(2 * Math.PI * frequency * 3 * t) * 0.25;
      data[i] = envelope * (fundamental + harmonic1 + harmonic2);
    }
  }

  const wavBuffer = audioBufferToWav(buffer);
  const blob = new Blob([wavBuffer], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

/** Converts an AudioBuffer to a 16-bit PCM WAV ArrayBuffer. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function audioBufferToWav(buffer: any): ArrayBuffer {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const samples = buffer.length;
  const dataSize = samples * blockAlign;
  const bufferSize = 44 + dataSize;

  const arrayBuffer = new ArrayBuffer(bufferSize);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // WAV header
  writeString(0, 'RIFF');
  view.setUint32(4, bufferSize - 8, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  // Write interleaved audio data
  let offset = 44;
  for (let i = 0; i < samples; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i]));
      view.setInt16(
        offset,
        sample < 0 ? sample * 0x8000 : sample * 0x7fff,
        true
      );
      offset += 2;
    }
  }

  return arrayBuffer;
}

// Memoized sample URLs (generated once, reused across stories).
let _sampleAudioUrl: string | null = null;
let _shortAudioUrl: string | null = null;
let _longAudioUrl: string | null = null;

/** ~10s A4 tone. */
export function getSampleAudio(): string {
  if (!_sampleAudioUrl) {
    _sampleAudioUrl = createSampleAudioUrl(10, 440);
  }
  return _sampleAudioUrl;
}

/** ~3s C5 tone. */
export function getShortAudio(): string {
  if (!_shortAudioUrl) {
    _shortAudioUrl = createSampleAudioUrl(3, 523.25);
  }
  return _shortAudioUrl;
}

/** ~30s E4 tone. */
export function getLongAudio(): string {
  if (!_longAudioUrl) {
    _longAudioUrl = createSampleAudioUrl(30, 329.63);
  }
  return _longAudioUrl;
}
