import * as React from 'react';
import { InputProps } from '../Input/index.cjs';
import 'class-variance-authority/types';
import 'class-variance-authority';

type DateInputMode = 'default' | 'dob' | 'expiration' | 'past' | 'future';
type DateInputWidth = 'full' | 'fit' | 'fixed';
interface DateInputProps extends Omit<InputProps, 'type' | 'onChange' | 'value'> {
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
declare const DateInput: React.ForwardRefExoticComponent<DateInputProps & React.RefAttributes<HTMLInputElement>>;

export { DateInput, type DateInputMode, type DateInputProps };
