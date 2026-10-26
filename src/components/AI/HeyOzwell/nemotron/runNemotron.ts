import type {
  NemotronRunRequest,
  NemotronWorkerMessage,
} from './nemotron.worker';

type Reply = Exclude<NemotronWorkerMessage, { type: 'stage' | 'error' }>;
export type NemotronResult = Omit<
  Extract<Reply, { type: 'result' }>,
  'type' | 'id'
>;
export type NemotronOptions = Omit<
  NemotronRunRequest,
  'id' | 'kind' | 'samples'
>;

let worker: Worker | null = null;
let nextId = 0;

function request(
  message: Omit<NemotronRunRequest, 'id'>,
  onStage?: (stage: string) => void
): Promise<Reply> {
  worker ??= new Worker(new URL('./nemotron.worker.ts', import.meta.url), {
    type: 'module',
  });
  const active = worker;
  const id = ++nextId;

  return new Promise((resolve, reject) => {
    const stop = () => {
      active.removeEventListener('message', onMessage);
      active.removeEventListener('error', onError);
    };
    const onMessage = ({ data }: MessageEvent<NemotronWorkerMessage>) => {
      if (data.id !== id) return;
      if (data.type === 'stage') {
        onStage?.(data.stage);
        return;
      }
      stop();
      if (data.type === 'error') reject(new Error(data.message));
      else resolve(data);
    };
    // The worker script itself failed (e.g. blocked CDN): start a fresh one next time.
    const onError = (event: Event & { message?: string }) => {
      stop();
      active.terminate();
      if (worker === active) worker = null;
      reject(new Error(event.message || 'The Nemotron worker failed to load'));
    };
    active.addEventListener('message', onMessage);
    active.addEventListener('error', onError);
    active.postMessage({ ...message, id });
  });
}

/**
 * Diarizes a whole 16 kHz mono clip with Nemotron in a worker. The session is reused between calls.
 * `options.voiceprints` pre-fill lanes 0..n-1 with enrolled voices.
 */
export async function runNemotron(
  samples: Float32Array,
  options: NemotronOptions,
  onStage?: (stage: string) => void
): Promise<NemotronResult> {
  const reply = await request(
    { ...options, kind: 'diarize', samples },
    onStage
  );
  if (reply.type !== 'result') throw new Error('Unexpected Nemotron reply');
  return reply;
}

/** Runs a one-speaker sample through Nemotron and returns its voiceprint, or null if no clear voice. */
export async function enrollNemotron(
  samples: Float32Array,
  options: Omit<NemotronOptions, 'voiceprints'>,
  onStage?: (stage: string) => void
): Promise<Float32Array | null> {
  const reply = await request({ ...options, kind: 'enroll', samples }, onStage);
  if (reply.type !== 'voiceprint') throw new Error('Unexpected Nemotron reply');
  return reply.embeds;
}
