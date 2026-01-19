import * as react_jsx_runtime from 'react/jsx-runtime';
import * as class_variance_authority_types from 'class-variance-authority/types';
import * as React from 'react';
import { VariantProps } from 'class-variance-authority';

declare const radioVariants: (props?: ({
    size?: "sm" | "md" | "lg" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface RadioGroupProps {
    /** Group name (required for native form behavior) */
    name?: string;
    /** Controlled value */
    value?: string;
    /** Default value (uncontrolled) */
    defaultValue?: string;
    /** Callback when value changes */
    onValueChange?: (value: string) => void;
    /** Group label */
    label?: string;
    /** Description for the group */
    description?: string;
    /** Error message */
    error?: string;
    /** Whether all radios are disabled */
    disabled?: boolean;
    /** Size of all radios */
    size?: 'sm' | 'md' | 'lg';
    /** Orientation of radio items */
    orientation?: 'horizontal' | 'vertical';
    /** Children radio items */
    children: React.ReactNode;
    /** Additional class name */
    className?: string;
}
/**
 * A radio group component for selecting one option from a set.
 *
 * @example
 * ```tsx
 * <RadioGroup name="plan" label="Select a plan" onValueChange={setPlan}>
 *   <Radio value="free" label="Free" />
 *   <Radio value="pro" label="Pro" />
 *   <Radio value="enterprise" label="Enterprise" />
 * </RadioGroup>
 * ```
 */
declare function RadioGroup({ name, value: controlledValue, defaultValue, onValueChange, label, description, error, disabled, size, orientation, children, className, }: RadioGroupProps): react_jsx_runtime.JSX.Element;
declare namespace RadioGroup {
    var displayName: string;
}
interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'>, VariantProps<typeof radioVariants> {
    /** Value for this radio option */
    value: string;
    /** Label for the radio */
    label?: string;
    /** Description text below the label */
    description?: string;
    /** Position of the label */
    labelPosition?: 'left' | 'right';
}
/**
 * An individual radio item within a RadioGroup.
 *
 * @example
 * ```tsx
 * <Radio value="option1" label="Option 1" />
 * <Radio value="option2" label="Option 2" description="Additional details" />
 * ```
 */
declare const Radio: React.ForwardRefExoticComponent<RadioProps & React.RefAttributes<HTMLInputElement>>;

export { Radio, RadioGroup, type RadioGroupProps, type RadioProps, radioVariants };
