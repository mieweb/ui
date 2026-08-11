'use client';

import * as React from 'react';
import { useCallback } from 'react';
import { Button } from '../Button/Button';
import { Input } from '../Input/Input';
import { DateInput } from '../DateInput';
import { Dropdown, DropdownItem } from '../Dropdown';
import { cn } from '../../utils/cn';

// ============================================================================
// Types
// ============================================================================

export interface TimeSlot {
  id?: string;
  start: string;
  end: string;
  description?: string;
}

export interface DaySchedule {
  day: number; // 0-6 (Sunday to Saturday)
  hours: TimeSlot[];
}

export interface BusinessHoursEditorProps {
  /** Current schedule data */
  value: DaySchedule[];
  /** Callback when schedule changes */
  onChange: (schedule: DaySchedule[]) => void;
  /**
   * Editing layout:
   * - 'days' (default): one section per weekday, add hours per day
   * - 'rules': compact rows where one time range applies to multiple days
   *   (e.g. Mon/Wed/Fri 8:00–11:00). Emits the same DaySchedule[] shape.
   */
  variant?: 'days' | 'rules';
  /** Whether the editor is disabled */
  disabled?: boolean;
  /** Whether to show description field for each time slot */
  showDescription?: boolean;
  /** Use 24-hour format */
  use24Hour?: boolean;
  /** Starting day of week (0 = Sunday, 1 = Monday) */
  weekStartsOn?: 0 | 1;
  /** Additional CSS classes */
  className?: string;
  /** Label for add hours button */
  addHoursLabel?: string;
}

// ============================================================================
// Constants
// ============================================================================

const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ============================================================================
// Utilities
// ============================================================================

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function getOrderedDays(weekStartsOn: 0 | 1): number[] {
  if (weekStartsOn === 1) {
    return [1, 2, 3, 4, 5, 6, 0]; // Monday first
  }
  return [0, 1, 2, 3, 4, 5, 6]; // Sunday first
}

function ensureAllDays(schedule: DaySchedule[]): DaySchedule[] {
  const result: DaySchedule[] = [];
  for (let day = 0; day < 7; day++) {
    const existing = schedule.find((d) => d.day === day);
    result.push(existing || { day, hours: [] });
  }
  return result;
}

// ============================================================================
// Component
// ============================================================================

/**
 * BusinessHoursEditor provides an editable interface for managing business hours.
 * Supports multiple time slots per day with optional descriptions.
 *
 * The 'rules' variant edits the same schedule as grouped rows — each row is a
 * set of day toggles plus one time range — which is faster when several days
 * share the same hours.
 */
export function BusinessHoursEditor({
  variant = 'days',
  ...props
}: BusinessHoursEditorProps) {
  if (variant === 'rules') {
    return <BusinessHoursRulesEditor {...props} />;
  }
  return <BusinessHoursDaysEditor {...props} />;
}

type BusinessHoursVariantProps = Omit<BusinessHoursEditorProps, 'variant'>;

function BusinessHoursDaysEditor({
  value,
  onChange,
  disabled = false,
  showDescription = true,
  use24Hour: _use24Hour = false,
  weekStartsOn = 0,
  className,
  addHoursLabel = 'Add Hours',
}: BusinessHoursVariantProps) {
  // Ensure all 7 days are present
  const schedule = ensureAllDays(value);
  const orderedDays = getOrderedDays(weekStartsOn);

  const handleAddTimeSlot = useCallback(
    (dayIndex: number) => {
      const newSchedule = [...schedule];
      const daySchedule = newSchedule.find((d) => d.day === dayIndex);

      if (daySchedule) {
        daySchedule.hours = [
          ...daySchedule.hours,
          { id: generateId(), start: '09:00', end: '17:00', description: '' },
        ];
        onChange(newSchedule);
      }
    },
    [schedule, onChange]
  );

  const handleRemoveTimeSlot = useCallback(
    (dayIndex: number, slotIndex: number) => {
      const newSchedule = [...schedule];
      const daySchedule = newSchedule.find((d) => d.day === dayIndex);

      if (daySchedule) {
        daySchedule.hours = daySchedule.hours.filter((_, i) => i !== slotIndex);
        onChange(newSchedule);
      }
    },
    [schedule, onChange]
  );

  const handleTimeChange = useCallback(
    (
      dayIndex: number,
      slotIndex: number,
      field: 'start' | 'end' | 'description',
      value: string
    ) => {
      const newSchedule = [...schedule];
      const daySchedule = newSchedule.find((d) => d.day === dayIndex);

      if (daySchedule && daySchedule.hours[slotIndex]) {
        daySchedule.hours[slotIndex] = {
          ...daySchedule.hours[slotIndex],
          [field]: value,
        };
        onChange(newSchedule);
      }
    },
    [schedule, onChange]
  );

  const handleCopyToAll = useCallback(
    (sourceDayIndex: number) => {
      const sourceDay = schedule.find((d) => d.day === sourceDayIndex);
      if (!sourceDay || sourceDay.hours.length === 0) return;

      const newSchedule = schedule.map((day) => {
        if (day.day === sourceDayIndex) return day;
        return {
          ...day,
          hours: sourceDay.hours.map((slot) => ({
            ...slot,
            id: generateId(),
          })),
        };
      });

      onChange(newSchedule);
    },
    [schedule, onChange]
  );

  const handleCopyToWeekdays = useCallback(
    (sourceDayIndex: number) => {
      const sourceDay = schedule.find((d) => d.day === sourceDayIndex);
      if (!sourceDay || sourceDay.hours.length === 0) return;

      const weekdays = [1, 2, 3, 4, 5]; // Monday to Friday

      const newSchedule = schedule.map((day) => {
        if (day.day === sourceDayIndex || !weekdays.includes(day.day))
          return day;
        return {
          ...day,
          hours: sourceDay.hours.map((slot) => ({
            ...slot,
            id: generateId(),
          })),
        };
      });

      onChange(newSchedule);
    },
    [schedule, onChange]
  );

  return (
    <div
      data-slot="business-hours-editor"
      className={cn('business-hours-editor space-y-4', className)}
    >
      {orderedDays.map((dayIndex) => {
        const daySchedule = schedule.find((d) => d.day === dayIndex);
        const hours = daySchedule?.hours || [];

        return (
          <div
            key={dayIndex}
            data-slot="business-hours-day"
            className="border-b border-gray-200 pb-4 last:border-0 dark:border-gray-700"
          >
            {/* Day Header */}
            <div
              data-slot="business-hours-day-header"
              className="mb-3 flex items-center justify-between"
            >
              <h4
                data-slot="business-hours-day-name"
                className="text-sm font-medium text-gray-900 dark:text-gray-100"
              >
                {DAY_NAMES[dayIndex]}
              </h4>
              <div className="flex items-center gap-2">
                {hours.length > 0 && (
                  <Dropdown
                    placement="bottom-end"
                    trigger={
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={disabled}
                        className="text-xs"
                      >
                        <CopyIcon className="mr-1 h-3 w-3" />
                        Copy
                      </Button>
                    }
                  >
                    <DropdownItem
                      onClick={() => handleCopyToAll(dayIndex)}
                      disabled={disabled}
                    >
                      Copy to all days
                    </DropdownItem>
                    <DropdownItem
                      onClick={() => handleCopyToWeekdays(dayIndex)}
                      disabled={disabled}
                    >
                      Copy to weekdays
                    </DropdownItem>
                  </Dropdown>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAddTimeSlot(dayIndex)}
                  disabled={disabled}
                  className="text-xs"
                >
                  <PlusIcon className="mr-1 h-3 w-3" />
                  {addHoursLabel}
                </Button>
              </div>
            </div>

            {/* Time Slots */}
            {hours.length === 0 ? (
              <p
                data-slot="business-hours-closed"
                className="text-muted-foreground text-sm italic"
              >
                Closed
              </p>
            ) : (
              <div data-slot="business-hours-slots" className="space-y-2">
                {hours.map((slot, slotIndex) => (
                  <div
                    key={slot.id || slotIndex}
                    data-slot="business-hours-slot-row"
                    className="flex flex-wrap items-center gap-2 sm:flex-nowrap"
                  >
                    {/* Start Time */}
                    <div className="w-24 sm:w-28">
                      <Input
                        type="time"
                        value={slot.start}
                        onChange={(e) =>
                          handleTimeChange(
                            dayIndex,
                            slotIndex,
                            'start',
                            e.target.value
                          )
                        }
                        disabled={disabled}
                        className="text-sm"
                        aria-label={`${DAY_NAMES_SHORT[dayIndex]} start time`}
                      />
                    </div>

                    <span
                      data-slot="business-hours-separator"
                      className="text-gray-400"
                    >
                      –
                    </span>

                    {/* End Time */}
                    <div className="w-24 sm:w-28">
                      <Input
                        type="time"
                        value={slot.end}
                        onChange={(e) =>
                          handleTimeChange(
                            dayIndex,
                            slotIndex,
                            'end',
                            e.target.value
                          )
                        }
                        disabled={disabled}
                        className="text-sm"
                        aria-label={`${DAY_NAMES_SHORT[dayIndex]} end time`}
                      />
                    </div>

                    {/* Description */}
                    {showDescription && (
                      <div className="min-w-[120px] flex-1">
                        <Input
                          type="text"
                          value={slot.description || ''}
                          onChange={(e) =>
                            handleTimeChange(
                              dayIndex,
                              slotIndex,
                              'description',
                              e.target.value
                            )
                          }
                          placeholder="Description (optional)"
                          disabled={disabled}
                          className="text-sm"
                          aria-label={`${DAY_NAMES_SHORT[dayIndex]} description`}
                        />
                      </div>
                    )}

                    {/* Remove Button */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveTimeSlot(dayIndex, slotIndex)}
                      disabled={disabled}
                      className="text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                      aria-label={`Remove ${DAY_NAMES_SHORT[dayIndex]} time slot`}
                    >
                      <XIcon className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// Rules Variant
// ============================================================================

interface HoursRule {
  id: string;
  days: number[];
  start: string;
  end: string;
  description?: string;
}

function ruleSignature(slot: TimeSlot): string {
  return `${slot.start}\u0000${slot.end}\u0000${slot.description ?? ''}`;
}

/** Collapse a schedule into rules: days sharing an identical time range group into one row. */
export function scheduleToRules(schedule: DaySchedule[]): HoursRule[] {
  const rulesBySignature = new Map<string, HoursRule[]>();
  const orderedRules: HoursRule[] = [];

  for (const day of schedule) {
    for (const slot of day.hours) {
      const signature = ruleSignature(slot);
      const candidates = rulesBySignature.get(signature) ?? [];
      // Duplicate identical slots on the same day each get their own rule so
      // the schedule round-trips without dropping slots.
      let rule = candidates.find((r) => !r.days.includes(day.day));
      if (!rule) {
        rule = {
          id: generateId(),
          days: [],
          start: slot.start,
          end: slot.end,
          description: slot.description,
        };
        candidates.push(rule);
        rulesBySignature.set(signature, candidates);
        orderedRules.push(rule);
      }
      rule.days.push(day.day);
    }
  }

  return orderedRules;
}

/** Expand rules into the canonical DaySchedule[] shape (all 7 days present). */
export function rulesToSchedule(rules: HoursRule[]): DaySchedule[] {
  return Array.from({ length: 7 }, (_, day) => ({
    day,
    hours: rules
      .filter((rule) => rule.days.includes(day))
      .map((rule) => ({
        id: generateId(),
        start: rule.start,
        end: rule.end,
        ...(rule.description ? { description: rule.description } : {}),
      })),
  }));
}

/** Normalized, id-free representation used to detect external value changes. */
function normalizeSchedule(schedule: DaySchedule[]): string {
  return JSON.stringify(
    ensureAllDays(schedule).map((day) => ({
      day: day.day,
      hours: day.hours.map((slot) => ({
        start: slot.start,
        end: slot.end,
        description: slot.description ?? '',
      })),
    }))
  );
}

function BusinessHoursRulesEditor({
  value,
  onChange,
  disabled = false,
  showDescription = true,
  use24Hour = false,
  weekStartsOn = 0,
  className,
  addHoursLabel = 'Add Hours',
}: BusinessHoursVariantProps) {
  // Rules are internal state so draft rows (no days selected yet) survive, and
  // rows keep their identity while editing. External value changes re-derive.
  const [rules, setRules] = React.useState<HoursRule[]>(() =>
    scheduleToRules(value)
  );
  const timeFormat = use24Hour ? '24-hour' : '12-hour';
  const lastScheduleRef = React.useRef(normalizeSchedule(value));

  React.useEffect(() => {
    const incoming = normalizeSchedule(value);
    if (incoming !== lastScheduleRef.current) {
      lastScheduleRef.current = incoming;
      setRules(scheduleToRules(value));
    }
  }, [value]);

  const emit = useCallback(
    (nextRules: HoursRule[]) => {
      setRules(nextRules);
      const schedule = rulesToSchedule(nextRules);
      const normalized = normalizeSchedule(schedule);
      if (normalized !== lastScheduleRef.current) {
        lastScheduleRef.current = normalized;
        onChange(schedule);
      }
    },
    [onChange]
  );

  const handleAddRule = useCallback(() => {
    emit([
      ...rules,
      { id: generateId(), days: [], start: '09:00', end: '17:00' },
    ]);
  }, [emit, rules]);

  const handleRemoveRule = useCallback(
    (ruleId: string) => {
      emit(rules.filter((rule) => rule.id !== ruleId));
    },
    [emit, rules]
  );

  const handleToggleDay = useCallback(
    (ruleId: string, day: number) => {
      emit(
        rules.map((rule) =>
          rule.id === ruleId
            ? {
                ...rule,
                days: rule.days.includes(day)
                  ? rule.days.filter((d) => d !== day)
                  : [...rule.days, day],
              }
            : rule
        )
      );
    },
    [emit, rules]
  );

  const handleRuleChange = useCallback(
    (ruleId: string, field: 'start' | 'end' | 'description', value: string) => {
      emit(
        rules.map((rule) =>
          rule.id === ruleId ? { ...rule, [field]: value } : rule
        )
      );
    },
    [emit, rules]
  );

  const orderedDays = getOrderedDays(weekStartsOn);

  return (
    <div
      data-slot="business-hours-editor"
      className={cn('business-hours-editor space-y-3', className)}
    >
      {rules.map((rule) => (
        <fieldset
          key={rule.id}
          data-slot="business-hours-rule"
          className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-3 last:border-0 dark:border-gray-700"
        >
          <legend className="sr-only">Availability rule</legend>

          {/* Day toggles */}
          <div
            data-slot="business-hours-rule-days"
            className="flex shrink-0 gap-1"
          >
            {orderedDays.map((day) => {
              const selected = rule.days.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  aria-pressed={selected}
                  aria-label={DAY_NAMES[day]}
                  disabled={disabled}
                  onClick={() => handleToggleDay(rule.id, day)}
                  className={cn(
                    'inline-flex h-7 w-9 items-center justify-center rounded-full border text-xs font-medium transition-colors',
                    'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                    selected
                      ? 'border-primary-800 bg-primary-800 text-white'
                      : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  {DAY_NAMES_SHORT[day]}
                </button>
              );
            })}
          </div>

          {/* Start Time */}
          <div className="w-32 sm:w-36">
            <DateInput
              inputType="time"
              timeFormat={timeFormat}
              minuteStep={15}
              value={rule.start}
              onChange={(time) => handleRuleChange(rule.id, 'start', time)}
              disabled={disabled}
              size="sm"
              className="text-sm"
              label="Start time"
              hideLabel
            />
          </div>

          <span data-slot="business-hours-separator" className="text-gray-400">
            –
          </span>

          {/* End Time */}
          <div className="w-32 sm:w-36">
            <DateInput
              inputType="time"
              timeFormat={timeFormat}
              minuteStep={15}
              value={rule.end}
              onChange={(time) => handleRuleChange(rule.id, 'end', time)}
              disabled={disabled}
              size="sm"
              className="text-sm"
              label="End time"
              hideLabel
            />
          </div>

          {/* Description */}
          {showDescription && (
            <div className="min-w-[120px] flex-1">
              <Input
                type="text"
                value={rule.description || ''}
                onChange={(e) =>
                  handleRuleChange(rule.id, 'description', e.target.value)
                }
                placeholder="Description (optional)"
                disabled={disabled}
                className="text-sm"
                aria-label="Description"
              />
            </div>
          )}

          {/* Remove Button */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleRemoveRule(rule.id)}
            disabled={disabled}
            className="text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
            aria-label="Remove availability rule"
          >
            <XIcon className="h-4 w-4" />
          </Button>
        </fieldset>
      ))}

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleAddRule}
        disabled={disabled}
        className="text-xs"
      >
        <PlusIcon className="me-1 h-3 w-3" />
        {addHoursLabel}
      </Button>
    </div>
  );
}

// ============================================================================
// Preset Schedule Helpers
// ============================================================================

export function createDefaultSchedule(): DaySchedule[] {
  return [
    { day: 0, hours: [] }, // Sunday - Closed
    { day: 1, hours: [{ id: generateId(), start: '09:00', end: '17:00' }] },
    { day: 2, hours: [{ id: generateId(), start: '09:00', end: '17:00' }] },
    { day: 3, hours: [{ id: generateId(), start: '09:00', end: '17:00' }] },
    { day: 4, hours: [{ id: generateId(), start: '09:00', end: '17:00' }] },
    { day: 5, hours: [{ id: generateId(), start: '09:00', end: '17:00' }] },
    { day: 6, hours: [] }, // Saturday - Closed
  ];
}

export function create24HourSchedule(): DaySchedule[] {
  return Array.from({ length: 7 }, (_, day) => ({
    day,
    hours: [{ id: generateId(), start: '00:00', end: '23:59' }],
  }));
}

export function createWeekdaySchedule(
  start = '09:00',
  end = '17:00'
): DaySchedule[] {
  return Array.from({ length: 7 }, (_, day) => ({
    day,
    hours: day >= 1 && day <= 5 ? [{ id: generateId(), start, end }] : [],
  }));
}

// ============================================================================
// Icons
// ============================================================================

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z" />
      <path d="M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.439A1.5 1.5 0 008.378 6H4.5z" />
    </svg>
  );
}

export default BusinessHoursEditor;
