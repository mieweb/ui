/**
 * Hey Ozwell — model manifest (mieweb/ui#288).
 *
 * A lightweight, manifest-pinned list of the on-device models the assistant runs, so the Ozwell
 * settings menu can show "what am I using, what version, how big, loaded from where" (per Doug).
 *
 * Values are grounded in the actual runtime config:
 *   - wake + speaker-verify currently load from the personal HF repo `jlocala/ozwell-voice-assets`
 *     (the small models Doug wants moved to Git LFS — see MODEL-HOSTING.md).
 *   - transcription (Whisper turbo) loads from our Cloudflare R2 bucket (config-driven R2_HOST).
 * Sizes are approximate (remote weights, not bundled). Versions are pinned identifiers, not semver.
 */

/** Which live load-store (if any) reflects this model's readiness in the UI. */
export type ModelStatusKey = 'wake' | 'transcription' | 'static';

export interface ModelInfo {
  id: string;
  /** Coarse role grouping shown as the row's eyebrow. */
  role: 'Wake word' | 'Speaker verify' | 'Transcription';
  /** Human-facing name. */
  label: string;
  /** Architecture / precision detail. */
  variant: string;
  /** Pinned identifier (model id or repo ref) — not semver. */
  version: string;
  /** Approximate download size (remote weights). */
  approxSize: string;
  /** Where the weights load from today. */
  source: string;
  /** Inference engine. */
  runtime: string;
  /** Live-status hook: which load store reflects readiness, or 'static' (loads on first use). */
  statusKey: ModelStatusKey;
}

export const MODEL_MANIFEST: ModelInfo[] = [
  {
    id: 'wake-heyozwell',
    role: 'Wake word',
    label: '“hey ozwell” + “ozwell I’m done”',
    variant: 'HeyBuddy ONNX (+ Silero VAD, embedding, mel)',
    version: 'ozwell-voice-assets@main',
    approxSize: '~3 MB',
    source: 'HF: jlocala/ozwell-voice-assets → Git LFS (planned) · OPFS-cached',
    runtime: 'onnxruntime-web',
    statusKey: 'wake',
  },
  {
    id: 'speaker-titanet',
    role: 'Speaker verify',
    label: 'TitaNet speaker embedding',
    variant: 'nemo_en_titanet_small · sherpa-onnx (WASM)',
    version: 'titanet_small',
    approxSize: '~25 MB',
    source: 'HF: jlocala/ozwell-voice-assets/sv-runtime · Cache API',
    runtime: 'sherpa-onnx WASM',
    statusKey: 'static',
  },
  {
    id: 'whisper-turbo',
    role: 'Transcription',
    label: 'Whisper turbo (multilingual)',
    variant: 'encoder fp16 / decoder q4 · WebGPU (wasm fallback)',
    version: 'whisper-turbo',
    approxSize: '~1.3 GB',
    source: 'Cloudflare R2 (config-driven) · Cache API',
    runtime: 'Transformers.js',
    statusKey: 'transcription',
  },
];

/** Per-model readiness for the UI status dot. */
export type ModelStatus = 'idle' | 'loading' | 'ready';
