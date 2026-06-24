import * as React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { InferenceSession } from 'onnxruntime-web';

import { loadCardModel } from './loadCardModel';
import { CardInferenceResult, runCardInference } from './runCardInference';
import { useCardDetection } from './useCardDetection';
import type { CardPrediction } from './postprocessCardDetections';

vi.mock('./loadCardModel', () => ({
  loadCardModel: vi.fn(),
}));

vi.mock('./runCardInference', () => ({
  runCardInference: vi.fn(),
}));

const mockLoadCardModel = vi.mocked(loadCardModel);
const mockRunCardInference = vi.mocked(runCardInference);

function createMockSession(): InferenceSession {
  return {
    inputNames: ['images'],
    outputNames: ['output0'],
    run: vi.fn(),
    release: vi.fn().mockResolvedValue(undefined),
  } as unknown as InferenceSession;
}

function createVideoRef(): React.RefObject<HTMLVideoElement | null> {
  return {
    current: {
      readyState: 4,
      videoWidth: 1280,
      videoHeight: 720,
    } as HTMLVideoElement,
  };
}
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
function createDeferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
} {
  let resolvePromise!: (value: T | PromiseLike<T>) => void;

  const promise = new Promise<T>((resolve) => {
    resolvePromise = resolve;
  });

  return {
    promise,
    resolve: resolvePromise,
  };
}
describe('useCardDetection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads the model and reports when it is ready', async () => {
    const session = createMockSession();
    mockLoadCardModel.mockResolvedValue(session);

    const { result, unmount } = renderHook(() =>
      useCardDetection(createVideoRef(), {
        modelUrl: '/models/id-card-detector-v1.onnx',
      })
    );

    expect(result.current.status).toBe('loading');

    await waitFor(() => {
      expect(result.current.status).toBe('ready');
    });

    expect(result.current.isModelReady).toBe(true);
    expect(mockLoadCardModel).toHaveBeenCalledWith(
      '/models/id-card-detector-v1.onnx',
      {
        wasmPaths: undefined,
      }
    );

    unmount();

    expect(session.release).toHaveBeenCalled();
  });

  it('requires consecutive positive detections before reporting a stable card', async () => {
    mockLoadCardModel.mockResolvedValue(createMockSession());

    mockRunCardInference.mockResolvedValue({
      detected: true,
      confidence: 0.91,
      prediction: createPrediction(0.91),
    } satisfies CardInferenceResult);

    const videoRef = createVideoRef();

    const { result, unmount } = renderHook(() =>
      useCardDetection(videoRef, {
        modelUrl: '/models/id-card-detector-v1.onnx',
        detectionIntervalMs: 5,
        stableDetectionsRequired: 2,
      })
    );

    await waitFor(() => {
      expect(result.current.isModelReady).toBe(true);
    });

    act(() => {
      result.current.startDetection();
    });

    await waitFor(() => {
      expect(result.current.isCardDetected).toBe(true);
    });

    expect(result.current.status).toBe('detected');
    expect(result.current.confidence).toBe(0.91);
    expect(result.current.consecutiveDetections).toBeGreaterThanOrEqual(2);

    act(() => {
      result.current.stopDetection();
    });

    unmount();
  });

  it('resets a stable detection after the allowed misses are exceeded', async () => {
    mockLoadCardModel.mockResolvedValue(createMockSession());

    const missedDetection = createDeferred<CardInferenceResult>();

    const positiveResult = {
      detected: true,
      confidence: 0.88,
      prediction: createPrediction(0.88),
    } satisfies CardInferenceResult;

    const negativeResult = {
      detected: false,
      confidence: 0,
      prediction: null,
    } satisfies CardInferenceResult;

    mockRunCardInference
      .mockResolvedValueOnce(positiveResult)
      .mockReturnValueOnce(missedDetection.promise)
      .mockResolvedValue(negativeResult);

    const { result, unmount } = renderHook(() =>
      useCardDetection(createVideoRef(), {
        modelUrl: '/models/id-card-detector-v1.onnx',
        detectionIntervalMs: 20,
        stableDetectionsRequired: 1,
        allowedMisses: 0,
      })
    );

    await waitFor(() => {
      expect(result.current.isModelReady).toBe(true);
    });

    act(() => {
      result.current.startDetection();
    });

    await waitFor(() => {
      expect(result.current.isCardDetected).toBe(true);
    });

    expect(result.current.confidence).toBe(0.88);
    expect(result.current.consecutiveDetections).toBe(1);

    await act(async () => {
      missedDetection.resolve(negativeResult);
      await missedDetection.promise;
    });

    await waitFor(() => {
      expect(result.current.isCardDetected).toBe(false);
    });

    expect(result.current.consecutiveDetections).toBe(0);
    expect(result.current.confidence).toBe(0);

    act(() => {
      result.current.stopDetection();
    });

    unmount();
  });
  it('does not start a second inference while one is still running', async () => {
    mockLoadCardModel.mockResolvedValue(createMockSession());

    let resolveInference:
      | ((
          value: CardInferenceResult | PromiseLike<CardInferenceResult>
        ) => void)
      | undefined;

    mockRunCardInference.mockImplementation(
      () =>
        new Promise<CardInferenceResult>((resolve) => {
          resolveInference = resolve;
        })
    );

    const { result, unmount } = renderHook(() =>
      useCardDetection(createVideoRef(), {
        modelUrl: '/models/id-card-detector-v1.onnx',
        detectionIntervalMs: 5,
      })
    );

    await waitFor(() => {
      expect(result.current.isModelReady).toBe(true);
    });

    act(() => {
      result.current.startDetection();
      result.current.startDetection();
    });

    await waitFor(() => {
      expect(mockRunCardInference).toHaveBeenCalledTimes(1);
    });

    await new Promise((resolve) => setTimeout(resolve, 30));

    expect(mockRunCardInference).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveInference?.({
        detected: false,
        confidence: 0,
        prediction: null,
      });
    });

    act(() => {
      result.current.stopDetection();
    });

    unmount();
  });

  it('reports a model-loading error', async () => {
    mockLoadCardModel.mockRejectedValue(new Error('Model file was not found.'));

    const { result } = renderHook(() =>
      useCardDetection(createVideoRef(), {
        modelUrl: '/missing-model.onnx',
      })
    );

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });

    expect(result.current.error).toBe('Model file was not found.');
    expect(result.current.isModelReady).toBe(false);
  });
});
