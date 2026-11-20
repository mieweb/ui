import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { exitPictureInPicture, type WebKitVideo } from './pictureInPicture';

/** A video floating in Safari's own picture in picture (an iPhone). */
function floatingInSafari() {
  const video = document.createElement('video') as WebKitVideo;
  video.webkitPresentationMode = 'picture-in-picture';
  video.webkitSetPresentationMode = vi.fn();
  return video;
}

describe('exitPictureInPicture in Safari', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('resolves when the video says it is back, and drops its timeout', async () => {
    const video = floatingInSafari();
    const back = exitPictureInPicture(video);
    expect(video.webkitSetPresentationMode).toHaveBeenCalledWith('inline');
    video.dispatchEvent(new Event('webkitpresentationmodechanged'));
    await back;
    expect(vi.getTimerCount()).toBe(0);
  });

  it('stops waiting when the event never comes, and stops listening for it', async () => {
    const video = floatingInSafari();
    const removeListener = vi.spyOn(video, 'removeEventListener');
    const back = exitPictureInPicture(video);
    await vi.advanceTimersByTimeAsync(1000);
    await back;
    expect(removeListener).toHaveBeenCalledWith(
      'webkitpresentationmodechanged',
      expect.any(Function)
    );
  });
});
