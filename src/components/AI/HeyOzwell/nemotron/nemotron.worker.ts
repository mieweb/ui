/// <reference lib="webworker" />
import type { Ort } from './diarizer';
import { StreamingDiarizer, loadDiarizerSource } from './diarizer';
import {
  MODEL_BASE_URL,
  type ExecutionProvider,
  type ModelVariant,
  type StreamingMode,
} from './modelConfig';
import { wrapMatrix } from './tensor';

const ORT_VERSION = '1.30.0';
const ORT_BASE = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ORT_VERSION}/dist/`;

export interface NemotronRunRequest {
  id: number;
  /** `diarize` returns lane probabilities; `enroll` returns the dominant speaker's voiceprint. */
  kind: 'diarize' | 'enroll';
  variant: ModelVariant;
  executionProvider: ExecutionProvider;
  streamingMode: StreamingMode;
  /** 16 kHz mono. */
  samples: Float32Array;
  /** `diarize` only: voiceprints to pre-fill lane by lane, each row-major `frames x hiddenSize`. */
  voiceprints?: Float32Array[];
}

export type NemotronWorkerMessage =
  | { type: 'stage'; id: number; stage: string }
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
    }
  | {
      type: 'voiceprint';
      id: number;
      /** Row-major `frames x hiddenSize`; null when no clear voice reached the speaker cache. */
      embeds: Float32Array | null;
    }
  | { type: 'error'; id: number; message: string };

let ortPromise: Promise<Ort> | null = null;
let current: { key: string; diarizer: StreamingDiarizer } | null = null;

function loadOrt(): Promise<Ort> {
  ortPromise ??= import(
    /* @vite-ignore */ `${ORT_BASE}ort.webgpu.min.mjs`
  ).then((ort: Ort) => {
    ort.env.wasm.wasmPaths = ORT_BASE;
    // Nested pthread workers deadlock inside a worker, so ORT must stay single-threaded here.
    ort.env.wasm.numThreads = 1;
    return ort;
  });
  return ortPromise;
}

function post(message: NemotronWorkerMessage, transfer: ArrayBuffer[] = []) {
  self.postMessage(message, { transfer });
}

async function run(request: NemotronRunRequest): Promise<void> {
  const { id, kind, variant, executionProvider, streamingMode, samples } =
    request;
  const key = `${variant}|${executionProvider}|${streamingMode}`;

  let loadMs = 0;
  if (current?.key !== key) {
    const previous = current;
    current = null;
    await previous?.diarizer.dispose();

    const started = performance.now();
    post({ type: 'stage', id, stage: 'Loading ONNX Runtime' });
    const ort = await loadOrt();
    post({ type: 'stage', id, stage: 'Downloading model' });
    const source = await loadDiarizerSource(MODEL_BASE_URL, variant);
    post({ type: 'stage', id, stage: 'Building session' });
    const diarizer = await StreamingDiarizer.create(ort, source, {
      executionProvider,
      streamingMode,
    });
    current = { key, diarizer };
    loadMs = performance.now() - started;
  }

  const { diarizer } = current;
  diarizer.reset(
    (request.voiceprints ?? []).map((data) =>
      wrapMatrix(data, diarizer.hiddenSize)
    )
  );
  post({
    type: 'stage',
    id,
    stage: kind === 'enroll' ? 'Enrolling voice' : 'Diarizing',
  });
  const started = performance.now();
  const body = await diarizer.push(samples);
  const tail = await diarizer.flush();
  const inferenceMs = performance.now() - started;

  if (kind === 'enroll') {
    const embeds = diarizer.voiceprint()?.data ?? null;
    post(
      { type: 'voiceprint', id, embeds },
      embeds ? [embeds.buffer as ArrayBuffer] : []
    );
    return;
  }

  const probabilities = new Float32Array(
    body.probabilities.length + tail.probabilities.length
  );
  probabilities.set(body.probabilities, 0);
  probabilities.set(tail.probabilities, body.probabilities.length);

  post(
    {
      type: 'result',
      id,
      probabilities,
      numFrames: body.numFrames + tail.numFrames,
      numSpeakers: diarizer.numSpeakers,
      frameDurationSeconds: diarizer.frameDurationSeconds,
      loadMs,
      inferenceMs,
    },
    [probabilities.buffer]
  );
}

// One request at a time, in order: the session is shared state.
let queue: Promise<void> = Promise.resolve();
self.onmessage = ({ data }: MessageEvent<NemotronRunRequest>) => {
  queue = queue
    .then(() => run(data))
    .catch((error: unknown) =>
      post({
        type: 'error',
        id: data.id,
        message: error instanceof Error ? error.message : String(error),
      })
    );
};
