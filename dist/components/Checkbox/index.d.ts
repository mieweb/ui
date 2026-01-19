import * as react_jsx_runtime from 'react/jsx-runtime';
import * as class_variance_authority_types from 'class-variance-authority/types';
import * as React from 'react';
import { VariantProps } from 'class-variance-authority';

declare const checkboxVariants: (props?: ({
    size?: "sm" | "md" | "lg" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'>, VariantProps<typeof checkboxVariants> {
    /** Label for the checkbox */
    label?: string;
    /** Description text below the label */
    description?: string;
    /** Indeterminate state (neither checked nor unchecked) */
    indeterminate?: boolean;
    /** Error message */
    error?: string;
    /** Position of the label */
    labelPosition?: 'left' | 'right';
}
/**
 * An accessible checkbox component with support for indeterminate state.
 *
 * @example
 * ```tsx
 * <Checkbox label="Accept terms and conditions" />
 * <Checkbox label="Newsletter" description="Receive updates about new features" />
 * <Checkbox indeterminate label="Select all" />
 * ```
 */
declare const Checkbox: React.ForwardRefExoticComponent<CheckboxProps & React.RefAttributes<HTMLInputElement>>;
interface CheckboxGroupProps {
    /** Group label */
    label?: string;
    /** Description for the group */
    description?: string;
    /** Error message for the group */
    error?: string;
    /** Orientation of checkboxes */
    orientation?: 'horizontal' | 'vertical';
    /** Children checkboxes */
    children: React.ReactNode;
    /** Additional class name */
    className?: string;
}
/**
 * A container for grouping related checkboxes.
 *
 * @example
 * ```tsx
 * <CheckboxGroup label="Interests" orientation="vertical">
 *   <Checkbox label="Sports" />
 *   <Checkbox label="Music" />
 *   <Checkbox label="Travel" />
 * </CheckboxGroup>
 * ```
 */
declare function CheckboxGroup({ label, description, error, orientation, children, className, }: CheckboxGroupProps): react_jsx_runtime.JSX.Element;
declare namespace CheckboxGroup {
    var displayName: string;
}

export { Checkbox, CheckboxGroup, type CheckboxGroupProps, type CheckboxProps, checkboxVariants };
