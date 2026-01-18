import * as React from 'react';
import { cn } from '../../utils/cn';
import {
  formatPhoneNumber,
  unformatPhoneNumber,
  isValidPhoneNumber,
} from '../../utils/phone';
import { Input, type InputProps } from '../Input';

export interface PhoneInputProps extends Omit<
  InputProps,
  'type' | 'onChange' | 'value'
> {
  /** The phone number value (can be formatted or unformatted) */
  value?: string;
  /** Callback fired when the value changes, receives the unformatted value */
  onChange?: (value: string) => void;
  /** Callback fired when the formatted value changes */
  onFormattedChange?: (formattedValue: string) => void;
  /** Whether to validate and show error state for incomplete phone numbers */
  validateOnBlur?: boolean;
}

/**
 * A phone number input that automatically formats to US format: (XXX) XXX-XXXX
 *
 * @example
 * ```tsx
 * const [phone, setPhone] = useState('');
 * <PhoneInput
 *   label="Phone Number"
 *   value={phone}
 *   onChange={setPhone}
 *   validateOnBlur
 * />
 * ```
 */
const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  (
    {
      value = '',
      onChange,
      onFormattedChange,
      validateOnBlur,
      className,
      onBlur,
      hasError,
      error,
      ...props
    },
    ref
  ) => {
    const [displayValue, setDisplayValue] = React.useState(() =>
      formatPhoneNumber(value)
    );
    const [localError, setLocalError] = React.useState<string | undefined>();

    // Sync external value changes
    React.useEffect(() => {
      setDisplayValue(formatPhoneNumber(value));
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatPhoneNumber(e.target.value);
      setDisplayValue(formatted);

      const unformatted = unformatPhoneNumber(formatted);
      onChange?.(unformatted);
      onFormattedChange?.(formatted);

      // Clear error when user starts typing again
      if (localError) {
        setLocalError(undefined);
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      onBlur?.(e);

      if (validateOnBlur) {
        const unformatted = unformatPhoneNumber(displayValue);
        if (unformatted.length > 0 && !isValidPhoneNumber(displayValue)) {
          setLocalError('Please enter a valid 10-digit phone number');
        } else {
          setLocalError(undefined);
        }
      }
    };

    return (
      <Input
        ref={ref}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        placeholder="(555) 555-5555"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        hasError={hasError || !!localError}
        error={error || localError}
        className={cn(className)}
        {...props}
      />
    );
  }
);

PhoneInput.displayName = 'PhoneInput';

export { PhoneInput };
