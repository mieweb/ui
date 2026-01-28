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
import { Calendar } from 'lucide-react';

export type DateInputMode =
  | 'default'
  | 'dob'
  | 'expiration'
  | 'past'
  | 'future';

export type DateInputWidth = 'full' | 'fit' | 'fixed';

const widthClasses: Record<DateInputWidth, string> = {
  full: 'w-full',
  fit: 'w-fit',
  fixed: 'w-44', // ~176px - enough for MM/DD/YYYY + calendar icon
};

const sizeClasses = {
  sm: 'h-8 text-sm',
  md: 'h-10 text-base',
  lg: 'h-12 text-lg',
} as const;

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
  /** Whether to show a calendar picker button */
  showCalendar?: boolean;
  /** Width behavior of the input */
  width?: DateInputWidth;
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
 * // With calendar picker
 * <DateInput
 *   label="Select Date"
 *   showCalendar
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
      showCalendar = false,
      width = 'full',
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

    // Generate stable ID for accessibility
    const generatedId = React.useId();

    // Calendar picker state
    const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);
    const calendarRef = React.useRef<HTMLDivElement>(null);
    const buttonRef = React.useRef<HTMLButtonElement>(null);

    // Parse current value into date parts for calendar
    const parsedDate = React.useMemo(() => {
      if (!displayValue || !isValidDate(displayValue)) {
        return {
          month: new Date().getMonth(),
          year: new Date().getFullYear(),
          day: null,
        };
      }
      const [month, day, year] = displayValue.split('/').map(Number);
      return { month: month - 1, year, day };
    }, [displayValue]);

    const [calendarMonth, setCalendarMonth] = React.useState(parsedDate.month);
    const [calendarYear, setCalendarYear] = React.useState(parsedDate.year);

    // Update calendar view when value changes
    React.useEffect(() => {
      if (displayValue && isValidDate(displayValue)) {
        const [month, , year] = displayValue.split('/').map(Number);
        setCalendarMonth(month - 1);
        setCalendarYear(year);
      }
    }, [displayValue]);

    // Close calendar on click outside
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          calendarRef.current &&
          !calendarRef.current.contains(event.target as HTMLElement) &&
          buttonRef.current &&
          !buttonRef.current.contains(event.target as HTMLElement)
        ) {
          setIsCalendarOpen(false);
        }
      };

      if (isCalendarOpen) {
        document.addEventListener('mousedown', handleClickOutside);
        return () =>
          document.removeEventListener('mousedown', handleClickOutside);
      }
    }, [isCalendarOpen]);

    // Close on Escape key
    React.useEffect(() => {
      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          setIsCalendarOpen(false);
          buttonRef.current?.focus();
        }
      };

      if (isCalendarOpen) {
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
      }
    }, [isCalendarOpen]);

    const handleDateSelect = (day: number) => {
      const month = String(calendarMonth + 1).padStart(2, '0');
      const dayStr = String(day).padStart(2, '0');
      const year = String(calendarYear);
      const formatted = `${month}/${dayStr}/${year}`;
      setDisplayValue(formatted);
      onChange?.(formatted);
      setIsCalendarOpen(false);

      // Validate if needed
      if (validateOnBlur) {
        const validationError = getValidationError(
          formatted,
          mode,
          minAge,
          maxAge
        );
        setLocalError(validationError);
      }
    };

    const getDaysInMonth = (month: number, year: number) => {
      return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (month: number, year: number) => {
      return new Date(year, month, 1).getDay();
    };

    const renderCalendar = () => {
      const daysInMonth = getDaysInMonth(calendarMonth, calendarYear);
      const firstDay = getFirstDayOfMonth(calendarMonth, calendarYear);
      const days: (number | null)[] = [];

      // Add empty cells for days before the first day of the month
      for (let i = 0; i < firstDay; i++) {
        days.push(null);
      }

      // Add the days of the month
      for (let i = 1; i <= daysInMonth; i++) {
        days.push(i);
      }

      const monthNames = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ];

      const isSelectedDay = (day: number) => {
        return (
          parsedDate.day === day &&
          parsedDate.month === calendarMonth &&
          parsedDate.year === calendarYear
        );
      };

      const isToday = (day: number) => {
        const today = new Date();
        return (
          day === today.getDate() &&
          calendarMonth === today.getMonth() &&
          calendarYear === today.getFullYear()
        );
      };

      return (
        <div
          ref={calendarRef}
          className={cn(
            'absolute top-full left-0 z-50 mt-1',
            'bg-background border-border rounded-lg border shadow-lg',
            'w-72 p-3'
          )}
          role="dialog"
          aria-label="Choose date"
        >
          {/* Header with month/year navigation */}
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                if (calendarMonth === 0) {
                  setCalendarMonth(11);
                  setCalendarYear(calendarYear - 1);
                } else {
                  setCalendarMonth(calendarMonth - 1);
                }
              }}
              className="hover:bg-muted rounded-md p-1 transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeftIcon />
            </button>
            <div className="flex items-center gap-2">
              <select
                value={calendarMonth}
                onChange={(e) => setCalendarMonth(Number(e.target.value))}
                className="bg-background border-border rounded border px-2 py-1 text-sm"
                aria-label="Select month"
              >
                {monthNames.map((name, i) => (
                  <option key={name} value={i}>
                    {name}
                  </option>
                ))}
              </select>
              <select
                value={calendarYear}
                onChange={(e) => setCalendarYear(Number(e.target.value))}
                className="bg-background border-border rounded border px-2 py-1 text-sm"
                aria-label="Select year"
              >
                {Array.from(
                  { length: 150 },
                  (_, i) => new Date().getFullYear() - 100 + i
                ).map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => {
                if (calendarMonth === 11) {
                  setCalendarMonth(0);
                  setCalendarYear(calendarYear + 1);
                } else {
                  setCalendarMonth(calendarMonth + 1);
                }
              }}
              className="hover:bg-muted rounded-md p-1 transition-colors"
              aria-label="Next month"
            >
              <ChevronRightIcon />
            </button>
          </div>

          {/* Day headers */}
          <div className="mb-1 grid grid-cols-7 gap-1">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
              <div
                key={day}
                className="text-muted-foreground py-1 text-center text-xs font-medium"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => (
              <button
                key={index}
                type="button"
                disabled={day === null}
                onClick={() => day && handleDateSelect(day)}
                className={cn(
                  'h-8 w-8 rounded-md text-sm transition-colors',
                  'focus:ring-ring focus:ring-2 focus:outline-none',
                  day === null && 'invisible',
                  day !== null && 'hover:bg-muted',
                  isSelectedDay(day!) &&
                    'bg-primary-800 hover:bg-primary-700 text-white',
                  isToday(day!) &&
                    !isSelectedDay(day!) &&
                    'border-primary-800 text-primary-800 border'
                )}
              >
                {day}
              </button>
            ))}
          </div>

          {/* Today button */}
          <div className="border-border mt-3 border-t pt-3">
            <button
              type="button"
              onClick={() => {
                const today = new Date();
                setCalendarMonth(today.getMonth());
                setCalendarYear(today.getFullYear());
                handleDateSelect(today.getDate());
              }}
              className="text-primary-800 w-full text-sm hover:underline"
            >
              Today
            </button>
          </div>
        </div>
      );
    };

    if (showCalendar) {
      // Extract label/error/helper and component-specific props to handle positioning correctly
      // Filter out Input component props that aren't valid HTML input attributes
      const { label, helperText, hideLabel, required, size, ...inputProps } =
        props;
      // Ensure size has a valid value (fallback to 'md' if null/undefined)
      const resolvedSize = size ?? 'md';
      const inputId = inputProps.id || generatedId;
      const errorId = `${inputId}-error`;
      const helperId = `${inputId}-helper`;
      const showError = hasError || !!localError;
      const errorMessage = error || localError;

      return (
        <div className={cn('flex flex-col gap-1.5', widthClasses[width])}>
          {label && (
            <label
              htmlFor={inputId}
              className={cn(
                'text-foreground text-sm font-medium',
                hideLabel && 'sr-only'
              )}
            >
              {label}
              {required && (
                <span
                  className="ml-1"
                  style={{ color: '#ef4444' }}
                  aria-hidden="true"
                >
                  *
                </span>
              )}
            </label>
          )}
          <div className="relative">
            <input
              ref={ref}
              id={inputId}
              type="text"
              inputMode="numeric"
              autoComplete={autoComplete}
              placeholder={placeholder}
              value={displayValue}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={showError}
              aria-describedby={
                [errorMessage ? errorId : null, helperText ? helperId : null]
                  .filter(Boolean)
                  .join(' ') || undefined
              }
              className={cn(
                'w-full px-3 py-2',
                'rounded-lg border',
                'bg-background text-foreground',
                'placeholder:text-muted-foreground',
                'transition-colors duration-200',
                'focus:ring-ring focus:border-transparent focus:ring-2 focus:outline-none',
                'disabled:cursor-not-allowed disabled:opacity-50',
                sizeClasses[resolvedSize],
                showError
                  ? 'border-destructive focus:ring-destructive'
                  : 'border-input',
                'pr-10',
                className
              )}
              {...inputProps}
            />
            <button
              ref={buttonRef}
              type="button"
              onClick={() => setIsCalendarOpen(!isCalendarOpen)}
              className={cn(
                'absolute top-1/2 right-3 -translate-y-1/2',
                'text-muted-foreground hover:text-foreground',
                'focus:text-foreground focus:outline-none',
                'transition-colors'
              )}
              aria-label="Open calendar"
              aria-expanded={isCalendarOpen}
              aria-haspopup="dialog"
            >
              <Calendar size={18} />
            </button>
            {isCalendarOpen && renderCalendar()}
          </div>
          {errorMessage && (
            <p
              id={errorId}
              className="text-sm"
              style={{ color: '#ef4444' }}
              role="alert"
            >
              {errorMessage}
            </p>
          )}
          {helperText && !errorMessage && (
            <p id={helperId} className="text-muted-foreground text-sm">
              {helperText}
            </p>
          )}
        </div>
      );
    }

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
        className={cn(widthClasses[width], className)}
        {...props}
      />
    );
  }
);

DateInput.displayName = 'DateInput';

// Simple icon components
function ChevronLeftIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

export { DateInput };
