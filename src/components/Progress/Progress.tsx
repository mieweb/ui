import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

// ============================================================================
// Progress Bar Variants
// ============================================================================

const progressBarTrackVariants = cva(
  ['w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700'],
  {
    variants: {
      size: {
        sm: 'h-1',
        md: 'h-2',
        lg: 'h-3',
        xl: 'h-4',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

const progressBarFillVariants = cva(
  ['h-full rounded-full transition-all duration-300 ease-out'],
  {
    variants: {
      variant: {
        default: 'bg-primary-500',
        success: 'bg-green-500',
        warning: 'bg-yellow-500',
        danger: 'bg-red-500',
      },
      animated: {
        true: 'animate-pulse',
        false: '',
      },
      striped: {
        true: [
          'bg-gradient-to-r',
          'from-transparent via-white/20 to-transparent',
          'bg-[length:1rem_100%]',
          'animate-[progress-stripes_1s_linear_infinite]',
        ],
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      animated: false,
      striped: false,
    },
  }
);

// ============================================================================
// Progress Bar Component
// ============================================================================

export interface ProgressProps
  extends
    VariantProps<typeof progressBarTrackVariants>,
    VariantProps<typeof progressBarFillVariants> {
  /** Current progress value (0-100) */
  value: number;
  /** Maximum value (default: 100) */
  max?: number;
  /** Label for the progress bar */
  label?: string;
  /** Show the percentage value */
  showValue?: boolean;
  /** Format the displayed value */
  formatValue?: (value: number, max: number) => string;
  /** Additional class name */
  className?: string;
  /** Whether the progress is indeterminate */
  indeterminate?: boolean;
}

/**
 * A progress bar component for showing completion status.
 *
 * @example
 * ```tsx
 * <Progress value={60} />
 * <Progress value={75} showValue label="Upload progress" />
 * <Progress value={30} variant="success" striped />
 * ```
 */
function Progress({
  value,
  max = 100,
  label,
  showValue = false,
  formatValue,
  size,
  variant,
  animated,
  striped,
  className,
  indeterminate = false,
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const progressId = React.useId();

  const displayValue = formatValue
    ? formatValue(value, max)
    : `${Math.round(percentage)}%`;

  return (
    <div className={cn('w-full', className)}>
      {(label || showValue) && (
        <div className="mb-1.5 flex items-center justify-between">
          {label && (
            <label
              id={`${progressId}-label`}
              className="text-foreground text-sm font-medium"
            >
              {label}
            </label>
          )}
          {showValue && !indeterminate && (
            <span className="text-muted-foreground text-sm">
              {displayValue}
            </span>
          )}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={indeterminate ? undefined : value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-labelledby={label ? `${progressId}-label` : undefined}
        aria-label={!label ? 'Progress' : undefined}
        className={cn(progressBarTrackVariants({ size }))}
      >
        <div
          className={cn(
            progressBarFillVariants({ variant, animated, striped }),
            indeterminate &&
              'w-1/3 animate-[indeterminate_1.5s_ease-in-out_infinite]',
            !striped && variant === 'default' && 'bg-primary-500',
            !striped && variant === 'success' && 'bg-green-500',
            !striped && variant === 'warning' && 'bg-yellow-500',
            !striped && variant === 'danger' && 'bg-red-500'
          )}
          style={indeterminate ? undefined : { width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

Progress.displayName = 'Progress';

// ============================================================================
// Circular Progress Variants
// ============================================================================

const circularProgressVariants = cva(['relative inline-flex'], {
  variants: {
    size: {
      sm: 'h-8 w-8',
      md: 'h-12 w-12',
      lg: 'h-16 w-16',
      xl: 'h-24 w-24',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

// ============================================================================
// Circular Progress Component
// ============================================================================

export interface CircularProgressProps extends VariantProps<
  typeof circularProgressVariants
> {
  /** Current progress value (0-100) */
  value: number;
  /** Maximum value (default: 100) */
  max?: number;
  /** Color variant */
  variant?: 'default' | 'success' | 'warning' | 'danger';
  /** Stroke width */
  strokeWidth?: number;
  /** Show the percentage value in the center */
  showValue?: boolean;
  /** Whether the progress is indeterminate */
  indeterminate?: boolean;
  /** Additional class name */
  className?: string;
}

/**
 * A circular progress indicator component.
 *
 * @example
 * ```tsx
 * <CircularProgress value={75} showValue />
 * <CircularProgress value={50} variant="success" size="lg" />
 * ```
 */
function CircularProgress({
  value,
  max = 100,
  variant = 'default',
  size,
  strokeWidth = 4,
  showValue = false,
  indeterminate = false,
  className,
}: CircularProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  // SVG calculations
  const sizeMap = { sm: 32, md: 48, lg: 64, xl: 96 };
  const svgSize = sizeMap[size || 'md'];
  const radius = (svgSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const variantColors = {
    default: 'stroke-primary-500',
    success: 'stroke-green-500',
    warning: 'stroke-yellow-500',
    danger: 'stroke-red-500',
  };

  return (
    <div
      role="progressbar"
      aria-valuenow={indeterminate ? undefined : value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label="Progress"
      className={cn(circularProgressVariants({ size }), className)}
    >
      <svg
        className={cn('-rotate-90 transform', indeterminate && 'animate-spin')}
        width={svgSize}
        height={svgSize}
      >
        {/* Background track */}
        <circle
          className="stroke-neutral-200 dark:stroke-neutral-700"
          fill="none"
          strokeWidth={strokeWidth}
          cx={svgSize / 2}
          cy={svgSize / 2}
          r={radius}
        />
        {/* Progress fill */}
        <circle
          className={cn(
            variantColors[variant],
            'transition-all duration-300 ease-out'
          )}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          cx={svgSize / 2}
          cy={svgSize / 2}
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={indeterminate ? circumference * 0.75 : offset}
        />
      </svg>
      {showValue && !indeterminate && (
        <span className="text-foreground absolute inset-0 flex items-center justify-center text-xs font-medium">
          {Math.round(percentage)}%
        </span>
      )}
    </div>
  );
}

CircularProgress.displayName = 'CircularProgress';

export {
  Progress,
  CircularProgress,
  progressBarTrackVariants,
  progressBarFillVariants,
  circularProgressVariants,
};
