import * as react_jsx_runtime from 'react/jsx-runtime';
import * as class_variance_authority_types from 'class-variance-authority/types';
import { VariantProps } from 'class-variance-authority';

interface SelectOption {
    /** Unique value for the option */
    value: string;
    /** Display label for the option */
    label: string;
    /** Whether the option is disabled */
    disabled?: boolean;
    /** Optional group this option belongs to */
    group?: string;
}
interface SelectGroup {
    /** Group label */
    label: string;
    /** Options in this group */
    options: SelectOption[];
}
declare const selectTriggerVariants: (props?: ({
    size?: "sm" | "md" | "lg" | null | undefined;
    hasError?: boolean | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface SelectProps extends VariantProps<typeof selectTriggerVariants> {
    /** Array of options or groups */
    options: (SelectOption | SelectGroup)[];
    /** Controlled value */
    value?: string;
    /** Default value (uncontrolled) */
    defaultValue?: string;
    /** Callback when value changes */
    onValueChange?: (value: string) => void;
    /** Placeholder text */
    placeholder?: string;
    /** Whether the select is disabled */
    disabled?: boolean;
    /** Label for the select */
    label?: string;
    /** Hide the label visually */
    hideLabel?: boolean;
    /** Error message */
    error?: string;
    /** Helper text */
    helperText?: string;
    /** Enable search/filter */
    searchable?: boolean;
    /** Search placeholder */
    searchPlaceholder?: string;
    /** No results text */
    noResultsText?: string;
    /** Additional class name */
    className?: string;
    /** ID for the select */
    id?: string;
}
/**
 * An accessible select/dropdown component with search support.
 *
 * @example
 * ```tsx
 * <Select
 *   label="Country"
 *   placeholder="Select a country"
 *   options={[
 *     { value: 'us', label: 'United States' },
 *     { value: 'ca', label: 'Canada' },
 *     { value: 'uk', label: 'United Kingdom' },
 *   ]}
 *   onValueChange={(value) => console.log(value)}
 * />
 * ```
 */
declare function Select({ options, value: controlledValue, defaultValue, onValueChange, placeholder, disabled, label, hideLabel, error, helperText, size, hasError, searchable, searchPlaceholder, noResultsText, className, id, }: SelectProps): react_jsx_runtime.JSX.Element;
declare namespace Select {
    var displayName: string;
}

export { Select, type SelectGroup, type SelectOption, type SelectProps, selectTriggerVariants };
