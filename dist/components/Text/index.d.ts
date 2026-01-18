import * as class_variance_authority_types from 'class-variance-authority/types';
import * as React from 'react';
import { VariantProps } from 'class-variance-authority';

declare const textVariants: (props?: ({
    variant?: "primary" | "default" | "muted" | "destructive" | "success" | "warning" | null | undefined;
    size?: "sm" | "lg" | "xl" | "xs" | "base" | "2xl" | "3xl" | null | undefined;
    weight?: "bold" | "normal" | "medium" | "semibold" | null | undefined;
    align?: "left" | "center" | "right" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
type TextElement = 'p' | 'span' | 'div' | 'label' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
interface TextProps extends React.HTMLAttributes<HTMLElement>, VariantProps<typeof textVariants> {
    /** HTML element to render as */
    as?: TextElement;
    /** Truncate text with ellipsis */
    truncate?: boolean;
}
/**
 * A flexible text component for consistent typography.
 *
 * @example
 * ```tsx
 * <Text variant="muted" size="sm">Helper text</Text>
 * <Text as="h1" size="3xl" weight="bold">Page Title</Text>
 * <Text variant="destructive">Error message</Text>
 * ```
 */
declare const Text: React.ForwardRefExoticComponent<TextProps & React.RefAttributes<HTMLElement>>;
/**
 * Small muted text, useful for helper text and descriptions.
 * This is a convenience component equivalent to <Text variant="muted" size="sm">
 */
declare const SmallMuted: React.ForwardRefExoticComponent<Omit<TextProps, "variant" | "size"> & React.RefAttributes<HTMLElement>>;

export { SmallMuted, Text, type TextProps, textVariants };
