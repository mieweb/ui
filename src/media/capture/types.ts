/**
 * Capture-strategy abstraction for building a recording pipeline.
 *
 * A RecordingCapture owns the acquisition of a MediaStream and the selection of
 * a compatible recorder MIME type. Everything downstream (MediaRecorder
 * timeslicing, upload, commit/abandon) is strategy-agnostic and shared across
 * capture modes.
 *
 * Implementations:
 *   - MicrophoneCapture — getUserMedia({ audio: true })
 *   - ScreenCapture     — getDisplayMedia + optional mic, mixed via AudioContext
 */

/** Capture mode selected by the user before recording starts. */
export type CaptureMode = 'microphone' | 'screen';

/** Result of acquiring a capture stream. */
export interface CaptureResult {
  /** The stream to feed into MediaRecorder. */
  stream: MediaStream;
  /** Full MediaRecorder MIME type (may include a `;codecs=` clause). */
  mimeType: string;
  /** Whether the payload carries video ('video') or audio only ('audio'). */
  mediaType: 'audio' | 'video';
  /** True when at least one audio track was captured (false = video-only fallback). */
  audioCaptured: boolean;
}

/**
 * A pluggable capture strategy. `start()` acquires the stream and resolves the
 * recorder MIME type; `stop()` releases all resources (tracks, AudioContext).
 */
export interface RecordingCapture {
  start(): Promise<CaptureResult>;
  stop(): void;
}
