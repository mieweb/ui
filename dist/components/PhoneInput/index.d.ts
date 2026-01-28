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

export { PhoneInput, type PhoneInputProps };
