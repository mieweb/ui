import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const checkboxVariants = cva(
  [
    'shrink-0 appearance-none',
    'border-2 border-input rounded',
    'bg-background',
    'transition-all duration-150',
    'cursor-pointer',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'checked:bg-primary-500 checked:border-primary-500',
    'indeterminate:bg-primary-500 indeterminate:border-primary-500',
  ],
  {
    variants: {
      size: {
        sm: 'h-4 w-4',
        md: 'h-5 w-5',
        lg: 'h-6 w-6',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

export interface CheckboxProps
  extends
    Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'>,
    VariantProps<typeof checkboxVariants> {
  /** Label for the checkbox */
  label?: string;
  /** Description text below the label */
  description?: string;
  /** Indeterminate state (neither checked nor unchecked) */
  indeterminate?: boolean;
  /** Error message */
  error?: string;
  /** Position of the label */
  labelPosition?: 'left' | 'right';
}

/**
 * An accessible checkbox component with support for indeterminate state.
 *
 * @example
 * ```tsx
 * <Checkbox label="Accept terms and conditions" />
 * <Checkbox label="Newsletter" description="Receive updates about new features" />
 * <Checkbox indeterminate label="Select all" />
 * ```
 */
const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      className,
      size,
      label,
      description,
      indeterminate = false,
      error,
      labelPosition = 'right',
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const internalRef = React.useRef<HTMLInputElement>(null);
    const generatedId = React.useId();
    const checkboxId = id || generatedId;
    const descriptionId = `${checkboxId}-description`;
    const errorId = `${checkboxId}-error`;

    // Handle indeterminate state
    React.useEffect(() => {
      const checkbox = internalRef.current;
      if (checkbox) {
        checkbox.indeterminate = indeterminate;
      }
    }, [indeterminate]);

    // Combine refs
    React.useImperativeHandle(ref, () => internalRef.current!);

    const checkboxElement = (
      <span className="relative inline-flex items-center justify-center">
        <input
          ref={internalRef}
          id={checkboxId}
          type="checkbox"
          disabled={disabled}
          aria-describedby={
            [description ? descriptionId : null, error ? errorId : null]
              .filter(Boolean)
              .join(' ') || undefined
          }
          aria-invalid={!!error}
          className={cn('peer', checkboxVariants({ size }), className)}
          {...props}
        />
        {/* Custom check icon overlay */}
        <CheckIcon
          size={size}
          className="pointer-events-none absolute text-white opacity-0 transition-opacity peer-checked:opacity-100"
        />
        {/* Custom indeterminate icon overlay */}
        <MinusIcon
          size={size}
          className="pointer-events-none absolute text-white opacity-0 transition-opacity peer-indeterminate:opacity-100"
        />
      </span>
    );

    const labelElement = label && (
      <div className="flex flex-col">
        <label
          htmlFor={checkboxId}
          className={cn(
            'text-foreground cursor-pointer text-sm font-medium select-none',
            disabled && 'cursor-not-allowed opacity-50'
          )}
        >
          {label}
        </label>
        {description && (
          <p
            id={descriptionId}
            className="text-muted-foreground mt-0.5 text-xs"
          >
            {description}
          </p>
        )}
      </div>
    );

    return (
      <div className="flex flex-col gap-1">
        <div
          className={cn(
            'flex gap-2',
            description ? 'items-start' : 'items-center',
            labelPosition === 'left' && 'flex-row-reverse'
          )}
        >
          {checkboxElement}
          {labelElement}
        </div>
        {error && (
          <p id={errorId} className="text-destructive text-sm" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

// ============================================================================
// Checkbox Group
// ============================================================================

export interface CheckboxGroupProps {
  /** Group label */
  label?: string;
  /** Description for the group */
  description?: string;
  /** Error message for the group */
  error?: string;
  /** Orientation of checkboxes */
  orientation?: 'horizontal' | 'vertical';
  /** Children checkboxes */
  children: React.ReactNode;
  /** Additional class name */
  className?: string;
}

/**
 * A container for grouping related checkboxes.
 *
 * @example
 * ```tsx
 * <CheckboxGroup label="Interests" orientation="vertical">
 *   <Checkbox label="Sports" />
 *   <Checkbox label="Music" />
 *   <Checkbox label="Travel" />
 * </CheckboxGroup>
 * ```
 */
function CheckboxGroup({
  label,
  description,
  error,
  orientation = 'vertical',
  children,
  className,
}: CheckboxGroupProps) {
  const groupId = React.useId();
  const descriptionId = `${groupId}-description`;
  const errorId = `${groupId}-error`;

  return (
    <fieldset
      className={cn('flex flex-col', className)}
      aria-describedby={
        [description ? descriptionId : null, error ? errorId : null]
          .filter(Boolean)
          .join(' ') || undefined
      }
    >
      {label && (
        <legend className="text-foreground mb-1 text-sm font-medium">
          {label}
        </legend>
      )}
      {description && (
        <p id={descriptionId} className="text-muted-foreground mb-3 text-xs">
          {description}
        </p>
      )}
      <div
        role="group"
        className={cn(
          'flex gap-4',
          orientation === 'vertical' && 'flex-col gap-2'
        )}
      >
        {children}
      </div>
      {error && (
        <p id={errorId} className="text-destructive mt-2 text-sm" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}

CheckboxGroup.displayName = 'CheckboxGroup';

// ============================================================================
// Check Icon
// ============================================================================

interface CheckIconProps {
  size?: 'sm' | 'md' | 'lg' | null;
  className?: string;
}

function CheckIcon({ size, className }: CheckIconProps) {
  const sizeMap = {
    sm: 10,
    md: 12,
    lg: 14,
  };
  const iconSize = sizeMap[size || 'md'];

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={iconSize}
      height={iconSize}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function MinusIcon({ size, className }: CheckIconProps) {
  const sizeMap = {
    sm: 10,
    md: 12,
    lg: 14,
  };
  const iconSize = sizeMap[size || 'md'];

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={iconSize}
      height={iconSize}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M5 12h14" />
    </svg>
  );
}

export { Checkbox, CheckboxGroup, checkboxVariants };
