import * as class_variance_authority_types from 'class-variance-authority/types';
import * as React from 'react';
import { VariantProps } from 'class-variance-authority';

declare const switchTrackVariants: (props?: ({
    size?: "sm" | "md" | "lg" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
declare const switchThumbVariants: (props?: ({
    size?: "sm" | "md" | "lg" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface SwitchProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'>, VariantProps<typeof switchTrackVariants> {
    /** Controlled checked state */
    checked?: boolean;
    /** Default checked state (uncontrolled) */
    defaultChecked?: boolean;
    /** Callback when checked state changes */
    onCheckedChange?: (checked: boolean) => void;
    /** Label for the switch */
    label?: string;
    /** Description text */
    description?: string;
    /** Position of the label */
    labelPosition?: 'left' | 'right';
    /** ID for the switch */
    id?: string;
}
/**
 * An accessible toggle switch component.
 *
 * @example
 * ```tsx
 * <Switch label="Enable notifications" />
 * <Switch
 *   label="Dark mode"
 *   description="Toggle between light and dark theme"
 * />
 * ```
 */
declare const Switch: React.ForwardRefExoticComponent<SwitchProps & React.RefAttributes<HTMLButtonElement>>;

export { Switch, type SwitchProps, switchThumbVariants, switchTrackVariants };
