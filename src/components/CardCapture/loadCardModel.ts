import * as ort from 'onnxruntime-web';

const DEFAULT_WASM_PATHS = '/ort-wasm/';

export interface LoadCardModelOptions {
  /**
   * Public directory containing ONNX Runtime Web's .mjs and .wasm files.
   *
   * Consumers can override this when their application hosts the runtime
   * assets at a different location.
   */
  wasmPaths?: string;
}

/**
 * Loads an ONNX card-detection model for browser inference.
 *
 * The model and ONNX Runtime assets are downloaded by the browser, while
 * inference runs locally through the WebAssembly execution provider.
 */
export async function loadCardModel(
  modelUrl: string,
  options: LoadCardModelOptions = {}
): Promise<ort.InferenceSession> {
  const normalizedModelUrl = modelUrl.trim();

  if (!normalizedModelUrl) {
    throw new Error('A model URL is required to load the card detector.');
  }

  const normalizedWasmPathsInput = options.wasmPaths?.trim() || DEFAULT_WASM_PATHS;
  const normalizedWasmPaths = normalizedWasmPathsInput.endsWith('/')
    ? normalizedWasmPathsInput
    : `${normalizedWasmPathsInput}/`;

  return ort.InferenceSession.create(normalizedModelUrl, {
    executionProviders: ['wasm'],
  });
}
