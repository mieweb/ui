import * as react_jsx_runtime from 'react/jsx-runtime';
import * as class_variance_authority_types from 'class-variance-authority/types';
import * as React from 'react';
import { VariantProps } from 'class-variance-authority';

declare const spinnerVariants: (props?: ({
    size?: "sm" | "md" | "lg" | "xs" | "xl" | null | undefined;
    variant?: "default" | "white" | "muted" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof spinnerVariants> {
    /** Accessible label for the spinner */
    label?: string;
}
/**
 * A loading spinner component.
 *
 * @example
 * ```tsx
 * <Spinner />
 * <Spinner size="lg" label="Loading data..." />
 * <Spinner variant="white" /> // For use on dark backgrounds
 * ```
 */
declare function Spinner({ className, size, variant, label, ...props }: SpinnerProps): react_jsx_runtime.JSX.Element;
declare namespace Spinner {
    var displayName: string;
}
interface SpinnerWithLabelProps extends SpinnerProps {
    /** Label text to display */
    label: string;
    /** Position of the label */
    labelPosition?: 'top' | 'bottom' | 'left' | 'right';
}
/**
 * A spinner with a visible label.
 *
 * @example
 * ```tsx
 * <SpinnerWithLabel label="Loading..." />
 * <SpinnerWithLabel label="Processing" labelPosition="right" />
 * ```
 */
declare function SpinnerWithLabel({ label, labelPosition, size, variant, className, ...props }: SpinnerWithLabelProps): react_jsx_runtime.JSX.Element;
declare namespace SpinnerWithLabel {
    var displayName: string;
}
interface FullPageSpinnerProps extends SpinnerProps {
    /** Whether to show a backdrop */
    backdrop?: boolean;
    /** Text to display below the spinner */
    text?: string;
}
/**
 * A full-page loading spinner with optional backdrop.
 *
 * @example
 * ```tsx
 * <FullPageSpinner />
 * <FullPageSpinner backdrop text="Loading your data..." />
 * ```
 */
declare function FullPageSpinner({ backdrop, text, size, ...props }: FullPageSpinnerProps): react_jsx_runtime.JSX.Element;
declare namespace FullPageSpinner {
    var displayName: string;
}

export { FullPageSpinner, type FullPageSpinnerProps, Spinner, type SpinnerProps, SpinnerWithLabel, type SpinnerWithLabelProps, spinnerVariants };
