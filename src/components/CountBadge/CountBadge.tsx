import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

// =============================================================================
// Variants
// =============================================================================

const countBadgeVariants = cva(
  [
    'inline-flex items-center gap-2',
    'rounded-full',
    'border',
    'font-normal text-sm',
    'px-3 py-1',
    'transition-colors duration-150',
    'cursor-pointer select-none',
  ],
  {
    variants: {
      variant: {
        default: [
          'border-border/50 text-muted-foreground',
          'hover:border-border hover:bg-muted/50',
          'dark:border-border/40 dark:hover:border-border dark:hover:bg-muted/30',
        ],
        info: [
          'border-primary-200 text-primary-700',
          'hover:border-primary-300 hover:bg-primary-50',
          'dark:border-primary-800 dark:text-primary-300',
          'dark:hover:border-primary-700 dark:hover:bg-primary-950/50',
        ],
        informative: [
          'border-blue-200 text-blue-700',
          'hover:border-blue-300 hover:bg-blue-50',
          'dark:border-blue-800 dark:text-blue-300',
          'dark:hover:border-blue-700 dark:hover:bg-blue-950/50',
        ],
        success: [
          'border-green-200 text-green-700',
          'hover:border-green-300 hover:bg-green-50',
          'dark:border-green-800 dark:text-green-300',
          'dark:hover:border-green-700 dark:hover:bg-green-950/50',
        ],
        warning: [
          'border-yellow-200 text-yellow-700',
          'hover:border-yellow-300 hover:bg-yellow-50',
          'dark:border-yellow-800 dark:text-yellow-300',
          'dark:hover:border-yellow-700 dark:hover:bg-yellow-950/50',
        ],
        alert: [
          'border-red-200 text-red-700',
          'hover:border-red-300 hover:bg-red-50',
          'dark:border-red-800 dark:text-red-300',
          'dark:hover:border-red-700 dark:hover:bg-red-950/50',
        ],
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const countChipVariants = cva(
  [
    'inline-flex items-center justify-center',
    'rounded px-1.5 py-0.5',
    'text-xs font-semibold',
    'min-w-[1.25rem]',
  ],
  {
    variants: {
      variant: {
        default: 'bg-muted text-foreground/70 dark:bg-muted dark:text-foreground/70',
        info: 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200',
        informative: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        alert: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

// =============================================================================
// Types
// =============================================================================

export interface CountBadgeProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'>,
    VariantProps<typeof countBadgeVariants> {
  /** The label text displayed in the badge */
  label: string;
  /** The count number displayed in the chip */
  count: number;
  /** Optional icon before the label */
  icon?: React.ReactNode;
}

// =============================================================================
// Component
// =============================================================================

/**
 * A pill-shaped badge with a label and count chip, ideal for navigation
 * shortcuts like "Tasks 3" or "Open Enc 5".
 *
 * Supports six semantic variants: `default`, `info`, `informative`,
 * `success`, `warning`, and `alert`.
 *
 * @example
 * ```tsx
 * <CountBadge label="Tasks" count={3} />
 * <CountBadge label="Open Enc" count={5} variant="info" />
 * <CountBadge label="Due List" count={4} variant="warning" />
 * <CountBadge label="eSign" count={7} variant="alert" />
 * ```
 */
const CountBadge = React.forwardRef<HTMLButtonElement, CountBadgeProps>(
  ({ className, variant, label, count, icon, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(countBadgeVariants({ variant }), className)}
        {...props}
      >
        {icon && <span className="shrink-0">{icon}</span>}
        <span>{label}</span>
        <span className={cn(countChipVariants({ variant }))}>
          {count}
        </span>
      </button>
    );
  }
);

CountBadge.displayName = 'CountBadge';

export { CountBadge, countBadgeVariants, countChipVariants };
