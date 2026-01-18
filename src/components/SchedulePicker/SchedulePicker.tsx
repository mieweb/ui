import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

// ============================================================================
// Date Button Component
// ============================================================================

const dateButtonVariants = cva(
  [
    'flex-shrink-0 rounded-xl border px-3 py-2 text-center transition-colors',
    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
    'dark:focus:ring-offset-neutral-900',
  ],
  {
    variants: {
      selected: {
        true: 'border-primary-500 bg-primary-50 dark:bg-primary-900/20',
        false:
          'border-neutral-200 hover:border-neutral-300 dark:border-neutral-700 dark:hover:border-neutral-600',
      },
    },
    defaultVariants: {
      selected: false,
    },
  }
);

export interface DateButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof dateButtonVariants> {
  /** The date to display */
  date: Date;
}

/**
 * A button for selecting a date in the schedule picker.
 */
const DateButton = React.forwardRef<HTMLButtonElement, DateButtonProps>(
  ({ className, date, selected, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(dateButtonVariants({ selected }), className)}
        {...props}
      >
        <div className="text-xs text-neutral-500">
          {date.toLocaleDateString('en-US', { weekday: 'short' })}
        </div>
        <div className="text-lg font-semibold text-neutral-900 dark:text-white">
          {date.getDate()}
        </div>
        <div className="text-xs text-neutral-500">
          {date.toLocaleDateString('en-US', { month: 'short' })}
        </div>
      </button>
    );
  }
);

DateButton.displayName = 'DateButton';

// ============================================================================
// Time Button Component
// ============================================================================

const timeButtonVariants = cva(
  [
    'rounded-xl border px-2 py-2 text-sm transition-colors',
    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
    'dark:focus:ring-offset-neutral-900',
  ],
  {
    variants: {
      selected: {
        true: 'border-primary-500 bg-primary-50 dark:bg-primary-900/20',
        false:
          'border-neutral-200 hover:border-neutral-300 dark:border-neutral-700 dark:hover:border-neutral-600',
      },
    },
    defaultVariants: {
      selected: false,
    },
  }
);

export interface TimeButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof timeButtonVariants> {
  /** The time string to display (e.g., "8:00 AM") */
  time: string;
}

/**
 * A button for selecting a time in the schedule picker.
 */
const TimeButton = React.forwardRef<HTMLButtonElement, TimeButtonProps>(
  ({ className, time, selected, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        className={cn(timeButtonVariants({ selected }), className)}
        {...props}
      >
        {time}
      </button>
    );
  }
);

TimeButton.displayName = 'TimeButton';

// ============================================================================
// Radio Option Component
// ============================================================================

const radioOptionVariants = cva(
  [
    'cursor-pointer rounded-xl border bg-card p-4 transition-all',
    'focus-within:outline-none focus-within:ring-2 focus-within:ring-primary-500',
  ],
  {
    variants: {
      selected: {
        true: 'border-2 border-primary-500 ring-2 ring-primary-200 dark:ring-primary-800',
        false: 'border-border',
      },
    },
    defaultVariants: {
      selected: false,
    },
  }
);

export interface RadioOptionProps
  extends
    Omit<React.HTMLAttributes<HTMLDivElement>, 'title'>,
    VariantProps<typeof radioOptionVariants> {
  /** Title text for the option */
  title: React.ReactNode;
  /** Description text for the option */
  description?: React.ReactNode;
  /** Whether this option is selected */
  selected?: boolean;
}

/**
 * A radio-style option card component.
 */
const RadioOption = React.forwardRef<HTMLDivElement, RadioOptionProps>(
  (
    { className, title, description, selected, children, onClick, ...props },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(radioOptionVariants({ selected }), className)}
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick?.(e as unknown as React.MouseEvent<HTMLDivElement>);
          }
        }}
        {...props}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'flex h-5 w-5 items-center justify-center rounded-full border-2',
              selected
                ? 'border-primary-500 bg-primary-500'
                : 'border-neutral-300'
            )}
          >
            {selected && <div className="h-2 w-2 rounded-full bg-white" />}
          </div>
          <div>
            <div className="font-medium text-neutral-900 dark:text-white">
              {title}
            </div>
            {description && (
              <div className="text-sm text-neutral-500">{description}</div>
            )}
          </div>
        </div>
        {children}
      </div>
    );
  }
);

RadioOption.displayName = 'RadioOption';

// ============================================================================
// Date Picker Component
// ============================================================================

export interface DatePickerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Array of available dates to display */
  dates: Date[];
  /** Currently selected date */
  selectedDate?: Date | null;
  /** Callback when a date is selected */
  onDateSelect?: (date: Date) => void;
  /** Label text above the date picker */
  label?: string;
}

/**
 * A horizontal scrollable date picker component.
 */
const DatePicker = React.forwardRef<HTMLDivElement, DatePickerProps>(
  (
    {
      className,
      dates,
      selectedDate,
      onDateSelect,
      label = 'Select Date',
      ...props
    },
    ref
  ) => {
    return (
      <div ref={ref} className={className} {...props}>
        <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {label}
        </label>
        {/* Negative margin + padding allows focus ring to render without clipping */}
        <div className="-m-1 flex gap-2 overflow-x-auto p-1">
          {dates.map((date, index) => (
            <DateButton
              key={index}
              date={date}
              selected={selectedDate?.toDateString() === date.toDateString()}
              onClick={(e) => {
                e.stopPropagation();
                onDateSelect?.(date);
              }}
            />
          ))}
        </div>
      </div>
    );
  }
);

DatePicker.displayName = 'DatePicker';

// ============================================================================
// Time Picker Component
// ============================================================================

export interface TimePickerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Array of available time strings (e.g., ["8:00 AM", "8:30 AM"]) */
  times: string[];
  /** Currently selected time string */
  selectedTime?: string | null;
  /** Callback when a time is selected */
  onTimeSelect?: (time: string) => void;
  /** Label text above the time picker */
  label?: string;
  /** Number of columns for the time grid */
  columns?: 4 | 6;
}

/**
 * A grid-based time picker component.
 */
const TimePicker = React.forwardRef<HTMLDivElement, TimePickerProps>(
  (
    {
      className,
      times,
      selectedTime,
      onTimeSelect,
      label = 'Select Time',
      columns = 6,
      ...props
    },
    ref
  ) => {
    return (
      <div ref={ref} className={className} {...props}>
        <label className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {label}
        </label>
        {/* Negative margin + padding allows focus ring to render without clipping */}
        <div
          className={cn(
            '-m-1 grid gap-2 p-1',
            columns === 4 ? 'grid-cols-4' : 'grid-cols-4 sm:grid-cols-6'
          )}
        >
          {times.map((time) => (
            <TimeButton
              key={time}
              time={time}
              selected={selectedTime === time}
              onClick={(e) => {
                e.stopPropagation();
                onTimeSelect?.(time);
              }}
            />
          ))}
        </div>
      </div>
    );
  }
);

TimePicker.displayName = 'TimePicker';

// ============================================================================
// Schedule Picker Component (Composite)
// ============================================================================

export interface SchedulePickerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Array of available dates to display */
  dates: Date[];
  /** Array of available time strings */
  times: string[];
  /** Currently selected date */
  selectedDate?: Date | null;
  /** Currently selected time */
  selectedTime?: string | null;
  /** Callback when a date is selected */
  onDateSelect?: (date: Date) => void;
  /** Callback when a time is selected */
  onTimeSelect?: (time: string) => void;
  /** Label for the date picker */
  dateLabel?: string;
  /** Label for the time picker */
  timeLabel?: string;
  /** Number of columns for time grid */
  timeColumns?: 4 | 6;
  /** Whether to show time picker (hidden until date is selected) */
  showTimePicker?: boolean;
}

/**
 * A complete schedule picker with date and time selection.
 *
 * @example
 * ```tsx
 * <SchedulePicker
 *   dates={availableDates}
 *   times={availableTimes}
 *   selectedDate={selectedDate}
 *   selectedTime={selectedTime}
 *   onDateSelect={setSelectedDate}
 *   onTimeSelect={setSelectedTime}
 * />
 * ```
 */
const SchedulePicker = React.forwardRef<HTMLDivElement, SchedulePickerProps>(
  (
    {
      className,
      dates,
      times,
      selectedDate,
      selectedTime,
      onDateSelect,
      onTimeSelect,
      dateLabel = 'Select Date',
      timeLabel = 'Select Time',
      timeColumns = 6,
      showTimePicker = true,
      ...props
    },
    ref
  ) => {
    return (
      <div ref={ref} className={cn('space-y-4', className)} {...props}>
        <DatePicker
          dates={dates}
          selectedDate={selectedDate}
          onDateSelect={onDateSelect}
          label={dateLabel}
        />
        {showTimePicker && selectedDate && (
          <TimePicker
            times={times}
            selectedTime={selectedTime}
            onTimeSelect={onTimeSelect}
            label={timeLabel}
            columns={timeColumns}
          />
        )}
      </div>
    );
  }
);

SchedulePicker.displayName = 'SchedulePicker';

// ============================================================================
// Exports
// ============================================================================

export {
  DateButton,
  TimeButton,
  RadioOption,
  DatePicker,
  TimePicker,
  SchedulePicker,
  dateButtonVariants,
  timeButtonVariants,
  radioOptionVariants,
};
