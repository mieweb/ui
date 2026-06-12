'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '../../utils/cn';
import { Card, CardContent } from '../Card/Card';

// =============================================================================
// Variants
// =============================================================================

const statCardVariants = cva('transition-all duration-200', {
  variants: {
    interactive: {
      true: 'cursor-pointer hover:shadow-md hover:-translate-y-0.5',
      false: '',
    },
    accent: {
      none: '',
      primary: '',
      success: '',
      warning: '',
      destructive: '',
      info: '',
    },
  },
  defaultVariants: {
    interactive: false,
    accent: 'none',
  },
});

const iconBubbleVariants = cva(
  'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg',
  {
    variants: {
      accent: {
        none: 'bg-muted text-muted-foreground',
        primary:
          'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300',
        success:
          'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
        warning:
          'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
        destructive:
          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
        info: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
      },
    },
    defaultVariants: {
      accent: 'none',
    },
  }
);

// =============================================================================
// Types
// =============================================================================

export interface StatCardDelta {
  /** Numeric delta (positive or negative). */
  value: number;
  /** Optional override direction ("up" is good by default; set to 'inverse' for metrics where down is good, e.g. errors). */
  polarity?: 'normal' | 'inverse';
  /** Optional label to describe the delta period, e.g. "vs last 30 days". */
  label?: string;
  /** Formatter for the delta value (default: `+1.2%` / `-3` style). */
  format?: (value: number) => string;
}

export interface StatCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onClick'>,
    VariantProps<typeof statCardVariants> {
  /** Stat label (e.g. "Active Employees"). */
  label: string;
  /** Primary stat value. */
  value: string | number;
  /** Optional descriptive subtitle rendered under the value. */
  description?: string;
  /** Optional icon rendered in a colored bubble. */
  icon?: React.ReactNode;
  /** Accent color for the icon bubble and delta chip. */
  accent?: 'none' | 'primary' | 'success' | 'warning' | 'destructive' | 'info';
  /** Period-over-period delta chip. */
  delta?: StatCardDelta;
  /** Loading state — shows skeleton placeholders. */
  loading?: boolean;
  /** Click-through handler (adds interactive styling + keyboard a11y). */
  onClick?: () => void;
  /** Accessible label override for the card when interactive. */
  ariaLabel?: string;
}

// =============================================================================
// Helpers
// =============================================================================

function defaultDeltaFormat(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value}`;
}

function deltaColorClass(delta: StatCardDelta): string {
  const { value, polarity = 'normal' } = delta;
  if (value === 0) return 'text-muted-foreground';
  const isGood = polarity === 'inverse' ? value < 0 : value > 0;
  return isGood
    ? 'text-green-700 dark:text-green-300'
    : 'text-red-700 dark:text-red-300';
}

function DeltaArrow({ value }: { value: number }) {
  if (value === 0) {
    return (
      <svg
        className="h-3 w-3"
        viewBox="0 0 12 12"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path strokeLinecap="round" d="M2 6h8" />
      </svg>
    );
  }
  const up = value > 0;
  return (
    <svg
      className="h-3 w-3"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d={up ? 'M6 10V2M2 6l4-4 4 4' : 'M6 2v8M2 6l4 4 4-4'}
      />
    </svg>
  );
}

// =============================================================================
// Component
// =============================================================================

/**
 * StatCard — dashboard stat tile with optional icon, delta, and click-through.
 */
export function StatCard({
  label,
  value,
  description,
  icon,
  accent = 'none',
  delta,
  loading = false,
  onClick,
  ariaLabel,
  className,
  ...rest
}: StatCardProps): React.JSX.Element {
  const interactive = Boolean(onClick);
  const handleKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (!interactive) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <Card
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? (ariaLabel ?? label) : undefined}
      onClick={interactive ? onClick : undefined}
      onKeyDown={interactive ? handleKeyDown : undefined}
      className={cn(statCardVariants({ interactive, accent }), className)}
      {...rest}
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {icon && (
            <div className={iconBubbleVariants({ accent })} aria-hidden="true">
              <span className="h-5 w-5">{icon}</span>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <div className="mt-1 flex items-baseline gap-2">
              {loading ? (
                <span className="inline-block h-8 w-20 animate-pulse rounded bg-muted" />
              ) : (
                <p className="truncate text-3xl font-bold tracking-tight text-foreground">
                  {value}
                </p>
              )}
              {!loading && delta && (
                <span
                  className={cn(
                    'inline-flex items-center gap-0.5 text-xs font-semibold',
                    deltaColorClass(delta)
                  )}
                  title={delta.label}
                >
                  <DeltaArrow value={delta.value} />
                  {(delta.format ?? defaultDeltaFormat)(delta.value)}
                </span>
              )}
            </div>
            {description && !loading && (
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {description}
              </p>
            )}
            {delta?.label && !loading && (
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {delta.label}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
