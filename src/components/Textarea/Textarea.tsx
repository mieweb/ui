import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const textareaVariants = cva(
  [
    'w-full px-3 py-2',
    'border border-input rounded-lg',
    'bg-background text-foreground',
    'placeholder:text-muted-foreground',
    'transition-colors duration-200',
    'focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'resize-y',
  ],
  {
    variants: {
      size: {
        sm: 'text-sm min-h-[60px]',
        md: 'text-base min-h-[80px]',
        lg: 'text-lg min-h-[100px]',
      },
      hasError: {
        true: 'border-destructive focus:ring-destructive',
        false: '',
      },
      resize: {
        none: 'resize-none',
        vertical: 'resize-y',
        horizontal: 'resize-x',
        both: 'resize',
      },
      labelVariant: {
        stacked: '',
        floating: 'peer placeholder:text-transparent',
      },
    },
    compoundVariants: [
      // Floating labels reserve top padding so entered text always starts
      // below the floated label, plus a little extra min-height.
      {
        labelVariant: 'floating',
        size: 'sm',
        className: 'pt-5 min-h-[76px]',
      },
      {
        labelVariant: 'floating',
        size: 'md',
        className: 'pt-6 min-h-[96px]',
      },
      {
        labelVariant: 'floating',
        size: 'lg',
        className: 'pt-7 min-h-[120px]',
      },
    ],
    defaultVariants: {
      size: 'md',
      hasError: false,
      resize: 'vertical',
      labelVariant: 'stacked',
    },
  }
);

const floatingLabelVariants = cva(
  [
    'absolute start-3 pointer-events-none select-none',
    'transition-all duration-200 ease-out',
  ],
  {
    variants: {
      size: {
        sm: [
          'text-sm top-3',
          'peer-focus:top-1 peer-[:not(:placeholder-shown)]:top-1 peer-autofill:top-1',
          'peer-focus:text-[0.65rem] peer-[:not(:placeholder-shown)]:text-[0.65rem] peer-autofill:text-[0.65rem]',
        ],
        md: [
          'text-base top-4',
          'peer-focus:top-1.5 peer-[:not(:placeholder-shown)]:top-1.5 peer-autofill:top-1.5',
          'peer-focus:text-xs peer-[:not(:placeholder-shown)]:text-xs peer-autofill:text-xs',
        ],
        lg: [
          'text-lg top-5',
          'peer-focus:top-2 peer-[:not(:placeholder-shown)]:top-2 peer-autofill:top-2',
          'peer-focus:text-sm peer-[:not(:placeholder-shown)]:text-sm peer-autofill:text-sm',
        ],
      },
      hasError: {
        true: 'text-destructive',
        false: 'text-muted-foreground',
      },
    },
    defaultVariants: {
      size: 'md',
      hasError: false,
    },
  }
);

export interface TextareaProps
  extends
    Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'>,
    VariantProps<typeof textareaVariants> {
  /** Label for the textarea */
  label?: string;
  /**
   * How the label is rendered.
   * - `stacked` (default): label above the textarea.
   * - `floating`: label rests inside the textarea like a placeholder and
   *   floats to the top (staying inside it) when focused or filled.
   *   Incompatible with `hideLabel` and ignores `placeholder`.
   */
  labelVariant?: 'stacked' | 'floating';
  /** Whether the label should be visually hidden */
  hideLabel?: boolean;
  /** Error message to display */
  error?: string;
  /** Helper text to display */
  helperText?: string;
  /** Maximum character count */
  maxLength?: number;
  /** Show character count */
  showCount?: boolean;
  /** Auto-resize based on content */
  autoResize?: boolean;
}

/**
 * A multi-line text input component with character count and auto-resize.
 *
 * @example
 * ```tsx
 * <Textarea label="Description" placeholder="Enter a description..." />
 * <Textarea
 *   label="Bio"
 *   maxLength={280}
 *   showCount
 *   helperText="Tell us about yourself"
 * />
 * ```
 */
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      size,
      hasError,
      resize,
      label,
      labelVariant = 'stacked',
      hideLabel,
      error,
      helperText,
      maxLength,
      showCount = false,
      autoResize = false,
      id,
      value,
      defaultValue,
      onChange,
      placeholder,
      'aria-describedby': ariaDescribedBy,
      ...props
    },
    ref
  ) => {
    const internalRef = React.useRef<HTMLTextAreaElement>(null);
    const [internalValue, setInternalValue] = React.useState(
      (defaultValue as string) || ''
    );

    const generatedId = React.useId();
    const textareaId = id || generatedId;
    const errorId = `${textareaId}-error`;
    const helperId = `${textareaId}-helper`;
    const countId = `${textareaId}-count`;

    // Combine refs
    React.useImperativeHandle(ref, () => internalRef.current!);

    // Get current value
    const currentValue = value !== undefined ? String(value) : internalValue;
    const characterCount = currentValue.length;

    // Auto-resize logic
    const adjustHeight = React.useCallback(() => {
      const textarea = internalRef.current;
      if (textarea && autoResize) {
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
      }
    }, [autoResize]);

    React.useEffect(() => {
      adjustHeight();
    }, [currentValue, adjustHeight]);

    // Handle change
    const handleChange = React.useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (value === undefined) {
          setInternalValue(e.target.value);
        }
        onChange?.(e);
        adjustHeight();
      },
      [value, onChange, adjustHeight]
    );

    // Build aria-describedby
    const describedByIds = [
      error ? errorId : null,
      helperText && !error ? helperId : null,
      showCount ? countId : null,
      ariaDescribedBy,
    ]
      .filter(Boolean)
      .join(' ');

    const isFloating = labelVariant === 'floating' && !!label && !hideLabel;

    const textareaElement = (
      <textarea
        data-slot="textarea"
        ref={internalRef}
        id={textareaId}
        value={value}
        defaultValue={value === undefined ? defaultValue : undefined}
        onChange={handleChange}
        maxLength={maxLength}
        aria-invalid={hasError || !!error}
        aria-describedby={describedByIds || undefined}
        // A single-space placeholder keeps :placeholder-shown reliable so the
        // label can float via CSS alone.
        placeholder={isFloating ? ' ' : placeholder}
        className={cn(
          textareaVariants({
            size,
            hasError: hasError || !!error,
            resize: autoResize ? 'none' : resize,
            labelVariant: isFloating ? 'floating' : 'stacked',
          }),
          className
        )}
        {...props}
      />
    );

    return (
      <div data-slot="textarea-wrapper" className="flex flex-col gap-1.5">
        {label && !isFloating && (
          <label
            data-slot="textarea-label"
            htmlFor={textareaId}
            className={cn(
              'text-foreground text-sm font-medium',
              hideLabel && 'sr-only'
            )}
          >
            {label}
          </label>
        )}
        {isFloating ? (
          <div className="relative">
            {textareaElement}
            <label
              data-slot="textarea-label"
              htmlFor={textareaId}
              className={floatingLabelVariants({
                size,
                hasError: hasError || !!error,
              })}
            >
              {label}
            </label>
          </div>
        ) : (
          textareaElement
        )}
        <div
          data-slot="textarea-footer"
          className="flex items-center justify-between gap-2"
        >
          <div className="flex-1">
            {error && (
              <p
                id={errorId}
                data-slot="textarea-error"
                className="text-destructive-700 dark:text-destructive-400 text-sm"
                role="alert"
              >
                {error}
              </p>
            )}
            {helperText && !error && (
              <p
                id={helperId}
                data-slot="textarea-helper"
                className="text-muted-foreground text-sm"
              >
                {helperText}
              </p>
            )}
          </div>
          {showCount && (
            <p
              id={countId}
              data-slot="textarea-count"
              className={cn(
                'text-muted-foreground shrink-0 text-xs',
                maxLength && characterCount >= maxLength && 'text-destructive'
              )}
            >
              {characterCount}
              {maxLength && `/${maxLength}`}
            </p>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export { Textarea, textareaVariants };
