import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useNemotronDiarization } from './useNemotronDiarization';

const stop = vi.fn();
const cancel = vi.fn();
const load = vi.fn();

vi.mock('./nemotron/runNemotron', () => ({
  defaultNemotronModel: vi.fn(() => new Promise(() => {})),
  enrollNemotron: vi.fn(),
  runNemotron: vi.fn(),
  listenNemotron: vi.fn(() => ({
    stop,
    cancel,
    pause: vi.fn(),
    resume: vi.fn(),
  })),
}));

vi.mock('./nemotron/voiceprints', () => ({
  isUsableWith: () => true,
  loadNemotronVoiceprints: (...args: unknown[]) => load(...args),
  saveNemotronVoiceprints: vi.fn(),
}));

const model = {
  variant: 'model_quantized',
  executionProvider: 'wasm',
} as const;
const frames = {
  probabilities: new Float32Array([0.9, 0]),
  numSpeakers: 2,
  numFrames: 1,
  frameDurationSeconds: 0.1,
};

afterEach(() => {
  vi.clearAllMocks();
});

describe('useNemotronDiarization finish', () => {
  it('stops listening at once, before the stored voices finish loading', async () => {
    let resolveLoad: (prints: never[]) => void = () => {};
    load.mockReturnValue(new Promise((r) => (resolveLoad = r)));
    stop.mockResolvedValue(frames);
    const { result } = renderHook(() => useNemotronDiarization({ model }));

    const live = result.current.listen({} as MediaStream);
    let finished!: ReturnType<typeof result.current.finish>;
    act(() => {
      finished = result.current.finish(live);
    });
    expect(stop).toHaveBeenCalledTimes(1);

    await act(async () => resolveLoad([]));
    await expect(finished).resolves.toMatchObject({
      durationMs: 100,
      speakerActivity: [{ speakerId: 'lane-0', startMs: 0, endMs: 100 }],
    });
  });

  it('still stops the listener when the stored voices fail to load', async () => {
    load.mockReturnValue(Promise.reject(new Error('IndexedDB blocked')));
    stop.mockResolvedValue(frames);
    const { result } = renderHook(() => useNemotronDiarization({ model }));

    const live = result.current.listen({} as MediaStream);
    let finished!: ReturnType<typeof result.current.finish>;
    act(() => {
      finished = result.current.finish(live);
    });
    expect(stop).toHaveBeenCalledTimes(1);
    await act(async () => {
      await expect(finished).rejects.toThrow('IndexedDB blocked');
    });
  });

  it('cancels instead of stopping when the namespace changed since listen', async () => {
    load.mockResolvedValue([]);
    const { result, rerender } = renderHook(
      ({ ns }) => useNemotronDiarization({ model, voiceprintNamespace: ns }),
      { initialProps: { ns: 'a' } }
    );
    const live = result.current.listen({} as MediaStream);
    rerender({ ns: 'b' });

    let finished!: ReturnType<typeof result.current.finish>;
    act(() => {
      finished = result.current.finish(live);
    });
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(stop).not.toHaveBeenCalled();
    await act(async () => {
      await expect(finished).rejects.toThrow('namespace changed');
    });
  });
});
