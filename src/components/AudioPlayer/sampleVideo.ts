/**
 * Shared Storybook helper for generating a sample video.
 *
 * Produces a short synthetic WebM blob URL by animating a canvas and capturing
 * it with `MediaRecorder`, so video examples work locally without network
 * access or CORS issues. This module is intentionally NOT a `*.stories.*` file,
 * so Storybook does not load it as a story entry. Imported by the AIMessage
 * story file.
 */

/**
 * Creates a synthetic video blob URL by animating a canvas and recording it
 * with `MediaRecorder`. Resolves to a `blob:` URL created via
 * `URL.createObjectURL`. Callers that use this outside the memoized getter
 * below should call `URL.revokeObjectURL` when the URL is no longer needed to
 * avoid leaking the underlying blob.
 */
export function createSampleVideoUrl(durationSec = 3): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 180;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(
        new Error('2D canvas context is not available in this environment.')
      );
      return;
    }

    if (
      typeof MediaRecorder === 'undefined' ||
      typeof canvas.captureStream !== 'function'
    ) {
      reject(
        new Error(
          'MediaRecorder / canvas.captureStream is not available in this environment.'
        )
      );
      return;
    }

    const stream = canvas.captureStream(30);

    // Pick a container/codec the browser can actually record; fall back to the
    // browser default when none of the preferred types are supported.
    const preferredTypes = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
      'video/mp4',
    ];
    const supportsIsTypeSupported =
      typeof MediaRecorder.isTypeSupported === 'function';
    const mimeType = supportsIsTypeSupported
      ? preferredTypes.find((type) => MediaRecorder.isTypeSupported(type))
      : undefined;

    let recorder: MediaRecorder;
    try {
      recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
    } catch (err) {
      stream.getTracks().forEach((track) => track.stop());
      reject(
        err instanceof Error
          ? err
          : new Error('MediaRecorder could not be created in this environment.')
      );
      return;
    }

    const chunks: Blob[] = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    recorder.onerror = () => {
      stream.getTracks().forEach((track) => track.stop());
      reject(new Error('MediaRecorder failed to capture the sample video.'));
    };
    recorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
      const blob = new Blob(chunks, {
        type: recorder.mimeType || 'video/webm',
      });
      resolve(URL.createObjectURL(blob));
    };

    // Animate a moving colour band with a caption so the clip is visibly a video.
    const start = Date.now();
    const draw = () => {
      const elapsed = (Date.now() - start) / 1000;
      const hue = Math.floor((elapsed * 120) % 360);
      ctx.fillStyle = `hsl(${hue}, 70%, 45%)`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'white';
      ctx.font = '20px sans-serif';
      ctx.fillText('Sample recording', 70, 95);
      if (elapsed < durationSec) {
        requestAnimationFrame(draw);
      } else {
        recorder.stop();
      }
    };

    recorder.start();
    requestAnimationFrame(draw);
  });
}

// Memoized sample URL promise (generated once, reused across stories).
let _sampleVideoPromise: Promise<string> | null = null;

/** ~3s animated WebM clip. */
export function getSampleVideo(): Promise<string> {
  if (!_sampleVideoPromise) {
    _sampleVideoPromise = createSampleVideoUrl(3);
  }
  return _sampleVideoPromise;
}
