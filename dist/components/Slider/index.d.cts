import * as class_variance_authority_types from 'class-variance-authority/types';
import * as React from 'react';
import { VariantProps } from 'class-variance-authority';

declare const sliderTrackVariants: (props?: ({
    size?: "sm" | "md" | "lg" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
declare const sliderRangeVariants: (props?: ({
    variant?: "danger" | "default" | "success" | "warning" | "neutral" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
declare const sliderThumbVariants: (props?: ({
    size?: "sm" | "md" | "lg" | null | undefined;
    variant?: "danger" | "default" | "success" | "warning" | "neutral" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface SliderProps extends VariantProps<typeof sliderTrackVariants>, VariantProps<typeof sliderRangeVariants> {
    /** Current value (controlled) */
    value?: number;
    /** Default value (uncontrolled) */
    defaultValue?: number;
    /** Minimum value */
    min?: number;
    /** Maximum value */
    max?: number;
    /** Step increment */
    step?: number;
    /** Callback when value changes */
    onValueChange?: (value: number) => void;
    /** Callback when interaction ends (mouseup / touchend) */
    onValueCommit?: (value: number) => void;
    /** Whether the slider is disabled */
    disabled?: boolean;
    /** Label for the slider */
    label?: string;
    /** Show the current value */
    showValue?: boolean;
    /** Format the displayed value */
    formatValue?: (value: number) => string;
    /** Description text below the label */
    description?: string;
    /** Min label displayed below the track (left) */
    minLabel?: string;
    /** Max label displayed below the track (right) */
    maxLabel?: string;
    /** Additional class name for the root container */
    className?: string;
    /** Additional class name for the track */
    trackClassName?: string;
    /** ID for the underlying input */
    id?: string;
    /** Name for form submission */
    name?: string;
    /** Accessible label for the slider */
    'aria-label'?: string;
    /** ID of the element that labels the slider */
    'aria-labelledby'?: string;
}
/**
 * A fully branded, accessible slider/range input component.
 *
 * Uses brand design tokens for colors, border-radius, and sizing.
 * Supports controlled and uncontrolled usage, labels, descriptions,
 * min/max labels, value display, and multiple color variants.
 *
 * @example
 * ```tsx
 * <Slider label="Volume" min={0} max={100} defaultValue={50} />
 * <Slider
 *   label="Border Radius"
 *   min={0}
 *   max={32}
 *   value={radius}
 *   onValueChange={setRadius}
 *   showValue
 *   formatValue={(v) => `${v}px`}
 *   minLabel="Square"
 *   maxLabel="Rounded"
 * />
 * ```
 */
declare const Slider: React.ForwardRefExoticComponent<SliderProps & React.RefAttributes<HTMLInputElement>>;

export { Slider, type SliderProps, sliderRangeVariants, sliderThumbVariants, sliderTrackVariants };
