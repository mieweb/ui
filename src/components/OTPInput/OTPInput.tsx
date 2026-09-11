import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '../../utils/cn';

const otpCellVariants = cva(
  [
    'text-center font-semibold tabular-nums',
    'border border-input rounded-lg bg-background text-foreground',
    'caret-primary-500',
    'transition-[color,box-shadow,border-color] duration-200',
    'focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent',
    'disabled:cursor-not-allowed disabled:opacity-50',
  ],
  {
    variants: {
      size: {
        sm: 'h-10 w-9 text-lg',
        md: 'h-12 w-11 text-xl',
        lg: 'h-14 w-12 text-2xl',
      },
      hasError: {
        true: 'border-destructive focus:ring-destructive',
        false: '',
      },
    },
    defaultVariants: {
      size: 'md',
      hasError: false,
    },
  }
);

export interface OTPInputProps extends VariantProps<typeof otpCellVariants> {
  /** Current code value (controlled) */
  value: string;
  /** Called whenever the code changes */
  onChange: (value: string) => void;
  /** Called once when every cell is filled */
  onComplete?: (value: string) => void;
  /** Number of cells / expected code length (default 6) */
  length?: number;
  /** Disables every cell */
  disabled?: boolean;
  /** Focus the first cell on mount */
  autoFocus?: boolean;
  /** Visible label rendered above the field */
  label?: string;
  /** Visually hide the label (still accessible) */
  hideLabel?: boolean;
  /** Error message shown below the field (also applies error styling) */
  error?: string;
  /** Force the error styling without an error message */
  hasError?: boolean;
  /** Accessible name for the group when no visible label is provided */
  'aria-label'?: string;
  /** id used to wire up label/error relationships */
  id?: string;
  /** Base name for the underlying inputs */
  name?: string;
  /** Allowed character per cell (defaults to a single digit) */
  pattern?: RegExp;
  /** Virtual keyboard hint (default `numeric`) */
  inputMode?: 'numeric' | 'text';
  /** autoComplete for the first cell (default `one-time-code`) */
  autoComplete?: string;
  className?: string;
}

/**
 * A segmented one-time-passcode (OTP) input.
 *
 * Renders `length` single-character cells with keyboard navigation, paste
 * support, and full ARIA wiring. Controlled via `value` / `onChange`.
 *
 * @example
 * ```tsx
 * const [code, setCode] = useState('');
 * <OTPInput
 *   label="Verification code"
 *   value={code}
 *   onChange={setCode}
 *   onComplete={(c) => verify(c)}
 * />
 * ```
 */
const OTPInput = React.forwardRef<HTMLInputElement, OTPInputProps>(
  function OTPInput(
    {
      value,
      onChange,
      onComplete,
      length = 6,
      size,
      hasError,
      disabled,
      autoFocus,
      label,
      hideLabel,
      error,
      id,
      name,
      pattern = /\d/,
      inputMode = 'numeric',
      autoComplete = 'one-time-code',
      className,
      'aria-label': ariaLabel,
    },
    ref
  ) {
    const generatedId = React.useId();
    const groupId = id || generatedId;
    const labelId = `${groupId}-label`;
    const errorId = `${groupId}-error`;
    const isError = hasError || !!error;

    const inputsRef = React.useRef<Array<HTMLInputElement | null>>([]);

    const cells = React.useMemo(() => {
      const arr = value.split('').slice(0, length);
      while (arr.length < length) arr.push('');
      return arr;
    }, [value, length]);

    const setCellRef = (index: number) => (el: HTMLInputElement | null) => {
      inputsRef.current[index] = el;
      if (index === 0) {
        if (typeof ref === 'function') ref(el);
        else if (ref)
          (ref as React.MutableRefObject<HTMLInputElement | null>).current = el;
      }
    };

    const focusCell = (index: number) => {
      const clamped = Math.max(0, Math.min(index, length - 1));
      const el = inputsRef.current[clamped];
      el?.focus();
      el?.select();
    };

    const commit = (next: string) => {
      const trimmed = next.slice(0, length);
      onChange(trimmed);
      if (trimmed.length === length && !trimmed.includes(' ')) {
        onComplete?.(trimmed);
      }
    };

    const handleChange = (index: number, raw: string) => {
      const char = raw.slice(-1);
      if (char && !pattern.test(char)) return;
      const arr = value.split('');
      while (arr.length < length) arr.push('');
      arr[index] = char;
      commit(arr.join('').slice(0, length));
      if (char) focusCell(index + 1);
    };

    const handleKeyDown = (
      index: number,
      event: React.KeyboardEvent<HTMLInputElement>
    ) => {
      const arr = value.split('');
      while (arr.length < length) arr.push('');

      switch (event.key) {
        case 'Backspace': {
          event.preventDefault();
          if (arr[index]) {
            arr[index] = '';
            commit(arr.join('').slice(0, length));
          } else if (index > 0) {
            arr[index - 1] = '';
            commit(arr.join('').slice(0, length));
            focusCell(index - 1);
          }
          break;
        }
        case 'Delete': {
          event.preventDefault();
          arr[index] = '';
          commit(arr.join('').slice(0, length));
          break;
        }
        case 'ArrowLeft': {
          event.preventDefault();
          focusCell(index - 1);
          break;
        }
        case 'ArrowRight': {
          event.preventDefault();
          focusCell(index + 1);
          break;
        }
        default:
          break;
      }
    };

    const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
      event.preventDefault();
      const text = event.clipboardData.getData('text');
      const filtered = text
        .split('')
        .filter((c) => pattern.test(c))
        .join('')
        .slice(0, length);
      if (!filtered) return;
      commit(filtered);
      focusCell(Math.min(filtered.length, length - 1));
    };

    return (
      <div
        data-slot="otp-input"
        className={cn('flex flex-col gap-1.5', className)}
      >
        {label && (
          <span
            id={labelId}
            data-slot="otp-label"
            className={cn(
              'text-foreground text-sm font-medium',
              hideLabel && 'sr-only'
            )}
          >
            {label}
          </span>
        )}
        <div
          role="group"
          aria-labelledby={label ? labelId : undefined}
          aria-label={!label ? ariaLabel || 'One-time passcode' : undefined}
          aria-describedby={error ? errorId : undefined}
          className="flex items-center gap-2"
        >
          {cells.map((char, index) => (
            <input
              key={index}
              ref={setCellRef(index)}
              data-slot="otp-cell"
              type="text"
              inputMode={inputMode}
              autoComplete={index === 0 ? autoComplete : 'off'}
              // eslint-disable-next-line jsx-a11y/no-autofocus -- opt-in (default off); focusing the first cell is expected OTP UX
              autoFocus={autoFocus && index === 0}
              disabled={disabled}
              name={name ? `${name}-${index + 1}` : undefined}
              value={char}
              maxLength={1}
              aria-label={`Digit ${index + 1} of ${length}`}
              aria-invalid={isError || undefined}
              aria-describedby={error ? errorId : undefined}
              onChange={(event) => handleChange(index, event.target.value)}
              onKeyDown={(event) => handleKeyDown(index, event)}
              onPaste={handlePaste}
              onFocus={(event) => event.currentTarget.select()}
              className={cn(otpCellVariants({ size, hasError: isError }))}
            />
          ))}
        </div>
        {error && (
          <p
            id={errorId}
            data-slot="otp-error"
            role="alert"
            className="text-destructive text-sm"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

OTPInput.displayName = 'OTPInput';

export { OTPInput, otpCellVariants };
