import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const switchTrackVariants = cva(
  [
    'relative inline-flex shrink-0',
    'cursor-pointer rounded-full',
    'transition-colors duration-200 ease-in-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'bg-neutral-200 dark:bg-neutral-700',
    'data-[state=checked]:bg-primary-500',
  ],
  {
    variants: {
      size: {
        sm: 'h-5 w-9',
        md: 'h-6 w-11',
        lg: 'h-7 w-14',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

const switchThumbVariants = cva(
  [
    'pointer-events-none inline-block rounded-full',
    'bg-white shadow-lg',
    'ring-0 transition-transform duration-200 ease-in-out',
  ],
  {
    variants: {
      size: {
        sm: 'h-4 w-4 data-[state=checked]:translate-x-4 translate-x-0.5',
        md: 'h-5 w-5 data-[state=checked]:translate-x-5 translate-x-0.5',
        lg: 'h-6 w-6 data-[state=checked]:translate-x-7 translate-x-0.5',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

export interface SwitchProps
  extends
    Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'>,
    VariantProps<typeof switchTrackVariants> {
  /** Controlled checked state */
  checked?: boolean;
  /** Default checked state (uncontrolled) */
  defaultChecked?: boolean;
  /** Callback when checked state changes */
  onCheckedChange?: (checked: boolean) => void;
  /** Label for the switch */
  label?: string;
  /** Description text */
  description?: string;
  /** Position of the label */
  labelPosition?: 'left' | 'right';
  /** ID for the switch */
  id?: string;
}

/**
 * An accessible toggle switch component.
 *
 * @example
 * ```tsx
 * <Switch label="Enable notifications" />
 * <Switch
 *   label="Dark mode"
 *   description="Toggle between light and dark theme"
 * />
 * ```
 */
const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  (
    {
      className,
      size,
      checked: controlledChecked,
      defaultChecked = false,
      onCheckedChange,
      label,
      description,
      labelPosition = 'right',
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const [uncontrolledChecked, setUncontrolledChecked] =
      React.useState(defaultChecked);

    const generatedId = React.useId();
    const switchId = id || generatedId;
    const descriptionId = `${switchId}-description`;

    const isControlled = controlledChecked !== undefined;
    const isChecked = isControlled ? controlledChecked : uncontrolledChecked;

    const handleToggle = React.useCallback(() => {
      if (disabled) return;

      const newValue = !isChecked;
      if (!isControlled) {
        setUncontrolledChecked(newValue);
      }
      onCheckedChange?.(newValue);
    }, [disabled, isChecked, isControlled, onCheckedChange]);

    const handleKeyDown = React.useCallback(
      (e: React.KeyboardEvent<HTMLButtonElement>) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleToggle();
        }
      },
      [handleToggle]
    );

    const switchElement = (
      <button
        ref={ref}
        id={switchId}
        type="button"
        role="switch"
        aria-checked={isChecked}
        aria-describedby={description ? descriptionId : undefined}
        data-state={isChecked ? 'checked' : 'unchecked'}
        disabled={disabled}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className={cn(switchTrackVariants({ size }), 'items-center', className)}
        {...props}
      >
        <span
          data-state={isChecked ? 'checked' : 'unchecked'}
          className={switchThumbVariants({ size })}
        />
      </button>
    );

    const labelSizeClasses = {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base',
    };

    const descriptionSizeClasses = {
      sm: 'text-[10px]',
      md: 'text-xs',
      lg: 'text-sm',
    };

    const labelElement = label && (
      <div className="flex flex-col gap-0.5">
        <label
          htmlFor={switchId}
          className={cn(
            'text-foreground cursor-pointer font-medium select-none',
            labelSizeClasses[size || 'md'],
            disabled && 'cursor-not-allowed opacity-50'
          )}
        >
          {label}
        </label>
        {description && (
          <p id={descriptionId} className={cn('text-muted-foreground', descriptionSizeClasses[size || 'md'])}>
            {description}
          </p>
        )}
      </div>
    );

    return (
      <div
        className={cn(
          'flex items-center gap-3',
          labelPosition === 'left' && 'flex-row-reverse'
        )}
      >
        {switchElement}
        {labelElement}
      </div>
    );
  }
);

Switch.displayName = 'Switch';

export { Switch, switchTrackVariants, switchThumbVariants };
