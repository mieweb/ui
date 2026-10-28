import * as React from 'react';
import type { TimelineView } from './model';
import type { WaveformPeaks } from './peaks';

const BAR_PITCH = 3;
const BAR_WIDTH = 2;

/** Bars for the visible window; the played part is drawn at full strength. */
export function Waveform({
  peaks,
  view,
  currentTime,
}: {
  peaks: WaveformPeaks | null;
  view: TimelineView;
  currentTime: number;
}) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [width, setWidth] = React.useState(0);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(() =>
      setWidth(canvas.clientWidth || 0)
    );
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || width === 0) return;
    const height = canvas.clientHeight;
    const dpr = window.devicePixelRatio || 1;
    // Redrawn every frame while playing, so the buffer is reallocated only when its (integer) size changes.
    const bufferWidth = Math.round(width * dpr);
    const bufferHeight = Math.round(height * dpr);
    if (canvas.width !== bufferWidth || canvas.height !== bufferHeight) {
      canvas.width = bufferWidth;
      canvas.height = bufferHeight;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    if (!peaks || view.span <= 0) return;

    ctx.fillStyle = getComputedStyle(canvas).color;
    const secondsPerPx = view.span / width;
    for (let x = 0; x < width; x += BAR_PITCH) {
      const t0 = view.start + x * secondsPerPx;
      const from = Math.floor(t0 * peaks.perSecond);
      const to = Math.max(
        from + 1,
        Math.ceil((t0 + BAR_PITCH * secondsPerPx) * peaks.perSecond)
      );
      let peak = 0;
      for (let i = from; i < to && i < peaks.data.length; i++)
        if (peaks.data[i] > peak) peak = peaks.data[i];
      const bar = Math.max(1, peak * height);
      ctx.globalAlpha = t0 < currentTime ? 1 : 0.35;
      ctx.fillRect(x, (height - bar) / 2, BAR_WIDTH, bar);
    }
  }, [peaks, view, currentTime, width]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="text-primary-600 dark:text-primary-400 block h-14 w-full"
    />
  );
}
