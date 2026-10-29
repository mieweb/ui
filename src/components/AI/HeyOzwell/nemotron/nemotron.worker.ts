/// <reference lib="webworker" />
import { ONNX_RUNTIME_CDN as ORT_BASE } from '../../modelCache';
import type { Ort } from './diarizer';
import { StreamingDiarizer, loadDiarizerSource } from './diarizer';
import {
  MODEL_REVISION,
  fetchOk,
  type ExecutionProvider,
  type ModelVariant,
  type StreamingMode,
} from './modelConfig';
import { wrapMatrix } from './tensor';

/** Model files never change within a revision, so they are kept across visits under this cache. */
const CACHE_PREFIX = 'ozwell-nemotron-';
const CACHE_NAME = `${CACHE_PREFIX}${MODEL_REVISION}`;

export interface NemotronModel {
  variant: ModelVariant;
  executionProvider: ExecutionProvider;
}

export interface NemotronStreamOptions extends NemotronModel {
  streamingMode: StreamingMode;
  /** Voiceprints to pre-fill lane by lane, each row-major `frames x hiddenSize`. */
  voiceprints?: Float32Array[];
}

/** A stream (`id`) is started, fed 16 kHz mono audio piece by piece, then finished. */
export type NemotronRequest =
  | ({
      kind: 'start';
      id: number;
      modelBaseUrl: string;
    } & NemotronStreamOptions)
  | { kind: 'push'; id: number; samples: Float32Array }
  | { kind: 'finish'; id: number };

export type NemotronWorkerMessage =
  | { type: 'stage'; id: number; stage: string }
  | { type: 'pushed'; id: number }
  | {
      type: 'result';
      id: number;
      probabilities: Float32Array;
      numFrames: number;
      numSpeakers: number;
      frameDurationSeconds: number;
      /** Session build time (includes the download on a cold cache); 0 when the session was reused. */
      loadMs: number;
      inferenceMs: number;
      /** The dominant speaker's voiceprint, row-major `frames x hiddenSize`; null without a clear voice. */
      embeds: Float32Array | null;
    }
  | { type: 'error'; id: number; message: string };

interface Stream {
  modelKey: string;
  diarizer: StreamingDiarizer;
  frames: Float32Array[];
  numFrames: number;
  loadMs: number;
  inferenceMs: number;
}

let ortPromise: Promise<Ort> | null = null;
let current: { key: string; diarizer: StreamingDiarizer } | null = null;
const streams = new Map<number, Stream>();

function loadOrt(): Promise<Ort> {
  ortPromise ??= import(
    /* @vite-ignore */ `${ORT_BASE}ort.webgpu.min.mjs`
  ).then(
    (ort: Ort) => {
      ort.env.wasm.wasmPaths = ORT_BASE;
      // Nested pthread workers deadlock inside a worker, so ORT must stay single-threaded here.
      ort.env.wasm.numThreads = 1;
      return ort;
    },
    (error: unknown) => {
      // Let the next request retry a failed download.
      ortPromise = null;
      throw error;
    }
  );
  return ortPromise;
}

function post(message: NemotronWorkerMessage, transfer: ArrayBuffer[] = []) {
  self.postMessage(message, { transfer });
}

type ModelCache = Awaited<ReturnType<typeof self.caches.open>>;
let cachePromise: Promise<ModelCache | null> | null = null;

/** The model cache, after dropping earlier revisions; null where the Cache API is unavailable. */
function openCache(): Promise<ModelCache | null> {
  cachePromise ??= (async () => {
    // Insecure origins have no Cache API.
    const storage = self.caches;
    if (!storage) return null;
    for (const name of await storage.keys())
      if (name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
        await storage.delete(name);
    return storage.open(CACHE_NAME);
  })().catch(() => null);
  return cachePromise;
}

/** Serves a model file from the cache, downloading and storing it the first time. */
async function cachedFetch(url: string): Promise<Response> {
  const cache = await openCache();
  const hit = await cache?.match(url);
  if (hit) return hit;
  const response = await fetchOk(url);
  if (!cache) return response;
  try {
    // Stored first and read back, so a large file is not held in memory twice.
    await cache.put(url, response);
    return (await cache.match(url)) ?? (await fetchOk(url));
  } catch {
    // E.g. storage is full: use the file without keeping it.
    return fetchOk(url);
  }
}

/** The session for `model`, built on first use. Streams on a replaced session are dropped. */
async function loadModel(
  id: number,
  {
    variant,
    executionProvider,
    modelBaseUrl,
  }: NemotronModel & { modelBaseUrl: string }
): Promise<{ key: string; diarizer: StreamingDiarizer; loadMs: number }> {
  const key = `${modelBaseUrl}|${variant}|${executionProvider}`;
  if (current?.key === key) return { ...current, loadMs: 0 };

  const previous = current;
  current = null;
  for (const [streamId, stream] of streams)
    if (stream.modelKey !== key) streams.delete(streamId);
  await previous?.diarizer.dispose();

  const started = performance.now();
  post({ type: 'stage', id, stage: 'Loading ONNX Runtime' });
  const ort = await loadOrt();
  post({ type: 'stage', id, stage: 'Downloading model' });
  const source = await loadDiarizerSource(modelBaseUrl, variant, cachedFetch);
  post({ type: 'stage', id, stage: 'Building session' });
  const diarizer = await StreamingDiarizer.create(ort, source, {
    executionProvider,
    streamingMode: 'offline',
  });
  current = { key, diarizer };
  return { key, diarizer, loadMs: performance.now() - started };
}

function openStream(id: number): Stream {
  const stream = streams.get(id);
  if (!stream)
    throw new Error(
      'The analysis was interrupted by another model; run it again'
    );
  return stream;
}

async function step(
  stream: Stream,
  run: () => Promise<{ probabilities: Float32Array; numFrames: number }>
): Promise<void> {
  const started = performance.now();
  const { probabilities, numFrames } = await run();
  stream.inferenceMs += performance.now() - started;
  if (numFrames === 0) return;
  stream.frames.push(probabilities);
  stream.numFrames += numFrames;
}

async function handle(request: NemotronRequest): Promise<void> {
  const { id } = request;
  if (request.kind === 'start') {
    const { key, diarizer: model, loadMs } = await loadModel(id, request);
    const diarizer = model.fork(request.streamingMode);
    diarizer.reset(
      (request.voiceprints ?? []).map((data) =>
        wrapMatrix(data, diarizer.hiddenSize)
      )
    );
    streams.set(id, {
      modelKey: key,
      diarizer,
      frames: [],
      numFrames: 0,
      loadMs,
      inferenceMs: 0,
    });
    post({ type: 'stage', id, stage: 'Analyzing audio' });
    return;
  }

  const stream = openStream(id);
  if (request.kind === 'push') {
    await step(stream, () => stream.diarizer.push(request.samples));
    post({ type: 'pushed', id });
    return;
  }

  await step(stream, () => stream.diarizer.flush());
  streams.delete(id);
  const { diarizer } = stream;
  const probabilities = new Float32Array(
    stream.numFrames * diarizer.numSpeakers
  );
  let offset = 0;
  for (const frames of stream.frames) {
    probabilities.set(frames, offset);
    offset += frames.length;
  }
  const embeds = diarizer.voiceprint()?.data ?? null;
  post(
    {
      type: 'result',
      id,
      probabilities,
      numFrames: stream.numFrames,
      numSpeakers: diarizer.numSpeakers,
      frameDurationSeconds: diarizer.frameDurationSeconds,
      loadMs: stream.loadMs,
      inferenceMs: stream.inferenceMs,
      embeds,
    },
    embeds
      ? [probabilities.buffer, embeds.buffer as ArrayBuffer]
      : [probabilities.buffer]
  );
}

// One request at a time, in order: the session is shared state.
let queue: Promise<void> = Promise.resolve();
self.onmessage = ({ data }: MessageEvent<NemotronRequest>) => {
  queue = queue
    .then(() => handle(data))
    .catch((error: unknown) => {
      // A failed step leaves the stream's state unusable.
      streams.delete(data.id);
      post({
        type: 'error',
        id: data.id,
        message: error instanceof Error ? error.message : String(error),
      });
    });
};
