import { useCallback, useEffect, useRef, useState } from 'react';

// =============================================================================
// Types
// =============================================================================

export type MediaTransportState =
  | 'idle'
  | 'loading'
  | 'playing'
  | 'paused'
  | 'error';

export interface UseMediaTransportOptions {
  /** Fired on every native `timeupdate` and on metadata load, in milliseconds. */
  onTimeUpdate?: (currentTimeMs: number, durationMs: number) => void;
  /** Fired whenever the derived transport state changes. */
  onStateChange?: (state: MediaTransportState) => void;
  /** Fired when playback reaches the end. */
  onEnded?: () => void;
  /** Fired on a media error, with a descriptive Error. */
  onError?: (error: Error) => void;
  /** Initial playback rate (default `1`). Kept in sync with the element. */
  initialRate?: number;
  /** Transport state to enter when playback ends (default `'paused'`). */
  endedState?: Extract<MediaTransportState, 'idle' | 'paused'>;
  /** Reset the position to `0` when playback ends (default `false`). */
  resetTimeOnEnd?: boolean;
  /** Human-readable label used in the error message (default `'media'`). */
  errorLabel?: string;
}

export interface UseMediaTransportReturn {
  /**
   * Callback ref for the `<audio>`/`<video>` element to control. Pass this to
   * the element's `ref` (or call it imperatively). Transport listeners attach
   * when an element mounts and detach when it unmounts.
   */
  setMediaElement: (element: HTMLMediaElement | null) => void;
  /** The currently attached media element, or `null`. */
  mediaElement: HTMLMediaElement | null;

  /** Derived transport state. */
  state: MediaTransportState;
  /** Current playback position in milliseconds. */
  currentTimeMs: number;
  /** Media duration in milliseconds (`0` until known / non-finite). */
  durationMs: number;
  /** Current playback rate. */
  playbackRate: number;
  /** `true` while `state === 'playing'`. */
  isPlaying: boolean;
  /** `true` while `state === 'loading'`. */
  isLoading: boolean;

  /** Start playback. */
  play: () => void;
  /** Pause playback. */
  pause: () => void;
  /** Toggle between play and pause. */
  togglePlay: () => void;
  /** Seek to a position in milliseconds. */
  seekToMs: (timeMs: number) => void;
  /** Set the playback rate multiplier. */
  setPlaybackRate: (rate: number) => void;
  /** Read the current position in milliseconds. */
  getCurrentTimeMs: () => number;
  /** Read the duration in milliseconds (`0` when unknown). */
  getDurationMs: () => number;
  /** Whether playback is currently paused (reads the element directly). */
  isPaused: () => boolean;
}

// =============================================================================
// Helpers
// =============================================================================

const toMs = (seconds: number): number =>
  Number.isFinite(seconds) ? seconds * 1000 : 0;

// =============================================================================
// Hook
// =============================================================================

/**
 * Headless playback transport for a native `HTMLMediaElement`.
 *
 * Owns the derived transport state (idle/loading/playing/paused/error),
 * position, duration and playback rate, and exposes imperative controls — all
 * in **milliseconds**. It never creates or renders an element: pass the
 * returned {@link UseMediaTransportReturn.setMediaElement} callback to an
 * `<audio>`/`<video>` `ref` and the hook wires the native listeners.
 *
 * Shared by `MediaPlayer` (ms API) and TranscriptPlayer's `usePlayback` (seconds,
 * converted at the boundary). The WaveSurfer waveform variant is
 * out of scope; this hook targets native media transport only.
 *
 * @example
 * ```tsx
 * function Player({ src }: { src: string }) {
 *   const t = useMediaTransport({ onEnded: () => console.log('done') });
 *   return (
 *     <div>
 *       <video ref={t.setMediaElement} src={src} controls />
 *       <button onClick={t.togglePlay}>{t.isPlaying ? 'Pause' : 'Play'}</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useMediaTransport(
  options: UseMediaTransportOptions = {}
): UseMediaTransportReturn {
  const {
    onTimeUpdate,
    onStateChange,
    onEnded,
    onError,
    initialRate = 1,
    endedState = 'paused',
    resetTimeOnEnd = false,
    errorLabel = 'media',
  } = options;

  const [element, setElementState] = useState<HTMLMediaElement | null>(null);
  const [state, setStateRaw] = useState<MediaTransportState>('idle');
  const stateRef = useRef<MediaTransportState>('idle');
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [playbackRate, setPlaybackRateState] = useState(initialRate);

  const elementRef = useRef<HTMLMediaElement | null>(null);

  // Keep the latest callbacks/options in a ref so the listener effect does not
  // re-subscribe on every render when callers pass inline functions.
  const handlers = useRef({
    onTimeUpdate,
    onStateChange,
    onEnded,
    onError,
    endedState,
    resetTimeOnEnd,
    errorLabel,
  });
  handlers.current = {
    onTimeUpdate,
    onStateChange,
    onEnded,
    onError,
    endedState,
    resetTimeOnEnd,
    errorLabel,
  };

  const setState = useCallback((next: MediaTransportState) => {
    if (stateRef.current === next) return;
    stateRef.current = next;
    setStateRaw(next);
    // Consumers often update parent state here. Keep that notification outside
    // React's state updater, which may run during render or twice in StrictMode.
    handlers.current.onStateChange?.(next);
  }, []);

  const setMediaElement = useCallback((el: HTMLMediaElement | null) => {
    elementRef.current = el;
    setElementState(el);
  }, []);

  // Attach native transport listeners whenever an element mounts.
  useEffect(() => {
    if (!element) {
      // A detached element (e.g. the source was removed) leaves nothing playing or loaded;
      // an error stays visible to hosts that swap the element for an error panel.
      if (stateRef.current !== 'error') setState('idle');
      setDurationMs(0);
      setCurrentTimeMs(0);
      return;
    }

    const emitTime = () => {
      const ms = toMs(element.currentTime);
      const dur = toMs(element.duration);
      setCurrentTimeMs(ms);
      handlers.current.onTimeUpdate?.(ms, dur);
    };

    const onLoadStart = () => setState('loading');
    // canplay can also follow a seek mid-playback; only leave the loading state here.
    const onCanPlay = () => {
      if (stateRef.current === 'loading')
        setState(element.paused ? 'idle' : 'playing');
    };
    const onLoadedMetadata = () => {
      setDurationMs(toMs(element.duration));
      emitTime();
    };
    // MediaRecorder webm often reports Infinity until the end is known.
    const onDurationChange = () => setDurationMs(toMs(element.duration));
    const onTimeUpdateEvt = () => emitTime();
    const onPlay = () => setState('playing');
    const onPlaying = () => setState('playing');
    const onPause = () => setState('paused');
    const onEndedEvt = () => {
      setState(handlers.current.endedState);
      if (handlers.current.resetTimeOnEnd) {
        element.currentTime = 0;
        setCurrentTimeMs(0);
      }
      handlers.current.onEnded?.();
    };
    const onErrorEvt = () => {
      setState('error');
      handlers.current.onError?.(
        new Error(`Failed to load ${handlers.current.errorLabel}`)
      );
    };

    element.addEventListener('loadstart', onLoadStart);
    element.addEventListener('canplay', onCanPlay);
    element.addEventListener('loadedmetadata', onLoadedMetadata);
    element.addEventListener('durationchange', onDurationChange);
    element.addEventListener('timeupdate', onTimeUpdateEvt);
    element.addEventListener('play', onPlay);
    element.addEventListener('playing', onPlaying);
    element.addEventListener('pause', onPause);
    element.addEventListener('ended', onEndedEvt);
    element.addEventListener('error', onErrorEvt);

    // Sync on attach; a new element must not inherit the previous one's duration or play state.
    setDurationMs(toMs(element.duration));
    if (element.paused && stateRef.current === 'playing') setState('paused');
    // e.g. a 404 that failed before hydration attached these listeners.
    if (element.error) onErrorEvt();

    return () => {
      element.removeEventListener('loadstart', onLoadStart);
      element.removeEventListener('canplay', onCanPlay);
      element.removeEventListener('loadedmetadata', onLoadedMetadata);
      element.removeEventListener('durationchange', onDurationChange);
      element.removeEventListener('timeupdate', onTimeUpdateEvt);
      element.removeEventListener('play', onPlay);
      element.removeEventListener('playing', onPlaying);
      element.removeEventListener('pause', onPause);
      element.removeEventListener('ended', onEndedEvt);
      element.removeEventListener('error', onErrorEvt);
    };
  }, [element, setState]);

  // Keep the element's playback rate in sync with hook state.
  useEffect(() => {
    if (element) element.playbackRate = playbackRate;
  }, [element, playbackRate]);

  const play = useCallback(() => {
    void elementRef.current?.play();
  }, []);

  const pause = useCallback(() => {
    elementRef.current?.pause();
  }, []);

  const togglePlay = useCallback(() => {
    const el = elementRef.current;
    if (!el) return;
    // A refused start (autoplay policy) leaves it paused; nothing to report.
    if (el.paused) void el.play()?.catch(() => {});
    else el.pause();
  }, []);

  const seekToMs = useCallback((timeMs: number) => {
    const el = elementRef.current;
    if (el) {
      el.currentTime = timeMs / 1000;
      setCurrentTimeMs(timeMs);
    }
  }, []);

  const setPlaybackRate = useCallback((rate: number) => {
    setPlaybackRateState(rate);
    if (elementRef.current) elementRef.current.playbackRate = rate;
  }, []);

  const getCurrentTimeMs = useCallback(
    () => toMs(elementRef.current?.currentTime ?? 0),
    []
  );

  const getDurationMs = useCallback(
    () => toMs(elementRef.current?.duration ?? 0),
    []
  );

  const isPaused = useCallback(() => elementRef.current?.paused ?? true, []);

  return {
    setMediaElement,
    mediaElement: element,
    state,
    currentTimeMs,
    durationMs,
    playbackRate,
    isPlaying: state === 'playing',
    isLoading: state === 'loading',
    play,
    pause,
    togglePlay,
    seekToMs,
    setPlaybackRate,
    getCurrentTimeMs,
    getDurationMs,
    isPaused,
  };
}
