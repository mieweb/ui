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

/** Whether this browser can float `video` in picture in picture. */
export function canPictureInPicture(video: WebKitVideo | null): boolean {
  if (!video || typeof document === 'undefined') return false;
  if (video.disablePictureInPicture) return false;
  return (
    document.pictureInPictureEnabled ||
    !!video.webkitSupportsPresentationMode?.('picture-in-picture')
  );
}
