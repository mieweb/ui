/**
 * MicrophoneCapture — microphone-only capture via getUserMedia.
 *
 * Records a single audio track to a WebM/Opus (or MP4 fallback) container.
 */
import { pickSupportedMimeType, toCaptureError } from './mime';
import type { CaptureResult, RecordingCapture } from './types';

const AUDIO_MIME_CANDIDATES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
] as const;
const AUDIO_MIME_FALLBACK = 'audio/webm';

export class MicrophoneCapture implements RecordingCapture {
  private stream: MediaStream | null = null;

  async start(): Promise<CaptureResult> {
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err: unknown) {
      throw toCaptureError(
        err,
        'Microphone permission was denied. Allow microphone access and try again.',
        'Failed to access the microphone.'
      );
    }
    this.stream = stream;
    return {
      stream,
      mimeType: pickSupportedMimeType(
        AUDIO_MIME_CANDIDATES,
        AUDIO_MIME_FALLBACK
      ),
      mediaType: 'audio',
      audioCaptured: true,
    };
  }

  stop(): void {
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
  }
}
