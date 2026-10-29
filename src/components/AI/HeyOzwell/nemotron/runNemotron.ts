import type {
  NemotronModel,
  NemotronRequest,
  NemotronStreamOptions,
  NemotronWorkerMessage,
} from './nemotron.worker';

export type { NemotronModel, NemotronStreamOptions };
export type NemotronResult = Omit<
  Extract<NemotronWorkerMessage, { type: 'result' }>,
  'type' | 'id'
>;

/** A minute of 16 kHz audio: files are fed to the worker in pieces this size so its memory stays flat. */
const PIECE_SAMPLES = 60 * 16000;

let worker: Worker | null = null;
let nextId = 0;
const listeners = new Map<number, (message: NemotronWorkerMessage) => void>();

function getWorker(): Worker {
  if (worker) return worker;
  const created = new Worker(new URL('./nemotron.worker.ts', import.meta.url), {
    type: 'module',
  });
  created.onmessage = ({ data }: MessageEvent<NemotronWorkerMessage>) =>
    listeners.get(data.id)?.(data);
  // The worker script itself failed (e.g. blocked CDN): fail open streams and start fresh next time.
  created.onerror = (event) => {
    created.terminate();
    if (worker === created) worker = null;
    const message = event.message || 'The Nemotron worker failed to load';
    for (const [id, listener] of listeners)
      listener({ type: 'error', id, message });
  };
  worker = created;
  return created;
}

export interface NemotronStream {
  /** Feeds 16 kHz mono audio; resolves once the worker has processed it. */
  push: (samples: Float32Array) => Promise<void>;
  /** Ends the audio and resolves with every frame and the dominant voiceprint. */
  finish: () => Promise<NemotronResult>;
}

/** Opens a diarization stream in the worker; the session is reused between streams. */
export function openNemotronStream(
  options: NemotronStreamOptions,
  onStage?: (stage: string) => void
): NemotronStream {
  const target = getWorker();
  const id = ++nextId;
  const waiting: {
    resolve: (message: NemotronWorkerMessage) => void;
    reject: (error: Error) => void;
  }[] = [];
  let failure: Error | null = null;

  listeners.set(id, (message) => {
    if (message.type === 'stage') {
      onStage?.(message.stage);
      return;
    }
    if (message.type === 'error') {
      failure = new Error(message.message);
      listeners.delete(id);
      for (const pending of waiting.splice(0)) pending.reject(failure);
      return;
    }
    if (message.type === 'result') listeners.delete(id);
    waiting.shift()?.resolve(message);
  });

  const send = (request: NemotronRequest, transfer: ArrayBuffer[] = []) =>
    new Promise<NemotronWorkerMessage>((resolve, reject) => {
      if (failure) {
        reject(failure);
        return;
      }
      waiting.push({ resolve, reject });
      target.postMessage(request, transfer);
    });

  target.postMessage({
    ...options,
    kind: 'start',
    id,
  } satisfies NemotronRequest);
  return {
    push: async (samples) => {
      // Transferring detaches the whole buffer, so views into a larger one are copied first.
      const own =
        samples.byteLength === samples.buffer.byteLength
          ? samples
          : samples.slice();
      await send({ kind: 'push', id, samples: own }, [
        own.buffer as ArrayBuffer,
      ]);
    },
    finish: async () => {
      const message = await send({ kind: 'finish', id });
      if (message.type !== 'result')
        throw new Error('Unexpected Nemotron reply');
      return message;
    },
  };
}

/**
 * Diarizes a whole 16 kHz mono clip with Nemotron in a worker, a minute at a time.
 * `options.voiceprints` pre-fill lanes 0..n-1 with enrolled voices.
 */
export async function runNemotron(
  samples: Float32Array,
  options: NemotronStreamOptions,
  onStage?: (stage: string) => void
): Promise<NemotronResult> {
  const stream = openNemotronStream(options, onStage);
  for (let start = 0; start < samples.length; start += PIECE_SAMPLES)
    await stream.push(samples.slice(start, start + PIECE_SAMPLES));
  return stream.finish();
}

/** Runs a one-speaker sample through Nemotron and returns its voiceprint, or null if no clear voice. */
export async function enrollNemotron(
  samples: Float32Array,
  options: Omit<NemotronStreamOptions, 'voiceprints'>,
  onStage?: (stage: string) => void
): Promise<Float32Array | null> {
  return (await runNemotron(samples, options, onStage)).embeds;
}
