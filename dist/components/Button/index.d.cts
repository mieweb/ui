import * as class_variance_authority_types from 'class-variance-authority/types';
import * as React from 'react';
import { VariantProps } from 'class-variance-authority';

declare const buttonVariants: (props?: ({
    variant?: "link" | "primary" | "danger" | "secondary" | "ghost" | "outline" | null | undefined;
    size?: "sm" | "md" | "lg" | "icon" | null | undefined;
    fullWidth?: boolean | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
    /** Optional icon to render before the button text */
    leftIcon?: React.ReactNode;
    /** Optional icon to render after the button text */
    rightIcon?: React.ReactNode;
    /** Shows a loading spinner and disables the button */
    isLoading?: boolean;
    /** Accessible label for the loading state */
    loadingText?: string;
}
/**
 * A versatile button component with multiple variants and sizes.
 *
 * @example
 * ```tsx
 * <Button variant="primary" size="md">Click me</Button>
 * <Button variant="danger" leftIcon={<TrashIcon />}>Delete</Button>
 * <Button variant="ghost" isLoading loadingText="Saving...">Save</Button>
 * ```
 */
declare const Button: React.ForwardRefExoticComponent<ButtonProps & React.RefAttributes<HTMLButtonElement>>;

export { Button, type ButtonProps, buttonVariants };
