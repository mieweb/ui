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
        default: 'bg-primary-800',
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
    'cursor-grab active:cursor-grabbing',
    'hover:shadow-lg',
    'active:shadow-xl active:scale-110',
    'group-focus-visible:outline-none group-focus-visible:ring-2 group-focus-visible:ring-ring group-focus-visible:ring-offset-2',
    'group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50',
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
  extends
    VariantProps<typeof sliderTrackVariants>,
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
      'aria-label': ariaLabelProp,
      'aria-labelledby': ariaLabelledByProp,
    },
    ref
  ) => {
    const hasExplicitLabel = !!label;
    const labelId = React.useId();
    const descriptionId = React.useId();
    const ariaLabelledBy =
      ariaLabelledByProp ?? (hasExplicitLabel ? labelId : undefined);
    const ariaDescribedBy = description ? descriptionId : undefined;
    const ariaLabel =
      ariaLabelProp ??
      (!hasExplicitLabel && !ariaLabelledByProp ? 'Slider' : undefined);
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

    const trackRef = React.useRef<HTMLDivElement>(null);
    const latestValueRef = React.useRef(clampedValue);
    latestValueRef.current = clampedValue;

    const safeStep = step > 0 ? step : 1;

    const computeValueFromPointer = React.useCallback(
      (clientX: number) => {
        const track = trackRef.current;
        if (!track) return clampedValue;
        const rect = track.getBoundingClientRect();
        const ratio = Math.min(
          Math.max((clientX - rect.left) / rect.width, 0),
          1
        );
        const raw = min + ratio * (max - min);
        // Snap to step relative to min
        const stepped = min + Math.round((raw - min) / safeStep) * safeStep;
        return Math.min(Math.max(stepped, min), max);
      },
      [min, max, safeStep, clampedValue]
    );

    const setValue = React.useCallback(
      (newValue: number) => {
        latestValueRef.current = newValue;
        if (!isControlled) {
          setUncontrolledValue(newValue);
        }
        onValueChange?.(newValue);
      },
      [isControlled, onValueChange]
    );

    const handlePointerDown = React.useCallback(
      (e: React.PointerEvent) => {
        if (disabled) return;
        e.preventDefault();
        (e.currentTarget as HTMLElement).focus();
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        const newValue = computeValueFromPointer(e.clientX);
        setValue(newValue);
      },
      [disabled, computeValueFromPointer, setValue]
    );

    const handlePointerMove = React.useCallback(
      (e: React.PointerEvent) => {
        if (disabled) return;
        if (!(e.target as HTMLElement).hasPointerCapture(e.pointerId)) return;
        const newValue = computeValueFromPointer(e.clientX);
        setValue(newValue);
      },
      [disabled, computeValueFromPointer, setValue]
    );

    const handlePointerUp = React.useCallback(
      (e: React.PointerEvent) => {
        if (disabled) return;
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
        onValueCommit?.(latestValueRef.current);
      },
      [disabled, onValueCommit]
    );

    const handleLostPointerCapture = React.useCallback(() => {
      onValueCommit?.(latestValueRef.current);
    }, [onValueCommit]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = parseFloat(e.target.value);
      if (!isControlled) {
        setUncontrolledValue(newValue);
      }
      onValueChange?.(newValue);
    };

    const handleKeyDown = React.useCallback(
      (e: React.KeyboardEvent) => {
        if (disabled) return;
        let newValue: number | null = null;
        switch (e.key) {
          case 'ArrowRight':
          case 'ArrowUp':
            newValue = Math.min(clampedValue + safeStep, max);
            break;
          case 'ArrowLeft':
          case 'ArrowDown':
            newValue = Math.max(clampedValue - safeStep, min);
            break;
          case 'Home':
            newValue = min;
            break;
          case 'End':
            newValue = max;
            break;
          default:
            return;
        }
        e.preventDefault();
        setValue(newValue);
        onValueCommit?.(newValue);
      },
      [disabled, clampedValue, safeStep, min, max, setValue, onValueCommit]
    );

    const displayValue = formatValue
      ? formatValue(clampedValue)
      : String(clampedValue);

    return (
      <div
        data-slot="slider"
        className={cn('relative w-full', className)}
        data-disabled={disabled || undefined}
      >
        {/* Label row */}
        {(label || showValue) && (
          <div
            data-slot="slider-label-row"
            className="mb-1.5 flex items-baseline justify-between"
          >
            {label && (
              <label
                id={labelId}
                htmlFor={inputId}
                data-slot="slider-label"
                className={cn(
                  'text-foreground text-sm font-medium',
                  disabled && 'opacity-50'
                )}
              >
                {label}
                {showValue && (
                  <span
                    data-slot="slider-value"
                    className="text-muted-foreground ml-1"
                  >
                    {displayValue}
                  </span>
                )}
              </label>
            )}
            {!label && showValue && (
              <span
                data-slot="slider-value"
                className="text-muted-foreground text-sm"
              >
                {displayValue}
              </span>
            )}
          </div>
        )}

        {/* Description */}
        {description && (
          <p
            id={descriptionId}
            data-slot="slider-description"
            className={cn(
              'text-muted-foreground mb-2 text-xs',
              disabled && 'opacity-50'
            )}
          >
            {description}
          </p>
        )}

        {/* Track + Thumb */}
        <div
          ref={trackRef}
          data-slot="slider-track-wrapper"
          className="group focus-visible:ring-ring relative rounded py-2 outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ touchAction: disabled ? 'auto' : 'none' }}
          role="slider"
          tabIndex={disabled ? -1 : 0}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={clampedValue}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          aria-describedby={ariaDescribedBy}
          aria-disabled={disabled || undefined}
          data-disabled={disabled || undefined}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onLostPointerCapture={handleLostPointerCapture}
          onKeyDown={handleKeyDown}
        >
          {/* Visual track background */}
          <div
            data-slot="slider-track"
            className={cn(sliderTrackVariants({ size }), trackClassName)}
          >
            {/* Filled range */}
            <div
              data-slot="slider-range"
              className={sliderRangeVariants({ variant })}
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* Thumb indicator */}
          <div
            data-slot="slider-thumb"
            className={sliderThumbVariants({ size, variant })}
            style={{ left: `${percentage}%` }}
            aria-hidden="true"
          />
        </div>

        {/* Native range input — for form submission only, rendered outside role="slider" to avoid nested-interactive */}
        <input
          ref={ref}
          type="range"
          className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
          tabIndex={-1}
          aria-hidden="true"
          id={inputId}
          name={name}
          min={min}
          max={max}
          step={step}
          value={clampedValue}
          onChange={handleChange}
          disabled={disabled}
        />

        {/* Min / Max labels */}
        {(minLabel || maxLabel) && (
          <div
            data-slot="slider-minmax"
            className={cn(
              'text-muted-foreground mt-1 flex justify-between text-xs',
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
