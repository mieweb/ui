import { configuredAssetUrl, onnxRuntimeBase } from '../../modelCache';
import { resampleTo16kMono } from '../../whisperTranscribe';
import { openRollingRecorder } from '../audio';
import { MODEL_BASE_URL } from './modelConfig';
import NemotronWorker from './nemotron.worker?worker&inline';
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

let defaultModel: Promise<NemotronModel> | null = null;

/**
 * The model for this device: fp32 on WebGPU for desktops with a GPU (WebGPU runs only the fp32 graph
 * correctly), else int8 on WASM. Voiceprints are tied to a variant, so keep using this one.
 */
export function defaultNemotronModel(): Promise<NemotronModel> {
  defaultModel ??= (async () => {
    const nav =
      typeof navigator === 'undefined'
        ? undefined
        : (navigator as typeof navigator & {
            gpu?: { requestAdapter: () => Promise<unknown> };
            userAgentData?: { mobile?: boolean };
          });
    const userAgent = nav?.userAgent ?? '';
    // iPadOS reports a Mac user agent; touch support tells them apart.
    const mobile =
      nav?.userAgentData?.mobile ??
      (/Android|iPhone|iPad|iPod|Mobi/i.test(userAgent) ||
        (/Macintosh/.test(userAgent) && (nav?.maxTouchPoints ?? 0) > 1));
    const adapter =
      !mobile && nav?.gpu
        ? await nav.gpu.requestAdapter().catch(() => null)
        : null;
    return adapter
      ? { variant: 'model', executionProvider: 'webgpu' }
      : { variant: 'model_quantized', executionProvider: 'wasm' };
  })();
  return defaultModel;
}

let worker: Worker | null = null;
let nextId = 0;
const listeners = new Map<number, (message: NemotronWorkerMessage) => void>();

function getWorker(): Worker {
  if (worker) return worker;
  const created = new NemotronWorker();
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
    // A copy of the pinned revision's files (same layout) at `__ozwellAssets.nemotron`, else Hugging Face.
    modelBaseUrl: configuredAssetUrl('nemotron') ?? MODEL_BASE_URL,
    // Resolved here: the inline worker has no page URL to resolve a relative path against.
    ortBase: onnxRuntimeBase(),
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

/**
 * Downloads (first time only) and loads the model in the background, so the first diarization starts
 * at once. Holds the model in memory afterwards (hundreds of MB), so call it when Nemotron is about to
 * be used, e.g. once a user who records visits signs in.
 */
export async function warmNemotron(
  model?: NemotronModel,
  onStage?: (stage: string) => void
): Promise<void> {
  await openNemotronStream(
    { ...(model ?? (await defaultNemotronModel())), streamingMode: 'offline' },
    onStage
  ).finish();
}

/** Runs a one-speaker sample through Nemotron and returns its voiceprint, or null if no clear voice. */
export async function enrollNemotron(
  samples: Float32Array,
  options: Omit<NemotronStreamOptions, 'voiceprints'>,
  onStage?: (stage: string) => void
): Promise<Float32Array | null> {
  return (await runNemotron(samples, options, onStage)).embeds;
}

/** How often recorded audio is handed to the worker while listening. */
const LIVE_PUSH_MS = 500;

export interface NemotronListener {
  /** Stops listening and resolves with every frame heard. */
  stop: () => Promise<NemotronResult>;
  /** Stops listening and discards the result. */
  cancel: () => void;
}

/**
 * Diarizes a microphone stream while it records, so the result is ready soon after it stops. Reads a
 * second copy of `stream` (no extra `getUserMedia`) and stops reading once its tracks end.
 */
export function listenNemotron(
  stream: MediaStream,
  options: NemotronStreamOptions,
  onStage?: (stage: string) => void
): NemotronListener {
  const nemotron = openNemotronStream(options, onStage);
  const recorder = openRollingRecorder(stream, Infinity);
  let cursor = 0;
  let pushed: Promise<void> = Promise.resolve();
  let open = true;

  const close = () => {
    if (!open) return;
    open = false;
    window.clearInterval(timer);
    recorder.close();
  };
  const drain = () => {
    if (!open) return;
    const fresh = recorder.snapshotFrom(cursor);
    cursor += fresh.length;
    recorder.discardBefore(cursor);
    if (fresh.length > 0) {
      const samples = resampleTo16kMono(fresh, recorder.sampleRate);
      pushed = pushed.then(() => nemotron.push(samples));
      // Surfaced by `stop`; this only keeps an early failure from being reported as unhandled.
      pushed.catch(() => {});
    }
    if (stream.getAudioTracks().every((track) => track.readyState === 'ended'))
      close();
  };
  const timer = window.setInterval(drain, LIVE_PUSH_MS);

  return {
    stop: async () => {
      drain();
      close();
      await pushed;
      return nemotron.finish();
    },
    cancel: () => {
      close();
      // Ends the worker's stream so it does not linger.
      nemotron.finish().catch(() => {});
    },
  };
}
