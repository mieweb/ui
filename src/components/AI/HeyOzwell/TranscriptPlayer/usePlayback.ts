/**
 * TranscriptPlayer's playback, layered on the shared `useMediaTransport` (element listeners,
 * play/pause state, duration, speed, seek). Adds what the transport does not have: interval
 * playback that stops at the interval's end, a smooth rAF playhead, volume, and play() refusals
 * reported as an error. Render `<audio ref={setMediaElement} key={src} src={src} />`.
 */
import * as React from 'react';
import { useMediaTransport } from '../../../../hooks/useMediaTransport';
import type { TimeRange } from './model';

export interface Playback {
  /** Callback ref for the player's `<audio>` element. */
  setMediaElement: (element: HTMLMediaElement | null) => void;
  playing: boolean;
  /** Seconds. */
  currentTime: number;
  /** Seconds; 0 until known. */
  duration: number;
  rate: number;
  volume: number;
  /** Why playback is unavailable: the recording failed to load, or play() was refused. */
  error: 'load' | 'play' | null;
  /** The interval being played on its own, if any. */
  range: (TimeRange & { id?: string }) | null;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seek: (time: number) => void;
  /** Plays only `range`, pausing at its end. */
  playRange: (range: TimeRange & { id?: string }) => void;
  setRate: (rate: number) => void;
  setVolume: (volume: number) => void;
}

export function usePlayback(src: string | null | undefined): Playback {
  const audioRef = React.useRef<HTMLMediaElement | null>(null);
  const rangeRef = React.useRef<Playback['range']>(null);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [volume, setVolumeState] = React.useState(1);
  const [error, setError] = React.useState<Playback['error']>(null);
  const [range, setRangeState] = React.useState<Playback['range']>(null);

  const setRange = React.useCallback((next: Playback['range']) => {
    rangeRef.current = next;
    setRangeState(next);
  }, []);

  /** Pauses at the end of interval playback; true when it stopped. */
  const stopAtRangeEnd = React.useCallback(
    (audio: HTMLMediaElement) => {
      const r = rangeRef.current;
      if (!r || audio.currentTime < r.end) return false;
      audio.pause();
      audio.currentTime = r.end;
      setCurrentTime(r.end);
      setRange(null);
      return true;
    },
    [setRange]
  );

  const transport = useMediaTransport({
    errorLabel: 'recording',
    onError: () => setError('load'),
    // rAF is paused in background tabs; timeupdate still fires, so it also keeps time and enforces the interval end.
    onTimeUpdate: (ms) => {
      const audio = audioRef.current;
      if (audio && stopAtRangeEnd(audio)) return;
      setCurrentTime(ms / 1000);
    },
    onStateChange: (state) => {
      if (state === 'paused' && audioRef.current)
        setCurrentTime(audioRef.current.currentTime);
    },
    onEnded: () => setRange(null),
  });
  const {
    setMediaElement: attachTransport,
    isPlaying: playing,
    durationMs,
    playbackRate: rate,
    setPlaybackRate: setRate,
    seekToMs,
    pause,
  } = transport;

  // Volume carries over to the next recording; position, interval and errors start fresh.
  const volumeRef = React.useRef(volume);
  volumeRef.current = volume;
  const setMediaElement = React.useCallback(
    (element: HTMLMediaElement | null) => {
      audioRef.current = element;
      if (element) element.volume = volumeRef.current;
      attachTransport(element);
    },
    [attachTransport]
  );

  React.useEffect(() => {
    setCurrentTime(0);
    setError(null);
    setRange(null);
  }, [src, setRange]);

  // Smooth playhead while playing, and the stop point for interval playback.
  React.useEffect(() => {
    const audio = audioRef.current;
    if (!playing || !audio) return;
    let frame = 0;
    const tick = () => {
      setCurrentTime(audio.currentTime);
      if (!stopAtRangeEnd(audio)) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, stopAtRangeEnd]);

  // The transport's play() ignores refusals; this reports them so the user can retry.
  const start = React.useCallback((audio: HTMLMediaElement) => {
    setError((e) => (e === 'play' ? null : e));
    audio.play()?.catch((e: unknown) => {
      // A play() interrupted by pause() or a new src is expected; anything else is reported.
      if ((e as { name?: string } | null)?.name !== 'AbortError')
        setError('play');
    });
  }, []);

  const play = React.useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setRange(null);
    if (audio.ended) audio.currentTime = 0;
    start(audio);
  }, [start, setRange]);

  const seek = React.useCallback(
    (time: number) => {
      const audio = audioRef.current;
      if (!audio) return;
      const max = Number.isFinite(audio.duration) ? audio.duration : time;
      const t = Math.min(Math.max(0, time), max);
      const r = rangeRef.current;
      if (r && (t < r.start || t >= r.end)) setRange(null);
      seekToMs(t * 1000);
      setCurrentTime(t);
    },
    [setRange, seekToMs]
  );

  const playRange = React.useCallback<Playback['playRange']>(
    (next) => {
      const audio = audioRef.current;
      if (!audio) return;
      const playable = next.end > next.start;
      setRange(playable ? next : null);
      seekToMs(next.start * 1000);
      setCurrentTime(next.start);
      // An empty interval has nothing to play; moving there still answers the click.
      if (playable) start(audio);
    },
    [start, setRange, seekToMs]
  );

  const setVolume = React.useCallback((next: number) => {
    setVolumeState(next);
    if (audioRef.current) audioRef.current.volume = next;
  }, []);

  return {
    setMediaElement,
    playing,
    currentTime,
    duration: durationMs / 1000,
    rate,
    volume,
    error,
    range,
    play,
    pause,
    toggle: playing ? pause : play,
    seek,
    playRange,
    setRate,
    setVolume,
  };
}
