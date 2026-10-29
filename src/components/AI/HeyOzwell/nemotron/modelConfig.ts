// Ported from khawjaahmad/nemotron-diarization-web@0dc1980 (MIT, see ./LICENSE).
import type { StreamingConfig } from './speakerCache';

/** Pinned checkpoint. Stored voiceprints are stamped with it and rejected after a change. */
export const MODEL_REVISION = '353b6f8ad2cac3580e982d7fbdf0a010786b0406';
export const MODEL_BASE_URL = `https://huggingface.co/onnx-community/Nemotron-3-Diarization-ONNX/resolve/${MODEL_REVISION}`;

export type ExecutionProvider = 'webgpu' | 'wasm';

/**
 * `model` is fp32 (~398 MB), `model_quantized` int8 (~121 MB). WebGPU only has kernels for the fp32
 * graph: the quantised graphs fail to build there.
 */
export type ModelVariant = 'model' | 'model_quantized';

export const STREAMING_MODES = [
  'ultra_low_latency',
  'very_low_latency',
  'low_latency',
  'offline',
] as const;
export type StreamingMode = (typeof STREAMING_MODES)[number];

/** `config.json` of the checkpoint, narrowed to the fields the browser runtime needs. */
export interface ModelConfig {
  chunk_length: number;
  chunk_right_context: number;
  fifo_length: number;
  speaker_cache_update_period: number;
  audio_config: {
    hidden_size: number;
    num_mel_bins: number;
    subsampling_factor: number;
  };
  head_config: { num_speakers: number; subsampling_factor: number };
  streaming_config: StreamingConfig;
}

/** `processor_config.json` of the checkpoint. */
export interface ProcessorConfig {
  feature_extractor: {
    feature_size: number;
    hop_length: number;
    n_fft: number;
    win_length: number;
    preemphasis: number;
    sampling_rate: number;
  };
  streaming_modes: Record<string, [number, number]>;
  subsampling_factor: number;
}

export interface CheckpointConfig {
  model: ModelConfig;
  processor: ProcessorConfig;
}

export async function loadCheckpointConfig(
  baseUrl: string
): Promise<CheckpointConfig> {
  const [model, processor] = await Promise.all([
    fetchJson<ModelConfig>(`${baseUrl}/config.json`),
    fetchJson<ProcessorConfig>(`${baseUrl}/processor_config.json`),
  ]);
  return { model, processor };
}

/**
 * `(chunk_length, chunk_right_context)` in encoder frames for a streaming mode. The offline mode
 * uses the much longer buffer declared at the top level of `config.json`.
 */
export function chunkSizesFor(
  config: CheckpointConfig,
  mode: StreamingMode
): [number, number] {
  if (mode === 'offline')
    return [config.model.chunk_length, config.model.chunk_right_context];

  const sizes = config.processor.streaming_modes[mode];
  if (!sizes) throw new Error(`Unknown streaming mode "${mode}"`);
  return sizes;
}

/**
 * Cache sizes for a mode. Offline replays a whole recording in one pass and so uses the wider FIFO
 * queue and update period from the top level of `config.json`.
 */
export function streamingConfigFor(
  config: CheckpointConfig,
  mode: StreamingMode
): StreamingConfig {
  if (mode !== 'offline') return config.model.streaming_config;
  return {
    ...config.model.streaming_config,
    fifo_length: config.model.fifo_length,
    speaker_cache_update_period: config.model.speaker_cache_update_period,
  };
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok)
    throw new Error(
      `Failed to fetch ${url}: ${response.status} ${response.statusText}`
    );
  return response.json() as Promise<T>;
}
