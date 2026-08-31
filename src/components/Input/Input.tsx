import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const inputVariants = cva(
  [
    'w-full px-3 py-2',
    'border border-input rounded-lg',
    'bg-background text-foreground',
    'placeholder:text-muted-foreground',
    'transition-colors duration-200',
    'focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent',
    'disabled:cursor-not-allowed disabled:opacity-50',
  ],
  {
    variants: {
      size: {
        sm: 'h-8 text-sm',
        md: 'h-10 text-base',
        lg: 'h-12 text-lg',
      },
      hasError: {
        true: 'border-destructive focus:ring-destructive',
        false: '',
      },
      labelVariant: {
        stacked: '',
        floating: 'peer placeholder:text-transparent',
      },
    },
    compoundVariants: [
      // Floating labels need extra height and asymmetric padding so both
      // the floated label and the entered text fit inside the field.
      { labelVariant: 'floating', size: 'sm', className: 'h-11 pt-4 pb-1' },
      { labelVariant: 'floating', size: 'md', className: 'h-14 pt-5 pb-1.5' },
      { labelVariant: 'floating', size: 'lg', className: 'h-16 pt-6 pb-2' },
    ],
    defaultVariants: {
      size: 'md',
      hasError: false,
      labelVariant: 'stacked',
    },
  }
);

const floatingLabelVariants = cva(
  [
    'absolute start-3 pointer-events-none select-none',
    'text-muted-foreground',
    'transition-all duration-200 ease-out',
    // Rest state: vertically centered, placeholder-sized (input is empty and unfocused).
    'top-1/2 -translate-y-1/2',
    // Floated state: focused, has a value, or was autofilled → shrink and move to the top,
    // staying inside the field.
    'peer-focus:translate-y-0 peer-[:not(:placeholder-shown)]:translate-y-0 peer-autofill:translate-y-0',
  ],
  {
    variants: {
      size: {
        sm: [
          'text-sm',
          'peer-focus:top-0.5 peer-[:not(:placeholder-shown)]:top-0.5 peer-autofill:top-0.5',
          'peer-focus:text-[0.65rem] peer-[:not(:placeholder-shown)]:text-[0.65rem] peer-autofill:text-[0.65rem]',
        ],
        md: [
          'text-base',
          'peer-focus:top-1 peer-[:not(:placeholder-shown)]:top-1 peer-autofill:top-1',
          'peer-focus:text-xs peer-[:not(:placeholder-shown)]:text-xs peer-autofill:text-xs',
        ],
        lg: [
          'text-lg',
          'peer-focus:top-1.5 peer-[:not(:placeholder-shown)]:top-1.5 peer-autofill:top-1.5',
          'peer-focus:text-sm peer-[:not(:placeholder-shown)]:text-sm peer-autofill:text-sm',
        ],
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

export interface InputProps
  extends
    Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  /** Error message to display below the input */
  error?: string;
  /** Helper text to display below the input */
  helperText?: string;
  /** Label for the input */
  label?: string;
  /**
   * How the label is rendered.
   * - `stacked` (default): label above the input.
   * - `floating`: label rests inside the input like a placeholder and floats
   *   to the top of the field (staying inside it) when focused or filled.
   *   Incompatible with `hideLabel` and ignores `placeholder`.
   */
  labelVariant?: 'stacked' | 'floating';
  /** Whether the label should be visually hidden (still accessible) */
  hideLabel?: boolean;
  /** Whether the input is required */
  required?: boolean;
}

/**
 * A styled input component with support for labels, errors, and helper text.
 *
 * @example
 * ```tsx
 * <Input label="Email" type="email" placeholder="you@example.com" />
 * <Input label="Password" type="password" error="Password is required" hasError />
 * <Input label="Account number" labelVariant="floating" />
 * ```
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      size,
      hasError,
      error,
      helperText,
      label,
      labelVariant = 'stacked',
      hideLabel,
      required,
      disabled,
      id,
      placeholder,
      'aria-describedby': ariaDescribedBy,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    const describedByIds = [
      error ? errorId : null,
      helperText && !error ? helperId : null,
      ariaDescribedBy,
    ]
      .filter(Boolean)
      .join(' ');

    const isFloating = labelVariant === 'floating' && !!label && !hideLabel;

    const requiredMark = required && (
      <span className="text-destructive ms-1" aria-hidden="true">
        *
      </span>
    );

    const inputElement = (
      <input
        data-slot="input"
        id={inputId}
        ref={ref}
        className={cn(
          inputVariants({
            size,
            hasError: hasError || !!error,
            labelVariant: isFloating ? 'floating' : 'stacked',
          }),
          className
        )}
        aria-invalid={hasError || !!error}
        aria-describedby={describedByIds || undefined}
        required={required}
        disabled={disabled}
        // A single-space placeholder keeps :placeholder-shown reliable so the
        // label can float via CSS alone; a user placeholder would clash with
        // the resting label.
        placeholder={isFloating ? ' ' : placeholder}
        {...props}
      />
    );

    return (
      <div
        data-slot="input-wrapper"
        className={cn('flex flex-col gap-1.5', disabled && 'opacity-50')}
      >
        {label && !isFloating && (
          <label
            data-slot="input-label"
            htmlFor={inputId}
            className={cn(
              'text-foreground text-sm font-medium',
              hideLabel && 'sr-only'
            )}
          >
            {label}
            {requiredMark}
          </label>
        )}
        {isFloating ? (
          <div className="relative">
            {inputElement}
            <label
              data-slot="input-label"
              htmlFor={inputId}
              className={floatingLabelVariants({ size })}
            >
              {label}
              {requiredMark}
            </label>
          </div>
        ) : (
          inputElement
        )}
        {error && (
          <p
            id={errorId}
            data-slot="input-error"
            className="text-destructive-700 dark:text-destructive-400 text-sm"
            role="alert"
          >
            {error}
          </p>
        )}
        {helperText && !error && (
          <p
            id={helperId}
            data-slot="input-helper"
            className="text-muted-foreground text-sm"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input, inputVariants };
