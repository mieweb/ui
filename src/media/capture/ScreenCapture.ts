/**
 * ScreenCapture — screen/window capture with mixed system + microphone audio.
 *
 * Behavior:
 *   1. getDisplayMedia({ video, audio }) for the screen/window (+ system audio
 *      where the browser supports it).
 *   2. Best-effort getUserMedia({ audio }) for the microphone; a denial here is
 *      non-fatal — recording continues with whatever audio is available.
 *   3. All audio tracks are mixed into one track via an AudioContext +
 *      MediaStreamAudioDestinationNode, then combined with the screen video
 *      track into a single MediaStream.
 *   4. If no audio track is granted at all, fall back to video-only.
 *
 * getDisplayMedia usage is intentionally isolated here so an alternative
 * strategy (e.g. a native mobile capture) can implement RecordingCapture without
 * inheriting browser display-capture assumptions.
 */
import { pickSupportedMimeType, toCaptureError } from './mime';
import type { CaptureResult, RecordingCapture } from './types';

const VIDEO_AV_MIME_CANDIDATES = [
  'video/webm;codecs=vp8,opus',
  'video/webm;codecs=vp9,opus',
  'video/webm',
  'video/mp4',
] as const;

const VIDEO_ONLY_MIME_CANDIDATES = [
  'video/webm;codecs=vp8',
  'video/webm;codecs=vp9',
  'video/webm',
  'video/mp4',
] as const;

const VIDEO_MIME_FALLBACK = 'video/webm';

export class ScreenCapture implements RecordingCapture {
  private displayStream: MediaStream | null = null;
  private micStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private outputStream: MediaStream | null = null;

  async start(): Promise<CaptureResult> {
    // 1. Screen/window + system audio (system audio support is browser-dependent).
    let displayStream: MediaStream;
    try {
      displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
    } catch (err: unknown) {
      throw toCaptureError(
        err,
        'Screen recording permission was denied. Choose a screen or window and try again.',
        'Failed to start screen capture.'
      );
    }
    this.displayStream = displayStream;

    const videoTrack = displayStream.getVideoTracks()[0];
    if (!videoTrack) {
      this.stop();
      throw new Error('The selected source did not provide a video track.');
    }

    // 2. Best-effort microphone capture (non-fatal on denial).
    let micStream: MediaStream | null = null;
    try {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.micStream = micStream;
    } catch {
      micStream = null;
    }

    // 3. Collect and mix all available audio tracks into a single track.
    const audioTracks = [
      ...displayStream.getAudioTracks(),
      ...(micStream ? micStream.getAudioTracks() : []),
    ];

    const outputTracks: MediaStreamTrack[] = [videoTrack];
    let audioCaptured = false;

    if (audioTracks.length > 0) {
      try {
        const audioContext = new AudioContext();
        this.audioContext = audioContext;
        const destination = audioContext.createMediaStreamDestination();
        for (const track of audioTracks) {
          audioContext
            .createMediaStreamSource(new MediaStream([track]))
            .connect(destination);
        }
        const mixedAudioTracks = destination.stream.getAudioTracks();
        if (mixedAudioTracks.length > 0) {
          outputTracks.push(...mixedAudioTracks);
          audioCaptured = true;
        }
      } catch {
        // Audio mixing failed — release the partial AudioContext and continue
        // with video only rather than dropping the already-granted screen
        // capture. start() still resolves, so the caller owns and can stop it.
        if (this.audioContext && this.audioContext.state !== 'closed') {
          void this.audioContext.close();
        }
        this.audioContext = null;
      }
    }

    // 4. Combine into a single stream (video-only when no audio was granted).
    const outputStream = new MediaStream(outputTracks);
    this.outputStream = outputStream;

    const mimeType = audioCaptured
      ? pickSupportedMimeType(VIDEO_AV_MIME_CANDIDATES, VIDEO_MIME_FALLBACK)
      : pickSupportedMimeType(VIDEO_ONLY_MIME_CANDIDATES, VIDEO_MIME_FALLBACK);

    return {
      stream: outputStream,
      mimeType,
      mediaType: 'video',
      audioCaptured,
    };
  }

  stop(): void {
    this.displayStream?.getTracks().forEach((track) => track.stop());
    this.micStream?.getTracks().forEach((track) => track.stop());
    this.outputStream?.getTracks().forEach((track) => track.stop());
    if (this.audioContext && this.audioContext.state !== 'closed') {
      void this.audioContext.close();
    }
    this.displayStream = null;
    this.micStream = null;
    this.outputStream = null;
    this.audioContext = null;
  }
}
