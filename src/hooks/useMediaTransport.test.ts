import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useMediaTransport } from './useMediaTransport';

/**
 * jsdom does not implement `play`/`pause`, and `duration` defaults to NaN.
 * Build a controllable `<audio>` element with those stubbed.
 */
function makeMediaElement(): HTMLMediaElement {
  const el = document.createElement('audio');
  el.play = vi.fn().mockResolvedValue(undefined) as unknown as HTMLMediaElement['play'];
  el.pause = vi.fn() as unknown as HTMLMediaElement['pause'];
  let paused = true;
  Object.defineProperty(el, 'paused', {
    configurable: true,
    get: () => paused,
    set: (v: boolean) => {
      paused = v;
    },
  });
  let duration = 60; // seconds
  Object.defineProperty(el, 'duration', {
    configurable: true,
    get: () => duration,
    set: (v: number) => {
      duration = v;
    },
  });
  return el;
}

describe('useMediaTransport', () => {
  let el: HTMLMediaElement;

  beforeEach(() => {
    el = makeMediaElement();
  });

  function mount(options = {}) {
    const hook = renderHook(() => useMediaTransport(options));
    act(() => {
      hook.result.current.setMediaElement(el);
    });
    return hook;
  }

  it('starts idle and exposes the attached element', () => {
    const { result } = mount();
    expect(result.current.state).toBe('idle');
    expect(result.current.mediaElement).toBe(el);
    expect(result.current.currentTimeMs).toBe(0);
  });

  it('tracks state from native events', () => {
    const onStateChange = vi.fn();
    const { result } = mount({ onStateChange });

    act(() => el.dispatchEvent(new Event('loadstart')));
    expect(result.current.state).toBe('loading');
    expect(result.current.isLoading).toBe(true);

    act(() => el.dispatchEvent(new Event('play')));
    expect(result.current.state).toBe('playing');
    expect(result.current.isPlaying).toBe(true);

    act(() => el.dispatchEvent(new Event('pause')));
    expect(result.current.state).toBe('paused');

    expect(onStateChange).toHaveBeenCalledWith('loading');
    expect(onStateChange).toHaveBeenCalledWith('playing');
    expect(onStateChange).toHaveBeenCalledWith('paused');
  });

  it('reports duration and time in milliseconds', () => {
    const onTimeUpdate = vi.fn();
    const { result } = mount({ onTimeUpdate });

    act(() => el.dispatchEvent(new Event('loadedmetadata')));
    expect(result.current.durationMs).toBe(60_000);

    el.currentTime = 12.5;
    act(() => el.dispatchEvent(new Event('timeupdate')));
    expect(result.current.currentTimeMs).toBe(12_500);
    expect(onTimeUpdate).toHaveBeenLastCalledWith(12_500, 60_000);
  });

  it('handles ended with the default paused state', () => {
    const onEnded = vi.fn();
    const { result } = mount({ onEnded });
    el.currentTime = 30;
    act(() => el.dispatchEvent(new Event('ended')));
    expect(result.current.state).toBe('paused');
    expect(onEnded).toHaveBeenCalledOnce();
    // default: does not reset position
    expect(el.currentTime).toBe(30);
  });

  it('resets position on ended when resetTimeOnEnd + endedState=idle', () => {
    const { result } = mount({ endedState: 'idle', resetTimeOnEnd: true });
    el.currentTime = 30;
    act(() => el.dispatchEvent(new Event('ended')));
    expect(result.current.state).toBe('idle');
    expect(el.currentTime).toBe(0);
    expect(result.current.currentTimeMs).toBe(0);
  });

  it('emits an error with the provided label', () => {
    const onError = vi.fn();
    const { result } = mount({ onError, errorLabel: 'audio' });
    act(() => el.dispatchEvent(new Event('error')));
    expect(result.current.state).toBe('error');
    expect(onError).toHaveBeenCalledOnce();
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
    expect((onError.mock.calls[0][0] as Error).message).toBe(
      'Failed to load audio'
    );
  });

  it('drives imperative controls on the element', () => {
    const { result } = mount();

    act(() => result.current.play());
    expect(el.play).toHaveBeenCalled();

    act(() => result.current.pause());
    expect(el.pause).toHaveBeenCalled();

    act(() => result.current.seekToMs(5_000));
    expect(el.currentTime).toBe(5);
    expect(result.current.currentTimeMs).toBe(5_000);

    act(() => result.current.setPlaybackRate(1.5));
    expect(el.playbackRate).toBe(1.5);
    expect(result.current.playbackRate).toBe(1.5);

    expect(result.current.getCurrentTimeMs()).toBe(5_000);
    expect(result.current.getDurationMs()).toBe(60_000);
    expect(result.current.isPaused()).toBe(true);
  });

  it('detaches listeners when the element unmounts', () => {
    const onStateChange = vi.fn();
    const { result } = mount({ onStateChange });
    act(() => {
      result.current.setMediaElement(null);
    });
    onStateChange.mockClear();
    act(() => el.dispatchEvent(new Event('play')));
    expect(onStateChange).not.toHaveBeenCalled();
  });
});
