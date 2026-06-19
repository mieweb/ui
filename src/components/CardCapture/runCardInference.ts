import type * as ort from 'onnxruntime-web';

import {
  parseCardDetections,
  type CardPrediction,
  type PostprocessCardDetectionsOptions,
} from './postprocessCardDetections';
import { preprocessCardFrame } from './preprocessCardFrame';

export interface RunCardInferenceOptions extends PostprocessCardDetectionsOptions {
  inputSize?: number;
}

export interface CardInferenceResult {
  detected: boolean;
  confidence: number;

  /**
   * Internal information about the strongest model prediction.
   *
   * The capture component may use this in the future for alignment or
   * diagnostics, but it does not need to display a bounding box.
   */
  prediction: CardPrediction | null;
}

/**
 * Runs one ID-card detection pass against a browser image source.
 *
 * The camera frame is preprocessed into the tensor shape expected by the
 * model, executed through the supplied ONNX session, and converted into a
 * simple detection result.
 */
export async function runCardInference(
  session: ort.InferenceSession,
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  options: RunCardInferenceOptions = {}
): Promise<CardInferenceResult> {
  const inputName = session.inputNames[0];
  const outputName = session.outputNames[0];

  if (!inputName) {
    throw new Error('The card-detection model has no input.');
  }

  if (!outputName) {
    throw new Error('The card-detection model has no output.');
  }

  const { inputSize = 640, ...postprocessOptions } = options;

  const { tensor, metadata } = preprocessCardFrame(
    source,
    sourceWidth,
    sourceHeight,
    inputSize
  );

  const outputs = await session.run({
    [inputName]: tensor,
  });

  const outputTensor = outputs[outputName] as ort.Tensor | undefined;

  if (!outputTensor) {
    throw new Error(
      `The card-detection model did not return output "${outputName}".`
    );
  }

  const predictions = parseCardDetections(
    outputTensor,
    metadata,
    postprocessOptions
  );

  const strongestPrediction = predictions.reduce<CardPrediction | null>(
    (strongest, prediction) => {
      if (!strongest || prediction.confidence > strongest.confidence) {
        return prediction;
      }

      return strongest;
    },
    null
  );

  return {
    detected: strongestPrediction !== null,
    confidence: strongestPrediction?.confidence ?? 0,
    prediction: strongestPrediction,
  };
}
