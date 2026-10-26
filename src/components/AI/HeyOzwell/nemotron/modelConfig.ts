// Ported from khawjaahmad/nemotron-diarization-web@0dc1980 (MIT, see ./LICENSE).
import type { StreamingConfig } from './speakerCache';

/** Pinned checkpoint. Stored voiceprints are stamped with it and rejected after a change. */
export const MODEL_REVISION = '353b6f8ad2cac3580e982d7fbdf0a010786b0406';
export const MODEL_BASE_URL = `https://huggingface.co/onnx-community/Nemotron-3-Diarization-ONNX/resolve/${MODEL_REVISION}`;

export type ExecutionProvider = 'webgpu' | 'wasm';

export const MODEL_VARIANTS = [
  'model',
  'model_fp16',
  'model_quantized',
  'model_q4',
  'model_q4f16',
] as const;
export type ModelVariant = (typeof MODEL_VARIANTS)[number];

export const STREAMING_MODES = [
  'ultra_low_latency',
  'very_low_latency',
  'low_latency',
  'offline',
] as const;
export type StreamingMode = (typeof STREAMING_MODES)[number];

export interface VariantInfo {
  label: string;
  /** Approximate download size of the weights, in megabytes. */
  sizeMb: number;
  /**
   * Backends this variant gives correct output on. WebGPU only has kernels for the float32 graph:
   * the quantised graphs fail to build, and the float16 one builds but returns degraded output.
   */
  backends: readonly ExecutionProvider[];
}

export const VARIANT_INFO: Record<ModelVariant, VariantInfo> = {
  model: { label: 'fp32', sizeMb: 398, backends: ['webgpu', 'wasm'] },
  model_fp16: { label: 'fp16', sizeMb: 200, backends: ['wasm'] },
  model_quantized: { label: 'int8', sizeMb: 121, backends: ['wasm'] },
  model_q4: { label: 'q4', sizeMb: 83, backends: ['wasm'] },
  model_q4f16: { label: 'q4f16', sizeMb: 73, backends: ['wasm'] },
};

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
