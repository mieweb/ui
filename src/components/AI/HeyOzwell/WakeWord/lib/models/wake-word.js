/** @module models/wake-word */
import { ONNX } from "../onnx.js";
import { ONNXModel } from "./base.js";

/**
 * Wake Word model
 * @extends ONNXModel
 */
export class WakeWord extends ONNXModel {
    /**
     * Constructor
     * @param {string} modelPath - Path to the ONNX model
     * @param {number} threshold - Threshold for wake word detection (default: 0.5)
     */
    constructor(
        modelPath,
        threshold,
        power = 0,
        webnn = 1,
        webgpu = 2,
        webgl = 3,
        wasm = 4
    ) {
        super(modelPath, power, webnn, webgpu, webgl, wasm);
        this.threshold = threshold;
    }

    /**
     * Test the model
     * @param {boolean} debug - Whether to log debug messages
     * @throws {Error} - If the model test fails
     */
    async test(debug = false) {
        const embeddings = await ONNX.createTensor(
            "float32",
            new Float32Array(16*96).fill(0),
            [1, 16, 96]
        );
        const output = await this.run(embeddings);
        if (0.0 <= output && output <= 1.0) {
            if (debug) {
                console.log(`Wake Word model OK, executed in ${this.duration} ms`);
            }
        } else {
            throw new Error(`Wake Word model test failed - expected 0 <= x <= 1, got ${output}`);
        }
    }

    /**
     * Execute the model
     * @param {Float32Array} embeddings - Input embeddings
     * @returns {Promise} - Promise that resolves with the output of the model, which is a single float
     * @throws {Error} - If the input data is not a Float32Array
     */
    async execute(embeddings) {
        const input = {};
        if (embeddings.dims.length === 3) {
            input.input = embeddings;
        } else {
            input.input = await ONNX.createTensor(
                "float32",
                embeddings.data,
                [1, embeddings.dims[0], embeddings.dims[1]]
            );
        }
        const output = await this.session.run(input);
        return output.output.data[0] * 1;
    }

    /**
     * Check if the wake word is detected based on the threshold
     * @param {Float32Array} embeddings - Input embeddings
     * @returns {Promise<Object>} - Promise that resolves with an object containing probability and detected status
     */
    async checkWakeWordCalled(embeddings) {
        const probability = await this.run(embeddings);

        // Live base-threshold override for tuning without a rebuild: window.__baseThr can be a number
        // (all phrases) or a {name: thr} map. Falls back to the configured per-word threshold.
        let thr = this.threshold;
        const ov = (typeof window !== "undefined") ? window.__baseThr : undefined;
        if (typeof ov === "number") thr = ov;
        else if (ov && this.name && typeof ov[this.name] === "number") thr = ov[this.name];

        return {
            probability,
            detected: probability >= thr
        };
    }

    /**
     * Run wake word detection on audio.
     * @param {Float32Array} embeddings - Input embeddings
     * @returns {Promise} - Promise that resolves when wake word detection is complete.
     */
    async checkWakeWordPresent(embeddings) {
        return await this.execute(embeddings);
    }
}
