import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

// ============================================================================
// Radio Group Context
// ============================================================================

interface RadioGroupContextValue {
  name: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg' | null;
}

const RadioGroupContext = React.createContext<
  RadioGroupContextValue | undefined
>(undefined);

function useRadioGroupContext() {
  const context = React.useContext(RadioGroupContext);
  if (!context) {
    throw new Error('Radio must be used within a RadioGroup');
  }
  return context;
}

// ============================================================================
// Radio Variants
// ============================================================================

const radioVariants = cva(
  [
    'shrink-0 appearance-none',
    'border-2 border-input rounded-full',
    'bg-background',
    'transition-all duration-150',
    'cursor-pointer',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'checked:border-primary-500',
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

// ============================================================================
// Radio Group
// ============================================================================

export interface RadioGroupProps {
  /** Group name (required for native form behavior) */
  name?: string;
  /** Controlled value */
  value?: string;
  /** Default value (uncontrolled) */
  defaultValue?: string;
  /** Callback when value changes */
  onValueChange?: (value: string) => void;
  /** Group label */
  label?: string;
  /** Description for the group */
  description?: string;
  /** Error message */
  error?: string;
  /** Whether all radios are disabled */
  disabled?: boolean;
  /** Size of all radios */
  size?: 'sm' | 'md' | 'lg';
  /** Orientation of radio items */
  orientation?: 'horizontal' | 'vertical';
  /** Children radio items */
  children: React.ReactNode;
  /** Additional class name */
  className?: string;
}

/**
 * A radio group component for selecting one option from a set.
 *
 * @example
 * ```tsx
 * <RadioGroup name="plan" label="Select a plan" onValueChange={setPlan}>
 *   <Radio value="free" label="Free" />
 *   <Radio value="pro" label="Pro" />
 *   <Radio value="enterprise" label="Enterprise" />
 * </RadioGroup>
 * ```
 */
function RadioGroup({
  name,
  value: controlledValue,
  defaultValue = '',
  onValueChange,
  label,
  description,
  error,
  disabled = false,
  size = 'md',
  orientation = 'vertical',
  children,
  className,
}: RadioGroupProps) {
  const generatedName = React.useId();
  const groupName = name || generatedName;
  const groupId = React.useId();
  const descriptionId = `${groupId}-description`;
  const errorId = `${groupId}-error`;

  const [uncontrolledValue, setUncontrolledValue] =
    React.useState(defaultValue);
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : uncontrolledValue;

  const handleChange = React.useCallback(
    (newValue: string) => {
      if (!isControlled) {
        setUncontrolledValue(newValue);
      }
      onValueChange?.(newValue);
    },
    [isControlled, onValueChange]
  );

  return (
    <RadioGroupContext.Provider
      value={{ name: groupName, value, onChange: handleChange, disabled, size }}
    >
      <fieldset
        role="radiogroup"
        className={cn('flex flex-col gap-2', className)}
        aria-describedby={
          [description ? descriptionId : null, error ? errorId : null]
            .filter(Boolean)
            .join(' ') || undefined
        }
      >
        {label && (
          <legend
            className={cn(
              'text-foreground font-medium',
              size === 'sm' && 'text-xs',
              size === 'md' && 'text-sm',
              size === 'lg' && 'text-base'
            )}
          >
            {label}
          </legend>
        )}
        {description && (
          <p
            id={descriptionId}
            className={cn(
              'text-muted-foreground',
              size === 'sm' && 'text-[10px]',
              size === 'md' && 'text-xs',
              size === 'lg' && 'text-sm'
            )}
          >
            {description}
          </p>
        )}
        <div
          className={cn(
            'flex gap-4',
            orientation === 'vertical' && 'flex-col gap-3'
          )}
        >
          {children}
        </div>
        {error && (
          <p
            id={errorId}
            className={cn(
              'text-destructive',
              size === 'sm' && 'text-xs',
              size === 'md' && 'text-sm',
              size === 'lg' && 'text-base'
            )}
            role="alert"
          >
            {error}
          </p>
        )}
      </fieldset>
    </RadioGroupContext.Provider>
  );
}

RadioGroup.displayName = 'RadioGroup';

// ============================================================================
// Radio Item
// ============================================================================

export interface RadioProps
  extends
    Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'>,
    VariantProps<typeof radioVariants> {
  /** Value for this radio option */
  value: string;
  /** Label for the radio */
  label?: string;
  /** Description text below the label */
  description?: string;
  /** Position of the label */
  labelPosition?: 'left' | 'right';
}

/**
 * An individual radio item within a RadioGroup.
 *
 * @example
 * ```tsx
 * <Radio value="option1" label="Option 1" />
 * <Radio value="option2" label="Option 2" description="Additional details" />
 * ```
 */
const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  (
    {
      className,
      size: propSize,
      value,
      label,
      description,
      labelPosition = 'right',
      disabled: propDisabled,
      id,
      ...props
    },
    ref
  ) => {
    const context = useRadioGroupContext();
    const generatedId = React.useId();
    const radioId = id || generatedId;
    const descriptionId = `${radioId}-description`;

    const isChecked = context.value === value;
    const isDisabled = propDisabled || context.disabled;
    const size = propSize || context.size;

    const handleChange = React.useCallback(() => {
      if (!isDisabled) {
        context.onChange(value);
      }
    }, [isDisabled, context, value]);

    const radioElement = (
      <span className="relative inline-flex items-center justify-center">
        <input
          ref={ref}
          id={radioId}
          type="radio"
          name={context.name}
          value={value}
          checked={isChecked}
          disabled={isDisabled}
          onChange={handleChange}
          aria-describedby={description ? descriptionId : undefined}
          className={cn(radioVariants({ size }), className)}
          {...props}
        />
        {/* Custom dot indicator */}
        <span
          className={cn(
            'bg-primary-500 pointer-events-none absolute rounded-full transition-transform',
            size === 'sm' && 'h-2 w-2',
            size === 'md' && 'h-2.5 w-2.5',
            size === 'lg' && 'h-3 w-3',
            isChecked ? 'scale-100' : 'scale-0'
          )}
        />
      </span>
    );

    const labelElement = label && (
      <div className="flex flex-col gap-0.5">
        <label
          htmlFor={radioId}
          className={cn(
            'text-foreground cursor-pointer font-medium select-none',
            size === 'sm' && 'text-xs',
            size === 'md' && 'text-sm',
            size === 'lg' && 'text-base',
            isDisabled && 'cursor-not-allowed opacity-50'
          )}
        >
          {label}
        </label>
        {description && (
          <p
            id={descriptionId}
            className={cn(
              'text-muted-foreground',
              size === 'sm' && 'text-[10px]',
              size === 'md' && 'text-xs',
              size === 'lg' && 'text-sm'
            )}
          >
            {description}
          </p>
        )}
      </div>
    );

    return (
      <div
        className={cn(
          'flex items-start gap-3',
          labelPosition === 'left' && 'flex-row-reverse'
        )}
      >
        {radioElement}
        {labelElement}
      </div>
    );
  }
);

Radio.displayName = 'Radio';

export { RadioGroup, Radio, radioVariants };
