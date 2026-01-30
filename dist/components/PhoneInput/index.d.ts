import * as react_jsx_runtime from 'react/jsx-runtime';
import * as React from 'react';
import { InputProps } from '../Input/index.js';
import 'class-variance-authority/types';
import 'class-variance-authority';

interface PhoneInputProps extends Omit<InputProps, 'type' | 'onChange' | 'value'> {
    /** The phone number value (can be formatted or unformatted) */
    value?: string;
    /** Callback fired when the value changes, receives the unformatted value */
    onChange?: (value: string) => void;
    /** Callback fired when the formatted value changes */
    onFormattedChange?: (formattedValue: string) => void;
    /** Whether to validate and show error state for incomplete phone numbers */
    validateOnBlur?: boolean;
}
/**
 * A phone number input that automatically formats to US format: (XXX) XXX-XXXX
 *
 * @example
 * ```tsx
 * const [phone, setPhone] = useState('');
 * <PhoneInput
 *   label="Phone Number"
 *   value={phone}
 *   onChange={setPhone}
 *   validateOnBlur
 * />
 * ```
 */
declare const PhoneInput: React.ForwardRefExoticComponent<PhoneInputProps & React.RefAttributes<HTMLInputElement>>;
type PhoneType = 'cell' | 'landline' | 'home' | 'work' | 'fax';
interface PhoneEntry {
    number: string;
    type: PhoneType;
}
interface PhoneInputGroupProps {
    /** Array of phone entries */
    value: PhoneEntry[];
    /** Callback when phone entries change */
    onChange: (phones: PhoneEntry[]) => void;
    /** Minimum number of phone entries (default: 1) */
    minEntries?: number;
    /** Maximum number of phone entries (default: 5) */
    maxEntries?: number;
    /** Whether the first entry is required */
    required?: boolean;
    /** Whether all inputs are disabled */
    disabled?: boolean;
    /** Validate on blur */
    validateOnBlur?: boolean;
    /** Label for the phone input */
    label?: string;
    /** Labels for type options (for i18n) */
    typeLabels?: Record<PhoneType, string>;
    /** Custom className */
    className?: string;
}
/**
 * A group of phone inputs with type selection and add/remove functionality.
 *
 * @example
 * ```tsx
 * const [phones, setPhones] = useState<PhoneEntry[]>([
 *   { number: '', type: 'cell' }
 * ]);
 *
 * <PhoneInputGroup
 *   value={phones}
 *   onChange={setPhones}
 *   required
 * />
 * ```
 */
declare function PhoneInputGroup({ value, onChange, minEntries, maxEntries, required, disabled, validateOnBlur, label, typeLabels, className, }: PhoneInputGroupProps): react_jsx_runtime.JSX.Element;
declare namespace PhoneInputGroup {
    var displayName: string;
}

export { type PhoneEntry, PhoneInput, PhoneInputGroup, type PhoneInputGroupProps, type PhoneInputProps, type PhoneType };
