import { describe, it, expect, vi, afterEach } from 'vitest';
import { HeyBuddy } from './hey-buddy.js';

// The real batcher opens the mic and the models load ONNX; stub both so only the batch scheduling runs.
vi.mock('./audio.js', () => ({
  AudioBatcher: class {
    batchIntervalSamples = 1920;
    targetSampleRate = 16000;
    callbacks: Array<(batch: Float32Array) => void> = [];
    onBatch(cb: (batch: Float32Array) => void) {
      this.callbacks.push(cb);
    }
  },
}));
vi.mock('./models.js', () => {
  class Model {
    test() {
      return Promise.resolve();
    }
  }
  return {
    SileroVAD: Model,
    MelSpectrogram: Model,
    SpeechEmbedding: Model,
    WakeWord: Model,
  };
});
vi.mock('./onnx.js', () => ({ ONNX: {} }));

interface TestBuddy {
  batcher: { callbacks: Array<(batch: Float32Array) => void> };
  process(audio: Float32Array): Promise<void>;
}

const create = () => new HeyBuddy({}) as TestBuddy;
const emit = (hb: TestBuddy, batch = new Float32Array(4)) =>
  hb.batcher.callbacks.forEach((cb) => cb(batch));
const flush = () => new Promise((r) => setTimeout(r, 0));

/** Stubs process() with a run that stays in flight until `release()` is called. */
function holdProcess(hb: TestBuddy) {
  let release = () => {};
  const process = vi.spyOn(hb, 'process').mockImplementation(
    () =>
      new Promise<void>((resolve) => {
        release = resolve;
      })
  );
  return { process, release: () => release() };
}

describe('HeyBuddy batch processing', () => {
  afterEach(() => vi.restoreAllMocks());

  it('drops batches while a run is in flight, then resumes', async () => {
    const hb = create();
    const { process, release } = holdProcess(hb);

    emit(hb);
    emit(hb);
    emit(hb);
    expect(process).toHaveBeenCalledTimes(1);

    release();
    await flush();
    emit(hb);
    expect(process).toHaveBeenCalledTimes(2);
  });

  it('processes a snapshot that later buffer writes cannot change', () => {
    const hb = create();
    const { process } = holdProcess(hb);
    const buffer = new Float32Array([1, 2, 3]);

    emit(hb, buffer);
    buffer.fill(9);

    const received = process.mock.calls[0][0];
    expect(received).not.toBe(buffer);
    expect(Array.from(received)).toEqual([1, 2, 3]);
  });

  it('releases the guard and logs when a run fails', async () => {
    const hb = create();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const process = vi
      .spyOn(hb, 'process')
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValue(undefined);

    emit(hb);
    await flush();
    emit(hb);

    expect(warn).toHaveBeenCalledWith(
      '[HeyBuddy] process failed',
      expect.any(Error)
    );
    expect(process).toHaveBeenCalledTimes(2);
  });

  it('guards each instance independently', () => {
    const busy = create();
    const idle = create();
    holdProcess(busy);
    const { process } = holdProcess(idle);

    emit(busy);
    emit(idle);

    expect(process).toHaveBeenCalledTimes(1);
  });
});
