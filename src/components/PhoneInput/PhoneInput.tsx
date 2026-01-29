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

// =============================================================================
// Phone Types
// =============================================================================

export type PhoneType = 'cell' | 'landline' | 'home' | 'work' | 'fax';

export interface PhoneEntry {
  number: string;
  type: PhoneType;
}

const PHONE_TYPES: { value: PhoneType; label: string }[] = [
  { value: 'cell', label: 'Cell' },
  { value: 'landline', label: 'Landline' },
  { value: 'home', label: 'Home' },
  { value: 'work', label: 'Work' },
  { value: 'fax', label: 'Fax' },
];

// =============================================================================
// PhoneInputGroup
// =============================================================================

export interface PhoneInputGroupProps {
  /** Array of phone entries */
  value: PhoneEntry[];
  /** Callback when phone entries change */
  onChange: (phones: PhoneEntry[]) => void;
  /** Minimum number of phone entries (default: 1) */
  minEntries?: number;
  /** Maximum number of phone entries (default: 5) */
  maxEntries?: number;
  /** Whether the first entry is required */
  required?: boolean;
  /** Whether all inputs are disabled */
  disabled?: boolean;
  /** Validate on blur */
  validateOnBlur?: boolean;
  /** Label for the phone input */
  label?: string;
  /** Labels for type options (for i18n) */
  typeLabels?: Record<PhoneType, string>;
  /** Custom className */
  className?: string;
}

/**
 * A group of phone inputs with type selection and add/remove functionality.
 *
 * @example
 * ```tsx
 * const [phones, setPhones] = useState<PhoneEntry[]>([
 *   { number: '', type: 'cell' }
 * ]);
 *
 * <PhoneInputGroup
 *   value={phones}
 *   onChange={setPhones}
 *   required
 * />
 * ```
 */
function PhoneInputGroup({
  value,
  onChange,
  minEntries = 1,
  maxEntries = 5,
  required = false,
  disabled = false,
  validateOnBlur = false,
  label,
  typeLabels,
  className,
}: PhoneInputGroupProps) {
  // Ensure we always have at least minEntries
  const phones = React.useMemo(() => {
    if (value.length >= minEntries) return value;
    const padding: PhoneEntry[] = Array(minEntries - value.length)
      .fill(null)
      .map(() => ({ number: '', type: 'cell' as PhoneType }));
    return [...value, ...padding];
  }, [value, minEntries]);

  const handlePhoneChange = (index: number, number: string) => {
    const updated = [...phones];
    updated[index] = { ...updated[index], number };
    onChange(updated);
  };

  const handleTypeChange = (index: number, type: PhoneType) => {
    const updated = [...phones];
    updated[index] = { ...updated[index], type };
    onChange(updated);
  };

  const handleAdd = () => {
    if (phones.length < maxEntries) {
      onChange([...phones, { number: '', type: 'cell' }]);
    }
  };

  const handleRemove = (index: number) => {
    if (phones.length > minEntries) {
      onChange(phones.filter((_, i) => i !== index));
    }
  };

  const getTypeLabel = (type: PhoneType): string => {
    if (typeLabels?.[type]) return typeLabels[type];
    return PHONE_TYPES.find((t) => t.value === type)?.label || type;
  };

  const canAdd = phones.length < maxEntries;
  const canRemove = phones.length > minEntries;

  return (
    <div className={cn('space-y-3', className)}>
      {phones.map((phone, index) => (
        <div key={index} className="flex items-start gap-2">
          {/* Phone number input */}
          <div className="flex-1">
            <PhoneInput
              label={index === 0 ? label : undefined}
              value={phone.number}
              onChange={(num) => handlePhoneChange(index, num)}
              disabled={disabled}
              validateOnBlur={validateOnBlur}
              required={required && index === 0}
            />
          </div>

          {/* Type selector */}
          <div className="w-32 shrink-0">
            <label htmlFor={`phone-type-${index}`} className="sr-only">Phone type</label>
            <select
              id={`phone-type-${index}`}
              value={phone.type}
              onChange={(e) =>
                handleTypeChange(index, e.target.value as PhoneType)
              }
              disabled={disabled}
              className={cn(
                'w-full rounded-md border px-3 py-2 text-sm',
                'border-gray-300 bg-white text-gray-900',
                'focus:border-brand-500 focus:ring-brand-500/20 focus:ring-2 focus:outline-none',
                'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
                'dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100',
                'dark:focus:border-brand-400 dark:focus:ring-brand-400/20',
                index === 0 && label ? 'mt-6' : ''
              )}
            >
              {PHONE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {getTypeLabel(type.value)}
                </option>
              ))}
            </select>
          </div>

          {/* Add/Remove buttons */}
          <div
            className={cn(
              'flex shrink-0 items-center',
              index === 0 && label ? 'mt-6' : ''
            )}
          >
            {index === 0 ? (
              <button
                type="button"
                onClick={handleAdd}
                disabled={disabled || !canAdd}
                className={cn(
                  'rounded-full p-2 transition-colors',
                  'text-brand-600 hover:bg-brand-50',
                  'disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent',
                  'dark:text-brand-400 dark:hover:bg-brand-900/20',
                  'dark:disabled:text-gray-600'
                )}
                aria-label="Add phone number"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleRemove(index)}
                disabled={disabled || !canRemove}
                className={cn(
                  'rounded-full p-2 transition-colors',
                  'text-red-600 hover:bg-red-50',
                  'disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent',
                  'dark:text-red-400 dark:hover:bg-red-900/20',
                  'dark:disabled:text-gray-600'
                )}
                aria-label="Remove phone number"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 12H4"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

PhoneInputGroup.displayName = 'PhoneInputGroup';

export { PhoneInput, PhoneInputGroup };
