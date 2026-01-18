import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const spinnerVariants = cva(
  ['animate-spin rounded-full border-2 border-current border-t-transparent'],
  {
    variants: {
      size: {
        xs: 'h-3 w-3',
        sm: 'h-4 w-4',
        md: 'h-6 w-6',
        lg: 'h-8 w-8',
        xl: 'h-12 w-12',
      },
      variant: {
        default: 'text-primary-500',
        muted: 'text-muted-foreground',
        white: 'text-white',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  }
);

export interface SpinnerProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {
  /** Accessible label for the spinner */
  label?: string;
}

/**
 * A loading spinner component.
 *
 * @example
 * ```tsx
 * <Spinner />
 * <Spinner size="lg" label="Loading data..." />
 * <Spinner variant="white" /> // For use on dark backgrounds
 * ```
 */
function Spinner({
  className,
  size,
  variant,
  label = 'Loading',
  ...props
}: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className={cn(spinnerVariants({ size, variant }), className)}
      {...props}
    >
      <span className="sr-only">{label}</span>
    </div>
  );
}

Spinner.displayName = 'Spinner';

// ============================================================================
// Spinner with Label
// ============================================================================

export interface SpinnerWithLabelProps extends SpinnerProps {
  /** Label text to display */
  label: string;
  /** Position of the label */
  labelPosition?: 'top' | 'bottom' | 'left' | 'right';
}

/**
 * A spinner with a visible label.
 *
 * @example
 * ```tsx
 * <SpinnerWithLabel label="Loading..." />
 * <SpinnerWithLabel label="Processing" labelPosition="right" />
 * ```
 */
function SpinnerWithLabel({
  label,
  labelPosition = 'bottom',
  size,
  variant,
  className,
  ...props
}: SpinnerWithLabelProps) {
  const positionClasses = {
    top: 'flex-col-reverse',
    bottom: 'flex-col',
    left: 'flex-row-reverse',
    right: 'flex-row',
  };

  return (
    <div
      role="status"
      aria-label={label}
      className={cn(
        'inline-flex items-center justify-center gap-2',
        positionClasses[labelPosition],
        className
      )}
      {...props}
    >
      <div
        className={cn(spinnerVariants({ size, variant }))}
        aria-hidden="true"
      />
      <span className="text-muted-foreground text-sm">{label}</span>
    </div>
  );
}

SpinnerWithLabel.displayName = 'SpinnerWithLabel';

// ============================================================================
// Full Page Spinner
// ============================================================================

export interface FullPageSpinnerProps extends SpinnerProps {
  /** Whether to show a backdrop */
  backdrop?: boolean;
  /** Text to display below the spinner */
  text?: string;
}

/**
 * A full-page loading spinner with optional backdrop.
 *
 * @example
 * ```tsx
 * <FullPageSpinner />
 * <FullPageSpinner backdrop text="Loading your data..." />
 * ```
 */
function FullPageSpinner({
  backdrop = true,
  text,
  size = 'xl',
  ...props
}: FullPageSpinnerProps) {
  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex flex-col items-center justify-center gap-4',
        backdrop && 'bg-background/80 backdrop-blur-sm'
      )}
    >
      <Spinner size={size} {...props} />
      {text && <p className="text-muted-foreground text-sm">{text}</p>}
    </div>
  );
}

FullPageSpinner.displayName = 'FullPageSpinner';

export { Spinner, SpinnerWithLabel, FullPageSpinner, spinnerVariants };
