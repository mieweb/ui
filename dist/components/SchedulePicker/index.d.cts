import * as class_variance_authority_types from 'class-variance-authority/types';
import * as React from 'react';
import { VariantProps } from 'class-variance-authority';

declare const dateButtonVariants: (props?: ({
    selected?: boolean | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface DateButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof dateButtonVariants> {
    /** The date to display */
    date: Date;
}
/**
 * A button for selecting a date in the schedule picker.
 */
declare const DateButton: React.ForwardRefExoticComponent<DateButtonProps & React.RefAttributes<HTMLButtonElement>>;
declare const timeButtonVariants: (props?: ({
    selected?: boolean | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface TimeButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof timeButtonVariants> {
    /** The time string to display (e.g., "8:00 AM") */
    time: string;
}
/**
 * A button for selecting a time in the schedule picker.
 */
declare const TimeButton: React.ForwardRefExoticComponent<TimeButtonProps & React.RefAttributes<HTMLButtonElement>>;
declare const radioOptionVariants: (props?: ({
    selected?: boolean | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface RadioOptionProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'>, VariantProps<typeof radioOptionVariants> {
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
declare const RadioOption: React.ForwardRefExoticComponent<RadioOptionProps & React.RefAttributes<HTMLDivElement>>;
interface DatePickerProps extends React.HTMLAttributes<HTMLDivElement> {
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
declare const DatePicker: React.ForwardRefExoticComponent<DatePickerProps & React.RefAttributes<HTMLDivElement>>;
interface TimePickerProps extends React.HTMLAttributes<HTMLDivElement> {
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
declare const TimePicker: React.ForwardRefExoticComponent<TimePickerProps & React.RefAttributes<HTMLDivElement>>;
interface SchedulePickerProps extends React.HTMLAttributes<HTMLDivElement> {
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
declare const SchedulePicker: React.ForwardRefExoticComponent<SchedulePickerProps & React.RefAttributes<HTMLDivElement>>;

export { DateButton, type DateButtonProps, DatePicker, type DatePickerProps, RadioOption, type RadioOptionProps, SchedulePicker, type SchedulePickerProps, TimeButton, type TimeButtonProps, TimePicker, type TimePickerProps, dateButtonVariants, radioOptionVariants, timeButtonVariants };
