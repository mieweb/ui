/**
 * useDocumentDetection hook
 *
 * Provides real-time document detection for auto-capture functionality.
 * Uses pure Canvas API for blur detection (Laplacian variance) and
 * edge detection for document boundary recognition.
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
  /** Minimum focus score to consider in-focus (default: 50) */
  minFocusScore?: number;
  /** Minimum brightness (0-255, default: 40) */
  minBrightness?: number;
  /** Maximum brightness (0-255, default: 220) */
  maxBrightness?: number;
  /** Minimum document coverage percentage (default: 20) */
  minDocumentCoverage?: number;
  /** Maximum document coverage percentage (default: 90) */
  maxDocumentCoverage?: number;
  /** Stability duration required before capture (ms, default: 1500) */
  stabilityDuration?: number;
  /** Auto-capture countdown duration (seconds, default: 3) */
  captureCountdown?: number;
  /** Detection frame rate (fps, default: 10) */
  detectionFps?: number;
  /** Whether to enable auto-capture (default: true) */
  enableAutoCapture?: boolean;
}

const DEFAULT_CONFIG: Required<DetectionConfig> = {
  minFocusScore: 50,
  minBrightness: 40,
  maxBrightness: 220,
  minDocumentCoverage: 20,
  maxDocumentCoverage: 90,
  stabilityDuration: 1500,
  captureCountdown: 3,
  detectionFps: 10,
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
 */
function calculateLaplacianVariance(imageData: ImageData): number {
  const { data, width, height } = imageData;

  // Convert to grayscale and apply Laplacian kernel
  // Laplacian kernel: [0, 1, 0], [1, -4, 1], [0, 1, 0]
  let sum = 0;
  let sumSq = 0;
  let count = 0;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      // Get grayscale values for the 3x3 neighborhood
      const getGray = (px: number, py: number): number => {
        const idx = (py * width + px) * 4;
        return 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      };

      // Apply Laplacian kernel
      const laplacian =
        getGray(x, y - 1) +
        getGray(x - 1, y) +
        -4 * getGray(x, y) +
        getGray(x + 1, y) +
        getGray(x, y + 1);

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
  const pixelCount = data.length / 4;

  for (let i = 0; i < data.length; i += 4) {
    // Luminance formula
    sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }

  return sum / pixelCount;
}

/**
 * Simple edge detection using Sobel operator
 */
function detectEdges(imageData: ImageData): Uint8ClampedArray {
  const { data, width, height } = imageData;
  const edges = new Uint8ClampedArray(width * height);

  // Sobel kernels
  const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let gx = 0;
      let gy = 0;

      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = ((y + ky) * width + (x + kx)) * 4;
          const gray = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
          const ki = (ky + 1) * 3 + (kx + 1);
          gx += gray * sobelX[ki];
          gy += gray * sobelY[ki];
        }
      }

      const magnitude = Math.sqrt(gx * gx + gy * gy);
      edges[y * width + x] = magnitude > 50 ? 255 : 0;
    }
  }

  return edges;
}

/**
 * Find lines using a simplified Hough transform
 */
function findLines(
  edges: Uint8ClampedArray,
  width: number,
  height: number
): Array<{ rho: number; theta: number; votes: number }> {
  const thetaSteps = 180;
  const accumulator = new Map<string, number>();

  // Accumulate votes
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (edges[y * width + x] > 0) {
        // Check a subset of angles for performance
        for (let t = 0; t < thetaSteps; t += 2) {
          const theta = (t * Math.PI) / 180;
          const rho = Math.round(x * Math.cos(theta) + y * Math.sin(theta));
          const key = `${rho},${t}`;
          accumulator.set(key, (accumulator.get(key) || 0) + 1);
        }
      }
    }
  }

  // Find peaks
  const minVotes = Math.min(width, height) * 0.2;
  const lines: Array<{ rho: number; theta: number; votes: number }> = [];

  accumulator.forEach((votes, key) => {
    if (votes > minVotes) {
      const [rho, t] = key.split(',').map(Number);
      lines.push({ rho, theta: (t * Math.PI) / 180, votes });
    }
  });

  // Sort by votes and return top lines
  return lines.sort((a, b) => b.votes - a.votes).slice(0, 20);
}

/**
 * Find intersection point of two lines
 */
function lineIntersection(
  line1: { rho: number; theta: number },
  line2: { rho: number; theta: number }
): Point | null {
  const { rho: rho1, theta: theta1 } = line1;
  const { rho: rho2, theta: theta2 } = line2;

  const cos1 = Math.cos(theta1);
  const sin1 = Math.sin(theta1);
  const cos2 = Math.cos(theta2);
  const sin2 = Math.sin(theta2);

  const denom = cos1 * sin2 - cos2 * sin1;
  if (Math.abs(denom) < 0.001) return null;

  const x = (rho1 * sin2 - rho2 * sin1) / denom;
  const y = (rho2 * cos1 - rho1 * cos2) / denom;

  return { x, y };
}

/**
 * Detect rectangular document boundary
 */
function detectDocumentBoundary(
  edges: Uint8ClampedArray,
  width: number,
  height: number
): DocumentBoundary | null {
  const lines = findLines(edges, width, height);

  if (lines.length < 4) return null;

  // Separate horizontal and vertical lines
  const horizontalLines = lines.filter(
    (l) => Math.abs(l.theta - Math.PI / 2) < 0.3 || Math.abs(l.theta) < 0.3
  );
  const verticalLines = lines.filter(
    (l) => Math.abs(l.theta - Math.PI / 2) > 0.3 && Math.abs(l.theta) > 0.3
  );

  if (horizontalLines.length < 2 || verticalLines.length < 2) return null;

  // Find corner intersections
  const corners: Point[] = [];

  for (const hLine of horizontalLines.slice(0, 4)) {
    for (const vLine of verticalLines.slice(0, 4)) {
      const intersection = lineIntersection(hLine, vLine);
      if (
        intersection &&
        intersection.x >= 0 &&
        intersection.x <= width &&
        intersection.y >= 0 &&
        intersection.y <= height
      ) {
        corners.push(intersection);
      }
    }
  }

  if (corners.length < 4) return null;

  // Sort corners to form a rectangle (clockwise from top-left)
  const centerX = corners.reduce((sum, p) => sum + p.x, 0) / corners.length;
  const centerY = corners.reduce((sum, p) => sum + p.y, 0) / corners.length;

  const sortedCorners = corners
    .map((p) => ({
      point: p,
      angle: Math.atan2(p.y - centerY, p.x - centerX),
    }))
    .sort((a, b) => a.angle - b.angle)
    .map((item) => item.point);

  // Find the corner closest to top-left to start
  let topLeftIdx = 0;
  let minDist = Infinity;
  sortedCorners.forEach((p, i) => {
    const dist = p.x + p.y;
    if (dist < minDist) {
      minDist = dist;
      topLeftIdx = i;
    }
  });

  // Reorder starting from top-left
  const reordered = [
    ...sortedCorners.slice(topLeftIdx),
    ...sortedCorners.slice(0, topLeftIdx),
  ];

  if (reordered.length < 4) return null;

  return {
    topLeft: reordered[0],
    topRight: reordered[1],
    bottomRight: reordered[2],
    bottomLeft: reordered[3],
  };
}

/**
 * Calculate the area coverage of a boundary as a percentage
 */
function calculateCoverage(
  boundary: DocumentBoundary | null,
  width: number,
  height: number
): number {
  if (!boundary) return 0;

  const { topLeft, topRight, bottomRight, bottomLeft } = boundary;

  // Calculate quadrilateral area using Shoelace formula
  const area =
    0.5 *
    Math.abs(
      topLeft.x * (topRight.y - bottomLeft.y) +
        topRight.x * (bottomRight.y - topLeft.y) +
        bottomRight.x * (bottomLeft.y - topRight.y) +
        bottomLeft.x * (topLeft.y - bottomRight.y)
    );

  const totalArea = width * height;
  return (area / totalArea) * 100;
}

/**
 * Calculate distance between two points
 */
function distance(p1: Point, p2: Point): number {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

/**
 * Check if two boundaries are similar (for stability detection)
 */
function areBoundariesSimilar(
  b1: DocumentBoundary | null,
  b2: DocumentBoundary | null,
  threshold: number = 20
): boolean {
  if (!b1 && !b2) return true;
  if (!b1 || !b2) return false;

  return (
    distance(b1.topLeft, b2.topLeft) < threshold &&
    distance(b1.topRight, b2.topRight) < threshold &&
    distance(b1.bottomRight, b2.bottomRight) < threshold &&
    distance(b1.bottomLeft, b2.bottomLeft) < threshold
  );
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
  // Memoize config to prevent dependency changes on every render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const mergedConfig = useMemo(() => ({ ...DEFAULT_CONFIG, ...config }), [
    config.minFocusScore,
    config.minBrightness,
    config.maxBrightness,
    config.minDocumentCoverage,
    config.maxDocumentCoverage,
    config.stabilityDuration,
    config.captureCountdown,
    config.detectionFps,
    config.enableAutoCapture,
  ]);

  const [state, setState] = useState<DetectionState>(INITIAL_STATE);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastBoundaryRef = useRef<DocumentBoundary | null>(null);
  const stabilityStartRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isDetectingRef = useRef(false);

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
      // Video not ready, try again
      animationFrameRef.current = requestAnimationFrame(processFrame);
      return;
    }

    // Resize canvas to video dimensions (scaled down for performance)
    const scale = 0.25; // Process at 25% resolution for speed
    const width = Math.floor(video.videoWidth * scale);
    const height = Math.floor(video.videoHeight * scale);

    if (width === 0 || height === 0) {
      animationFrameRef.current = requestAnimationFrame(processFrame);
      return;
    }

    canvas.width = width;
    canvas.height = height;

    // Draw video frame to canvas
    ctx.drawImage(video, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height);

    // Calculate metrics
    const focusScore = calculateLaplacianVariance(imageData);
    const brightness = calculateBrightness(imageData);
    const edges = detectEdges(imageData);
    const boundary = detectDocumentBoundary(edges, width, height);

    // Scale boundary back to video dimensions
    const scaledBoundary = boundary
      ? {
          topLeft: { x: boundary.topLeft.x / scale, y: boundary.topLeft.y / scale },
          topRight: { x: boundary.topRight.x / scale, y: boundary.topRight.y / scale },
          bottomRight: { x: boundary.bottomRight.x / scale, y: boundary.bottomRight.y / scale },
          bottomLeft: { x: boundary.bottomLeft.x / scale, y: boundary.bottomLeft.y / scale },
        }
      : null;

    const documentCoverage = calculateCoverage(boundary, width, height);

    // Check stability
    const isBoundarySimilar = areBoundariesSimilar(boundary, lastBoundaryRef.current);
    const now = Date.now();

    if (isBoundarySimilar && boundary) {
      if (!stabilityStartRef.current) {
        stabilityStartRef.current = now;
      }
    } else {
      stabilityStartRef.current = boundary ? now : null;
    }

    lastBoundaryRef.current = boundary;

    const stabilityDuration = stabilityStartRef.current ? now - stabilityStartRef.current : 0;
    const isStable = stabilityDuration >= mergedConfig.stabilityDuration;

    // Calculate final metrics
    const isInFocus = focusScore >= mergedConfig.minFocusScore;
    const isBrightnessOk =
      brightness >= mergedConfig.minBrightness && brightness <= mergedConfig.maxBrightness;
    const isDocumentDetected = boundary !== null;
    const isCoverageOk =
      documentCoverage >= mergedConfig.minDocumentCoverage &&
      documentCoverage <= mergedConfig.maxDocumentCoverage;

    const isReadyForCapture =
      isInFocus && isBrightnessOk && isDocumentDetected && isCoverageOk && isStable;

    const metrics: DetectionMetrics = {
      focusScore: Math.round(focusScore),
      isInFocus,
      brightness: Math.round(brightness),
      isBrightnessOk,
      boundary: scaledBoundary,
      isDocumentDetected,
      documentCoverage: Math.round(documentCoverage),
      isStable,
      stabilityDuration,
    };

    setState((prev) => ({
      ...prev,
      metrics,
      isReadyForCapture,
    }));

    // Schedule next frame based on configured FPS
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
          // Clear interval and trigger capture
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
      // Cancel countdown if conditions no longer met
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
      setState((prev) => ({ ...prev, captureCountdown: 0 }));
    }
  }, [state.isReadyForCapture, mergedConfig.enableAutoCapture, mergedConfig.captureCountdown, onAutoCapture, state.captureCountdown]);

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
    lastBoundaryRef.current = null;
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
