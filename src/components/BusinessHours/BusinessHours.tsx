'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

// ============================================================================
// Types
// ============================================================================

/**
 * Time range for a business day
 */
export interface TimeRange {
  /** Start time in HH:MM format (24-hour) or ISO time string */
  start?: string;
  /** End time in HH:MM format (24-hour) or ISO time string */
  end?: string;
  /** Optional description (e.g., "By appointment only") */
  description?: string;
}

/**
 * Day of the week with hours
 */
export interface DayHours {
  /** Day of week (0-6, where 0 is Sunday) or day name */
  day: number | string;
  /** Array of time ranges (supports multiple shifts per day) */
  hours: TimeRange[];
}

/**
 * Full business hours schedule
 */
export interface BusinessHoursSchedule {
  /** Structured hours by day */
  officeHours?: DayHours[];
  /** Free-form text hours (used when structured hours not available) */
  officeHoursText?: string;
  /** Timezone for displaying hours */
  timezone?: string;
}

/**
 * Day name mapping
 */
const DAY_NAMES: Record<number, string> = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
};

const DAY_NAMES_SHORT: Record<number, string> = {
  0: 'Sun',
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: 'Sat',
};

// ============================================================================
// Utilities
// ============================================================================

/**
 * Get the current day of week (0-6)
 */
function getCurrentDay(): number {
  return new Date().getDay();
}

/**
 * Parse a day identifier to a number (0-6)
 */
function parseDayToNumber(day: number | string): number {
  if (typeof day === 'number') return day;

  const dayLower = day.toLowerCase();
  const dayMap: Record<string, number> = {
    sunday: 0,
    sun: 0,
    monday: 1,
    mon: 1,
    tuesday: 2,
    tue: 2,
    wednesday: 3,
    wed: 3,
    thursday: 4,
    thu: 4,
    friday: 5,
    fri: 5,
    saturday: 6,
    sat: 6,
  };

  return dayMap[dayLower] ?? parseInt(day, 10);
}

/**
 * Parse time string to Date object for comparison
 */
function parseTime(time: string): Date | null {
  if (!time) return null;

  const date = new Date();

  // Handle HH:MM format
  if (/^\d{1,2}:\d{2}$/.test(time)) {
    const [hours, minutes] = time.split(':').map(Number);
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  // Handle ISO date string
  try {
    const parsed = new Date(time);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  } catch {
    // Ignore parse errors
  }

  return null;
}

/**
 * Format time for display (12-hour format)
 */
function formatTime(time: string | undefined, use24Hour = false): string {
  if (!time) return '';

  const parsed = parseTime(time);
  if (!parsed) return time;

  if (use24Hour) {
    return parsed.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  return parsed.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Check if a time range represents 24 hours
 */
function is24Hours(start?: string, end?: string): boolean {
  if (!start || !end) return false;

  const startParsed = parseTime(start);
  const endParsed = parseTime(end);

  if (!startParsed || !endParsed) return false;

  // 00:00 to 23:59 or midnight to midnight
  return (
    (startParsed.getHours() === 0 &&
      startParsed.getMinutes() === 0 &&
      endParsed.getHours() === 23 &&
      endParsed.getMinutes() === 59) ||
    (startParsed.getHours() === 0 && endParsed.getHours() === 0)
  );
}

/**
 * Check if provider is currently open
 */
function isCurrentlyOpen(schedule?: DayHours[]): boolean {
  if (!schedule || schedule.length === 0) return false;

  const now = new Date();
  const currentDay = now.getDay();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const todaySchedule = schedule.find(
    (d) => parseDayToNumber(d.day) === currentDay
  );

  if (
    !todaySchedule ||
    !todaySchedule.hours ||
    todaySchedule.hours.length === 0
  ) {
    return false;
  }

  return todaySchedule.hours.some((range) => {
    const start = parseTime(range.start || '');
    const end = parseTime(range.end || '');

    if (!start) return false;

    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const endMinutes = end ? end.getHours() * 60 + end.getMinutes() : 24 * 60; // Assume end of day if no end time

    return currentTime >= startMinutes && currentTime < endMinutes;
  });
}

/**
 * Get today's hours as a formatted string
 */
function getTodayHours(schedule?: DayHours[], use24Hour = false): string {
  if (!schedule || schedule.length === 0) return 'Hours not available';

  const currentDay = new Date().getDay();
  const todaySchedule = schedule.find(
    (d) => parseDayToNumber(d.day) === currentDay
  );

  if (
    !todaySchedule ||
    !todaySchedule.hours ||
    todaySchedule.hours.length === 0
  ) {
    return 'Closed today';
  }

  const formattedRanges = todaySchedule.hours
    .map((range) => {
      if (is24Hours(range.start, range.end)) {
        return '24 Hours';
      }

      const start = range.start ? formatTime(range.start, use24Hour) : '';
      const end = range.end ? formatTime(range.end, use24Hour) : '';

      if (start && end) return `${start} - ${end}`;
      if (start) return `Opens ${start}`;
      if (end) return `Until ${end}`;
      return 'Hours vary';
    })
    .filter(Boolean);

  return formattedRanges.join(', ') || 'Hours vary';
}

// ============================================================================
// Styles
// ============================================================================

const containerVariants = cva('business-hours', {
  variants: {
    variant: {
      default: '',
      card: 'rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 dark:bg-gray-900 dark:ring-gray-800 overflow-hidden',
      compact: '',
      inline: 'inline-flex items-center gap-2',
    },
    size: {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
});

const dayRowVariants = cva('flex justify-between items-start gap-4 py-2.5', {
  variants: {
    isToday: {
      true: 'bg-primary-50/60 dark:bg-primary-900/20 -mx-3 px-3 rounded-lg',
      false: '',
    },
  },
  defaultVariants: {
    isToday: false,
  },
});

// ============================================================================
// Icons
// ============================================================================

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={cn('h-5 w-5', className)}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z"
        clipRule="evenodd"
      />
    </svg>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

interface OpenStatusBadgeProps {
  isOpen: boolean;
  className?: string;
}

export function OpenStatusBadge({ isOpen, className }: OpenStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-sm font-medium',
        isOpen
          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
        className
      )}
    >
      <span
        className={cn(
          'h-2 w-2 rounded-full',
          isOpen ? 'bg-green-500' : 'bg-red-500'
        )}
        aria-hidden="true"
      />
      {isOpen ? 'Open Now' : 'Closed'}
    </span>
  );
}

interface TimeRangeDisplayProps {
  range: TimeRange;
  use24Hour?: boolean;
}

function TimeRangeDisplay({ range, use24Hour = false }: TimeRangeDisplayProps) {
  if (is24Hours(range.start, range.end)) {
    return <span>24 Hours</span>;
  }

  const start = range.start ? formatTime(range.start, use24Hour) : '';
  const end = range.end ? formatTime(range.end, use24Hour) : '';

  return (
    <span className="hours-range">
      {start && end ? (
        <>
          {start} - {end}
        </>
      ) : start ? (
        <>Opens {start}</>
      ) : end ? (
        <>Until {end}</>
      ) : (
        'Hours vary'
      )}
      {range.description && (
        <span className="mt-0.5 block text-xs text-neutral-500 dark:text-neutral-400">
          {range.description}
        </span>
      )}
    </span>
  );
}

interface DayScheduleRowProps {
  dayHours: DayHours;
  isToday?: boolean;
  highlightToday?: boolean;
  useShortDayNames?: boolean;
  use24Hour?: boolean;
}

function DayScheduleRow({
  dayHours,
  isToday = false,
  highlightToday = true,
  useShortDayNames = false,
  use24Hour = false,
}: DayScheduleRowProps) {
  const dayNum = parseDayToNumber(dayHours.day);
  const dayName = useShortDayNames
    ? DAY_NAMES_SHORT[dayNum]
    : DAY_NAMES[dayNum];
  const hasHours = dayHours.hours && dayHours.hours.length > 0;
  const hasMultipleRanges = hasHours && dayHours.hours.length > 1;

  return (
    <div
      className={cn(dayRowVariants({ isToday: isToday && highlightToday }))}
      data-cy={`provider-day-${dayHours.day}`}
    >
      <span
        className={cn(
          'min-w-[80px] font-medium',
          isToday && highlightToday && 'text-primary-700 dark:text-primary-400'
        )}
      >
        {dayName}
        {isToday && highlightToday && (
          <span className="text-primary-500 ml-1 text-xs">(Today)</span>
        )}
      </span>

      <div
        className={cn('text-right', hasMultipleRanges && 'flex flex-col gap-1')}
        data-cy={`provider-hours-${dayHours.day}`}
      >
        {hasHours ? (
          dayHours.hours.map((range, idx) => (
            <TimeRangeDisplay key={idx} range={range} use24Hour={use24Hour} />
          ))
        ) : (
          <span className="text-neutral-500 dark:text-neutral-400">Closed</span>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Main BusinessHours Component
// ============================================================================

export interface BusinessHoursProps extends VariantProps<
  typeof containerVariants
> {
  /** Business hours schedule data */
  schedule: BusinessHoursSchedule;
  /** Show open/closed status badge */
  showStatus?: boolean;
  /** Highlight the current day */
  highlightToday?: boolean;
  /** Use short day names (Mon, Tue, etc.) */
  useShortDayNames?: boolean;
  /** Use 24-hour time format */
  use24Hour?: boolean;
  /** Show header with icon */
  showHeader?: boolean;
  /** Custom header text */
  headerText?: string;
  /** Additional CSS classes */
  className?: string;
}

export function BusinessHours({
  schedule,
  variant = 'default',
  size = 'md',
  showStatus = true,
  highlightToday = true,
  useShortDayNames = false,
  use24Hour = false,
  showHeader = true,
  headerText = 'Hours',
  className,
}: BusinessHoursProps) {
  const currentDay = getCurrentDay();
  const isOpen = isCurrentlyOpen(schedule.officeHours);

  // If we only have text hours, render those
  if (!schedule.officeHours && schedule.officeHoursText) {
    return (
      <div className={cn(containerVariants({ variant, size }), className)}>
        {showHeader && (
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 font-medium text-neutral-900 dark:text-white">
              <ClockIcon className="text-neutral-500" />
              {headerText}
            </div>
            {showStatus && <OpenStatusBadge isOpen={false} />}
          </div>
        )}
        <pre className="m-0 font-sans whitespace-pre-wrap text-neutral-700 dark:text-neutral-300">
          {schedule.officeHoursText}
        </pre>
      </div>
    );
  }

  // No hours available
  if (!schedule.officeHours || schedule.officeHours.length === 0) {
    return (
      <div className={cn(containerVariants({ variant, size }), className)}>
        {showHeader && (
          <div className="mb-3 flex items-center gap-2 font-medium text-neutral-900 dark:text-white">
            <ClockIcon className="text-neutral-500" />
            {headerText}
          </div>
        )}
        <p className="text-neutral-500 italic dark:text-neutral-400">
          Hours not available
        </p>
      </div>
    );
  }

  return (
    <div className={cn(containerVariants({ variant, size }), className)}>
      {variant === 'card' && (
        <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/80 px-4 py-3 dark:border-gray-800 dark:bg-gray-800/80">
          <div className="flex items-center gap-2 font-medium text-neutral-900 dark:text-white">
            <ClockIcon className="text-neutral-500" />
            {headerText}
          </div>
          {showStatus && <OpenStatusBadge isOpen={isOpen} />}
        </div>
      )}

      {variant !== 'card' && showHeader && (
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium text-neutral-900 dark:text-white">
            <ClockIcon className="text-neutral-500" />
            {headerText}
          </div>
          {showStatus && <OpenStatusBadge isOpen={isOpen} />}
        </div>
      )}

      <div className={cn(variant === 'card' && 'p-4')}>
        <div className="space-y-1 divide-y divide-neutral-100 dark:divide-neutral-800">
          {schedule.officeHours.map((dayHours, idx) => (
            <DayScheduleRow
              key={idx}
              dayHours={dayHours}
              isToday={parseDayToNumber(dayHours.day) === currentDay}
              highlightToday={highlightToday}
              useShortDayNames={useShortDayNames}
              use24Hour={use24Hour}
            />
          ))}
        </div>

        {schedule.timezone && (
          <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
            All times are in {schedule.timezone}
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Compact Hours Display (for cards)
// ============================================================================

export interface CompactHoursProps {
  /** Business hours schedule data */
  schedule: BusinessHoursSchedule;
  /** Show open/closed status badge */
  showStatus?: boolean;
  /** Use 24-hour time format */
  use24Hour?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function CompactHours({
  schedule,
  showStatus = true,
  use24Hour = false,
  className,
}: CompactHoursProps) {
  const isOpen = isCurrentlyOpen(schedule.officeHours);
  const todayHours = getTodayHours(schedule.officeHours, use24Hour);

  return (
    <div className={cn('flex items-center gap-2 text-sm', className)}>
      <ClockIcon className="h-4 w-4 text-neutral-400" />
      <span className="text-neutral-700 dark:text-neutral-300">
        {todayHours}
      </span>
      {showStatus && (
        <OpenStatusBadge isOpen={isOpen} className="px-1.5 py-0 text-xs" />
      )}
    </div>
  );
}

// ============================================================================
// Hours Summary (expandable)
// ============================================================================

export interface HoursSummaryProps {
  /** Business hours schedule data */
  schedule: BusinessHoursSchedule;
  /** Use 24-hour time format */
  use24Hour?: boolean;
  /** Start expanded */
  defaultExpanded?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function HoursSummary({
  schedule,
  use24Hour = false,
  defaultExpanded = false,
  className,
}: HoursSummaryProps) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);
  const isOpen = isCurrentlyOpen(schedule.officeHours);
  const todayHours = getTodayHours(schedule.officeHours, use24Hour);

  const hasStructuredHours =
    schedule.officeHours && schedule.officeHours.length > 0;

  return (
    <div className={cn('hours-summary', className)}>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'flex w-full items-center justify-between rounded-lg p-3',
          'bg-gray-50/80 hover:bg-gray-100/80 dark:bg-gray-800/80 dark:hover:bg-gray-700/80',
          'transition-colors'
        )}
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-3">
          <OpenStatusBadge isOpen={isOpen} />
          <span className="text-neutral-700 dark:text-neutral-300">
            {todayHours}
          </span>
        </div>
        {hasStructuredHours && (
          <svg
            className={cn(
              'h-5 w-5 text-neutral-400 transition-transform',
              isExpanded && 'rotate-180'
            )}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </button>

      {isExpanded && hasStructuredHours && (
        <div className="mt-2 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-gray-100 dark:bg-gray-900 dark:ring-gray-800">
          <BusinessHours
            schedule={schedule}
            showHeader={false}
            showStatus={false}
            use24Hour={use24Hour}
          />
        </div>
      )}
    </div>
  );
}

export default BusinessHours;
