/**
 * Shared helpers for capture strategies.
 */

/**
 * Return the first MIME type in `candidates` that the platform's MediaRecorder
 * can produce, falling back to `fallback` when none are supported (or when
 * MediaRecorder is unavailable, e.g. SSR).
 */
export function pickSupportedMimeType(
  candidates: readonly string[],
  fallback: string
): string {
  if (typeof MediaRecorder !== 'undefined') {
    for (const candidate of candidates) {
      if (MediaRecorder.isTypeSupported(candidate)) return candidate;
    }
  }
  return fallback;
}

/**
 * Normalize an unknown capture error into a clear, user-surfaceable Error.
 * Permission denials from getUserMedia/getDisplayMedia raise NotAllowedError.
 */
export function toCaptureError(
  err: unknown,
  deniedMessage: string,
  genericMessage: string
): Error {
  if (
    typeof DOMException !== 'undefined' &&
    err instanceof DOMException &&
    (err.name === 'NotAllowedError' || err.name === 'SecurityError')
  ) {
    return new Error(deniedMessage);
  }
  if (err instanceof Error) return err;
  return new Error(genericMessage);
}
