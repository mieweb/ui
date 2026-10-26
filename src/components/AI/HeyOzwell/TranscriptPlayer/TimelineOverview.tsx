import { ChevronLeft, ChevronRight } from 'lucide-react';
import * as React from 'react';
import type { TranscriptPlayerLabels } from './labels';
import {
  clampView,
  formatClock,
  ticksFor,
  type LaneSegment,
  type PlayerSpeaker,
  type TimelineView,
} from './model';
import { timeAtPointer, viewFraction } from './SpeakerLanes';

export interface TimelineOverviewProps {
  speakers: readonly PlayerSpeaker[];
  segments: readonly LaneSegment[];
  duration: number;
  view: TimelineView;
  currentTime: number;
  onViewChange: (view: TimelineView) => void;
  labels: TranscriptPlayerLabels;
}

const HEIGHT = 28;

/**
 * The whole recording in miniature with the visible window as a draggable box. Click elsewhere to
 * centre the window there; arrow keys or the chevrons pan it.
 */
export function TimelineOverview({
  speakers,
  segments,
  duration,
  view,
  currentTime,
  onViewChange,
  labels,
}: TimelineOverviewProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const trackRef = React.useRef<HTMLDivElement>(null);
  const dragOffset = React.useRef<number | null>(null);
  const [width, setWidth] = React.useState(0);
  const whole: TimelineView = { start: 0, span: duration };

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
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = HEIGHT * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, HEIGHT);
    if (duration <= 0 || speakers.length === 0) return;
    const row = Math.min(6, HEIGHT / speakers.length);
    const top = (HEIGHT - row * speakers.length) / 2;
    speakers.forEach((speaker, i) => {
      ctx.fillStyle = speaker.color;
      for (const s of segments) {
        if (s.speakerId !== speaker.id) continue;
        const x = (s.start / duration) * width;
        const w = Math.max(1, ((s.end - s.start) / duration) * width);
        ctx.fillRect(x, top + i * row + 1, w, row - 1);
      }
    });
  }, [speakers, segments, duration, width]);

  const pan = (delta: number) =>
    onViewChange(clampView({ ...view, start: view.start + delta }, duration));

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!trackRef.current) return;
    const t = timeAtPointer(event.clientX, trackRef.current, whole);
    const insideWindow = t >= view.start && t <= view.start + view.span;
    dragOffset.current = insideWindow ? t - view.start : view.span / 2;
    onViewChange(
      clampView({ ...view, start: t - dragOffset.current }, duration)
    );
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };
  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragOffset.current === null || !trackRef.current) return;
    const t = timeAtPointer(event.clientX, trackRef.current, whole);
    onViewChange(
      clampView({ ...view, start: t - dragOffset.current }, duration)
    );
  };
  const endDrag = () => {
    dragOffset.current = null;
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const step: Record<string, number> = {
      ArrowLeft: -view.span / 10,
      ArrowRight: view.span / 10,
      PageUp: -view.span,
      PageDown: view.span,
      Home: -duration,
      End: duration,
    };
    if (!(event.key in step)) return;
    event.preventDefault();
    pan(step[event.key]);
  };

  const left = viewFraction(view.start, whole);
  const right = viewFraction(view.start + view.span, whole);

  return (
    <div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label={labels.earlier}
          disabled={view.start <= 0}
          onClick={() => pan(-view.span)}
          className="text-muted-foreground hover:text-foreground focus-visible:ring-ring rounded p-0.5 focus-visible:ring-2 focus-visible:outline-none disabled:opacity-40"
        >
          <ChevronLeft aria-hidden="true" className="h-4 w-4" />
        </button>
        <div
          ref={trackRef}
          className="bg-muted/60 border-border relative flex-1 cursor-pointer touch-none rounded border"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <canvas
            ref={canvasRef}
            aria-hidden="true"
            className="block w-full"
            style={{ height: HEIGHT }}
          />
          <div
            role="slider"
            tabIndex={0}
            aria-label={labels.visibleWindow}
            aria-valuemin={0}
            aria-valuemax={Math.round(duration)}
            aria-valuenow={Math.round(view.start)}
            aria-valuetext={labels.windowValue(
              formatClock(view.start),
              formatClock(view.start + view.span)
            )}
            onKeyDown={onKeyDown}
            className="border-primary-500 bg-primary-500/15 focus-visible:ring-ring absolute inset-y-0 cursor-grab rounded border focus-visible:ring-2 focus-visible:outline-none active:cursor-grabbing"
            style={{
              left: `${left * 100}%`,
              width: `${Math.max(0.5, (right - left) * 100)}%`,
            }}
          />
          <span
            aria-hidden="true"
            className="bg-foreground pointer-events-none absolute inset-y-0 w-px"
            style={{ left: `${viewFraction(currentTime, whole) * 100}%` }}
          />
        </div>
        <button
          type="button"
          aria-label={labels.later}
          disabled={view.start + view.span >= duration}
          onClick={() => pan(view.span)}
          className="text-muted-foreground hover:text-foreground focus-visible:ring-ring rounded p-0.5 focus-visible:ring-2 focus-visible:outline-none disabled:opacity-40"
        >
          <ChevronRight aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
      <div
        aria-hidden="true"
        className="text-muted-foreground relative mx-6 mt-1 h-4 text-[11px] tabular-nums"
      >
        {ticksFor(whole).map((t) => (
          <span
            key={t}
            className="absolute -translate-x-1/2"
            style={{ left: `${viewFraction(t, whole) * 100}%` }}
          >
            {formatClock(t)}
          </span>
        ))}
      </div>
    </div>
  );
}
