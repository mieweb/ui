/** @module hey-buddy */
import { ONNX } from "./onnx.js";
import { AudioBatcher } from "./audio.js";
import {
    SileroVAD,
    SpeechEmbedding,
    MelSpectrogram,
    WakeWord
} from "./models.js";

/**
 * Combines an array of embedding buffers into a single embedding tensor.
 *
 * @async
 * @function
 * @param {Float32Array[]} embeddingBufferArray - An array of embedding buffers, where each buffer is a Float32Array.
 * @param {number} numFramesPerEmbedding - The number of frames per embedding.
 * @param {number} embeddingDim - The dimensionality of each embedding.
 * @returns {Promise<Object>} A promise that resolves to an ONNX tensor containing the combined embeddings.
 */
async function embeddingBufferArrayToEmbedding(embeddingBufferArray, numFramesPerEmbedding, embeddingDim){
    // Create empty buffer of the right size
    const combinedEmptyData = new Float32Array(numFramesPerEmbedding * embeddingBufferArray.length * embeddingDim);
    
    // Create tensor with the empty buffer
    const embeddingBuffer = await ONNX.createTensor(
        "float32",
        combinedEmptyData,
        [numFramesPerEmbedding * embeddingBufferArray.length, embeddingDim]
    );

    // Fill the buffer with data
    for (let i = 0; i < embeddingBufferArray.length; i++) {
        const embedding = embeddingBufferArray[i];
        embeddingBuffer.data.set(embedding.data, i * numFramesPerEmbedding * embeddingDim);
    }
    return embeddingBuffer;
}

/**
 * HeyBuddy class for running wake word detection.
 */
export class HeyBuddy {
    /**
     * Create a HeyBuddy instance.
     * @param {Object} [options] - Options object.
     * @param {number} [options.positiveVadThreshold=0.5] - VAD threshold for speech.
     * @param {number} [options.negativeVadThreshold=0.25] - VAD threshold for silence.
     * @param {number} [options.negativeVadCount=8] - Number of negative VADs to trigger silence.
     * @param {number} [options.wakeWordThreads=4] - Number of threads for wake word detection.
     * @param {number} [options.wakeWordThreshold=0.5] - Wake word detection threshold.
     * @param {string|string[]} [options.modelPath="/models/hey-buddy.onnx"] - Path to wake word model.
     * @param {string} [options.vadModelPath="/pretrained/silero-vad.onnx"] - Path to VAD model.
     * @param {string} [options.embeddingModelPath="/pretrained/speech-embedding.onnx"] - Path to speech embedding model.
     * @param {string} [options.spectrogramModelPath="/pretrained/mel-spectrogram.onnx"] - Path to mel spectrogram model.
     * @param {number} [options.batchSeconds=1.08] - Number of seconds per batch.
     * @param {number} [options.batchIntervalSeconds=0.12] - Number of seconds between batches.
     * @param {number} [options.targetSampleRate=16000] - Target sample rate for audio.
     * @param {number} [options.spectrogramMelBins=32] - Number of mel bins for spectrogram.
     * @param {number} [options.embeddingDim=96] - Dimension of speech embedding.
     * @param {number} [options.embeddingWindowSize=76] - Window size for speech embedding.
     * @param {number} [options.embeddingWindowStride=8] - Window stride for speech embedding.
     */
    constructor (options) {
        options = options || {};
        // Get options or use defaults for runtime
        this.debug = options.debug || false;
        options.positiveVadThreshold = options.positiveVadThreshold || 0.65;
        options.negativeVadThreshold = options.negativeVadThreshold || 0.4;
        options.negativeVadCount = options.negativeVadCount || 8;
        this.wakeWordThreads = options.wakeWordThreads || 4;
        this.wakeWordThreshold = options.wakeWordThreshold || 0.5;
        // Per-word thresholds (keyed by model file name, e.g. "hey-ozwell"); falls back to wakeWordThreshold.
        this.wakeWordThresholds = options.wakeWordThresholds || {};
        this.wakeWordInterval = options.wakeWordInterval || 2.0; // How often a wake word can be uttered

        // Get options or use defaults for models
        const modelPath = options.modelPath || "/models/hey-buddy.onnx";
        const modelArray = Array.isArray(modelPath) ? modelPath : [modelPath];
        const vadModelPath = options.vadModelPath || "/pretrained/silero-vad.onnx";
        const embeddingModelPath = options.embeddingModelPath || "/pretrained/speech-embedding.onnx";
        const spectrogramModelPath = options.spectrogramModelPath || "/pretrained/mel-spectrogram.onnx";
        const batchSeconds = options.batchSeconds || 1.08; // 1080ms * 16khz = 17280 samples
        const batchIntervalSeconds = options.batchIntervalSeconds || 0.12; // 120ms * 16khz = 1920 samples
        const targetSampleRate = options.targetSampleRate || 16000;
        const spectrogramMelBins = options.spectrogramMelBins || 32;
        const embeddingDim = options.embeddingDim || 96;
        const embeddingWindowSize = options.embeddingWindowSize || 76;
        const embeddingWindowStride = options.embeddingWindowStride || 8;
        const wakeWordEmbeddingFrames = options.wakeWordEmbeddingFrames || 16;

        // Initialize shared models
        this.vad = new SileroVAD(vadModelPath, targetSampleRate, options.positiveVadThreshold, options.negativeVadThreshold, options.negativeVadCount);
        this.vad.test(this.debug).catch((e) => console.warn("[HeyBuddy] vad.test failed", e));

        this.spectrogram = new MelSpectrogram(spectrogramModelPath);
        this.spectrogram.test(this.debug).catch((e) => console.warn("[HeyBuddy] spectrogram.test failed", e));
        this.spectrogramMelBins = spectrogramMelBins;

        this.embedding = new SpeechEmbedding(
            embeddingModelPath,
            embeddingDim,
            embeddingWindowSize,
            embeddingWindowStride,
        );
        this.embedding.test(this.debug).catch((e) => console.warn("[HeyBuddy] embedding.test failed", e));
        this.embeddingDim = embeddingDim;
        this.embeddingWindowSize = embeddingWindowSize;
        this.embeddingWindowStride = embeddingWindowStride;
        this.embeddingBuffer = null;
        this.embeddingBufferArray = []

        // --- Voiceprint (per-user enrollment) layer ---
        // Stored voiceprints keyed by wake-word name; each is an array of Float32Array
        // (each a flattened [16x96] embedding window captured during enrollment). At
        // runtime we cosine-match the live embedding window against these.
        this.voiceprints = {};
        this.voiceprintThreshold = options.voiceprintThreshold ?? 0.85;
        this.voiceprintThresholds = options.voiceprintThresholds || {};
        // The voiceprint may only BOOST a phrase the general model already weakly hears, never
        // fire one it hears nothing of — this stops enrolling a DIFFERENT phrase ("hey doug").
        this.voiceprintGate = options.voiceprintGate ?? 0.3;
        this.embeddingMean = null; // running "common-mode" embedding, subtracted before cosine
        // RECALL use of the voiceprint (amplify a weak model fire). Default on for back-compat;
        // set false to use the voiceprint for PRECISION only (reject false fires in runWakeGate).
        this.voiceprintRecall = options.voiceprintRecall ?? true;
        // Debounce: require a phrase to clear its threshold for N CONSECUTIVE frames before firing.
        // Real wakes sustain (~4-9 frames in the browser pipeline); conversational false fires are brief
        // 1-2 frame spikes — so this cuts false fires ~30x at ~1pt recall cost (measured browser-faithful).
        // N=1 = off (legacy single-frame). Live-tunable via window.__debounceFrames.
        this.debounceFrames = options.debounceFrames ?? 1;
        this._consec = {}; // per-phrase consecutive-detected-frame counter
        this.lastWakeProb = 0; // peak fire confidence frozen at the last wake (the base level)
        this._peakProb = {}; // per-phrase peak probability within the current detection run
        this._peakEmb = {};  // per-phrase embedding window at that peak frame (used for the voiceprint)
        // The [16x96] embedding window at the moment a wake last fired — so the gate (runWakeGate)
        // and enrollment can reuse the exact window the model scored, no recompute.
        this.lastWakeEmbedding = null;

        // Initialize wake word models
        this.wakeWords = {};
        this.wakeWordTimes = {};
        this.wakeWordEmbeddingFrames = wakeWordEmbeddingFrames;
        for (let model of modelArray) {
            let modelName = model.split("/").pop().split(".")[0];
            let modelThreshold = this.wakeWordThresholds[modelName] ?? this.wakeWordThreshold;
            this.wakeWords[modelName] = new WakeWord(model, modelThreshold);
            this.wakeWords[modelName].name = modelName; // for per-phrase window.__baseThr override
            this.wakeWords[modelName].test(this.debug).catch((e) => console.warn(`[HeyBuddy] ${modelName}.test failed`, e));
        }

        // Initialize state
        this.recording = false;
        this.audioBuffer = null;
        this.frameIntervalEma = 0;
        this.frameIntervalEmaWeight = 0.1;
        this.frameTimeEma = 0;
        this.frameTimeEmaWeight = 0.1;

        this.speechStartCallbacks = [];
        this.speechEndCallbacks = [];
        this.recordingCallbacks = [];
        this.processedCallbacks = [];
        this.detectedCallbacks = [];

        // Initialize batcher and add callback
        this.batcher = new AudioBatcher(
            batchSeconds,
            batchIntervalSeconds,
            targetSampleRate
        );
        this.batcher.onBatch((batch) => this.process(batch));
    }

    /**
     * Set a user's enrolled voiceprint for a wake word.
     * @param {string} name - Wake-word name (e.g. "hey-ozwell").
     * @param {Float32Array[]} vectors - Flattened embedding windows captured at enrollment.
     */
    setVoiceprint(name, vectors) { this.voiceprints[name] = vectors || []; }
    clearVoiceprint(name) { delete this.voiceprints[name]; }
    hasVoiceprint(name) {
        return Array.isArray(this.voiceprints[name]) && this.voiceprints[name].length > 0;
    }

    /**
     * Max cosine similarity between a live embedding window and the stored voiceprint set.
     * Cosine compares DIRECTION not magnitude, so it ignores loudness and keys on what the
     * sound actually is. Returns 0..1 (1 = near-identical).
     */
    voiceprintSimilarity(name, liveVec) {
        const set = this.voiceprints[name];
        if (!Array.isArray(set) || set.length === 0 || !liveVec) return 0;
        const mean = this.embeddingMean; // subtract the common-mode so cosine reflects CONTENT
        let best = -1; // allow negative (poor-match) scores through, don't floor them at 0
        for (const ref of set) {
            let dot = 0, na = 0, nb = 0;
            const n = Math.min(ref.length, liveVec.length);
            for (let i = 0; i < n; i++) {
                const a = mean ? ref[i] - mean[i] : ref[i];
                const b = mean ? liveVec[i] - mean[i] : liveVec[i];
                dot += a * b; na += a * a; nb += b * b;
            }
            if (na > 0 && nb > 0) { const s = dot / (Math.sqrt(na) * Math.sqrt(nb)); if (s > best) best = s; }
        }
        return best;
    }

    /**
     * Gets the names of wake words, chunked for threaded wake word detection.
     * @returns {string[][]} - Names of wake words.
     */
    get chunkedWakeWords() {
        return Object.keys(this.wakeWords).reduce((carry, name, i) => {
            const chunkIndex = Math.floor(i / this.wakeWordThreads);
            if (!carry[chunkIndex]) {
                carry[chunkIndex] = [];
            }
            carry[chunkIndex].push(name);
            return carry;
        }, []);
    }

    /**
     * Add a callback for when a wake word is detected.
     * @param {string|string[]} names - Name of wake word.
     * @param {Function} callback - Callback function.
     */
    onDetected(names, callback) {
        this.detectedCallbacks.push({names, callback});
    }

    /**
     * Add a callback for processed data.
     * @param {Function} callback - Callback function.
     */
    onProcessed(callback) {
        this.processedCallbacks.push(callback);
    }

    /**
     * Add a callback for speech start.
     * @param {Function} callback - Callback function.
     */
    onSpeechStart(callback) {
        this.speechStartCallbacks.push(callback);
    }

    /**
     * Add a callback for speech end.
     * @param {Function} callback - Callback function.
     */
    onSpeechEnd(callback) {
        this.speechEndCallbacks.push(callback);
    }

    /**
     * Add a callback for recording.
     * @param {Function} callback - Callback function.
     */
    onRecording(callback) {
        this.recordingCallbacks.push(callback);
    }

    /**
     * Trigger speech start event.
     */
    speechStart() {
        if (this.debug) {
            console.log("Speech start");
        }
        for (let callback of this.speechStartCallbacks) {
            callback();
        }
    }

    /**
     * Trigger speech end event.
     */
    speechEnd() {
        if (this.debug) {
            console.log("Speech end");
        }
        for (let callback of this.speechEndCallbacks) {
            callback();
        }
        if (this.recording) {
            this.dispatchRecording();
            this.recording = false;
        }
    }

    /**
     * Dispatch recording to all recording callbacks.
     */ 
    dispatchRecording() {
        if (this.audioBuffer === null) {
            console.error("No recording to dispatch");
            return;
        }
        if (this.debug) {
            const recordingLength = this.audioBuffer.length;
            const recordedDuration = recordingLength / this.batcher.targetSampleRate;
            console.log(`Dispatching recording with ${recordingLength} frames (${recordedDuration} s)`);
        }
        for (let callback of this.recordingCallbacks) {
            callback(this.audioBuffer);
        }
        this.audioBuffer = null;
    }

    /**
     * Trigger wake word detection event.
     * @param {string} name - Name of wake word.
     */
    wakeWordDetected(name) {
        const now = Date.now();
        if (this.wakeWordTimes[name] && (now - this.wakeWordTimes[name]) < this.wakeWordInterval * 1000) {
            return;
        }
        if (this.debug) {
            console.log("Wake word detected:", name);
        }
        this.recording = true;
        this.wakeWordTimes[name] = now;
        // How long the phrase was, from its detection run. `_consec[name]` = consecutive detected frames up
        // to this fire; each frame is one batch interval (~120ms), so this ≈ the spoken phrase's duration.
        // Purely additive readout (detection logic unchanged) — consumers use it to trim the phrase off the
        // recorded audio without relying on a silent pause before it.
        const frameSec = (this.batcher && this.batcher.batchIntervalSamples && this.batcher.targetSampleRate)
            ? this.batcher.batchIntervalSamples / this.batcher.targetSampleRate : 0.12;
        this.lastWakeDurationSec = (this._consec[name] || 0) * frameSec;
        // FREEZE the wake embedding at THIS fire moment = the peak of the current detection run up to the
        // fire. Captured ONCE per fire (this runs after the interval guard above), so it can't drift to
        // later low-confidence frames during the recording tail — that drift collapsed the gate/enrollment
        // cosine (esp. with a low base threshold, where weak frames keep counting as "detected").
        // Enrollment and the runtime gate both read this same frozen value -> their cosines stay comparable.
        this.lastWakeEmbedding = (this._peakEmb && this._peakEmb[name])
            ? this._peakEmb[name]
            : ((this.embeddingBuffer && this.embeddingBuffer.data) ? Float32Array.from(this.embeddingBuffer.data) : null);
        // freeze the peak fire confidence too (the live prob spikes then drops, so reading it later is stale)
        this.lastWakeProb = (this._peakProb && this._peakProb[name]) ? this._peakProb[name] : 0;

        for (let {names, callback} of this.detectedCallbacks) {
            if (Array.isArray(names) && names.includes(name) || names === name) {
                callback();
            }
        }
    }

    /**
     * Trigger processed event.
     * @param {Object} data - Processed data.
     */
    processed(data) {
        for (let callback of this.processedCallbacks) {
            callback(data);
        }
    }

    /**
     * Runs wake word detection on a subset of wake words.
     * @param {string[]} wakeWordNames - Names of wake words to check.
     * @returns {Promise} - Promise that resolves when wake word detection is complete.
     */
    async checkWakeWordSubset(wakeWordNames) {
        return await Promise.all(
            wakeWordNames.map(name => this.wakeWords[name].checkWakeWordCalled(this.embeddingBuffer))
        );
    }

    /**
     * Run wake word detection on audio.
     * @returns {Promise} - Promise that resolves when wake word detection is complete.
     */
    async checkWakeWords() {
        const returnMap = {};
        for (let nameChunk of this.chunkedWakeWords) {
            const wakeWordsCalled = await this.checkWakeWordSubset(nameChunk);
            for (let i = 0; i < nameChunk.length; i++) {
                const name = nameChunk[i];
                const wordCalled = wakeWordsCalled[i];
                returnMap[name] = wordCalled;
            }
        }
        // Winner-take-all (MIE 2026-06-09): the two phrases share the word "ozwell" and can
        // co-fire on a single utterance. Since start/stop are mutually exclusive, when more than
        // one wake word crosses its threshold in the same window, fire ONLY the most CONFIDENT one
        // (highest raw probability). NOTE: do NOT compare by margin (prob - threshold) — that biases
        // toward the lower-threshold word (ozwell-done @0.5 out-margins hey-ozwell @0.8 even when you
        // clearly said "hey ozwell"). Raw probability is the correct comparison here.
        // Voiceprint layer: cosine-match the live embedding window against each phrase's
        // enrolled voiceprint. Attach the score (for graphing) and use it as a FALLBACK so a
        // user the general model is weak on (e.g. their accent) still triggers on a match.
        const liveVec = this.embeddingBuffer ? this.embeddingBuffer.data : null;
        for (let name in returnMap) {
            returnMap[name].voiceprintSim = this.hasVoiceprint(name)
                ? this.voiceprintSimilarity(name, liveVec) : 0;
        }

        // Debounce + PEAK-CAPTURE (per phrase). Track consecutive detected frames (debounce), AND the
        // PEAK-confidence embedding within the current run — so the voiceprint is captured at the
        // best-aligned frame, not wherever debounce happens to commit. Critical for SHORT phrases like
        // "hey ozwell": the debounce-fire frame can land on the tail (low/variable cosine), but the peak
        // frame is the real phrase moment (consistent cosine).
        for (let name in returnMap) {
            if (returnMap[name].detected) {
                this._consec[name] = (this._consec[name] || 0) + 1;
                if (returnMap[name].probability > (this._peakProb[name] || 0) && this.embeddingBuffer && this.embeddingBuffer.data) {
                    this._peakProb[name] = returnMap[name].probability;
                    this._peakEmb[name] = Float32Array.from(this.embeddingBuffer.data);
                }
            } else {
                this._consec[name] = 0; this._peakProb[name] = 0; this._peakEmb[name] = null;
            }
        }
        // Per-phrase debounce: window.__debounceFrames (number) overrides all; else this.debounceFrames may
        // be a number (global) or a {phrase: N} object (per-phrase). Short phrases need a lower N.
        const minRunFor = (name) => {
            if (typeof window.__debounceFrames === "number") return window.__debounceFrames;
            if (this.debounceFrames && typeof this.debounceFrames === "object") return this.debounceFrames[name] ?? 1;
            return this.debounceFrames || 1;
        };
        // Model winner-take-all (highest raw probability among phrases that have cleared their debounce).
        let best = null;
        for (let name in returnMap) {
            if (returnMap[name].detected && this._consec[name] >= minRunFor(name)) {
                const prob = returnMap[name].probability;
                if (best === null || prob > best.prob) {
                    best = { name, prob };
                }
            }
        }
        if (best !== null) {
            // NOTE: lastWakeEmbedding is captured (frozen) INSIDE wakeWordDetected, once per fire, from the
            // run's peak — NOT here every frame (that drifted to later low-confidence frames -> bad cosine).
            this.wakeWordDetected(best.name);
        } else if (this.voiceprintRecall) {
            // RECALL (optional): general model fired nothing -> fall back to the strongest voiceprint
            // match. Off by default in this build — the voiceprint is used for PRECISION (reject) instead.
            let vbest = null;
            for (let name in returnMap) {
                const sim = returnMap[name].voiceprintSim;
                const vt = this.voiceprintThresholds[name] ?? this.voiceprintThreshold;
                // GATE: require the model to at least weakly hear THIS phrase, so the voiceprint
                // can only amplify the real wake word — not fire a different one ("hey doug").
                const modelLit = returnMap[name].probability >= this.voiceprintGate;
                if (sim >= vt && modelLit && (vbest === null || sim > vbest.sim)) vbest = { name, sim };
            }
            if (vbest !== null) {
                this.wakeWordDetected(vbest.name);
            }
        }
        return returnMap;
    }

    /**
     * Process audio batch.
     * @param {Float32Array} audio - Audio samples.
     */
    async process(audio) {
        // Start timer
        this.frameStart = (new Date()).getTime();

        if (this.frameEnd !== undefined && this.frameEnd !== null) {
            this.frameInterval = this.frameStart - this.frameEnd;
        } else {
            this.frameInterval = 0;
        }
        if (this.frameIntervalEma === 0) {
            this.frameIntervalEma = this.frameInterval;
        } else {
            this.frameIntervalEma = this.frameIntervalEma * (1 - this.frameIntervalEmaWeight) + this.frameInterval * this.frameIntervalEmaWeight;
        }

        // Get the last batch of samples
        const lastBatch = audio.subarray(audio.length - this.batcher.batchIntervalSamples);

        // Calculate the spectrogram for this buffer, assert it is exactly one window
        const spectrograms = await this.spectrogram.run(audio);
        const embedding = await this.embedding.getEmbeddingFromMelSpectrogramOutput(spectrograms);
        const numFramesPerEmbedding = embedding.dims[0];
        const maxEmbeddings = this.wakeWordEmbeddingFrames/numFramesPerEmbedding;


        // We want to run it via a "window" of audio samples at a time
        // so we add a new element, remove the first element, then analyze the new section of audio
        // (or rather audio embeddings) to see if the voice keyword is detected there
        this.embeddingBufferArray.push(embedding);
        if (this.embeddingBufferArray.length > maxEmbeddings) this.embeddingBufferArray.shift();

        this.embeddingBuffer = await embeddingBufferArrayToEmbedding(this.embeddingBufferArray, numFramesPerEmbedding, this.embeddingDim);

        const {isSpeaking, speechProbability, justStoppedSpeaking, justStartedSpeaking} = await this.vad.hasSpeechAudio(lastBatch);

        // Running BACKGROUND mean embedding, updated ONLY during non-speech so it stays an
        // ambient baseline and can't get contaminated by the phrase you're testing. We
        // subtract it in voiceprintSimilarity so cosine reflects content, not the shared
        // common-mode that otherwise pins every comparison near 0.9.
        if (!isSpeaking && this.embeddingBuffer && this.embeddingBuffer.data) {
            const d = this.embeddingBuffer.data;
            if (!this.embeddingMean || this.embeddingMean.length !== d.length) this.embeddingMean = Float32Array.from(d);
            else for (let i = 0; i < d.length; i++) this.embeddingMean[i] += 0.02 * (d[i] - this.embeddingMean[i]);
        }

        if(justStartedSpeaking) this.speechStart();
        if(justStoppedSpeaking) this.speechEnd();

        if (isSpeaking && this.embeddingBuffer.dims[0] === this.wakeWordEmbeddingFrames && !this._wakeBusy) {
            // If we're listening, run wake word detection. Guard against OVERLAPPING runs — if a wake
            // inference takes longer than the frame interval, the next frame would call run() on a
            // still-busy session → "Session already started". The guard skips those frames safely.
            this._wakeBusy = true;
            let wakeWordsCalled;
            try { wakeWordsCalled = await this.checkWakeWords(); }
            finally { this._wakeBusy = false; }
            // Trigger callbacks with processed data
            this.processed({
                listening: true,
                recording: this.recording,
                speech: {probability: speechProbability, active: isSpeaking},
                wakeWords: wakeWordsCalled,
                // Live [16x96] embedding window (flattened) — what enrollment captures and
                // what the voiceprint layer matches against. Present only while listening.
                embedding: this.embeddingBuffer ? this.embeddingBuffer.data : null
            });
        } else {
            // Trigger callbacks right away if we're not listening
            this.processed({
                listening: false,
                recording: this.recording,
                speech: {probability: speechProbability, active: isSpeaking},
                wakeWords: Object.entries(this.wakeWords).reduce(
                    (carry, [name, model]) => {
                        carry[name] = {
                            probability: 0.0,
                            active: false
                        };
                        return carry;
                    },
                    {}
                ),
                embedding: this.embeddingBuffer ? this.embeddingBuffer.data : null
            });
        }

        // If we're recording, append audio to buffer
        if (this.recording) {
            if (this.audioBuffer === null) {
                this.audioBuffer = new Float32Array(audio.length);
                this.audioBuffer.set(audio);
            } else {
                const concatenated = new Float32Array(this.audioBuffer.length + lastBatch.length);
                concatenated.set(this.audioBuffer);
                concatenated.set(lastBatch, this.audioBuffer.length);
                this.audioBuffer = concatenated;
            }
        }

        // Stop timer
        this.frameEnd = (new Date()).getTime();
        this.frameTime = this.frameEnd - this.frameStart;
        if (this.frameTimeEma === 0) {
            this.frameTimeEma = this.frameTime;
        } else {
            this.frameTimeEma = this.frameTimeEma * (1 - this.frameTimeEmaWeight) + this.frameTime * this.frameTimeEmaWeight;
        }
    }
};

if (typeof window !== "undefined") {
    window.HeyBuddy = HeyBuddy;
}