import * as React from 'react';
import type { InferenceSession } from 'onnxruntime-web';

import { loadCardModel } from './loadCardModel';
import { runCardInference } from './runCardInference';

export type CardDetectionStatus =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'searching'
  | 'detected'
  | 'error';

export interface UseCardDetectionOptions {
  enabled?: boolean;
  modelUrl: string;
  wasmPaths?: string;
  confidenceThreshold?: number;
  inputSize?: number;
  iouThreshold?: number;
  detectionIntervalMs?: number;
  stableDetectionsRequired?: number;
  allowedMisses?: number;
}

export interface UseCardDetectionReturn {
  status: CardDetectionStatus;
  isModelReady: boolean;
  isDetecting: boolean;
  isCardDetected: boolean;
  confidence: number;
  consecutiveDetections: number;
  error: string | null;
  startDetection: () => void;
  stopDetection: () => void;
  resetDetection: () => void;
}

const DEFAULT_CONFIDENCE_THRESHOLD = 0.7;
const DEFAULT_INPUT_SIZE = 640;
const DEFAULT_IOU_THRESHOLD = 0.45;
const DEFAULT_DETECTION_INTERVAL_MS = 800;
const DEFAULT_STABLE_DETECTIONS_REQUIRED = 2;
const DEFAULT_ALLOWED_MISSES = 1;

export function useCardDetection(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  {
    enabled = true,
    modelUrl,
    wasmPaths,
    confidenceThreshold = DEFAULT_CONFIDENCE_THRESHOLD,
    inputSize = DEFAULT_INPUT_SIZE,
    iouThreshold = DEFAULT_IOU_THRESHOLD,
    detectionIntervalMs = DEFAULT_DETECTION_INTERVAL_MS,
    stableDetectionsRequired = DEFAULT_STABLE_DETECTIONS_REQUIRED,
    allowedMisses = DEFAULT_ALLOWED_MISSES,
  }: UseCardDetectionOptions
): UseCardDetectionReturn {
  const [status, setStatus] = React.useState<CardDetectionStatus>('idle');
  const [isModelReady, setIsModelReady] = React.useState(false);
  const [isDetecting, setIsDetecting] = React.useState(false);
  const [isCardDetected, setIsCardDetected] = React.useState(false);
  const [confidence, setConfidence] = React.useState(0);
  const [consecutiveDetections, setConsecutiveDetections] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);

  const sessionRef = React.useRef<InferenceSession | null>(null);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDetectingRef = React.useRef(false);
  const isInferenceRunningRef = React.useRef(false);
  const consecutiveDetectionsRef = React.useRef(0);
  const missedDetectionsRef = React.useRef(0);
  const mountedRef = React.useRef(true);
  const processFrameRef = React.useRef<(() => Promise<void>) | null>(null);
  const preprocessingCanvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const clearScheduledDetection = React.useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const scheduleNextDetection = React.useCallback(() => {
    clearScheduledDetection();

    if (!isDetectingRef.current) {
      return;
    }

    timerRef.current = setTimeout(() => {
      void processFrameRef.current?.();
    }, detectionIntervalMs);
  }, [clearScheduledDetection, detectionIntervalMs]);

  const processFrame = React.useCallback(async () => {
    if (!isDetectingRef.current) {
      return;
    }

    const session = sessionRef.current;
    const video = videoRef.current;

    if (
      !session ||
      !video ||
      video.readyState < 2 ||
      video.videoWidth <= 0 ||
      video.videoHeight <= 0
    ) {
      scheduleNextDetection();
      return;
    }
    if (!preprocessingCanvasRef.current) {
      preprocessingCanvasRef.current = document.createElement('canvas');
    }
    if (isInferenceRunningRef.current) {
      return;
    }

    isInferenceRunningRef.current = true;

    try {
      const result = await runCardInference(
        session,
        video,
        video.videoWidth,
        video.videoHeight,
        {
          confidenceThreshold,
          inputSize,
          iouThreshold,
          preprocessingCanvas: preprocessingCanvasRef.current,
        }
      );

      if (!mountedRef.current || !isDetectingRef.current) {
        return;
      }

      if (result.detected) {
        missedDetectionsRef.current = 0;
        consecutiveDetectionsRef.current += 1;

        const stable =
          consecutiveDetectionsRef.current >= stableDetectionsRequired;

        setConfidence(result.confidence);
        setConsecutiveDetections(consecutiveDetectionsRef.current);
        setIsCardDetected(stable);
        setStatus(stable ? 'detected' : 'searching');
      } else {
        missedDetectionsRef.current += 1;

        if (missedDetectionsRef.current > allowedMisses) {
          consecutiveDetectionsRef.current = 0;

          setConfidence(0);
          setConsecutiveDetections(0);
          setIsCardDetected(false);
          setStatus('searching');
        }
      }
    } catch (inferenceError) {
      if (!mountedRef.current) {
        return;
      }

      isDetectingRef.current = false;
      clearScheduledDetection();

      setIsDetecting(false);
      setIsCardDetected(false);
      setStatus('error');
      setError(
        inferenceError instanceof Error
          ? inferenceError.message
          : 'Card detection failed.'
      );
    } finally {
      isInferenceRunningRef.current = false;

      if (isDetectingRef.current) {
        scheduleNextDetection();
      }
    }
  }, [
    allowedMisses,
    clearScheduledDetection,
    confidenceThreshold,
    inputSize,
    iouThreshold,
    scheduleNextDetection,
    stableDetectionsRequired,
    videoRef,
  ]);

  React.useEffect(() => {
    processFrameRef.current = processFrame;
  }, [processFrame]);

  React.useEffect(() => {
    if (!enabled) {
      setStatus('idle');
      setIsModelReady(false);
      setError(null);
      return;
    }
    let cancelled = false;
    let loadedSession: InferenceSession | null = null;

    setStatus('loading');
    setIsModelReady(false);
    setError(null);
    void loadCardModel(modelUrl, {
      wasmPaths,
    })
      .then((session) => {
        loadedSession = session;

        if (cancelled) {
          void session.release();
          return;
        }

        sessionRef.current = session;
        setIsModelReady(true);
        setStatus(isDetectingRef.current ? 'searching' : 'ready');

        if (isDetectingRef.current) {
          void processFrameRef.current?.();
        }
      })
      .catch((modelError) => {
        if (cancelled) {
          return;
        }

        isDetectingRef.current = false;
        setIsDetecting(false);
        setStatus('error');
        setError(
          modelError instanceof Error
            ? modelError.message
            : 'Unable to load the card-detection model.'
        );
      });

    return () => {
      cancelled = true;

      if (sessionRef.current === loadedSession) {
        sessionRef.current = null;
      }

      if (loadedSession) {
        void loadedSession.release();
      }
    };
  }, [enabled, modelUrl, wasmPaths]);

  React.useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      isDetectingRef.current = false;
      clearScheduledDetection();
    };
  }, [clearScheduledDetection]);

  const startDetection = React.useCallback(() => {
    if (!enabled) {
      return;
    }
    isDetectingRef.current = true;
    setIsDetecting(true);
    setError(null);
    setStatus(sessionRef.current ? 'searching' : 'loading');

    if (sessionRef.current) {
      void processFrameRef.current?.();
    }
  }, [enabled]);

  const stopDetection = React.useCallback(() => {
    isDetectingRef.current = false;
    clearScheduledDetection();

    consecutiveDetectionsRef.current = 0;
    missedDetectionsRef.current = 0;

    setIsDetecting(false);
    setIsCardDetected(false);
    setConfidence(0);
    setConsecutiveDetections(0);
    setStatus(sessionRef.current ? 'ready' : 'idle');
  }, [clearScheduledDetection]);

  const resetDetection = React.useCallback(() => {
    stopDetection();
    setError(null);
  }, [stopDetection]);

  return {
    status,
    isModelReady,
    isDetecting,
    isCardDetected,
    confidence,
    consecutiveDetections,
    error,
    startDetection,
    stopDetection,
    resetDetection,
  };
}
