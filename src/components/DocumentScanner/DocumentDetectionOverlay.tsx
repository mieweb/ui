/**
 * DocumentDetectionOverlay component
 *
 * Displays visual feedback for document detection status including:
 * - Focus/blur indicator
 * - Brightness indicator
 * - Stability progress bar
 * - Auto-capture countdown
 */

import React from 'react';
import type { DetectionMetrics } from './useDocumentDetection';

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
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium ${isOk ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'} `}
    >
      <span
        className={`h-2 w-2 rounded-full ${isOk ? 'bg-green-400' : 'bg-red-400'}`}
      />
      <span>{label}</span>
      {value !== undefined && <span className="opacity-70">({value})</span>}
    </div>
  );
}

/**
 * Countdown display
 */
function CountdownDisplay({ seconds }: { seconds: number }) {
  if (seconds <= 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div className="relative">
        {/* Pulsing background */}
        <div className="absolute inset-0 animate-ping rounded-full bg-green-500 opacity-25" />
        {/* Main countdown circle */}
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-green-500/90">
          <span className="text-4xl font-bold text-white">{seconds}</span>
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
      <div className="mb-1 flex justify-between text-xs text-white/70">
        <span>Stability</span>
        <span>{isComplete ? 'Stable!' : 'Hold steady...'}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/20">
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
  videoDimensions: _videoDimensions,
  showDetailedMetrics = false,
}: DocumentDetectionOverlayProps) {
  const {
    focusScore,
    isInFocus,
    brightness,
    isBrightnessOk,
    isDocumentDetected,
    isStable,
    stabilityDuration,
  } = metrics;

  // Determine border color based on state
  const borderColor = isReadyForCapture
    ? 'border-green-500'
    : isDocumentDetected
      ? 'border-yellow-400'
      : 'border-white/40';

  return (
    <div className="pointer-events-none absolute inset-0">
      {/* Simple frame guide - shows ready state through color */}
      <div
        className={`absolute inset-4 rounded-lg border-4 transition-colors duration-300 ${borderColor}`}
      >
        {/* Corner accents */}
        <div className="absolute -top-1 -left-1 h-6 w-6 rounded-tl border-t-4 border-l-4 border-current" />
        <div className="absolute -top-1 -right-1 h-6 w-6 rounded-tr border-t-4 border-r-4 border-current" />
        <div className="absolute -bottom-1 -left-1 h-6 w-6 rounded-bl border-b-4 border-l-4 border-current" />
        <div className="absolute -right-1 -bottom-1 h-6 w-6 rounded-br border-r-4 border-b-4 border-current" />
      </div>

      {/* Countdown display */}
      <CountdownDisplay seconds={captureCountdown} />

      {/* Status indicators */}
      <div className="absolute top-3 right-3 left-3">
        {/* Main status message */}
        <div
          className={`mb-2 rounded-lg px-4 py-2 text-center backdrop-blur-sm ${
            isReadyForCapture
              ? 'bg-green-500/80 text-white'
              : 'bg-black/60 text-white'
          } `}
        >
          {isReadyForCapture ? (
            <span className="font-medium">
              {captureCountdown > 0
                ? `Capturing in ${captureCountdown}...`
                : '✓ Ready to capture!'}
            </span>
          ) : (
            <span>
              {!isInFocus
                ? '🔍 Hold camera steady'
                : !isBrightnessOk
                  ? brightness < 40
                    ? '💡 Need more light'
                    : '💡 Too bright'
                  : !isStable
                    ? '✋ Hold steady...'
                    : '📄 Position document in frame'}
            </span>
          )}
        </div>

        {/* Stability progress */}
        {isDocumentDetected && !isStable && (
          <div className="px-2">
            <StabilityBar
              stabilityDuration={stabilityDuration}
              targetDuration={500}
            />
          </div>
        )}
      </div>

      {/* Detailed metrics (bottom) */}
      {showDetailedMetrics && (
        <div className="absolute right-3 bottom-3 left-3">
          <div className="flex flex-wrap justify-center gap-2 rounded-lg bg-black/60 p-2 backdrop-blur-sm">
            <StatusPill label="Focus" isOk={isInFocus} value={focusScore} />
            <StatusPill
              label="Brightness"
              isOk={isBrightnessOk}
              value={brightness}
            />
            <StatusPill label="Stable" isOk={isStable} />
          </div>
        </div>
      )}
    </div>
  );
}

export default DocumentDetectionOverlay;
