/**
 * DocumentDetectionOverlay component
 *
 * Displays visual feedback for document detection status including:
 * - Document boundary outline (green when ready, yellow when detecting)
 * - Focus/blur indicator
 * - Brightness indicator
 * - Stability progress bar
 * - Auto-capture countdown
 */

import React from 'react';
import type { DetectionMetrics, DocumentBoundary } from './useDocumentDetection';

export interface DocumentDetectionOverlayProps {
  /** Detection metrics from useDocumentDetection */
  metrics: DetectionMetrics;
  /** Whether all conditions are met for capture */
  isReadyForCapture: boolean;
  /** Countdown value (seconds remaining, 0 when not counting) */
  captureCountdown: number;
  /** Video element dimensions */
  videoDimensions: { width: number; height: number };
  /** Whether to show detailed metrics (debug mode) */
  showDetailedMetrics?: boolean;
}

/**
 * Draw document boundary as SVG polygon
 */
function BoundaryOverlay({
  boundary,
  isReady,
  videoDimensions,
}: {
  boundary: DocumentBoundary | null;
  isReady: boolean;
  videoDimensions: { width: number; height: number };
}) {
  if (!boundary || videoDimensions.width === 0) return null;

  const { topLeft, topRight, bottomRight, bottomLeft } = boundary;

  const points = `${topLeft.x},${topLeft.y} ${topRight.x},${topRight.y} ${bottomRight.x},${bottomRight.y} ${bottomLeft.x},${bottomLeft.y}`;

  const strokeColor = isReady ? '#22c55e' : '#eab308'; // green-500 or yellow-500
  const fillColor = isReady ? 'rgba(34, 197, 94, 0.1)' : 'rgba(234, 179, 8, 0.1)';

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      viewBox={`0 0 ${videoDimensions.width} ${videoDimensions.height}`}
      preserveAspectRatio="none"
      style={{ width: '100%', height: '100%' }}
    >
      <polygon
        points={points}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* Corner indicators */}
      {[topLeft, topRight, bottomRight, bottomLeft].map((corner, i) => (
        <circle key={i} cx={corner.x} cy={corner.y} r="8" fill={strokeColor} />
      ))}
    </svg>
  );
}

/**
 * Status indicator pill
 */
function StatusPill({
  label,
  isOk,
  value,
}: {
  label: string;
  isOk: boolean;
  value?: string | number;
}) {
  return (
    <div
      className={`
        inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium
        ${isOk ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}
      `}
    >
      <span
        className={`w-2 h-2 rounded-full ${isOk ? 'bg-green-400' : 'bg-red-400'}`}
      />
      <span>{label}</span>
      {value !== undefined && (
        <span className="opacity-70">({value})</span>
      )}
    </div>
  );
}

/**
 * Countdown display
 */
function CountdownDisplay({ seconds }: { seconds: number }) {
  if (seconds <= 0) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="relative">
        {/* Pulsing background */}
        <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-25" />
        {/* Main countdown circle */}
        <div className="relative w-24 h-24 bg-green-500/90 rounded-full flex items-center justify-center">
          <span className="text-white text-4xl font-bold">{seconds}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Stability progress bar
 */
function StabilityBar({
  stabilityDuration,
  targetDuration,
}: {
  stabilityDuration: number;
  targetDuration: number;
}) {
  const progress = Math.min((stabilityDuration / targetDuration) * 100, 100);
  const isComplete = progress >= 100;

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-white/70 mb-1">
        <span>Stability</span>
        <span>{isComplete ? 'Stable!' : 'Hold steady...'}</span>
      </div>
      <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-100 ${
            isComplete ? 'bg-green-400' : 'bg-yellow-400'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Main overlay component
 */
export function DocumentDetectionOverlay({
  metrics,
  isReadyForCapture,
  captureCountdown,
  videoDimensions,
  showDetailedMetrics = false,
}: DocumentDetectionOverlayProps) {
  const {
    focusScore,
    isInFocus,
    brightness,
    isBrightnessOk,
    boundary,
    isDocumentDetected,
    documentCoverage,
    isStable,
    stabilityDuration,
  } = metrics;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Document boundary overlay */}
      <BoundaryOverlay
        boundary={boundary}
        isReady={isReadyForCapture}
        videoDimensions={videoDimensions}
      />

      {/* Countdown display */}
      <CountdownDisplay seconds={captureCountdown} />

      {/* Status indicators */}
      <div className="absolute top-3 left-3 right-3">
        {/* Main status message */}
        <div
          className={`
            text-center py-2 px-4 rounded-lg backdrop-blur-sm mb-2
            ${
              isReadyForCapture
                ? 'bg-green-500/80 text-white'
                : 'bg-black/60 text-white'
            }
          `}
        >
          {isReadyForCapture ? (
            <span className="font-medium">
              {captureCountdown > 0
                ? `Capturing in ${captureCountdown}...`
                : '✓ Ready to capture!'}
            </span>
          ) : (
            <span>
              {!isDocumentDetected
                ? '📄 Position document in frame'
                : !isInFocus
                  ? '🔍 Hold camera steady for focus'
                  : !isBrightnessOk
                    ? brightness < 40
                      ? '💡 Need more light'
                      : '💡 Too much light'
                    : !isStable
                      ? '✋ Hold steady...'
                      : documentCoverage < 20
                        ? '↔️ Move closer to document'
                        : '↔️ Move further from document'}
            </span>
          )}
        </div>

        {/* Stability progress */}
        {isDocumentDetected && !isStable && (
          <div className="px-2">
            <StabilityBar stabilityDuration={stabilityDuration} targetDuration={800} />
          </div>
        )}
      </div>

      {/* Detailed metrics (bottom) */}
      {showDetailedMetrics && (
        <div className="absolute bottom-3 left-3 right-3">
          <div className="flex flex-wrap gap-2 justify-center bg-black/60 backdrop-blur-sm rounded-lg p-2">
            <StatusPill label="Focus" isOk={isInFocus} value={focusScore} />
            <StatusPill
              label="Brightness"
              isOk={isBrightnessOk}
              value={brightness}
            />
            <StatusPill
              label="Document"
              isOk={isDocumentDetected}
              value={isDocumentDetected ? `${documentCoverage}%` : 'Not found'}
            />
            <StatusPill label="Stable" isOk={isStable} />
          </div>
        </div>
      )}

      {/* Edge guides when no document detected */}
      {!isDocumentDetected && (
        <div className="absolute inset-8 border-2 border-dashed border-white/30 rounded-lg pointer-events-none">
          {/* Corner guides */}
          <div className="absolute -top-0.5 -left-0.5 w-8 h-8 border-l-4 border-t-4 border-white/60 rounded-tl-lg" />
          <div className="absolute -top-0.5 -right-0.5 w-8 h-8 border-r-4 border-t-4 border-white/60 rounded-tr-lg" />
          <div className="absolute -bottom-0.5 -left-0.5 w-8 h-8 border-l-4 border-b-4 border-white/60 rounded-bl-lg" />
          <div className="absolute -bottom-0.5 -right-0.5 w-8 h-8 border-r-4 border-b-4 border-white/60 rounded-br-lg" />
        </div>
      )}
    </div>
  );
}

export default DocumentDetectionOverlay;
