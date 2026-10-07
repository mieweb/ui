import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';
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
          'bg-green-100 text-green-900 dark:bg-green-900 dark:text-green-100',
        warning:
          'bg-yellow-100 text-yellow-900 dark:bg-yellow-900 dark:text-yellow-100',
        danger: 'bg-red-100 text-red-900 dark:bg-red-900 dark:text-red-100',
        outline: 'border border-current bg-transparent',
      },
      size: {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
      },
      // Padding lives in compound variants so the remove button can sit
      // closer to the end edge without fighting the symmetric `px-*`.
      // No root gap: the remove button carries its own `ms-1` so icon and
      // multi-node children keep their normal spacing.
      removable: {
        true: '',
        false: '',
      },
    },
    compoundVariants: [
      { size: 'sm', removable: false, className: 'px-2 py-0.5' },
      { size: 'sm', removable: true, className: 'ps-2 pe-0.5 py-0.5' },
      { size: 'md', removable: false, className: 'px-2.5 py-0.5' },
      { size: 'md', removable: true, className: 'ps-2.5 pe-1 py-0.5' },
      { size: 'lg', removable: false, className: 'px-3 py-1' },
      { size: 'lg', removable: true, className: 'ps-3 pe-1.5 py-1' },
    ],
    defaultVariants: {
      variant: 'default',
      size: 'md',
      removable: false,
    },
  }
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLSpanElement>,
    Omit<VariantProps<typeof badgeVariants>, 'removable'> {
  /** Optional icon before the text */
  icon?: React.ReactNode;
  /** Renders a remove button after the text; the badge becomes a chip. */
  onRemove?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /**
   * Accessible name of the remove button. Always pass a translated string;
   * the English default only guards against a missing label.
   */
  removeLabel?: string;
  /** Disables the remove button. */
  removeDisabled?: boolean;
}

/**
 * A badge component for displaying status, labels, or counts.
 * With `onRemove` it becomes a removable chip.
 *
 * @example
 * ```tsx
 * <Badge variant="success">Active</Badge>
 * <Badge variant="warning" size="sm">Pending</Badge>
 * <Badge variant="danger" icon={<AlertIcon />}>Error</Badge>
 * <Badge onRemove={() => clear(tag)} removeLabel={t('removeTag', { tag })}>
 *   {tag}
 * </Badge>
 * ```
 */
const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className,
      variant,
      size,
      icon,
      onRemove,
      removeLabel = 'Remove',
      removeDisabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <span
        ref={ref}
        data-slot="badge"
        className={cn(
          badgeVariants({ variant, size, removable: !!onRemove }),
          className
        )}
        {...props}
      >
        {icon && <span className="me-1 shrink-0">{icon}</span>}
        {children}
        {onRemove && (
          <button
            type="button"
            data-slot="badge-remove"
            aria-label={removeLabel}
            disabled={removeDisabled}
            onClick={onRemove}
            className="focus-visible:ring-ring ms-1 shrink-0 rounded-full p-0.5 hover:bg-black/10 focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50 dark:hover:bg-white/10"
          >
            <X aria-hidden="true" className="h-3 w-3" />
          </button>
        )}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export { Badge, badgeVariants };
