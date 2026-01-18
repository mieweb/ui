import * as React from 'react';
import { cn } from '../../utils/cn';
import {
  formatDateValue,
  isValidDate,
  isDateInPast,
  isDateInFuture,
  calculateAge,
} from '../../utils/date';
import { Input, type InputProps } from '../Input';

export type DateInputMode =
  | 'default'
  | 'dob'
  | 'expiration'
  | 'past'
  | 'future';

export interface DateInputProps extends Omit<
  InputProps,
  'type' | 'onChange' | 'value'
> {
  /** The date value in MM/DD/YYYY format */
  value?: string;
  /** Callback fired when the value changes */
  onChange?: (value: string) => void;
  /** Validation mode for the date input */
  mode?: DateInputMode;
  /** Minimum age for DOB validation (default: 0) */
  minAge?: number;
  /** Maximum age for DOB validation */
  maxAge?: number;
  /** Whether to validate on blur */
  validateOnBlur?: boolean;
}

function getValidationError(
  value: string,
  mode: DateInputMode,
  minAge?: number,
  maxAge?: number
): string | undefined {
  if (!value || value.replace(/\D/g, '').length === 0) {
    return undefined;
  }

  if (!isValidDate(value)) {
    return 'Please enter a valid date (MM/DD/YYYY)';
  }

  switch (mode) {
    case 'dob': {
      if (!isDateInPast(value)) {
        return 'Date of birth must be in the past';
      }
      const age = calculateAge(value);
      if (age !== null) {
        if (minAge !== undefined && age < minAge) {
          return `Must be at least ${minAge} years old`;
        }
        if (maxAge !== undefined && age > maxAge) {
          return `Must be no more than ${maxAge} years old`;
        }
      }
      break;
    }
    case 'expiration':
      if (!isDateInFuture(value)) {
        return 'Expiration date must be in the future';
      }
      break;
    case 'past':
      if (!isDateInPast(value)) {
        return 'Date must be in the past';
      }
      break;
    case 'future':
      if (!isDateInFuture(value)) {
        return 'Date must be in the future';
      }
      break;
  }

  return undefined;
}

/**
 * A date input that automatically formats to MM/DD/YYYY with validation modes.
 *
 * @example
 * ```tsx
 * // Date of birth with age validation
 * <DateInput
 *   label="Date of Birth"
 *   mode="dob"
 *   minAge={18}
 *   validateOnBlur
 * />
 *
 * // Expiration date
 * <DateInput
 *   label="License Expiration"
 *   mode="expiration"
 *   validateOnBlur
 * />
 * ```
 */
const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  (
    {
      value = '',
      onChange,
      mode = 'default',
      minAge,
      maxAge,
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
      formatDateValue(value)
    );
    const [localError, setLocalError] = React.useState<string | undefined>();

    // Sync external value changes
    React.useEffect(() => {
      setDisplayValue(formatDateValue(value));
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatDateValue(e.target.value);
      setDisplayValue(formatted);
      onChange?.(formatted);

      // Clear error when user starts typing again
      if (localError) {
        setLocalError(undefined);
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      onBlur?.(e);

      if (validateOnBlur) {
        const validationError = getValidationError(
          displayValue,
          mode,
          minAge,
          maxAge
        );
        setLocalError(validationError);
      }
    };

    const placeholder = mode === 'expiration' ? 'MM/DD/YYYY' : 'MM/DD/YYYY';
    const autoComplete =
      mode === 'dob' ? 'bday' : mode === 'expiration' ? 'cc-exp' : undefined;

    return (
      <Input
        ref={ref}
        type="text"
        inputMode="numeric"
        autoComplete={autoComplete}
        placeholder={placeholder}
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

DateInput.displayName = 'DateInput';

export { DateInput };
