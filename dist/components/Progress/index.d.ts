import * as react_jsx_runtime from 'react/jsx-runtime';
import * as class_variance_authority_types from 'class-variance-authority/types';
import { VariantProps } from 'class-variance-authority';

declare const progressBarTrackVariants: (props?: ({
    size?: "sm" | "md" | "lg" | "xl" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
declare const progressBarFillVariants: (props?: ({
    variant?: "default" | "danger" | "success" | "warning" | null | undefined;
    animated?: boolean | null | undefined;
    striped?: boolean | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface ProgressProps extends VariantProps<typeof progressBarTrackVariants>, VariantProps<typeof progressBarFillVariants> {
    /** Current progress value (0-100) */
    value: number;
    /** Maximum value (default: 100) */
    max?: number;
    /** Label for the progress bar */
    label?: string;
    /** Show the percentage value */
    showValue?: boolean;
    /** Format the displayed value */
    formatValue?: (value: number, max: number) => string;
    /** Additional class name */
    className?: string;
    /** Whether the progress is indeterminate */
    indeterminate?: boolean;
}
/**
 * A progress bar component for showing completion status.
 *
 * @example
 * ```tsx
 * <Progress value={60} />
 * <Progress value={75} showValue label="Upload progress" />
 * <Progress value={30} variant="success" striped />
 * ```
 */
declare function Progress({ value, max, label, showValue, formatValue, size, variant, animated, striped, className, indeterminate, }: ProgressProps): react_jsx_runtime.JSX.Element;
declare namespace Progress {
    var displayName: string;
}
declare const circularProgressVariants: (props?: ({
    size?: "sm" | "md" | "lg" | "xl" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface CircularProgressProps extends VariantProps<typeof circularProgressVariants> {
    /** Current progress value (0-100) */
    value: number;
    /** Maximum value (default: 100) */
    max?: number;
    /** Color variant */
    variant?: 'default' | 'success' | 'warning' | 'danger';
    /** Stroke width */
    strokeWidth?: number;
    /** Show the percentage value in the center */
    showValue?: boolean;
    /** Whether the progress is indeterminate */
    indeterminate?: boolean;
    /** Additional class name */
    className?: string;
}
/**
 * A circular progress indicator component.
 *
 * @example
 * ```tsx
 * <CircularProgress value={75} showValue />
 * <CircularProgress value={50} variant="success" size="lg" />
 * ```
 */
declare function CircularProgress({ value, max, variant, size, strokeWidth, showValue, indeterminate, className, }: CircularProgressProps): react_jsx_runtime.JSX.Element;
declare namespace CircularProgress {
    var displayName: string;
}

export { CircularProgress, type CircularProgressProps, Progress, type ProgressProps, circularProgressVariants, progressBarFillVariants, progressBarTrackVariants };
