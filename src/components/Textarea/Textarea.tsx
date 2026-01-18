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
    },
    defaultVariants: {
      size: 'md',
      hasError: false,
      resize: 'vertical',
    },
  }
);

export interface TextareaProps
  extends
    Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'>,
    VariantProps<typeof textareaVariants> {
  /** Label for the textarea */
  label?: string;
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
      helperText ? helperId : null,
      showCount ? countId : null,
      ariaDescribedBy,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className={cn(
              'text-foreground text-sm font-medium',
              hideLabel && 'sr-only'
            )}
          >
            {label}
          </label>
        )}
        <textarea
          ref={internalRef}
          id={textareaId}
          value={value}
          defaultValue={value === undefined ? defaultValue : undefined}
          onChange={handleChange}
          maxLength={maxLength}
          aria-invalid={hasError || !!error}
          aria-describedby={describedByIds || undefined}
          className={cn(
            textareaVariants({
              size,
              hasError: hasError || !!error,
              resize: autoResize ? 'none' : resize,
            }),
            className
          )}
          {...props}
        />
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1">
            {error && (
              <p id={errorId} className="text-destructive text-sm" role="alert">
                {error}
              </p>
            )}
            {helperText && !error && (
              <p id={helperId} className="text-muted-foreground text-sm">
                {helperText}
              </p>
            )}
          </div>
          {showCount && (
            <p
              id={countId}
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
