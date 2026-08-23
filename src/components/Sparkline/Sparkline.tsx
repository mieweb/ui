'use client';

import * as React from 'react';
import { cn } from '../../utils/cn';

// =============================================================================
// Types
// =============================================================================

export interface SparklinePoint {
  /** Stable key for selection (e.g. a day key like "2026-08-22"). */
  key: string;
  /** Human label for tooltips and accessible names (defaults to key). */
  label?: string;
  value: number;
}

export interface SparklineProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'onSelect'
> {
  /** Pre-bucketed points in display order (e.g. one per day). */
  data: SparklinePoint[];
  /** Selected point key — that bar is highlighted. */
  selectedKey?: string | null;
  /**
   * Makes bars clickable; clicking the selected bar reports `null`
   * (deselect). Omit for a read-only sparkline.
   */
  onSelect?: (key: string | null) => void;
  /** Track label rendered before the bars (e.g. "All activity"). */
  label?: string;
  /** Accessible name for the bar group (default "Activity over time"). */
  ariaLabel?: string;
  /** Bar track height in px (default 32). */
  height?: number;
  /** Formats the value for tooltips/accessible names (default `String`). */
  formatValue?: (point: SparklinePoint) => string;
}

// =============================================================================
// Sparkline
// =============================================================================

/**
 * A compact bar sparkline for activity-over-time strips — timelines,
 * table rows, dashboard headers. Bars scale to the series maximum;
 * zero-value bars render as a low baseline stub. With `onSelect`, bars
 * become toggle buttons for filtering the view to one bucket.
 *
 * Data arrives pre-bucketed (the host owns date math), keeping the
 * component pure. For full charting, reach for DataVis instead.
 *
 * @example
 * ```tsx
 * <Sparkline
 *   label="All activity"
 *   data={days.map((d) => ({ key: d.iso, label: d.pretty, value: d.count }))}
 *   selectedKey={day}
 *   onSelect={setDay}
 * />
 * ```
 */
export const Sparkline = React.forwardRef<HTMLDivElement, SparklineProps>(
  function Sparkline(
    {
      data,
      selectedKey,
      onSelect,
      label,
      ariaLabel = 'Activity over time',
      height = 32,
      formatValue,
      className,
      ...props
    },
    ref
  ) {
    const max = React.useMemo(
      () => Math.max(1, ...data.map((d) => d.value)),
      [data]
    );

    const interactive = Boolean(onSelect);

    return (
      <div
        ref={ref}
        className={cn('flex items-end gap-3', className)}
        {...props}
      >
        {label && (
          <span className="text-muted-foreground w-16 shrink-0 pb-0.5 text-[10px] leading-tight font-medium tracking-wider uppercase">
            {label}
          </span>
        )}
        <div
          className="flex flex-1 items-end gap-[2px]"
          style={{ height }}
          role="group"
          aria-label={ariaLabel}
        >
          {data.map((point) => {
            const heightPct =
              point.value === 0
                ? 6
                : Math.max(12, Math.round((point.value / max) * 100));
            const isSelected = selectedKey === point.key;
            const display = point.label ?? point.key;
            const valueText = formatValue
              ? formatValue(point)
              : String(point.value);
            const title = `${display} — ${valueText}`;

            const barClasses = cn(
              'min-w-[3px] flex-1 rounded-sm transition-colors',
              isSelected
                ? 'bg-primary-500 hover:bg-primary-500/90'
                : point.value > 0
                  ? 'bg-primary-500/40 hover:bg-primary-500/70'
                  : 'bg-muted hover:bg-muted-foreground/20'
            );

            return interactive ? (
              <button
                key={point.key}
                type="button"
                onClick={() => onSelect?.(isSelected ? null : point.key)}
                aria-pressed={isSelected}
                title={title}
                aria-label={title}
                className={cn(barClasses, 'cursor-pointer')}
                style={{ height: `${heightPct}%` }}
              />
            ) : (
              <span
                key={point.key}
                role="img"
                title={title}
                aria-label={title}
                className={barClasses}
                style={{ height: `${heightPct}%` }}
              />
            );
          })}
        </div>
      </div>
    );
  }
);
