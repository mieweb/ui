// Ported from khawjaahmad/nemotron-diarization-web@0dc1980 (MIT, see ./LICENSE).
import {
  type Matrix,
  concatRows,
  copyRowsInto,
  createMatrix,
  gatherRows,
  sliceRows,
  topKIndices,
  wrapMatrix,
} from './tensor';

/** `streaming_config` of the checkpoint, driving the Arrival-Order Speaker Cache policy. */
export interface StreamingConfig {
  fifo_length: number;
  speaker_cache_length: number;
  speaker_cache_update_period: number;
  speaker_cache_silence_frames_per_speaker: number;
  prediction_score_threshold: number;
  latest_frames_score_boost: number;
  min_positive_scores_rate: number;
  strong_boost_rate: number;
  weak_boost_rate: number;
  num_speakers: number;
  subsampling_factor: number;
}

const STRONG_BOOST = -2 * Math.log(0.5);
const WEAK_BOOST = -Math.log(0.5);
const ACTIVE_PROBABILITY = 0.5;

/**
 * Port of `Nemotron3DiarizationSpeakerCache` for a single stream: the Arrival-Order Speaker Cache
 * of long-term speaker evidence plus the FIFO queue of the most recent encoder frames. Every
 * streaming step attends to both, so identities survive across chunks.
 */
export class SpeakerCache {
  private readonly embeds: Matrix;
  private readonly probs: Matrix;
  private readonly fifo: Matrix;
  private readonly minPositiveScores: number;
  private readonly numStrongBoostedFrames: number;
  private readonly numWeakBoostedFrames: number;
  /** Frames one speaker may hold: its share of the cache minus its reserved silence slots. */
  readonly framesPerSpeaker: number;

  private numCacheFrames = 0;
  private numFifoFrames = 0;
  private isCompressed = false;

  constructor(
    private readonly config: StreamingConfig,
    hiddenSize = 512
  ) {
    const budget =
      Math.floor(config.speaker_cache_length / config.num_speakers) -
      config.speaker_cache_silence_frames_per_speaker;
    this.framesPerSpeaker = budget;
    this.minPositiveScores = Math.floor(
      budget * config.min_positive_scores_rate
    );
    this.numStrongBoostedFrames = Math.floor(budget * config.strong_boost_rate);
    this.numWeakBoostedFrames = Math.floor(budget * config.weak_boost_rate);

    this.embeds = createMatrix(config.speaker_cache_length, hiddenSize);
    this.probs = createMatrix(config.speaker_cache_length, config.num_speakers);
    this.fifo = createMatrix(config.fifo_length, hiddenSize);
  }

  /**
   * Pre-fills an empty cache with stored voiceprints so voice `i` is the `i`-th arrival, i.e. lane `i`.
   * Their probabilities are fixed one-hot, so compression keeps them like confident speaker frames.
   */
  seed(voices: readonly Matrix[]): void {
    if (voices.length === 0) return;
    const { num_speakers: numSpeakers } = this.config;
    if (voices.length >= numSpeakers)
      throw new Error(
        `At most ${numSpeakers - 1} voices can be enrolled; one lane stays free for other speakers`
      );

    let offset = 0;
    voices.forEach((voice, lane) => {
      if (
        voice.cols !== this.embeds.cols ||
        !Number.isInteger(voice.rows) ||
        voice.rows < 1 ||
        voice.rows > this.framesPerSpeaker
      )
        throw new Error('A voiceprint does not match this model; re-enroll it');
      copyRowsInto(this.embeds, voice, offset);
      for (let row = offset; row < offset + voice.rows; row++)
        this.probs.data[row * numSpeakers + lane] = 1;
      offset += voice.rows;
    });
    this.numCacheFrames = offset;
    this.isCompressed = true;
  }

  /**
   * The cached frames of the dominant speaker, in arrival order: a voiceprint to `seed` later.
   * Null when nothing reached the cache (clip too short) or no speaker was clearly active.
   */
  voiceprint(): Matrix | null {
    const numFrames = this.numCacheFrames;
    const numSpeakers = this.config.num_speakers;
    if (numFrames === 0) return null;

    const totals = new Float32Array(numSpeakers);
    for (let frame = 0; frame < numFrames; frame++)
      for (let speaker = 0; speaker < numSpeakers; speaker++)
        totals[speaker] += this.probs.data[frame * numSpeakers + speaker];
    const lane = topKIndices(totals, 1)[0];

    const strength = new Float32Array(numFrames);
    for (let frame = 0; frame < numFrames; frame++) {
      const probability = this.probs.data[frame * numSpeakers + lane];
      strength[frame] =
        probability > ACTIVE_PROBABILITY ? probability : -Infinity;
    }
    const picked = Array.from(
      topKIndices(strength, this.framesPerSpeaker)
    ).filter((frame) => strength[frame] > ACTIVE_PROBABILITY);
    if (picked.length === 0) return null;

    picked.sort((a, b) => a - b);
    return gatherRows(this.embeds, Int32Array.from(picked));
  }

  /** Frames the next step must prepend to its own: the speaker cache followed by the FIFO queue. */
  getCachedEmbeds(): Matrix {
    return concatRows(
      sliceRows(this.embeds, 0, this.numCacheFrames),
      sliceRows(this.fifo, 0, this.numFifoFrames)
    );
  }

  /**
   * Pushes a processed chunk to the FIFO queue, moving its oldest frames into the speaker cache
   * once the queue overflows and compressing the cache when it exceeds its capacity.
   *
   * @param stepEmbeds Encoder input of the step: cached frames, the chunk, then its look-ahead.
   * @param stepLogits Speaker logits of the step at the spectrogram frame rate.
   * @param silenceEmbeds Learned embedding filling the reserved silence slots of a compressed cache.
   * @param numChunkFrames Chunk frames following the cached ones; look-ahead frames are excluded.
   */
  update(
    stepEmbeds: Matrix,
    stepLogits: Matrix,
    silenceEmbeds: Float32Array,
    numChunkFrames: number
  ): void {
    const { numCacheFrames, numFifoFrames } = this;
    const probs = this.poolProbabilities(stepLogits);

    const chunkStart = numCacheFrames + numFifoFrames;
    const chunk = sliceRows(
      stepEmbeds,
      chunkStart,
      chunkStart + numChunkFrames
    );
    let fifoEmbeds = concatRows(sliceRows(this.fifo, 0, numFifoFrames), chunk);

    const numPopped = this.numPoppedFrames(fifoEmbeds.rows);
    if (numPopped > 0) {
      const fifoProbs = sliceRows(
        probs,
        numCacheFrames,
        numCacheFrames + fifoEmbeds.rows
      );
      const storedProbs = this.isCompressed
        ? sliceRows(this.probs, 0, numCacheFrames)
        : sliceRows(probs, 0, numCacheFrames);

      let cacheEmbeds = concatRows(
        sliceRows(this.embeds, 0, numCacheFrames),
        sliceRows(fifoEmbeds, 0, numPopped)
      );
      let cacheProbs = concatRows(
        storedProbs,
        sliceRows(fifoProbs, 0, numPopped)
      );
      fifoEmbeds = sliceRows(fifoEmbeds, numPopped, fifoEmbeds.rows);

      if (cacheEmbeds.rows > this.config.speaker_cache_length) {
        ({ embeds: cacheEmbeds, probs: cacheProbs } = this.compress(
          cacheEmbeds,
          cacheProbs,
          silenceEmbeds
        ));
        this.isCompressed = true;
      }

      this.numCacheFrames = cacheEmbeds.rows;
      copyRowsInto(this.embeds, cacheEmbeds);
      copyRowsInto(this.probs, cacheProbs);
    }

    this.numFifoFrames = fifoEmbeds.rows;
    copyRowsInto(this.fifo, fifoEmbeds);
  }

  /** Average-pools per-frame speaker probabilities down to the encoder frame rate. */
  private poolProbabilities(logits: Matrix): Matrix {
    const factor = this.config.subsampling_factor;
    const numSpeakers = logits.cols;
    const pooled = createMatrix(Math.floor(logits.rows / factor), numSpeakers);

    for (let frame = 0; frame < pooled.rows; frame++) {
      for (let speaker = 0; speaker < numSpeakers; speaker++) {
        let total = 0;
        for (let step = 0; step < factor; step++) {
          total +=
            1 /
            (1 +
              Math.exp(
                -logits.data[(frame * factor + step) * numSpeakers + speaker]
              ));
        }
        pooled.data[frame * numSpeakers + speaker] = total / factor;
      }
    }
    return pooled;
  }

  /**
   * Nothing moves to the speaker cache until the FIFO queue overflows, then at least
   * `speaker_cache_update_period` of its oldest frames move, plus whatever restores its capacity.
   */
  private numPoppedFrames(numFifoFrames: number): number {
    if (numFifoFrames <= this.config.fifo_length) return 0;
    const numPopped = Math.max(
      this.config.speaker_cache_update_period,
      numFifoFrames - this.config.fifo_length
    );
    return Math.min(numPopped, numFifoFrames);
  }

  /**
   * Per-speaker importance of each frame: the log-odds that the speaker is active while every
   * other one is silent. Frames the speaker is not active in, and weak frames of a speaker that
   * already has enough strong ones, are ruled out with `-Infinity`.
   */
  private frameScores(probs: Matrix): Float32Array {
    const { prediction_score_threshold: threshold, num_speakers: numSpeakers } =
      this.config;
    const scores = new Float32Array(probs.data.length);

    for (let frame = 0; frame < probs.rows; frame++) {
      const offset = frame * numSpeakers;
      let complementTotal = 0;
      for (let speaker = 0; speaker < numSpeakers; speaker++) {
        complementTotal += Math.log(
          Math.max(1 - probs.data[offset + speaker], threshold)
        );
      }
      for (let speaker = 0; speaker < numSpeakers; speaker++) {
        const probability = probs.data[offset + speaker];
        if (probability <= 0.5) {
          scores[offset + speaker] = -Infinity;
          continue;
        }
        const logProbability = Math.log(Math.max(probability, threshold));
        const logComplement = Math.log(Math.max(1 - probability, threshold));
        scores[offset + speaker] =
          logProbability - logComplement + complementTotal - Math.log(0.5);
      }
    }

    for (let speaker = 0; speaker < numSpeakers; speaker++) {
      let numPositive = 0;
      for (let frame = 0; frame < probs.rows; frame++) {
        if (scores[frame * numSpeakers + speaker] > 0) numPositive++;
      }
      if (numPositive < this.minPositiveScores) continue;
      for (let frame = 0; frame < probs.rows; frame++) {
        const index = frame * numSpeakers + speaker;
        if (scores[index] <= 0) scores[index] = -Infinity;
      }
    }
    return scores;
  }

  /** Adds `boost` to the `count` best-scoring frames of every speaker. */
  private boostScores(
    scores: Float32Array,
    numFrames: number,
    count: number,
    boost: number
  ): void {
    const numSpeakers = this.config.num_speakers;
    const column = new Float32Array(numFrames);

    for (let speaker = 0; speaker < numSpeakers; speaker++) {
      for (let frame = 0; frame < numFrames; frame++)
        column[frame] = scores[frame * numSpeakers + speaker];
      for (const frame of topKIndices(column, count))
        scores[frame * numSpeakers + speaker] += boost;
    }
  }

  /**
   * Keeps the `speaker_cache_length` most important frames, grouped by speaker and in their
   * original order within a speaker, reserving silence slots filled with `silenceEmbeds`.
   */
  private compress(
    embeds: Matrix,
    probs: Matrix,
    silenceEmbeds: Float32Array
  ): { embeds: Matrix; probs: Matrix } {
    const { speaker_cache_length: capacity, num_speakers: numSpeakers } =
      this.config;
    const numSilenceFrames =
      this.config.speaker_cache_silence_frames_per_speaker;
    const numFrames = probs.rows;

    const scores = this.frameScores(probs);
    for (let frame = capacity; frame < numFrames; frame++) {
      for (let speaker = 0; speaker < numSpeakers; speaker++) {
        scores[frame * numSpeakers + speaker] +=
          this.config.latest_frames_score_boost;
      }
    }
    this.boostScores(
      scores,
      numFrames,
      this.numStrongBoostedFrames,
      STRONG_BOOST
    );
    this.boostScores(scores, numFrames, this.numWeakBoostedFrames, WEAK_BOOST);

    // Silence frames score `+Infinity`, so every speaker always keeps its reserved slots.
    const numScoredFrames = numFrames + numSilenceFrames;
    const sentinel = numScoredFrames * numSpeakers;
    const flatScores = new Float32Array(sentinel);
    for (let speaker = 0; speaker < numSpeakers; speaker++) {
      for (let frame = 0; frame < numFrames; frame++) {
        flatScores[speaker * numScoredFrames + frame] =
          scores[frame * numSpeakers + speaker];
      }
      for (let slot = 0; slot < numSilenceFrames; slot++) {
        flatScores[speaker * numScoredFrames + numFrames + slot] = Infinity;
      }
    }

    // Ruled-out picks fall back to the sentinel, which sorts last and resolves to the silence row.
    const selected = topKIndices(flatScores, capacity);
    for (let i = 0; i < capacity; i++) {
      if (flatScores[selected[i]] === -Infinity) selected[i] = sentinel;
    }
    selected.sort();

    const frameIndices = new Int32Array(capacity);
    for (let i = 0; i < capacity; i++) {
      frameIndices[i] =
        selected[i] === sentinel
          ? numFrames
          : Math.min(selected[i] % numScoredFrames, numFrames);
    }

    // The silence row sits past the last frame of both tensors, where out-of-range picks land too.
    const paddedEmbeds = concatRows(
      embeds,
      wrapMatrix(silenceEmbeds, embeds.cols)
    );
    const paddedProbs = concatRows(probs, createMatrix(1, numSpeakers));
    return {
      embeds: gatherRows(paddedEmbeds, frameIndices),
      probs: gatherRows(paddedProbs, frameIndices),
    };
  }
}
