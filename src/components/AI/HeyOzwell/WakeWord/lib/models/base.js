/** @module models/base */
import { sleep } from "../helpers.js";
import { ONNX } from "../onnx.js";

/**
 * Base class for ONNX models
 */
export class ONNXModel {
    /**
     * Constructor
     * @param {string} modelPath - Path to the ONNX model
     * @param {Object} options - Options
     */
    constructor(
        modelPath,
        power = 0,
        webnn = 1,
        webgpu = 2,
        webgl = 3,
        wasm = 4,
    ) {
        this.modelPath = modelPath;
        this.session = null;
        this.duration = 0.0; // EMA duration
        this.ema = 0.1; // EMA coefficient
        this.lastTime = 0.0; // Last time the model was run
        this.webnn = webnn;
        this.webgpu = webgpu;
        this.webgl = webgl;
        this.wasm = wasm;
        // 0 for default, -1 for low power, 1 for high power
        this.power = power;
        this.load();
    }

    /**
     * Get the power preference
     * @returns {string} - Power preference
     */
    get powerPreference() {
        switch (this.power) {
            case -1:
                return "low-power";
            case 1:
                return "high-performance";
            default:
                return "default";
        }
    }

    /**
     * Get the execution providers
     * @returns {Array} - Execution providers
     */
    get executionProviders() {
        const providerIndexes = [];
        if (Number.isInteger(this.webnn)) {
            providerIndexes.push([{
                name: "webnn",
                device: "gpu",
                powerPreference: this.powerPreference,
            }, this.webnn]);
        }
        if (Number.isInteger(this.webgpu)) {
            providerIndexes.push(["webgpu", this.webgpu]);
        }
        if (Number.isInteger(this.webgl)) {
            providerIndexes.push(["webgl", this.webgl]);
        }
        if (Number.isInteger(this.wasm)) {
            providerIndexes.push(["wasm", this.wasm]);
        }
        providerIndexes.sort((a, b) => a[1] - b[1]);
        return providerIndexes.map((providerIndex) => providerIndex[0]);
    }

    /**
     * Get the session options
     * @returns {Object} - Session options
     * @see https://onnxruntime.ai/docs/tutorials/web/env-flags-and-session-options.html#session-options
     */
    get sessionOptions() {
        // TODO: all three other options seem to break, need to investigate
        return {
            executionProviders: ["wasm"],
        };
    }

    /**
     * Initialize the model
     */
    async load() {
        this.session = await ONNX.createInferenceSession(this.modelPath, this.sessionOptions);
    }

    /**
     * Waits until the model is loaded
     */
    async waitUntilLoaded() {
        while (this.session === null) {
            await sleep(1);
        }
    }

    /**
     * Execute the model
     * @param {Mixed} input - Input data
     * @returns {Promise} - Promise that resolves with the output of the model
     * @throws {Error} - If the method is not implemented
     */
    async execute(input) {
        throw new Error("Not Implemented");
    }

    /**
     * Run the model
     * @param {Mixed} input - Input data
     * @returns {Promise} - Promise that resolves with the output of the model
     */
    async run(input) {
        await this.waitUntilLoaded();
        const currentTime = new Date().getTime();
        const result = await this.execute(input);
        const executionDuration = new Date().getTime() - currentTime;
        // Update EMA
        if (this.duration === 0.0) {
            this.duration = executionDuration;
        } else {
            this.duration = (1.0 - this.ema) * this.duration + this.ema * executionDuration;
        }
        this.lastTime = currentTime;
        return result;
    }
}
