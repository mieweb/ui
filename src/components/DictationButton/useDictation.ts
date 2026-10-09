import * as React from 'react';

export type DictationStatus = 'idle' | 'recording' | 'transcribing' | 'error';

/** Turns recorded audio into text. Reject to report an error; honor `signal` to support cancel. */
export type DictationTranscribe = (
  audio: Blob,
  signal: AbortSignal
) => Promise<string>;

export interface UseDictationOptions {
  /** Called with the final, trimmed transcript. Not called for empty results or after cancel. */
  onText: (text: string) => void;
  /** Transcription provider. Defaults to on-device Whisper (audio never leaves the browser). */
  transcribe?: DictationTranscribe;
  /** Called with the underlying error (permission denied, provider failure, …). */
  onError?: (error: Error) => void;
  /** Auto-stop after this many seconds. `0` disables the limit. Default 300. */
  maxDurationSeconds?: number;
}

export interface UseDictationResult {
  status: DictationStatus;
  error: Error | null;
  /** Milliseconds recorded so far in the current session. */
  elapsedMs: number;
  start: () => Promise<void>;
  /** Stop recording and transcribe. */
  stop: () => void;
  /** Discard the recording or in-flight transcription. `onText` will not fire. */
  cancel: () => void;
}

const onDeviceTranscribe: DictationTranscribe = async (audio, signal) => {
  // Loaded lazily so hosts using a server provider never pull in Whisper.
  const { transcribeBlob } = await import('../AI/whisperTranscribe');
  // The shared worker cannot stop a running decode, so cancel only discards its result.
  if (signal.aborted) throw new Error('Dictation cancelled');
  return transcribeBlob(audio);
};

function toError(value: unknown): Error {
  if (value instanceof Error) return value;
  // DOMException (e.g. NotAllowedError) is not an Error subclass in every runtime; keep its `name`.
  if (
    value &&
    typeof value === 'object' &&
    'name' in value &&
    'message' in value
  )
    return value as Error;
  return new Error(String(value));
}

/**
 * Headless speech-to-text for a single speaker: record, then transcribe to editable text.
 * Owns the mic lifecycle; every async step is tied to a session id so stale results are dropped.
 */
export function useDictation({
  onText,
  transcribe,
  onError,
  maxDurationSeconds = 300,
}: UseDictationOptions): UseDictationResult {
  const [status, setStatus] = React.useState<DictationStatus>('idle');
  const [error, setError] = React.useState<Error | null>(null);
  const [elapsedMs, setElapsedMs] = React.useState(0);

  const callbacksRef = React.useRef({ onText, onError, transcribe });
  callbacksRef.current = { onText, onError, transcribe };
  const maxMsRef = React.useRef(maxDurationSeconds * 1000);
  maxMsRef.current = maxDurationSeconds * 1000;

  const sessionRef = React.useRef(0);
  const busyRef = React.useRef(false);
  const mountedRef = React.useRef(true);
  const streamRef = React.useRef<MediaStream | null>(null);
  const recorderRef = React.useRef<MediaRecorder | null>(null);
  const timerRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = React.useRef<AbortController | null>(null);

  const releaseMic = React.useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const fail = React.useCallback(
    (err: unknown) => {
      releaseMic();
      recorderRef.current = null;
      busyRef.current = false;
      const e = toError(err);
      if (mountedRef.current) {
        setError(e);
        setStatus('error');
      }
      callbacksRef.current.onError?.(e);
    },
    [releaseMic]
  );

  const finish = React.useCallback(
    async (session: number, chunks: Blob[], mimeType: string) => {
      // A stale session must not touch refs that may already belong to a new one.
      if (session !== sessionRef.current) return;
      releaseMic();
      recorderRef.current = null;

      const audio = new Blob(chunks, { type: mimeType });
      if (audio.size === 0) {
        busyRef.current = false;
        if (mountedRef.current) setStatus('idle');
        return;
      }

      const controller = new AbortController();
      abortRef.current = controller;
      if (mountedRef.current) setStatus('transcribing');
      try {
        const run = callbacksRef.current.transcribe ?? onDeviceTranscribe;
        const text = (await run(audio, controller.signal)).trim();
        if (session !== sessionRef.current || controller.signal.aborted) return;
        busyRef.current = false;
        abortRef.current = null;
        if (mountedRef.current) setStatus('idle');
        if (text) callbacksRef.current.onText(text);
      } catch (err) {
        if (session !== sessionRef.current || controller.signal.aborted) return;
        abortRef.current = null;
        fail(err);
      }
    },
    [releaseMic, fail]
  );

  const cancel = React.useCallback(() => {
    sessionRef.current += 1;
    abortRef.current?.abort();
    abortRef.current = null;
    const recorder = recorderRef.current;
    recorderRef.current = null;
    if (recorder && recorder.state !== 'inactive') recorder.stop();
    releaseMic();
    busyRef.current = false;
    if (mountedRef.current) {
      setStatus('idle');
      setError(null);
      setElapsedMs(0);
    }
  }, [releaseMic]);

  const stop = React.useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder) {
      // Already inactive means onstop is queued; cancelling here would drop the take.
      if (recorder.state !== 'inactive') recorder.stop();
    } else if (busyRef.current && !abortRef.current) {
      // Still waiting on the permission prompt: nothing recorded yet.
      cancel();
    }
  }, [cancel]);

  const start = React.useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    const session = ++sessionRef.current;
    setError(null);
    setElapsedMs(0);

    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === 'undefined'
    ) {
      fail(new Error('Microphone is not available in this context'));
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      if (session === sessionRef.current) fail(err);
      return;
    }
    if (session !== sessionRef.current) {
      // Cancelled or unmounted while the permission prompt was open.
      stream.getTracks().forEach((track) => track.stop());
      return;
    }
    streamRef.current = stream;

    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream);
    } catch (err) {
      fail(err);
      return;
    }

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    recorder.onstop = () => {
      void finish(session, chunks, recorder.mimeType || 'audio/webm');
    };
    recorder.onerror = (e) => {
      if (session !== sessionRef.current) return;
      sessionRef.current += 1;
      recorderRef.current = null;
      fail((e as Event & { error?: unknown }).error ?? e);
    };
    stream.getAudioTracks().forEach((track) => {
      track.addEventListener('ended', () => {
        if (recorderRef.current === recorder && recorder.state !== 'inactive')
          recorder.stop();
      });
    });

    recorderRef.current = recorder;
    try {
      recorder.start();
    } catch (err) {
      recorderRef.current = null;
      fail(err);
      return;
    }
    setStatus('recording');

    const startedAt = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startedAt;
      setElapsedMs(elapsed);
      if (maxMsRef.current > 0 && elapsed >= maxMsRef.current) {
        if (recorder.state !== 'inactive') recorder.stop();
      }
    }, 250);
  }, [fail, finish]);

  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cancel();
    };
  }, [cancel]);

  return { status, error, elapsedMs, start, stop, cancel };
}
