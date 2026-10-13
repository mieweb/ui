import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDictation, type UseDictationOptions } from './useDictation';

vi.mock('../AI/whisperTranscribe', () => ({
  transcribeBlob: vi.fn(async () => 'on device text'),
}));

type Listener = () => void;

function fakeStream() {
  const endedListeners: Listener[] = [];
  const track = {
    readyState: 'live' as 'live' | 'ended',
    stop: vi.fn(),
    addEventListener: (type: string, fn: Listener) => {
      if (type === 'ended') endedListeners.push(fn);
    },
  };
  return {
    stream: {
      getTracks: () => [track],
      getAudioTracks: () => [track],
    } as unknown as MediaStream,
    track,
    end: () => endedListeners.forEach((fn) => fn()),
  };
}

let nextChunk: Blob = new Blob(['audio'], { type: 'audio/webm' });

class FakeRecorder {
  static instances: FakeRecorder[] = [];
  static throwOnConstruct = false;
  static deferStop = false;
  state: MediaRecorder['state'] = 'inactive';
  mimeType = 'audio/webm';
  ondataavailable: ((e: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  onerror: ((e: Event) => void) | null = null;
  flushStop: () => void = () => {};
  constructor() {
    if (FakeRecorder.throwOnConstruct) throw new Error('unsupported');
    FakeRecorder.instances.push(this);
  }
  start() {
    this.state = 'recording';
  }
  stop() {
    if (this.state === 'inactive') return;
    this.state = 'inactive';
    this.flushStop = () => {
      this.ondataavailable?.({ data: nextChunk });
      this.onstop?.();
    };
    // Browsers queue dataavailable/stop as tasks after state flips to inactive.
    if (!FakeRecorder.deferStop) this.flushStop();
  }
}

const getUserMedia = vi.fn();

function setup(options: Partial<UseDictationOptions> = {}) {
  const onText = vi.fn();
  const onError = vi.fn();
  const hook = renderHook(() => useDictation({ onText, onError, ...options }));
  return { ...hook, onText, onError };
}

beforeEach(() => {
  FakeRecorder.instances = [];
  FakeRecorder.throwOnConstruct = false;
  FakeRecorder.deferStop = false;
  nextChunk = new Blob(['audio'], { type: 'audio/webm' });
  getUserMedia.mockReset();
  vi.stubGlobal('MediaRecorder', FakeRecorder);
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('useDictation', () => {
  it('records, transcribes with the provided function, and returns trimmed text', async () => {
    const mic = fakeStream();
    getUserMedia.mockResolvedValue(mic.stream);
    const transcribe = vi.fn(async () => '  hello world  ');
    const { result, onText } = setup({ transcribe });

    await act(() => result.current.start());
    expect(result.current.status).toBe('recording');

    act(() => result.current.stop());
    await waitFor(() => expect(onText).toHaveBeenCalledWith('hello world'));
    expect(result.current.status).toBe('idle');
    expect(transcribe).toHaveBeenCalledWith(
      expect.any(Blob),
      expect.any(AbortSignal)
    );
    expect(mic.track.stop).toHaveBeenCalled();
  });

  it('defaults to on-device transcription', async () => {
    getUserMedia.mockResolvedValue(fakeStream().stream);
    const { result, onText } = setup();

    await act(() => result.current.start());
    act(() => result.current.stop());
    await waitFor(() => expect(onText).toHaveBeenCalledWith('on device text'));
  });

  it('keeps the take when Stop is pressed again before onstop fires', async () => {
    FakeRecorder.deferStop = true;
    getUserMedia.mockResolvedValue(fakeStream().stream);
    const transcribe = vi.fn(async () => 'kept');
    const { result, onText } = setup({ transcribe });

    await act(() => result.current.start());
    act(() => result.current.stop());
    act(() => result.current.stop());
    act(() => FakeRecorder.instances[0].flushStop());
    await waitFor(() => expect(onText).toHaveBeenCalledWith('kept'));
  });

  it('opens only one mic stream on a fast double start', async () => {
    getUserMedia.mockResolvedValue(fakeStream().stream);
    const { result } = setup();

    await act(async () => {
      await Promise.all([result.current.start(), result.current.start()]);
    });
    expect(getUserMedia).toHaveBeenCalledTimes(1);
    expect(FakeRecorder.instances).toHaveLength(1);
  });

  it('releases the stream when cancelled while the permission prompt is open', async () => {
    const mic = fakeStream();
    let grant: (s: MediaStream) => void = () => {};
    getUserMedia.mockReturnValue(new Promise((r) => (grant = r)));
    const { result } = setup();

    let pending: Promise<void> = Promise.resolve();
    act(() => {
      pending = result.current.start();
    });
    act(() => result.current.cancel());
    await act(async () => {
      grant(mic.stream);
      await pending;
    });

    expect(mic.track.stop).toHaveBeenCalled();
    expect(FakeRecorder.instances).toHaveLength(0);
    expect(result.current.status).toBe('idle');
  });

  it('releases the stream when unmounted while the permission prompt is open', async () => {
    const mic = fakeStream();
    let grant: (s: MediaStream) => void = () => {};
    getUserMedia.mockReturnValue(new Promise((r) => (grant = r)));
    const { result, unmount } = setup();

    let pending: Promise<void> = Promise.resolve();
    act(() => {
      pending = result.current.start();
    });
    unmount();
    grant(mic.stream);
    await pending;

    expect(mic.track.stop).toHaveBeenCalled();
    expect(FakeRecorder.instances).toHaveLength(0);
  });

  it('errors when the mic API is unavailable (insecure context)', async () => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: undefined,
    });
    const { result, onError } = setup();

    await act(() => result.current.start());
    expect(result.current.status).toBe('error');
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });

  it('reuses a shared live stream without opening the mic or stopping its tracks', async () => {
    const shared = fakeStream();
    const transcribe = vi.fn(async () => 'shared text');
    const { result, onText, unmount } = setup({
      transcribe,
      getStream: () => shared.stream,
    });

    await act(() => result.current.start());
    expect(getUserMedia).not.toHaveBeenCalled();
    expect(result.current.status).toBe('recording');

    act(() => result.current.stop());
    await waitFor(() => expect(onText).toHaveBeenCalledWith('shared text'));

    await act(() => result.current.start());
    act(() => result.current.cancel());
    unmount();
    expect(shared.track.stop).not.toHaveBeenCalled();
  });

  it('records from a shared stream even where getUserMedia is unavailable', async () => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: undefined,
    });
    const shared = fakeStream();
    const { result } = setup({ getStream: () => shared.stream });

    await act(() => result.current.start());
    expect(result.current.status).toBe('recording');
  });

  it('opens its own mic when the shared stream has no live audio', async () => {
    const ended = fakeStream();
    ended.track.readyState = 'ended';
    const own = fakeStream();
    getUserMedia.mockResolvedValue(own.stream);
    const { result } = setup({ getStream: () => ended.stream });

    await act(() => result.current.start());
    expect(getUserMedia).toHaveBeenCalledTimes(1);

    act(() => result.current.cancel());
    expect(own.track.stop).toHaveBeenCalled();
    expect(ended.track.stop).not.toHaveBeenCalled();
  });

  it('surfaces permission denial as an error', async () => {
    const denied = new globalThis.DOMException('denied', 'NotAllowedError');
    getUserMedia.mockRejectedValue(denied);
    const { result, onError } = setup();

    await act(() => result.current.start());
    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe(denied);
    expect(onError).toHaveBeenCalledWith(denied);
  });

  it('stops the mic when MediaRecorder cannot be created', async () => {
    const mic = fakeStream();
    getUserMedia.mockResolvedValue(mic.stream);
    FakeRecorder.throwOnConstruct = true;
    const { result, onError } = setup();

    await act(() => result.current.start());
    expect(mic.track.stop).toHaveBeenCalled();
    expect(result.current.status).toBe('error');
    expect(onError).toHaveBeenCalled();
  });

  it('returns to idle without onText for an empty recording', async () => {
    getUserMedia.mockResolvedValue(fakeStream().stream);
    nextChunk = new Blob([]);
    const transcribe = vi.fn(async () => 'never');
    const { result, onText } = setup({ transcribe });

    await act(() => result.current.start());
    await act(async () => result.current.stop());

    expect(result.current.status).toBe('idle');
    expect(transcribe).not.toHaveBeenCalled();
    expect(onText).not.toHaveBeenCalled();
  });

  it('reports provider failures after releasing the mic', async () => {
    const mic = fakeStream();
    getUserMedia.mockResolvedValue(mic.stream);
    const failure = new Error('server down');
    const { result, onText, onError } = setup({
      transcribe: vi.fn(async () => {
        throw failure;
      }),
    });

    await act(() => result.current.start());
    act(() => result.current.stop());
    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(onError).toHaveBeenCalledWith(failure);
    expect(onText).not.toHaveBeenCalled();
    expect(mic.track.stop).toHaveBeenCalled();
  });

  it('ignores blank transcripts', async () => {
    getUserMedia.mockResolvedValue(fakeStream().stream);
    const { result, onText } = setup({ transcribe: vi.fn(async () => '   ') });

    await act(() => result.current.start());
    act(() => result.current.stop());
    await waitFor(() => expect(result.current.status).toBe('idle'));
    expect(onText).not.toHaveBeenCalled();
  });

  it('aborts and drops the result when cancelled during transcription', async () => {
    getUserMedia.mockResolvedValue(fakeStream().stream);
    let resolveText: (t: string) => void = () => {};
    let seenSignal: AbortSignal | undefined;
    const transcribe = vi.fn(
      (_audio: Blob, signal: AbortSignal) =>
        new Promise<string>((r) => {
          seenSignal = signal;
          resolveText = r;
        })
    );
    const { result, onText } = setup({ transcribe });

    await act(() => result.current.start());
    act(() => result.current.stop());
    await waitFor(() => expect(result.current.status).toBe('transcribing'));

    act(() => result.current.cancel());
    expect(seenSignal?.aborted).toBe(true);
    await act(async () => resolveText('late text'));

    expect(onText).not.toHaveBeenCalled();
    expect(result.current.status).toBe('idle');
  });

  it('stops the mic on unmount while recording', async () => {
    const mic = fakeStream();
    getUserMedia.mockResolvedValue(mic.stream);
    const transcribe = vi.fn(async () => 'x');
    const { result, unmount, onText } = setup({ transcribe });

    await act(() => result.current.start());
    unmount();

    expect(mic.track.stop).toHaveBeenCalled();
    await Promise.resolve();
    expect(transcribe).not.toHaveBeenCalled();
    expect(onText).not.toHaveBeenCalled();
  });

  it('treats a mic track ending (device unplugged) as stop', async () => {
    const mic = fakeStream();
    getUserMedia.mockResolvedValue(mic.stream);
    const { result, onText } = setup({ transcribe: vi.fn(async () => 'kept') });

    await act(() => result.current.start());
    act(() => mic.end());
    await waitFor(() => expect(onText).toHaveBeenCalledWith('kept'));
  });

  it('clears a previous error on the next start', async () => {
    getUserMedia.mockRejectedValueOnce(new Error('denied'));
    getUserMedia.mockResolvedValueOnce(fakeStream().stream);
    const { result } = setup();

    await act(() => result.current.start());
    expect(result.current.status).toBe('error');

    await act(() => result.current.start());
    expect(result.current.error).toBeNull();
    expect(result.current.status).toBe('recording');
  });

  it('leaves the error state as soon as a retry starts, before the mic is granted', async () => {
    getUserMedia.mockRejectedValueOnce(new Error('denied'));
    getUserMedia.mockReturnValueOnce(new Promise(() => {}));
    const { result } = setup();

    await act(() => result.current.start());
    expect(result.current.status).toBe('error');

    act(() => {
      void result.current.start();
    });
    expect(result.current.status).toBe('idle');
    expect(result.current.error).toBeNull();
  });

  it('reports a throwing getStream as an error and can retry', async () => {
    const boom = new Error('listener torn down');
    const getStream = vi.fn<() => MediaStream>(() => {
      throw boom;
    });
    const { result, onError } = setup({ getStream });

    await act(() => result.current.start());
    expect(result.current.status).toBe('error');
    expect(onError).toHaveBeenCalledWith(boom);

    getStream.mockImplementation(() => fakeStream().stream);
    await act(() => result.current.start());
    expect(result.current.status).toBe('recording');
  });

  it('auto-stops at maxDurationSeconds', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    getUserMedia.mockResolvedValue(fakeStream().stream);
    const { result, onText } = setup({
      maxDurationSeconds: 1,
      transcribe: vi.fn(async () => 'capped'),
    });

    await act(() => result.current.start());
    await act(async () => {
      vi.advanceTimersByTime(1500);
    });
    await waitFor(() => expect(onText).toHaveBeenCalledWith('capped'));
  });
});
