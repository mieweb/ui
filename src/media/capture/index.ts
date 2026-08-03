/**
 * Capture-strategy factory and public exports.
 *
 * `createCapture` selects a browser capture strategy for the requested mode.
 * The returned `RecordingCapture` acquires a `MediaStream` + recorder MIME type;
 * everything downstream (MediaRecorder, upload) stays strategy-agnostic.
 */
import { MicrophoneCapture } from './MicrophoneCapture';
import { ScreenCapture } from './ScreenCapture';
import type { CaptureMode, RecordingCapture } from './types';

export type { CaptureMode, CaptureResult, RecordingCapture } from './types';
export { pickSupportedMimeType, toCaptureError } from './mime';
export { MicrophoneCapture } from './MicrophoneCapture';
export { ScreenCapture } from './ScreenCapture';

/** Build the capture strategy for the given mode. */
export function createCapture(mode: CaptureMode): RecordingCapture {
  return mode === 'screen' ? new ScreenCapture() : new MicrophoneCapture();
}
