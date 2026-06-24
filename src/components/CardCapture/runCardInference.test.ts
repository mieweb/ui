import * as ort from 'onnxruntime-web';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  parseCardDetections,
  type CardPrediction,
} from './postprocessCardDetections';
import { preprocessCardFrame } from './preprocessCardFrame';
import { runCardInference } from './runCardInference';

vi.mock('./preprocessCardFrame', () => ({
  preprocessCardFrame: vi.fn(),
}));

vi.mock('./postprocessCardDetections', () => ({
  parseCardDetections: vi.fn(),
}));

const mockPreprocessCardFrame = vi.mocked(preprocessCardFrame);

const mockParseCardDetections = vi.mocked(parseCardDetections);

const MODEL_METADATA = {
  sourceWidth: 1280,
  sourceHeight: 720,
  inputSize: 640,
  scale: 0.5,
  resizedWidth: 640,
  resizedHeight: 360,
  padX: 0,
  padY: 140,
};

function createPrediction(confidence: number): CardPrediction {
  return {
    classId: 0,
    label: 'id_card',
    confidence,
    x1: 100,
    y1: 100,
    x2: 300,
    y2: 200,
    x: 200,
    y: 150,
    width: 200,
    height: 100,
  };
}

function createMockSession(outputTensor: ort.Tensor): {
  session: ort.InferenceSession;
  run: ReturnType<typeof vi.fn>;
} {
  const run = vi.fn().mockResolvedValue({
    output0: outputTensor,
  });

  const session = {
    inputNames: ['images'],
    outputNames: ['output0'],
    run,
  } as unknown as ort.InferenceSession;

  return {
    session,
    run,
  };
}

describe('runCardInference', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('preprocesses the frame, runs the model, and returns the strongest prediction', async () => {
    const inputTensor = new ort.Tensor(
      'float32',
      new Float32Array(12),
      [1, 3, 2, 2]
    );

    const outputTensor = new ort.Tensor(
      'float32',
      new Float32Array(5),
      [1, 5, 1]
    );

    mockPreprocessCardFrame.mockReturnValue({
      tensor: inputTensor,
      metadata: MODEL_METADATA,
    });

    const weakerPrediction = createPrediction(0.76);
    const strongerPrediction = createPrediction(0.91);

    mockParseCardDetections.mockReturnValue([
      weakerPrediction,
      strongerPrediction,
    ]);

    const { session, run } = createMockSession(outputTensor);

    const source = {} as CanvasImageSource;
    const preprocessingCanvas = document.createElement('canvas');
    const result = await runCardInference(session, source, 1280, 720, {
      inputSize: 640,
      confidenceThreshold: 0.7,
      iouThreshold: 0.45,
      preprocessingCanvas,
    });

    expect(mockPreprocessCardFrame).toHaveBeenCalledWith(
      source,
      1280,
      720,
      640,
      preprocessingCanvas
    );

    expect(run).toHaveBeenCalledWith({
      images: inputTensor,
    });

    expect(mockParseCardDetections).toHaveBeenCalledWith(
      outputTensor,
      MODEL_METADATA,
      {
        confidenceThreshold: 0.7,
        iouThreshold: 0.45,
      }
    );

    expect(result).toEqual({
      detected: true,
      confidence: 0.91,
      prediction: strongerPrediction,
    });
  });

  it('returns a clear no-detection result when no card prediction is present', async () => {
    const inputTensor = new ort.Tensor(
      'float32',
      new Float32Array(12),
      [1, 3, 2, 2]
    );

    const outputTensor = new ort.Tensor(
      'float32',
      new Float32Array(5),
      [1, 5, 1]
    );

    mockPreprocessCardFrame.mockReturnValue({
      tensor: inputTensor,
      metadata: MODEL_METADATA,
    });

    mockParseCardDetections.mockReturnValue([]);

    const { session } = createMockSession(outputTensor);

    const result = await runCardInference(
      session,
      {} as CanvasImageSource,
      1280,
      720
    );

    expect(result).toEqual({
      detected: false,
      confidence: 0,
      prediction: null,
    });
  });

  it('throws a useful error when the expected model output is missing', async () => {
    const inputTensor = new ort.Tensor(
      'float32',
      new Float32Array(12),
      [1, 3, 2, 2]
    );

    mockPreprocessCardFrame.mockReturnValue({
      tensor: inputTensor,
      metadata: MODEL_METADATA,
    });

    const session = {
      inputNames: ['images'],
      outputNames: ['output0'],
      run: vi.fn().mockResolvedValue({}),
    } as unknown as ort.InferenceSession;

    await expect(
      runCardInference(session, {} as CanvasImageSource, 1280, 720)
    ).rejects.toThrow(
      'The card-detection model did not return output "output0".'
    );
  });

  it('rejects a session without model input or output names', async () => {
    const noInputSession = {
      inputNames: [],
      outputNames: ['output0'],
    } as unknown as ort.InferenceSession;

    await expect(
      runCardInference(noInputSession, {} as CanvasImageSource, 1280, 720)
    ).rejects.toThrow('The card-detection model has no input.');

    const noOutputSession = {
      inputNames: ['images'],
      outputNames: [],
    } as unknown as ort.InferenceSession;

    await expect(
      runCardInference(noOutputSession, {} as CanvasImageSource, 1280, 720)
    ).rejects.toThrow('The card-detection model has no output.');
  });
});
