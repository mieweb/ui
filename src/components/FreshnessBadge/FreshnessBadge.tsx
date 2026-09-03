'use client';

import * as React from 'react';
import { DateTime } from 'luxon';
import {
  CircleAlert,
  CircleCheck,
  CircleHelp,
  CircleMinus,
} from 'lucide-react';
import { cn } from '../../utils/cn';

// =============================================================================
// Types & helpers
// =============================================================================

export type FreshnessLevel = 'fresh' | 'aging' | 'stale' | 'unknown';

export interface FreshnessThresholds {
  /** Days within which a date counts as fresh (default 90). */
  fresh: number;
  /** Days within which a date counts as aging; beyond is stale (default 180). */
  aging: number;
}

const DEFAULT_THRESHOLDS: FreshnessThresholds = { fresh: 90, aging: 180 };

function toDateTime(date: string | Date): DateTime {
  return typeof date === 'string'
    ? DateTime.fromISO(date)
    : DateTime.fromJSDate(date);
}

/**
 * Whole days elapsed since the given date (0 for today/future), or `null`
 * when the date cannot be parsed.
 */
export function daysSince(date: string | Date): number | null {
  const dt = toDateTime(date);
  if (!dt.isValid) return null;
  const days = Math.floor(DateTime.now().diff(dt, 'days').days);
  return Math.max(0, days);
}

function levelForDays(
  days: number | null,
  thresholds: FreshnessThresholds
): FreshnessLevel {
  if (days === null) return 'unknown';
  if (days < thresholds.fresh) return 'fresh';
  if (days < thresholds.aging) return 'aging';
  return 'stale';
}

/**
 * Bucket a date into fresh / aging / stale by day thresholds. Unparseable
 * dates return `unknown` rather than masquerading as fresh or stale.
 */
export function freshnessLevel(
  date: string | Date,
  thresholds: FreshnessThresholds = DEFAULT_THRESHOLDS
): FreshnessLevel {
  return levelForDays(daysSince(date), thresholds);
}

function ageText(days: number | null): string {
  if (days === null) return 'date unknown';
  return days === 0 ? 'today' : days === 1 ? 'yesterday' : `${days}d ago`;
}

const META: Record<
  FreshnessLevel,
  { Icon: typeof CircleCheck; chip: string; dot: string; label: string }
> = {
  fresh: {
    Icon: CircleCheck,
    chip: 'bg-success/10 text-success-800 dark:bg-success/20 dark:text-success',
    dot: 'bg-success',
    label: 'Fresh',
  },
  aging: {
    Icon: CircleMinus,
    chip: 'bg-warning/15 text-warning-800 dark:bg-warning/20 dark:text-warning',
    dot: 'bg-warning',
    label: 'Aging',
  },
  stale: {
    Icon: CircleAlert,
    chip: 'bg-destructive/10 text-destructive-700 dark:bg-destructive/20 dark:text-destructive',
    dot: 'bg-destructive',
    label: 'Stale',
  },
  unknown: {
    Icon: CircleHelp,
    chip: 'bg-muted text-muted-foreground',
    dot: 'bg-muted-foreground/50',
    label: 'Unknown',
  },
};

// =============================================================================
// Components
// =============================================================================

export interface FreshnessBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** The date being aged — last review, last sync, last update. */
  date: string | Date;
  /** Day cutoffs for fresh/aging (default 90/180). */
  thresholds?: FreshnessThresholds;
  /** Verb before the age (default "Reviewed"). */
  label?: string;
}

/**
 * A recency chip that ages from success through warning to destructive:
 * "Reviewed 12d ago". Suits source registries, sync statuses, data-quality
 * dashboards — anywhere staleness is a signal.
 *
 * @example
 * ```tsx
 * <FreshnessBadge date="2026-07-01" />
 * <FreshnessBadge date={lastSync} label="Synced" thresholds={{ fresh: 1, aging: 7 }} />
 * ```
 */
export const FreshnessBadge = React.forwardRef<
  HTMLSpanElement,
  FreshnessBadgeProps
>(function FreshnessBadge(
  {
    date,
    thresholds = DEFAULT_THRESHOLDS,
    label = 'Reviewed',
    className,
    ...props
  },
  ref
) {
  const days = daysSince(date);
  const level = levelForDays(days, thresholds);
  const { Icon, chip } = META[level];
  return (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold',
        chip,
        className
      )}
      {...props}
    >
      <Icon aria-hidden="true" className="h-3 w-3 shrink-0" />
      {label} {ageText(days)}
    </span>
  );
});

export interface FreshnessDotProps extends React.HTMLAttributes<HTMLSpanElement> {
  date: string | Date;
  thresholds?: FreshnessThresholds;
  /** Verb used in the accessible label and tooltip (default "Reviewed"). */
  label?: string;
}

/** Colored dot for tight spots — table cells, tooltip source rows. */
export const FreshnessDot = React.forwardRef<
  HTMLSpanElement,
  FreshnessDotProps
>(function FreshnessDot(
  {
    date,
    thresholds = DEFAULT_THRESHOLDS,
    label = 'Reviewed',
    className,
    ...props
  },
  ref
) {
  const days = daysSince(date);
  const level = levelForDays(days, thresholds);
  const description = `${META[level].label} — ${label} ${ageText(days)}`;
  return (
    <span
      ref={ref}
      role="img"
      aria-label={description}
      title={description}
      className={cn(
        'inline-block h-2 w-2 shrink-0 rounded-full',
        META[level].dot,
        className
      )}
      {...props}
    />
  );
});
