/** @module onnx */
import { sleep } from "./helpers.js";

let initialized = false, Tensor, InferenceSession;

if (typeof ort !== "undefined") {
    initialized = true;
    Tensor = ort.Tensor;
    InferenceSession = ort.InferenceSession;
} else {
    import(/*webpackIgnore: true */"onnxruntime-web").then((module) => {
        initialized = true;
        Tensor = module.Tensor;
        InferenceSession = module.InferenceSession;
    }).catch(() => {
        import(/* webpackIgnore: true */"./onnxruntime-web/ort.mjs").then((module) => {
            initialized = true;
            Tensor = module.Tensor;
            InferenceSession = module.InferenceSession;
        });
    });
}

/**
 * Wrapper for ONNX Runtime Web API.
 */
export class ONNX {
    /**
     * Wait for the ONNX Runtime Web API to be initialized.
     * @returns {Promise<void>} A promise that resolves when the ONNX Runtime Web API is initialized.
     */
    static async waitForInitialization() {
        while (!initialized) {
            await sleep(10);
        }
    }

    /**
     * Create a new tensor.
     * @param {string} dtype The data type of the tensor.
     * @param {Array<number>} data The data of the tensor.
     * @param {Array<number>} dims The dimensions of the tensor.
     * @returns {Promise<Tensor>} A promise that resolves to a new tensor.
     */
    static async createTensor(dtype, data, dims) {
        await ONNX.waitForInitialization();
        return new Tensor(dtype, data, dims);
    }

    /**
     * Create a new inference session.
     * @param {ArrayBuffer} model The model to load.
     * @param {Object} [options] The options for the inference session.
     * @returns {Promise<InferenceSession>} A promise that resolves to a new inference session.
     */
    static async createInferenceSession(model, options = {}) {
        await ONNX.waitForInitialization();
        return await InferenceSession.create(model, options);
    }
}

// Wait for the ONNX Runtime Web API to be initialized, then replace the static methods.
// The static methods can still potentially be used, depending on the order of execution.
// This only saves a cycle or two, but it's better than nothing.
ONNX.waitForInitialization().then(() => {
    ONNX.createTensor = (dtype, data, dims) => new Tensor(dtype, data, dims);
    ONNX.createInferenceSession = (model, options = {}) => InferenceSession.create(model, options);
});
