import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

// ============================================================================
// Slider Variants
// ============================================================================

const sliderTrackVariants = cva(
  [
    'relative w-full overflow-hidden rounded-full',
    'bg-neutral-200 dark:bg-neutral-700',
    'cursor-pointer',
    'group-data-[disabled=true]:cursor-not-allowed group-data-[disabled=true]:opacity-50',
  ],
  {
    variants: {
      size: {
        sm: 'h-1',
        md: 'h-2',
        lg: 'h-3',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

const sliderRangeVariants = cva(
  ['absolute h-full rounded-full transition-all duration-75 ease-out'],
  {
    variants: {
      variant: {
        default: 'bg-primary-500',
        success: 'bg-green-500',
        warning: 'bg-yellow-500',
        danger: 'bg-red-500',
        neutral: 'bg-neutral-500',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const sliderThumbVariants = cva(
  [
    'absolute top-1/2 -translate-y-1/2 -translate-x-1/2',
    'rounded-full border-2 bg-white',
    'shadow-md transition-shadow duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'hover:shadow-lg',
    'active:shadow-xl active:scale-110',
    'disabled:pointer-events-none disabled:opacity-50',
  ],
  {
    variants: {
      size: {
        sm: 'h-3.5 w-3.5',
        md: 'h-5 w-5',
        lg: 'h-6 w-6',
      },
      variant: {
        default: 'border-primary-500',
        success: 'border-green-500',
        warning: 'border-yellow-500',
        danger: 'border-red-500',
        neutral: 'border-neutral-500',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  }
);

// ============================================================================
// Slider Component
// ============================================================================

export interface SliderProps
  extends VariantProps<typeof sliderTrackVariants>,
    VariantProps<typeof sliderRangeVariants> {
  /** Current value (controlled) */
  value?: number;
  /** Default value (uncontrolled) */
  defaultValue?: number;
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Step increment */
  step?: number;
  /** Callback when value changes */
  onValueChange?: (value: number) => void;
  /** Callback when interaction ends (mouseup / touchend) */
  onValueCommit?: (value: number) => void;
  /** Whether the slider is disabled */
  disabled?: boolean;
  /** Label for the slider */
  label?: string;
  /** Show the current value */
  showValue?: boolean;
  /** Format the displayed value */
  formatValue?: (value: number) => string;
  /** Description text below the label */
  description?: string;
  /** Min label displayed below the track (left) */
  minLabel?: string;
  /** Max label displayed below the track (right) */
  maxLabel?: string;
  /** Additional class name for the root container */
  className?: string;
  /** Additional class name for the track */
  trackClassName?: string;
  /** ID for the underlying input */
  id?: string;
  /** Name for form submission */
  name?: string;
  /** Accessible label for the slider */
  'aria-label'?: string;
  /** ID of the element that labels the slider */
  'aria-labelledby'?: string;
}

/**
 * A fully branded, accessible slider/range input component.
 *
 * Uses brand design tokens for colors, border-radius, and sizing.
 * Supports controlled and uncontrolled usage, labels, descriptions,
 * min/max labels, value display, and multiple color variants.
 *
 * @example
 * ```tsx
 * <Slider label="Volume" min={0} max={100} defaultValue={50} />
 * <Slider
 *   label="Border Radius"
 *   min={0}
 *   max={32}
 *   value={radius}
 *   onValueChange={setRadius}
 *   showValue
 *   formatValue={(v) => `${v}px`}
 *   minLabel="Square"
 *   maxLabel="Rounded"
 * />
 * ```
 */
const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  (
    {
      value: controlledValue,
      defaultValue = 0,
      min = 0,
      max = 100,
      step = 1,
      onValueChange,
      onValueCommit,
      disabled = false,
      label,
      showValue = false,
      formatValue,
      description,
      minLabel,
      maxLabel,
      variant,
      size,
      className,
      trackClassName,
      id,
      name,
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledBy,
    },
    ref
  ) => {
    const [uncontrolledValue, setUncontrolledValue] =
      React.useState(defaultValue);
    const isControlled = controlledValue !== undefined;
    const currentValue = isControlled ? controlledValue : uncontrolledValue;

    // Clamp value to min/max
    const clampedValue = Math.min(Math.max(currentValue, min), max);

    // Percentage for visual fill
    const percentage =
      max !== min ? ((clampedValue - min) / (max - min)) * 100 : 0;

    const generatedId = React.useId();
    const inputId = id ?? generatedId;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = parseFloat(e.target.value);
      if (!isControlled) {
        setUncontrolledValue(newValue);
      }
      onValueChange?.(newValue);
    };

    const handleCommit = () => {
      onValueCommit?.(clampedValue);
    };

    const displayValue = formatValue
      ? formatValue(clampedValue)
      : String(clampedValue);

    return (
      <div
        className={cn('w-full', className)}
        data-disabled={disabled || undefined}
      >
        {/* Label row */}
        {(label || showValue) && (
          <div className="mb-1.5 flex items-baseline justify-between">
            {label && (
              <label
                htmlFor={inputId}
                className={cn(
                  'text-sm font-medium text-foreground',
                  disabled && 'opacity-50'
                )}
              >
                {label}
                {showValue && (
                  <span className="ml-1 text-muted-foreground">
                    {displayValue}
                  </span>
                )}
              </label>
            )}
            {!label && showValue && (
              <span className="text-sm text-muted-foreground">
                {displayValue}
              </span>
            )}
          </div>
        )}

        {/* Description */}
        {description && (
          <p
            className={cn(
              'mb-2 text-xs text-muted-foreground',
              disabled && 'opacity-50'
            )}
          >
            {description}
          </p>
        )}

        {/* Track + Thumb */}
        <div className="group relative" data-disabled={disabled || undefined}>
          {/* Visual track background */}
          <div className={cn(sliderTrackVariants({ size }), trackClassName)}>
            {/* Filled range */}
            <div
              className={sliderRangeVariants({ variant })}
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* Thumb indicator (visual only) */}
          <div
            className={sliderThumbVariants({ size, variant })}
            style={{ left: `${percentage}%` }}
            aria-hidden="true"
          />

          {/* Native range input — stretched to fill, made invisible */}
          <input
            ref={ref}
            type="range"
            id={inputId}
            name={name}
            min={min}
            max={max}
            step={step}
            value={clampedValue}
            onChange={handleChange}
            onMouseUp={handleCommit}
            onTouchEnd={handleCommit}
            disabled={disabled}
            aria-label={ariaLabel}
            aria-labelledby={ariaLabelledBy}
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={clampedValue}
            className={cn(
              'absolute inset-0 h-full w-full cursor-pointer opacity-0',
              disabled && 'cursor-not-allowed'
            )}
          />
        </div>

        {/* Min / Max labels */}
        {(minLabel || maxLabel) && (
          <div
            className={cn(
              'mt-1 flex justify-between text-xs text-muted-foreground',
              disabled && 'opacity-50'
            )}
          >
            <span>{minLabel}</span>
            <span>{maxLabel}</span>
          </div>
        )}
      </div>
    );
  }
);

Slider.displayName = 'Slider';

export {
  Slider,
  sliderTrackVariants,
  sliderRangeVariants,
  sliderThumbVariants,
};
