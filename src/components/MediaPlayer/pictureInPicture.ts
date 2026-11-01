// Internal to the media components (MediaControls, MediaFeed, SuperChat's
// media view); not part of the public API.

/** Safari's own full screen and picture in picture, beside the standard APIs. */
export type WebKitVideo = HTMLVideoElement & {
  webkitEnterFullscreen?: () => void;
  webkitSupportsFullscreen?: boolean;
  webkitSupportsPresentationMode?: (mode: string) => boolean;
  webkitSetPresentationMode?: (mode: string) => void;
  webkitPresentationMode?: string;
};

/** The events that say a video went into or out of picture in picture. */
export const PIP_EVENTS: readonly string[] = [
  'enterpictureinpicture',
  'leavepictureinpicture',
  'webkitpresentationmodechanged',
];

/**
 * How long to wait for Safari to say a video left picture in picture before
 * carrying on: the event may never come.
 */
const PIP_EXIT_TIMEOUT_MS = 1000;

/** Whether `video` is floating in picture in picture (either API). */
export function isInPictureInPicture(
  video: HTMLMediaElement | null | undefined
): boolean {
  if (!video || typeof document === 'undefined') return false;
  return (
    document.pictureInPictureElement === video ||
    (video as WebKitVideo).webkitPresentationMode === 'picture-in-picture'
  );
}

/**
 * Bring `video` back from picture in picture (either API). Resolves once it is
 * back inline, or straight away when it wasn't floating.
 */
export function exitPictureInPicture(
  video: HTMLMediaElement | null | undefined
): Promise<void> {
  if (!video || !isInPictureInPicture(video)) return Promise.resolve();
  if (document.pictureInPictureElement === video)
    return document.exitPictureInPicture().catch(() => {});
  return new Promise((resolve) => {
    // Whichever comes first, the event or the timeout, cleans up the other.
    const done = () => {
      clearTimeout(timer);
      video.removeEventListener('webkitpresentationmodechanged', done);
      resolve();
    };
    const timer = setTimeout(done, PIP_EXIT_TIMEOUT_MS);
    video.addEventListener('webkitpresentationmodechanged', done, {
      once: true,
    });
    (video as WebKitVideo).webkitSetPresentationMode?.('inline');
  });
}

/** Whether this browser can float `video` in picture in picture. */
export function canPictureInPicture(video: WebKitVideo | null): boolean {
  if (!video || typeof document === 'undefined') return false;
  if (video.disablePictureInPicture) return false;
  return (
    document.pictureInPictureEnabled ||
    !!video.webkitSupportsPresentationMode?.('picture-in-picture')
  );
}
