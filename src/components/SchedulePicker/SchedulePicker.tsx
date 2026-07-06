import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
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
        data-slot="schedule-date-btn"
        className={cn(dateButtonVariants({ selected }), className)}
        {...props}
      >
        <div
          data-slot="schedule-date-weekday"
          className="text-muted-foreground text-xs"
        >
          {date.toLocaleDateString('en-US', { weekday: 'short' })}
        </div>
        <div
          data-slot="schedule-date-day"
          className="text-lg font-semibold text-neutral-900 dark:text-white"
        >
          {date.getDate()}
        </div>
        <div
          data-slot="schedule-date-month"
          className="text-muted-foreground text-xs"
        >
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
        data-slot="schedule-time-btn"
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
        data-slot="schedule-radio"
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
            data-slot="schedule-radio-indicator"
            className={cn(
              'flex h-5 w-5 items-center justify-center rounded-full border-2',
              selected
                ? 'border-primary-500 bg-primary-800'
                : 'border-neutral-300'
            )}
          >
            {selected && (
              <div
                data-slot="schedule-radio-dot"
                className="h-2 w-2 rounded-full bg-white"
              />
            )}
          </div>
          <div>
            <div
              data-slot="schedule-radio-title"
              className="font-medium text-neutral-900 dark:text-white"
            >
              {title}
            </div>
            {description && (
              <div
                data-slot="schedule-radio-desc"
                className="text-muted-foreground text-sm"
              >
                {description}
              </div>
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
// Mini Calendar (popover) — lets DatePicker pick dates beyond the strip
// ============================================================================

const CALENDAR_MONTHS = [
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

const CALENDAR_WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

/** Strip the time component so date-only comparisons are stable. */
function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

interface MiniCalendarProps {
  /** Currently selected date (highlighted), if any. */
  selectedDate?: Date | null;
  /** Called with the picked date when the user selects a day. */
  onSelect: (date: Date) => void;
  /** Earliest selectable date (inclusive). */
  minDate?: Date;
  /** Latest selectable date (inclusive). */
  maxDate?: Date;
  /** Month to show first; defaults to the selected date or today. */
  defaultMonth?: Date;
}

/**
 * A compact month-grid calendar with prev/next navigation. Presentational
 * only — positioning and open/close state are owned by the parent.
 */
function MiniCalendar({
  selectedDate,
  onSelect,
  minDate,
  maxDate,
  defaultMonth,
}: MiniCalendarProps) {
  const initial = selectedDate ?? defaultMonth ?? new Date();
  const [viewMonth, setViewMonth] = React.useState(initial.getMonth());
  const [viewYear, setViewYear] = React.useState(initial.getFullYear());

  const min = minDate ? startOfDay(minDate) : null;
  const max = maxDate ? startOfDay(maxDate) : null;

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const today = startOfDay(new Date());

  const cells: Array<number | null> = [];
  for (let i = 0; i < firstWeekday; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(day);

  function isDisabled(day: number): boolean {
    const date = startOfDay(new Date(viewYear, viewMonth, day));
    if (min && date < min) return true;
    if (max && date > max) return true;
    return false;
  }

  function isSelected(day: number): boolean {
    return (
      !!selectedDate &&
      selectedDate.getFullYear() === viewYear &&
      selectedDate.getMonth() === viewMonth &&
      selectedDate.getDate() === day
    );
  }

  function isToday(day: number): boolean {
    return (
      today.getFullYear() === viewYear &&
      today.getMonth() === viewMonth &&
      today.getDate() === day
    );
  }

  function goToPrevMonth() {
    setViewYear((y) => (viewMonth === 0 ? y - 1 : y));
    setViewMonth((m) => (m === 0 ? 11 : m - 1));
  }

  function goToNextMonth() {
    setViewYear((y) => (viewMonth === 11 ? y + 1 : y));
    setViewMonth((m) => (m === 11 ? 0 : m + 1));
  }

  // Disable navigation that would only reveal out-of-range months.
  const prevDisabled =
    !!min && startOfDay(new Date(viewYear, viewMonth, 0)) < min;
  const nextDisabled =
    !!max && startOfDay(new Date(viewYear, viewMonth + 1, 1)) > max;

  return (
    <div
      data-slot="schedule-calendar"
      role="dialog"
      aria-label="Choose a date"
      className="border-border bg-background w-72 rounded-lg border p-3 shadow-lg"
    >
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={goToPrevMonth}
          disabled={prevDisabled}
          aria-label="Previous month"
          className="hover:bg-muted rounded-md p-1 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="text-sm font-medium text-neutral-900 dark:text-white">
          {CALENDAR_MONTHS[viewMonth]} {viewYear}
        </div>
        <button
          type="button"
          onClick={goToNextMonth}
          disabled={nextDisabled}
          aria-label="Next month"
          className="hover:bg-muted rounded-md p-1 transition-colors disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1">
        {CALENDAR_WEEKDAYS.map((weekday) => (
          <div
            key={weekday}
            className="text-muted-foreground py-1 text-center text-xs font-medium"
          >
            {weekday}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="h-8 w-8" />;
          }
          const disabled = isDisabled(day);
          const selected = isSelected(day);
          return (
            <button
              key={day}
              type="button"
              disabled={disabled}
              aria-pressed={selected}
              onClick={() => onSelect(new Date(viewYear, viewMonth, day))}
              className={cn(
                'h-8 w-8 rounded-md text-sm transition-colors',
                'focus:ring-primary-500 focus:outline-none focus:ring-2',
                disabled && 'cursor-not-allowed opacity-30',
                !disabled &&
                  !selected &&
                  'hover:bg-muted text-neutral-900 dark:text-white',
                selected && 'bg-primary-800 hover:bg-primary-900 text-white',
                isToday(day) &&
                  !selected &&
                  'border-primary-500 text-primary-600 dark:text-primary-400 border'
              )}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

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
  /**
   * When true, render a calendar trigger at the end of the date strip so the
   * user can pick a date beyond the visible range (e.g. weeks or months out).
   * A selected date that falls outside `dates` is surfaced in the strip so the
   * choice stays visible.
   */
  allowCustomDate?: boolean;
  /** Earliest date selectable in the calendar popover (inclusive). */
  minDate?: Date;
  /** Latest date selectable in the calendar popover (inclusive). */
  maxDate?: Date;
  /** Visible label / accessible name for the calendar trigger. */
  customDateLabel?: string;
}

/**
 * A horizontal scrollable date picker. When `allowCustomDate` is set, a
 * calendar popover lets the user pick any date beyond the visible strip.
 */
const DatePicker = React.forwardRef<HTMLDivElement, DatePickerProps>(
  (
    {
      className,
      dates,
      selectedDate,
      onDateSelect,
      label = 'Select Date',
      allowCustomDate = false,
      minDate,
      maxDate,
      customDateLabel = 'More dates',
      ...props
    },
    ref
  ) => {
    const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);
    const popoverRef = React.useRef<HTMLDivElement>(null);
    const triggerRef = React.useRef<HTMLButtonElement>(null);

    // Close the calendar popover on outside click or Escape.
    React.useEffect(() => {
      if (!isCalendarOpen) return;
      function handlePointer(event: MouseEvent) {
        const target = event.target as Node;
        if (
          !popoverRef.current?.contains(target) &&
          !triggerRef.current?.contains(target)
        ) {
          setIsCalendarOpen(false);
        }
      }
      function handleKey(event: KeyboardEvent) {
        if (event.key === 'Escape') {
          setIsCalendarOpen(false);
          triggerRef.current?.focus();
        }
      }
      document.addEventListener('mousedown', handlePointer);
      document.addEventListener('keydown', handleKey);
      return () => {
        document.removeEventListener('mousedown', handlePointer);
        document.removeEventListener('keydown', handleKey);
      };
    }, [isCalendarOpen]);

    // Surface an out-of-range custom selection in the strip (chronologically)
    // so the chosen date stays visible alongside the quick-pick options.
    const renderedDates = React.useMemo(() => {
      if (!allowCustomDate || !selectedDate) return dates;
      const exists = dates.some(
        (d) => d.toDateString() === selectedDate.toDateString()
      );
      if (exists) return dates;
      return [...dates, selectedDate].sort(
        (a, b) => a.getTime() - b.getTime()
      );
    }, [dates, selectedDate, allowCustomDate]);

    return (
      <div
        ref={ref}
        data-slot="schedule-date-picker"
        className={cn('relative', className)}
        {...props}
      >
        <label
          data-slot="schedule-date-label"
          className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
        >
          {label}
        </label>
        {/* Negative margin + padding allows focus ring to render without clipping */}
        <div
          data-slot="schedule-date-list"
          className="-m-1 flex gap-2 overflow-x-auto p-1"
        >
          {renderedDates.map((date) => (
            <DateButton
              key={date.toDateString()}
              date={date}
              selected={selectedDate?.toDateString() === date.toDateString()}
              onClick={(e) => {
                e.stopPropagation();
                onDateSelect?.(date);
              }}
            />
          ))}

          {allowCustomDate && (
            <button
              ref={triggerRef}
              type="button"
              data-slot="schedule-date-more-btn"
              aria-haspopup="dialog"
              aria-expanded={isCalendarOpen}
              aria-label={customDateLabel}
              title={customDateLabel}
              onClick={(e) => {
                e.stopPropagation();
                setIsCalendarOpen((open) => !open);
              }}
              className={cn(
                dateButtonVariants({ selected: isCalendarOpen }),
                'flex min-w-[4rem] flex-col items-center justify-center gap-1'
              )}
            >
              <Calendar className="text-muted-foreground h-5 w-5" />
              <span className="text-muted-foreground text-[11px] leading-tight">
                {customDateLabel}
              </span>
            </button>
          )}
        </div>

        {allowCustomDate && isCalendarOpen && (
          <div
            ref={popoverRef}
            data-slot="schedule-date-calendar-popover"
            className="absolute right-0 top-full z-50 mt-2"
          >
            <MiniCalendar
              selectedDate={selectedDate ?? null}
              minDate={minDate}
              maxDate={maxDate}
              defaultMonth={selectedDate ?? new Date()}
              onSelect={(date) => {
                onDateSelect?.(date);
                setIsCalendarOpen(false);
              }}
            />
          </div>
        )}
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
      <div
        ref={ref}
        data-slot="schedule-time-picker"
        className={className}
        {...props}
      >
        <label
          data-slot="schedule-time-label"
          className="mb-2 block text-sm font-medium text-neutral-700 dark:text-neutral-300"
        >
          {label}
        </label>
        {/* Negative margin + padding allows focus ring to render without clipping */}
        <div
          data-slot="schedule-time-grid"
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
  /**
   * When true, the date picker shows a calendar trigger so the user can pick a
   * date beyond the visible strip (e.g. weeks or months out).
   */
  allowCustomDate?: boolean;
  /** Earliest date selectable in the calendar popover (inclusive). */
  minDate?: Date;
  /** Latest date selectable in the calendar popover (inclusive). */
  maxDate?: Date;
  /** Visible label / accessible name for the calendar trigger. */
  customDateLabel?: string;
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
      allowCustomDate = false,
      minDate,
      maxDate,
      customDateLabel,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        data-slot="schedule-picker"
        className={cn('space-y-4', className)}
        {...props}
      >
        <DatePicker
          dates={dates}
          selectedDate={selectedDate}
          onDateSelect={onDateSelect}
          label={dateLabel}
          allowCustomDate={allowCustomDate}
          minDate={minDate}
          maxDate={maxDate}
          customDateLabel={customDateLabel}
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
