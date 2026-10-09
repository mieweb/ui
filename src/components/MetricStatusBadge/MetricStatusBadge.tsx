import * as React from 'react';
import { cn } from '../../utils/cn';

/** Where a figure comes from: measured, estimated, or still being instrumented. */
export type MetricStatus = 'live' | 'modeled' | 'maturing';

/** Translated badge text, per status. */
export type MetricStatusLabels = Partial<Record<MetricStatus, string>>;

export const defaultMetricStatusLabels: Record<MetricStatus, string> = {
  live: 'Live data',
  modeled: 'Modeled',
  maturing: 'Data maturing',
};

const dotClass: Record<MetricStatus, string> = {
  live: 'bg-success',
  modeled: 'bg-info',
  maturing: 'bg-warning',
};

export interface MetricStatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: MetricStatus;
  /** Override the visible label, e.g. for translation. */
  label?: string;
  /** Set on dark or brand surfaces. */
  onDark?: boolean;
}

/** Labels a figure by provenance so readers can tell measured data from estimates. */
export const MetricStatusBadge = React.forwardRef<
  HTMLSpanElement,
  MetricStatusBadgeProps
>(({ status, label, onDark, className, ...rest }, ref) => (
  <span
    ref={ref}
    data-slot="metric-status-badge"
    data-status={status}
    className={cn(
      'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
      onDark
        ? 'border-white/20 bg-white/10 text-white'
        : 'border-border bg-card text-foreground',
      className
    )}
    {...rest}
  >
    <span
      aria-hidden="true"
      className={cn('size-1.5 rounded-full', dotClass[status])}
    />
    {label ?? defaultMetricStatusLabels[status]}
  </span>
));
MetricStatusBadge.displayName = 'MetricStatusBadge';
