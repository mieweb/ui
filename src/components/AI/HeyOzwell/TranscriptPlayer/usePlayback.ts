/**
 * One audio element for the whole player: global playback, interval playback that stops at the
 * interval's end, seek, speed and volume. Everything resets when `src` changes.
 */
import * as React from 'react';
import type { TimeRange } from './model';

export interface Playback {
  ready: boolean;
  playing: boolean;
  /** Seconds. */
  currentTime: number;
  /** Seconds; 0 until metadata loads. */
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
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const rangeRef = React.useRef<Playback['range']>(null);
  const [ready, setReady] = React.useState(false);
  const [playing, setPlaying] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [rate, setRateState] = React.useState(1);
  const [volume, setVolumeState] = React.useState(1);
  const [error, setError] = React.useState<Playback['error']>(null);
  const [range, setRangeState] = React.useState<Playback['range']>(null);

  const setRange = React.useCallback((next: Playback['range']) => {
    rangeRef.current = next;
    setRangeState(next);
  }, []);

  // Speed and volume carry over to the next recording; everything else starts fresh.
  const rateRef = React.useRef(rate);
  rateRef.current = rate;
  const volumeRef = React.useRef(volume);
  volumeRef.current = volume;

  React.useEffect(() => {
    setReady(false);
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setError(null);
    setRange(null);
    if (!src) return;

    const audio = document.createElement('audio');
    audio.preload = 'metadata';
    audio.playbackRate = rateRef.current;
    audio.volume = volumeRef.current;
    const events = new AbortController();
    const on = (type: string, handler: () => void) =>
      audio.addEventListener(type, handler, { signal: events.signal });

    on('loadedmetadata', () => {
      setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
      setReady(true);
    });
    on('play', () => setPlaying(true));
    on('pause', () => setPlaying(false));
    on('ended', () => setRange(null));
    on('seeked', () => setCurrentTime(audio.currentTime));
    on('error', () => setError('load'));
    audio.src = src;
    audioRef.current = audio;

    return () => {
      events.abort();
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      audioRef.current = null;
    };
  }, [src, setRange]);

  // Smooth playhead while playing, and the stop point for interval playback.
  React.useEffect(() => {
    const audio = audioRef.current;
    if (!playing || !audio) return;
    let frame = 0;
    const tick = () => {
      const r = rangeRef.current;
      if (r && audio.currentTime >= r.end) {
        audio.pause();
        audio.currentTime = r.end;
        setCurrentTime(r.end);
        setRange(null);
        return;
      }
      setCurrentTime(audio.currentTime);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, setRange]);

  const start = React.useCallback((audio: HTMLAudioElement) => {
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

  const pause = React.useCallback(() => audioRef.current?.pause(), []);

  const seek = React.useCallback(
    (time: number) => {
      const audio = audioRef.current;
      if (!audio) return;
      const max = Number.isFinite(audio.duration) ? audio.duration : time;
      const t = Math.min(Math.max(0, time), max);
      const r = rangeRef.current;
      if (r && (t < r.start || t >= r.end)) setRange(null);
      audio.currentTime = t;
      setCurrentTime(t);
    },
    [setRange]
  );

  const playRange = React.useCallback<Playback['playRange']>(
    (next) => {
      const audio = audioRef.current;
      if (!audio || next.end <= next.start) return;
      setRange(next);
      audio.currentTime = next.start;
      setCurrentTime(next.start);
      start(audio);
    },
    [start, setRange]
  );

  const setRate = React.useCallback((next: number) => {
    setRateState(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  }, []);

  const setVolume = React.useCallback((next: number) => {
    setVolumeState(next);
    if (audioRef.current) audioRef.current.volume = next;
  }, []);

  return {
    ready,
    playing,
    currentTime,
    duration,
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
