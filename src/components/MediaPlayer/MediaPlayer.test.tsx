import { createRef } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import {
  MediaPlayer,
  inferMediaKind,
  type MediaPlayerRef,
} from './MediaPlayer';

beforeAll(() => {
  // jsdom does not implement play/pause.
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(
    () => Promise.resolve() as unknown as ReturnType<HTMLMediaElement['play']>
  );
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
});

describe('inferMediaKind', () => {
  it('detects video extensions', () => {
    expect(inferMediaKind('clip.mp4')).toBe('video');
    expect(inferMediaKind('/a/b/clip.MOV?x=1')).toBe('video');
    expect(inferMediaKind('rec.webm')).toBe('video');
  });
  it('defaults to audio', () => {
    expect(inferMediaKind('sound.mp3')).toBe('audio');
    expect(inferMediaKind('no-extension')).toBe('audio');
  });
});

describe('MediaPlayer', () => {
  it('renders a video element for a video src', () => {
    const { container } = render(<MediaPlayer src="movie.mp4" />);
    expect(container.querySelector('video')).not.toBeNull();
    expect(container.querySelector('audio')).toBeNull();
  });

  it('renders an audio element for an audio src', () => {
    const { container } = render(<MediaPlayer src="song.mp3" />);
    expect(container.querySelector('audio')).not.toBeNull();
    expect(container.querySelector('video')).toBeNull();
  });

  it('honours a forced kind', () => {
    const { container } = render(<MediaPlayer src="ambiguous" kind="video" />);
    expect(container.querySelector('video')).not.toBeNull();
  });

  it('mirrors the element into mediaElementRef', () => {
    const mediaElementRef = createRef<HTMLVideoElement | HTMLAudioElement>();
    const { container } = render(
      <MediaPlayer src="song.mp3" mediaElementRef={mediaElementRef} />
    );
    expect(mediaElementRef.current).toBe(container.querySelector('audio'));
  });

  it('exposes an imperative handle in milliseconds', () => {
    const ref = createRef<MediaPlayerRef>();
    const { container } = render(<MediaPlayer ref={ref} src="song.mp3" />);
    const el = container.querySelector('audio') as HTMLAudioElement;
    expect(ref.current?.mediaElement).toBe(el);

    act(() => ref.current?.seekToMs(4200));
    expect(el.currentTime).toBeCloseTo(4.2);
    expect(ref.current?.getCurrentTimeMs()).toBeCloseTo(4200);

    act(() => ref.current?.setPlaybackRate(1.25));
    expect(el.playbackRate).toBe(1.25);

    ref.current?.play();
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalled();
    ref.current?.pause();
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled();
    expect(ref.current?.isPaused()).toBe(true);
  });

  it('forwards state changes and time updates', () => {
    const onStateChange = vi.fn();
    const onTimeUpdate = vi.fn();
    const { container } = render(
      <MediaPlayer
        src="song.mp3"
        onStateChange={onStateChange}
        onTimeUpdate={onTimeUpdate}
      />
    );
    const el = container.querySelector('audio') as HTMLAudioElement;
    fireEvent(el, new Event('play'));
    expect(onStateChange).toHaveBeenCalledWith('playing');
    Object.defineProperty(el, 'duration', { configurable: true, value: 30 });
    el.currentTime = 3;
    fireEvent(el, new Event('timeupdate'));
    expect(onTimeUpdate).toHaveBeenLastCalledWith(3000, 30000);
  });

  it('shows a retry surface on error and recovers', () => {
    const onError = vi.fn();
    const { container } = render(
      <MediaPlayer src="song.mp3" onError={onError} />
    );
    const el = container.querySelector('audio') as HTMLAudioElement;
    fireEvent(el, new Event('error'));

    expect(onError).toHaveBeenCalledOnce();
    expect(screen.getByRole('alert')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(container.querySelector('audio')).not.toBeNull();
  });
});
