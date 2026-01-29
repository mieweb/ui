'use client';

import * as React from 'react';
import { useState, useCallback } from 'react';
import { Button } from '../Button/Button';
import { Input } from '../Input/Input';
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
 */
export function BusinessHoursEditor({
  value,
  onChange,
  disabled = false,
  showDescription = true,
  use24Hour = false,
  weekStartsOn = 0,
  className,
  addHoursLabel = 'Add Hours',
}: BusinessHoursEditorProps) {
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
        if (day.day === sourceDayIndex || !weekdays.includes(day.day)) return day;
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
    <div className={cn('business-hours-editor space-y-4', className)}>
      {orderedDays.map((dayIndex) => {
        const daySchedule = schedule.find((d) => d.day === dayIndex);
        const hours = daySchedule?.hours || [];

        return (
          <div
            key={dayIndex}
            className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0"
          >
            {/* Day Header */}
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {DAY_NAMES[dayIndex]}
              </h4>
              <div className="flex items-center gap-2">
                {hours.length > 0 && (
                  <div className="relative group">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={disabled}
                      className="text-xs"
                    >
                      <CopyIcon className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                    <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                      <button
                        type="button"
                        className="block w-full px-3 py-2 text-xs text-left hover:bg-gray-100 dark:hover:bg-gray-700 whitespace-nowrap"
                        onClick={() => handleCopyToAll(dayIndex)}
                        disabled={disabled}
                      >
                        Copy to all days
                      </button>
                      <button
                        type="button"
                        className="block w-full px-3 py-2 text-xs text-left hover:bg-gray-100 dark:hover:bg-gray-700 whitespace-nowrap"
                        onClick={() => handleCopyToWeekdays(dayIndex)}
                        disabled={disabled}
                      >
                        Copy to weekdays
                      </button>
                    </div>
                  </div>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAddTimeSlot(dayIndex)}
                  disabled={disabled}
                  className="text-xs"
                >
                  <PlusIcon className="h-3 w-3 mr-1" />
                  {addHoursLabel}
                </Button>
              </div>
            </div>

            {/* Time Slots */}
            {hours.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                Closed
              </p>
            ) : (
              <div className="space-y-2">
                {hours.map((slot, slotIndex) => (
                  <div
                    key={slot.id || slotIndex}
                    className="flex items-center gap-2 flex-wrap sm:flex-nowrap"
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

                    <span className="text-gray-400">–</span>

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
                      <div className="flex-1 min-w-[120px]">
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
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
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
    hours:
      day >= 1 && day <= 5
        ? [{ id: generateId(), start, end }]
        : [],
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
