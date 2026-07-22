import * as React from 'react';
import { cn } from '../../utils/cn';

// ============================================================================
// Types
// ============================================================================

export interface LiveWaveformProps {
  /** Active capture stream to visualize; `null` renders an empty canvas. */
  stream: MediaStream | null;
  /** Whether the visualizer should animate (false clears the canvas). */
  active: boolean;
  /** Canvas height in pixels. */
  height?: number;
  /**
   * Bar color. Defaults to the theme's `--color-primary-500` (falling back to
   * `#27aae1`), so it adapts to the active brand without configuration.
   */
  color?: string;
  /** Number of bars to render across the width. */
  bars?: number;
  /** Additional class names for the canvas. */
  className?: string;
}

// ============================================================================
// Helpers
// ============================================================================

/** Resolve the bar color, preferring the explicit prop then the theme token. */
function resolveBarColor(color?: string): string {
  if (color) return color;
  if (typeof window === 'undefined') return '#27aae1';
  const themeColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--color-primary-500')
    .trim();
  return themeColor || '#27aae1';
}

// ============================================================================
// LiveWaveform
// ============================================================================

/**
 * LiveWaveform — real-time volume visualizer for an active capture stream.
 *
 * Connects a Web Audio `AnalyserNode` to the provided `MediaStream` and draws
 * evenly-spaced, vertically-centered rounded bars that fill the width of their
 * container. It owns no microphone of its own, so it can safely share a
 * recorder's stream without contending for the device.
 *
 * @example
 * ```tsx
 * <LiveWaveform stream={captureStream} active={isRecording} height={56} />
 * ```
 */
export const LiveWaveform: React.FC<LiveWaveformProps> = ({
  stream,
  active,
  height = 64,
  color,
  bars = 48,
  className,
}) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const clear = () => {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    };

    if (!stream || !active || stream.getAudioTracks().length === 0) {
      clear();
      return;
    }

    const fillColor = resolveBarColor(color);
    const audioCtx = new AudioContext();
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;
    source.connect(analyser);

    const bufferLength = analyser.frequencyBinCount;
    const data = new Uint8Array(bufferLength);
    let raf = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth || 300;
      const h = canvas.clientHeight || height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    };
    resize();
    const ro =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
    ro?.observe(canvas);

    const draw = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      analyser.getByteFrequencyData(data);

      const gap = 2;
      const barWidth = Math.max(2, (w - gap * (bars - 1)) / bars);
      const mid = h / 2;
      // Sample the voice-relevant low-to-mid bins spread across the bar count.
      const usableBins = Math.max(1, Math.floor(bufferLength * 0.7));

      ctx.fillStyle = fillColor;
      for (let i = 0; i < bars; i += 1) {
        const bin = Math.floor((i / bars) * usableBins);
        const v = data[bin] / 255;
        const barHeight = Math.max(barWidth, v * h * 0.9);
        const x = i * (barWidth + gap);
        const y = mid - barHeight / 2;
        if (typeof ctx.roundRect === 'function') {
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, barWidth / 2);
          ctx.fill();
        } else {
          ctx.fillRect(x, y, barWidth, barHeight);
        }
      }

      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      ro?.disconnect();
      source.disconnect();
      void audioCtx.close();
    };
  }, [stream, active, color, bars, height]);

  return (
    <canvas
      ref={canvasRef}
      data-slot="live-waveform"
      className={cn('h-full w-full', className)}
      style={{ height }}
      aria-hidden="true"
    />
  );
};
