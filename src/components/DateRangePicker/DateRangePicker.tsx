import * as React from 'react';
import { cn } from '../../utils/cn';
import { Button } from '../Button';
import { Dropdown, DropdownItem } from '../Dropdown';
import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export type DateRangePresetKey =
  | 'today'
  | 'this-week'
  | 'this-month'
  | 'last-month'
  | 'last-24-hours'
  | 'last-7-days'
  | 'last-30-days';

export interface DateRangePreset {
  key: DateRangePresetKey | string;
  label: string;
}

export interface DateRange {
  start: Date | null;
  end: Date | null;
}

export interface DateRangePickerProps {
  /** Current date range value */
  value?: DateRange;
  /** Callback when date range changes */
  onChange: (range: DateRange, presetKey?: string) => void;
  /** Custom presets (uses default if not provided) */
  presets?: DateRangePreset[];
  /** Currently active preset key */
  activePreset?: string;
  /** Placeholder text for the date input */
  placeholder?: string;
  /** Date format for display */
  dateFormat?: string;
  /** Custom className */
  className?: string;
  /** Labels for i18n */
  labels?: {
    today?: string;
    thisWeek?: string;
    thisMonth?: string;
    lastMonth?: string;
    last24Hours?: string;
    last7Days?: string;
    last30Days?: string;
    filter?: string;
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function getDefaultPresets(
  labels: DateRangePickerProps['labels'] = {}
): DateRangePreset[] {
  const {
    today = 'Today',
    thisWeek = 'This Week',
    thisMonth = 'This Month',
    lastMonth = 'Last Month',
    last24Hours = 'Last 24 Hours',
    last7Days = 'Last 7 Days',
    last30Days = 'Last 30 Days',
  } = labels;

  return [
    { key: 'today', label: today },
    { key: 'this-week', label: thisWeek },
    { key: 'this-month', label: thisMonth },
    { key: 'last-month', label: lastMonth },
    { key: 'last-24-hours', label: last24Hours },
    { key: 'last-7-days', label: last7Days },
    { key: 'last-30-days', label: last30Days },
  ];
}

function calculateDateRange(presetKey: string): DateRange {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (presetKey) {
    case 'today':
      return {
        start: today,
        end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
      };

    case 'this-week': {
      const dayOfWeek = today.getDay();
      const sunday = new Date(today);
      sunday.setDate(today.getDate() - dayOfWeek);
      const saturday = new Date(sunday);
      saturday.setDate(sunday.getDate() + 6);
      return { start: sunday, end: saturday };
    }

    case 'this-month': {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { start: firstDay, end: lastDay };
    }

    case 'last-month': {
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
      return { start: firstDay, end: lastDay };
    }

    case 'last-24-hours':
      return {
        start: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        end: now,
      };

    case 'last-7-days':
      return {
        start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        end: now,
      };

    case 'last-30-days':
      return {
        start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        end: now,
      };

    default:
      return { start: null, end: null };
  }
}

function formatDateRange(range: DateRange, _format?: string): string {
  if (!range.start && !range.end) return '';
  const formatDate = (d: Date | null) => {
    if (!d) return '';
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };
  if (range.start && range.end) {
    return `${formatDate(range.start)} - ${formatDate(range.end)}`;
  }
  return formatDate(range.start || range.end);
}

// ============================================================================
// DateRangePicker Component
// ============================================================================

/**
 * Date range picker with a two-month calendar popup.
 * Click the date input to open a calendar for selecting a custom date range.
 * Select a start and end date from the calendar.
 *
 * @example
 * ```tsx
 * const [range, setRange] = useState<DateRange>({ start: null, end: null });
 *
 * <DateRangePicker
 *   value={range}
 *   onChange={(newRange) => setRange(newRange)}
 * />
 * ```
 */
export function DateRangePicker({
  value,
  onChange,
  presets,
  activePreset,
  placeholder = 'Pick a date range',
  dateFormat,
  className,
  showPresets = true,
  labels = {},
}: DateRangePickerProps) {
  const finalPresets = presets || getDefaultPresets(labels);

  // Calendar state — leftMonth/leftYear is the left panel; right panel is always the next month
  const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);
  const [leftMonth, setLeftMonth] = React.useState(
    () => value?.start?.getMonth() ?? new Date().getMonth()
  );
  const [leftYear, setLeftYear] = React.useState(
    () => value?.start?.getFullYear() ?? new Date().getFullYear()
  );
  const [rangeStart, setRangeStart] = React.useState<Date | null>(
    value?.start ?? null
  );
  const [rangeEnd, setRangeEnd] = React.useState<Date | null>(
    value?.end ?? null
  );
  const [selectingEnd, setSelectingEnd] = React.useState(false);
  const [hoverDate, setHoverDate] = React.useState<Date | null>(null);

  const calendarRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  // Compute right panel month/year
  const rightMonth = leftMonth === 11 ? 0 : leftMonth + 1;
  const rightYear = leftMonth === 11 ? leftYear + 1 : leftYear;

  // Sync external value changes
  React.useEffect(() => {
    if (value?.start) {
      setRangeStart(value.start);
    }
    if (value?.end) {
      setRangeEnd(value.end);
    }
    if (!value?.start && !value?.end) {
      setRangeStart(null);
      setRangeEnd(null);
    }
  }, [value]);

  // Close calendar on click outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target as HTMLElement) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as HTMLElement)
      ) {
        setIsCalendarOpen(false);
        setSelectingEnd(false);
      }
    };
    if (isCalendarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isCalendarOpen]);

  // Close on Escape
  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsCalendarOpen(false);
        setSelectingEnd(false);
      }
    };
    if (isCalendarOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isCalendarOpen]);

  const handlePresetSelect = (presetKey: string) => {
    const range = calculateDateRange(presetKey);
    setRangeStart(range.start);
    setRangeEnd(range.end);
    setSelectingEnd(false);
    setIsCalendarOpen(false);
    if (range.start) {
      setLeftMonth(range.start.getMonth());
      setLeftYear(range.start.getFullYear());
    }
    onChange(range, presetKey);
  };

  const handleDayClick = (day: number, month: number, year: number) => {
    const clicked = new Date(year, month, day);
    if (!selectingEnd) {
      // First click — set start
      setRangeStart(clicked);
      setRangeEnd(null);
      setSelectingEnd(true);
    } else {
      // Second click — set end
      let start = rangeStart!;
      let end = clicked;
      if (end < start) {
        [start, end] = [end, start];
      }
      setRangeStart(start);
      setRangeEnd(end);
      setSelectingEnd(false);
      setIsCalendarOpen(false);
      onChange({ start, end });
    }
  };

  const toggleCalendar = () => {
    if (!isCalendarOpen) {
      if (value?.start) {
        setRangeStart(value.start);
        setRangeEnd(value.end ?? null);
        setLeftMonth(value.start.getMonth());
        setLeftYear(value.start.getFullYear());
      } else {
        const now = new Date();
        setLeftMonth(now.getMonth());
        setLeftYear(now.getFullYear());
      }
      setSelectingEnd(false);
    }
    setIsCalendarOpen(!isCalendarOpen);
  };

  const goToPrevMonth = () => {
    if (leftMonth === 0) {
      setLeftMonth(11);
      setLeftYear(leftYear - 1);
    } else {
      setLeftMonth(leftMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (leftMonth === 11) {
      setLeftMonth(0);
      setLeftYear(leftYear + 1);
    } else {
      setLeftMonth(leftMonth + 1);
    }
  };

  // Calendar helpers
  const getDaysInMonth = (month: number, year: number) =>
    new Date(year, month + 1, 0).getDate();

  const getFirstDayOfMonth = (month: number, year: number) =>
    new Date(year, month, 1).getDay();

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const isInRange = (date: Date) => {
    const start = rangeStart;
    const end = selectingEnd ? hoverDate : rangeEnd;
    if (!start || !end) return false;
    const [lo, hi] = start <= end ? [start, end] : [end, start];
    return date > lo && date < hi;
  };

  const isStart = (date: Date) => {
    if (!rangeStart) return false;
    return isSameDay(date, rangeStart);
  };

  const isEnd = (date: Date) => {
    const end = selectingEnd ? hoverDate : rangeEnd;
    if (!end) return false;
    return isSameDay(date, end);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return isSameDay(date, today);
  };

  const displayValue = value ? formatDateRange(value, dateFormat) : '';

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

  const renderMonthGrid = (month: number, year: number) => {
    const daysInMonth = getDaysInMonth(month, year);
    const firstDay = getFirstDayOfMonth(month, year);

    // Previous month overflow days
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const daysInPrevMonth = getDaysInMonth(prevMonth, prevYear);

    // Build array of { day, month, year, isCurrentMonth }
    const cells: {
      day: number;
      month: number;
      year: number;
      isCurrentMonth: boolean;
    }[] = [];

    // Previous month overflow
    for (let i = firstDay - 1; i >= 0; i--) {
      cells.push({
        day: daysInPrevMonth - i,
        month: prevMonth,
        year: prevYear,
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      cells.push({ day: i, month, year, isCurrentMonth: true });
    }

    // Next month overflow to fill 6 rows (42 cells)
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    const remaining = 42 - cells.length;
    for (let i = 1; i <= remaining; i++) {
      cells.push({
        day: i,
        month: nextMonth,
        year: nextYear,
        isCurrentMonth: false,
      });
    }

    return (
      <div className="w-[280px]">
        {/* Day headers */}
        <div className="mb-1 grid grid-cols-7">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((dayName) => (
            <div
              key={dayName}
              className="text-muted-foreground py-1 text-center text-xs font-medium"
            >
              {dayName}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7">
          {cells.map((cell, index) => {
            const date = new Date(cell.year, cell.month, cell.day);
            const inRange = isInRange(date);
            const start = isStart(date);
            const end = isEnd(date);
            const today = isToday(date);

            return (
              <button
                key={index}
                type="button"
                onClick={() =>
                  handleDayClick(cell.day, cell.month, cell.year)
                }
                onMouseEnter={() => {
                  if (selectingEnd) {
                    setHoverDate(date);
                  }
                }}
                className={cn(
                  'relative h-9 w-10 text-center text-sm',
                  'focus:ring-ring focus:z-10 focus:ring-2 focus:outline-none',
                  'transition-colors',
                  // Not current month — dimmed
                  !cell.isCurrentMonth && 'text-muted-foreground/50',
                  // Current month — normal
                  cell.isCurrentMonth && 'text-foreground',
                  // Hover
                  'hover:bg-muted',
                  // In range background
                  inRange && 'bg-muted',
                  // Start date
                  start &&
                    'bg-foreground text-background rounded-l-md font-semibold hover:bg-foreground',
                  // End date
                  end &&
                    !start &&
                    'border-foreground text-foreground rounded-r-md border font-semibold',
                  // Today indicator (only if not start/end)
                  today &&
                    !start &&
                    !end &&
                    'font-semibold'
                )}
              >
                {cell.day}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={cn('relative inline-block', className)}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={toggleCalendar}
        className={cn(
          'border-input bg-background hover:bg-muted',
          'inline-flex w-[300px] items-center gap-2 rounded-md border px-4 py-2 text-left text-sm font-normal',
          'focus:ring-ring focus:ring-2 focus:outline-none',
          'transition-colors',
          !displayValue && 'text-muted-foreground'
        )}
      >
        <Calendar className="h-4 w-4" />
        {displayValue || placeholder}
      </button>

      {/* Calendar Popup */}
      {isCalendarOpen && (
        <div
          ref={calendarRef}
          className={cn(
            'absolute top-full left-0 z-50 mt-1',
            'bg-background border-border rounded-lg border shadow-lg'
          )}
          role="dialog"
          aria-label="Choose date range"
        >
          <div className="flex">
            {/* Preset sidebar */}
            {showPresets && (
              <div className="border-border flex w-[200px] shrink-0 flex-col gap-0.5 border-r p-3">
                {finalPresets.map((preset) => (
                  <button
                    key={preset.key}
                    type="button"
                    onClick={() => handlePresetSelect(preset.key)}
                    className={cn(
                      'rounded-md px-3 py-1.5 text-left text-sm transition-colors',
                      'hover:bg-muted',
                      activePreset === preset.key &&
                        'bg-primary text-primary-foreground'
                    )}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            )}

            {/* Calendar panel */}
            <div className="p-4">
              {/* Subtitle */}
              <p className="text-muted-foreground mb-4 text-sm">
                Select a start and end date from the calendar.
              </p>

              <div className="flex gap-8">
                {/* Left month */}
                <div>
                  <div className="mb-3 flex items-center">
                    <button
                      type="button"
                      onClick={goToPrevMonth}
                      className="hover:bg-muted rounded-md p-1 transition-colors"
                      aria-label="Previous month"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <div className="flex-1 text-center text-sm font-medium">
                      {monthNames[leftMonth]} {leftYear}
                    </div>
                  </div>
                  {renderMonthGrid(leftMonth, leftYear)}
                </div>

                {/* Right month */}
                <div>
                  <div className="mb-3 flex items-center">
                    <div className="flex-1 text-center text-sm font-medium">
                      {monthNames[rightMonth]} {rightYear}
                    </div>
                    <button
                      type="button"
                      onClick={goToNextMonth}
                      className="hover:bg-muted rounded-md p-1 transition-colors"
                      aria-label="Next month"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                  {renderMonthGrid(rightMonth, rightYear)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Standalone DateRangeFilter Component (Simpler version)
// ============================================================================

export interface DateRangeFilterProps {
  /** Current date range value */
  value?: DateRange;
  /** Callback when date range changes */
  onChange: (range: DateRange, presetKey?: string) => void;
  /** Custom presets */
  presets?: DateRangePreset[];
  /** Currently active preset */
  activePreset?: string;
  /** Button variant */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  /** Custom className */
  className?: string;
  /** Labels for i18n */
  labels?: DateRangePickerProps['labels'];
}

/**
 * Standalone date range filter dropdown button.
 *
 * @example
 * ```tsx
 * <DateRangeFilter
 *   value={range}
 *   onChange={setRange}
 *   activePreset={preset}
 * />
 * ```
 */
export function DateRangeFilter({
  value: _value,
  onChange,
  presets,
  activePreset,
  variant = 'outline',
  className,
  labels = {},
}: DateRangeFilterProps) {
  const finalPresets = presets || getDefaultPresets(labels);
  const activeLabel = finalPresets.find((p) => p.key === activePreset)?.label;

  const handlePresetSelect = (presetKey: string) => {
    const range = calculateDateRange(presetKey);
    onChange(range, presetKey);
  };

  return (
    <Dropdown
      trigger={
        <Button variant={variant} size="md" className={className}>
          <Calendar className="mr-2 h-4 w-4" />
          {activeLabel || labels.filter || 'Filter by Date'}
          <ChevronDown className="ml-2 h-3 w-3" />
        </Button>
      }
      className="w-56"
    >
      {finalPresets.map((preset) => (
        <DropdownItem
          key={preset.key}
          onClick={() => handlePresetSelect(preset.key)}
          className={cn(
            activePreset === preset.key && 'bg-primary/10 text-primary'
          )}
        >
          {preset.label}
        </DropdownItem>
      ))}
    </Dropdown>
  );
}

export default DateRangePicker;
