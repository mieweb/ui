/** @module models/base */
import { ONNX } from "../onnx.js";
import { getModelBytes } from "../opfs.js";

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
        this.loadError = null;
        this.duration = 0.0; // EMA duration
        this.ema = 0.1; // EMA coefficient
        this.lastTime = 0.0; // Last time the model was run
        this.webnn = webnn;
        this.webgpu = webgpu;
        this.webgl = webgl;
        this.wasm = wasm;
        // 0 for default, -1 for low power, 1 for high power
        this.power = power;
        // Track the load so failures surface (an unhandled rejection here would leave `session` null and
        // hang waitUntilLoaded()/run() forever). waitUntilLoaded() awaits this and rethrows the error.
        this.loadPromise = this.load().catch((e) => {
            this.loadError = e;
            console.warn("[ONNXModel] load failed:", e);
        });
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
        // Intentionally wasm-only. The webnn/webgpu/webgl preferences computed in `executionProviders`
        // broke inference in this pipeline, so they're deliberately NOT applied here (the getter is kept
        // for reference / future investigation). This is the working configuration, not an oversight.
        return {
            executionProviders: ["wasm"],
        };
    }

    /**
     * Initialize the model
     */
    async load() {
        // Model files live in OPFS (app-private, offline, versioned) per the storage breakdown — fetch the
        // bytes ourselves (OPFS-first, network on miss) and hand ORT the bytes instead of the URL.
        const bytes = await getModelBytes(this.modelPath);
        this.session = await ONNX.createInferenceSession(bytes, this.sessionOptions);
    }

    /**
     * Waits until the model is loaded
     */
    async waitUntilLoaded() {
        await this.loadPromise;
        if (this.loadError) throw this.loadError; // fail fast instead of spinning forever on a load failure
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
