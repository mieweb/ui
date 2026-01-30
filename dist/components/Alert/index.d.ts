import * as class_variance_authority_types from 'class-variance-authority/types';
import * as React from 'react';
import { VariantProps } from 'class-variance-authority';

declare const alertVariants: (props?: ({
    variant?: "danger" | "default" | "success" | "info" | "warning" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface AlertProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {
    /** Icon to display in the alert */
    icon?: React.ReactElement | null;
    /** Whether the alert can be dismissed */
    dismissible?: boolean;
    /** Callback when the alert is dismissed */
    onDismiss?: () => void;
    /** Accessible label for the dismiss button */
    dismissLabel?: string;
}
/**
 * An alert component for displaying important messages.
 *
 * @example
 * ```tsx
 * <Alert variant="success">
 *   <AlertTitle>Success!</AlertTitle>
 *   <AlertDescription>Your changes have been saved.</AlertDescription>
 * </Alert>
 * ```
 */
declare const Alert: React.ForwardRefExoticComponent<AlertProps & React.RefAttributes<HTMLDivElement>>;
/**
 * Title for an Alert component.
 */
declare const AlertTitle: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLHeadingElement> & React.RefAttributes<HTMLHeadingElement>>;
/**
 * Description text for an Alert component.
 */
declare const AlertDescription: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLParagraphElement> & React.RefAttributes<HTMLParagraphElement>>;

export { Alert, AlertDescription, type AlertProps, AlertTitle, alertVariants };
