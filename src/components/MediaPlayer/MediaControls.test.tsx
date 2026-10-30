import * as React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useMediaTransport } from '../../hooks/useMediaTransport';
import { MediaControls } from './MediaControls';
import { MediaPlayer } from './MediaPlayer';

/** jsdom has no playback: play/pause flip `paused` and fire their events. */
function mockPlayback() {
  const paused = new WeakMap<HTMLMediaElement, boolean>();
  vi.spyOn(HTMLMediaElement.prototype, 'paused', 'get').mockImplementation(
    function (this: HTMLMediaElement) {
      return paused.get(this) ?? true;
    }
  );
  const play = vi
    .spyOn(HTMLMediaElement.prototype, 'play')
    .mockImplementation(function (this: HTMLMediaElement) {
      paused.set(this, false);
      this.dispatchEvent(new Event('play'));
      return Promise.resolve();
    });
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(function (
    this: HTMLMediaElement
  ) {
    paused.set(this, true);
    this.dispatchEvent(new Event('pause'));
  });
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
  return play;
}

/** A video whose metadata says it runs `seconds`. */
function loadMetadata(video: HTMLVideoElement, seconds: number) {
  Object.defineProperty(video, 'duration', {
    configurable: true,
    value: seconds,
  });
  act(() => {
    video.dispatchEvent(new Event('loadedmetadata'));
  });
}

const renderOverlay = () => {
  const view = render(
    <MediaPlayer src="clip.mp4" controlsStyle="overlay" aria-label="Clip" />
  );
  const video = view.container.querySelector('video') as HTMLVideoElement;
  return { ...view, video };
};

beforeEach(() => {
  mockPlayback();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('MediaPlayer overlay controls', () => {
  it("replace the browser's own controls on a video", () => {
    const { video, container } = renderOverlay();
    expect(video.controls).toBe(false);
    expect(
      container.querySelector('[data-slot="media-controls"]')
    ).not.toBeNull();
  });

  it('keeps the browser controls by default, and on audio', () => {
    const { container, rerender } = render(<MediaPlayer src="clip.mp4" />);
    expect(container.querySelector('video')?.controls).toBe(true);
    rerender(<MediaPlayer src="song.mp3" controlsStyle="overlay" />);
    expect(container.querySelector('audio')?.controls).toBe(true);
    expect(container.querySelector('[data-slot="media-controls"]')).toBeNull();
  });

  it('plays and pauses from the bar or a tap on the picture', () => {
    const { video, container } = renderOverlay();
    fireEvent.click(screen.getByRole('button', { name: 'Play' }));
    expect(video.paused).toBe(false);
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
    fireEvent.click(
      container.querySelector('[data-slot="media-controls-surface"]')!
    );
    expect(video.paused).toBe(true);
    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument();
  });

  it('shows the time and seeks from the bar, with the time read out', () => {
    const { video } = renderOverlay();
    loadMetadata(video, 83);
    const seek = screen.getByRole('slider', { name: 'Seek' });
    expect(seek).toHaveAttribute('aria-valuetext', '0:00');
    expect(screen.getByText('0:00 / 1:23')).toBeInTheDocument();
    fireEvent.keyDown(seek, { key: 'End' });
    expect(video.currentTime).toBe(83);
    expect(seek).toHaveAttribute('aria-valuetext', '1:23');
  });

  it('mutes and unmutes', () => {
    const { video } = renderOverlay();
    fireEvent.click(screen.getByRole('button', { name: 'Mute' }));
    expect(video.muted).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Unmute' }));
    expect(video.muted).toBe(false);
  });

  it("takes the player's box full screen where the browser can", () => {
    Object.defineProperty(document, 'fullscreenEnabled', {
      configurable: true,
      value: true,
    });
    const original = HTMLElement.prototype.requestFullscreen;
    const requestFullscreen = vi.fn(() => Promise.resolve());
    HTMLElement.prototype.requestFullscreen = requestFullscreen;
    try {
      const { container } = renderOverlay();
      fireEvent.click(screen.getByRole('button', { name: 'Full screen' }));
      expect(requestFullscreen).toHaveBeenCalledOnce();
      expect(requestFullscreen.mock.contexts[0]).toBe(
        container.querySelector('[data-slot="media-player-box"]')
      );
    } finally {
      HTMLElement.prototype.requestFullscreen = original;
      Object.defineProperty(document, 'fullscreenEnabled', {
        configurable: true,
        value: false,
      });
    }
  });

  it('opens the system player where only the video can go full screen (an iPhone)', () => {
    Object.defineProperty(document, 'fullscreenEnabled', {
      configurable: true,
      value: false,
    });
    const enter = vi.fn();
    const video = HTMLVideoElement.prototype as HTMLVideoElement & {
      webkitEnterFullscreen?: () => void;
      webkitSupportsFullscreen?: boolean;
    };
    video.webkitEnterFullscreen = enter;
    try {
      // Chromium has the method too, but can't use it in a frame that isn't
      // allowed full screen: no button there.
      video.webkitSupportsFullscreen = false;
      const { unmount } = renderOverlay();
      expect(screen.queryByRole('button', { name: 'Full screen' })).toBeNull();
      unmount();
      video.webkitSupportsFullscreen = true;
      renderOverlay();
      fireEvent.click(screen.getByRole('button', { name: 'Full screen' }));
      expect(enter).toHaveBeenCalledOnce();
    } finally {
      delete video.webkitEnterFullscreen;
      delete video.webkitSupportsFullscreen;
    }
  });

  describe('picture in picture', () => {
    const setPipSupport = (enabled: boolean) =>
      Object.defineProperty(document, 'pictureInPictureEnabled', {
        configurable: true,
        value: enabled,
      });
    const setPipElement = (element: Element | null) =>
      Object.defineProperty(document, 'pictureInPictureElement', {
        configurable: true,
        value: element,
      });
    afterEach(() => {
      setPipSupport(false);
      setPipElement(null);
      delete (
        HTMLVideoElement.prototype as { requestPictureInPicture?: unknown }
      ).requestPictureInPicture;
      delete (
        HTMLVideoElement.prototype as {
          webkitSupportsPresentationMode?: unknown;
        }
      ).webkitSupportsPresentationMode;
    });

    it('offers no button where the browser has none', () => {
      setPipSupport(false);
      renderOverlay();
      expect(
        screen.queryByRole('button', { name: 'Picture in picture' })
      ).toBeNull();
    });

    it('floats the video, and says so once it floats', () => {
      setPipSupport(true);
      const request = vi.fn(() =>
        Promise.resolve(
          {} as Awaited<ReturnType<HTMLVideoElement['requestPictureInPicture']>>
        )
      );
      HTMLVideoElement.prototype.requestPictureInPicture = request;
      const { video } = renderOverlay();
      fireEvent.click(
        screen.getByRole('button', { name: 'Picture in picture' })
      );
      expect(request).toHaveBeenCalledOnce();
      expect(request.mock.contexts[0]).toBe(video);
      setPipElement(video);
      act(() => {
        video.dispatchEvent(new Event('enterpictureinpicture'));
      });
      expect(
        screen.getByRole('button', { name: 'Exit picture in picture' })
      ).toBeInTheDocument();
    });

    it("uses Safari's own mode on an iPhone", () => {
      setPipSupport(false);
      const proto = HTMLVideoElement.prototype as HTMLVideoElement & {
        webkitSupportsPresentationMode?: (mode: string) => boolean;
        webkitSetPresentationMode?: (mode: string) => void;
      };
      proto.webkitSupportsPresentationMode = () => true;
      const setMode = vi.fn();
      proto.webkitSetPresentationMode = setMode;
      renderOverlay();
      fireEvent.click(
        screen.getByRole('button', { name: 'Picture in picture' })
      );
      expect(setMode).toHaveBeenCalledWith('picture-in-picture');
      delete proto.webkitSetPresentationMode;
    });

    it("offers the button once Safari's metadata says the video can float", () => {
      setPipSupport(false);
      const proto = HTMLVideoElement.prototype as HTMLVideoElement & {
        webkitSupportsPresentationMode?: (mode: string) => boolean;
      };
      let loaded = false;
      proto.webkitSupportsPresentationMode = () => loaded;
      const { video } = renderOverlay();
      expect(
        screen.queryByRole('button', { name: 'Picture in picture' })
      ).toBeNull();
      loaded = true;
      loadMetadata(video, 10);
      expect(
        screen.getByRole('button', { name: 'Picture in picture' })
      ).toBeInTheDocument();
    });
  });

  it('enters full screen even when the page around it is already full screen', () => {
    Object.defineProperty(document, 'fullscreenEnabled', {
      configurable: true,
      value: true,
    });
    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      value: document.body,
    });
    const request = vi.fn(() => Promise.resolve());
    const exit = vi.fn(() => Promise.resolve());
    const original = HTMLElement.prototype.requestFullscreen;
    HTMLElement.prototype.requestFullscreen = request;
    Object.defineProperty(document, 'exitFullscreen', {
      configurable: true,
      value: exit,
    });
    try {
      renderOverlay();
      fireEvent.click(screen.getByRole('button', { name: 'Full screen' }));
      expect(request).toHaveBeenCalledOnce();
      expect(exit).not.toHaveBeenCalled();
    } finally {
      HTMLElement.prototype.requestFullscreen = original;
      Object.defineProperty(document, 'fullscreenElement', {
        configurable: true,
        value: null,
      });
      Object.defineProperty(document, 'fullscreenEnabled', {
        configurable: true,
        value: false,
      });
    }
  });

  it('lets the seek bar work once a recording reports its length late', () => {
    const { video } = renderOverlay();
    loadMetadata(video, Infinity);
    expect(screen.getByRole('slider', { name: 'Seek' })).toHaveAttribute(
      'aria-disabled',
      'true'
    );
    Object.defineProperty(video, 'duration', {
      configurable: true,
      value: 12,
    });
    act(() => {
      video.dispatchEvent(new Event('durationchange'));
    });
    expect(screen.getByRole('slider', { name: 'Seek' })).not.toHaveAttribute(
      'aria-disabled'
    );
    expect(screen.getByText('0:00 / 0:12')).toBeInTheDocument();
  });

  it('keeps the bar left to right in an RTL page, so ArrowRight seeks forward', () => {
    const { container } = render(
      <div dir="rtl" style={{ direction: 'rtl' }}>
        <MediaPlayer src="clip.mp4" controlsStyle="overlay" aria-label="Clip" />
      </div>
    );
    const video = container.querySelector('video') as HTMLVideoElement;
    loadMetadata(video, 50);
    const bar = container.querySelector('[data-slot="media-controls-bar"]');
    expect(bar).toHaveAttribute('dir', 'ltr');
    // The time label's text is isolated, for an RTL translation.
    expect(
      container.querySelector('[data-slot="media-controls-time"] > bdi')
    ).not.toBeNull();
    // jsdom has no cascade: give the bar the direction a browser would.
    (bar as HTMLElement).style.direction = 'ltr';
    fireEvent.keyDown(screen.getByRole('slider', { name: 'Seek' }), {
      key: 'ArrowRight',
    });
    expect(video.currentTime).toBe(1);
  });

  it('cycles the playback speed: 1×, 1.5×, 2× and back', () => {
    const { video } = renderOverlay();
    const speed = () =>
      screen.getByRole('button', { name: /^Playback speed / });
    expect(speed()).toHaveAccessibleName('Playback speed 1×');
    fireEvent.click(speed());
    expect(video.playbackRate).toBe(1.5);
    expect(speed()).toHaveTextContent('1.5×');
    fireEvent.click(speed());
    expect(video.playbackRate).toBe(2);
    fireEvent.click(speed());
    expect(video.playbackRate).toBe(1);
  });

  it('shows a speed set outside the bar, such as in the system player', () => {
    const { video } = renderOverlay();
    act(() => {
      video.playbackRate = 2;
      video.dispatchEvent(new Event('ratechange'));
    });
    expect(
      screen.getByRole('button', { name: /^Playback speed / })
    ).toHaveAccessibleName('Playback speed 2×');
  });

  it('keeps its buttons from submitting a form around the player', () => {
    const submit = vi.fn((event: Event) => event.preventDefault());
    const { container } = render(
      <form onSubmit={(event) => submit(event.nativeEvent)}>
        <MediaPlayer src="clip.mp4" controlsStyle="overlay" aria-label="Clip" />
      </form>
    );
    for (const button of container.querySelectorAll('button'))
      fireEvent.click(button);
    expect(submit).not.toHaveBeenCalled();
  });

  it('offers captions only when the video has a caption or subtitle track', () => {
    const { unmount } = renderOverlay();
    expect(screen.queryByRole('button', { name: 'Show captions' })).toBeNull();
    unmount();

    // jsdom has no text tracks: give videos a list with one caption track.
    const track = {
      kind: 'captions',
      mode: 'disabled',
    } as globalThis.TextTrack;
    const listeners = new Map<string, () => void>();
    const list = Object.assign([track], {
      addEventListener: (name: string, fn: () => void) =>
        listeners.set(name, fn),
      removeEventListener: (name: string) => listeners.delete(name),
    });
    const spy = vi
      .spyOn(HTMLMediaElement.prototype, 'textTracks', 'get')
      .mockReturnValue(list as unknown as globalThis.TextTrackList);
    try {
      renderOverlay();
      const toggle = screen.getByRole('button', { name: 'Show captions' });
      expect(toggle).toHaveAttribute('aria-pressed', 'false');
      fireEvent.click(toggle);
      expect(track.mode).toBe('showing');
      act(() => listeners.get('change')?.());
      expect(
        screen.getByRole('button', { name: 'Hide captions' })
      ).toHaveAttribute('aria-pressed', 'true');
      fireEvent.click(screen.getByRole('button', { name: 'Hide captions' }));
      expect(track.mode).toBe('disabled');
    } finally {
      spy.mockRestore();
    }
  });

  it('lifts captions on the default line above the bar, and leaves placed ones', () => {
    const cues = [{ line: 'auto' }, { line: 2 }];
    let onCueChange: ((event: Event) => void) | undefined;
    const removeCue = vi.fn();
    const addCue = vi.fn();
    const track = {
      kind: 'subtitles',
      mode: 'showing',
      cues,
      // The first cue is on screen: it's redrawn in its new place.
      activeCues: [cues[0]],
      removeCue,
      addCue,
      addEventListener: (name: string, fn: (event: Event) => void) => {
        if (name === 'cuechange') onCueChange = fn;
      },
      removeEventListener: () => {},
    };
    const list = Object.assign([track], {
      addEventListener: () => {},
      removeEventListener: () => {},
    });
    const spy = vi
      .spyOn(HTMLMediaElement.prototype, 'textTracks', 'get')
      .mockReturnValue(list as unknown as globalThis.TextTrackList);
    try {
      renderOverlay();
      act(() => onCueChange?.({ target: track } as unknown as Event));
      expect(cues.map((cue) => cue.line)).toEqual([-4, 2]);
      expect(removeCue).toHaveBeenCalledWith(cues[0]);
      expect(addCue).toHaveBeenCalledWith(cues[0]);
    } finally {
      spy.mockRestore();
    }
  });

  it('localizes every label', () => {
    render(
      <MediaPlayer
        src="clip.mp4"
        controlsStyle="overlay"
        labels={{ play: 'Lecture', mute: 'Couper le son', seek: 'Position' }}
      />
    );
    expect(screen.getByRole('button', { name: 'Lecture' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Couper le son' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('slider', { name: 'Position' })
    ).toBeInTheDocument();
  });

  it('formats the time through its label, for word order and separators', () => {
    const { container } = render(
      <MediaPlayer
        src="clip.mp4"
        controlsStyle="overlay"
        labels={{ time: (current, duration) => `${current} de ${duration}` }}
      />
    );
    loadMetadata(container.querySelector('video')!, 83);
    expect(screen.getByText('0:00 de 1:23')).toBeInTheDocument();
  });

  it('is a dark surface in every theme', () => {
    const { container } = renderOverlay();
    expect(
      container.querySelector('[data-slot="media-player-box"]')
    ).toHaveAttribute('data-theme', 'dark');
  });
});

describe('MediaControls', () => {
  function Standalone(props: React.ComponentProps<'div'>) {
    const transport = useMediaTransport();
    return (
      <div className="relative">
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video ref={transport.setMediaElement} src="clip.mp4" />
        <MediaControls
          transport={transport}
          ref={props.ref}
          data-testid="controls"
          className="custom"
        />
      </div>
    );
  }

  it('forwards its ref, className and other props to its root', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<Standalone ref={ref} />);
    const root = screen.getByTestId('controls');
    expect(ref.current).toBe(root);
    expect(root).toHaveClass('custom');
    expect(root).toHaveAttribute('data-slot', 'media-controls');
  });
});
