/**
 * useVisitScribe — record a multi-person visit → on-device speaker-labeled transcript.
 *
 * The ambient-scribe counterpart to `useHeyOzwell`: no wake word, no dictation turns — just record the
 * room, stop, and get an attributed transcript (doctor / patient / nurse) via `useDiarization`. Owns the
 * MediaRecorder + elapsed timer; the diarization (Whisper timestamps → TitaNet clustering → voiceprint
 * anchoring) is the batch pass that runs on stop. All on-device; audio never leaves the page.
 *
 * Optionally shows a rough LIVE transcript while recording (`liveTranscript`): a second PCM accumulator on
 * the same stream is transcribed in ~7s chunks and appended as people talk. It's chunked (each pass does
 * only the NEW audio, so cost stays linear — unlike a re-transcribe-the-whole-clip caption). No speaker
 * labels live — attribution needs the full clip, so the clean labeled transcript replaces it on stop.
 */
import * as React from 'react';
import { useDiarization, type UseDiarizationOptions } from './useDiarization';
import { transcribeSamples } from '../whisperTranscribe';
import { openRollingRecorder, type RollingRecorder } from './audio';
import type { DiarizedSegment } from '../diarize';

export interface UseVisitScribeOptions extends UseDiarizationOptions {
  /** Show a rough live transcript while recording (chunked). The clean diarized version replaces it on
   *  stop. On-device; costs extra compute during the visit. Default false. */
  liveTranscript?: boolean;
}

export interface UseVisitScribeResult {
  /** Speaker runtime + Whisper are loaded enough to record and diarize. */
  ready: boolean;
  /** Currently capturing the room. */
  recording: boolean;
  /** A diarization pass is in flight (after stop). */
  busy: boolean;
  error: string | null;
  /** The attributed transcript from the last visit (null until the first diarize completes). */
  result: DiarizedSegment[] | null;
  /** Rough live transcript accumulated while recording (empty unless `liveTranscript` is on). */
  liveText: string;
  /** Milliseconds recorded in the current/last take (drives the timer readout). */
  elapsedMs: number;
  /** There's a recorded clip in hand that can be re-analyzed with current settings. */
  canReanalyze: boolean;
  /** Start capturing the room (asks for mic permission on first use). */
  start: () => Promise<void>;
  /** Stop capturing → kick off diarization → populate `result`. */
  stop: () => void;
  /** Re-run diarization on the LAST recording with the current options (e.g. after changing threshold /
   *  maxSpeakers) — tune without re-recording. No-op if there's no stored clip. */
  reanalyze: () => void;
  /** Reset the local take state (timer, live text, error, stored clip). NOTE: the last diarized `result`
   *  stays until the next recording overwrites it — starting a new visit is the clean way to clear it. */
  reset: () => void;
}

const LIVE_CHUNK_SECONDS = 7; // transcribe a new window once this much fresh audio has accumulated

export function useVisitScribe(
  options: UseVisitScribeOptions = {}
): UseVisitScribeResult {
  const { liveTranscript = false, ...diarOptions } = options;
  const diar = useDiarization(diarOptions);
  const diarRef = React.useRef(diar);
  diarRef.current = diar;

  // Latest live-toggle value, so it can be flipped mid-recording (the loop reads the ref).
  const liveOnRef = React.useRef(liveTranscript);
  liveOnRef.current = liveTranscript;

  const [recording, setRecording] = React.useState(false);
  const [elapsedMs, setElapsedMs] = React.useState(0);
  const [liveText, setLiveText] = React.useState('');
  const [startError, setStartError] = React.useState<string | null>(null);

  const recRef = React.useRef<MediaRecorder | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const chunksRef = React.useRef<BlobPart[]>([]);
  const startedAtRef = React.useRef(0);
  const timerRef = React.useRef<number | null>(null);
  const lastBlobRef = React.useRef<Blob | null>(null); // the last recording, kept so it can be re-analyzed
  const [canReanalyze, setCanReanalyze] = React.useState(false);

  // Live-transcript loop: a PCM accumulator + a cursor into it (samples already transcribed) + a re-entrancy
  // guard so a slow Whisper pass doesn't stack up.
  const liveRecRef = React.useRef<RollingRecorder | null>(null);
  const liveTimerRef = React.useRef<number | null>(null);
  const liveCursorRef = React.useRef(0);
  const liveBusyRef = React.useRef(false);

  const clearTimer = React.useCallback(() => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  const stopLive = React.useCallback(() => {
    if (liveTimerRef.current) window.clearInterval(liveTimerRef.current);
    liveTimerRef.current = null;
    liveRecRef.current?.close();
    liveRecRef.current = null;
    liveCursorRef.current = 0;
    liveBusyRef.current = false;
  }, []);

  const start = React.useCallback(async () => {
    setStartError(null);
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      setStartError(e instanceof Error ? e.message : 'Microphone unavailable');
      return;
    }
    let rec: MediaRecorder;
    try {
      rec = new MediaRecorder(stream);
    } catch (e) {
      stream.getTracks().forEach((t) => t.stop());
      setStartError(e instanceof Error ? e.message : 'Recording unsupported');
      return;
    }
    chunksRef.current = [];
    rec.ondataavailable = (e) => {
      if (e.data && e.data.size) chunksRef.current.push(e.data);
    };
    rec.onstop = () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      const blob = new Blob(chunksRef.current, {
        type: rec.mimeType || 'audio/webm',
      });
      // Empty take (immediate stop) — nothing to diarize.
      if (blob.size > 0) {
        lastBlobRef.current = blob; // keep it so settings can be re-applied without re-recording
        setCanReanalyze(true);
        void diarRef.current.diarize(blob).catch(() => {});
      }
    };
    rec.start();
    recRef.current = rec;
    streamRef.current = stream;
    startedAtRef.current = Date.now();
    setElapsedMs(0);
    clearTimer();
    timerRef.current = window.setInterval(
      () => setElapsedMs(Date.now() - startedAtRef.current),
      250
    );

    // Live transcript: accumulate raw PCM off the SAME stream (2nd consumer, not a 2nd getUserMedia) and
    // transcribe each new ~7s window as it fills, appending. The accumulator is opened LAZILY — only while
    // the live toggle is on (so it costs nothing when off, and turning it on mid-recording captures from
    // that point). Reads only the fresh tail each tick (snapshotFrom) so it's O(new audio), not O(total).
    setLiveText('');
    liveCursorRef.current = 0;
    liveBusyRef.current = false;
    liveTimerRef.current = window.setInterval(async () => {
      if (!liveOnRef.current) {
        // toggled off (or never on) — drop any accumulator so it doesn't sit growing unused
        if (liveRecRef.current) {
          liveRecRef.current.close();
          liveRecRef.current = null;
          liveCursorRef.current = 0;
        }
        return;
      }
      if (!liveRecRef.current) {
        liveRecRef.current = openRollingRecorder(stream, Infinity); // open on first tick after the toggle turns on
        liveCursorRef.current = 0;
      }
      if (liveBusyRef.current) return;
      const acc = liveRecRef.current;
      const fresh = acc.totalSamples() - liveCursorRef.current;
      if (fresh < acc.sampleRate * LIVE_CHUNK_SECONDS) return; // wait for a full window
      const window = acc.snapshotFrom(liveCursorRef.current);
      liveCursorRef.current += window.length;
      acc.discardBefore(liveCursorRef.current); // free the transcribed audio so memory stays bounded
      liveBusyRef.current = true;
      try {
        const text = (await transcribeSamples(window, acc.sampleRate)).trim();
        if (text && liveRecRef.current)
          setLiveText((prev) => (prev ? `${prev} ${text}` : text));
      } catch {
        /* transient — the final diarized pass still covers this audio */
      } finally {
        liveBusyRef.current = false;
      }
    }, 2000);

    setRecording(true);
  }, [clearTimer]);

  const stop = React.useCallback(() => {
    clearTimer();
    stopLive();
    setRecording(false);
    try {
      recRef.current?.stop(); // fires onstop → diarize (+ stops the mic tracks)
    } catch {
      /* already stopped */
    }
    recRef.current = null;
    // Safety net: onstop normally stops the mic tracks, but if rec.stop() threw or onstop never fires
    // (invalid state / browser quirk), stop them here too so the mic indicator can't get stuck on
    // (stopping twice is harmless).
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, [clearTimer, stopLive]);

  const reanalyze = React.useCallback(() => {
    const blob = lastBlobRef.current;
    if (blob) void diarRef.current.diarize(blob).catch(() => {});
  }, []);

  const reset = React.useCallback(() => {
    setElapsedMs(0);
    setLiveText('');
    setStartError(null);
    lastBlobRef.current = null;
    setCanReanalyze(false);
  }, []);

  // Tear down on unmount so the mic is released if the component leaves while recording.
  React.useEffect(() => {
    return () => {
      clearTimer();
      stopLive();
      try {
        recRef.current?.stop();
      } catch {
        /* ignore */
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [clearTimer, stopLive]);

  return {
    ready: diar.ready,
    recording,
    busy: diar.busy,
    error: startError ?? diar.error,
    result: diar.result,
    liveText,
    elapsedMs,
    canReanalyze,
    start,
    stop,
    reanalyze,
    reset,
  };
}
