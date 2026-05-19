import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const badgeVariants = cva(
  [
    'inline-flex items-center justify-center',
    'font-medium',
    'rounded-full',
    'transition-colors duration-150',
  ],
  {
    variants: {
      variant: {
        default:
          'bg-primary-100 text-primary-900 dark:bg-primary-900 dark:text-primary-100',
        secondary:
          'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100',
        success:
          'bg-success-100 text-success-900 dark:bg-success-900 dark:text-success-100',
        warning:
          'bg-warning-100 text-warning-900 dark:bg-warning-900 dark:text-warning-100',
        danger:
          'bg-destructive-100 text-destructive-900 dark:bg-destructive-900 dark:text-destructive-100',
        outline: 'border border-current bg-transparent',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-0.5 text-sm',
        lg: 'px-3 py-1 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /** Optional icon before the text */
  icon?: React.ReactNode;
}

/**
 * A badge component for displaying status, labels, or counts.
 *
 * @example
 * ```tsx
 * <Badge variant="success">Active</Badge>
 * <Badge variant="warning" size="sm">Pending</Badge>
 * <Badge variant="danger" icon={<AlertIcon />}>Error</Badge>
 * ```
 */
const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, icon, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        data-slot="badge"
        className={cn(badgeVariants({ variant, size }), className)}
        {...props}
      >
        {icon && <span className="mr-1 shrink-0">{icon}</span>}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export { Badge, badgeVariants };
