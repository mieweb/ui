import * as React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils/cn';
import {
  formatDateValue,
  isValidDate,
  parseDateValue,
  isDateInPast,
  isDateInFuture,
  calculateAge,
} from '../../utils/date';
import {
  Input,
  inputVariants,
  floatingLabelVariants,
  type InputProps,
} from '../Input';
import { Calendar, Clock } from 'lucide-react';
import { useAnchoredPosition } from '../../hooks/useAnchoredPosition';

export type DateInputMode =
  | 'default'
  | 'dob'
  | 'expiration'
  | 'past'
  | 'future';

export type DateInputType =
  | 'date'
  | 'datetime-local'
  | 'time'
  | 'month'
  | 'year';

export type DateInputWidth = 'full' | 'fit' | 'fixed';

export type DateInputTimeFormat = '12-hour' | '24-hour';

const widthClasses: Record<DateInputWidth, string> = {
  full: 'w-full',
  fit: 'w-fit',
  fixed: 'w-44', // ~176px - enough for MM/DD/YYYY + calendar icon
};

const MONTH_NAMES = [
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

interface PickerDate {
  month: number;
  year: number;
  day: number | null;
}

function isValidPickerDate(year: number, month: number, day: number): boolean {
  return (
    Number.isFinite(year) &&
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= new Date(year, month, 0).getDate()
  );
}

function parsePickerDate(
  value: string,
  inputType: DateInputType
): PickerDate | undefined {
  if (inputType === 'datetime-local') {
    const match = /^(\d{4})-(\d{2})-(\d{2})T\d{2}:\d{2}$/.exec(value);
    if (!match) return undefined;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const [hour, minute] = value.slice(-5).split(':').map(Number);
    if (!isValidPickerDate(year, month, day) || hour > 23 || minute > 59) {
      return undefined;
    }
    return {
      year,
      month: month - 1,
      day,
    };
  }

  if (inputType === 'month') {
    const match = /^(\d{4})-(\d{2})$/.exec(value);
    if (!match) return undefined;
    const year = Number(match[1]);
    const month = Number(match[2]);
    if (!Number.isFinite(year) || month < 1 || month > 12) return undefined;
    return { year, month: month - 1, day: null };
  }

  if (!isValidDate(value)) return undefined;
  const [month, day, year] = value.split('/').map(Number);
  return { month: month - 1, year, day };
}

function formatTimeDisplay(
  time: string,
  timeFormat: DateInputTimeFormat
): string {
  const [hour, minute] = time.split(':').map(Number);
  if (timeFormat === '12-hour') {
    const displayHour = hour % 12 || 12;
    const meridiem = hour >= 12 ? 'PM' : 'AM';
    return `${displayHour}:${String(minute).padStart(2, '0')} ${meridiem}`;
  }
  return time;
}

function formatPickerValue(
  value: string,
  inputType: DateInputType,
  timeFormat: DateInputTimeFormat
): string {
  if (inputType === 'datetime-local') {
    const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}:\d{2})$/.exec(value);
    if (!match) return '';
    return `${match[2]}/${match[3]}/${match[1]} ${formatTimeDisplay(match[4], timeFormat)}`;
  }

  if (inputType === 'time') {
    return /^\d{2}:\d{2}$/.test(value)
      ? formatTimeDisplay(value, timeFormat)
      : '';
  }

  if (inputType === 'month') {
    const date = parsePickerDate(value, inputType);
    return date ? `${MONTH_NAMES[date.month]} ${date.year}` : '';
  }

  return value;
}

export interface DateInputProps extends Omit<
  InputProps,
  'type' | 'onChange' | 'value'
> {
  /** The value for the selected input type. Dates use MM/DD/YYYY format. */
  value?: string;
  /** Callback fired when the value changes */
  onChange?: (value: string) => void;
  /** Date value format and picker control. */
  inputType?: DateInputType;
  /** Minute increment for the time picker (e.g. 15 shows :00, :15, :30, :45). */
  minuteStep?: number;
  /** Time picker display format for datetime values. */
  timeFormat?: DateInputTimeFormat;
  /** Validation mode for the date input */
  mode?: DateInputMode;
  /** Minimum age for DOB validation (default: 0) */
  minAge?: number;
  /** Maximum age for DOB validation */
  maxAge?: number;
  /** Earliest allowed date in MM/DD/YYYY format. */
  minDate?: string;
  /** Latest allowed date in MM/DD/YYYY format. */
  maxDate?: string;
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
  maxAge?: number,
  minDate?: string,
  maxDate?: string
): string | undefined {
  if (!value || value.replace(/\D/g, '').length === 0) {
    return undefined;
  }

  if (!isValidDate(value)) {
    return 'Please enter a valid date (MM/DD/YYYY)';
  }

  const selectedDate = parseDateValue(value);
  const minimumDate = minDate ? parseDateValue(minDate) : null;
  const maximumDate = maxDate ? parseDateValue(maxDate) : null;
  const minimumDateLabel = minDate ? formatDateValue(minDate) : '';
  const maximumDateLabel = maxDate ? formatDateValue(maxDate) : '';

  if (selectedDate && minimumDate && selectedDate < minimumDate) {
    return `Date must be on or after ${minimumDateLabel}`;
  }

  if (selectedDate && maximumDate && selectedDate > maximumDate) {
    return `Date must be on or before ${maximumDateLabel}`;
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
      inputType = 'date',
      minuteStep = 1,
      timeFormat = '24-hour',
      mode = 'default',
      minAge,
      maxAge,
      minDate,
      maxDate,
      validateOnBlur,
      showCalendar = false,
      width = 'full',
      className,
      onBlur,
      onClick,
      hasError,
      error,
      ...props
    },
    ref
  ) => {
    const isFormattedDate = inputType === 'date';
    const [displayValue, setDisplayValue] = React.useState(() =>
      isFormattedDate ? formatDateValue(value) : value
    );
    const [localError, setLocalError] = React.useState<string | undefined>();

    // Sync external value changes
    React.useEffect(() => {
      setDisplayValue(isFormattedDate ? formatDateValue(value) : value);
    }, [isFormattedDate, value]);

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
          maxAge,
          minDate,
          maxDate
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

    // Portal + fixed positioning so the calendar escapes overflow-hidden
    // ancestors, flips vertically, and clamps to the viewport.
    const {
      anchorRef: buttonRef,
      floatingRef: calendarRef,
      style: calendarStyle,
    } = useAnchoredPosition<HTMLButtonElement, HTMLDivElement>({
      open: isCalendarOpen,
      placement: 'bottom-end',
    });

    // Parse current value into date parts for calendar
    const parsedDate = React.useMemo(() => {
      const fallback = new Date();
      return (
        parsePickerDate(displayValue, inputType) ?? {
          month: fallback.getMonth(),
          year: fallback.getFullYear(),
          day: null,
        }
      );
    }, [displayValue, inputType]);

    const [calendarMonth, setCalendarMonth] = React.useState(parsedDate.month);
    const [calendarYear, setCalendarYear] = React.useState(parsedDate.year);
    const [selectedTime, setSelectedTime] = React.useState(() => {
      if (inputType === 'time' && /^\d{2}:\d{2}$/.test(value)) {
        return value;
      }
      return inputType === 'datetime-local' &&
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)
        ? value.slice(-5)
        : '00:00';
    });

    // Minute choices honor minuteStep; an off-step current value is kept
    // selectable so it still displays correctly.
    const minuteOptions = React.useMemo(() => {
      const step = Math.min(Math.max(Math.floor(minuteStep), 1), 60);
      const minutes = Array.from(
        { length: Math.ceil(60 / step) },
        (_, index) => index * step
      );
      const currentMinute = Number(selectedTime.slice(3));
      if (!minutes.includes(currentMinute)) {
        minutes.push(currentMinute);
        minutes.sort((a, b) => a - b);
      }
      return minutes.map((minute) => String(minute).padStart(2, '0'));
    }, [minuteStep, selectedTime]);
    const minimumDate = React.useMemo(
      () => (minDate ? parseDateValue(minDate) : null),
      [minDate]
    );
    const maximumDate = React.useMemo(
      () => (maxDate ? parseDateValue(maxDate) : null),
      [maxDate]
    );

    const isDateInRange = React.useCallback(
      (date: Date) => {
        const candidate = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate()
        );
        return (
          (!minimumDate || candidate >= minimumDate) &&
          (!maximumDate || candidate <= maximumDate)
        );
      },
      [maximumDate, minimumDate]
    );

    const isCalendarDateInRange = React.useCallback(
      (day: number) => {
        return isDateInRange(new Date(calendarYear, calendarMonth, day));
      },
      [calendarMonth, calendarYear, isDateInRange]
    );

    const isCalendarMonthInRange = React.useCallback(
      (month: number, year: number) => {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        return (
          (!minimumDate || lastDay >= minimumDate) &&
          (!maximumDate || firstDay <= maximumDate)
        );
      },
      [maximumDate, minimumDate]
    );

    const firstCalendarYear = minimumDate
      ? minimumDate.getFullYear()
      : new Date().getFullYear() - 100;
    const lastCalendarYear = maximumDate
      ? maximumDate.getFullYear()
      : new Date().getFullYear() + 49;
    const calendarYears = Array.from(
      { length: Math.max(0, lastCalendarYear - firstCalendarYear + 1) },
      (_, index) => firstCalendarYear + index
    );
    const previousCalendarMonth = calendarMonth === 0 ? 11 : calendarMonth - 1;
    const previousCalendarYear =
      calendarMonth === 0 ? calendarYear - 1 : calendarYear;
    const nextCalendarMonth = calendarMonth === 11 ? 0 : calendarMonth + 1;
    const nextCalendarYear =
      calendarMonth === 11 ? calendarYear + 1 : calendarYear;
    const canGoToPreviousCalendar =
      inputType === 'month'
        ? !minimumDate || calendarYear > minimumDate.getFullYear()
        : isCalendarMonthInRange(previousCalendarMonth, previousCalendarYear);
    const canGoToNextCalendar =
      inputType === 'month'
        ? !maximumDate || calendarYear < maximumDate.getFullYear()
        : isCalendarMonthInRange(nextCalendarMonth, nextCalendarYear);

    // Update calendar view when value changes
    React.useEffect(() => {
      if (inputType === 'time') {
        if (/^\d{2}:\d{2}$/.test(displayValue)) {
          setSelectedTime(displayValue);
        }
        return;
      }
      const date = parsePickerDate(displayValue, inputType);
      if (!date) return;
      setCalendarMonth(date.month);
      setCalendarYear(date.year);
      if (inputType === 'datetime-local') {
        setSelectedTime(displayValue.slice(-5));
      }
    }, [displayValue, inputType]);

    React.useEffect(() => {
      if (isCalendarMonthInRange(calendarMonth, calendarYear)) return;

      const closestAllowedDate = minimumDate ?? maximumDate;
      if (!closestAllowedDate) return;

      setCalendarMonth(closestAllowedDate.getMonth());
      setCalendarYear(closestAllowedDate.getFullYear());
    }, [
      calendarMonth,
      calendarYear,
      isCalendarMonthInRange,
      maximumDate,
      minimumDate,
    ]);

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
    }, [isCalendarOpen, buttonRef, calendarRef]);

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
    }, [isCalendarOpen, buttonRef]);

    const handleDateSelect = (day: number) => {
      if (!isCalendarDateInRange(day)) return;

      const month = String(calendarMonth + 1).padStart(2, '0');
      const dayStr = String(day).padStart(2, '0');
      const year = String(calendarYear);
      const formatted =
        inputType === 'datetime-local'
          ? `${year}-${month}-${dayStr}T${selectedTime}`
          : `${month}/${dayStr}/${year}`;
      setDisplayValue(formatted);
      onChange?.(formatted);
      if (inputType === 'date') {
        setIsCalendarOpen(false);
      }

      // Validate if needed
      if (inputType === 'date' && validateOnBlur) {
        const validationError = getValidationError(
          formatted,
          mode,
          minAge,
          maxAge,
          minDate,
          maxDate
        );
        setLocalError(validationError);
      }
    };

    const handleMonthSelect = (month: number) => {
      if (!isCalendarMonthInRange(month, calendarYear)) return;

      const formatted = `${calendarYear}-${String(month + 1).padStart(2, '0')}`;
      setDisplayValue(formatted);
      onChange?.(formatted);
      setIsCalendarOpen(false);
    };

    const handleCalendarYearChange = (year: number) => {
      setCalendarYear(year);
      if (isCalendarMonthInRange(calendarMonth, year)) return;

      const firstAvailableMonth = MONTH_NAMES.findIndex((_, month) =>
        isCalendarMonthInRange(month, year)
      );
      if (firstAvailableMonth !== -1) {
        setCalendarMonth(firstAvailableMonth);
      }
    };

    const handleTimeChange = (part: 'hour' | 'minute', nextValue: string) => {
      const [hour, minute] = selectedTime.split(':');
      const nextTime =
        part === 'hour' ? `${nextValue}:${minute}` : `${hour}:${nextValue}`;
      setSelectedTime(nextTime);

      if (inputType === 'time') {
        setDisplayValue(nextTime);
        onChange?.(nextTime);
        return;
      }

      if (parsedDate.day === null) return;
      const month = String(parsedDate.month + 1).padStart(2, '0');
      const day = String(parsedDate.day).padStart(2, '0');
      const formatted = `${parsedDate.year}-${month}-${day}T${nextTime}`;
      setDisplayValue(formatted);
      onChange?.(formatted);
    };

    const handleMeridiemChange = (meridiem: 'AM' | 'PM') => {
      const [hour] = selectedTime.split(':').map(Number);
      const nextHour = (hour % 12) + (meridiem === 'PM' ? 12 : 0);
      handleTimeChange('hour', String(nextHour).padStart(2, '0'));
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
            'bg-background border-border rounded-lg border shadow-lg',
            'overflow-auto p-3',
            inputType === 'time' ? 'w-fit' : 'w-72'
          )}
          style={calendarStyle}
          role="dialog"
          aria-label={
            inputType === 'month'
              ? 'Choose month'
              : inputType === 'time'
                ? 'Choose time'
                : inputType === 'datetime-local'
                  ? 'Choose date and time'
                  : 'Choose date'
          }
        >
          {/* Header with month/year navigation */}
          {inputType !== 'time' && (
            <div className="mb-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  if (inputType === 'month') {
                    setCalendarYear(calendarYear - 1);
                  } else if (calendarMonth === 0) {
                    setCalendarMonth(11);
                    setCalendarYear(calendarYear - 1);
                  } else {
                    setCalendarMonth(calendarMonth - 1);
                  }
                }}
                disabled={!canGoToPreviousCalendar}
                className="enabled:hover:bg-muted rounded-md p-1 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={
                  inputType === 'month' ? 'Previous year' : 'Previous month'
                }
              >
                <ChevronLeftIcon />
              </button>
              <div className="flex items-center gap-2">
                {inputType !== 'month' && (
                  <select
                    value={calendarMonth}
                    onChange={(e) => setCalendarMonth(Number(e.target.value))}
                    className="bg-background border-border rounded border px-2 py-1 text-sm"
                    aria-label="Select month"
                  >
                    {MONTH_NAMES.map((name, month) =>
                      isCalendarMonthInRange(month, calendarYear) ? (
                        <option key={name} value={month}>
                          {name}
                        </option>
                      ) : null
                    )}
                  </select>
                )}
                <select
                  value={calendarYear}
                  onChange={(e) =>
                    handleCalendarYearChange(Number(e.target.value))
                  }
                  className="bg-background border-border rounded border px-2 py-1 text-sm"
                  aria-label="Select year"
                >
                  {calendarYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (inputType === 'month') {
                    setCalendarYear(calendarYear + 1);
                  } else if (calendarMonth === 11) {
                    setCalendarMonth(0);
                    setCalendarYear(calendarYear + 1);
                  } else {
                    setCalendarMonth(calendarMonth + 1);
                  }
                }}
                disabled={!canGoToNextCalendar}
                className="hover:bg-muted rounded-md p-1 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={inputType === 'month' ? 'Next year' : 'Next month'}
              >
                <ChevronRightIcon />
              </button>
            </div>
          )}

          {inputType === 'time' ? null : inputType === 'month' ? (
            <div className="grid grid-cols-3 gap-1">
              {MONTH_NAMES.map((name, month) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => handleMonthSelect(month)}
                  className={cn(
                    'rounded-md px-2 py-2 text-sm transition-colors',
                    'focus:ring-ring focus:ring-2 focus:outline-none',
                    'hover:bg-muted',
                    parsedDate.month === month &&
                      parsedDate.year === calendarYear &&
                      'bg-primary-800 hover:bg-primary-900 text-white'
                  )}
                >
                  {name.slice(0, 3)}
                </button>
              ))}
            </div>
          ) : (
            <>
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
              <div className="grid grid-cols-7 gap-1">
                {days.map((day, index) => (
                  <button
                    key={index}
                    type="button"
                    disabled={day === null || !isCalendarDateInRange(day)}
                    onClick={() => day && handleDateSelect(day)}
                    className={cn(
                      'h-8 w-8 rounded-md text-sm transition-colors',
                      'focus:ring-ring focus:ring-2 focus:outline-none',
                      day === null && 'invisible',
                      day !== null && 'hover:bg-muted',
                      day !== null &&
                        !isCalendarDateInRange(day) &&
                        'cursor-not-allowed opacity-50',
                      isSelectedDay(day!) &&
                        'bg-primary-800 hover:bg-primary-900 text-white',
                      isToday(day!) &&
                        !isSelectedDay(day!) &&
                        'border-primary-800 text-primary-800 border'
                    )}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </>
          )}

          {(inputType === 'datetime-local' || inputType === 'time') && (
            <div
              className={cn(
                'flex items-center gap-2',
                inputType === 'datetime-local' &&
                  'border-border mt-3 border-t pt-3'
              )}
            >
              <select
                value={
                  timeFormat === '12-hour'
                    ? String(
                        Number(selectedTime.slice(0, 2)) % 12 || 12
                      ).padStart(2, '0')
                    : selectedTime.slice(0, 2)
                }
                onChange={(event) => {
                  const hour = Number(event.target.value);
                  const isPm = Number(selectedTime.slice(0, 2)) >= 12;
                  handleTimeChange(
                    'hour',
                    String(
                      timeFormat === '12-hour'
                        ? (hour % 12) + (isPm ? 12 : 0)
                        : hour
                    ).padStart(2, '0')
                  );
                }}
                className="bg-background border-border rounded border px-2 py-1 text-sm"
                aria-label="Select hour"
              >
                {Array.from(
                  { length: timeFormat === '12-hour' ? 12 : 24 },
                  (_, index) => (timeFormat === '12-hour' ? index + 1 : index)
                ).map((hour) => (
                  <option key={hour} value={String(hour).padStart(2, '0')}>
                    {String(hour).padStart(2, '0')}
                  </option>
                ))}
              </select>
              <span aria-hidden="true">:</span>
              <select
                value={selectedTime.slice(3)}
                onChange={(event) =>
                  handleTimeChange('minute', event.target.value)
                }
                className="bg-background border-border rounded border px-2 py-1 text-sm"
                aria-label="Select minute"
              >
                {minuteOptions.map((minute) => (
                  <option key={minute} value={minute}>
                    {minute}
                  </option>
                ))}
              </select>
              {timeFormat === '12-hour' && (
                <select
                  value={Number(selectedTime.slice(0, 2)) >= 12 ? 'PM' : 'AM'}
                  onChange={(event) =>
                    handleMeridiemChange(event.target.value as 'AM' | 'PM')
                  }
                  className="bg-background border-border rounded border px-2 py-1 text-sm"
                  aria-label="Select AM or PM"
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              )}
            </div>
          )}

          <div className="border-border mt-3 flex gap-2 border-t pt-3">
            {inputType !== 'time' && (
              <button
                type="button"
                onClick={() => {
                  const today = new Date();
                  setCalendarMonth(today.getMonth());
                  setCalendarYear(today.getFullYear());
                  if (inputType === 'month') {
                    handleMonthSelect(today.getMonth());
                  } else {
                    handleDateSelect(today.getDate());
                  }
                }}
                disabled={
                  inputType === 'month'
                    ? !isCalendarMonthInRange(
                        new Date().getMonth(),
                        new Date().getFullYear()
                      )
                    : !isDateInRange(new Date())
                }
                className="text-primary-800 flex-1 text-sm hover:underline disabled:cursor-not-allowed disabled:opacity-50"
              >
                Today
              </button>
            )}
            {(inputType === 'datetime-local' || inputType === 'time') && (
              <button
                type="button"
                onClick={() => setIsCalendarOpen(false)}
                className="text-primary-800 flex-1 text-sm hover:underline"
              >
                Done
              </button>
            )}
          </div>
        </div>
      );
    };

    if (inputType === 'year') {
      return (
        <Input
          ref={ref}
          type={inputType === 'year' ? 'text' : inputType}
          inputMode={inputType === 'year' ? 'numeric' : undefined}
          pattern={inputType === 'year' ? '[0-9]{4}' : undefined}
          maxLength={inputType === 'year' ? 4 : undefined}
          placeholder={inputType === 'year' ? 'YYYY' : undefined}
          value={value.replace(/\D/g, '').slice(0, 4)}
          onChange={(event) =>
            onChange?.(event.target.value.replace(/\D/g, '').slice(0, 4))
          }
          onBlur={onBlur}
          onClick={onClick}
          hasError={hasError}
          error={error}
          className={cn(widthClasses[width], className)}
          {...props}
        />
      );
    }

    if (showCalendar || inputType !== 'date') {
      // Extract label/error/helper and component-specific props to handle positioning correctly
      // Filter out Input component props that aren't valid HTML input attributes
      const {
        label,
        labelVariant,
        helperText,
        hideLabel,
        required,
        size,
        ...inputProps
      } = props;
      // Ensure size has a valid value (fallback to 'md' if null/undefined)
      const resolvedSize = size ?? 'md';
      const inputId = inputProps.id || generatedId;
      const errorId = `${inputId}-error`;
      const helperId = `${inputId}-helper`;
      const showError = hasError || !!localError;
      const errorMessage = error || localError;
      const isFloating = labelVariant === 'floating' && !!label && !hideLabel;

      const requiredMark = required && (
        <span className="text-destructive ms-1" aria-hidden="true">
          *
        </span>
      );

      return (
        <div
          data-slot="input-wrapper"
          className={cn('flex flex-col gap-1.5', widthClasses[width])}
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
          <div className="relative">
            <input
              data-slot="input"
              ref={ref}
              id={inputId}
              type="text"
              inputMode={inputType === 'date' ? 'numeric' : undefined}
              autoComplete={autoComplete}
              placeholder={
                isFloating
                  ? ' '
                  : inputType === 'month'
                    ? 'Select month'
                    : inputType === 'time'
                      ? 'Select time'
                      : inputType === 'datetime-local'
                        ? 'Select date and time'
                        : placeholder
              }
              value={formatPickerValue(displayValue, inputType, timeFormat)}
              onChange={handleChange}
              onBlur={inputType === 'date' ? handleBlur : onBlur}
              onClick={(event) => {
                onClick?.(event);
                setIsCalendarOpen(true);
              }}
              readOnly={!isFormattedDate}
              required={required}
              aria-invalid={showError}
              aria-describedby={
                [errorMessage ? errorId : null, helperText ? helperId : null]
                  .filter(Boolean)
                  .join(' ') || undefined
              }
              className={cn(
                inputVariants({
                  size: resolvedSize,
                  hasError: showError,
                  labelVariant: isFloating ? 'floating' : 'stacked',
                }),
                'pr-10',
                className
              )}
              {...inputProps}
            />
            {isFloating && (
              <label
                data-slot="input-label"
                htmlFor={inputId}
                className={floatingLabelVariants({
                  size: resolvedSize,
                  hasError: showError,
                })}
              >
                {label}
                {requiredMark}
              </label>
            )}
            <button
              data-slot="date-input-trigger"
              ref={buttonRef}
              type="button"
              onClick={() => setIsCalendarOpen(!isCalendarOpen)}
              className={cn(
                'absolute top-1/2 right-3 -translate-y-1/2',
                'text-muted-foreground hover:text-foreground',
                'focus:text-foreground focus:outline-none',
                'transition-colors'
              )}
              aria-label={
                inputType === 'time' ? 'Open time picker' : 'Open calendar'
              }
              aria-expanded={isCalendarOpen}
              aria-haspopup="dialog"
            >
              {inputType === 'time' ? (
                <Clock size={18} />
              ) : (
                <Calendar size={18} />
              )}
            </button>
          </div>
          {isCalendarOpen && createPortal(renderCalendar(), document.body)}
          {errorMessage && (
            <p
              id={errorId}
              data-slot="input-error"
              className="text-sm"
              style={{ color: '#ef4444' }}
              role="alert"
            >
              {errorMessage}
            </p>
          )}
          {helperText && !errorMessage && (
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
      aria-hidden="true"
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
      aria-hidden="true"
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
