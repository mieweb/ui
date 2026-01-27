/**
 * useDocumentDetection hook
 *
 * Provides real-time quality detection for auto-capture functionality.
 * Uses simple focus (blur) detection and stability tracking.
 * Designed to be forgiving and easy to use.
 */

/* eslint-disable no-undef */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * Point in 2D space
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Document boundary corners (clockwise from top-left)
 */
export interface DocumentBoundary {
  topLeft: Point;
  topRight: Point;
  bottomRight: Point;
  bottomLeft: Point;
}

/**
 * Detection quality metrics
 */
export interface DetectionMetrics {
  /** Focus score (Laplacian variance) - higher is sharper */
  focusScore: number;
  /** Whether the image is considered in-focus */
  isInFocus: boolean;
  /** Brightness score (0-255 average) */
  brightness: number;
  /** Whether brightness is acceptable */
  isBrightnessOk: boolean;
  /** Detected document boundary (if found) */
  boundary: DocumentBoundary | null;
  /** Whether a document boundary was detected */
  isDocumentDetected: boolean;
  /** Coverage percentage of detected document (0-100) */
  documentCoverage: number;
  /** Whether the document has been stable for sufficient time */
  isStable: boolean;
  /** Stability duration in milliseconds */
  stabilityDuration: number;
}

/**
 * Detection state
 */
export interface DetectionState {
  /** Whether detection is currently running */
  isDetecting: boolean;
  /** Current detection metrics */
  metrics: DetectionMetrics;
  /** Whether all conditions are met for auto-capture */
  isReadyForCapture: boolean;
  /** Auto-capture countdown (seconds remaining, 0 when not counting) */
  captureCountdown: number;
  /** Error message if detection failed */
  error: string | null;
}

/**
 * Detection configuration
 */
export interface DetectionConfig {
  /** Minimum focus score to consider in-focus (default: 15) */
  minFocusScore?: number;
  /** Minimum brightness (0-255, default: 30) */
  minBrightness?: number;
  /** Maximum brightness (0-255, default: 240) */
  maxBrightness?: number;
  /** Minimum document coverage percentage (default: 10) - not used in simplified mode */
  minDocumentCoverage?: number;
  /** Maximum document coverage percentage (default: 95) - not used in simplified mode */
  maxDocumentCoverage?: number;
  /** Stability duration required before capture (ms, default: 500) */
  stabilityDuration?: number;
  /** Auto-capture countdown duration (seconds, default: 2) */
  captureCountdown?: number;
  /** Detection frame rate (fps, default: 5) */
  detectionFps?: number;
  /** Whether to enable auto-capture (default: true) */
  enableAutoCapture?: boolean;
}

const DEFAULT_CONFIG: Required<DetectionConfig> = {
  minFocusScore: 15,
  minBrightness: 30,
  maxBrightness: 240,
  minDocumentCoverage: 10,
  maxDocumentCoverage: 95,
  stabilityDuration: 500,
  captureCountdown: 2,
  detectionFps: 5,
  enableAutoCapture: true,
};

const INITIAL_METRICS: DetectionMetrics = {
  focusScore: 0,
  isInFocus: false,
  brightness: 0,
  isBrightnessOk: false,
  boundary: null,
  isDocumentDetected: false,
  documentCoverage: 0,
  isStable: false,
  stabilityDuration: 0,
};

const INITIAL_STATE: DetectionState = {
  isDetecting: false,
  metrics: INITIAL_METRICS,
  isReadyForCapture: false,
  captureCountdown: 0,
  error: null,
};

/**
 * Calculate the Laplacian variance of an image for blur detection.
 * Higher variance = sharper image.
 * Simplified version that samples pixels for performance.
 */
function calculateLaplacianVariance(imageData: ImageData): number {
  const { data, width, height } = imageData;

  let sum = 0;
  let sumSq = 0;
  let count = 0;

  // Sample every 4th pixel for performance
  const step = 4;

  for (let y = step; y < height - step; y += step) {
    for (let x = step; x < width - step; x += step) {
      const getGray = (px: number, py: number): number => {
        const idx = (py * width + px) * 4;
        return 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      };

      // Simple Laplacian: center pixel minus average of neighbors
      const center = getGray(x, y);
      const neighbors =
        (getGray(x, y - step) +
          getGray(x - step, y) +
          getGray(x + step, y) +
          getGray(x, y + step)) /
        4;

      const laplacian = center - neighbors;
      sum += laplacian;
      sumSq += laplacian * laplacian;
      count++;
    }
  }

  if (count === 0) return 0;

  const mean = sum / count;
  const variance = sumSq / count - mean * mean;

  return Math.abs(variance);
}

/**
 * Calculate average brightness of an image
 */
function calculateBrightness(imageData: ImageData): number {
  const { data } = imageData;
  let sum = 0;
  let count = 0;

  // Sample every 16th pixel for speed
  for (let i = 0; i < data.length; i += 64) {
    sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    count++;
  }

  return count > 0 ? sum / count : 0;
}

/**
 * Calculate a fingerprint of the image for stability detection.
 * Returns an array of numeric values representing grid cell averages.
 * More sensitive than string hash for detecting small movements.
 */
function calculateFrameFingerprint(imageData: ImageData): number[] {
  const { data, width, height } = imageData;
  const gridSize = 8; // 8x8 grid for better sensitivity
  const cellWidth = Math.floor(width / gridSize);
  const cellHeight = Math.floor(height / gridSize);
  const values: number[] = [];

  for (let gy = 0; gy < gridSize; gy++) {
    for (let gx = 0; gx < gridSize; gx++) {
      let sum = 0;
      let count = 0;

      const startX = gx * cellWidth;
      const startY = gy * cellHeight;

      // Sample pixels in each cell
      for (let y = startY; y < startY + cellHeight; y += 4) {
        for (let x = startX; x < startX + cellWidth; x += 4) {
          const idx = (y * width + x) * 4;
          if (idx < data.length - 2) {
            // Use grayscale value
            sum += 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
            count++;
          }
        }
      }

      values.push(count > 0 ? sum / count : 0);
    }
  }

  return values;
}

/**
 * Compare two fingerprints and return similarity score (0-100).
 * 100 = identical, 0 = completely different
 */
function compareFingerprints(fp1: number[], fp2: number[]): number {
  if (fp1.length !== fp2.length || fp1.length === 0) return 0;

  let totalDiff = 0;
  for (let i = 0; i < fp1.length; i++) {
    // Calculate absolute difference, normalized by max possible (255)
    totalDiff += Math.abs(fp1[i] - fp2[i]) / 255;
  }

  // Average difference per cell, convert to similarity percentage
  const avgDiff = totalDiff / fp1.length;
  return Math.max(0, Math.min(100, (1 - avgDiff * 5) * 100)); // Scale: 20% avg diff = 0 similarity
}

/**
 * Hook for document detection with auto-capture
 */
export function useDocumentDetection(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  config: DetectionConfig = {},
  onAutoCapture?: () => void
): DetectionState & {
  startDetection: () => void;
  stopDetection: () => void;
  resetDetection: () => void;
} {
  const mergedConfig = useMemo(
    () => ({ ...DEFAULT_CONFIG, ...config }),
    // Intentionally depend on individual properties to avoid unnecessary re-renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      config.minFocusScore,
      config.minBrightness,
      config.maxBrightness,
      config.minDocumentCoverage,
      config.maxDocumentCoverage,
      config.stabilityDuration,
      config.captureCountdown,
      config.detectionFps,
      config.enableAutoCapture,
    ]
  );

  const [state, setState] = useState<DetectionState>(INITIAL_STATE);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastFingerprintRef = useRef<number[]>([]);
  const stabilityStartRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isDetectingRef = useRef(false);

  // Stability threshold - how similar frames need to be (0-100)
  const STABILITY_THRESHOLD = 85;

  // Initialize canvas
  useEffect(() => {
    canvasRef.current = document.createElement('canvas');
    ctxRef.current = canvasRef.current.getContext('2d', {
      willReadFrequently: true,
    });

    return () => {
      canvasRef.current = null;
      ctxRef.current = null;
    };
  }, []);

  // Process a single video frame
  const processFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;

    if (!video || !canvas || !ctx || !isDetectingRef.current) {
      return;
    }

    if (video.readyState < 2) {
      animationFrameRef.current = requestAnimationFrame(processFrame);
      return;
    }

    // Process at low resolution for speed
    const scale = 0.15;
    const width = Math.floor(video.videoWidth * scale);
    const height = Math.floor(video.videoHeight * scale);

    if (width === 0 || height === 0) {
      animationFrameRef.current = requestAnimationFrame(processFrame);
      return;
    }

    canvas.width = width;
    canvas.height = height;

    ctx.drawImage(video, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height);

    // Calculate simple metrics
    const focusScore = calculateLaplacianVariance(imageData);
    const brightness = calculateBrightness(imageData);
    const fingerprint = calculateFrameFingerprint(imageData);

    // Check stability - compare current frame to previous
    const now = Date.now();
    const similarity = compareFingerprints(fingerprint, lastFingerprintRef.current);
    const isSimilarFrame = similarity >= STABILITY_THRESHOLD;

    if (isSimilarFrame && lastFingerprintRef.current.length > 0) {
      if (!stabilityStartRef.current) {
        stabilityStartRef.current = now;
      }
    } else {
      stabilityStartRef.current = now;
    }

    lastFingerprintRef.current = fingerprint;

    const stabilityDuration = stabilityStartRef.current
      ? now - stabilityStartRef.current
      : 0;
    const isStable = stabilityDuration >= mergedConfig.stabilityDuration;

    // Simple quality checks - very forgiving
    const isInFocus = focusScore >= mergedConfig.minFocusScore;
    const isBrightnessOk =
      brightness >= mergedConfig.minBrightness &&
      brightness <= mergedConfig.maxBrightness;

    // Always consider document detected if we have reasonable focus and brightness
    // This removes the unreliable boundary detection
    const isDocumentDetected = isInFocus && isBrightnessOk;

    const isReadyForCapture = isInFocus && isBrightnessOk && isStable;

    const metrics: DetectionMetrics = {
      focusScore: Math.round(focusScore),
      isInFocus,
      brightness: Math.round(brightness),
      isBrightnessOk,
      boundary: null, // No longer doing boundary detection
      isDocumentDetected,
      documentCoverage: isDocumentDetected ? 50 : 0, // Dummy value
      isStable,
      stabilityDuration,
    };

    setState((prev) => ({
      ...prev,
      metrics,
      isReadyForCapture,
    }));

    // Schedule next frame
    const frameDelay = 1000 / mergedConfig.detectionFps;
    setTimeout(() => {
      if (isDetectingRef.current) {
        animationFrameRef.current = requestAnimationFrame(processFrame);
      }
    }, frameDelay);
  }, [videoRef, mergedConfig]);

  // Start countdown when ready for capture
  useEffect(() => {
    if (
      state.isReadyForCapture &&
      mergedConfig.enableAutoCapture &&
      state.captureCountdown === 0 &&
      !countdownIntervalRef.current
    ) {
      let countdown = mergedConfig.captureCountdown;

      setState((prev) => ({ ...prev, captureCountdown: countdown }));

      countdownIntervalRef.current = setInterval(() => {
        countdown -= 1;

        if (countdown <= 0) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          setState((prev) => ({ ...prev, captureCountdown: 0 }));
          onAutoCapture?.();
        } else {
          setState((prev) => ({ ...prev, captureCountdown: countdown }));
        }
      }, 1000);
    } else if (!state.isReadyForCapture && countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
      setState((prev) => ({ ...prev, captureCountdown: 0 }));
    }
  }, [
    state.isReadyForCapture,
    mergedConfig.enableAutoCapture,
    mergedConfig.captureCountdown,
    onAutoCapture,
    state.captureCountdown,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  const startDetection = useCallback(() => {
    isDetectingRef.current = true;
    setState((prev) => ({ ...prev, isDetecting: true, error: null }));
    processFrame();
  }, [processFrame]);

  const stopDetection = useCallback(() => {
    isDetectingRef.current = false;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setState((prev) => ({ ...prev, isDetecting: false }));
  }, []);

  const resetDetection = useCallback(() => {
    stopDetection();
    lastFingerprintRef.current = [];
    stabilityStartRef.current = null;
    setState(INITIAL_STATE);
  }, [stopDetection]);

  return {
    ...state,
    startDetection,
    stopDetection,
    resetDetection,
  };
}

export default useDocumentDetection;
