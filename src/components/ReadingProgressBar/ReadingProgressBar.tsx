'use client';

import * as React from 'react';
import { cn } from '../../utils/cn';

export interface ReadingProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Class for the filled bar (default `bg-primary-500`). */
  barClassName?: string;
}

/**
 * A thin progress bar pinned to the top of the viewport, tracking how far
 * the reader has scrolled through the document. Purely decorative
 * (`aria-hidden`) — long-form articles, guides, reports.
 *
 * @example
 * ```tsx
 * <ReadingProgressBar />
 * <ReadingProgressBar barClassName="bg-warning" className="h-0.5" />
 * ```
 */
export const ReadingProgressBar = React.forwardRef<
  HTMLDivElement,
  ReadingProgressBarProps
>(function ReadingProgressBar({ className, barClassName, ...props }, ref) {
  const [pct, setPct] = React.useState(0);

  React.useEffect(() => {
    let rafId = 0;

    const update = () => {
      const el = document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      setPct(
        max > 0 ? Math.min(100, Math.max(0, (el.scrollTop / max) * 100)) : 0
      );
    };

    // Coalesce bursty scroll events to one state update per frame
    const schedule = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, []);

  return (
    <div
      ref={ref}
      {...props}
      aria-hidden="true"
      className={cn(
        'pointer-events-none fixed inset-x-0 top-0 z-50 h-1 bg-transparent',
        className
      )}
    >
      <div
        data-slot="reading-progress-fill"
        className={cn(
          'h-full transition-[width] duration-150',
          barClassName ?? 'bg-primary-500'
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
});
