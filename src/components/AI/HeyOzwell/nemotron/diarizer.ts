// Ported from khawjaahmad/nemotron-diarization-web@0dc1980 (MIT, see ./LICENSE).
// Change: the ONNX Runtime module is passed in, so the bench can load a newer runtime from the CDN
// without touching the package's pinned `onnxruntime-web`.
import type * as OrtModule from 'onnxruntime-web';
import {
  DEFAULT_FEATURE_CONFIG,
  FeatureExtractor,
  type FeatureExtractorConfig,
} from './featureExtractor';
import {
  type CheckpointConfig,
  type ExecutionProvider,
  type ModelVariant,
  type StreamingMode,
  chunkSizesFor,
  loadCheckpointConfig,
  streamingConfigFor,
} from './modelConfig';
import { SpeakerCache } from './speakerCache';
import {
  type Matrix,
  concatRows,
  copyRowsInto,
  createMatrix,
  sliceRows,
  wrapMatrix,
} from './tensor';

export type Ort = typeof OrtModule;

/** Everything needed to build a session: the checkpoint config and the two model payloads. */
export interface DiarizerSource {
  config: CheckpointConfig;
  /** URL of the graph. */
  model: string;
  /** File name the graph refers to its weights by, e.g. `model_quantized.onnx_data`. */
  externalDataName: string;
  /** URL of the weights. */
  externalData: string;
}

export interface DiarizerSettings {
  executionProvider: ExecutionProvider;
  streamingMode: StreamingMode;
}

/** Resolves the URLs of a variant served under `baseUrl`, mirroring the checkpoint layout. */
export async function loadDiarizerSource(
  baseUrl: string,
  variant: ModelVariant
): Promise<DiarizerSource> {
  return {
    config: await loadCheckpointConfig(baseUrl),
    model: `${baseUrl}/onnx/${variant}.onnx`,
    externalDataName: `${variant}.onnx_data`,
    externalData: `${baseUrl}/onnx/${variant}.onnx_data`,
  };
}

/** A chunk of results: speaker probabilities for the frames the last step emitted. */
export interface DiarizationFrames {
  /** Row-major `numFrames x numSpeakers` probabilities in `[0, 1]`. */
  probabilities: Float32Array;
  numFrames: number;
  numSpeakers: number;
}

/**
 * Re-views an ONNX Runtime output as a plain `Float32Array`. Every output of this graph is float32,
 * but the runtime types them as a union over all tensor element types.
 */
function floatOutput(tensor: OrtModule.Tensor): Float32Array {
  const data = tensor.data as Float32Array;
  return new Float32Array(
    data.buffer as ArrayBuffer,
    data.byteOffset,
    data.length
  );
}

/**
 * Runs Nemotron-3-Diarization over a 16 kHz mono stream, one chunk at a time.
 *
 * Audio is buffered until a full chunk (plus its look-ahead) is available, turned into log-mel
 * features and pushed through the ONNX graph together with the Arrival-Order Speaker Cache, which
 * is what keeps speaker identities stable across chunks.
 */
export class StreamingDiarizer {
  private readonly featureExtractor: FeatureExtractor;
  private cache: SpeakerCache;
  private silenceEmbeds: Float32Array = new Float32Array(0);

  private buffer = new Float32Array(0);
  private bufferStart = 0;
  private chunkStart = 0;
  private melFrameIndex = 0;
  private isFirstChunk = true;

  private constructor(
    private readonly ort: Ort,
    private readonly session: OrtModule.InferenceSession,
    readonly config: CheckpointConfig,
    readonly streamingMode: StreamingMode,
    private readonly featureConfig: FeatureExtractorConfig
  ) {
    this.featureExtractor = new FeatureExtractor(featureConfig);
    this.cache = new SpeakerCache(
      streamingConfigFor(config, streamingMode),
      config.model.audio_config.hidden_size
    );
  }

  static async create(
    ort: Ort,
    source: DiarizerSource,
    { executionProvider, streamingMode }: DiarizerSettings
  ): Promise<StreamingDiarizer> {
    const { config } = source;
    const session = await ort.InferenceSession.create(source.model, {
      executionProviders: [executionProvider],
      externalData: [
        { path: source.externalDataName, data: source.externalData },
      ],
      graphOptimizationLevel: 'all',
    });

    const extractor = config.processor.feature_extractor;
    return new StreamingDiarizer(ort, session, config, streamingMode, {
      ...DEFAULT_FEATURE_CONFIG,
      featureSize: extractor.feature_size,
      samplingRate: extractor.sampling_rate,
      hopLength: extractor.hop_length,
      nFft: extractor.n_fft,
      winLength: extractor.win_length,
      preemphasis: extractor.preemphasis,
    });
  }

  get numSpeakers(): number {
    return this.config.model.head_config.num_speakers;
  }

  get frameDurationSeconds(): number {
    return this.featureConfig.hopLength / this.featureConfig.samplingRate;
  }

  private get subsamplingFactor(): number {
    return this.config.model.audio_config.subsampling_factor;
  }

  private get chunkRightContext(): number {
    return chunkSizesFor(this.config, this.streamingMode)[1];
  }

  /** Mel frames a chunk carries: the frames it is scored on plus its look-ahead frames. */
  private get melFramesPerChunk(): number {
    const [chunkLength, rightContext] = chunkSizesFor(
      this.config,
      this.streamingMode
    );
    return (chunkLength + rightContext) * this.subsamplingFactor;
  }

  /** How far the frame cursor advances between two chunks. */
  private get melFramesPerStep(): number {
    return (
      chunkSizesFor(this.config, this.streamingMode)[0] * this.subsamplingFactor
    );
  }

  /** Samples the first chunk needs; its windows are centred, so it needs half a window less. */
  private get samplesInFirstChunk(): number {
    const { hopLength, winLength } = this.featureConfig;
    return (this.melFramesPerChunk - 1) * hopLength + (winLength >> 1);
  }

  private get samplesInChunk(): number {
    const { hopLength, winLength } = this.featureConfig;
    return this.melFramesPerChunk * hopLength + winLength;
  }

  get hiddenSize(): number {
    return this.config.model.audio_config.hidden_size;
  }

  /**
   * Drops the streaming state so the next `push` starts a fresh recording. `voiceprints` pre-fill the
   * speaker cache, lane by lane (see `SpeakerCache.seed`).
   */
  reset(voiceprints: readonly Matrix[] = []): void {
    this.cache = new SpeakerCache(
      streamingConfigFor(this.config, this.streamingMode),
      this.hiddenSize
    );
    this.cache.seed(voiceprints);
    this.buffer = new Float32Array(0);
    this.bufferStart = 0;
    this.chunkStart = 0;
    this.melFrameIndex = 0;
    this.isFirstChunk = true;
  }

  /**
   * Appends 16 kHz mono `samples` and runs every chunk that is now complete. Returns the frames
   * emitted by this call, which is empty until enough audio has accumulated.
   */
  async push(samples: Float32Array): Promise<DiarizationFrames> {
    this.append(samples);

    const steps: Matrix[] = [];
    while (this.hasCompleteChunk()) {
      steps.push(
        await this.runChunk(
          this.takeChunk(),
          this.isFirstChunk,
          this.chunkRightContext
        )
      );
      this.advance();
    }
    return this.collect(steps);
  }

  /** Scores whatever audio is left, ending the recording. */
  async flush(): Promise<DiarizationFrames> {
    const tail = this.buffer.subarray(this.chunkStart - this.bufferStart);
    if (this.featureExtractor.numFrames(tail.length, this.isFirstChunk) === 0)
      return this.collect([]);

    const step = await this.runChunk(tail, this.isFirstChunk, 0);
    this.isFirstChunk = false;
    this.chunkStart = this.bufferStart + this.buffer.length;
    this.buffer = new Float32Array(0);
    this.bufferStart = this.chunkStart;
    return this.collect([step]);
  }

  /** The dominant speaker's cached frames after a recording (see `SpeakerCache.voiceprint`). */
  voiceprint(): Matrix | null {
    return this.cache.voiceprint();
  }

  async dispose(): Promise<void> {
    await this.session.release();
  }

  private append(samples: Float32Array): void {
    const merged = new Float32Array(this.buffer.length + samples.length);
    merged.set(this.buffer, 0);
    merged.set(samples, this.buffer.length);
    this.buffer = merged;
  }

  private hasCompleteChunk(): boolean {
    const available = this.bufferStart + this.buffer.length - this.chunkStart;
    return (
      available >=
      (this.isFirstChunk ? this.samplesInFirstChunk : this.samplesInChunk)
    );
  }

  private takeChunk(): Float32Array {
    const offset = this.chunkStart - this.bufferStart;
    const length = this.isFirstChunk
      ? this.samplesInFirstChunk
      : this.samplesInChunk;
    return this.buffer.subarray(offset, offset + length);
  }

  /**
   * Moves the cursor to the next chunk. An uncentred window opens half a transform before the
   * frame it belongs to, so a chunk starts `nFft / 2` samples before its first mel frame.
   */
  private advance(): void {
    this.isFirstChunk = false;
    this.melFrameIndex += this.melFramesPerStep;
    this.chunkStart =
      this.melFrameIndex * this.featureConfig.hopLength -
      (this.featureConfig.nFft >> 1);

    const drop = this.chunkStart - this.bufferStart;
    this.buffer = this.buffer.subarray(drop);
    this.bufferStart = this.chunkStart;
  }

  private async runChunk(
    samples: Float32Array,
    centered: boolean,
    numLookaheadFrames: number
  ): Promise<Matrix> {
    const { Tensor } = this.ort;
    const features = this.featureExtractor.extract(samples, centered);
    const cachedEmbeds = this.cache.getCachedEmbeds();
    const numEncoderFrames = Math.ceil(features.rows / this.subsamplingFactor);
    const numInputFrames = cachedEmbeds.rows + numEncoderFrames;

    const outputs = await this.session.run({
      input_features: new Tensor('float32', features.data, [
        1,
        features.rows,
        features.cols,
      ]),
      cached_embeds: new Tensor('float32', cachedEmbeds.data, [
        1,
        cachedEmbeds.rows,
        cachedEmbeds.cols,
      ]),
      attention_mask: new Tensor(
        'int64',
        new BigInt64Array(numInputFrames).fill(1n),
        [1, numInputFrames]
      ),
    });

    const logits = wrapMatrix(floatOutput(outputs.logits), this.numSpeakers);
    const chunkEmbeds = wrapMatrix(
      floatOutput(outputs.chunk_embeds),
      cachedEmbeds.cols
    );
    this.silenceEmbeds = floatOutput(outputs.silence_embeds);

    // The graph pads the sequence for the attention kernels; only the real frames are scored.
    const scoredLogits = sliceRows(
      logits,
      0,
      numInputFrames * this.subsamplingFactor
    );
    const numChunkFrames = numEncoderFrames - numLookaheadFrames;
    this.cache.update(
      concatRows(cachedEmbeds, chunkEmbeds),
      scoredLogits,
      this.silenceEmbeds,
      numChunkFrames
    );

    const start = cachedEmbeds.rows * this.subsamplingFactor;
    const emitted = sliceRows(
      scoredLogits,
      start,
      start + numChunkFrames * this.subsamplingFactor
    );
    return this.toProbabilities(emitted, Math.min(features.rows, emitted.rows));
  }

  /** Sigmoid of the emitted logits, trimmed to the mel frames the chunk actually covered. */
  private toProbabilities(logits: Matrix, numFrames: number): Matrix {
    const probabilities = createMatrix(numFrames, logits.cols);
    for (let i = 0; i < probabilities.data.length; i++) {
      probabilities.data[i] = 1 / (1 + Math.exp(-logits.data[i]));
    }
    return probabilities;
  }

  private collect(steps: Matrix[]): DiarizationFrames {
    if (steps.length === 0)
      return {
        probabilities: new Float32Array(0),
        numFrames: 0,
        numSpeakers: this.numSpeakers,
      };

    // One allocation for the whole result; folding with concatRows would copy it per chunk.
    const numSpeakers = steps[0].cols;
    const numFrames = steps.reduce((rows, step) => rows + step.rows, 0);
    const merged = createMatrix(numFrames, numSpeakers);
    let row = 0;
    for (const step of steps) {
      copyRowsInto(merged, step, row);
      row += step.rows;
    }
    return {
      probabilities: merged.data,
      numFrames,
      numSpeakers,
    };
  }
}
