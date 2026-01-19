import * as class_variance_authority_types from 'class-variance-authority/types';
import * as React from 'react';
import { VariantProps } from 'class-variance-authority';

declare const textareaVariants: (props?: ({
    size?: "sm" | "md" | "lg" | null | undefined;
    hasError?: boolean | null | undefined;
    resize?: "none" | "both" | "horizontal" | "vertical" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface TextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'>, VariantProps<typeof textareaVariants> {
    /** Label for the textarea */
    label?: string;
    /** Whether the label should be visually hidden */
    hideLabel?: boolean;
    /** Error message to display */
    error?: string;
    /** Helper text to display */
    helperText?: string;
    /** Maximum character count */
    maxLength?: number;
    /** Show character count */
    showCount?: boolean;
    /** Auto-resize based on content */
    autoResize?: boolean;
}
/**
 * A multi-line text input component with character count and auto-resize.
 *
 * @example
 * ```tsx
 * <Textarea label="Description" placeholder="Enter a description..." />
 * <Textarea
 *   label="Bio"
 *   maxLength={280}
 *   showCount
 *   helperText="Tell us about yourself"
 * />
 * ```
 */
declare const Textarea: React.ForwardRefExoticComponent<TextareaProps & React.RefAttributes<HTMLTextAreaElement>>;

export { Textarea, type TextareaProps, textareaVariants };
